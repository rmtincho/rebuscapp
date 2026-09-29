import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalificarForm from '@/components/CalificarForm'

export default async function CalificarPage({
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

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('id, descripcion, estado, solicitante_id, prestador_asignado_id')
    .eq('id', id)
    .single()

  if (!pedido) redirect('/')

  const esParte = user.id === pedido.solicitante_id || user.id === pedido.prestador_asignado_id
  if (!esParte || pedido.estado === 'abierto') {
    redirect(`/pedidos/${id}`)
  }

  const soyElSolicitante = user.id === pedido.solicitante_id
  const otroUsuarioId = soyElSolicitante ? pedido.prestador_asignado_id : pedido.solicitante_id

  const { data: otroUsuario } = await supabase
    .from('usuarios')
    .select('nombre, foto_perfil_url')
    .eq('id', otroUsuarioId)
    .maybeSingle()

  // Si ya calificó, no lo dejamos calificar de nuevo
  const { data: calificacionExistente } = await supabase
    .from('calificaciones')
    .select('id')
    .eq('pedido_id', id)
    .eq('calificador_id', user.id)
    .maybeSingle()

  return (
    <CalificarForm
      pedidoId={id}
      descripcionPedido={pedido.descripcion}
      otroUsuarioNombre={otroUsuario?.nombre ?? 'esta persona'}
      otroUsuarioId={otroUsuarioId as string}
      tipo={soyElSolicitante ? 'solicitante_a_prestador' : 'prestador_a_solicitante'}
      yaCalifico={!!calificacionExistente}
      pedidoYaCompletado={pedido.estado === 'completado'}
    />
  )
}