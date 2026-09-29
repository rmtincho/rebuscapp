'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'

export default function EliminarPedidoBoton({ pedidoId }: { pedidoId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [cargando, setCargando] = useState(false)

  async function handleEliminar() {
    const confirmado = window.confirm(
      '¿Seguro que querés eliminar este pedido? No se puede deshacer, y los postulantes ya no van a poder verlo.'
    )
    if (!confirmado) return

    setCargando(true)

    // Soft-delete: lo marcamos como cancelado en vez de borrar la fila,
    // así queda el historial (y no rompe nada que referencie este id,
    // como postulaciones ya existentes).
    const { error } = await supabase.from('pedidos').update({ estado: 'cancelado' }).eq('id', pedidoId)

    setCargando(false)

    if (error) {
      alert('No pudimos eliminar el pedido: ' + error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleEliminar}
      disabled={cargando}
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '13px',
        borderRadius: 100,
        border: `1.5px solid ${COLORS.line}`,
        background: 'transparent',
        color: '#B91C1C',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {cargando ? 'Eliminando...' : 'Eliminar pedido'}
    </button>
  )
}