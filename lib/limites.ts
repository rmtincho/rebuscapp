// Solo servidor. Límites de uso contra el spam: la base los hace cumplir
// (scripts/sql/2026-09-29-limites.sql, mismos números) y acá se consultan
// para avisarle al usuario antes de que complete un formulario.

import { createAdminClient } from '@/lib/supabase/admin'

export const PEDIDOS_POR_DIA = 1
export const POSTULACIONES_POR_DIA = 5

const DIA_MS = 24 * 60 * 60 * 1000

function hace24h() {
  return new Date(Date.now() - DIA_MS).toISOString()
}

// Si ya publicó el máximo de pedidos en las últimas 24 h, cuándo puede
// volver a publicar. null = puede publicar ahora.
export async function proximoPedidoPermitido(usuarioId: string): Promise<Date | null> {
  const { data } = await createAdminClient()
    .from('pedidos')
    .select('fecha_creacion')
    .eq('solicitante_id', usuarioId)
    .gt('fecha_creacion', hace24h())
    .order('fecha_creacion', { ascending: true })

  if (!data || data.length < PEDIDOS_POR_DIA) return null
  // El cupo se libera cuando el más viejo de la ventana cumple 24 h
  return new Date(new Date(data[data.length - PEDIDOS_POR_DIA].fecha_creacion).getTime() + DIA_MS)
}

// Igual, para postulaciones
export async function proximaPostulacionPermitida(usuarioId: string): Promise<Date | null> {
  const { data } = await createAdminClient()
    .from('postulaciones')
    .select('fecha')
    .eq('prestador_id', usuarioId)
    .gt('fecha', hace24h())
    .order('fecha', { ascending: true })

  if (!data || data.length < POSTULACIONES_POR_DIA) return null
  return new Date(new Date(data[data.length - POSTULACIONES_POR_DIA].fecha).getTime() + DIA_MS)
}
