import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import PerfilPublico, { type Calificacion } from '@/components/PerfilPublico'
import { anunciosPara } from '@/lib/anuncios'
import { loBloqueo } from '@/lib/bloqueos'
import { COLORS } from '@/lib/theme'

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // La cuenta del equipo (MODERADOR_USUARIO_ID) no muestra perfil: ni
  // foto, ni datos, ni calificaciones
  if (process.env.MODERADOR_USUARIO_ID && id === process.env.MODERADOR_USUARIO_ID) {
    return <CuentaOficial volver={volver || '/'} />
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, foto_perfil_url, created_at')
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

  const admin = createAdminClient()
  const [
    { data: perfil },
    { data: categoriasInteres },
    { data: calificacionesData },
    { count: completadosComoTrabajador },
    { count: completadosComoOferente },
  ] = await Promise.all([
    supabase
      .from('perfiles_prestador')
      .select(
        'nivel_educativo, tipo_busqueda, disponibilidad_horaria, experiencia, sobre_mi, tiene_carnet, carnets_declarados, idiomas_declarados'
      )
      .eq('usuario_id', id)
      .maybeSingle(),
    supabase.from('prestador_categorias').select('categoria_slug, categorias ( nombre )').eq('prestador_id', id),
    // Calificaciones y conteos por el servidor: son públicos en el perfil,
    // pero no dependemos de que RLS deje leer las filas de otra persona
    admin.from('calificaciones').select('*').eq('calificado_id', id),
    admin
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .eq('prestador_asignado_id', id)
      .eq('estado', 'completado'),
    admin
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .eq('solicitante_id', id)
      .eq('estado', 'completado'),
  ])

  const calificaciones: Calificacion[] = (calificacionesData ?? [])
    .map((c: Record<string, unknown>) => ({
      estrellas: Number(c.estrellas) || 0,
      comentario: (c.comentario as string | null) ?? null,
      tipo: String(c.tipo ?? ''),
      fecha: ((c.fecha ?? c.created_at) as string | null) ?? null,
    }))
    .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))

  const rubros: string[] = (categoriasInteres ?? []).map((c) => {
    const cat = c.categorias as { nombre: string } | { nombre: string }[] | null
    return (Array.isArray(cat) ? cat[0]?.nombre : cat?.nombre) ?? c.categoria_slug
  })

  const esOtro = !!user && user.id !== id
  const bloqueado = esOtro ? await loBloqueo(user.id, id) : false

  return (
    <PerfilPublico
      usuario={usuario}
      perfil={perfil}
      rubros={rubros}
      calificaciones={calificaciones}
      hechos={completadosComoTrabajador ?? 0}
      ofrecidosCompletados={completadosComoOferente ?? 0}
      volver={volver || '/'}
      anuncio={(await anunciosPara(['perfil_web'])).perfil_web}
      moderacion={esOtro ? { otroId: id, bloqueado } : null}
    />
  )
}

function CuentaOficial({ volver }: { volver: string }) {
  return (
    <div className="fondo-pantalla" style={{ background: COLORS.wrapperBg, minHeight: '100vh' }}>
      <div className="pantalla" style={{ background: COLORS.paper, minHeight: '100vh' }}>
        <div style={{ padding: '20px 16px 40px' }}>
          <Link href={volver} style={{ fontSize: 13, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 500 }}>
            ← Volver
          </Link>
          <div
            style={{
              maxWidth: 420,
              margin: '32px auto 0',
              background: COLORS.card,
              border: `1.5px solid ${COLORS.line}`,
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: COLORS.ink, margin: 0 }}>
              Cuenta oficial de Rebuscapp
            </p>
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.5, margin: '8px 0 0' }}>
              Desde esta cuenta el equipo responde consultas y revisa denuncias.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
