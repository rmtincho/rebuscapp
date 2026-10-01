'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { denunciar, bloquear, desbloquear } from '@/app/actions/moderacion'
import { MOTIVOS_DENUNCIA, type MotivoDenuncia } from '@/lib/denuncias'
import { COLORS } from '@/lib/theme'
import { MensajeError, inputBaseStyle } from '@/lib/ui'


const linkStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  padding: 0,
  color: COLORS.inkSoft,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
}

// Links discretos "Denunciar · Bloquear". Con pedidoId se denuncia el
// pedido (y a quien lo publicó); con otroId, a la persona.
// otroId hace falta para bloquear.
export default function DenunciarBloquear({
  otroId,
  pedidoId,
  nombre,
  bloqueado = false,
  centrado = false,
}: {
  otroId?: string
  pedidoId?: string
  nombre: string
  bloqueado?: boolean
  centrado?: boolean
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null)
  const [detalle, setDetalle] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviada, setEnviada] = useState(false)

  async function enviarDenuncia() {
    if (!motivo) return
    setCargando(true)
    setError(null)
    const resultado = await denunciar({ denunciadoId: otroId, pedidoId, motivo, detalle })
    setCargando(false)
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }
    setAbierto(false)
    setEnviada(true)
  }

  async function cambiarBloqueo() {
    if (!otroId) return
    if (!bloqueado) {
      const ok = window.confirm(
        `¿Bloquear a ${nombre}? No va a poder escribirte ni postularse a tus trabajos, y no van a ver los trabajos ni el perfil del otro en el inicio. No se le avisa.`
      )
      if (!ok) return
    }
    setCargando(true)
    const resultado = bloqueado ? await desbloquear(otroId) : await bloquear(otroId)
    setCargando(false)
    if (!resultado.ok) {
      alert(resultado.error)
      return
    }
    router.refresh()
  }

  return (
    <div style={{ marginTop: 20, textAlign: centrado ? 'center' : 'left' }}>
      {enviada ? (
        <p style={{ fontSize: 12.5, color: COLORS.greenDark, fontWeight: 600 }}>
          ✓ Recibimos tu denuncia. La vamos a revisar.
        </p>
      ) : (
        !abierto && (
          <div style={{ display: 'inline-flex', gap: 14 }}>
            <button type="button" onClick={() => setAbierto(true)} style={linkStyle}>
              {pedidoId ? 'Denunciar trabajo' : 'Denunciar'}
            </button>
            {otroId && (
              <button type="button" onClick={cambiarBloqueo} disabled={cargando} style={linkStyle}>
                {bloqueado ? `Desbloquear a ${nombre}` : `Bloquear a ${nombre}`}
              </button>
            )}
          </div>
        )
      )}

      {abierto && (
        <div style={{ padding: 16, borderRadius: 16, background: COLORS.card, boxShadow: COLORS.cardShadow, textAlign: 'left' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>
            {pedidoId ? 'Denunciar este trabajo' : `Denunciar a ${nombre}`}
          </p>
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 12 }}>
            No le avisamos a quién denunciás. ¿Qué pasó?
          </p>
          {MOTIVOS_DENUNCIA.map((m) => (
            <label
              key={m.valor}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 13.5, color: COLORS.ink, cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="motivo"
                checked={motivo === m.valor}
                onChange={() => setMotivo(m.valor)}
                style={{ accentColor: COLORS.dark }}
              />
              {m.label}
            </label>
          ))}
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value.slice(0, 500))}
            placeholder={motivo === 'otro' ? 'Contanos qué pasó' : 'Detalles (opcional)'}
            rows={3}
            style={{ ...inputBaseStyle, marginTop: 8, marginBottom: 12, resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
          />
          {error && <MensajeError>{error}</MensajeError>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                setError(null)
              }}
              disabled={cargando}
              style={{ flex: 1, padding: 12, borderRadius: 100, border: `1.5px solid ${COLORS.line}`, background: COLORS.card, color: COLORS.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={enviarDenuncia}
              disabled={!motivo || cargando}
              style={{ flex: 1, padding: 12, borderRadius: 100, border: 'none', background: motivo ? COLORS.dark : COLORS.line, color: motivo ? COLORS.onDark : COLORS.inkSoft, fontSize: 13, fontWeight: 700, cursor: motivo ? 'pointer' : 'default' }}
            >
              {cargando ? 'Enviando...' : 'Enviar denuncia'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
