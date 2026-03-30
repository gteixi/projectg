-- Seed data for local development
-- Restaurant: 11111111-1111-1111-1111-111111111111

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
-- PRODUCTION LOGS (lotes de hoy con distintos estados)
-- ============================================================

-- Lotes producidos hoy (frescos)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000001', 5,  now() - interval '2 hours', now() + interval '46 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000002', 3,  now() - interval '3 hours', now() + interval '69 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000003', 8,  now() - interval '1 hour',  now() + interval '23 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000004', 10, now() - interval '4 hours', now() + interval '8 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000005', 4,  now() - interval '2 hours', now() + interval '46 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000006', 6,  now() - interval '5 hours', now() + interval '163 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000009', 12, now() - interval '1 hour',  now() + interval '23 hours'),
  ('aaaaaaaa-0001-0001-0001-000000000011', 20, now() - interval '30 minutes', now() + interval '7.5 hours');

-- Lote que caduca pronto (urgente)
insert into production_logs (production_id, quantity, logged_at, expires_at) values
  ('aaaaaaaa-0001-0001-0001-000000000004', 5, now() - interval '11 hours', now() + interval '1 hour');

-- ============================================================
-- STOCK EXITS (algunas ventas y mermas de hoy)
-- ============================================================

insert into stock_exits (id, production_id, quantity, reason, logged_at) values
  ('bbbbbbbb-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', 2, 'venta',  now() - interval '1 hour'),
  ('bbbbbbbb-0001-0001-0001-000000000002', 'aaaaaaaa-0001-0001-0001-000000000003', 3, 'venta',  now() - interval '30 minutes'),
  ('bbbbbbbb-0001-0001-0001-000000000003', 'aaaaaaaa-0001-0001-0001-000000000009', 1, 'merma',  now() - interval '15 minutes');
