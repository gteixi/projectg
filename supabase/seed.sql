-- Seed data for local development
-- Restaurant: 11111111-1111-1111-1111-111111111111
-- Covers: afegir (stock + expired), urgent (semaphore), historial (7 days),
--         informe (consumption, merma, idle productions), lote (trazabilidad)

-- ============================================================
-- KITCHEN USERS (PIN: 1234 / 0000)
-- ============================================================

insert into kitchen_users (id, name, pin_hash, active) values
  ('cccccccc-0001-0001-0001-000000000001', 'Chef Marc',   '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', true),
  ('cccccccc-0001-0001-0001-000000000002', 'Sous Chef Anna', '5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9', true);

-- ============================================================
-- PRODUCTIONS (12 preparaciones en 4 estaciones)
-- ============================================================

insert into productions (id, name, unit, shelf_life_hours, station, active) values
  -- Partida (5)
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Salsa Brava',       'L',   48, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000002', 'Alioli',            'L',   72, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000003', 'Caldo de Pollo',    'L',   24, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000004', 'Masa de Pizza',     'kg',  12, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000005', 'Hummus',            'kg',  48, 'Partida',    true),
  -- Congelador (3)
  ('aaaaaaaa-0001-0001-0001-000000000006', 'Helado de Vainilla','L',  168, 'Congelador', true),
  ('aaaaaaaa-0001-0001-0001-000000000007', 'Sorbete de Limon',  'L',  168, 'Congelador', true),
  ('aaaaaaaa-0001-0001-0001-000000000008', 'Croquetas (cong)',  'ud', 720, 'Congelador', true),
  -- Camara (2)
  ('aaaaaaaa-0001-0001-0001-000000000009', 'Carpaccio',         'ud',  24, 'Camara',     true),
  ('aaaaaaaa-0001-0001-0001-000000000010', 'Tataki de Atun',    'ud',  24, 'Camara',     true),
  -- Timbre (2)
  ('aaaaaaaa-0001-0001-0001-000000000011', 'Pan de Timbre',     'ud',   8, 'Timbre',     true),
  ('aaaaaaaa-0001-0001-0001-000000000012', 'Focaccia',          'ud',  12, 'Timbre',     true);

-- ============================================================
-- PRODUCTION LOGS — 7 días de actividad
-- Día 0 = hoy, Día -1 = ayer, ..., Día -6 = hace 6 días
-- ============================================================

-- ── DÍA -6 (hace 6 días) ──────────────────────────────────
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 4, now() - interval '6 days 8 hours', now() - interval '4 days 8 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000003', 6, now() - interval '6 days 7 hours', now() - interval '5 days 7 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000009', 15, now() - interval '6 days 6 hours', now() - interval '5 days 6 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000011', 30, now() - interval '6 days 5 hours', now() - interval '5 days 21 hours');

-- ── DÍA -5 ─────────────────────────────────────────────────
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 5, now() - interval '5 days 9 hours', now() - interval '3 days 9 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000002', 4, now() - interval '5 days 8 hours', now() - interval '2 days 8 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000004', 8, now() - interval '5 days 7 hours', now() - interval '4 days 19 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000006', 5, now() - interval '5 days 6 hours', now() + interval '2 days 18 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000009', 10, now() - interval '5 days 5 hours', now() - interval '4 days 5 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000011', 25, now() - interval '5 days 4 hours', now() - interval '4 days 20 hours');

-- ── DÍA -4 ─────────────────────────────────────────────────
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 6, now() - interval '4 days 8 hours', now() - interval '2 days 8 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000003', 8, now() - interval '4 days 7 hours', now() - interval '3 days 7 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000005', 3, now() - interval '4 days 6 hours', now() - interval '2 days 6 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000008', 50, now() - interval '4 days 5 hours', now() + interval '25 days 19 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000010', 8, now() - interval '4 days 4 hours', now() - interval '3 days 4 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000012', 15, now() - interval '4 days 3 hours', now() - interval '3 days 15 hours');

-- ── DÍA -3 ─────────────────────────────────────────────────
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 5, now() - interval '3 days 9 hours', now() - interval '1 day 9 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000002', 3, now() - interval '3 days 8 hours', now() - interval '8 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000004', 10, now() - interval '3 days 7 hours', now() - interval '2 days 19 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000009', 12, now() - interval '3 days 6 hours', now() - interval '2 days 6 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000011', 20, now() - interval '3 days 5 hours', now() - interval '2 days 21 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000012', 10, now() - interval '3 days 4 hours', now() - interval '2 days 16 hours');

-- ── DÍA -2 ─────────────────────────────────────────────────
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 4, now() - interval '2 days 8 hours', now() - interval '8 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000003', 10, now() - interval '2 days 7 hours', now() - interval '1 day 7 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000005', 5, now() - interval '2 days 6 hours', now() - interval '6 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000007', 4, now() - interval '2 days 5 hours', now() + interval '4 days 19 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000009', 8, now() - interval '2 days 4 hours', now() - interval '1 day 4 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000010', 6, now() - interval '2 days 3 hours', now() - interval '1 day 3 hours');

