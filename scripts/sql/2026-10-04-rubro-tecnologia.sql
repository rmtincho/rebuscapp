-- Rubro "Tecnología y soporte" con sus categorías (programadores,
-- analistas, QA, soporte IT, redes, datos, etc.). Correr una vez en
-- Supabase → SQL Editor. Se puede correr más de una vez.
--
-- Si ya existe un rubro cuyo nombre empieza con "Tecnolog" (se había creado
-- a mano, vacío), las categorías se cargan en ese mismo y se le pone este
-- nombre; si no existe, se crea con slug 'tecnologia' (el de categorias.json).

do $$
declare
  grupo text;
begin
  select slug into grupo from categorias_grupo where nombre ilike 'tecnolog%' order by slug limit 1;
  if grupo is null then
    grupo := 'tecnologia';
    insert into categorias_grupo (slug, nombre) values (grupo, 'Tecnología y soporte');
  else
    update categorias_grupo set nombre = 'Tecnología y soporte' where slug = grupo;
  end if;

  insert into categorias (slug, nombre, grupo_slug, requiere_matricula)
  select v.slug, v.nombre, grupo, false
  from (values
    ('programador-web', 'Programador/a web'),
    ('desarrollador-apps', 'Desarrollador/a de apps'),
    ('desarrollador-software', 'Desarrollador/a de software'),
    ('analista-sistemas', 'Analista de sistemas'),
    ('analista-funcional', 'Analista funcional'),
    ('tester-qa', 'Tester / QA'),
    ('soporte-it', 'Soporte IT / mesa de ayuda'),
    ('administrador-redes', 'Administrador/a de redes y servidores'),
    ('analista-datos', 'Analista de datos'),
    ('ciberseguridad', 'Ciberseguridad'),
    ('pagina-web-tienda', 'Página web o tienda online'),
    ('programador-plc', 'Programador/a de PLC / automatización'),
    ('community-manager', 'Community manager / redes sociales')
  ) as v (slug, nombre)
  on conflict (slug) do update set nombre = excluded.nombre, grupo_slug = excluded.grupo_slug;
end
$$;

-- Ver cómo quedó:
--   select g.slug, g.nombre, count(c.slug) from categorias_grupo g
--   left join categorias c on c.grupo_slug = g.slug
--   where g.nombre ilike 'tecnolog%' group by g.slug, g.nombre;
