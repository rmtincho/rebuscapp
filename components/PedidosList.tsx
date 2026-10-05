'use client'

import { Fragment, useMemo } from 'react'
import { COLORS } from '@/lib/theme'
import { iconoParaCategoria } from '@/lib/categoryIcons'
import { haceCuanto } from '@/lib/fechas'
import {
  caracteristicas,
  tieneRequisitos,
  tituloDe,
  COLOR_CARACTERISTICA,
  COLOR_CUMPLE,
  COLOR_NO_CUMPLE,
  COLOR_PRECIO,
  ESTILO_ETIQUETA,
  type DatosTrabajo,
} from '@/lib/tarjetaTrabajo'

type Pedido = DatosTrabajo & {
  id: string
  descripcion: string
  // Puede faltar: sin ubicación no se muestra distancia (null contaría como 0,0)
  ubicacion_lat: number | null
  ubicacion_lng: number | null
  monto_ofrecido: number | null
  monto_a_convenir: boolean
  fecha_creacion: string
  es_comercio: boolean
  nombre_comercio: string | null
  categorias: { nombre: string; grupo_slug?: string | null } | null
  usuarios: { nombre: string } | null
  // Calculado en el servidor: ¿cumplo edad, estudios, carnet e idioma?
  cumple_requisitos?: boolean
}

function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function distanciaAlPedido(yo: { lat: number; lng: number }, pedido: Pedido) {
  if (pedido.ubicacion_lat === null || pedido.ubicacion_lng === null) return null
  return distanciaKm(yo.lat, yo.lng, pedido.ubicacion_lat, pedido.ubicacion_lng)
}

export type Ubicacion = { lat: number; lng: number }

// `patrocinado`: tarjeta de publicidad que se intercala en la lista.
// `cercaDe`: con una ubicación, se ordena por distancia y se muestra a
// cuántos km está cada uno (lo elige el panel de Filtros de FeedPedidos).
export default function PedidosList({
  pedidos,
  patrocinado,
  cercaDe = null,
  nombresRubro = {},
}: {
  pedidos: Pedido[]
  patrocinado?: React.ReactNode
  cercaDe?: Ubicacion | null
  // slug → nombre de cada rubro, para el "Rubro › Categoría"
  nombresRubro?: Record<string, string>
}) {
  const miUbicacion = cercaDe
  const orden = cercaDe ? 'cercanos' : 'recientes'

  const pedidosOrdenados = useMemo(() => {
    if (orden === 'cercanos' && miUbicacion) {
      // Los que no tienen ubicación van al final
      const lejos = Number.MAX_VALUE
      return [...pedidos].sort(
        (a, b) => (distanciaAlPedido(miUbicacion, a) ?? lejos) - (distanciaAlPedido(miUbicacion, b) ?? lejos)
      )
    }
    return pedidos
  }, [pedidos, orden, miUbicacion])

  return (
    <div>
      {pedidosOrdenados.map((pedido, indice) => {
        const quien = pedido.es_comercio ? pedido.nombre_comercio : pedido.usuarios?.nombre
        const nombreCategoria = pedido.categorias?.nombre ?? 'Sin categoría'
        const grupoSlug = pedido.categorias?.grupo_slug
        const rubro = grupoSlug ? nombresRubro[grupoSlug] : undefined
        const titulo = tituloDe(pedido.descripcion)
        const etiquetas = caracteristicas(pedido)

        const precio = pedido.monto_a_convenir
          ? 'A convenir'
          : pedido.monto_ofrecido
          ? `$${pedido.monto_ofrecido.toLocaleString('es-AR')}`
          : ''

        const dist =
          orden === 'cercanos' && miUbicacion
            ? distanciaAlPedido(miUbicacion, pedido)
            : null

        const conPatrocinado = !!patrocinado && indice === Math.min(8, pedidosOrdenados.length) - 1
        return (
          <Fragment key={pedido.id}>
          {/* Como en la web: título, Rubro › Categoría, descripción,
              etiquetas de colores y abajo quién lo publicó y el pago */}
          <a
            href={`/pedidos/${pedido.id}`}
            style={{
              display: 'block',
              background: COLORS.card,
              boxShadow: COLORS.cardShadow,
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              textDecoration: 'none',
              color: COLORS.ink,
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: COLORS.clay,
                  color: COLORS.ink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {iconoParaCategoria(nombreCategoria)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 17.5, lineHeight: 1.3 }}>{titulo}</p>
                <p style={{ margin: '3px 0 0', fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.4 }}>
                  {rubro && rubro !== nombreCategoria && (
                    <>
                      {rubro}
                      <span aria-hidden style={{ margin: '0 5px' }}>›</span>
                    </>
                  )}
                  <span style={{ color: COLORS.blue }}>{nombreCategoria}</span>
                  {' · '}
                  {haceCuanto(pedido.fecha_creacion)}
                </p>
              </div>
            </div>

            <p
              style={{
                margin: '10px 0 0',
                fontSize: 15,
                lineHeight: 1.45,
                color: '#3F3F46',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {pedido.descripcion}
            </p>

            {(etiquetas.length > 0 || tieneRequisitos(pedido) || dist !== null) && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                {etiquetas.map((e) => (
                  <span
                    key={e.texto}
                    style={{ ...ESTILO_ETIQUETA, background: COLOR_CARACTERISTICA[e.tipo].fondo, color: COLOR_CARACTERISTICA[e.tipo].texto }}
                  >
                    {e.texto}
                  </span>
                ))}
                {tieneRequisitos(pedido) && pedido.cumple_requisitos !== undefined && (
                  <span
                    style={{
                      ...ESTILO_ETIQUETA,
                      background: (pedido.cumple_requisitos ? COLOR_CUMPLE : COLOR_NO_CUMPLE).fondo,
                      color: (pedido.cumple_requisitos ? COLOR_CUMPLE : COLOR_NO_CUMPLE).texto,
                    }}
                  >
                    {pedido.cumple_requisitos ? '✓ Cumplís los requisitos' : 'No cumplís los requisitos'}
                  </span>
                )}
                {dist !== null && (
                  <span style={{ ...ESTILO_ETIQUETA, background: COLORS.tagBlue, color: COLORS.tagBlueText }}>{dist.toFixed(1)} km</span>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px solid ${COLORS.line}`,
              }}
            >
              <span style={{ fontSize: 12.5, color: COLORS.inkSoft, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {quien && (
                  <>
                    Publicado por <span style={{ color: COLORS.ink }}>{quien}</span>
                  </>
                )}
              </span>
              {precio && (
                <span style={{ ...ESTILO_ETIQUETA, fontWeight: 400, flexShrink: 0, background: COLOR_PRECIO.fondo, color: COLOR_PRECIO.texto }}>
                  {precio}
                </span>
              )}
            </div>
          </a>
          {conPatrocinado && <div style={{ marginBottom: 12 }}>{patrocinado}</div>}
          </Fragment>
        )
      })}
    </div>
  )
}