-- Migration: fix_rls_and_indexes
-- Fixes broken RLS tautology policies, adds indexes, hardens create_sale_exit,
-- adds login_attempts and ai_usage tables, and constrains frozen_remaining_hours.

-- ============================================================================
-- 1. Fix RLS tautology policies
--    The previous "tenant_isolation" policies compared kitchen_user_id to itself
--    (always true). Replace with session-variable-based isolation.
-- ============================================================================

DROP POLICY IF EXISTS "tenant_isolation" ON productions;
DROP POLICY IF EXISTS "tenant_isolation" ON production_logs;
DROP POLICY IF EXISTS "tenant_isolation" ON stock_exits;
DROP POLICY IF EXISTS "tenant_isolation" ON stock_exit_lots;
DROP POLICY IF EXISTS "tenant_isolation" ON lot_moves;

CREATE POLICY "tenant_isolation" ON productions
  FOR SELECT USING (
    kitchen_user_id::text = current_setting('app.kitchen_user_id', true)
  );
CREATE POLICY "tenant_isolation" ON production_logs
  FOR SELECT USING (
    kitchen_user_id::text = current_setting('app.kitchen_user_id', true)
  );
CREATE POLICY "tenant_isolation" ON stock_exits
  FOR SELECT USING (
    kitchen_user_id::text = current_setting('app.kitchen_user_id', true)
  );
CREATE POLICY "tenant_isolation" ON stock_exit_lots
  FOR SELECT USING (
    kitchen_user_id::text = current_setting('app.kitchen_user_id', true)
  );
CREATE POLICY "tenant_isolation" ON lot_moves
  FOR SELECT USING (
    kitchen_user_id::text = current_setting('app.kitchen_user_id', true)
  );

-- ============================================================================
-- 2. Composite index on stock_exit_lots (batch_number, kitchen_user_id)
-- ============================================================================

DROP INDEX IF EXISTS idx_stock_exit_lots_batch_number;
CREATE INDEX idx_stock_exit_lots_batch_kitchen ON stock_exit_lots(batch_number, kitchen_user_id);

-- ============================================================================
-- 3. Fix create_sale_exit to validate available stock per lot
-- ============================================================================

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
  v_batch text;
  v_lot_qty numeric;
  v_produced numeric;
  v_already_exited numeric;
  v_available numeric;
BEGIN
  -- Validate all batch_numbers belong to the given production and tenant,
  -- and that requested quantity doesn't exceed available stock per lot
  FOR v_lot IN SELECT * FROM jsonb_array_elements(p_lots)
  LOOP
    v_batch := (v_lot->>'batch_number')::varchar(5);
    v_lot_qty := (v_lot->>'quantity')::numeric;

    SELECT pl.quantity INTO v_produced
    FROM production_logs pl
    WHERE pl.batch_number = v_batch
      AND pl.production_id = p_production_id
      AND pl.kitchen_user_id = p_kitchen_user_id;

    IF v_produced IS NULL THEN
      RAISE EXCEPTION 'Lot % does not belong to production %', v_batch, p_production_id;
    END IF;

    SELECT COALESCE(SUM(sel.quantity), 0) INTO v_already_exited
    FROM stock_exit_lots sel
    WHERE sel.batch_number = v_batch
      AND sel.kitchen_user_id = p_kitchen_user_id;

    v_available := v_produced - v_already_exited;
    IF v_lot_qty > v_available THEN
      RAISE EXCEPTION 'Lot % only has % available (requested %)', v_batch, v_available, v_lot_qty;
    END IF;
  END LOOP;

  INSERT INTO stock_exits (production_id, quantity, reason, kitchen_user_id, exit_reason)
  VALUES (p_production_id, p_quantity, p_reason, p_kitchen_user_id, p_exit_reason)
  RETURNING id INTO v_exit_id;

  FOR v_lot IN SELECT * FROM jsonb_array_elements(p_lots)
  LOOP
    INSERT INTO stock_exit_lots (exit_id, batch_number, quantity, kitchen_user_id)
    VALUES (
      v_exit_id,
      (v_lot->>'batch_number')::varchar(5),
      (v_lot->>'quantity')::numeric,
      p_kitchen_user_id
    );
  END LOOP;

  RETURN v_exit_id;
END;
$$;

-- ============================================================================
-- 4. Login attempts table for rate limiting
-- ============================================================================

CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_attempts_ip_time ON login_attempts(ip_hash, attempted_at);

-- Auto-cleanup old attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM login_attempts WHERE attempted_at < now() - interval '1 hour';
$$;

-- ============================================================================
-- 5. AI usage table for persistent rate limiting
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_user_id uuid NOT NULL REFERENCES kitchen_users(id),
  used_at date NOT NULL DEFAULT CURRENT_DATE,
  call_count integer NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX idx_ai_usage_user_date ON ai_usage(kitchen_user_id, used_at);

-- Atomic upsert function to avoid race conditions on concurrent AI requests
CREATE OR REPLACE FUNCTION increment_ai_usage(p_kitchen_user_id uuid, p_date date)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO ai_usage (kitchen_user_id, used_at, call_count)
  VALUES (p_kitchen_user_id, p_date, 1)
  ON CONFLICT (kitchen_user_id, used_at)
  DO UPDATE SET call_count = ai_usage.call_count + 1;
$$;

-- ============================================================================
-- 6. Frozen remaining hours upper bound constraint
--    Replace the old non-negative check with a range check (0..8760 = 1 year)
-- ============================================================================

ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS frozen_remaining_hours_non_negative;
ALTER TABLE production_logs
  ADD CONSTRAINT frozen_remaining_hours_range
  CHECK (frozen_remaining_hours IS NULL OR (frozen_remaining_hours >= 0 AND frozen_remaining_hours <= 8760));
