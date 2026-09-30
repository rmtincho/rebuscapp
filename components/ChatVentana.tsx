'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'
import { formatearHora } from '@/lib/fechas'
import { notificarMensajeNuevo } from '@/app/actions/notificaciones'

type Mensaje = {
  id: string
  emisor_id: string
  contenido: string
  fecha: string
}

export default function ChatVentana({
  pedidoId,
  usuarioId,
  otroUsuarioId,
  mensajesIniciales,
  puedeEscribir = true,
  mensajeSoloLectura,
  bloqueado = false,
}: {
  pedidoId: string
  usuarioId: string
  otroUsuarioId: string
  mensajesIniciales: Mensaje[]
  // false cuando todavía nadie escribió y este usuario no puede
  // iniciar la conversación (ej: postulante en un puesto fijo, antes
  // de que el solicitante le escriba)
  puedeEscribir?: boolean
  mensajeSoloLectura?: string
  // Hay un bloqueo entre los dos: no se puede escribir nunca
  bloqueado?: boolean
}) {
  const supabase = createClient()
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  // Una vez que hay al menos un mensaje, cualquiera de los dos puede
  // seguir escribiendo (el bloqueo es solo para "iniciar" la charla).
  const habilitado = !bloqueado && (puedeEscribir || mensajes.length > 0)

  // Al entrar al chat, marcamos como leídos los mensajes pendientes
  // de este par de usuarios en este pedido — así el contador de
  // "no leídos" de la home baja de verdad.
  useEffect(() => {
    supabase
      .from('mensajes')
      .update({ leido: true })
      .eq('pedido_id', pedidoId)
      .eq('emisor_id', otroUsuarioId)
      .eq('receptor_id', usuarioId)
      .eq('leido', false)
      .then(() => {})
  }, [pedidoId, usuarioId, otroUsuarioId, supabase])

  useEffect(() => {
    const canal = supabase
      .channel(`chat-${pedidoId}-${[usuarioId, otroUsuarioId].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `pedido_id=eq.${pedidoId}`,
        },
        (payload) => {
          const nuevo = payload.new as Mensaje & { receptor_id: string }
          // El filtro de Realtime solo puede filtrar por pedido_id, así
          // que acá adentro nos quedamos solo con los mensajes de ESTE
          // par de usuarios (puede haber varias conversaciones en
          // paralelo sobre el mismo pedido, en un puesto fijo).
          const esDeEstePar =
            (nuevo.emisor_id === usuarioId && nuevo.receptor_id === otroUsuarioId) ||
            (nuevo.emisor_id === otroUsuarioId && nuevo.receptor_id === usuarioId)
          if (!esDeEstePar) return

          setMensajes((prev) => {
            if (prev.some((m) => m.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })

          // Si el mensaje es para mí y llegó mientras tengo el chat
          // abierto, lo marco leído al toque.
          if (nuevo.receptor_id === usuarioId) {
            supabase.from('mensajes').update({ leido: true }).eq('id', nuevo.id).then(() => {})
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [pedidoId, usuarioId, otroUsuarioId, supabase])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviarMensaje(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || enviando) return

    setEnviando(true)

    const contenidoAEnviar = texto.trim()
    setTexto('')

    const { error } = await supabase.from('mensajes').insert({
      pedido_id: pedidoId,
      emisor_id: usuarioId,
      receptor_id: otroUsuarioId,
      contenido: contenidoAEnviar,
    })

    setEnviando(false)

    if (error) {
      // Devolvemos el texto al campo para que no se pierda
      setTexto(contenidoAEnviar)
      alert('No pudimos enviar el mensaje: ' + error.message)
      return
    }

    notificarMensajeNuevo(pedidoId, otroUsuarioId).catch(() => {})
  }

  return (
    <>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {mensajes.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.inkSoft, fontSize: 13, marginTop: 20 }}>
            {habilitado ? 'Todavía no hay mensajes. Escribí el primero.' : mensajeSoloLectura ?? 'Todavía no hay mensajes.'}
          </p>
        )}

        {mensajes.map((m) => {
          const esMio = m.emisor_id === usuarioId
          const hora = formatearHora(m.fecha)
          return (
            <div
              key={m.id}
              style={{
                alignSelf: esMio ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
              }}
            >
              <div
                style={{
                  padding: '10px 13px',
                  borderRadius: 16,
                  fontSize: 14,
                  lineHeight: 1.45,
                  background: esMio ? COLORS.clay : COLORS.card,
                  color: esMio ? COLORS.onClay : COLORS.ink,
                  border: esMio ? 'none' : `1px solid ${COLORS.line}`,
                }}
              >
                {m.contenido}
              </div>
              <p
                style={{
                  fontSize: 10.5,
                  color: COLORS.inkSoft,
                  margin: '3px 4px 0',
                  textAlign: esMio ? 'right' : 'left',
                }}
              >
                {hora}
              </p>
            </div>
          )
        })}
        <div ref={finRef} />
      </div>

      {habilitado ? (
        <form
          onSubmit={enviarMensaje}
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
            borderTop: `1px solid ${COLORS.line}`,
            background: COLORS.card,
          }}
        >
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 100,
              border: `1px solid ${COLORS.line}`,
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: COLORS.clay,
              color: COLORS.onClay,
              cursor: 'pointer',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            →
          </button>
        </form>
      ) : (
        <div
          style={{
            padding: '14px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
            borderTop: `1px solid ${COLORS.line}`,
            background: COLORS.card,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: 0 }}>
            {mensajeSoloLectura ?? 'Esperá a que te escriban para responder.'}
          </p>
        </div>
      )}
    </>
  )
}