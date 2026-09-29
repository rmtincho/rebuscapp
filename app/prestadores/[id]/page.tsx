import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import PerfilPublico, { type Calificacion } from '@/components/PerfilPublico'

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

  return (
    <PerfilPublico
      usuario={usuario}
      perfil={perfil}
      rubros={rubros}
      calificaciones={calificaciones}
      hechos={completadosComoTrabajador ?? 0}
      ofrecidosCompletados={completadosComoOferente ?? 0}
      volver={volver || '/'}
    />
  )
}
