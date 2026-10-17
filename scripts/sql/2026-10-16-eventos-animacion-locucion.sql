-- Categorías nuevas en "Eventos y gastronomía": animación de fiestas para
-- grandes (la infantil ya estaba), conductor/a o maestro/a de ceremonias,
-- locutor/a / voz en off y músicos en vivo. Correr una vez en Supabase →
-- SQL Editor. Se puede correr más de una vez.

insert into categorias (slug, nombre, grupo_slug, requiere_matricula)
select v.slug, v.nombre, 'eventos', false
from (values
  ('animacion-fiestas', 'Animación de fiestas (casamientos, 15, hora loca)'),
  ('conductor-eventos', 'Conductor/a / maestro/a de ceremonias'),
  ('locutor', 'Locutor/a / voz en off'),
  ('musica-en-vivo', 'Músicos y cantantes en vivo')
) as v (slug, nombre)
on conflict (slug) do update set nombre = excluded.nombre, grupo_slug = excluded.grupo_slug;

-- Ver cómo quedó:
--   select slug, nombre from categorias where grupo_slug = 'eventos' order by nombre;
