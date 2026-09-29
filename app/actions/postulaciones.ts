'use server'

import { createClient } from '@/lib/supabase/server'
import { enviarPush } from '@/lib/push-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Las server actions son endpoints públicos: antes de tocar nada
// verificamos que quien llama sea el dueño del pedido y que la
// postulación sea de ese pedido y de ese prestador. No dependemos solo
// de RLS para esto.
// volverA viene del form: solo aceptamos rutas internas, para que no se
// pueda usar como redirección a otro sitio.
function rutaInterna(valor: FormDataEntryValue | null) {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//')
    ? valor
    : null
}

async function verificarDuenio(pedidoId: string, postulacionId: string, prestadorId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('solicitante_id, descripcion, jornada')
    .eq('id', pedidoId)
    .maybeSingle()
  if (!pedido || pedido.solicitante_id !== user.id) return null

  const { data: postulacion } = await supabase
    .from('postulaciones')
    .select('id')
    .eq('id', postulacionId)
    .eq('pedido_id', pedidoId)
    .eq('prestador_id', prestadorId)
    .maybeSingle()
  if (!postulacion) return null

  return { supabase, pedido }
}

export async function elegirPrestador(formData: FormData) {
  const pedidoId = formData.get('pedidoId') as string
  const postulacionId = formData.get('postulacionId') as string
  const prestadorId = formData.get('prestadorId') as string
  const volverA = rutaInterna(formData.get('volverA')) ?? `/pedidos/${pedidoId}`

  const verificado = await verificarDuenio(pedidoId, postulacionId, prestadorId)
  if (!verificado) redirect(volverA)
  const { supabase } = verificado

  const { data: pedidoActualizado } = await supabase
    .from('pedidos')
    .update({ estado: 'en_curso', prestador_asignado_id: prestadorId })
    .eq('id', pedidoId)
    .select('descripcion')
    .single()

  await supabase.from('postulaciones').update({ estado: 'aceptada' }).eq('id', postulacionId)

  await supabase
    .from('postulaciones')
    .update({ estado: 'rechazada' })
    .eq('pedido_id', pedidoId)
    .neq('id', postulacionId)

  try {
    await enviarPush({
      usuarioId: prestadorId,
      tipo: 'postulante_elegido',
      titulo: '¡Te eligieron!',
      cuerpo: pedidoActualizado?.descripcion
        ? `Fuiste elegido para: ${pedidoActualizado.descripcion}`
        : 'Fuiste elegido para un trabajo',
      urlDestino: `/pedidos/${pedidoId}`,
    })
  } catch {
    // silencioso a propósito
  }

  redirect(volverA)
}

export async function rechazarPostulante(formData: FormData) {
  const pedidoId = formData.get('pedidoId') as string
  const postulacionId = formData.get('postulacionId') as string
  const prestadorId = formData.get('prestadorId') as string
  const volverA = rutaInterna(formData.get('volverA'))

  const verificado = await verificarDuenio(pedidoId, postulacionId, prestadorId)
  if (!verificado) redirect(volverA ?? `/pedidos/${pedidoId}`)
  const { supabase, pedido } = verificado

  await supabase.from('postulaciones').update({ estado: 'rechazada' }).eq('id', postulacionId)

  try {
    const cuerpo =
      pedido?.jornada === 'changa'
        ? 'Optaré por otro presupuesto. Gracias por comunicarte de todas formas.'
        : pedido?.descripcion
        ? `No fuiste seleccionado para: ${pedido.descripcion}`
        : 'No fuiste seleccionado para este puesto'

    await enviarPush({
      usuarioId: prestadorId,
      tipo: 'postulacion_rechazada',
      titulo: 'Actualización de tu postulación',
      cuerpo,
      urlDestino: `/pedidos/${pedidoId}`,
    })
  } catch {
    // silencioso a propósito
  }

  if (volverA) {
    redirect(volverA)
  } else {
    revalidatePath(`/pedidos/${pedidoId}`)
  }
}