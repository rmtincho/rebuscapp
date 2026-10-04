'use client'

import { Fragment, useMemo } from 'react'
import { COLORS } from '@/lib/theme'
import { iconoParaCategoria } from '@/lib/categoryIcons'
import { haceCuanto } from '@/lib/fechas'

type Pedido = {
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
  categorias: { nombre: string } | null
  usuarios: { nombre: string } | null
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
}: {
  pedidos: Pedido[]
  patrocinado?: React.ReactNode
  cercaDe?: Ubicacion | null
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
        const nombrePublicador = pedido.es_comercio
          ? pedido.nombre_comercio
          : pedido.usuarios?.nombre ?? 'Alguien'

        const nombreCategoria = pedido.categorias?.nombre ?? 'Sin categoría'

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
          <a
            href={`/pedidos/${pedido.id}`}
            style={{
              display: 'flex',
              gap: 12,
              background: COLORS.card,
              boxShadow: COLORS.cardShadow,
              borderRadius: 22,
              padding: 14,
              marginBottom: 10,
              alignItems: 'flex-start',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: COLORS.iconBg,
                color: COLORS.iconFg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {iconoParaCategoria(nombreCategoria)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 16, color: COLORS.ink, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {pedido.descripcion}
                </p>
                {precio && (
                  <span
                    style={{
                      flexShrink: 0,
                      background: COLORS.blueTint,
                      color: COLORS.blueDark,
                      fontSize: 13.5,
                      fontWeight: 400,
                      padding: '5px 9px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {precio}
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 10px', fontSize: 13.5, color: COLORS.inkSoft }}>
                {nombrePublicador}
                {pedido.es_comercio && ' 🏢'}
                {' · '}
                {haceCuanto(pedido.fecha_creacion)}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 400, color: COLORS.tagOrangeText, background: COLORS.tagOrange, padding: '4px 9px', borderRadius: 6 }}>
                  {nombreCategoria}
                </span>
                {dist !== null && (
                  <span style={{ fontSize: 12.5, fontWeight: 400, color: COLORS.tagBlueText, background: COLORS.tagBlue, padding: '4px 9px', borderRadius: 6 }}>
                    {dist.toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
          </a>
          {conPatrocinado && <div style={{ marginBottom: 12 }}>{patrocinado}</div>}
          </Fragment>
        )
      })}
    </div>
  )
}