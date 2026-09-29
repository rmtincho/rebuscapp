import { createClient } from '@/lib/supabase/server'
import { COLORS } from '@/lib/theme'
import { formatearFechaCorta, formatearHora } from '@/lib/fechas'

// Lista de conversaciones del usuario (un pedido + la otra persona), la más
// reciente arriba. La usan la pantalla de Mensajes y, en compu, la columna
// izquierda de los chats. `activa` resalta la conversación abierta.

type Mensaje = {
  pedido_id: string
  emisor_id: string
  receptor_id: string
  contenido: string | null
  fecha: string
  leido: boolean
}

type Conversacion = {
  pedidoId: string
  otroId: string
  ultimo: Mensaje
  sinLeer: number
}

function cuando(fecha: string) {
  return formatearFechaCorta(fecha) === formatearFechaCorta(new Date()) ? formatearHora(fecha) : formatearFechaCorta(fecha)
}

export default async function ListaConversaciones({ usuarioId, activa }: { usuarioId: string; activa?: string }) {
  const supabase = await createClient()
  const user = { id: usuarioId }

  const { data: mensajes } = await supabase
    .from('mensajes')
    .select('pedido_id, emisor_id, receptor_id, contenido, fecha, leido')
    .or(`emisor_id.eq.${user.id},receptor_id.eq.${user.id}`)
    .order('fecha', { ascending: false })
    .limit(500)

  // Agrupar por pedido + la otra persona (vienen ordenados: el primero de
  // cada grupo es el último mensaje)
  const porClave = new Map<string, Conversacion>()
  for (const m of (mensajes ?? []) as Mensaje[]) {
    const otroId = m.emisor_id === user.id ? m.receptor_id : m.emisor_id
    const clave = `${m.pedido_id}:${otroId}`
    let conv = porClave.get(clave)
    if (!conv) {
      conv = { pedidoId: m.pedido_id, otroId, ultimo: m, sinLeer: 0 }
      porClave.set(clave, conv)
    }
    if (m.receptor_id === user.id && !m.leido) conv.sinLeer++
  }
  const conversaciones = [...porClave.values()]

  const pedidoIds = [...new Set(conversaciones.map((c) => c.pedidoId))]
  const otrosIds = [...new Set(conversaciones.map((c) => c.otroId))]
  const [{ data: pedidos }, { data: personas }] = await Promise.all([
    pedidoIds.length > 0
      ? supabase.from('pedidos').select('id, descripcion, estado, solicitante_id, prestador_asignado_id').in('id', pedidoIds)
      : Promise.resolve({ data: [] }),
    otrosIds.length > 0
      ? supabase.from('usuarios').select('id, nombre, apellido, foto_perfil_url').in('id', otrosIds)
      : Promise.resolve({ data: [] }),
  ])
  const pedidoPorId = new Map((pedidos ?? []).map((p) => [p.id, p]))
  const personaPorId = new Map((personas ?? []).map((p) => [p.id, p]))

  // Misma regla que las notificaciones de mensaje: /chat es el del trabajo
  // ya asignado (dueño ↔ trabajador elegido); /chat/<otro>, el de cada postulante
  function enlace(c: Conversacion) {
    const p = pedidoPorId.get(c.pedidoId)
    const esChatDelAsignado =
      !!p &&
      p.estado !== 'abierto' &&
      [user.id, c.otroId].includes(p.solicitante_id) &&
      [user.id, c.otroId].includes(p.prestador_asignado_id)
    return esChatDelAsignado ? `/pedidos/${c.pedidoId}/chat` : `/pedidos/${c.pedidoId}/chat/${c.otroId}`
  }

  return (
    <>
      {conversaciones.length === 0 && (
        <div
          style={{
            background: COLORS.card,
            border: `1.5px dashed ${COLORS.line}`,
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <p style={{ color: COLORS.inkSoft, fontSize: 14, margin: 0 }}>
            Todavía no tenés mensajes. Cuando hables con alguien por un trabajo, la conversación aparece acá.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {conversaciones.map((c) => {
          const persona = personaPorId.get(c.otroId)
          const pedido = pedidoPorId.get(c.pedidoId)
          const nombre = `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim() || 'Usuario'
          const mio = c.ultimo.emisor_id === user.id
          const texto = c.ultimo.contenido ?? ''
          const tieneSinLeer = c.sinLeer > 0
          return (
            <a
              key={`${c.pedidoId}:${c.otroId}`}
              href={enlace(c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 18,
                background: COLORS.card,
                boxShadow: COLORS.cardShadow,
                textDecoration: 'none',
                color: COLORS.ink,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: COLORS.clayTint,
                  backgroundImage: persona?.foto_perfil_url ? `url(${persona.foto_perfil_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {!persona?.foto_perfil_url && nombre[0]?.toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <p
                    style={{
                      flex: 1,
                      minWidth: 0,
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {nombre}
                  </p>
                  <span style={{ flexShrink: 0, fontSize: 11.5, color: tieneSinLeer ? COLORS.clayDark : COLORS.inkSoft, fontWeight: 600 }}>
                    {cuando(c.ultimo.fecha)}
                  </span>
                </div>
                <p
                  style={{
                    margin: '1px 0 0',
                    fontSize: 12,
                    color: COLORS.inkSoft,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                  }}
                >
                  {pedido?.descripcion ?? 'Trabajo'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <p
                    style={{
                      flex: 1,
                      minWidth: 0,
                      margin: 0,
                      fontSize: 13.5,
                      color: tieneSinLeer ? COLORS.ink : COLORS.inkSoft,
                      fontWeight: tieneSinLeer ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {mio && 'Vos: '}
                    {texto}
                  </p>
                  {tieneSinLeer && (
                    <span
                      style={{
                        flexShrink: 0,
                        minWidth: 20,
                        height: 20,
                        padding: '0 6px',
                        borderRadius: 100,
                        background: COLORS.red,
                        color: '#FFFFFF',
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.sinLeer}
                    </span>
                  )}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </>
  )
}
