// Solo servidor. Publicidad propia (tabla anuncios, ver
// scripts/sql/2026-09-29-anuncios.sql): elige un anuncio activo por espacio.
// La impresión la cuenta el banner cuando de verdad se ve (BannerPublicidad). Si la tabla no existe o no hay anuncios, devuelve
// null y el espacio muestra "Anunciá tu negocio acá".

import { createAdminClient } from '@/lib/supabase/admin'

export type Espacio = 'inicio_movil' | 'inicio_web' | 'lateral_web' | 'pedido'

export type Anuncio = {
  id: string
  anunciante: string
  imagen_url: string
  texto_alternativo: string | null
}

export async function anunciosPara<E extends Espacio>(espacios: E[]): Promise<Record<E, Anuncio | null>> {
  const resultado = Object.fromEntries(espacios.map((e) => [e, null])) as Record<E, Anuncio | null>
  const hoy = new Date().toISOString().slice(0, 10)
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('anuncios')
    .select('id, anunciante, espacio, imagen_url, texto_alternativo, desde, hasta')
    .in('espacio', espacios)
    .eq('activo', true)
  if (error || !data) return resultado

  // Vigentes hoy (fechas como 'AAAA-MM-DD': se comparan como texto)
  const vigentes = data.filter((a) => (!a.desde || a.desde <= hoy) && (!a.hasta || a.hasta >= hoy))

  for (const espacio of espacios) {
    const candidatos = vigentes.filter((a) => a.espacio === espacio)
    if (candidatos.length === 0) continue
    // Rotan: uno al azar en cada visita
    const elegido = candidatos[Math.floor(Math.random() * candidatos.length)]
    resultado[espacio] = {
      id: elegido.id,
      anunciante: elegido.anunciante,
      imagen_url: elegido.imagen_url,
      texto_alternativo: elegido.texto_alternativo,
    }
  }

  return resultado
}
