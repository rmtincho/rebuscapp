-- Logo de la empresa (o la foto de perfil, a elección) en los trabajos
-- publicados "en nombre de una empresa".
-- Correr una vez en Supabase → SQL Editor, ANTES de subir el código que lo
-- usa (las consultas piden la columna). Se puede correr más de una vez.

-- 1. Columna en el pedido. Solo se aceptan logos de un bucket "logos" de
--    Supabase y dentro de la carpeta de quien publica: no se puede poner la
--    URL de cualquier imagen de internet.
alter table pedidos add column if not exists logo_comercio_url text;
alter table pedidos drop constraint if exists pedidos_logo_comercio_url_check;
alter table pedidos add constraint pedidos_logo_comercio_url_check check (
  logo_comercio_url is null
  or logo_comercio_url ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/logos/' || solicitante_id::text || '/[^/]+$')
);

-- Qué imagen se ve en el trabajo de una empresa: 'logo' (el de arriba) o
-- 'foto' (la foto de perfil de quien publica). null = el ícono del rubro.
alter table pedidos add column if not exists imagen_empresa text;
alter table pedidos drop constraint if exists pedidos_imagen_empresa_check;
alter table pedidos add constraint pedidos_imagen_empresa_check check (imagen_empresa in ('logo', 'foto'));

-- 2. Bucket público (los logos se ven en las tarjetas), solo imágenes de
--    hasta 2 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Cada uno sube, cambia y borra solo en su carpeta (logos/<su id>/...).
drop policy if exists "logos: subir en su carpeta" on storage.objects;
create policy "logos: subir en su carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "logos: cambiar en su carpeta" on storage.objects;
create policy "logos: cambiar en su carpeta" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "logos: borrar en su carpeta" on storage.objects;
create policy "logos: borrar en su carpeta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
