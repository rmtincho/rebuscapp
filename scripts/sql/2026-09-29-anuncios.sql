-- Publicidad propia: banners fijos (sin popups) en espacios de la app.
-- Correr una vez en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- Cómo cargar un anuncio:
--   1. Storage → bucket "anuncios" → subir la imagen (se crea abajo).
--   2. Copiar su URL pública.
--   3. Table Editor → anuncios → Insert row: anunciante, espacio, imagen_url,
--      enlace (a dónde lleva el clic), desde / hasta (opcional).
--      rubro (opcional): el slug de un grupo de categorías (ej. 'plomeria',
--      'limpieza', 'automotor'). Con rubro, el anuncio sale cuando se miran
--      trabajos de ese rubro; sin rubro, sale para todos.
--
-- Espacios y medidas de imagen:
--   inicio_movil    Inicio en el celular, debajo de los accesos          1200 x 480  (5:2)
--   inicio_web      Inicio en compu, franja ancha                        1200 x 200  (6:1)
--   lateral_web     Inicio en compu, debajo de los filtros                600 x 500
--   lista           Dentro de la lista de trabajos ("Patrocinado")        1200 x 480  (5:2)
--   pedido          Final del detalle de un pedido                       1200 x 480  (5:2)
--   notificaciones  Final de la pantalla de notificaciones               1200 x 480  (5:2)
--   perfil_web      Perfil público en compu, debajo de la tarjeta         600 x 500
--
-- Si un espacio no tiene anuncios, no se muestra nada.

begin;

create table if not exists anuncios (
  id uuid primary key default gen_random_uuid(),
  anunciante text not null,
  espacio text not null check (
    espacio in ('inicio_movil', 'inicio_web', 'lateral_web', 'lista', 'pedido', 'notificaciones', 'perfil_web')
  ),
  rubro text, -- slug de categorias_grupo, o vacío = para todos
  imagen_url text not null,
  enlace text,
  texto_alternativo text,
  activo boolean not null default true,
  desde date,
  hasta date,
  impresiones bigint not null default 0,
  clics bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists anuncios_espacio_activos_idx on anuncios (espacio) where activo;

-- Solo el servidor lee y cuenta (con la clave de servicio). Nadie más.
alter table anuncios enable row level security;
revoke all on anuncios from anon, authenticated;

-- Sumar una impresión o un clic sin pisar los demás
create or replace function contar_anuncio(anuncio_id uuid, es_clic boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update anuncios
     set impresiones = impresiones + case when es_clic then 0 else 1 end,
         clics = clics + case when es_clic then 1 else 0 end
   where id = anuncio_id
$$;
revoke all on function contar_anuncio(uuid, boolean) from public, anon, authenticated;

-- Bucket público para las imágenes
insert into storage.buckets (id, name, public)
values ('anuncios', 'anuncios', true)
on conflict (id) do nothing;

commit;

-- Ver cómo rinde cada anuncio:
--   select anunciante, espacio, impresiones, clics,
--          round(100.0 * clics / nullif(impresiones, 0), 2) as ctr_pct
--   from anuncios order by created_at desc;
