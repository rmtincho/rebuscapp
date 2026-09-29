'use client'

import { useState, useMemo } from 'react'
import { COLORS } from '@/lib/theme'
import { iconoParaCategoria } from '@/lib/categoryIcons'

type Pedido = {
  id: string
  descripcion: string
  ubicacion_lat: number
  ubicacion_lng: number
  monto_ofrecido: number | null
  monto_a_convenir: boolean
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

export default function PedidosList({ pedidos }: { pedidos: Pedido[] }) {
  const [orden, setOrden] = useState<'recientes' | 'cercanos'>('recientes')
  const [miUbicacion, setMiUbicacion] = useState<{ lat: number; lng: number } | null>(null)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)

  function activarCercanos() {
    if (!navigator.geolocation) {
      setOrden('cercanos') // igual lo dejamos activo, solo no va a poder ordenar
      return
    }
    setBuscandoUbicacion(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setOrden('cercanos')
        setBuscandoUbicacion(false)
      },
      () => {
        setBuscandoUbicacion(false)
        setOrden('cercanos')
      }
    )
  }

  const pedidosOrdenados = useMemo(() => {
    if (orden === 'cercanos' && miUbicacion) {
      return [...pedidos].sort(
        (a, b) =>
          distanciaKm(miUbicacion.lat, miUbicacion.lng, a.ubicacion_lat, a.ubicacion_lng) -
          distanciaKm(miUbicacion.lat, miUbicacion.lng, b.ubicacion_lat, b.ubicacion_lng)
      )
    }
    return pedidos
  }, [pedidos, orden, miUbicacion])

  const chipStyle = (activo: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 100,
    fontSize: 12.5,
    fontWeight: 500,
    border: `1px solid ${activo ? COLORS.dark : COLORS.line}`,
    background: activo ? COLORS.dark : COLORS.card,
    color: activo ? COLORS.onDark : COLORS.inkSoft,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 2 }}>
        <button style={chipStyle(orden === 'recientes')} onClick={() => setOrden('recientes')}>
          Recientes
        </button>
        <button style={chipStyle(orden === 'cercanos')} onClick={activarCercanos}>
          {buscandoUbicacion ? 'Buscando...' : 'Cercanos'}
        </button>
      </div>

      {pedidosOrdenados.map((pedido) => {
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
            ? distanciaKm(miUbicacion.lat, miUbicacion.lng, pedido.ubicacion_lat, pedido.ubicacion_lng)
            : null

        return (
          <a
            key={pedido.id}
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
                <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: COLORS.ink, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {pedido.descripcion}
                </p>
                {precio && (
                  <span
                    style={{
                      flexShrink: 0,
                      background: COLORS.dark,
                      color: COLORS.onDark,
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: '5px 10px',
                      borderRadius: 100,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {precio}
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 10px', fontSize: 12.5, color: COLORS.inkSoft }}>
                {nombrePublicador}
                {pedido.es_comercio && ' 🏢'}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: COLORS.tagOrangeText, background: COLORS.tagOrange, padding: '4px 10px', borderRadius: 100 }}>
                  {nombreCategoria}
                </span>
                {dist !== null && (
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: COLORS.tagBlueText, background: COLORS.tagBlue, padding: '4px 10px', borderRadius: 100 }}>
                    {dist.toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}