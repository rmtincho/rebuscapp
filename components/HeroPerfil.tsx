import { COLORS } from '@/lib/theme'
import { ICONOS_RESUMEN, type DatoResumen } from '@/components/TarjetaPerfil'

// Franja amarilla de arriba del perfil en la versión web, de lado a lado
// como el hero del inicio (en el celular sigue la TarjetaPerfil). Foto
// grande, nombre, calificación y datos en texto corrido, sin cápsulas.
// La usan el perfil público ("Cómo me ven") y "Tu perfil"; a la derecha
// cada pantalla pone lo suyo.

export default function HeroPerfil({
  nombre,
  fotoUrl,
  resumen,
  datos,
  promedio,
  cantidadCalificaciones,
  volver,
  debajoDeLaFoto,
  children,
}: {
  nombre: string
  fotoUrl: string | null
  resumen: DatoResumen[]
  // Datos sueltos ("Trabajo fijo", "Secundario", "3 trabajos"), separados por punto
  datos: string[]
  promedio: number | null
  cantidadCalificaciones: number
  volver: { href: string; label: string }
  debajoDeLaFoto?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="solo-escritorio perfil-hero" style={{ background: COLORS.clayGradient, color: COLORS.ink }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 44px' }}>
        <a href={volver.href} style={{ fontSize: 14, color: 'rgba(28, 28, 30, 0.7)', textDecoration: 'none' }}>
          ← {volver.label}
        </a>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '150px minmax(0, 1fr) 300px',
            gap: 36,
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: COLORS.card,
                backgroundImage: fotoUrl ? `url(${fotoUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 56,
                fontWeight: 800,
              }}
            >
              {!fotoUrl && nombre.trim()[0]?.toUpperCase()}
            </div>
            {debajoDeLaFoto}
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 16, margin: '0 0 6px', color: 'rgba(28, 28, 30, 0.75)' }}>
              {promedio !== null ? (
                <>
                  <span style={{ color: COLORS.ink }}>★ {promedio.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</span>
                  {' · '}
                  {cantidadCalificaciones} calificaci{cantidadCalificaciones === 1 ? 'ón' : 'ones'}
                </>
              ) : (
                'Nuevo en Rebuscapp, todavía sin calificaciones'
              )}
            </p>
            <h1 style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02, margin: 0 }}>{nombre}</h1>

            {resumen.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginTop: 16, fontSize: 15.5, lineHeight: 1.4 }}>
                {resumen.map((d) => (
                  <span key={d.tipo} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <span style={{ display: 'inline-flex', flexShrink: 0, opacity: 0.75 }}>{ICONOS_RESUMEN[d.tipo]}</span>
                    {d.texto}
                  </span>
                ))}
              </div>
            )}
            {datos.length > 0 && (
              <p style={{ fontSize: 15.5, margin: '8px 0 0', color: 'rgba(28, 28, 30, 0.75)' }}>{datos.join(' · ')}</p>
            )}
          </div>

          <div>{children}</div>
        </div>
      </div>
    </section>
  )
}

// Botón oscuro de la franja (ej. "Ver cómo me ven")
export function BotonHero({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 18px',
        borderRadius: 10,
        background: COLORS.dark,
        color: COLORS.onDark,
        fontSize: 16,
        fontWeight: 700,
        textDecoration: 'none',
      }}
    >
      {children}
      <span style={{ color: COLORS.clay, fontSize: 20 }}>→</span>
    </a>
  )
}
