'use client'

import { useRouter } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import { guardarModo, type ModoInicio } from '@/lib/modoInicio'

// Las dos tarjetas de arriba del inicio (celular): eligen el modo y el
// inicio muestra solo lo de ese modo, para no mezclar todo.
export default function SelectorModo({ modo, cantidadTrabajos }: { modo: ModoInicio; cantidadTrabajos: number }) {
  const router = useRouter()

  function elegir(m: ModoInicio) {
    if (m === modo) return
    guardarModo(m)
    router.refresh()
  }

  const opciones: { valor: ModoInicio; titulo: string; detalle: string; icono: React.ReactNode }[] = [
    {
      valor: 'busco',
      titulo: 'Busco trabajo',
      detalle: `${cantidadTrabajos} cerca tuyo`,
      icono: (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </>
      ),
    },
    {
      valor: 'ofrezco',
      titulo: 'Necesito a alguien',
      detalle: 'Publicá y elegí',
      icono: (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </>
      ),
    },
  ]

  return (
    <div role="tablist" aria-label="¿Qué querés hacer?" style={{ display: 'flex', gap: 10 }}>
      {opciones.map((o) => {
        const activo = o.valor === modo
        return (
          <button
            key={o.valor}
            type="button"
            role="tab"
            aria-selected={activo}
            onClick={() => elegir(o.valor)}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 18,
              padding: 14,
              borderRadius: 24,
              border: activo ? `2px solid ${COLORS.dark}` : '2px solid transparent',
              background: activo ? COLORS.clayGradient : COLORS.card,
              boxShadow: activo ? '0 10px 24px rgba(255, 184, 0, 0.25)' : COLORS.cardShadow,
              color: COLORS.ink,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: activo ? 'rgba(255,255,255,0.45)' : COLORS.clayTint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {o.icono}
                </svg>
              </span>
              {activo && (
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: COLORS.dark,
                    color: COLORS.clay,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              )}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{o.titulo}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(28,28,30,0.65)' }}>{o.detalle}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
