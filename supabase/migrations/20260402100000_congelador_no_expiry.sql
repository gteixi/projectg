-- Congelador products: expiry is paused (set expires_at = NULL)
-- The daily_stock view already handles NULL expires_at correctly.

UPDATE production_logs pl
SET expires_at = NULL
FROM productions p
WHERE pl.production_id = p.id
  AND p.station = 'Congelador';
