-- Eliminar cuenta (Perfil → "Eliminar mi cuenta").
-- Correr una vez en Supabase → SQL Editor, ANTES de deployar el código
-- que agrega el botón. Se puede correr más de una vez sin problema.
--
-- Al eliminar una cuenta no se borra la fila de usuarios (la referencian
-- pedidos, postulaciones, mensajes y calificaciones de otras personas):
-- se anonimiza. Para eso los datos personales tienen que poder quedar
-- vacíos, y queda registrado cuándo se eliminó.

begin;

alter table usuarios alter column email drop not null;
alter table usuarios alter column apellido drop not null;
alter table usuarios alter column edad drop not null;
alter table usuarios alter column dni drop not null;
alter table usuarios alter column telefono drop not null;
alter table usuarios alter column foto_perfil_url drop not null;
alter table usuarios alter column ubicacion_lat drop not null;
alter table usuarios alter column ubicacion_lng drop not null;

alter table usuarios add column if not exists eliminado_en timestamptz;

commit;
