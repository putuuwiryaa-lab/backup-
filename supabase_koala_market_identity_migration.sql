-- Migrate KoalaVictoria identities from KOALA_<source_id> to the canonical
-- market name. After this migration, markets.id = markets.name, matching the
-- identity convention used by the other production scrapers.
--
-- Run once in Supabase SQL Editor while Auto Scraper is not running.
-- This script preserves market history, snapshots, and evaluations. Existing
-- market_statistics rows for Koala are deleted and rebuilt by the workflow.

begin;

create temporary table koala_identity_map (
  old_id text primary key,
  new_id text not null unique
) on commit drop;

insert into koala_identity_map (old_id, new_id) values
  ('KOALA_20', 'Swedia'),
  ('KOALA_26', 'GERMANY'),
  ('KOALA_34', 'MEXICO'),
  ('KOALA_41', 'GREENDLAND'),
  ('KOALA_44', 'NEVADAMID'),
  ('KOALA_58', 'SWITZERLAND'),
  ('KOALA_62', 'NEVADAEVE'),
  ('KOALA_64', 'LISBOA'),
  ('KOALA_66', 'NEVADANIGHT'),
  ('KOALA_67', 'POIPET'),
  ('KOALA_68', 'Kingkong 4D 1'),
  ('KOALA_70', 'TASMANIA'),
  ('KOALA_71', 'THAILAND'),
  ('KOALA_74', 'NEVADAMOR'),
  ('KOALA_75', 'MIAMI'),
  ('KOALA_76', 'Beijing'),
  ('KOALA_77', 'TAIPEI'),
  ('KOALA_81', 'Kingkong 4D 2'),
  ('KOALA_82', 'BRUNEI');

-- Stop instead of merging ambiguous rows when both the old and new identity
-- already exist in markets.
do $$
declare
  conflict_list text;
begin
  select string_agg(m.old_id || ' -> ' || m.new_id, ', ' order by m.old_id)
  into conflict_list
  from koala_identity_map m
  where exists (
    select 1 from public.markets old_row where old_row.id = m.old_id
  )
  and exists (
    select 1 from public.markets new_row where new_row.id = m.new_id
  );

  if conflict_list is not null then
    raise exception 'Koala identity conflict in markets: %', conflict_list;
  end if;
end
$$;

-- Create the canonical market rows first so migrations also work when a
-- foreign key references public.markets(id).
insert into public.markets (
  id,
  name,
  history_data,
  "order",
  updated_at
)
select
  mapping.new_id,
  mapping.new_id,
  source_row.history_data,
  source_row."order",
  source_row.updated_at
from public.markets source_row
join koala_identity_map mapping
  on mapping.old_id = source_row.id
on conflict (id) do nothing;

-- Update every public base table that stores market_id. This covers current
-- prediction, analysis, evaluation, and rekap tables without assuming that
-- every optional table exists in the installation.
do $$
declare
  target_table record;
  conflict_count bigint;
  has_market_name boolean;
begin
  for target_table in
    select distinct columns.table_name
    from information_schema.columns columns
    join information_schema.tables tables
      on tables.table_schema = columns.table_schema
     and tables.table_name = columns.table_name
    where columns.table_schema = 'public'
      and columns.column_name = 'market_id'
      and tables.table_type = 'BASE TABLE'
      and columns.table_name <> 'market_statistics'
    order by columns.table_name
  loop
    execute format(
      'select count(*)
         from public.%I target_row
         join koala_identity_map mapping
           on target_row.market_id = mapping.new_id
        where exists (
          select 1
            from public.%I source_row
           where source_row.market_id = mapping.old_id
        )',
      target_table.table_name,
      target_table.table_name
    ) into conflict_count;

    if conflict_count > 0 then
      raise exception
        'Koala identity conflict in table public.%: % canonical rows already exist',
        target_table.table_name,
        conflict_count;
    end if;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target_table.table_name
        and column_name = 'market_name'
    ) into has_market_name;

    if has_market_name then
      execute format(
        'update public.%I target_row
            set market_id = mapping.new_id,
                market_name = mapping.new_id
           from koala_identity_map mapping
          where target_row.market_id = mapping.old_id',
        target_table.table_name
      );
    else
      execute format(
        'update public.%I target_row
            set market_id = mapping.new_id
           from koala_identity_map mapping
          where target_row.market_id = mapping.old_id',
        target_table.table_name
      );
    end if;
  end loop;
end
$$;

-- stat_key embeds market_id. Deleting these derived rows is safer than
-- rewriting them; Rebuild market statistics will recreate them from migrated
-- analysis_evaluations.
do $$
begin
  if to_regclass('public.market_statistics') is not null then
    delete from public.market_statistics statistics
    using koala_identity_map mapping
    where statistics.market_id in (mapping.old_id, mapping.new_id);
  end if;
end
$$;

-- Remove legacy market rows after all dependent rows use canonical IDs.
delete from public.markets legacy
using koala_identity_map mapping
where legacy.id = mapping.old_id;

-- Enforce the same identity convention used by all other scrapers.
update public.markets market
set name = market.id
where market.id in (
  select new_id from koala_identity_map
);

commit;

analyze public.markets;
