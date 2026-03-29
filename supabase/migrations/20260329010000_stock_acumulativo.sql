-- Stock acumulativo: elimina el filtro por dia actual
-- El stock ahora persiste entre dias

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
       and (pl.expires_at is null or pl.expires_at > now())),
    0
  ) - coalesce(
    (select sum(se.quantity)
     from stock_exits se
     where se.production_id = p.id),
    0
  ) as stock_total,
  (select min(pl.expires_at)
   from production_logs pl
   where pl.production_id = p.id
     and pl.expires_at > now()
  ) as next_expiry
from productions p
where p.active = true;
