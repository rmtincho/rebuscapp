'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { desbloquear } from '@/app/actions/moderacion'
import { COLORS } from '@/lib/theme'

export type PersonaBloqueada = { id: string; nombre: string }

// En el perfil, debajo del formulario: a quién bloqueaste, para poder
// desbloquearlo sin tener que encontrar su perfil.
export default function ListaBloqueados({ personas }: { personas: PersonaBloqueada[] }) {
  const router = useRouter()
  const [cargandoId, setCargandoId] = useState<string | null>(null)

  if (personas.length === 0) return null

  async function handleDesbloquear(id: string) {
    setCargandoId(id)
    const resultado = await desbloquear(id)
    setCargandoId(null)
    if (!resultado.ok) {
      alert(resultado.error)
      return
    }
    router.refresh()
  }

  return (
    <div style={{ marginTop: 28 }}>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        Personas bloqueadas
      </p>
      <div style={{ background: COLORS.card, borderRadius: 16, boxShadow: COLORS.cardShadow }}>
        {personas.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 16px',
              borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none',
            }}
          >
            <span style={{ fontSize: 14, color: COLORS.ink, fontWeight: 500 }}>{p.nombre}</span>
            <button
              type="button"
              onClick={() => handleDesbloquear(p.id)}
              disabled={cargandoId === p.id}
              style={{ border: `1.5px solid ${COLORS.line}`, background: 'none', borderRadius: 100, padding: '6px 14px', fontSize: 12.5, fontWeight: 500, color: COLORS.ink, cursor: 'pointer' }}
            >
              {cargandoId === p.id ? 'Desbloqueando...' : 'Desbloquear'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
