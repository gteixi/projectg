-- Atomic sale exit creation: inserts stock_exit + stock_exit_lots in one transaction
-- Prevents orphaned stock_exits if lot insertion fails

create or replace function create_sale_exit(
  p_production_id uuid,
  p_quantity numeric,
  p_reason text,
  p_kitchen_user_id uuid,
  p_lots jsonb -- array of {batch_number: int, quantity: numeric}
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
      (v_lot->>'batch_number')::integer,
      (v_lot->>'quantity')::numeric,
      p_kitchen_user_id
    );
  end loop;

  return v_exit_id;
end;
$$;
