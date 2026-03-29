CREATE OR REPLACE FUNCTION get_consumption_summary(date_from date DEFAULT CURRENT_DATE - 6, date_to date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  production_id uuid,
  name text,
  unit text,
  station text,
  total_venda bigint,
  total_merma bigint,
  total_produit bigint,
  dias_con_actividad bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id AS production_id,
    p.name,
    p.unit,
    p.station::text,
    COALESCE(SUM(se.quantity) FILTER (WHERE se.reason = 'venta'),  0) AS total_venda,
    COALESCE(SUM(se.quantity) FILTER (WHERE se.reason = 'merma'),  0) AS total_merma,
    COALESCE((
      SELECT SUM(pl.quantity)
      FROM production_logs pl
      WHERE pl.production_id = p.id
        AND pl.logged_at >= date_from
        AND pl.logged_at < (date_to + interval '1 day')::date
    ), 0) AS total_produit,
    COUNT(DISTINCT se.logged_at::date) AS dias_con_actividad
  FROM productions p
  JOIN stock_exits se
    ON se.production_id = p.id
   AND se.logged_at >= date_from
   AND se.logged_at < (date_to + interval '1 day')::date
  GROUP BY p.id, p.name, p.unit, p.station;
$$;

CREATE OR REPLACE FUNCTION get_idle_productions(date_from date DEFAULT CURRENT_DATE - 6, date_to date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  production_id uuid,
  name text,
  unit text,
  station text,
  total_produit bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id AS production_id,
    p.name,
    p.unit,
    p.station::text,
    COALESCE(SUM(pl.quantity), 0) AS total_produit
  FROM productions p
  JOIN production_logs pl
    ON pl.production_id = p.id
   AND pl.logged_at >= date_from
   AND pl.logged_at < (date_to + interval '1 day')::date
  WHERE p.active = true
    AND NOT EXISTS (
      SELECT 1 FROM stock_exits se
      WHERE se.production_id = p.id
        AND se.logged_at >= date_from
        AND se.logged_at < (date_to + interval '1 day')::date
    )
  GROUP BY p.id, p.name, p.unit, p.station;
$$;
