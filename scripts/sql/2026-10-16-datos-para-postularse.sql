-- Para postularse hacen falta los datos básicos (nombre, apellido, edad y
-- DNI). La página del trabajo ya lo pide antes de mostrar "Postularme";
-- esto lo asegura en la base, porque la postulación se inserta desde el
-- navegador. Igual que 2026-10-16-datos-para-publicar.sql. Solo frena
-- postulaciones nuevas.
-- Correr una vez en Supabase → SQL Editor. Se puede correr más de una vez.

create or replace function exigir_datos_para_postularse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from usuarios u
    where u.id = new.prestador_id
      and length(trim(coalesce(u.nombre, ''))) >= 2
      and length(trim(coalesce(u.apellido, ''))) >= 2
      and u.edad is not null
      and coalesce(u.dni, '') <> ''
  ) then
    raise exception 'Antes de postularte, completá tus datos básicos (nombre, edad y DNI).';
  end if;
  return new;
end $$;

revoke all on function exigir_datos_para_postularse() from public, anon, authenticated;

drop trigger if exists exigir_datos_para_postularse on postulaciones;
create trigger exigir_datos_para_postularse before insert on postulaciones
  for each row execute function exigir_datos_para_postularse();
