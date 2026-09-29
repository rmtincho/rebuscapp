'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { eliminarCuenta } from '@/app/actions/usuarios'
import { COLORS } from '@/lib/theme'
import { MensajeError, inputBaseStyle } from '@/lib/ui'

// Al final del perfil: primero un link discreto, y al tocarlo se abre la
// confirmación, que pide escribir ELIMINAR para que no se haga sin querer.
export default function EliminarCuenta() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [confirmacion, setConfirmacion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmado = confirmacion.trim().toUpperCase() === 'ELIMINAR'

  async function handleEliminar() {
    setCargando(true)
    setError(null)
    const resultado = await eliminarCuenta(confirmacion)
    if (!resultado.ok) {
      setCargando(false)
      setError(resultado.error)
      return
    }
    router.push('/login')
    router.refresh()
  }

  if (!abierto) {
    return (
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          style={{ border: 'none', background: 'none', color: COLORS.redDark, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Eliminar mi cuenta
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 24, padding: 18, borderRadius: 16, background: COLORS.redTint }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.redDark, marginBottom: 8 }}>Eliminar tu cuenta</p>
      <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.5, marginBottom: 8 }}>
        Se borran tus datos personales, tu foto, tu perfil de trabajador y tus postulaciones pendientes, y se
        dan de baja tus trabajos abiertos. Los mensajes y calificaciones que ya compartiste quedan a nombre de
        &quot;Usuario eliminado&quot;.
      </p>
      <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.5, marginBottom: 12 }}>
        <b>No se puede deshacer.</b> Para confirmar, escribí <b>ELIMINAR</b>.
      </p>
      <input
        type="text"
        value={confirmacion}
        onChange={(e) => setConfirmacion(e.target.value)}
        placeholder="ELIMINAR"
        autoCapitalize="characters"
        style={{ ...inputBaseStyle, marginBottom: 12 }}
      />
      {error && <MensajeError>{error}</MensajeError>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={() => {
            setAbierto(false)
            setConfirmacion('')
            setError(null)
          }}
          disabled={cargando}
          style={{ flex: 1, padding: 13, borderRadius: 100, border: `1.5px solid ${COLORS.line}`, background: COLORS.card, color: COLORS.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleEliminar}
          disabled={!confirmado || cargando}
          style={{ flex: 1, padding: 13, borderRadius: 100, border: 'none', background: confirmado ? COLORS.red : COLORS.line, color: confirmado ? '#FFFFFF' : COLORS.inkSoft, fontSize: 13, fontWeight: 700, cursor: confirmado ? 'pointer' : 'default' }}
        >
          {cargando ? 'Eliminando...' : 'Eliminar cuenta'}
        </button>
      </div>
    </div>
  )
}
