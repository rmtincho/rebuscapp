'use client'

import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'

// Después de eliminar la cuenta se llega acá con ?cuenta=eliminada.
// Se lee de la URL en el navegador (en el servidor no hay aviso).
function useCuentaEliminada() {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get('cuenta') === 'eliminada',
    () => false
  )
}

export default function LoginPage() {
  const cuentaEliminada = useCuentaEliminada()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [paso, setPaso] = useState<'email' | 'codigo'>('email')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // crea la cuenta si es la primera vez
      },
    })

    setCargando(false)

    if (error) {
      // El detalle real queda en la consola para poder diagnosticar
      console.error('signInWithOtp falló:', error.status, error.code, error.message)
      if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
        setError('Se pidieron demasiados códigos seguidos. Esperá unos minutos y probá de nuevo.')
      } else {
        setError(`No pudimos enviar el código. Revisá el email e intentá de nuevo. (${error.message})`)
      }
      return
    }

    setPaso('codigo')
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    setCargando(false)

    if (error) {
      setError('Código incorrecto o vencido. Probá de nuevo.')
      return
    }

    // Heurística para detectar si es la primera vez que esta persona
    // entra: Supabase pone created_at y last_sign_in_at casi idénticos
    // en el primer login (recién se creó el usuario). En logins
    // siguientes, last_sign_in_at queda bastante más adelante.
    const usuario = data.user
    const esRegistroNuevo =
      !!usuario?.created_at &&
      !!usuario?.last_sign_in_at &&
      Math.abs(new Date(usuario.last_sign_in_at).getTime() - new Date(usuario.created_at).getTime()) < 5000

    router.push(esRegistroNuevo ? '/login/notificaciones' : '/')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 360, margin: '0 auto', minHeight: '100vh', padding: '80px 20px', fontFamily: 'var(--font-body)', background: COLORS.paper }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <Image src="/logo.png" alt="Rebuscapp" width={220} height={55} priority />
      </div>

      {cuentaEliminada && paso === 'email' && (
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 14, background: COLORS.card, boxShadow: COLORS.cardShadow, fontSize: 14, color: COLORS.ink, lineHeight: 1.5, textAlign: 'center' }}>
          <b>Tu cuenta se eliminó.</b>
          <br />
          Gracias por haber usado Rebuscapp.
        </div>
      )}

      {paso === 'email' && (
        <form onSubmit={enviarCodigo}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: COLORS.inkSoft, fontWeight: 600 }}>
            Tu email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{ width: '100%', padding: 14, marginBottom: 16, fontSize: 15, borderRadius: 100, border: `1.5px solid ${COLORS.line}`, background: COLORS.card, color: COLORS.ink, outline: 'none' }}
          />
          <button
            type="submit"
            disabled={cargando}
            style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none', background: COLORS.clay, color: COLORS.onClay, cursor: 'pointer' }}
          >
            {cargando ? 'Enviando...' : 'Continuar'}
          </button>
          <p style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
            Al continuar aceptás los{' '}
            <a href="/terminos" style={{ color: COLORS.ink, fontWeight: 600 }}>Términos y condiciones</a> y la{' '}
            <a href="/privacidad" style={{ color: COLORS.ink, fontWeight: 600 }}>Política de privacidad</a>.
          </p>
        </form>
      )}

      {paso === 'codigo' && (
        <form onSubmit={confirmarCodigo}>
          <p style={{ fontSize: 14, marginBottom: 16, color: COLORS.inkSoft }}>
            Te mandamos un código a <b>{email}</b>
          </p>
          <input
            type="text"
            required
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Código de 6 dígitos"
            style={{ width: '100%', padding: 14, marginBottom: 16, fontSize: 15, borderRadius: 100, border: `1.5px solid ${COLORS.line}`, background: COLORS.card, color: COLORS.ink, outline: 'none' }}
          />
          <button
            type="submit"
            disabled={cargando}
            style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700, borderRadius: 100, border: 'none', background: COLORS.clay, color: COLORS.onClay, cursor: 'pointer' }}
          >
            {cargando ? 'Confirmando...' : 'Confirmar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPaso('email')
              setOtp('')
              setError(null)
            }}
            style={{ width: '100%', padding: 12, marginTop: 10, fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Usar otro email
          </button>
        </form>
      )}

      {error && (
        <p style={{ color: COLORS.sage, fontSize: 13, marginTop: 12, fontWeight: 600 }}>{error}</p>
      )}
    </div>
  )
}