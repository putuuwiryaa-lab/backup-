-- Synchronize an existing Supabase database with the current evaluator and
-- statistics code. Run manually in Supabase SQL Editor.
--
-- This migration is idempotent for the constraint and index names maintained
-- by this repository. It does not delete evaluation or statistics data.

begin;

-- ============================================================
-- ANALYSIS SNAPSHOTS
-- ============================================================

alter table public.analysis_snapshots
  add column if not exists target_pair text,
  add column if not exists analysis_scope text,
  add column if not exists created_at timestamptz not null default now();

update public.analysis_snapshots
set target_pair = 'belakang'
where target_pair is null;

update public.analysis_snapshots
set analysis_scope = 'default'
where analysis_scope is null;

alter table public.analysis_snapshots
  alter column target_pair set default 'belakang',
  alter column target_pair set not null,
  alter column analysis_scope set default 'default',
  alter column analysis_scope set not null;

alter table public.analysis_snapshots
  drop constraint if exists analysis_snapshots_mode_check;

alter table public.analysis_snapshots
  add constraint analysis_snapshots_mode_check
  check (
    mode in ('ai', 'ai_parity', 'ai_size', 'bbfs', 'mati', 'jumlah', 'shio')
  );

alter table public.analysis_snapshots
  drop constraint if exists analysis_snapshots_market_id_mode_param_key,
  drop constraint if exists analysis_snapshots_identity_key;

alter table public.analysis_snapshots
  add constraint analysis_snapshots_identity_key unique (
    market_id,
    mode,
    param,
    target_pair,
    analysis_scope
  );

-- ============================================================
-- ANALYSIS EVALUATIONS
-- ============================================================

alter table public.analysis_evaluations
  add column if not exists position text,
  add column if not exists target_pair text,
  add column if not exists analysis_scope text,
  add column if not exists status text;

update public.analysis_evaluations
set position = 'all'
where position is null;

update public.analysis_evaluations
set target_pair = 'belakang'
where target_pair is null;

update public.analysis_evaluations
set analysis_scope = 'default'
where analysis_scope is null;

alter table public.analysis_evaluations
  alter column position set default 'all',
  alter column position set not null,
  alter column target_pair set default 'belakang',
  alter column target_pair set not null,
  alter column analysis_scope set default 'default',
  alter column analysis_scope set not null;

alter table public.analysis_evaluations
  drop constraint if exists analysis_evaluations_mode_check;

alter table public.analysis_evaluations
  add constraint analysis_evaluations_mode_check
  check (
    mode in ('ai', 'ai_parity', 'ai_size', 'bbfs', 'mati', 'jumlah', 'shio')
  );

alter table public.analysis_evaluations
  drop constraint if exists analysis_evaluations_market_id_mode_param_from_result_new_result_key,
  drop constraint if exists analysis_evaluations_identity_key;

alter table public.analysis_evaluations
  add constraint analysis_evaluations_identity_key unique (
    market_id,
    mode,
    param,
    position,
    target_pair,
    analysis_scope,
    from_result,
    new_result
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

-- ============================================================
-- MARKET STATISTICS
-- ============================================================

alter table public.market_statistics
  add column if not exists group_label text,
  add column if not exists analysis_scope text,
  add column if not exists max_loss_streak int,
  add column if not exists sample_size int,
  add column if not exists previous_rank int,
  add column if not exists rank_movement int,
  add column if not exists latest_is_hit boolean,
  add column if not exists latest_status text;

update public.market_statistics
set analysis_scope = 'default'
where analysis_scope is null;

update public.market_statistics
set sample_size = 15
where sample_size is null;

update public.market_statistics
set max_loss_streak = 0
where max_loss_streak is null;

update public.market_statistics
set group_label = coalesce(group_label, group_key, mode, 'Statistik')
where group_label is null;

alter table public.market_statistics
  alter column group_label set not null,
  alter column analysis_scope set default 'default',
  alter column analysis_scope set not null,
  alter column max_loss_streak set not null,
  alter column sample_size set default 15,
  alter column sample_size set not null;

drop index if exists public.market_statistics_group_score_idx;
drop index if exists public.market_statistics_market_idx;
drop index if exists public.market_statistics_filter_idx;

create index market_statistics_group_score_idx
on public.market_statistics (
  group_key,
  is_active,
  score desc,
  updated_at desc
);

create index market_statistics_market_idx
on public.market_statistics (
  market_id,
  is_active,
  score desc
);

create index market_statistics_filter_idx
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

commit;

analyze public.analysis_snapshots;
analyze public.analysis_evaluations;
analyze public.market_statistics;
