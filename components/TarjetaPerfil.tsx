import { COLORS } from '@/lib/theme'

// La tarjeta amarilla de arriba del perfil: foto, nombre, calificación,
// datos rápidos y un botón. La usan el perfil público y "Tu perfil".

export type DatoResumen = { tipo: 'rubro' | 'horario' | 'carnet' | 'idiomas'; texto: string }

// Datos debajo del nombre: rubro, horario, carnet e idiomas.
// Solo lo que la persona tiene cargado.
export function lineaResumen({
  rubros,
  horario,
  tieneCarnet,
  clasesCarnet,
  idiomas,
}: {
  rubros: string[]
  horario: string | null | undefined
  tieneCarnet: string | null | undefined
  clasesCarnet: string[] | null | undefined
  idiomas: string[] | null | undefined
}): DatoResumen[] {
  const datos: (DatoResumen | null)[] = [
    rubros.length > 0
      ? {
          tipo: 'rubro',
          texto: rubros.length > 2 ? `${rubros.slice(0, 2).join(', ')} y ${rubros.length - 2} más` : rubros.join(', '),
        }
      : null,
    horario ? { tipo: 'horario', texto: horario } : null,
    tieneCarnet === 'si'
      ? {
          tipo: 'carnet',
          texto: (clasesCarnet ?? []).length > 0 ? `Carnet ${(clasesCarnet ?? []).join(', ')}` : 'Con carnet',
        }
      : tieneCarnet === 'no'
      ? { tipo: 'carnet', texto: 'Sin carnet' }
      : null,
    idiomas != null ? { tipo: 'idiomas', texto: ['Español', ...idiomas].join(', ') } : null,
  ]
  return datos.filter((d): d is DatoResumen => d !== null)
}

// Íconos chicos delante de cada dato (en vez de separadores, que al
// pasar de renglón quedaban sueltos al principio o al final)
const trazo = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
export const ICONOS_RESUMEN: Record<DatoResumen['tipo'], React.ReactNode> = {
  rubro: (
    <svg {...trazo}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  horario: (
    <svg {...trazo}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  carnet: (
    <svg {...trazo}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M15 10h3M15 13h3" />
    </svg>
  ),
  idiomas: (
    <svg {...trazo}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </svg>
  ),
}

const pillClara: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 12.5,
  fontWeight: 500,
  color: COLORS.ink,
  background: 'rgba(255, 255, 255, 0.55)',
  padding: '6px 12px',
  borderRadius: 100,
}

export default function TarjetaPerfil({
  nombre,
  fotoUrl,
  resumen,
  pills,
  promedio,
  cantidadCalificaciones,
  boton,
}: {
  nombre: string
  fotoUrl: string | null
  resumen: DatoResumen[]
  pills: string[]
  promedio: number | null
  cantidadCalificaciones: number
  boton: { href: string; label: string } | null
}) {
  return (
    <div
      style={{
        position: 'relative',
        marginTop: 14,
        background: COLORS.clayGradient,
        borderRadius: 28,
        padding: '22px 18px 20px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: COLORS.dark,
          color: COLORS.onDark,
          fontSize: 12.5,
          fontWeight: 700,
          padding: '6px 11px',
          borderRadius: 100,
        }}
      >
        {promedio !== null ? (
          <>
            ★ {promedio.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
            <span style={{ fontWeight: 500, opacity: 0.7 }}> ({cantidadCalificaciones})</span>
          </>
        ) : (
          'Nuevo'
        )}
      </span>

      <div
        style={{
          width: 96,
          height: 96,
          margin: '8px auto 12px',
          borderRadius: '50%',
          border: '4px solid rgba(255, 255, 255, 0.7)',
          background: COLORS.card,
          backgroundImage: fotoUrl ? `url(${fotoUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          fontWeight: 700,
          color: COLORS.ink,
        }}
      >
        {!fotoUrl && nombre.trim()[0]?.toUpperCase()}
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 21,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: COLORS.ink,
          margin: 0,
        }}
      >
        {nombre}
      </h1>
      {resumen.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '4px 14px',
            margin: '6px 0 0',
            fontSize: 13.5,
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'rgba(28, 28, 30, 0.75)',
          }}
        >
          {resumen.map((d) => (
            <span key={d.tipo} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: '100%' }}>
              <span style={{ display: 'inline-flex', flexShrink: 0, opacity: 0.8 }}>{ICONOS_RESUMEN[d.tipo]}</span>
              <span style={{ minWidth: 0 }}>{d.texto}</span>
            </span>
          ))}
        </div>
      )}

      {pills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {pills.map((p) => (
            <span key={p} style={pillClara}>
              {p}
            </span>
          ))}
        </div>
      )}

      {boton && (
        <a
          href={boton.href}
          style={{
            display: 'block',
            marginTop: 18,
            padding: 15,
            borderRadius: 100,
            background: COLORS.dark,
            color: COLORS.onDark,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {boton.label}
        </a>
      )}
    </div>
  )
}
