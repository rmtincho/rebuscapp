import { COLORS } from '@/lib/theme'
import { TEMA_MODO, type ModoInicio } from '@/lib/modoInicio'
import EnlaceConCarga from '@/components/EnlaceConCarga'

// Encabezado del inicio (celular) con el color del modo: amarillo para
// "busco trabajo", oscuro para "busco contratar". Debajo va pegada la
// barra de modo (SelectorModo), del mismo color.
export default function CabeceraModo({
  modo,
  nombre,
  foto,
  inicial,
  cantidadTrabajos,
}: {
  modo: ModoInicio
  nombre: string | null
  foto: string | null
  inicial: string
  cantidadTrabajos: number
}) {
  const tema = TEMA_MODO[modo]

  const circulo: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: tema.superficie,
    color: tema.texto,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  return (
    <div style={{ background: tema.fondo, color: tema.texto, padding: '20px 20px 18px' }}>
      {/* Avatar + saludo a la izquierda, notificaciones a la derecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <a href="/perfil" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0, color: tema.texto }}>
          <span
            style={{
              ...circulo,
              fontWeight: 600,
              fontSize: 16,
              backgroundImage: foto ? `url(${foto})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!foto && inicial}
          </span>
          <span style={{ fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nombre ? `Hola, ${nombre}` : 'Hola 👋'}
          </span>
        </a>
        <a href="/configuracion/notificaciones" aria-label="Notificaciones" style={circulo}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </a>
      </div>

      <h1 style={{ margin: '18px 0 0', color: tema.texto, fontSize: 24, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
        {modo === 'busco' ? 'Trabajo cerca tuyo' : '¿A quién necesitás?'}
      </h1>

      {modo === 'busco' ? (
        <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600, color: tema.textoSuave }}>
          {cantidadTrabajos === 1 ? '1 trabajo abierto' : `${cantidadTrabajos} trabajos abiertos`} · postulate y chateá
        </p>
      ) : (
        <EnlaceConCarga
          href="/publicar"
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '16px 18px',
            borderRadius: 22,
            background: COLORS.clay,
            color: COLORS.onClay,
            textDecoration: 'none',
          }}
        >
          <span>
            <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>Publicar un trabajo</span>
            <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(28,28,30,0.7)', marginTop: 2 }}>
              Les avisamos a los trabajadores del rubro
            </span>
          </span>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: COLORS.dark,
              color: COLORS.clay,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </EnlaceConCarga>
      )}
    </div>
  )
}
