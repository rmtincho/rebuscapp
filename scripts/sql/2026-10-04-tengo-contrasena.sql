-- ¿La cuenta del usuario de la sesión ya tiene contraseña? Supabase no lo
-- dice desde la app (las cuentas se crean con código por mail), y se usa
-- para el aviso "Creá tu contraseña" en el menú y el perfil.
-- Solo responde por uno mismo (auth.uid()) y no devuelve nada más.
-- Correr una vez en Supabase → SQL Editor. Se puede correr más de una vez.

create or replace function public.tengo_contrasena()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select encrypted_password is not null and encrypted_password <> ''
       from auth.users
      where id = auth.uid()),
    false
  )
$$;

revoke all on function public.tengo_contrasena() from public, anon;
grant execute on function public.tengo_contrasena() to authenticated;
