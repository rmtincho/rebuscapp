'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { COLORS } from '@/lib/theme'
import { useSinContrasena } from '@/lib/useContrasena'

// Franja arriba del inicio (celular y web) mientras la cuenta no tenga
// contraseña. Blanca para que se distinga tanto del amarillo de "busco"
// como del oscuro de "ofrezco". Se puede cerrar, pero vuelve a los pocos
// días; desaparece del todo al crear la contraseña (useSinContrasena).

const CLAVE_CERRADO = 'rebuscapp_aviso_contrasena_cerrado'
const VUELVE_A_LOS = 3 * 24 * 60 * 60 * 1000

export default function AvisoContrasena() {
  const sinContrasena = useSinContrasena()
  const [cerrado, setCerrado] = useState(true)

  useEffect(() => {
    let cuando = 0
    try {
      cuando = Number(localStorage.getItem(CLAVE_CERRADO)) || 0
    } catch {}
    setCerrado(Date.now() - cuando < VUELVE_A_LOS)
  }, [])

  function cerrar() {
    try {
      localStorage.setItem(CLAVE_CERRADO, String(Date.now()))
    } catch {}
    setCerrado(true)
  }

  if (!sinContrasena || cerrado) return null
  return <FranjaContrasena onCerrar={cerrar} />
}

export function FranjaContrasena({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.line}` }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, flexShrink: 0 }}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>

        <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 13.5, lineHeight: 1.35, color: COLORS.ink }}>
          <strong style={{ fontWeight: 700 }}>Creá tu contraseña</strong>{' '}
          y entrá sin esperar el código por mail.
        </p>

        <Link
          href="/perfil"
          style={{
            padding: '7px 14px',
            borderRadius: 100,
            background: COLORS.clay,
            color: COLORS.onClay,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Crear
        </Link>

        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, color: COLORS.ink, display: 'flex' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
