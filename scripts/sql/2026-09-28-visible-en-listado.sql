-- Listado público de trabajadores (pestaña "Trabajadores" del inicio).
-- Cada prestador elige si aparece; por defecto nadie aparece.
-- Correr una vez en Supabase → SQL Editor.

alter table perfiles_prestador
  add column if not exists visible_en_listado boolean not null default false;

-- Índice parcial: el inicio solo consulta los que sí quieren aparecer
create index if not exists perfiles_prestador_visibles_idx
  on perfiles_prestador (usuario_id)
  where visible_en_listado;
