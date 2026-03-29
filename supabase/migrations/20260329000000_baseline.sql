-- Baseline migration: schema as of 2026-03-29
-- Matches the remote Supabase database exactly

-- ============================================================
-- SEQUENCES
-- ============================================================

create sequence if not exists batch_number_seq;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists productions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,
  shelf_life_hours integer,
  station text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists production_logs (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references productions(id),
  quantity numeric not null,
  expires_at timestamptz,
  logged_at timestamptz not null default now(),
  batch_number integer default nextval('batch_number_seq')
);

create table if not exists stock_exits (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references productions(id),
  quantity numeric not null,
  reason text not null,
  logged_at timestamptz not null default now()
);

create table if not exists stock_exit_lots (
  id uuid primary key default gen_random_uuid(),
  exit_id uuid not null references stock_exits(id),
  batch_number text not null,
  quantity numeric not null
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_logs_batch_number
  on production_logs(batch_number)
  where batch_number is not null;

-- ============================================================
-- VIEW: daily_stock
-- ============================================================
-- Stock del dia actual por produccion activa:
--   stock_total = logs de hoy (no caducados) - exits de hoy
--   next_expiry = proxima caducidad no expirada de logs de hoy

create or replace view daily_stock as
select
  p.id as production_id,
  p.name,
  p.unit,
  p.shelf_life_hours,
  p.station,
  p.active,
  coalesce(
    (select sum(pl.quantity)
     from production_logs pl
     where pl.production_id = p.id
       and pl.logged_at >= current_date
       and pl.logged_at < current_date + interval '1 day'
       and (pl.expires_at is null or pl.expires_at > now())),
    0
  ) - coalesce(
    (select sum(se.quantity)
     from stock_exits se
     where se.production_id = p.id
       and se.logged_at >= current_date
       and se.logged_at < current_date + interval '1 day'),
    0
  ) as stock_total,
  (select min(pl.expires_at)
   from production_logs pl
   where pl.production_id = p.id
     and pl.logged_at >= current_date
     and pl.logged_at < current_date + interval '1 day'
     and pl.expires_at > now()
  ) as next_expiry
from productions p
where p.active = true;
