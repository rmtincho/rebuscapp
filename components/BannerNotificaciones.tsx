'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { activarNotificaciones, estadoPermiso, pushSoportado, sincronizarNotificaciones } from '@/lib/push-client'

const CLAVE_DESCARTADO = 'rebuscapp_banner_notif_descartado'

const COLORS = {
  naranja: '#FFC21A',
  texto: '#1C1C22',
  aviso: '#FFF1C2',
}

export default function BannerNotificaciones() {
  const [visible, setVisible] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!pushSoportado()) return

    const permiso = estadoPermiso()

    // Con el permiso ya dado, nos aseguramos en silencio de que la
    // suscripción de este dispositivo esté guardada para esta cuenta
    if (permiso === 'granted') {
      sincronizarNotificaciones().catch(() => {})
      return
    }

    let yaDescartado = false
    try {
      yaDescartado = localStorage.getItem(CLAVE_DESCARTADO) === '1'
    } catch {}

    // Solo se muestra si el navegador nunca preguntó (ni activado, ni
    // bloqueado) y el usuario no lo cerró antes en este dispositivo.
    if (permiso === 'default' && !yaDescartado) {
      setVisible(true)
    }
  }, [])

  async function handleActivar() {
    setCargando(true)
    await activarNotificaciones()
    setCargando(false)
    // Guardamos que ya interactuaste con esto, independientemente del
    // resultado — así no lo volvemos a mostrar en cada carga si el
    // navegador no llegó a confirmar el permiso como "concedido".
    localStorage.setItem(CLAVE_DESCARTADO, '1')
    setVisible(false)
  }

  function handleCerrar() {
    localStorage.setItem(CLAVE_DESCARTADO, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      // Aviso, no tarjeta: amarillo suave con borde y sin sombra, para que
      // no se confunda con las tarjetas de trabajo
      style={{
        background: COLORS.aviso,
        border: `1.5px solid ${COLORS.naranja}`,
        borderRadius: 16,
        padding: '12px 14px',
        margin: '0 0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: COLORS.naranja,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.texto} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0, color: COLORS.texto }}>
          No te pierdas ningún trabajo
        </p>
        <p style={{ fontSize: 12, margin: '2px 0 0', color: COLORS.texto }}>
          Activá los avisos para enterarte al instante
        </p>
      </div>

      <button
        onClick={handleActivar}
        disabled={cargando}
        style={{
          padding: '9px 14px',
          borderRadius: 100,
          border: 'none',
          background: COLORS.texto,
          color: '#FFFFFF',
          fontWeight: 500,
          fontSize: 12.5,
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {cargando ? '...' : 'Activar'}
      </button>

      <button
        onClick={handleCerrar}
        aria-label="Cerrar"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          flexShrink: 0,
          color: COLORS.texto,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}