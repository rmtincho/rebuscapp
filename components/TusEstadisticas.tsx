import { COLORS } from '@/lib/theme'

// Resumen de actividad en "Tu perfil" (solo lo ve el propio usuario).
// Los números los calcula app/perfil/page.tsx.

export type Estadisticas = {
  usuarioId: string
  pedidosPublicados: number
  pedidosActivos: number
  pedidosCompletados: number
  pedidosNoConcretados: number
  postulaciones: number
  postulacionesPendientes: number
  postulacionesAceptadas: number
  trabajosHechos: number
  promedio: number | null
  cantidadCalificaciones: number
}

const pillTitulo: React.CSSProperties = {
  display: 'inline-block',
  background: COLORS.dark,
  color: COLORS.onDark,
  fontSize: 13,
  fontWeight: 500,
  padding: '7px 14px',
  borderRadius: 100,
}

const subtitulo: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: COLORS.inkSoft,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '18px 0 10px',
}

const acceso: React.CSSProperties = {
  flex: 1,
  textAlign: 'center',
  padding: '10px 8px',
  borderRadius: 100,
  border: `1.5px solid ${COLORS.line}`,
  fontSize: 12.5,
  fontWeight: 500,
  color: COLORS.ink,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

function Grilla({ datos }: { datos: { valor: number; etiqueta: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 14px' }}>
      {datos.map((d) => (
        <div key={d.etiqueta}>
          <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, margin: 0, lineHeight: 1.2 }}>{d.valor}</p>
          <p style={{ fontSize: 12, color: COLORS.inkSoft, margin: '2px 0 0' }}>{d.etiqueta}</p>
        </div>
      ))}
    </div>
  )
}

export default function TusEstadisticas({ e }: { e: Estadisticas }) {
  return (
    <div
      className="estadisticas-bloque"
      style={{
        background: COLORS.card,
        borderRadius: 24,
        padding: 18,
        boxShadow: COLORS.cardShadow,
        marginTop: 14,
        marginBottom: 28,
      }}
    >
      {/* La calificación está en la tarjeta amarilla de arriba */}
      <span className="estadisticas-titulo" style={pillTitulo}>Tu actividad</span>

      <p style={subtitulo}>Trabajos que ofreciste</p>
      <Grilla
        datos={[
          { valor: e.pedidosPublicados, etiqueta: 'Publicados' },
          { valor: e.pedidosActivos, etiqueta: 'Abiertos o en curso' },
          { valor: e.pedidosCompletados, etiqueta: 'Completados' },
          { valor: e.pedidosNoConcretados, etiqueta: 'No concretados' },
        ]}
      />

      <p style={subtitulo}>Como trabajador</p>
      <Grilla
        datos={[
          { valor: e.postulaciones, etiqueta: 'Postulaciones' },
          { valor: e.postulacionesPendientes, etiqueta: 'Esperando respuesta' },
          { valor: e.postulacionesAceptadas, etiqueta: 'Te eligieron' },
          { valor: e.trabajosHechos, etiqueta: 'Trabajos hechos' },
        ]}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <a href="/historial" className="estadisticas-acceso" style={acceso}>
          Historial
        </a>
        <a href="/mis-postulaciones" className="estadisticas-acceso" style={acceso}>
          Mis postulaciones
        </a>
      </div>
    </div>
  )
}
