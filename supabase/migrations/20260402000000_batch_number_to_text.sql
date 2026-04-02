-- Change batch_number from integer to varchar(5) to support alphanumeric lot codes

-- Drop view that depends on production_logs.batch_number
drop view if exists daily_stock;

-- Drop unique constraint on batch_number
alter table production_logs drop constraint if exists production_logs_batch_number_key;

-- production_logs: integer -> varchar(5)
alter table production_logs
  alter column batch_number type varchar(5) using batch_number::varchar(5);

-- stock_exit_lots: integer -> varchar(5)
alter table stock_exit_lots
  alter column batch_number type varchar(5) using batch_number::varchar(5);

-- Re-add unique constraint
alter table production_logs
  add constraint production_logs_batch_number_key unique (batch_number);

-- Recreate daily_stock view (same logic, now with text batch_number)
create or replace view daily_stock as
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

-- Update create_sale_exit to cast as text instead of integer
create or replace function create_sale_exit(
  p_production_id uuid,
  p_quantity numeric,
  p_reason text,
  p_kitchen_user_id uuid,
  p_lots jsonb -- array of {batch_number: text, quantity: numeric}
)
returns uuid
language plpgsql
as $$
declare
  v_exit_id uuid;
  v_lot jsonb;
begin
  insert into stock_exits (production_id, quantity, reason, kitchen_user_id)
  values (p_production_id, p_quantity, p_reason, p_kitchen_user_id)
  returning id into v_exit_id;

  for v_lot in select * from jsonb_array_elements(p_lots)
  loop
    insert into stock_exit_lots (exit_id, batch_number, quantity, kitchen_user_id)
    values (
      v_exit_id,
      (v_lot->>'batch_number')::varchar(5),
      (v_lot->>'quantity')::numeric,
      p_kitchen_user_id
    );
  end loop;

  return v_exit_id;
end;
$$;

-- Update nextval_batch_number to return zero-padded text
drop function if exists nextval_batch_number();
create function nextval_batch_number()
returns text
language sql
security definer
as $$
  select nextval('batch_number_seq')::text;
$$;
