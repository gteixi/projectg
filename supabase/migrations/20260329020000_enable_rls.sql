-- Activa RLS en todas las tablas con politicas abiertas
-- Preparacion para cuando se añada autenticacion: solo hay que restringir las politicas

alter table productions enable row level security;
alter table production_logs enable row level security;
alter table stock_exits enable row level security;
alter table stock_exit_lots enable row level security;

-- Politicas abiertas: permiten todo via anon key (estado actual)
create policy "allow_all" on productions for all using (true) with check (true);
create policy "allow_all" on production_logs for all using (true) with check (true);
create policy "allow_all" on stock_exits for all using (true) with check (true);
create policy "allow_all" on stock_exit_lots for all using (true) with check (true);
