import { createAdminClient } from '@/lib/supabase/admin'

// ¿Le faltan los datos básicos (nombre, apellido, edad y DNI)? Se piden
// una sola vez, en /completar-datos, antes de publicar (para postularse,
// app/pedidos/[id]/page.tsx hace el mismo chequeo y además usa la edad).
// Edad y DNI no son públicos: se leen con el cliente admin, siempre por el
// usuario de la sesión.
export async function faltanDatosBasicos(usuarioId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from('usuarios')
    .select('nombre, apellido, edad, dni')
    .eq('id', usuarioId)
    .maybeSingle()

  const nombreCompleto = (data?.nombre ?? '').trim().length >= 2 && (data?.apellido ?? '').trim().length >= 2
  return !nombreCompleto || !data?.edad || !data?.dni
}
