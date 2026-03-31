-- Multi-tenancy: add kitchen_user_id to all data tables
-- Each kitchen_user represents a restaurant; all data is isolated per user.

-- ============================================================
-- 1. Add kitchen_user_id columns
-- ============================================================

alter table productions
  add column kitchen_user_id uuid references kitchen_users(id);

alter table production_logs
  add column kitchen_user_id uuid references kitchen_users(id);

alter table stock_exits
  add column kitchen_user_id uuid references kitchen_users(id);

alter table stock_exit_lots
  add column kitchen_user_id uuid references kitchen_users(id);

-- ============================================================
-- 2. Backfill existing rows with first active user (safe for dev)
-- ============================================================

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from kitchen_users where active = true order by created_at asc limit 1;
  if v_user_id is not null then
    update productions set kitchen_user_id = v_user_id where kitchen_user_id is null;
    update production_logs set kitchen_user_id = v_user_id where kitchen_user_id is null;
    update stock_exits set kitchen_user_id = v_user_id where kitchen_user_id is null;
    update stock_exit_lots set kitchen_user_id = v_user_id where kitchen_user_id is null;
  end if;
end $$;

-- ============================================================
-- 3. Set NOT NULL after backfill
-- ============================================================

alter table productions alter column kitchen_user_id set not null;
alter table production_logs alter column kitchen_user_id set not null;
alter table stock_exits alter column kitchen_user_id set not null;
alter table stock_exit_lots alter column kitchen_user_id set not null;

-- ============================================================
-- 4. Recreate daily_stock view with kitchen_user_id
-- ============================================================

drop view if exists daily_stock;
create view daily_stock as
select
  p.id as production_id,
  p.name,
  p.unit,
  p.shelf_life_hours,
  p.station,
  p.active,
  p.kitchen_user_id,
  coalesce(lot_stock.total, 0) as stock_total,
  case when coalesce(lot_stock.total, 0) > 0
    then (
      select min(pl2.expires_at)
      from production_logs pl2
      where pl2.production_id = p.id
        and pl2.expires_at > now()
        and pl2.batch_number is not null
        and pl2.quantity - coalesce(
          (select sum(sel2.quantity) from stock_exit_lots sel2 where sel2.batch_number = pl2.batch_number), 0
        ) > 0
    )
    else null
  end as next_expiry
from productions p
left join lateral (
  select sum(greatest(
    pl.quantity - coalesce(
      (select sum(sel.quantity) from stock_exit_lots sel where sel.batch_number = pl.batch_number), 0
    ), 0
  )) as total
  from production_logs pl
  where pl.production_id = p.id
    and (pl.expires_at is null or pl.expires_at > now())
    and pl.batch_number is not null
) lot_stock on true
where p.active = true;

-- ============================================================
-- 5. Recreate functions with p_user_id parameter
-- ============================================================

CREATE OR REPLACE FUNCTION get_consumption_summary(
  date_from date DEFAULT CURRENT_DATE - 6,
  date_to date DEFAULT CURRENT_DATE,
  p_user_id uuid DEFAULT null
)
RETURNS TABLE (
  production_id uuid,
  name text,
  unit text,
  station text,
  total_venda bigint,
  total_merma bigint,
  total_produit bigint,
  dias_con_actividad bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id AS production_id,
    p.name,
    p.unit,
    p.station::text,
    COALESCE(SUM(se.quantity) FILTER (WHERE se.reason = 'venta'),  0) AS total_venda,
    COALESCE(SUM(se.quantity) FILTER (WHERE se.reason = 'merma'),  0) AS total_merma,
    COALESCE((
      SELECT SUM(pl.quantity)
      FROM production_logs pl
      WHERE pl.production_id = p.id
        AND pl.logged_at >= date_from
        AND pl.logged_at < (date_to + interval '1 day')::date
        AND (p_user_id IS NULL OR pl.kitchen_user_id = p_user_id)
    ), 0) AS total_produit,
    COUNT(DISTINCT se.logged_at::date) AS dias_con_actividad
  FROM productions p
  JOIN stock_exits se
    ON se.production_id = p.id
   AND se.logged_at >= date_from
   AND se.logged_at < (date_to + interval '1 day')::date
   AND (p_user_id IS NULL OR se.kitchen_user_id = p_user_id)
  WHERE (p_user_id IS NULL OR p.kitchen_user_id = p_user_id)
  GROUP BY p.id, p.name, p.unit, p.station;
$$;

CREATE OR REPLACE FUNCTION get_idle_productions(
  date_from date DEFAULT CURRENT_DATE - 6,
  date_to date DEFAULT CURRENT_DATE,
  p_user_id uuid DEFAULT null
)
RETURNS TABLE (
  production_id uuid,
  name text,
  unit text,
  station text,
  total_produit bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id AS production_id,
    p.name,
    p.unit,
    p.station::text,
    COALESCE(SUM(pl.quantity), 0) AS total_produit
  FROM productions p
  JOIN production_logs pl
    ON pl.production_id = p.id
   AND pl.logged_at >= date_from
   AND pl.logged_at < (date_to + interval '1 day')::date
   AND (p_user_id IS NULL OR pl.kitchen_user_id = p_user_id)
  WHERE p.active = true
    AND (p_user_id IS NULL OR p.kitchen_user_id = p_user_id)
    AND NOT EXISTS (
      SELECT 1 FROM stock_exits se
      WHERE se.production_id = p.id
        AND se.logged_at >= date_from
        AND se.logged_at < (date_to + interval '1 day')::date
        AND (p_user_id IS NULL OR se.kitchen_user_id = p_user_id)
    )
  GROUP BY p.id, p.name, p.unit, p.station;
$$;
