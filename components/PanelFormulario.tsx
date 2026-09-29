import { COLORS } from '@/lib/theme'

// Panel amarillo que acompaña a los formularios en compu (columna izquierda
// fija): título, una bajada y algunos consejos. En el celular no se muestra;
// ahí el formulario lleva su título de siempre.
export default function PanelFormulario({
  titulo,
  texto,
  consejos = [],
}: {
  titulo: string
  texto: string
  consejos?: string[]
}) {
  return (
    <aside className="web-lateral solo-escritorio">
      <div style={{ background: COLORS.clayGradient, borderRadius: 28, padding: '30px 26px' }}>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            color: COLORS.ink,
            margin: '0 0 12px',
          }}
        >
          {titulo}
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(28, 28, 30, 0.75)', margin: 0 }}>{texto}</p>

        {consejos.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '22px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {consejos.map((c) => (
              <li key={c} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.45, color: COLORS.ink }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: COLORS.dark,
                    color: COLORS.clay,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
