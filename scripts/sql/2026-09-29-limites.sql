-- Límites de uso contra el spam. Los controla la base, así que valen
-- aunque alguien llame a Supabase sin pasar por la app.
--   · 1 pedido cada 24 horas (los eliminados también cuentan)
--   · 5 postulaciones cada 24 horas
--   · 10 mensajes por minuto en una misma conversación
-- Los mismos números están en lib/limites.ts: si se cambian, cambiar ambos.
-- Correr una vez en Supabase → SQL Editor. Se puede correr más de una vez.

begin;

-- Índices para que contar sea rápido
create index if not exists pedidos_solicitante_fecha_idx on pedidos (solicitante_id, fecha_creacion);
create index if not exists postulaciones_prestador_fecha_idx on postulaciones (prestador_id, fecha);
create index if not exists mensajes_conversacion_fecha_idx on mensajes (emisor_id, receptor_id, pedido_id, fecha);

-- security definer: cuenta todas las filas del usuario aunque RLS no
-- le deje ver alguna (por ejemplo, un pedido eliminado)
create or replace function limite_pedidos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from pedidos
      where solicitante_id = new.solicitante_id
        and fecha_creacion > now() - interval '24 hours') >= 1 then
    raise exception 'Podés publicar 1 pedido cada 24 horas.';
  end if;
  return new;
end $$;

create or replace function limite_postulaciones() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from postulaciones
      where prestador_id = new.prestador_id
        and fecha > now() - interval '24 hours') >= 5 then
    raise exception 'Podés postularte a 5 trabajos cada 24 horas.';
  end if;
  return new;
end $$;

create or replace function limite_mensajes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from mensajes
      where emisor_id = new.emisor_id
        and receptor_id = new.receptor_id
        and pedido_id = new.pedido_id
        and fecha > now() - interval '1 minute') >= 10 then
    raise exception 'Estás mandando muchos mensajes seguidos. Esperá un momento.';
  end if;
  return new;
end $$;

-- Solo las usan los triggers
revoke all on function limite_pedidos() from public, anon, authenticated;
revoke all on function limite_postulaciones() from public, anon, authenticated;
revoke all on function limite_mensajes() from public, anon, authenticated;

drop trigger if exists limite_pedidos on pedidos;
create trigger limite_pedidos before insert on pedidos
  for each row execute function limite_pedidos();

drop trigger if exists limite_postulaciones on postulaciones;
create trigger limite_postulaciones before insert on postulaciones
  for each row execute function limite_postulaciones();

drop trigger if exists limite_mensajes on mensajes;
create trigger limite_mensajes before insert on mensajes
  for each row execute function limite_mensajes();

commit;
