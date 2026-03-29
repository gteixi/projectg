-- Tabla de usuarios de cocina para login por PIN

create table if not exists kitchen_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table kitchen_users enable row level security;
create policy "allow_all" on kitchen_users for all using (true) with check (true);
