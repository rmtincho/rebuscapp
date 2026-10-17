-- Turno (de día / de noche) en el trabajo y en el perfil del trabajador.
-- Correr una vez en Supabase → SQL Editor, ANTES de subir el código que lo
-- usa (las consultas lo piden). Se puede correr más de una vez.
--
-- pedidos.turno: 'diurno', 'nocturno' o 'rotativo' (solo puesto fijo).
-- perfiles_prestador.turno_preferido: 'diurno', 'nocturno' o 'indistinto'.
-- null = no lo dijo.

alter table pedidos add column if not exists turno text;
alter table pedidos drop constraint if exists pedidos_turno_check;
alter table pedidos add constraint pedidos_turno_check
  check (turno in ('diurno', 'nocturno', 'rotativo'));

alter table perfiles_prestador add column if not exists turno_preferido text;
alter table perfiles_prestador drop constraint if exists perfiles_prestador_turno_preferido_check;
alter table perfiles_prestador add constraint perfiles_prestador_turno_preferido_check
  check (turno_preferido in ('diurno', 'nocturno', 'indistinto'));

-- El trabajador edita su perfil solo por columnas permitidas (ver
-- 2026-09-29-seguridad-rls.sql): sumamos la nueva.
grant insert (turno_preferido), update (turno_preferido) on perfiles_prestador to authenticated;
