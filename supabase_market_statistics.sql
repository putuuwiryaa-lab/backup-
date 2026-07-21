-- Canonical market statistics schema for a fresh Supabase installation.
-- For an existing database, run supabase_backup_schema_sync.sql instead.

create table if not exists public.market_statistics (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,

  group_key text not null,
  group_label text not null,
  mode text not null,
  param int not null,
  position text not null default 'all',
  target_pair text not null default 'all',
  analysis_scope text not null default 'default',
  stat_key text not null unique,

  wins_15 int not null,
  wins_last_5 int not null,
  max_loss_streak int not null,
  sample_size int not null default 15,
  score numeric not null default 0,

  previous_rank int,
  rank_movement int,
  latest_is_hit boolean,
  latest_status text,

  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists market_statistics_group_score_idx
on public.market_statistics (
  group_key,
  is_active,
  score desc,
  updated_at desc
);

create index if not exists market_statistics_market_idx
on public.market_statistics (
  market_id,
  is_active,
  score desc
);

create index if not exists market_statistics_filter_idx
on public.market_statistics (
  group_key,
  mode,
  param,
  position,
  target_pair,
  analysis_scope,
  is_active,
  score desc
);
