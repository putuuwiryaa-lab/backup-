-- Tabel evaluasi otomatis untuk AI, BBFS, OFF 4D, Jumlah Mati, dan Shio Mati.
-- Jalankan sekali di Supabase SQL Editor.

create table if not exists analysis_snapshots (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,

  mode text not null check (mode in ('ai', 'mati', 'jumlah', 'shio')),
  param int not null,

  base_result text not null,
  result jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now(),

  unique (market_id, mode, param)
);

create table if not exists analysis_evaluations (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,

  mode text not null check (mode in ('ai', 'mati', 'jumlah', 'shio')),
  param int not null,

  from_result text not null,
  new_result text not null,

  is_hit boolean not null default false,

  target text,
  result_snapshot jsonb not null default '{}'::jsonb,
  detail jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  evaluated_at timestamptz not null default now(),

  unique (market_id, mode, param, from_result, new_result)
);

create index if not exists analysis_snapshots_market_mode_param_idx
on analysis_snapshots (market_id, mode, param);

create index if not exists analysis_evaluations_market_mode_param_time_idx
on analysis_evaluations (market_id, mode, param, evaluated_at desc);
