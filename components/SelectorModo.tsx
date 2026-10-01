'use client'

import { useRouter } from 'next/navigation'
import { guardarModo, TEMA_MODO, type ModoInicio } from '@/lib/modoInicio'

// Barra de modo del inicio (celular): "Busco trabajo" / "Necesito a
// alguien". Va pegada debajo del encabezado, con el color del modo, y queda
// fija arriba al bajar: así en cualquier parte del inicio se ve en qué lado
// estás y se cambia con un toque.
export default function SelectorModo({ modo }: { modo: ModoInicio }) {
  const router = useRouter()
  const tema = TEMA_MODO[modo]

  function elegir(m: ModoInicio) {
    if (m === modo) return
    guardarModo(m)
    router.refresh()
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: tema.fondoBarra,
        padding: '6px 20px 16px',
        borderRadius: '0 0 28px 28px',
        boxShadow: '0 10px 24px rgba(28, 28, 30, 0.12)',
        marginBottom: 20,
      }}
    >
      <div
        role="tablist"
        aria-label="¿Qué querés hacer?"
        style={{ display: 'flex', background: tema.superficie, borderRadius: 100, padding: 4 }}
      >
        {(['busco', 'ofrezco'] as const).map((m) => {
          const activo = m === modo
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => elegir(m)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '11px 4px',
                borderRadius: 100,
                border: 'none',
                background: activo ? tema.activo : 'transparent',
                color: activo ? tema.sobreActivo : tema.textoSuave,
                // Achica un poco en celulares angostos (320 px) para que entre
                fontSize: 'clamp(13px, 4.1vw, 14.5px)',
                fontWeight: activo ? 700 : 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
              }}
            >
              {TEMA_MODO[m].nombre}
            </button>
          )
        })}
      </div>
    </div>
  )
}
