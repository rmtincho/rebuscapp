// Solo servidor. Publicidad propia (tabla anuncios, ver
// scripts/sql/2026-09-29-anuncios.sql). La impresión la cuenta el banner
// cuando de verdad se ve (BannerPublicidad). Si la tabla no existe o no hay
// anuncios, el espacio no muestra nada.

import { createAdminClient } from '@/lib/supabase/admin'
import { elegirAnuncio, type AnuncioElegible } from '@/lib/elegirAnuncio'

export type Espacio = 'inicio_movil' | 'inicio_web' | 'lateral_web' | 'lista' | 'pedido' | 'notificaciones' | 'perfil_web'

export type Anuncio = AnuncioElegible

type Fila = Anuncio & { espacio: Espacio }

// Anuncios activos y vigentes hoy de esos espacios
async function vigentes(espacios: Espacio[]): Promise<Fila[]> {
  const { data, error } = await createAdminClient()
    .from('anuncios')
    .select('id, anunciante, espacio, rubro, imagen_url, texto_alternativo, enlace, desde, hasta')
    .in('espacio', espacios)
    .eq('activo', true)
  if (error || !data) return []
  // Fechas como 'AAAA-MM-DD': se comparan como texto
  const hoy = new Date().toISOString().slice(0, 10)
  return data
    .filter((a) => (!a.desde || a.desde <= hoy) && (!a.hasta || a.hasta >= hoy))
    .map((a) => ({
      id: a.id,
      anunciante: a.anunciante,
      espacio: a.espacio,
      rubro: a.rubro ?? null,
      imagen_url: a.imagen_url,
      texto_alternativo: a.texto_alternativo,
      con_enlace: !!a.enlace && /^https?:\/\//.test(a.enlace),
    }))
}

// Semilla al azar para que los anuncios roten entre visitas
export function semillaAnuncios() {
  return Math.floor(Math.random() * 1_000_000)
}

// Un anuncio por espacio (o null). Con `rubro`, prefiere los de ese rubro.
export async function anunciosPara<E extends Espacio>(espacios: E[], rubro: string | null = null): Promise<Record<E, Anuncio | null>> {
  const filas = await vigentes(espacios)
  const semilla = semillaAnuncios()
  return Object.fromEntries(
    espacios.map((e) => [e, elegirAnuncio(filas.filter((f) => f.espacio === e), rubro, semilla)])
  ) as Record<E, Anuncio | null>
}

// Todos los de un espacio, para elegir en el navegador según el filtro de
// rubro que tenga puesto el usuario (la tarjeta "Patrocinado" de las listas)
export async function anunciosDeEspacio(espacio: Espacio): Promise<Anuncio[]> {
  return (await vigentes([espacio])).map(({ id, anunciante, rubro, imagen_url, texto_alternativo, con_enlace }) => ({
    id,
    anunciante,
    rubro,
    imagen_url,
    texto_alternativo,
    con_enlace,
  }))
}

// Todos los anuncios generales (sin rubro) de un espacio, para un carrusel.
// Arranca en uno distinto en cada visita, así ninguno sale siempre primero.
export async function anunciosParaCarrusel(espacio: Espacio): Promise<Anuncio[]> {
  const generales = (await anunciosDeEspacio(espacio)).filter((a) => !a.rubro)
  if (generales.length < 2) return generales
  const inicio = semillaAnuncios() % generales.length
  return [...generales.slice(inicio), ...generales.slice(0, inicio)]
}
