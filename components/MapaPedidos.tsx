'use client'

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Fragment } from 'react'
import { COLORS } from '@/lib/theme'

export type PedidoParaMapa = {
  id: string
  descripcion: string
  ubicacion_lat: number
  ubicacion_lng: number
  monto_ofrecido: number | null
  monto_a_convenir: boolean
  categorias: { nombre: string } | null
}

// Por seguridad, no mostramos la ubicación exacta de quien publica el trabajo
// (podría ser una persona vulnerable) — desplazamos el pin unos cientos
// de metros, siempre en la misma dirección para el mismo pedido (así no
// "salta" en cada recarga), y lo mostramos como un área, no un punto exacto.
function desplazarUbicacion(id: string, lat: number, lng: number): [number, number] {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  const anguloRad = (Math.abs(hash) % 360) * (Math.PI / 180)
  const distanciaKm = 0.25 + (Math.abs(hash >> 8) % 25) / 100 // entre 250m y 500m

  const deltaLat = (distanciaKm / 111) * Math.cos(anguloRad)
  const deltaLng = (distanciaKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(anguloRad)

  return [lat + deltaLat, lng + deltaLng]
}

function crearIcono() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${COLORS.clay};
      border:2px solid ${COLORS.card};
      box-shadow:0 3px 6px rgba(43,38,32,0.25);
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  })
}

export default function MapaPedidos({
  pedidos,
  centro,
}: {
  pedidos: PedidoParaMapa[]
  centro: [number, number]
}) {
  return (
    <MapContainer
      center={centro}
      zoom={13}
      style={{ height: '320px', width: '100%' }}
      zoomControl={false}
      className="mapa-oscuro"
    >
      <TileLayer
        url={`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {pedidos.map((pedido) => {
        const [latAprox, lngAprox] = desplazarUbicacion(
          pedido.id,
          pedido.ubicacion_lat,
          pedido.ubicacion_lng
        )
        return (
          <Fragment key={pedido.id}>
            <Circle
              center={[latAprox, lngAprox]}
              radius={350}
              pathOptions={{
                color: COLORS.clay,
                fillColor: COLORS.clay,
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
            <Marker position={[latAprox, lngAprox]} icon={crearIcono()}>
              <Popup>
                <b>{pedido.descripcion}</b>
                <br />
                {pedido.categorias?.nombre}
                <br />
                {pedido.monto_a_convenir
                  ? 'A convenir'
                  : pedido.monto_ofrecido
                  ? `$${pedido.monto_ofrecido.toLocaleString('es-AR')}`
                  : ''}
                <br />
                <small style={{ color: '#888' }}>Ubicación aproximada</small>
              </Popup>
            </Marker>
          </Fragment>
        )
      })}
    </MapContainer>
  )
}