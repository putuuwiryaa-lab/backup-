-- Canonical evaluator schema for a fresh Supabase installation.
-- For an existing database, run supabase_backup_schema_sync.sql instead.

create table if not exists public.analysis_snapshots (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,

  mode text not null check (
    mode in ('ai', 'ai_parity', 'ai_size', 'bbfs', 'mati', 'jumlah', 'shio')
  ),
  param int not null,
  target_pair text not null default 'belakang',
  analysis_scope text not null default 'default',

  base_result text not null,
  result jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint analysis_snapshots_identity_key unique (
    market_id,
    mode,
    param,
    target_pair,
    analysis_scope
  )
);

create table if not exists public.analysis_evaluations (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,

  mode text not null check (
    mode in ('ai', 'ai_parity', 'ai_size', 'bbfs', 'mati', 'jumlah', 'shio')
  ),
  param int not null,
  position text not null default 'all',
  target_pair text not null default 'belakang',
  analysis_scope text not null default 'default',

  from_result text not null,
  new_result text not null,

  is_hit boolean not null default false,
  status text,
  target text,
  result_snapshot jsonb not null default '{}'::jsonb,
  detail jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  evaluated_at timestamptz not null default now(),

  constraint analysis_evaluations_identity_key unique (
    market_id,
    mode,
    param,
    position,
    target_pair,
    analysis_scope,
    from_result,
    new_result
  )
);

create index if not exists analysis_evaluations_lookup_idx
on public.analysis_evaluations (
  market_id,
  mode,
  param,
  position,
  target_pair,
  analysis_scope,
  evaluated_at desc
);

create index if not exists analysis_evaluations_eval_cursor_idx
on public.analysis_evaluations (evaluated_at desc, id desc);
