'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'
import { avisarContrasenaCreada } from '@/lib/useContrasena'

// En el perfil: crear o cambiar la contraseña, para entrar con email y
// contraseña sin esperar el código por mail. La cuenta se crea siempre con
// el código; la contraseña es un atajo para los que ya están dados de alta.
// Supabase no dice si la cuenta ya tiene contraseña, así que el texto sirve
// para los dos casos. Con `destacado` (la cuenta todavía no tiene: lo dice
// useSinContrasena) va primero en el perfil, en amarillo y ya abierto.
export default function ContrasenaCuenta({ destacado = false }: { destacado?: boolean }) {
  const [abierto, setAbierto] = useState(destacado)
  const [nueva, setNueva] = useState('')
  const [repetida, setRepetida] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (nueva.length < 8) {
      setError('Tiene que tener al menos 8 caracteres.')
      return
    }
    if (nueva !== repetida) {
      setError('Las dos contraseñas no coinciden.')
      return
    }

    setCargando(true)
    const { error } = await createClient().auth.updateUser({ password: nueva })
    setCargando(false)

    if (error) {
      console.error('updateUser(password) falló:', error.status, error.code, error.message)
      if (error.code === 'same_password') {
        setError('Es la misma contraseña que ya tenías.')
      } else if (error.code === 'weak_password') {
        setError('Es muy fácil de adivinar. Probá con una más larga, mezclando letras y números.')
      } else if (error.code === 'reauthentication_needed') {
        setError('Por seguridad, cerrá sesión, entrá de nuevo con el código y volvé a probar.')
      } else {
        setError(`No pudimos guardarla. Probá de nuevo. (${error.message})`)
      }
      return
    }

    setNueva('')
    setRepetida('')
    setAbierto(false)
    setListo(true)
    avisarContrasenaCreada()
  }

  const campo: React.CSSProperties = {
    width: '100%',
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
    borderRadius: 100,
    border: `1.5px solid ${COLORS.line}`,
    background: COLORS.card,
    color: COLORS.ink,
    outline: 'none',
  }

  return (
    <div style={{ marginTop: destacado ? 0 : 28, marginBottom: destacado ? 28 : 0 }}>
      {!destacado && (
        <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Contraseña
        </p>
      )}
      <div
        style={{
          background: destacado ? COLORS.clayTint : COLORS.card,
          border: destacado ? `1.5px solid ${COLORS.clay}` : 'none',
          borderRadius: destacado ? 10 : 16,
          boxShadow: destacado ? 'none' : COLORS.cardShadow,
          padding: destacado ? '16px 18px' : '14px 16px',
        }}
      >
        {destacado && !listo && (
          <>
            <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: COLORS.ink }}>Creá tu contraseña</p>
            <p style={{ fontSize: 13.5, margin: '0 0 14px', color: COLORS.ink, lineHeight: 1.45 }}>
              Todavía entrás con el código que te mandamos por mail. Con una contraseña entrás directo, sin esperarlo.
            </p>
          </>
        )}
        {!abierto ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.4 }}>
              {listo ? '✓ Contraseña guardada. Ya podés entrar con tu email y contraseña.' : 'Para entrar con tu email y contraseña, sin esperar el código.'}
            </span>
            <button
              type="button"
              onClick={() => {
                setAbierto(true)
                setListo(false)
              }}
              style={{ border: `1.5px solid ${COLORS.line}`, background: 'none', borderRadius: 100, padding: '6px 14px', fontSize: 12.5, fontWeight: 500, color: COLORS.ink, cursor: 'pointer', flexShrink: 0 }}
            >
              Crear o cambiar
            </button>
          </div>
        ) : (
          <form onSubmit={guardar}>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder="Contraseña nueva (mínimo 8)"
              style={campo}
            />
            <input
              type="password"
              autoComplete="new-password"
              required
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              placeholder="Repetila"
              style={campo}
            />
            {error && <p style={{ color: COLORS.red, fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={cargando}
                style={{ flex: 1, padding: 11, fontSize: 14, fontWeight: 700, borderRadius: 100, border: 'none', background: COLORS.clay, color: COLORS.onClay, cursor: 'pointer' }}
              >
                {cargando ? 'Guardando...' : 'Guardar contraseña'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false)
                  setNueva('')
                  setRepetida('')
                  setError(null)
                }}
                style={{ padding: '11px 16px', fontSize: 14, fontWeight: 500, borderRadius: 100, border: `1.5px solid ${COLORS.line}`, background: 'none', color: COLORS.ink, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
