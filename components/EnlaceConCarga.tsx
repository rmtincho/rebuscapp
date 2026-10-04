'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Enlace que, al tocarlo, oscurece la pantalla y muestra la lupa latiendo
// mientras carga la página siguiente (p. ej. "Publicar un trabajo", que
// tarda en armarse). La navegación es la normal del navegador; el velo
// solo cubre la espera.
export default function EnlaceConCarga({ onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const [cargando, setCargando] = useState(false)

  // Al volver con "atrás" el navegador puede restaurar la página tal cual
  // quedó (con el velo puesto): lo sacamos
  useEffect(() => {
    const alVolver = () => setCargando(false)
    window.addEventListener('pageshow', alVolver)
    return () => window.removeEventListener('pageshow', alVolver)
  }, [])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    // Ctrl/Cmd/Shift/clic del medio abren otra pestaña: acá no hay espera
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || props.target === '_blank') return
    setCargando(true)
  }

  return (
    <>
      <a {...props} onClick={handleClick} />
      {cargando &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 30000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(28, 28, 30, 0.45)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          >
            <span
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: '#FFC21A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen local fija, igual que en app/loading.tsx */}
              <img className="lupa-cargando" src="/icono-negro.png" alt="Cargando" width={38} height={60} />
            </span>
          </div>,
          document.body
        )}
    </>
  )
}
