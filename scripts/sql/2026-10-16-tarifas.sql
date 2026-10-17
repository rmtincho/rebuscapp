-- Tarifa del trabajador por categoría (opcional) y sueldo pretendido.
-- Correr una vez en Supabase → SQL Editor, ANTES de subir el código que lo
-- usa (las consultas piden las columnas). Se puede correr más de una vez.

-- Por cada categoría que eligió: monto en pesos y si es por hora, por
-- jornada o por trabajo. null = no la puso.
alter table prestador_categorias add column if not exists tarifa integer;
alter table prestador_categorias add column if not exists tarifa_unidad text;
alter table prestador_categorias drop constraint if exists prestador_categorias_tarifa_check;
alter table prestador_categorias add constraint prestador_categorias_tarifa_check
  check (tarifa is null or (tarifa > 0 and tarifa < 100000000));
alter table prestador_categorias drop constraint if exists prestador_categorias_tarifa_unidad_check;
alter table prestador_categorias add constraint prestador_categorias_tarifa_unidad_check
  check (tarifa_unidad in ('hora', 'jornada', 'trabajo'));

-- Sueldo pretendido por mes, para un puesto fijo
alter table perfiles_prestador add column if not exists sueldo_pretendido integer;
alter table perfiles_prestador drop constraint if exists perfiles_prestador_sueldo_pretendido_check;
alter table perfiles_prestador add constraint perfiles_prestador_sueldo_pretendido_check
  check (sueldo_pretendido is null or (sueldo_pretendido > 0 and sueldo_pretendido < 1000000000));

-- El perfil se edita solo por columnas permitidas (2026-09-29-seguridad-rls.sql)
grant insert (sueldo_pretendido), update (sueldo_pretendido) on perfiles_prestador to authenticated;
