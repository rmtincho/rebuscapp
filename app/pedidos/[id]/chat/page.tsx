import { createClient } from '@/lib/supabase/server'
import { COLORS } from '@/lib/theme'
import ChatVentana from '@/components/ChatVentana'
import ListaConversaciones from '@/components/ListaConversaciones'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { idsConBloqueo } from '@/lib/bloqueos'

export default async function ChatPage({
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
    .select('id, descripcion, solicitante_id, prestador_asignado_id, estado')
    .eq('id', id)
    .single()

  if (!pedido) {
    return <p style={{ padding: 40 }}>Trabajo no encontrado.</p>
  }

  const esParte =
    user.id === pedido.solicitante_id || user.id === pedido.prestador_asignado_id

  // Solo las dos partes involucradas pueden entrar al chat
  if (!esParte || pedido.estado === 'abierto') {
    redirect(`/pedidos/${id}`)
  }

  const otroUsuarioId =
    user.id === pedido.solicitante_id ? pedido.prestador_asignado_id : pedido.solicitante_id

  const { data: otroUsuario } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', otroUsuarioId)
    .maybeSingle()

  const bloqueado = (await idsConBloqueo(user.id)).has(otroUsuarioId!)

  const { data: mensajesIniciales } = await supabase
    .from('mensajes')
    .select('id, emisor_id, contenido, fecha')
    .eq('pedido_id', id)
    .or(
      `and(emisor_id.eq.${user.id},receptor_id.eq.${otroUsuarioId}),and(emisor_id.eq.${otroUsuarioId},receptor_id.eq.${user.id})`
    )
    .order('fecha', { ascending: true })

  return (
    <div className="fondo-pantalla" style={{ background: '#F5EBD3', minHeight: '100dvh' }}>
      <div
        className="pantalla"
        style={{
          background: COLORS.paper,
          minHeight: 'calc(100dvh - var(--alto-cabecera))',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* En compu: conversaciones a la izquierda y el chat a la derecha.
            En el celular estas dos cajas no existen (display: contents). */}
        <div className="chat-grilla chat-envoltura">
        <aside className="solo-escritorio chat-lista">
          <ListaConversaciones usuarioId={user.id} activa={`${id}:${otroUsuarioId}`} />
        </aside>
        <div className="chat-panel">
        <div
          data-encabezado-chat
          style={{
            padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 16px',
            borderBottom: `1px solid ${COLORS.line}`,
            background: COLORS.card,
            position: 'sticky',
            top: 'var(--alto-cabecera)',
            zIndex: 10,
          }}
        >
          <Link
            href={`/pedidos/${id}`}
            style={{ fontSize: 11.5, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 600 }}
          >
            ← Volver
          </Link>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 17,
              fontWeight: 600,
              color: COLORS.ink,
              fontFamily: 'var(--font-display)',
              textTransform: 'capitalize',
            }}
          >
            {pedido.descripcion}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600 }}>
            <Link
            href={`/prestadores/${otroUsuarioId}?volver=/pedidos/${id}/chat`}
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            {otroUsuario?.nombre ?? 'Ver perfil'}
          </Link>
          </p>
        </div>

        <ChatVentana
          pedidoId={id}
          usuarioId={user.id}
          otroUsuarioId={otroUsuarioId!}
          mensajesIniciales={mensajesIniciales ?? []}
          bloqueado={bloqueado}
          mensajeSoloLectura={bloqueado ? 'No se pueden enviar mensajes en esta conversación.' : undefined}
        />
        </div>
        </div>
      </div>
    </div>
  )
}