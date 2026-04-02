-- Track lot movement history between stations
CREATE TABLE lot_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES productions(id),
  log_id uuid NOT NULL REFERENCES production_logs(id),
  batch_number varchar(5) NOT NULL,
  from_station text NOT NULL,
  to_station text NOT NULL,
  quantity numeric NOT NULL,
  moved_at timestamptz NOT NULL DEFAULT now(),
  kitchen_user_id uuid NOT NULL REFERENCES kitchen_users(id)
);

CREATE INDEX idx_lot_moves_kitchen_user ON lot_moves(kitchen_user_id);
CREATE INDEX idx_lot_moves_moved_at ON lot_moves(moved_at);

ALTER TABLE lot_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON lot_moves FOR ALL USING (true) WITH CHECK (true);
