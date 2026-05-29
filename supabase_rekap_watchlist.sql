-- Tabel hasil olahan backend untuk Pantauan Rekap.
-- Jalankan sekali di Supabase SQL Editor.

create table if not exists rekap_watchlist (
  id uuid primary key default gen_random_uuid(),

  market_id text not null,
  market_name text,

  focus text not null default 'belakang',
  focus_label text not null default '2D BELAKANG',

  filter_key text not null unique,
  filter_label text not null,
  filters jsonb not null default '{}'::jsonb,

  line_count int not null,
  wins_15 int not null,
  wins_last_5 int not null,
  max_loss_streak int not null,
  score numeric not null default 0,

  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists rekap_watchlist_active_score_idx
on rekap_watchlist (is_active, score desc, updated_at desc);

create index if not exists rekap_watchlist_market_idx
on rekap_watchlist (market_id, is_active);

create index if not exists rekap_watchlist_line_idx
on rekap_watchlist (line_count);
