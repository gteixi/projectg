-- La imagen local de Supabase-Postgres trae por defecto un ALTER DEFAULT PRIVILEGES
-- FOR ROLE postgres muy restrictivo (solo Dxtm en tablas, solo X para postgres en funciones).
-- Como las migraciones se aplican como "postgres", ninguna tabla/funcion nueva
-- quedaba accesible para anon/authenticated/service_role sin GRANT explicito.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;

grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

grant execute on all functions in schema public
  to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated, service_role;
