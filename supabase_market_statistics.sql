-- Tabel hasil statistik ringan untuk halaman Statistik Pasaran.
-- Jalankan sekali di Supabase SQL Editor.

create table if not exists market_statistics (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,

  group_key text not null,
  group_label text not null,
  mode text not null,
  param int not null,
  position text not null default 'all',
  target_pair text not null default 'all',
  stat_key text not null unique,

  wins_15 int not null,
  wins_last_5 int not null,
  max_loss_streak int not null,
  sample_size int not null default 15,
  score numeric not null default 0,

  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists market_statistics_group_score_idx
on market_statistics (group_key, is_active, score desc, updated_at desc);

create index if not exists market_statistics_market_idx
on market_statistics (market_id, is_active);

create index if not exists market_statistics_filter_idx
on market_statistics (mode, param, position, target_pair, is_active);
