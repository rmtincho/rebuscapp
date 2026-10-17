-- Rubro "Modelos y promoción" con sus categorías (modelo publicitario,
-- catálogo, pasarela, manos y pies, rostro y cabello, modelo vivo,
-- promotor/a, extras). Correr una vez en Supabase → SQL Editor. Se puede
-- correr más de una vez.
--
-- Hombre/mujer no se separa en categorías: los nombres van con "/a" como el
-- resto, y si el pedido necesita uno u otro lo dice en la descripción.

insert into categorias_grupo (slug, nombre) values ('modelos', 'Modelos y promoción')
on conflict (slug) do update set nombre = excluded.nombre;

insert into categorias (slug, nombre, grupo_slug, requiere_matricula)
select v.slug, v.nombre, 'modelos', false
from (values
  ('modelo-publicitario', 'Modelo publicitario/a (fotos y video)'),
  ('modelo-catalogo', 'Modelo de catálogo y ropa'),
  ('modelo-pasarela', 'Modelo de pasarela / desfiles'),
  ('modelo-manos-pies', 'Modelo de manos y pies'),
  ('modelo-rostro-cabello', 'Modelo de rostro y cabello'),
  ('modelo-vivo-arte', 'Modelo vivo para dibujo y arte'),
  ('promotor-azafata', 'Promotor/a / azafata de eventos'),
  ('extra-figurante', 'Extra / figurante (TV, cine, publicidad)')
) as v (slug, nombre)
on conflict (slug) do update set nombre = excluded.nombre, grupo_slug = excluded.grupo_slug;

-- Ver cómo quedó:
--   select slug, nombre from categorias where grupo_slug = 'modelos' order by nombre;
