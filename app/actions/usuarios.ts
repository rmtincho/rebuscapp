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
    if (!Number.isInteger(edad) || edad < 16 || edad > 99) {
      return { ok: false as const, error: 'Ingresá una edad válida (entre 16 y 99).' };
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
