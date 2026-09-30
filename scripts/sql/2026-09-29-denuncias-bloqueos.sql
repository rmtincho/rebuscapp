-- Denunciar y bloquear.
-- Correr una vez en Supabase → SQL Editor, ANTES de deployar el código.
-- Todo va en una transacción: si algo falla, no se aplica nada.

begin;

-- ------------------------------------------------------------------
-- 1. denuncias: las escribe y lee solo el servidor (app/actions/moderacion.ts).
--    Nadie puede ver quién lo denunció.
-- ------------------------------------------------------------------
create table if not exists denuncias (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid not null references usuarios(id),
  denunciado_id uuid references usuarios(id),
  pedido_id uuid references pedidos(id),
  motivo text not null check (motivo in ('estafa', 'acoso', 'falso', 'ilegal', 'otro')),
  detalle text check (char_length(detalle) <= 500),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'revisada')),
  resolucion text,  -- qué se decidió (advertencia, suspensión, sin pruebas...), lo completa quien modera
  created_at timestamptz not null default now(),
  check (denunciado_id is not null or pedido_id is not null)
);

-- Por si la tabla ya existía de una corrida anterior de este archivo
alter table denuncias add column if not exists resolucion text;

create index if not exists denuncias_pendientes_idx on denuncias (created_at) where estado = 'pendiente';

alter table denuncias enable row level security;
revoke all on denuncias from anon, authenticated;

-- ------------------------------------------------------------------
-- 2. bloqueos: cada uno ve a quién bloqueó. Se escriben desde el servidor.
-- ------------------------------------------------------------------
create table if not exists bloqueos (
  bloqueador_id uuid not null references usuarios(id),
  bloqueado_id uuid not null references usuarios(id),
  created_at timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);

create index if not exists bloqueos_bloqueado_idx on bloqueos (bloqueado_id);

alter table bloqueos enable row level security;
revoke all on bloqueos from anon, authenticated;
grant select on bloqueos to authenticated;

drop policy if exists "bloqueos: cada uno ve los suyos" on bloqueos;
create policy "bloqueos: cada uno ve los suyos" on bloqueos
  for select to authenticated
  using (auth.uid() = bloqueador_id);

-- ¿Alguno de los dos bloqueó al otro? Corre con permisos del dueño para
-- ver los bloqueos en las dos direcciones sin mostrárselos al usuario.
create or replace function hay_bloqueo(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from bloqueos
    where (bloqueador_id = a and bloqueado_id = b)
       or (bloqueador_id = b and bloqueado_id = a)
  )
$$;

revoke all on function hay_bloqueo(uuid, uuid) from public, anon;
grant execute on function hay_bloqueo(uuid, uuid) to authenticated;

-- ------------------------------------------------------------------
-- 3. Con un bloqueo de por medio no se pueden mandar mensajes ni
--    postularse a los pedidos del otro. Son políticas "restrictive":
--    se suman a las que ya existen, no las reemplazan.
-- ------------------------------------------------------------------
drop policy if exists "mensajes: sin bloqueos" on mensajes;
create policy "mensajes: sin bloqueos" on mensajes
  as restrictive
  for insert to authenticated
  with check (not hay_bloqueo(mensajes.emisor_id, mensajes.receptor_id));

drop policy if exists "postulaciones: sin bloqueos" on postulaciones;
create policy "postulaciones: sin bloqueos" on postulaciones
  as restrictive
  for insert to authenticated
  with check (
    not exists (
      select 1 from pedidos p
      where p.id = postulaciones.pedido_id
        and hay_bloqueo(postulaciones.prestador_id, p.solicitante_id)
    )
  );

commit;

-- ------------------------------------------------------------------
-- Moderación a mano (no correr ahora; son ejemplos para cuando llegue
-- una denuncia):
--
--   Ver las pendientes:
--     select * from denuncias where estado = 'pendiente' order by created_at;
--
--   Dar de baja un pedido (queda como "eliminado"):
--     update pedidos set estado = 'cancelado' where id = '<pedido_id>';
--
--   Suspender una cuenta (no puede volver a entrar; la sesión abierta
--   se corta en menos de una hora):
--     update auth.users set banned_until = 'infinity' where id = '<usuario_id>';
--     update perfiles_prestador set visible_en_listado = false where usuario_id = '<usuario_id>';
--     update pedidos set estado = 'cancelado' where solicitante_id = '<usuario_id>' and estado = 'abierto';
--
--   Levantar la suspensión:
--     update auth.users set banned_until = null where id = '<usuario_id>';
--
--   Cerrar la denuncia anotando qué se decidió:
--     update denuncias set estado = 'revisada', resolucion = 'Advertencia por mail'
--     where id = '<denuncia_id>';
--
--   Antecedentes de una persona (denuncias previas y cómo se resolvieron):
--     select created_at, motivo, estado, resolucion from denuncias
--     where denunciado_id = '<usuario_id>' order by created_at;
-- ------------------------------------------------------------------