-- ── DÍA -1 (ayer) ──────────────────────────────────────────
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 5, now() - interval '1 day 8 hours', now() + interval '16 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000002', 4, now() - interval '1 day 7 hours', now() + interval '2 days 17 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000003', 7, now() - interval '1 day 6 hours', now() - interval '6 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000004', 12, now() - interval '1 day 5 hours', now() - interval '5 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000009', 10, now() - interval '1 day 4 hours', now() - interval '4 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000011', 25, now() - interval '1 day 3 hours', now() - interval '19 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000012', 12, now() - interval '1 day 2 hours', now() - interval '14 hours');

-- ── DÍA 0 (hoy) ────────────────────────────────────────────

-- Salsa Brava: lote activo + lote caducado (mixto)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 6, now() - interval '2 hours', now() + interval '46 hours');
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 3, now() - interval '50 hours', now() - interval '2 hours');

-- Alioli: solo stock válido
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000002', 3, now() - interval '3 hours', now() + interval '69 hours');

-- Caldo de Pollo: todo caducado
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000003', 8, now() - interval '25 hours', now() - interval '1 hour');

-- Masa de Pizza: caducado + urgente (caduca hoy) + fresco
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000004', 5, now() - interval '13 hours', now() - interval '30 minutes');
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000004', 10, now() - interval '11 hours', now() + interval '1 hour');
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000004', 7, now() - interval '4 hours', now() + interval '8 hours');

-- Hummus: stock válido parcialmente vendido
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000005', 4, now() - interval '2 hours', now() + interval '46 hours');

-- Helado de Vainilla: larga vida, fresco
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000006', 6, now() - interval '5 hours', now() + interval '163 hours');

-- Croquetas: gran lote congelado (producido día -4, sigue vivo)
-- (ya insertado arriba)

-- Carpaccio: stock fresco
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000009', 12, now() - interval '1 hour', now() + interval '23 hours');

-- Tataki: caduca mañana
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000010', 8, now() - interval '3 hours', now() + interval '21 hours');

-- Pan de Timbre: stock fresco
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000011', 20, now() - interval '30 minutes', now() + interval '7.5 hours');

-- Focaccia: todo caducado (2 lotes)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000012', 8, now() - interval '14 hours', now() - interval '2 hours');
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000012', 6, now() - interval '13 hours', now() - interval '1 hour');

-- Sorbete de Limon: sin lotes hoy (0 stock, idle production)

-- ============================================================
-- STOCK EXITS — ventas y mermas repartidas en 7 días
-- (para historial + informe)
-- ============================================================

do $$
declare
  v_exit_id uuid;
  v_batch integer;
