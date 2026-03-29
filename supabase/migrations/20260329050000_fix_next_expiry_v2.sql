-- Fix next_expiry: return null when stock_total <= 0
-- Also clamp stock_total to 0 (never negative)

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
      (select sum(se.quantity)
       from stock_exits se
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
      (select sum(se2.quantity)
       from stock_exits se2
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
