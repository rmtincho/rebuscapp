'use client'

import { COLORS } from '@/lib/theme'

// Filtro rápido "Coinciden con mis habilidades": solo trabajos de los rubros
// del perfil de trabajador. Sin rubros cargados, invita a cargarlos.
export default function InterruptorHabilidades({
  activo,
  onChange,
  sinRubros,
}: {
  activo: boolean
  onChange: (v: boolean) => void
  sinRubros: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: sinRubros ? COLORS.inkSoft : COLORS.ink, margin: 0 }}>
          Coinciden con mis habilidades
        </p>
        {sinRubros && (
          <a href="/perfil#trabajador" style={{ fontSize: 12.5, color: COLORS.clayDark, fontWeight: 600 }}>
            Cargá tus rubros en tu perfil
          </a>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label="Coinciden con mis habilidades"
        disabled={sinRubros}
        onClick={() => onChange(!activo)}
        style={{
          flexShrink: 0,
          width: 46,
          height: 28,
          borderRadius: 100,
          border: 'none',
          padding: 0,
          position: 'relative',
          background: activo ? COLORS.dark : COLORS.line,
          cursor: sinRubros ? 'default' : 'pointer',
          opacity: sinRubros ? 0.5 : 1,
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: activo ? 21 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: activo ? COLORS.clay : COLORS.card,
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}
