-- Edad mínima opcional en los pedidos (Publicar → Requisitos).
-- Solo mínima: una edad máxima en un aviso de trabajo puede ser
-- discriminatoria (Ley 23.592). La app ya exige 18 años para todos.
-- Correr en Supabase → SQL Editor ANTES de publicar el código que la usa.
-- Se puede correr más de una vez.

alter table pedidos add column if not exists edad_minima smallint;

alter table pedidos drop constraint if exists pedidos_edad_minima_check;
alter table pedidos add constraint pedidos_edad_minima_check
  check (edad_minima is null or edad_minima between 18 and 70);
