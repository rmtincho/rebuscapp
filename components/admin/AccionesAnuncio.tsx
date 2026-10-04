'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cambiarActivoAnuncio, eliminarAnuncio } from '@/app/actions/adminAnuncios'
import { COLORS } from '@/lib/theme'

// Pausar / reactivar / eliminar un anuncio desde la lista del panel
export default function AccionesAnuncio({ id, activo, anunciante }: { id: string; activo: boolean; anunciante: string }) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)

  async function ejecutar(accion: () => Promise<{ ok: boolean; error?: string }>) {
    setCargando(true)
    const r = await accion()
    setCargando(false)
    if (!r.ok) alert(r.error ?? 'No se pudo.')
    router.refresh()
  }

  const boton: React.CSSProperties = {
    padding: '7px 14px',
    borderRadius: 100,
    border: `1.5px solid ${COLORS.line}`,
    background: COLORS.card,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: 'pointer',
    color: COLORS.ink,
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" disabled={cargando} style={boton} onClick={() => ejecutar(() => cambiarActivoAnuncio(id, !activo))}>
        {activo ? 'Pausar' : 'Activar'}
      </button>
      <button
        type="button"
        disabled={cargando}
        style={{ ...boton, color: COLORS.redDark }}
        onClick={() => {
          if (window.confirm(`¿Eliminar el anuncio de ${anunciante}? Se borran también la imagen y sus números.`)) {
            ejecutar(() => eliminarAnuncio(id))
          }
        }}
      >
        Eliminar
      </button>
    </div>
  )
}
