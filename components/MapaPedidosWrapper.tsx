'use client'

import dynamic from 'next/dynamic'
import { COLORS } from '@/lib/theme'
import type { PedidoParaMapa } from './MapaPedidos'

const MapaPedidos = dynamic(() => import('./MapaPedidos'), {
  ssr: false,
  loading: () => <div style={{ height: 320, background: COLORS.line }} />,
})

export default function MapaPedidosWrapper({
  pedidos,
  centro,
}: {
  pedidos: PedidoParaMapa[]
  centro: [number, number]
}) {
  return <MapaPedidos pedidos={pedidos} centro={centro} />
}