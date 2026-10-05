import { COLORS } from '@/lib/theme'
import { haceCuanto } from '@/lib/fechas'
import { tituloDe } from '@/lib/tarjetaTrabajo'

// "Tus trabajos publicados" en Tu perfil (solo lo ve el propio usuario):
// todos los abiertos y en curso, y los últimos cerrados; el resto de los
// cerrados está en el historial. Los datos los arma app/perfil/page.tsx;
// los eliminados no aparecen.

export type Publicacion = {
  id: string
  descripcion: string
  categoria: string | null
  estado: string
  noConcretado: boolean
  fecha: string | null
  // Postulaciones esperando respuesta (solo en los abiertos)
  postulantes: number
}

const ESTADOS: Record<string, { texto: string; fondo: string; color: string }> = {
  abierto: { texto: 'Buscando', fondo: COLORS.clayTint, color: COLORS.clayDark },
  en_curso: { texto: 'En curso', fondo: COLORS.blueTint, color: COLORS.blueDark },
  completado: { texto: 'Completado', fondo: COLORS.greenTint, color: COLORS.greenDark },
  no_concretado: { texto: 'No concretado', fondo: '#EDEDF2', color: '#4B4B55' },
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

const enlace: React.CSSProperties = { fontSize: 13, color: COLORS.clayDark }

export default function TusPublicaciones({
  publicaciones,
  cerradosEnTotal,
}: {
  publicaciones: Publicacion[]
  // Completados y no concretados, para el link al historial
  cerradosEnTotal: number
}) {
  return (
    <div
      id="publicados"
      className="estadisticas-bloque"
      style={{
        scrollMarginTop: 16,
        background: COLORS.card,
        borderRadius: 24,
        padding: 18,
        boxShadow: COLORS.cardShadow,
        marginBottom: 28,
      }}
    >
      {/* Mismas clases que "Tu actividad": en compu, sin tarjeta y con el título grande */}
      <span className="estadisticas-titulo" style={pillTitulo}>
        Tus trabajos publicados
      </span>

      {publicaciones.length === 0 ? (
        <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '14px 0 0', lineHeight: 1.45 }}>
          Todavía no publicaste ningún trabajo.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
          {publicaciones.map((p, i) => {
            const estado = ESTADOS[p.noConcretado ? 'no_concretado' : p.estado] ?? ESTADOS.abierto
            return (
              <li key={p.id} style={{ borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
                <a
                  href={`/pedidos/${p.id}?volver=${encodeURIComponent('/perfil#publicados')}`}
                  style={{ display: 'block', padding: '11px 0', textDecoration: 'none', color: COLORS.ink }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3, minWidth: 0 }}>{tituloDe(p.descripcion)}</span>
                    <span style={{ flexShrink: 0, fontSize: 11.5, background: estado.fondo, color: estado.color, padding: '3px 8px', borderRadius: 5 }}>
                      {estado.texto}
                    </span>
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3 }}>
                    {[
                      p.categoria,
                      p.fecha ? haceCuanto(p.fecha) : null,
                      p.estado === 'abierto' && !p.noConcretado
                        ? p.postulantes > 0
                          ? `${p.postulantes} postulante${p.postulantes === 1 ? '' : 's'} esperando`
                          : 'Sin postulantes todavía'
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        <a href="/publicar" style={enlace}>
          {publicaciones.length === 0 ? 'Publicar un trabajo →' : 'Publicar otro →'}
        </a>
        {cerradosEnTotal > 0 && (
          <a href="/historial" style={enlace}>
            Ver historial ({cerradosEnTotal}) →
          </a>
        )}
      </div>
    </div>
  )
}
