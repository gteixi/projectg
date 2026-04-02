-- Track which station a lot is currently in (NULL = production's default station)
-- When a lot moves to Congelador, expires_at is set to NULL (paused).
-- When a lot moves FROM Congelador, expires_at is recalculated from shelf_life_hours.

ALTER TABLE production_logs ADD COLUMN current_station text;
