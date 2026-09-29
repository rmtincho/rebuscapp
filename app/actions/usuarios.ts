'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Guarda los datos personales del usuario logueado. Va por el servidor
// porque edad, DNI y mail no son legibles desde el navegador (ver
// scripts/sql/2026-09-29-seguridad-rls.sql), y un upsert que los
// actualiza necesita poder leerlos. El usuario sale de la sesión y los
// valores se validan acá: no se confía en lo que manda el cliente.
export async function guardarDatosPersonales(datos: {
  nombre?: string;
  apellido?: string;
  edad?: number;
  dni?: string;
  fotoPerfilUrl?: string;
  rolPrestadorActivo?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Tu sesión expiró, volvé a loguearte.' };

  const fila: Record<string, unknown> = { id: user.id, email: user.email };

  if (datos.nombre !== undefined) {
    const nombre = String(datos.nombre).trim();
    if (nombre.length < 2 || nombre.length > 60) return { ok: false as const, error: 'Ingresá tu nombre.' };
    fila.nombre = nombre;
  }
  if (datos.apellido !== undefined) {
    const apellido = String(datos.apellido).trim();
    if (apellido.length < 2 || apellido.length > 60) return { ok: false as const, error: 'Ingresá tu apellido.' };
    fila.apellido = apellido;
  }
  if (datos.edad !== undefined) {
    const edad = Number(datos.edad);
    if (!Number.isInteger(edad) || edad < 18 || edad > 99) {
      return { ok: false as const, error: 'Ingresá una edad válida (entre 18 y 99).' };
    }
    fila.edad = edad;
  }
  if (datos.dni !== undefined) {
    const dni = String(datos.dni).replace(/\D/g, '');
    if (dni.length < 7 || dni.length > 8) {
      return { ok: false as const, error: 'Ingresá un DNI válido, sin puntos (solo números).' };
    }
    fila.dni = dni;
  }
  if (datos.fotoPerfilUrl !== undefined) {
    // Solo fotos de nuestro propio storage de Supabase
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/`;
    if (typeof datos.fotoPerfilUrl !== 'string' || !datos.fotoPerfilUrl.startsWith(base)) {
      return { ok: false as const, error: 'Foto inválida.' };
    }
    fila.foto_perfil_url = datos.fotoPerfilUrl;
  }
  if (datos.rolPrestadorActivo !== undefined) {
    fila.rol_prestador_activo = !!datos.rolPrestadorActivo;
  }

  // Si la fila todavía no existe hace falta un nombre (es obligatorio)
  if (fila.nombre === undefined) {
    const { data: existente } = await createAdminClient()
      .from('usuarios')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (!existente) fila.nombre = user.email?.split('@')[0] || 'Usuario';
  }

  const { error } = await createAdminClient().from('usuarios').upsert(fila, { onConflict: 'id' });
  if (error) {
    console.error('No se pudieron guardar los datos personales:', error.message);
    return { ok: false as const, error: 'No pudimos guardar tus datos: ' + error.message };
  }
  return { ok: true as const };
}

// Elimina la cuenta del usuario logueado. La fila de usuarios no se borra
// porque la referencian pedidos, mensajes y calificaciones de otras
// personas: se anonimiza (queda como "Usuario eliminado") y se borra todo
// lo que es solo suyo. Necesita scripts/sql/2026-09-29-eliminar-cuenta.sql.
export async function eliminarCuenta(confirmacion: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Tu sesión expiró, volvé a loguearte.' };
  if (String(confirmacion).trim().toUpperCase() !== 'ELIMINAR') {
    return { ok: false as const, error: 'Escribí ELIMINAR para confirmar.' };
  }

  const admin = createAdminClient();

  // Primero los datos personales: si esto falla no se toca nada más
  const { error: errorAnonimizar } = await admin
    .from('usuarios')
    .update({
      nombre: 'Usuario',
      apellido: 'eliminado',
      email: null,
      edad: null,
      dni: null,
      telefono: null,
      foto_perfil_url: null,
      ubicacion_lat: null,
      ubicacion_lng: null,
      rol_prestador_activo: false,
      rol_solicitante_activo: false,
      notificaciones_activas: false,
      eliminado_en: new Date().toISOString(),
    })
    .eq('id', user.id);
  if (errorAnonimizar) {
    console.error('No se pudo anonimizar el usuario:', errorAnonimizar.message);
    return { ok: false as const, error: 'No pudimos eliminar tu cuenta. Probá de nuevo en un rato.' };
  }

  // El resto es limpieza: si algún paso falla se registra y se sigue
  const pasos = [
    // Sus pedidos abiertos quedan como eliminados (igual que "Eliminar pedido").
    // Los que están en curso siguen: la otra parte los puede cerrar.
    admin.from('pedidos').update({ estado: 'cancelado' }).eq('solicitante_id', user.id).eq('estado', 'abierto'),
    admin.from('postulaciones').delete().eq('prestador_id', user.id).eq('estado', 'pendiente'),
    admin.from('prestador_categorias').delete().eq('prestador_id', user.id),
    admin.from('perfiles_prestador').delete().eq('usuario_id', user.id),
    admin.from('push_subscriptions').delete().eq('usuario_id', user.id),
    admin.from('notificaciones').delete().eq('usuario_id', user.id),
  ];
  for (const { error } of await Promise.all(pasos)) {
    if (error) console.error('Eliminar cuenta, paso con error:', error.message);
  }

  const { data: fotos } = await admin.storage.from('avatars').list(user.id);
  if (fotos?.length) {
    await admin.storage.from('avatars').remove(fotos.map((f) => `${user.id}/${f.name}`));
  }

  // Borrado "suave" en Auth: no puede volver a entrar y el mail queda libre
  // para una cuenta nueva, pero el id sigue existiendo para las referencias.
  const { error: errorAuth } = await admin.auth.admin.deleteUser(user.id, true);
  if (errorAuth) console.error('No se pudo borrar el usuario de Auth:', errorAuth.message);

  await supabase.auth.signOut();
  return { ok: true as const };
}
