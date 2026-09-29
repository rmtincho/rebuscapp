-- Pantalla de Notificaciones (botón de la campana en la barra de abajo).
-- Para el globito de "sin leer" hace falta saber cuáles ya vio.
-- Correr una vez en Supabase → SQL Editor. Se puede correr más de una vez.
-- Sin esto la pantalla funciona igual, pero sin contador.

begin;

alter table notificaciones add column if not exists leida boolean not null default false;
-- Si la tabla ya tenía fecha de creación con este nombre, no cambia nada
alter table notificaciones add column if not exists created_at timestamptz not null default now();

-- Las que ya existían quedan como leídas, para que nadie arranque con un
-- contador enorme (si se vuelve a correr, marca todo como leído: no pasa nada)
update notificaciones set leida = true where not leida;

create index if not exists notificaciones_usuario_sin_leer_idx
  on notificaciones (usuario_id)
  where not leida;

commit;
