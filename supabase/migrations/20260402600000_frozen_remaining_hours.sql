-- Store how many hours of shelf life remained when a lot was frozen.
-- Used to restore the correct expires_at when unfreezing (pause behavior).
alter table production_logs
  add column frozen_remaining_hours numeric;
