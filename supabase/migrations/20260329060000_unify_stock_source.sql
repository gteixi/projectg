-- Unify stock calculation: use stock_exit_lots as single source of truth
-- Both daily_stock view and app code now use the same per-lot exit data

create or replace view daily_stock as
select
  p.id as production_id,
  p.name,
  p.unit,
  p.shelf_life_hours,
  p.station,
  p.active,
  greatest(
    coalesce(
      (select sum(pl.quantity)
       from production_logs pl
       where pl.production_id = p.id
         and (pl.expires_at is null or pl.expires_at > now())),
      0
    ) - coalesce(
      (select sum(sel.quantity)
       from stock_exit_lots sel
       inner join stock_exits se on se.id = sel.exit_id
       where se.production_id = p.id),
      0
    ),
    0
  ) as stock_total,
  case when
    coalesce(
      (select sum(pl2.quantity)
       from production_logs pl2
       where pl2.production_id = p.id
         and (pl2.expires_at is null or pl2.expires_at > now())),
      0
    ) - coalesce(
      (select sum(sel2.quantity)
       from stock_exit_lots sel2
       inner join stock_exits se2 on se2.id = sel2.exit_id
       where se2.production_id = p.id),
      0
    ) > 0
  then
    (select min(pl3.expires_at)
     from production_logs pl3
     where pl3.production_id = p.id
       and pl3.expires_at > now())
  else null
  end as next_expiry
from productions p
where p.active = true;
