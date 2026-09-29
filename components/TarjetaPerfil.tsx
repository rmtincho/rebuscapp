import { COLORS } from '@/lib/theme'

// La tarjeta amarilla de arriba del perfil: foto, nombre, calificación,
// datos rápidos y un botón. La usan el perfil público y "Tu perfil".

const SEPARADOR = ' | '

// Línea debajo del nombre: rubro | horario | carnet | idiomas.
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
}): string | null {
  const partes = [
    rubros.length > 2 ? `${rubros.slice(0, 2).join(', ')} y ${rubros.length - 2} más` : rubros.join(', '),
    horario,
    tieneCarnet === 'si'
      ? (clasesCarnet ?? []).length > 0
        ? `Carnet ${(clasesCarnet ?? []).join(', ')}`
        : 'Con carnet'
      : tieneCarnet === 'no'
      ? 'Sin carnet'
      : null,
    idiomas != null ? ['Español', ...idiomas].join(', ') : null,
  ].filter(Boolean)
  return partes.length > 0 ? partes.join(SEPARADOR) : null
}

const pillClara: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 12.5,
  fontWeight: 600,
  color: COLORS.ink,
  background: 'rgba(255, 255, 255, 0.55)',
  padding: '6px 12px',
  borderRadius: 100,
}

export default function TarjetaPerfil({
  nombre,
  fotoUrl,
  subtitulo,
  pills,
  promedio,
  cantidadCalificaciones,
  boton,
}: {
  nombre: string
  fotoUrl: string | null
  subtitulo: string | null
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
      {subtitulo && (
        <p style={{ fontSize: 13.5, color: 'rgba(28, 28, 30, 0.72)', margin: '4px 0 0', fontWeight: 600, lineHeight: 1.5 }}>
          {/* Cada dato entero en su renglón: se corta entre datos, no adentro */}
          {subtitulo.split(SEPARADOR).map((parte, i) => (
            <span key={i}>
              {/* Los espacios alrededor del "|" son donde puede cortar el renglón */}
              {i > 0 && <span style={{ opacity: 0.45 }}> | </span>}
              <span style={{ display: 'inline-block', maxWidth: '100%' }}>{parte}</span>
            </span>
          ))}
        </p>
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
