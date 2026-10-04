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
        <p style={{ fontSize: 14, fontWeight: 500, color: sinRubros ? COLORS.inkSoft : COLORS.ink, margin: 0 }}>
          Coinciden con mis habilidades
        </p>
        {sinRubros && (
          <a href="/perfil#trabajador" style={{ fontSize: 12.5, color: COLORS.clayDark, fontWeight: 500 }}>
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
          // Apagado: gris marcado (con el color de las líneas no se veía
          // sobre el fondo claro)
          background: activo ? COLORS.dark : '#C9C2B5',
          cursor: sinRubros ? 'default' : 'pointer',
          opacity: sinRubros ? 0.65 : 1,
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
            boxShadow: '0 1px 3px rgba(28, 28, 30, 0.3)',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}
