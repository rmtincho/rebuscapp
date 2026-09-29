import { COLORS } from '@/lib/theme'

// La tarjeta amarilla de arriba del perfil: foto, nombre, calificación,
// datos rápidos y un botón. La usan el perfil público y "Tu perfil".

// Debajo del nombre: sus rubros ("Plomería · Gas · Electricidad y 2 más")
export function textoRubros(rubros: string[]): string | null {
  if (rubros.length === 0) return null
  const primeros = rubros.slice(0, 3).join(' · ')
  return rubros.length > 3 ? `${primeros} y ${rubros.length - 3} más` : primeros
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
        background: COLORS.clay,
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
        <p style={{ fontSize: 13.5, color: 'rgba(28, 28, 30, 0.65)', margin: '3px 0 0', fontWeight: 500 }}>
          {subtitulo}
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
