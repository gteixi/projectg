-- Track lot movement history for the historial page
CREATE TABLE lot_moves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  production_id uuid NOT NULL REFERENCES productions(id),
  log_id uuid NOT NULL REFERENCES production_logs(id),
  batch_number text NOT NULL,
  from_station text NOT NULL,
  to_station text NOT NULL,
  quantity numeric NOT NULL,
  moved_at timestamptz NOT NULL DEFAULT now(),
  kitchen_user_id uuid NOT NULL REFERENCES kitchen_users(id)
);

CREATE INDEX idx_lot_moves_kitchen_user ON lot_moves(kitchen_user_id);
CREATE INDEX idx_lot_moves_moved_at ON lot_moves(moved_at);

ALTER TABLE lot_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lot_moves" ON lot_moves FOR ALL USING (true) WITH CHECK (true);
