// Solo servidor. Publicidad propia (tabla anuncios, ver
// scripts/sql/2026-09-29-anuncios.sql y 2026-10-04-anuncios-ubicaciones.sql).
// Un anuncio puede estar en varias ubicaciones y tiene una imagen por
// formato; en cada ubicación se usa la de su formato. La impresión la cuenta
// el banner cuando de verdad se ve (BannerPublicidad). Si la tabla no existe
// o no hay anuncios, el espacio no muestra nada.

import { createAdminClient } from '@/lib/supabase/admin'
import { elegirAnuncio, type AnuncioElegible } from '@/lib/elegirAnuncio'
import { formatoDe } from '@/lib/espaciosAnuncios'
import { tipoEnlace } from '@/lib/enlaceAnuncio'

export type Espacio = 'inicio_movil' | 'inicio_web' | 'lateral_web' | 'lista' | 'pedido' | 'notificaciones' | 'perfil_web'

export type Anuncio = AnuncioElegible

type Fila = Anuncio & { espacio: Espacio }

type FilaTabla = {
  id: string
  anunciante: string | null
  espacios: string[]
  rubro: string | null
  imagen_url: string | null
  imagen_horizontal_url: string | null
  imagen_lateral_url: string | null
  texto_alternativo: string | null
  enlace: string | null
  desde: string | null
  hasta: string | null
}

// Lee los anuncios activos de esas ubicaciones. Si todavía no se corrió la
// migración de ubicaciones (no existe la columna espacios), usa la tabla
// vieja: un espacio y una sola imagen por anuncio.
async function leerActivos(espacios: Espacio[]): Promise<FilaTabla[]> {
  const admin = createAdminClient()
  const nueva = await admin
    .from('anuncios')
    .select('id, anunciante, espacios, rubro, imagen_url, imagen_horizontal_url, imagen_lateral_url, texto_alternativo, enlace, desde, hasta')
    .overlaps('espacios', espacios)
    .eq('activo', true)
  if (!nueva.error) return (nueva.data ?? []) as FilaTabla[]

  const vieja = await admin
    .from('anuncios')
    .select('id, anunciante, espacio, rubro, imagen_url, texto_alternativo, enlace, desde, hasta')
    .in('espacio', espacios)
    .eq('activo', true)
  if (vieja.error || !vieja.data) return []
  return vieja.data.map((a) => ({
    ...a,
    espacios: [a.espacio],
    // En la tabla vieja la imagen ya tenía la medida de su espacio. La del
    // inicio en compu era una franja 6:1, que no sirve para el carrusel.
    imagen_url: a.espacio === 'inicio_web' ? null : a.imagen_url,
    imagen_horizontal_url: null,
    imagen_lateral_url: a.imagen_url,
  }))
}

// Anuncios activos y vigentes hoy, una fila por cada ubicación pedida en
// la que están y para la que tienen imagen
async function vigentes(espacios: Espacio[]): Promise<Fila[]> {
  const filas = await leerActivos(espacios)
  // Fechas como 'AAAA-MM-DD': se comparan como texto
  const hoy = new Date().toISOString().slice(0, 10)
  const resultado: Fila[] = []
  for (const a of filas) {
    if ((a.desde && a.desde > hoy) || (a.hasta && a.hasta < hoy)) continue
    const tipo = tipoEnlace(a.enlace)
    for (const espacio of espacios) {
      if (!a.espacios.includes(espacio)) continue
      const imagen = a[formatoDe(espacio).columna]
      if (!imagen) continue
      resultado.push({
        id: a.id,
        anunciante: a.anunciante,
        espacio,
        rubro: a.rubro ?? null,
        imagen_url: imagen,
        texto_alternativo: a.texto_alternativo,
        con_enlace: tipo !== null,
        nueva_pestana: tipo === 'web',
      })
    }
  }
  return resultado
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se saca la ubicación, el navegador no la necesita
  return (await vigentes([espacio])).map(({ espacio: _, ...anuncio }) => anuncio)
}

// Todos los anuncios generales (sin rubro) de un espacio, para un carrusel.
// Arranca en uno distinto en cada visita, así ninguno sale siempre primero.
export async function anunciosParaCarrusel(espacio: Espacio): Promise<Anuncio[]> {
  const generales = (await anunciosDeEspacio(espacio)).filter((a) => !a.rubro)
  if (generales.length < 2) return generales
  const inicio = semillaAnuncios() % generales.length
  return [...generales.slice(inicio), ...generales.slice(0, inicio)]
}
