'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cerrarDenuncia } from '@/app/actions/adminDenuncias'
import { COLORS } from '@/lib/theme'
import { MensajeError, inputBaseStyle } from '@/lib/ui'

// Resoluciones frecuentes, para no escribirlas cada vez (protocolo de moderación)
const RAPIDAS = ['Sin pruebas, se archiva', 'Advertencia por mail', 'Cuenta suspendida', 'Trabajo dado de baja']

// Cerrar una denuncia del panel anotando qué se decidió
export default function CerrarDenuncia({ id }: { id: string }) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [avisar, setAvisar] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cerrar() {
    setError(null)
    setCargando(true)
    // Si hubo un deploy con la página abierta, la acción ya no existe y tira
    let r: Awaited<ReturnType<typeof cerrarDenuncia>>
    try {
      r = await cerrarDenuncia(id, texto, avisar)
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
            onClick={() => setTexto(r)}
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
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: COLORS.ink, marginBottom: 12, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={avisar}
          onChange={(e) => setAvisar(e.target.checked)}
          style={{ accentColor: COLORS.dark, marginTop: 2 }}
        />
        <span>
          Avisar a quien denunció
          <span style={{ display: 'block', fontSize: 12, color: COLORS.inkSoft }}>
            Le llega “Revisamos tu denuncia”, sin decir qué se decidió.
          </span>
        </span>
      </label>
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
