-- Add exit_reason to stock_exits for tracking WHY merma happened
-- Values: caducitat, mal_estat, error_produccio, accident, altre (nullable, only relevant for merma)

ALTER TABLE stock_exits ADD COLUMN exit_reason text;

-- Update create_sale_exit to accept exit_reason
CREATE OR REPLACE FUNCTION create_sale_exit(
  p_production_id uuid,
  p_quantity numeric,
  p_reason text,
  p_kitchen_user_id uuid,
  p_lots jsonb,
  p_exit_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_exit_id uuid;
  v_lot jsonb;
BEGIN
  INSERT INTO stock_exits (production_id, quantity, reason, kitchen_user_id, exit_reason)
  VALUES (p_production_id, p_quantity, p_reason, p_kitchen_user_id, p_exit_reason)
  RETURNING id INTO v_exit_id;

  FOR v_lot IN SELECT * FROM jsonb_array_elements(p_lots)
  LOOP
    INSERT INTO stock_exit_lots (exit_id, batch_number, quantity, kitchen_user_id)
    VALUES (
      v_exit_id,
      (v_lot->>'batch_number')::integer,
      (v_lot->>'quantity')::numeric,
      p_kitchen_user_id
    );
  END LOOP;

  RETURN v_exit_id;
END;
$$;
