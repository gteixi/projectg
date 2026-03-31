-- Seed data for local development
-- Restaurant: 11111111-1111-1111-1111-111111111111

-- ============================================================
-- KITCHEN USER (PIN: 1234)
-- ============================================================

insert into kitchen_users (id, name, pin_hash, active) values
  ('cccccccc-0001-0001-0001-000000000001', 'Chef Test', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', true);

-- ============================================================
-- PRODUCTIONS (preparaciones de ejemplo)
-- ============================================================

insert into productions (id, name, unit, shelf_life_hours, station, active) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Salsa Brava',       'L',   48, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000002', 'Alioli',            'L',   72, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000003', 'Caldo de Pollo',    'L',   24, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000004', 'Masa de Pizza',     'kg',  12, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000005', 'Hummus',            'kg',  48, 'Partida',    true),
  ('aaaaaaaa-0001-0001-0001-000000000006', 'Helado de Vainilla','L',  168, 'Congelador', true),
  ('aaaaaaaa-0001-0001-0001-000000000007', 'Sorbete de Limon',  'L',  168, 'Congelador', true),
  ('aaaaaaaa-0001-0001-0001-000000000008', 'Croquetas (cong)',  'ud', 720, 'Congelador', true),
  ('aaaaaaaa-0001-0001-0001-000000000009', 'Carpaccio',         'ud',  24, 'Camara',     true),
  ('aaaaaaaa-0001-0001-0001-000000000010', 'Tataki de Atun',    'ud',  24, 'Camara',     true),
  ('aaaaaaaa-0001-0001-0001-000000000011', 'Pan de Timbre',     'ud',   8, 'Timbre',     true),
  ('aaaaaaaa-0001-0001-0001-000000000012', 'Focaccia',          'ud',  12, 'Timbre',     true);

-- ============================================================
-- PRODUCTION LOGS (lotes con distintos escenarios de caducidad)
-- ============================================================

-- ESCENARIO 1: Salsa Brava — stock válido + stock caducado (mixto)
-- Lote activo (caduca en 46h)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 5,  now() - interval '2 hours', now() + interval '46 hours');
-- Lote caducado (caducó hace 2h)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 3,  now() - interval '50 hours', now() - interval '2 hours');

-- ESCENARIO 2: Alioli — solo stock válido (sin caducados)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000002', 3,  now() - interval '3 hours', now() + interval '69 hours');

-- ESCENARIO 3: Caldo de Pollo — solo stock caducado (todo expirado)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000003', 8,  now() - interval '25 hours', now() - interval '1 hour');

-- ESCENARIO 4: Masa de Pizza — múltiples lotes: caducado + urgente + fresco
-- Lote caducado (caducó hace 30min)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000004', 5, now() - interval '13 hours', now() - interval '30 minutes');
-- Lote urgente (caduca en 1h — amarillo, caduca hoy)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000004', 10, now() - interval '11 hours', now() + interval '1 hour');
-- Lote fresco (caduca en 8h)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000004', 7, now() - interval '4 hours', now() + interval '8 hours');

-- ESCENARIO 5: Hummus — stock válido, parcialmente vendido
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000005', 4,  now() - interval '2 hours', now() + interval '46 hours');

-- Helado — stock fresco (larga vida)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000006', 6,  now() - interval '5 hours', now() + interval '163 hours');

-- Carpaccio — stock fresco con una merma
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000009', 12, now() - interval '1 hour',  now() + interval '23 hours');

-- Pan de Timbre — stock fresco
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000011', 20, now() - interval '30 minutes', now() + interval '7.5 hours');

-- ESCENARIO 6: Sorbete de Limon — sin stock (0 lotes, sin caducados)
-- (nada — para verificar que se muestra 0 limpio)

-- ESCENARIO 7: Focaccia — todo caducado, con 2 lotes caducados
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000012', 8, now() - interval '14 hours', now() - interval '2 hours');
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000012', 6, now() - interval '13 hours', now() - interval '1 hour');

-- ============================================================
-- STOCK EXITS (algunas ventas y mermas)
-- ============================================================

-- Necesitamos los batch_numbers asignados por el trigger.
-- Los insertamos con DO block para leer los batch_numbers reales.

do $$
declare
  v_exit_id uuid;
  v_batch integer;
begin
  -- Venta de 2L de Salsa Brava (del lote activo)
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    order by logged_at asc limit 1;

  insert into stock_exits (id, production_id, quantity, reason, logged_at) values
    ('bbbbbbbb-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', 2, 'venta', now() - interval '1 hour')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values
    (v_exit_id, v_batch, 2);

  -- Merma de 1ud de Carpaccio
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000009'
    order by logged_at asc limit 1;

  insert into stock_exits (id, production_id, quantity, reason, logged_at) values
    ('bbbbbbbb-0001-0001-0001-000000000003', 'aaaaaaaa-0001-0001-0001-000000000009', 1, 'merma', now() - interval '15 minutes')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values
    (v_exit_id, v_batch, 1);

  -- Venta de 2kg de Hummus (parcial)
  select batch_number into v_batch from production_logs
    where production_id = 'aaaaaaaa-0001-0001-0001-000000000005'
    order by logged_at asc limit 1;

  insert into stock_exits (id, production_id, quantity, reason, logged_at) values
    ('bbbbbbbb-0001-0001-0001-000000000004', 'aaaaaaaa-0001-0001-0001-000000000005', 2, 'venta', now() - interval '45 minutes')
    returning id into v_exit_id;
  insert into stock_exit_lots (exit_id, batch_number, quantity) values
    (v_exit_id, v_batch, 2);
end $$;
