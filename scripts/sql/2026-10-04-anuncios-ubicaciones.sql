-- Anuncios: un anuncio puede salir en varias ubicaciones, con una imagen
-- por formato, y el nombre del negocio pasa a ser opcional.
-- Correr una vez en Supabase → SQL Editor, después de 2026-09-29-anuncios.sql.
-- Se puede correr más de una vez.
--
-- Formatos de imagen (cada ubicación usa uno):
--   imagen_url             banner      1200 x 480  (5:2)  inicio_movil, inicio_web (carrusel), lista, pedido, notificaciones
--   imagen_lateral_url     lateral      600 x 500  (6:5)  lateral_web, perfil_web
--   imagen_horizontal_url  (sin uso) guarda la franja 6:1 que tenían los anuncios
--                          viejos de inicio_web: ahora ese espacio es un carrusel
--                          con imagen banner, y hay que subirles una.
--
-- "Al tocar" sigue en la columna enlace: una página (https://...), un
-- WhatsApp (https://wa.me/...) o una llamada (tel:+54...). Vacío = no se toca.

begin;

-- Varias ubicaciones por anuncio
alter table anuncios add column if not exists espacios text[] not null default '{}';
update anuncios set espacios = array[espacio] where espacios = '{}' and espacio is not null;

alter table anuncios drop constraint if exists anuncios_espacios_check;
alter table anuncios add constraint anuncios_espacios_check check (
  cardinality(espacios) > 0
  and espacios <@ array['inicio_movil', 'inicio_web', 'lateral_web', 'lista', 'pedido', 'notificaciones', 'perfil_web']::text[]
);
create index if not exists anuncios_espacios_idx on anuncios using gin (espacios);

-- La columna vieja queda solo por compatibilidad
alter table anuncios alter column espacio drop not null;
alter table anuncios drop constraint if exists anuncios_espacio_check;

-- Una imagen por formato; la de banner ya no es obligatoria
alter table anuncios add column if not exists imagen_horizontal_url text;
alter table anuncios add column if not exists imagen_lateral_url text;
alter table anuncios alter column imagen_url drop not null;

-- Los anuncios viejos de compu tenían su imagen en imagen_url: pasarla
-- a la columna de su formato (la franja de inicio_web queda guardada, sin uso)
update anuncios set imagen_horizontal_url = imagen_url
 where espacio = 'inicio_web' and imagen_horizontal_url is null;
update anuncios set imagen_lateral_url = imagen_url
 where espacio in ('lateral_web', 'perfil_web') and imagen_lateral_url is null;
update anuncios set imagen_url = null
 where espacio in ('inicio_web', 'lateral_web', 'perfil_web')
   and (imagen_url = imagen_horizontal_url or imagen_url = imagen_lateral_url);

-- Nombre del negocio opcional
alter table anuncios alter column anunciante drop not null;

commit;
