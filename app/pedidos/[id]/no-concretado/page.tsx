import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NoConcretadoForm from '@/components/NoConcretadoForm'

export default async function NoConcretadoPage({
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
  if (!esParte || pedido.estado !== 'en_curso') {
    redirect(`/pedidos/${id}`)
  }

  const soyElSolicitante = user.id === pedido.solicitante_id
  const otroUsuarioId = soyElSolicitante ? pedido.prestador_asignado_id : pedido.solicitante_id

  const { data: otroUsuario } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', otroUsuarioId)
    .maybeSingle()

  return (
    <NoConcretadoForm
      pedidoId={id}
      descripcionPedido={pedido.descripcion}
      otroUsuarioNombre={otroUsuario?.nombre ?? 'esta persona'}
    />
  )
}