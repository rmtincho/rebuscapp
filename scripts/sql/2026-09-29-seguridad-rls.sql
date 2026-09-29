-- Endurecimiento de permisos (RLS y columnas).
-- Correr una vez en Supabase → SQL Editor, DESPUÉS de deployar el código
-- que lee edad/DNI propios desde el servidor (commit "Seguridad: ...").
-- Todo va en una transacción: si algo falla, no se aplica nada.

begin;

-- ------------------------------------------------------------------
-- 1. Nada para usuarios sin sesión. Toda la app exige login (proxy.ts),
--    y la clave anon viaja dentro de la app: con ella cualquiera podía
--    leer las tablas sin entrar.
-- ------------------------------------------------------------------
revoke select, insert, update, delete on all tables in schema public from anon;

-- ------------------------------------------------------------------
-- 2. usuarios: DNI, edad, mail, teléfono y ubicación dejan de ser
--    públicos. Los demás solo ven lo que muestra la app.
--    Cada uno lee sus propios datos privados desde el servidor.
-- ------------------------------------------------------------------
revoke select on usuarios from authenticated;
grant select (
  id, nombre, apellido, foto_perfil_url, telefono_verificado,
  rol_prestador_activo, rol_solicitante_activo, pide_videollamada_previa, created_at
) on usuarios to authenticated;

-- Y nadie se puede marcar a sí mismo como "teléfono verificado"
revoke insert, update on usuarios from authenticated;
grant insert (
  id, email, nombre, apellido, foto_perfil_url, edad, dni, telefono,
  rol_prestador_activo, rol_solicitante_activo, pide_videollamada_previa,
  ubicacion_lat, ubicacion_lng, notificaciones_activas
) on usuarios to authenticated;
grant update (
  id, email, nombre, apellido, foto_perfil_url, edad, dni, telefono,
  rol_prestador_activo, rol_solicitante_activo, pide_videollamada_previa,
  ubicacion_lat, ubicacion_lng, notificaciones_activas
) on usuarios to authenticated;

-- ------------------------------------------------------------------
-- 3. perfiles_prestador: el trabajador edita su perfil, pero no su
--    verificación de identidad, su rating ni sus trabajos completados.
-- ------------------------------------------------------------------
revoke insert, update on perfiles_prestador from authenticated;
grant insert (
  usuario_id, tarifa_referencia, tarifa_unidad, experiencia, estudios, sobre_mi,
  disponible, porcentaje_perfil_completo, nivel_educativo, tipo_busqueda,
  disponibilidad_horaria, tiene_carnet, carnets_declarados, idiomas_declarados,
  visible_en_listado
) on perfiles_prestador to authenticated;
grant update (
  usuario_id, tarifa_referencia, tarifa_unidad, experiencia, estudios, sobre_mi,
  disponible, porcentaje_perfil_completo, nivel_educativo, tipo_busqueda,
  disponibilidad_horaria, tiene_carnet, carnets_declarados, idiomas_declarados,
  visible_en_listado
) on perfiles_prestador to authenticated;

-- ------------------------------------------------------------------
-- 4. mensajes: solo se puede escribir dentro de una conversación real
--    (el dueño del pedido con alguien que se postuló), y el receptor
--    solo puede marcar "leído", no cambiar el texto.
-- ------------------------------------------------------------------
drop policy if exists "mensajes: el emisor envía" on mensajes;
create policy "mensajes: el emisor envía dentro de una postulación" on mensajes
  for insert to authenticated
  with check (
    auth.uid() = mensajes.emisor_id
    and mensajes.emisor_id <> mensajes.receptor_id
    and exists (
      select 1
      from pedidos p
      join postulaciones po on po.pedido_id = p.id
      where p.id = mensajes.pedido_id
        and (
          (p.solicitante_id = mensajes.emisor_id and po.prestador_id = mensajes.receptor_id)
          or (p.solicitante_id = mensajes.receptor_id and po.prestador_id = mensajes.emisor_id)
        )
    )
  );

revoke update on mensajes from authenticated;
grant update (leido) on mensajes to authenticated;

-- ------------------------------------------------------------------
-- 5. postulaciones: el dueño del pedido solo cambia el estado
--    (aceptada / rechazada), no el mensaje ni quién se postuló.
-- ------------------------------------------------------------------
revoke update on postulaciones from authenticated;
grant update (estado) on postulaciones to authenticated;

-- ------------------------------------------------------------------
-- 6. calificaciones: solo entre las dos partes de un trabajo asignado.
--    Antes cualquiera podía calificar a cualquiera.
-- ------------------------------------------------------------------
drop policy if exists "calificaciones: el calificador crea la suya" on calificaciones;
create policy "calificaciones: solo las partes de un trabajo asignado" on calificaciones
  for insert to authenticated
  with check (
    auth.uid() = calificaciones.calificador_id
    and calificaciones.calificador_id <> calificaciones.calificado_id
    and exists (
      select 1
      from pedidos p
      where p.id = calificaciones.pedido_id
        and p.estado in ('en_curso', 'completado')
        and (
          (p.solicitante_id = calificaciones.calificador_id and p.prestador_asignado_id = calificaciones.calificado_id)
          or (p.prestador_asignado_id = calificaciones.calificador_id and p.solicitante_id = calificaciones.calificado_id)
        )
    )
  );

-- ------------------------------------------------------------------
-- 7. no_concretados: solo lo reporta una de las dos partes del trabajo.
-- ------------------------------------------------------------------
drop policy if exists "no_concretados: quien reporta crea su registro" on no_concretados;
create policy "no_concretados: una de las partes reporta" on no_concretados
  for insert to authenticated
  with check (
    auth.uid() = no_concretados.reportado_por
    and exists (
      select 1
      from pedidos p
      where p.id = no_concretados.pedido_id
        and no_concretados.reportado_por in (p.solicitante_id, p.prestador_asignado_id)
    )
  );

commit;
