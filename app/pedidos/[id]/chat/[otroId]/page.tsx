import { createClient } from '@/lib/supabase/server'
import { COLORS } from '@/lib/theme'
import { tituloDe } from '@/lib/tarjetaTrabajo'
import ChatVentana from '@/components/ChatVentana'
import ListaConversaciones from '@/components/ListaConversaciones'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { elegirPrestador, rechazarPostulante } from '@/app/actions/postulaciones'
import { idsConBloqueo } from '@/lib/bloqueos'

export default async function ChatMultiplePage({
  params,
}: {
  params: Promise<{ id: string; otroId: string }>
}) {
  const { id, otroId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('id, descripcion, solicitante_id, jornada, estado')
    .eq('id', id)
    .single()

  if (!pedido) redirect('/')

  const esSolicitante = user.id === pedido.solicitante_id
  let miPostulacion: { id: string; estado: string } | null = null

  if (esSolicitante) {
    const { data: postulacion } = await supabase
      .from('postulaciones')
      .select('id, estado')
      .eq('pedido_id', id)
      .eq('prestador_id', otroId)
      .maybeSingle()

    if (!postulacion) redirect(`/pedidos/${id}`)
    miPostulacion = postulacion
  } else {
    if (otroId !== pedido.solicitante_id) redirect(`/pedidos/${id}`)

    const { data: miPostulacionData } = await supabase
      .from('postulaciones')
      .select('id')
      .eq('pedido_id', id)
      .eq('prestador_id', user.id)
      .maybeSingle()

    if (!miPostulacionData) redirect(`/pedidos/${id}`)
  }

  const { data: otroUsuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido')
    .eq('id', otroId)
    .maybeSingle()

  const nombreOtro = otroUsuario
    ? `${otroUsuario.nombre ?? ''} ${otroUsuario.apellido ?? ''}`.trim() || 'Chat'
    : 'Chat'

  const { data: mensajesIniciales } = await supabase
    .from('mensajes')
    .select('id, emisor_id, contenido, fecha')
    .eq('pedido_id', id)
    .or(`and(emisor_id.eq.${user.id},receptor_id.eq.${otroId}),and(emisor_id.eq.${otroId},receptor_id.eq.${user.id})`)
    .order('fecha', { ascending: true })

  const puedeEscribir = esSolicitante
  const bloqueado = (await idsConBloqueo(user.id)).has(otroId)

  // Barra de decisión: solo para el solicitante, en una changa, mientras
  // la postulación de esta persona sigue pendiente.
  const mostrarDecision =
    esSolicitante && pedido.jornada === 'changa' && miPostulacion?.estado === 'pendiente'

  const volverA = esSolicitante ? `/pedidos/${id}` : `/pedidos/${id}`

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
          <ListaConversaciones usuarioId={user.id} activa={`${id}:${otroId}`} />
        </aside>
        <div className="chat-panel">
        <div
          data-encabezado-chat
          style={{
            padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px 16px',
            borderBottom: `1px solid ${COLORS.line}`,
            background: COLORS.card,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Link
            href={esSolicitante ? `/pedidos/${id}` : `/pedidos/${id}`}
            style={{ fontSize: 11.5, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 500 }}
          >
            ← Volver
          </Link>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 17,
              fontWeight: 500,
              color: COLORS.ink,
              fontFamily: 'var(--font-display)',
            }}
          >
            {tituloDe(pedido.descripcion)}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 500 }}>
            <Link
            href={`/prestadores/${otroId}?volver=/pedidos/${id}/chat/${otroId}`}
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            {nombreOtro}
          </Link>
          </p>
        </div>

        {mostrarDecision && miPostulacion && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 20px',
              background: '#FFFBF3',
              borderBottom: `1px solid ${COLORS.line}`,
            }}
          >
            <form action={elegirPrestador} style={{ flex: 1 }}>
              <input type="hidden" name="pedidoId" value={id} />
              <input type="hidden" name="postulacionId" value={miPostulacion.id} />
              <input type="hidden" name="prestadorId" value={otroId} />
              <input type="hidden" name="volverA" value={volverA} />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 100,
                  border: 'none',
                  background: '#15803D',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Elegir
              </button>
            </form>
            <form action={rechazarPostulante} style={{ flex: 1 }}>
              <input type="hidden" name="pedidoId" value={id} />
              <input type="hidden" name="postulacionId" value={miPostulacion.id} />
              <input type="hidden" name="prestadorId" value={otroId} />
              <input type="hidden" name="volverA" value={volverA} />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 100,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Rechazar
              </button>
            </form>
          </div>
        )}

        <ChatVentana
          pedidoId={id}
          usuarioId={user.id}
          otroUsuarioId={otroId}
          mensajesIniciales={mensajesIniciales ?? []}
          puedeEscribir={puedeEscribir}
          bloqueado={bloqueado}
          mensajeSoloLectura={
            bloqueado
              ? 'No se pueden enviar mensajes en esta conversación.'
              : !puedeEscribir
              ? 'Todavía no te escribió quien publicó el trabajo. Cuando lo haga, vas a poder responder acá.'
              : undefined
          }
        />
        </div>
        </div>
      </div>
    </div>
  )
}