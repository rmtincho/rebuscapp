'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  activarNotificaciones,
  desactivarNotificaciones,
  estadoPermiso,
  pushSoportado,
  sincronizarNotificaciones,
} from '@/lib/push-client'

const COLORS = {
  fondo: '#FAF7F2',
  texto: '#1C1C22',
  naranja: '#FFC21A',
  card: '#FFFFFF',
}

export default function AjustesNotificacionesPage() {
  const [permiso, setPermiso] = useState<NotificationPermission | null>(null)
  const [soportado, setSoportado] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  // true solo cuando la suscripción quedó guardada para esta cuenta;
  // el permiso del navegador solo no alcanza
  const [guardada, setGuardada] = useState(false)

  useEffect(() => {
    setSoportado(pushSoportado())
    setPermiso(estadoPermiso())
    sincronizarNotificaciones().then((r) => {
      if (!r) return
      setGuardada(r.ok)
      if (!r.ok) setMensaje(`No pudimos confirmar tus avisos (${r.detalle ?? r.motivo}). Tocá Activar para reintentar.`)
    })
  }, [])

  async function handleActivar() {
    setCargando(true)
    setMensaje(null)
    const resultado = await activarNotificaciones()
    setCargando(false)
    setPermiso(estadoPermiso())

    setGuardada(resultado.ok)
    if (resultado.ok) {
      setMensaje('¡Listo! Ya vas a recibir avisos.')
    } else if (resultado.motivo === 'permiso_denegado') {
      setMensaje('Bloqueaste el permiso del navegador. Para activarlo, tenés que habilitarlo desde la configuración del navegador mismo.')
    } else if (resultado.motivo === 'no_soportado') {
      setMensaje('Tu navegador no soporta notificaciones. Si estás en iPhone, primero instalá la app (Compartir → Agregar a inicio).')
    } else {
      setMensaje(`No pudimos activarlo ahora (${resultado.detalle ?? 'error desconocido'}). Probá de nuevo en un rato.`)
    }
  }

  async function handleDesactivar() {
    setCargando(true)
    setMensaje(null)
    await desactivarNotificaciones()
    setCargando(false)
    setGuardada(false)
    setMensaje('Desactivadas. No vas a recibir más avisos push.')
  }

  const activo = permiso === 'granted' && guardada

  return (
    <div style={{ background: COLORS.fondo, minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '32px 24px' }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: COLORS.texto, textDecoration: 'none', fontWeight: 600 }}
        >
          ← Volver
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-poppins, sans-serif)',
            fontSize: 22,
            fontWeight: 600,
            margin: '20px 0 8px',
            color: COLORS.texto,
          }}
        >
          Notificaciones
        </h1>
        <p style={{ fontSize: 14, color: COLORS.texto, marginBottom: 24, lineHeight: 1.5 }}>
          Enterate cuando hay un pedido cerca, te escriben, o te eligen para un trabajo — aunque no tengas la app abierta.
        </p>

        <div
          style={{
            background: COLORS.card,
            borderRadius: 16,
            padding: 18,
            boxShadow: '0 1px 3px rgba(28, 28, 34, 0.06)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>
                {activo ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
              </p>
              <p style={{ fontSize: 12, color: COLORS.texto, margin: '4px 0 0' }}>
                {soportado ? 'Podés cambiarlo cuando quieras' : 'No soportado en este navegador'}
              </p>
            </div>

            {activo ? (
              <button
                onClick={handleDesactivar}
                disabled={cargando}
                style={{
                  padding: '10px 16px',
                  borderRadius: 100,
                  border: `1.5px solid ${COLORS.texto}`,
                  background: 'transparent',
                  color: COLORS.texto,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Desactivar
              </button>
            ) : (
              <button
                onClick={handleActivar}
                disabled={cargando || !soportado}
                style={{
                  padding: '10px 16px',
                  borderRadius: 100,
                  border: 'none',
                  background: COLORS.naranja,
                  color: COLORS.texto,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: soportado ? 'pointer' : 'default',
                  opacity: soportado ? 1 : 0.5,
                  flexShrink: 0,
                }}
              >
                {cargando ? 'Un momento...' : 'Activar'}
              </button>
            )}
          </div>
        </div>

        {mensaje && (
          <p style={{ fontSize: 13, color: COLORS.texto, lineHeight: 1.4 }}>{mensaje}</p>
        )}
      </div>
    </div>
  )
}