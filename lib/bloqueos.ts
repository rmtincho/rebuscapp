// Solo servidor. Con quién tiene un bloqueo el usuario, en cualquiera de
// las dos direcciones (los que bloqueó y los que lo bloquearon). Se usa
// para esconder pedidos, trabajadores y postulantes. Si la tabla todavía
// no existe (falta scripts/sql/2026-09-29-denuncias-bloqueos.sql), no
// esconde nada.

import { createAdminClient } from '@/lib/supabase/admin'

export async function idsConBloqueo(usuarioId: string): Promise<Set<string>> {
  const { data, error } = await createAdminClient()
    .from('bloqueos')
    .select('bloqueador_id, bloqueado_id')
    .or(`bloqueador_id.eq.${usuarioId},bloqueado_id.eq.${usuarioId}`)

  if (error) {
    console.error('No se pudieron leer los bloqueos:', error.message)
    return new Set()
  }
  return new Set(
    (data ?? []).map((b) => (b.bloqueador_id === usuarioId ? b.bloqueado_id : b.bloqueador_id))
  )
}

// ¿Este usuario bloqueó al otro? (Para mostrar "Bloquear" o "Desbloquear".)
export async function loBloqueo(usuarioId: string, otroId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from('bloqueos')
    .select('bloqueado_id')
    .eq('bloqueador_id', usuarioId)
    .eq('bloqueado_id', otroId)
    .maybeSingle()
  return !!data
}
