'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'
import { notificarPostulacionRecibida } from '@/app/actions/notificaciones'

export default function PostularseForm({ pedidoId }: { pedidoId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Tu sesión expiró, volvé a loguearte.')
      setCargando(false)
      return
    }

    // Por si todavía no tiene fila en usuarios (nunca publicó ni se postuló antes)
    await supabase.from('usuarios').upsert(
      {
        id: user.id,
        email: user.email,
        nombre: user.email?.split('@')[0] ?? 'Usuario',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const { error: errorPostulacion } = await supabase.from('postulaciones').insert({
      pedido_id: pedidoId,
      prestador_id: user.id,
      mensaje: mensaje.trim() || null,
      estado: 'pendiente',
    })

    setCargando(false)

    if (errorPostulacion) {
      setError('No pudimos enviar tu postulación: ' + errorPostulacion.message)
      return
    }

    // Avisamos al solicitante. No bloqueamos ni mostramos error al
    // prestador si esto falla — la postulación ya se guardó bien,
    // el push es un extra, no algo crítico para el flujo.
    notificarPostulacionRecibida(pedidoId).catch(() => {})

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: COLORS.inkSoft,
          marginBottom: 10,
        }}
      >
        Contale por qué te elegirían (opcional)
      </label>
      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="Ej: tengo experiencia en este tipo de trabajos..."
        rows={3}
        style={{
          width: '100%',
          padding: '13px 14px',
          fontSize: 15,
          borderRadius: 14,
          border: `1.5px solid ${COLORS.line}`,
          background: COLORS.card,
          color: COLORS.ink,
          marginBottom: 14,
          fontFamily: 'inherit',
          resize: 'vertical',
        }}
      />

      {error && (
        <p style={{ color: COLORS.sage, fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        style={{
          width: '100%',
          padding: 16,
          fontSize: 15.5,
          fontWeight: 700,
          borderRadius: 8,
          border: 'none',
          background: COLORS.clay,
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          color: COLORS.onClay,
          cursor: 'pointer',
        }}
      >
        {cargando ? 'Enviando...' : 'Postularme a este pedido'}
      </button>
    </form>
  )
}