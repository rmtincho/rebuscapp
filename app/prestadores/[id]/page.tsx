import { createClient } from '@/lib/supabase/server'
import { COLORS } from '@/lib/theme'
import Link from 'next/link'
import { CLASES_CARNET_FLAT } from '@/lib/carnetsIdiomas'

const NIVEL_LABEL: Record<string, string> = {
  primario: 'Primario',
  secundario: 'Secundario',
  terciario: 'Terciario',
  universitario: 'Universitario',
  posgrado: 'Posgrado',
}

const BUSQUEDA_LABEL: Record<string, string> = {
  changa: 'Trabajos puntuales',
  fijo: 'Trabajo fijo',
  ambos: 'Trabajos puntuales o fijos',
}

const DISPONIBILIDAD_LABEL: Record<string, string> = {
  fulltime: 'Full time',
  parttime: 'Part time',
  flexible: 'Flexible',
}

function nombreClaseCarnet(valor: string): string {
  return CLASES_CARNET_FLAT.find((c) => c.valor === valor)?.label ?? valor
}

const chip: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 12.5,
  fontWeight: 600,
  color: COLORS.ink,
  background: COLORS.line,
  padding: '5px 12px',
  borderRadius: 100,
  marginRight: 6,
  marginBottom: 6,
}

export default async function PerfilPrestadorPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ volver?: string }>
}) {
  const { id } = await params
  const { volver } = await searchParams
  const supabase = await createClient()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, foto_perfil_url')
    .eq('id', id)
    .maybeSingle()

  if (!usuario) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-body)' }}>
        <p>No encontramos este perfil.</p>
        <Link href="/">Volver</Link>
      </div>
    )
  }

  const { data: perfil } = await supabase
    .from('perfiles_prestador')
    .select(
      'nivel_educativo, tipo_busqueda, disponibilidad_horaria, experiencia, sobre_mi, tiene_carnet, carnets_declarados, idiomas_declarados'
    )
    .eq('usuario_id', id)
    .maybeSingle()

  const { data: categoriasInteres } = await supabase
    .from('prestador_categorias')
    .select('categoria_slug, categorias ( nombre )')
    .eq('prestador_id', id)

  return (
    <div style={{ background: COLORS.wrapperBg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', background: COLORS.paper, minHeight: '100vh' }}>
        <div style={{ padding: 20 }}>
          <Link
            href={volver || '/'}
            style={{ fontSize: 13, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 600 }}
          >
            ← Volver
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0 24px' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: COLORS.card,
                border: `1.5px solid ${COLORS.line}`,
                flexShrink: 0,
                overflow: 'hidden',
                backgroundImage: usuario.foto_perfil_url ? `url(${usuario.foto_perfil_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {!usuario.foto_perfil_url && usuario.nombre?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: COLORS.ink,
                  margin: 0,
                }}
              >
                {usuario.apellido ? `${usuario.nombre} ${usuario.apellido}` : usuario.nombre}
              </h1>
              {perfil?.tipo_busqueda && (
                <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '4px 0 0', fontWeight: 600 }}>
                  {BUSQUEDA_LABEL[perfil.tipo_busqueda] ?? perfil.tipo_busqueda}
                </p>
              )}
            </div>
          </div>

          {!perfil && (
            <div
              style={{
                background: COLORS.card,
                border: `1.5px dashed ${COLORS.line}`,
                borderRadius: 16,
                padding: 20,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              <p style={{ color: COLORS.inkSoft, fontSize: 13.5, margin: 0 }}>
                Esta persona todavía no completó su perfil de prestador.
              </p>
            </div>
          )}

          {(perfil?.nivel_educativo || perfil?.disponibilidad_horaria) && (
            <div style={{ marginBottom: 20 }}>
              {perfil?.nivel_educativo && (
                <span style={chip}>🎓 {NIVEL_LABEL[perfil.nivel_educativo] ?? perfil.nivel_educativo}</span>
              )}
              {perfil?.disponibilidad_horaria && (
                <span style={chip}>🕓 {DISPONIBILIDAD_LABEL[perfil.disponibilidad_horaria] ?? perfil.disponibilidad_horaria}</span>
              )}
            </div>
          )}

          {categoriasInteres && categoriasInteres.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Le interesa
              </p>
              {categoriasInteres.map((c: any) => (
                <span key={c.categoria_slug} style={chip}>
                  {c.categorias?.nombre ?? c.categoria_slug}
                </span>
              ))}
            </div>
          )}

          {perfil?.tiene_carnet && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Carnet de conducir
              </p>
              {perfil.tiene_carnet === 'no' ? (
                <span style={chip}>No tiene</span>
              ) : (perfil.carnets_declarados ?? []).length > 0 ? (
                (perfil.carnets_declarados ?? []).map((c: string) => (
                  <span key={c} style={chip}>
                    🚗 {nombreClaseCarnet(c)}
                  </span>
                ))
              ) : (
                <span style={chip}>Tiene, sin especificar clase</span>
              )}
            </div>
          )}

          {perfil?.idiomas_declarados != null && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Idiomas
              </p>
              {perfil.idiomas_declarados.length > 0 ? (
                perfil.idiomas_declarados.map((idioma: string) => (
                  <span key={idioma} style={chip}>
                    🗣️ {idioma}
                  </span>
                ))
              ) : (
                <span style={chip}>Solo español</span>
              )}
            </div>
          )}

          {perfil?.experiencia && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Experiencia
              </p>
              <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.55, margin: 0 }}>{perfil.experiencia}</p>
            </div>
          )}

          {perfil?.sobre_mi && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Sobre {usuario.nombre}
              </p>
              <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.55, margin: 0 }}>{perfil.sobre_mi}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}