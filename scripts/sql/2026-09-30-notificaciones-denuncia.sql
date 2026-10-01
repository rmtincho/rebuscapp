-- Suma 'denuncia' a los tipos de notificación (el aviso al equipo cuando
-- llega una denuncia, app/actions/moderacion.ts). Sin esto la denuncia se
-- guarda, pero la notificación se rechaza.
-- Correr una vez en Supabase → SQL Editor.

begin;

-- La regla original no tiene un nombre conocido: se busca y se borra
do $$
declare
  regla text;
begin
  for regla in
    select conname from pg_constraint
    where conrelid = 'notificaciones'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%tipo%'
  loop
    execute format('alter table notificaciones drop constraint %I', regla);
  end loop;
end $$;

alter table notificaciones add constraint notificaciones_tipo_check check (
  tipo in (
    'pedido_cerca',
    'mensaje_nuevo',
    'postulacion_recibida',
    'postulante_elegido',
    'pedido_editado',
    'postulacion_rechazada',
    'denuncia'
  )
);

commit;