begin

  -- ── DÍA -6 ──────────────────────────────────────────────

  -- Venta Salsa Brava 3L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000001', 3, 'venta', now() - interval '6 days 4 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 3);

  -- Venta Carpaccio 10ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000009'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000009', 10, 'venta', now() - interval '6 days 3 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 10);

  -- Merma Carpaccio 3ud
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000009', 3, 'merma', now() - interval '6 days 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 3);

  -- Venta Pan de Timbre 22ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000011'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000011', 22, 'venta', now() - interval '6 days 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 22);

  -- Merma Pan de Timbre 5ud
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000011', 5, 'merma', now() - interval '5 days 23 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 5);

  -- ── DÍA -5 ──────────────────────────────────────────────

  -- Venta Salsa Brava 4L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    and logged_at >= now() - interval '6 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000001', 4, 'venta', now() - interval '5 days 4 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 4);

  -- Venta Alioli 3L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000002'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000002', 3, 'venta', now() - interval '5 days 3 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 3);

  -- Venta Masa de Pizza 6kg
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000004'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000004', 6, 'venta', now() - interval '5 days 3 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 6);

  -- Venta Carpaccio 7ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000009'
    and logged_at >= now() - interval '6 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000009', 7, 'venta', now() - interval '5 days 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 7);

  -- Venta Pan de Timbre 20ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000011'
    and logged_at >= now() - interval '6 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000011', 20, 'venta', now() - interval '5 days 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 20);

  -- ── DÍA -4 ──────────────────────────────────────────────

  -- Venta Salsa Brava 5L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    and logged_at >= now() - interval '5 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000001', 5, 'venta', now() - interval '4 days 4 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 5);

  -- Venta Caldo de Pollo 5L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000003'
    and logged_at >= now() - interval '5 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000003', 5, 'venta', now() - interval '4 days 3 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 5);

  -- Merma Caldo de Pollo 2L
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000003', 2, 'merma', now() - interval '4 days 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 2);

  -- Venta Hummus 2kg
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000005'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000005', 2, 'venta', now() - interval '4 days 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 2);

  -- Venta Tataki 6ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000010'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000010', 6, 'venta', now() - interval '4 days 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 6);

  -- Merma Tataki 2ud
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000010', 2, 'merma', now() - interval '4 days')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 2);

  -- Venta Focaccia 10ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000012'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000012', 10, 'venta', now() - interval '4 days 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 10);

  -- Merma Focaccia 4ud
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000012', 4, 'merma', now() - interval '3 days 23 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 4);

  -- ── DÍA -3 ──────────────────────────────────────────────

  -- Venta Salsa Brava 4L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    and logged_at >= now() - interval '4 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000001', 4, 'venta', now() - interval '3 days 4 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 4);

  -- Venta Masa de Pizza 8kg
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000004'
    and logged_at >= now() - interval '4 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000004', 8, 'venta', now() - interval '3 days 3 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 8);

  -- Venta Carpaccio 9ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000009'
    and logged_at >= now() - interval '4 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000009', 9, 'venta', now() - interval '3 days 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 9);

  -- Merma Carpaccio 2ud
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000009', 2, 'merma', now() - interval '3 days 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 2);

  -- Venta Pan de Timbre 18ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000011'
    and logged_at >= now() - interval '4 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000011', 18, 'venta', now() - interval '3 days 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 18);

  -- Venta Focaccia 8ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000012'
    and logged_at >= now() - interval '4 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000012', 8, 'venta', now() - interval '3 days 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 8);

  -- ── DÍA -2 ──────────────────────────────────────────────

  -- Venta Salsa Brava 3L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    and logged_at >= now() - interval '3 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000001', 3, 'venta', now() - interval '2 days 4 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 3);

  -- Venta Caldo de Pollo 8L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000003'
    and logged_at >= now() - interval '3 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000003', 8, 'venta', now() - interval '2 days 3 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 8);

  -- Venta Hummus 3kg
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000005'
    and logged_at >= now() - interval '3 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000005', 3, 'venta', now() - interval '2 days 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 3);

  -- Merma Hummus 1kg
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000005', 1, 'merma', now() - interval '2 days 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 1);

  -- Venta Carpaccio 6ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000009'
    and logged_at >= now() - interval '3 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000009', 6, 'venta', now() - interval '2 days 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 6);

  -- Venta Tataki 5ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000010'
    and logged_at >= now() - interval '3 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000010', 5, 'venta', now() - interval '2 days 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 5);

  -- ── DÍA -1 (ayer) ───────────────────────────────────────

  -- Venta Salsa Brava 4L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    and logged_at >= now() - interval '2 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000001', 4, 'venta', now() - interval '1 day 4 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 4);

  -- Merma Salsa Brava 1L
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000001', 1, 'merma', now() - interval '1 day 3 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 1);

  -- Venta Alioli 3L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000002'
    and logged_at >= now() - interval '2 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000002', 3, 'venta', now() - interval '1 day 3 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 3);

  -- Venta Caldo de Pollo 6L
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000003'
    and logged_at >= now() - interval '2 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000003', 6, 'venta', now() - interval '1 day 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 6);

  -- Venta Masa de Pizza 10kg
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000004'
    and logged_at >= now() - interval '2 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000004', 10, 'venta', now() - interval '1 day 2 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 10);

  -- Merma Masa de Pizza 2kg
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000004', 2, 'merma', now() - interval '1 day 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 2);

  -- Venta Carpaccio 8ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000009'
    and logged_at >= now() - interval '2 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000009', 8, 'venta', now() - interval '1 day 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 8);

  -- Venta Pan de Timbre 22ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000011'
    and logged_at >= now() - interval '2 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000011', 22, 'venta', now() - interval '1 day 1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 22);

  -- Merma Focaccia 5ud (ayer)
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000012'
    and logged_at >= now() - interval '2 days' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000012', 5, 'merma', now() - interval '1 day')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 5);

  -- Venta Focaccia 6ud
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000012', 6, 'venta', now() - interval '23 hours')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 6);

  -- ── DÍA 0 (hoy) ────────────────────────────────────────

  -- Venta Salsa Brava 2L (del lote de hoy)
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    and logged_at >= now() - interval '1 day' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000001', 2, 'venta', now() - interval '1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 2);

  -- Merma Carpaccio 1ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000009'
    and logged_at >= now() - interval '1 day' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000009', 1, 'merma', now() - interval '15 minutes')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 1);

  -- Venta Hummus 2kg
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000005'
    and logged_at >= now() - interval '1 day' order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000005', 2, 'venta', now() - interval '45 minutes')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 2);

  -- Venta Croquetas 15ud
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000008'
    order by logged_at asc limit 1;
  insert into stock_exits (production_id, quantity, reason, logged_at) values
    ('aaaaaaaa-0001-0001-0001-000000000008', 15, 'venta', now() - interval '30 minutes')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values (v_exit_id, v_batch, 15);

end $$;
