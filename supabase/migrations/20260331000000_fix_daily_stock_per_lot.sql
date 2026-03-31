-- Fix daily_stock: calculate stock per-lot instead of globally
-- Old view subtracted ALL exits from non-expired production total,
-- which double-counted exits from expired lots against valid stock.
-- New view: for each non-expired lot, compute (produced - exited for that batch),
-- then sum per production.

create or replace view daily_stock as
select
  p.id as production_id,
  p.name,
  p.unit,
  p.shelf_life_hours,
  p.station,
  p.active,
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
