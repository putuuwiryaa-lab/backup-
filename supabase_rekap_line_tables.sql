-- Tabel untuk snapshot dan evaluasi otomatis Menu Rekap Analisa Angka.
-- Jalankan sekali di Supabase SQL Editor.

create table if not exists rekap_line_snapshots (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,
  mode text not null check (mode in ('invest', 'top')),

  base_result text not null,
  lines jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now(),

  unique (market_id, mode)
);

create table if not exists rekap_line_evaluations (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,
  mode text not null check (mode in ('invest', 'top')),

  from_result text not null,
  new_result text not null,
  is_hit boolean not null default false,
  line_count int not null default 0,

  created_at timestamptz not null default now(),
  evaluated_at timestamptz not null default now(),

  unique (market_id, mode, from_result, new_result)
);

create index if not exists rekap_line_snapshots_market_mode_idx
on rekap_line_snapshots (market_id, mode);

create index if not exists rekap_line_evaluations_market_mode_time_idx
on rekap_line_evaluations (market_id, mode, evaluated_at desc);
