import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PerfilForm from '@/components/PerfilForm'
import { esEmailAdmin } from '@/lib/admin'
import type { Estadisticas } from '@/components/TusEstadisticas'

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

  // Tu actividad: todo filtrado por el usuario de la sesión. Con el
  // cliente admin para contar también los pedidos que eliminó.
  const admin = createAdminClient()
  const [{ data: misPedidos }, { data: misPostulaciones }, { data: misCalificaciones }, { count: trabajosHechos }] =
    await Promise.all([
      admin.from('pedidos').select('id, estado').eq('solicitante_id', user.id),
      admin.from('postulaciones').select('estado').eq('prestador_id', user.id),
      admin.from('calificaciones').select('estrellas').eq('calificado_id', user.id),
      admin
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('prestador_asignado_id', user.id)
        .eq('estado', 'completado'),
    ])
  const cancelados = (misPedidos ?? []).filter((p) => p.estado === 'cancelado').map((p) => p.id)
  const { data: noConcretados } =
    cancelados.length > 0
      ? await admin.from('no_concretados').select('pedido_id').in('pedido_id', cancelados)
      : { data: [] as { pedido_id: string }[] }
  const idsNoConcretados = new Set((noConcretados ?? []).map((n) => n.pedido_id))
  // "Cancelado" sin fila en no_concretados = lo eliminó: no cuenta como publicado
  const pedidosVigentes = (misPedidos ?? []).filter((p) => p.estado !== 'cancelado' || idsNoConcretados.has(p.id))
  const estrellas = (misCalificaciones ?? []).map((c) => Number(c.estrellas) || 0)

  const estadisticas: Estadisticas = {
    usuarioId: user.id,
    pedidosPublicados: pedidosVigentes.length,
    pedidosActivos: pedidosVigentes.filter((p) => p.estado === 'abierto' || p.estado === 'en_curso').length,
    pedidosCompletados: pedidosVigentes.filter((p) => p.estado === 'completado').length,
    pedidosNoConcretados: idsNoConcretados.size,
    postulaciones: (misPostulaciones ?? []).length,
    postulacionesPendientes: (misPostulaciones ?? []).filter((p) => p.estado === 'pendiente').length,
    postulacionesAceptadas: (misPostulaciones ?? []).filter((p) => p.estado === 'aceptada').length,
    trabajosHechos: trabajosHechos ?? 0,
    promedio: estrellas.length > 0 ? estrellas.reduce((a, b) => a + b, 0) / estrellas.length : null,
    cantidadCalificaciones: estrellas.length,
  }

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
      estadisticas={estadisticas}
      esAdmin={esEmailAdmin(user.email)}
    />
  )
}