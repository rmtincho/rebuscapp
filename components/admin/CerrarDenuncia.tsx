'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cerrarDenuncia } from '@/app/actions/adminDenuncias'
import { COLORS } from '@/lib/theme'
import { MensajeError, inputBaseStyle } from '@/lib/ui'
import { AVISOS_DENUNCIA, type AvisoDenuncia } from '@/lib/denuncias'

// Resoluciones frecuentes, para no escribirlas cada vez (protocolo de moderación)
const SIN_PRUEBAS = 'Sin pruebas, se archiva'
const RAPIDAS = [SIN_PRUEBAS, 'Advertencia por mail', 'Cuenta suspendida', 'Trabajo dado de baja']

// Cerrar una denuncia del panel anotando qué se decidió
export default function CerrarDenuncia({ id }: { id: string }) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [aviso, setAviso] = useState<AvisoDenuncia>('medidas')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cerrar() {
    setError(null)
    setCargando(true)
    // Si hubo un deploy con la página abierta, la acción ya no existe y tira
    let r: Awaited<ReturnType<typeof cerrarDenuncia>>
    try {
      r = await cerrarDenuncia(id, texto, aviso)
    } catch {
      setCargando(false)
      setError('No se pudo guardar. Recargá la página y probá de nuevo.')
      return
    }
    setCargando(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    router.refresh()
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {RAPIDAS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setTexto(r)
              setAviso(r === SIN_PRUEBAS ? 'sin_medidas' : 'medidas')
            }}
            style={{
              padding: '5px 11px',
              borderRadius: 100,
              border: `1.5px solid ${texto === r ? COLORS.dark : COLORS.line}`,
              background: COLORS.card,
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.ink,
              cursor: 'pointer',
            }}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, 500))}
        placeholder="Qué se decidió (queda en los antecedentes de la persona)"
        rows={2}
        style={{ ...inputBaseStyle, resize: 'vertical', fontFamily: 'inherit', fontSize: 14, marginBottom: 10 }}
      />
      <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: '0 0 4px' }}>Aviso a quien denunció</p>
      {AVISOS_DENUNCIA.map((a) => (
        <label
          key={a.valor}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: COLORS.ink, padding: '5px 0', cursor: 'pointer' }}
        >
          <input
            type="radio"
            name={`aviso-${id}`}
            checked={aviso === a.valor}
            onChange={() => setAviso(a.valor)}
            style={{ accentColor: COLORS.dark, marginTop: 2 }}
          />
          <span>
            {a.label}
            {a.cuerpo && aviso === a.valor && (
              <span style={{ display: 'block', fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                “Revisamos tu denuncia. {a.cuerpo}”
              </span>
            )}
          </span>
        </label>
      ))}
      <div style={{ height: 10 }} />
      {error && <MensajeError>{error}</MensajeError>}
      <button
        type="button"
        disabled={cargando}
        onClick={cerrar}
        style={{
          padding: '9px 16px',
          borderRadius: 100,
          border: 'none',
          background: COLORS.dark,
          color: COLORS.onDark,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {cargando ? 'Guardando...' : 'Cerrar denuncia'}
      </button>
    </div>
  )
}
