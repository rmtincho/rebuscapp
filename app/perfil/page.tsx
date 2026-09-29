import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PerfilForm from '@/components/PerfilForm'

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles_prestador')
    .select(
      'nivel_educativo, tipo_busqueda, disponibilidad_horaria, experiencia, sobre_mi, tiene_carnet, carnets_declarados, idiomas_declarados'
    )
    .eq('usuario_id', user.id)
    .maybeSingle()

  // Aparte del resto: si la columna todavía no existe (falta correr
  // scripts/sql/2026-09-28-visible-en-listado.sql), el perfil sigue
  // funcionando y el formulario simplemente no muestra esa opción.
  const { data: visibilidad, error: errorVisibilidad } = await supabase
    .from('perfiles_prestador')
    .select('visible_en_listado')
    .eq('usuario_id', user.id)
    .maybeSingle()
  const visibleEnListado = errorVisibilidad ? null : (visibilidad?.visible_en_listado ?? false)

  // Edad y DNI no son públicos (ver scripts/sql/2026-09-29-seguridad-rls.sql):
  // los datos propios se leen con el cliente admin, siempre filtrando por
  // el usuario de la sesión.
  const { data: usuario } = await createAdminClient()
    .from('usuarios')
    .select('foto_perfil_url, nombre, apellido, edad, dni')
    .eq('id', user.id)
    .maybeSingle()

  const { data: grupos } = await supabase
    .from('categorias_grupo')
    .select('slug, nombre, categorias ( slug, nombre, requiere_matricula )')
    .order('nombre')

  const { data: categoriasInteres } = await supabase
    .from('prestador_categorias')
    .select('categoria_slug, categorias ( nombre )')
    .eq('prestador_id', user.id)

  // Traemos también el nombre del grupo de cada categoría de interés, para mostrarlo
  const gruposMapa: Record<string, string> = {}
  ;(grupos ?? []).forEach((g: any) => {
    g.categorias?.forEach((c: any) => {
      gruposMapa[c.slug] = g.nombre
    })
  })

  const categoriasInteresFormateadas = (categoriasInteres ?? []).map((ci: any) => ({
    slug: ci.categoria_slug,
    nombre: ci.categorias?.nombre ?? ci.categoria_slug,
    grupoNombre: gruposMapa[ci.categoria_slug] ?? '',
  }))

  return (
    <PerfilForm
      perfilExistente={perfil}
      fotoActual={usuario?.foto_perfil_url ?? null}
      nombreActual={usuario?.nombre ?? ''}
      apellidoActual={usuario?.apellido ?? ''}
      edadActual={usuario?.edad ?? null}
      dniActual={usuario?.dni ?? ''}
      grupos={grupos ?? []}
      categoriasInteresIniciales={categoriasInteresFormateadas}
      visibleEnListadoInicial={visibleEnListado}
    />
  )
}