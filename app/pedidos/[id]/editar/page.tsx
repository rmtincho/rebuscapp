import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditarPedidoForm from '@/components/EditarPedidoForm'

export default async function EditarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select(
      `
      id,
      descripcion,
      categoria_slug,
      marca_vehiculo,
      tipo_comercio,
      monto_ofrecido,
      monto_a_convenir,
      pide_videollamada_previa,
      es_comercio,
      nombre_comercio,
      jornada,
      turno,
      imagen_empresa,
      logo_comercio_url,
      requisito_nivel_educativo,
      edad_minima,
      requiere_carnet_conducir,
      categoria_carnet_requerida,
      idioma_requerido,
      requiere_matricula_profesional,
      requisitos_adicionales,
      ubicacion_lat,
      ubicacion_lng,
      solicitante_id,
      estado
      `
    )
    .eq('id', id)
    .single()

  if (error || !pedido) {
    redirect('/')
  }

  // Solo el dueño puede editar, y solo mientras esté abierto (una vez
  // en curso, cambiar los datos podría confundir al prestador elegido)
  if (pedido.solicitante_id !== user.id || pedido.estado !== 'abierto') {
    redirect(`/pedidos/${id}`)
  }

  const [{ data: grupos }, { data: yo }] = await Promise.all([
    supabase
      .from('categorias_grupo')
      .select('slug, nombre, categorias ( slug, nombre, requiere_matricula )')
      .order('nombre'),
    supabase.from('usuarios').select('foto_perfil_url').eq('id', user.id).maybeSingle(),
  ])

  return <EditarPedidoForm pedido={pedido} grupos={grupos ?? []} fotoPerfil={yo?.foto_perfil_url ?? null} />
}