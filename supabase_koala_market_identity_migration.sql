-- Reconcile KoalaVictoria identities from KOALA_<source_id> to canonical
-- market names. This version is safe when both legacy and canonical rows
-- already exist because the new scraper has run before the migration.
--
-- Run in Supabase SQL Editor while Auto Scraper is not running.
-- The transaction copies legacy dependent data into canonical identities with
-- conflict deduplication, removes legacy identities, and rebuilds statistics
-- on the next workflow run.

begin;

lock table public.markets in share row exclusive mode;

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

-- Ensure every canonical market exists. When both identities already exist,
-- keep the longer history payload and the newest updated_at value.
insert into public.markets as target (
  id,
  name,
  history_data,
  "order",
  updated_at
)
select
  mapping.new_id,
  mapping.new_id,
  legacy.history_data,
  legacy."order",
  legacy.updated_at
from public.markets legacy
join koala_identity_map mapping
  on mapping.old_id = legacy.id
on conflict (id) do update
set
  name = excluded.name,
  history_data = case
    when nullif(btrim(target.history_data), '') is null
      then excluded.history_data
    when nullif(btrim(excluded.history_data), '') is null
      then target.history_data
    when cardinality(
      regexp_split_to_array(btrim(excluded.history_data), '\s+')
    ) > cardinality(
      regexp_split_to_array(btrim(target.history_data), '\s+')
    )
      then excluded.history_data
    else target.history_data
  end,
  "order" = coalesce(target."order", excluded."order"),
  updated_at = greatest(target.updated_at, excluded.updated_at);

-- Copy all legacy rows from every public base table containing market_id.
-- Primary-key columns are omitted so their defaults generate new keys.
-- Unique rows already produced under the canonical identity are retained;
-- ON CONFLICT DO NOTHING deduplicates overlapping snapshots/evaluations.
do $migration$
declare
  target_table record;
  insert_columns text;
  select_expressions text;
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
      and columns.table_name not in ('markets', 'market_statistics')
    order by columns.table_name
  loop
    select
      string_agg(
        format('%I', columns.column_name),
        ', ' order by columns.ordinal_position
      ),
      string_agg(
        case
          when columns.column_name = 'market_id'
            then 'mapping.new_id'
          when columns.column_name = 'market_name'
            then 'mapping.new_id'
          else format('legacy.%I', columns.column_name)
        end,
        ', ' order by columns.ordinal_position
      )
    into insert_columns, select_expressions
    from information_schema.columns columns
    where columns.table_schema = 'public'
      and columns.table_name = target_table.table_name
      and columns.is_generated = 'NEVER'
      and columns.is_identity = 'NO'
      and not exists (
        select 1
        from pg_constraint primary_key
        join pg_class relation
          on relation.oid = primary_key.conrelid
        join pg_namespace namespace
          on namespace.oid = relation.relnamespace
        join unnest(primary_key.conkey) as key_column(attnum)
          on true
        join pg_attribute attribute
          on attribute.attrelid = relation.oid
         and attribute.attnum = key_column.attnum
        where primary_key.contype = 'p'
          and namespace.nspname = 'public'
          and relation.relname = target_table.table_name
          and attribute.attname = columns.column_name
      );

    if insert_columns is null or select_expressions is null then
      raise exception
        'Cannot build Koala reconciliation statement for public.%',
        target_table.table_name;
    end if;

    execute format(
      'insert into public.%1$I (%2$s)
       select %3$s
       from public.%1$I legacy
       join koala_identity_map mapping
         on legacy.market_id = mapping.old_id
       on conflict do nothing',
      target_table.table_name,
      insert_columns,
      select_expressions
    );

    execute format(
      'delete from public.%I legacy
       using koala_identity_map mapping
       where legacy.market_id = mapping.old_id',
      target_table.table_name
    );
  end loop;
end
$migration$;

-- market_statistics is derived and stat_key embeds market_id. Delete both old
-- and canonical Koala rows so Rebuild market statistics creates clean rows.
do $statistics$
begin
  if to_regclass('public.market_statistics') is not null then
    delete from public.market_statistics statistics
    using koala_identity_map mapping
    where statistics.market_id in (mapping.old_id, mapping.new_id);
  end if;
end
$statistics$;

-- Remove duplicate legacy market rows after dependent data is reconciled.
delete from public.markets legacy
using koala_identity_map mapping
where legacy.id = mapping.old_id;

-- Enforce the repository-wide convention: markets.id = markets.name.
update public.markets market
set name = market.id
where market.id in (
  select new_id
  from koala_identity_map
);

-- Abort and roll back if any legacy identity remains in markets or a dependent
-- public table. This makes partial migrations visible instead of silent.
do $validation$
declare
  target_table record;
  remaining_count bigint;
begin
  select count(*)
  into remaining_count
  from public.markets market
  join koala_identity_map mapping
    on market.id = mapping.old_id;

  if remaining_count > 0 then
    raise exception
      'Koala reconciliation incomplete: % legacy market rows remain',
      remaining_count;
  end if;

  for target_table in
    select distinct columns.table_name
    from information_schema.columns columns
    join information_schema.tables tables
      on tables.table_schema = columns.table_schema
     and tables.table_name = columns.table_name
    where columns.table_schema = 'public'
      and columns.column_name = 'market_id'
      and tables.table_type = 'BASE TABLE'
    order by columns.table_name
  loop
    execute format(
      'select count(*)
       from public.%I target_row
       join koala_identity_map mapping
         on target_row.market_id = mapping.old_id',
      target_table.table_name
    ) into remaining_count;

    if remaining_count > 0 then
      raise exception
        'Koala reconciliation incomplete in public.%: % legacy rows remain',
        target_table.table_name,
        remaining_count;
    end if;
  end loop;

  select count(*)
  into remaining_count
  from public.markets market
  join koala_identity_map mapping
    on market.id = mapping.new_id
  where market.name is distinct from market.id;

  if remaining_count > 0 then
    raise exception
      'Koala reconciliation incomplete: % canonical names do not match IDs',
      remaining_count;
  end if;
end
$validation$;

commit;

analyze public.markets;
