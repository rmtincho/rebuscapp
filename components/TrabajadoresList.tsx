import { COLORS } from '@/lib/theme'

export type Trabajador = {
  id: string
  nombre: string
  fotoUrl: string | null
  sobreMi: string | null
  tipoBusqueda: string | null
  categorias: { nombre: string; grupoSlug: string | null }[]
}

const BUSQUEDA_LABEL: Record<string, string> = {
  changa: 'Trabajos puntuales',
  fijo: 'Trabajo fijo',
  ambos: 'Puntual o fijo',
}

// Cuántas categorías se muestran como etiqueta antes de resumir en "+N"
const MAX_ETIQUETAS = 3

const etiqueta = (fondo: string, texto: string): React.CSSProperties => ({
  fontSize: 11.5,
  fontWeight: 500,
  color: texto,
  background: fondo,
  padding: '4px 10px',
  borderRadius: 100,
  whiteSpace: 'nowrap',
})

export default function TrabajadoresList({ trabajadores }: { trabajadores: Trabajador[] }) {
  if (trabajadores.length === 0) {
    return (
      <div
        style={{
          background: COLORS.card,
          border: `2px dashed ${COLORS.line}`,
          borderRadius: 22,
          padding: 28,
          textAlign: 'center',
        }}
      >
        <p style={{ color: COLORS.inkSoft, fontSize: 14, margin: '0 0 12px', lineHeight: 1.5 }}>
          Todavía no hay trabajadores en el listado.
        </p>
        <a href="/perfil#trabajador" style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.ink }}>
          Sumate desde tu perfil →
        </a>
      </div>
    )
  }

  return (
    // En compu, en grilla
    <div className="web-grilla">
      {trabajadores.map((t) => {
        const visibles = t.categorias.slice(0, MAX_ETIQUETAS)
        const resto = t.categorias.length - visibles.length
        return (
          <a
            key={t.id}
            href={`/prestadores/${t.id}?volver=/`}
            style={{
              display: 'flex',
              gap: 12,
              background: COLORS.card,
              boxShadow: COLORS.cardShadow,
              borderRadius: 22,
              padding: 14,
              marginBottom: 10,
              alignItems: 'flex-start',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: COLORS.clayTint,
                color: COLORS.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                fontWeight: 600,
                flexShrink: 0,
                backgroundImage: t.fotoUrl ? `url(${t.fotoUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!t.fotoUrl && (t.nombre[0]?.toUpperCase() ?? '?')}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: COLORS.ink, letterSpacing: '-0.01em' }}>
                  {t.nombre}
                </p>
                <span
                  aria-hidden
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: COLORS.clay,
                    color: COLORS.onClay,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M8 7h9v9" />
                  </svg>
                </span>
              </div>

              {t.sobreMi && (
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: 12.5,
                    color: COLORS.inkSoft,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {t.sobreMi}
                </p>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {visibles.map((c) => (
                  <span key={c.nombre} style={etiqueta(COLORS.tagOrange, COLORS.tagOrangeText)}>
                    {c.nombre}
                  </span>
                ))}
                {resto > 0 && <span style={etiqueta(COLORS.tagOrange, COLORS.tagOrangeText)}>+{resto}</span>}
                {t.tipoBusqueda && BUSQUEDA_LABEL[t.tipoBusqueda] && (
                  <span style={etiqueta(COLORS.tagBlue, COLORS.tagBlueText)}>{BUSQUEDA_LABEL[t.tipoBusqueda]}</span>
                )}
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}
