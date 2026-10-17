-- Para publicar un trabajo hacen falta los datos básicos (nombre, apellido,
-- edad y DNI), igual que para postularse. La app ya manda a completarlos
-- antes de mostrar el formulario; esto lo asegura en la base, porque el
-- trabajo se inserta desde el navegador. Solo frena trabajos nuevos.
-- Correr una vez en Supabase → SQL Editor. Se puede correr más de una vez.

create or replace function exigir_datos_para_publicar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from usuarios u
    where u.id = new.solicitante_id
      and length(trim(coalesce(u.nombre, ''))) >= 2
      and length(trim(coalesce(u.apellido, ''))) >= 2
      and u.edad is not null
      and coalesce(u.dni, '') <> ''
  ) then
    raise exception 'Antes de publicar, completá tus datos básicos (nombre, edad y DNI).';
  end if;
  return new;
end $$;

revoke all on function exigir_datos_para_publicar() from public, anon, authenticated;

drop trigger if exists exigir_datos_para_publicar on pedidos;
create trigger exigir_datos_para_publicar before insert on pedidos
  for each row execute function exigir_datos_para_publicar();
