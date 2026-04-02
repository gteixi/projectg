-- Recreate daily_stock view to group by effective station (COALESCE(current_station, production.station)).
-- A production with lots in multiple stations appears as separate rows.
-- A production ALWAYS appears in its default station (even with 0 stock).

DROP VIEW IF EXISTS daily_stock;

CREATE OR REPLACE VIEW daily_stock AS
WITH lot_totals AS (
  SELECT
    pl.production_id,
    COALESCE(pl.current_station, p.station)::text as effective_station,
    SUM(GREATEST(
      pl.quantity - COALESCE(
        (SELECT SUM(sel.quantity) FROM stock_exit_lots sel WHERE sel.batch_number = pl.batch_number), 0
      ), 0
    )) as total
  FROM production_logs pl
  JOIN productions p ON p.id = pl.production_id
  WHERE (pl.expires_at IS NULL OR pl.expires_at > now())
    AND pl.batch_number IS NOT NULL
  GROUP BY pl.production_id, COALESCE(pl.current_station, p.station)
  HAVING SUM(GREATEST(
    pl.quantity - COALESCE(
      (SELECT SUM(sel.quantity) FROM stock_exit_lots sel WHERE sel.batch_number = pl.batch_number), 0
    ), 0
  )) > 0
)
-- Productions in their default station (always shown, even with 0 stock)
SELECT
  p.id as production_id,
  p.name,
  p.unit,
  p.shelf_life_hours,
  p.station,
  p.active,
  p.kitchen_user_id,
  COALESCE(lt.total, 0) as stock_total,
  CASE WHEN COALESCE(lt.total, 0) > 0
    THEN (
      SELECT MIN(pl2.expires_at)
      FROM production_logs pl2
      WHERE pl2.production_id = p.id
        AND COALESCE(pl2.current_station, p.station) = p.station
        AND pl2.expires_at > now()
        AND pl2.batch_number IS NOT NULL
        AND pl2.quantity - COALESCE(
          (SELECT SUM(sel2.quantity) FROM stock_exit_lots sel2 WHERE sel2.batch_number = pl2.batch_number), 0
        ) > 0
    )
    ELSE NULL
  END as next_expiry
FROM productions p
LEFT JOIN lot_totals lt ON lt.production_id = p.id AND lt.effective_station = p.station
WHERE p.active = true

UNION ALL

-- Productions in non-default stations (only when they have moved lots there)
SELECT
  p.id as production_id,
  p.name,
  p.unit,
  p.shelf_life_hours,
  lt.effective_station::text as station,
  p.active,
  p.kitchen_user_id,
  lt.total as stock_total,
  (
    SELECT MIN(pl2.expires_at)
    FROM production_logs pl2
    WHERE pl2.production_id = p.id
      AND COALESCE(pl2.current_station, p.station) = lt.effective_station
      AND pl2.expires_at > now()
      AND pl2.batch_number IS NOT NULL
      AND pl2.quantity - COALESCE(
        (SELECT SUM(sel2.quantity) FROM stock_exit_lots sel2 WHERE sel2.batch_number = pl2.batch_number), 0
      ) > 0
  ) as next_expiry
FROM productions p
JOIN lot_totals lt ON lt.production_id = p.id AND lt.effective_station != p.station
WHERE p.active = true;
