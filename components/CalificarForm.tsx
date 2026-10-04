'use client'

import PanelFormulario from '@/components/PanelFormulario'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'
import { cerrarPedido } from '@/app/actions/pedidos'
import {
  PantallaBase,
  LinkVolver,
  TituloPagina,
  Subtitulo,
  inputBaseStyle,
  BotonPrincipal,
  MensajeError,
} from '@/lib/ui'

const TAGS = ['Puntual', 'Buen trato', 'Muy prolijo/a', 'Lo/la recomiendo']

export default function CalificarForm({
  pedidoId,
  descripcionPedido,
  otroUsuarioNombre,
  otroUsuarioId,
  tipo,
  yaCalifico,
  pedidoYaCompletado,
}: {
  pedidoId: string
  descripcionPedido: string
  otroUsuarioNombre: string
  otroUsuarioId: string
  tipo: 'solicitante_a_prestador' | 'prestador_a_solicitante'
  yaCalifico: boolean
  pedidoYaCompletado: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  const [estrellas, setEstrellas] = useState(5)
  const [tagsElegidos, setTagsElegidos] = useState<string[]>([])
  const [comentario, setComentario] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTag(tag: string) {
    setTagsElegidos((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Tu sesión expiró, volvé a loguearte.')
      setCargando(false)
      return
    }

    const comentarioFinal = [tagsElegidos.join(', '), comentario.trim()].filter(Boolean).join(' — ')

    const { error: errorCalificacion } = await supabase.from('calificaciones').insert({
      pedido_id: pedidoId,
      calificador_id: user.id,
      calificado_id: otroUsuarioId,
      estrellas,
      comentario: comentarioFinal || null,
      tipo,
    })

    if (errorCalificacion) {
      setError('No pudimos guardar tu calificación: ' + errorCalificacion.message)
      setCargando(false)
      return
    }

    // Marcamos el pedido como completado (si todavía no lo estaba). Va
    // por el servidor porque también lo puede hacer el trabajador.
    if (!pedidoYaCompletado) {
      const resultado = await cerrarPedido(pedidoId, 'completado')
      if (!resultado.ok) {
        setError('Guardamos tu calificación, pero no pudimos cerrar el trabajo: ' + resultado.error)
        setCargando(false)
        return
      }
    }

    setCargando(false)
    router.push(`/pedidos/${pedidoId}`)
    router.refresh()
  }

  if (yaCalifico) {
    return (
      <PantallaBase>
        <div style={{ padding: '20px 20px 60px', textAlign: 'center' }}>
          <LinkVolver href={`/pedidos/${pedidoId}`} />
          <div style={{ marginTop: 60 }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>✓</p>
            <TituloPagina>Ya calificaste este trabajo</TituloPagina>
            <Subtitulo>Gracias por dejar tu opinión sobre {otroUsuarioNombre}.</Subtitulo>
          </div>
        </div>
      </PantallaBase>
    )
  }

  return (
    <PantallaBase>
      <div style={{ padding: '20px 20px 60px', textAlign: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <LinkVolver href={`/pedidos/${pedidoId}`} />
        </div>

        {/* En compu: panel amarillo fijo a la izquierda y el formulario a la derecha */}
        <div className="web-dos-columnas">
        <PanelFormulario
          titulo={'Calificá el trabajo'}
          texto={'Tu opinión ayuda a que la próxima persona elija con confianza.'}
          consejos={['Solo califican las dos personas de un trabajo que se hizo.', 'Sé justo: contá cómo fue, sin insultos.', 'La calificación aparece en su perfil.']}
        />
        <div style={{ minWidth: 0 }}>
        <div className="solo-movil">
        <TituloPagina>¿Cómo te fue con {otroUsuarioNombre}?</TituloPagina>
        <Subtitulo>{descripcionPedido}</Subtitulo>
        </div>
        <form onSubmit={enviar}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 26 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEstrellas(n)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill={n <= estrellas ? COLORS.clay : 'none'}
                  stroke={n <= estrellas ? COLORS.clay : COLORS.line}
                  strokeWidth="1.5"
                >
                  <path d="M12 2l2.9 6.5L22 9.3l-5 4.9 1.2 7L12 17.8 5.8 21.2 7 14.2 2 9.3l7.1-.8z" />
                </svg>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            {TAGS.map((tag) => {
              const activo = tagsElegidos.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '9px 15px',
                    borderRadius: 100,
                    fontSize: 12.5,
                    fontWeight: 500,
                    border: `1.5px solid ${activo ? COLORS.ink : COLORS.line}`,
                    background: activo ? COLORS.navActiveBg : 'transparent',
                    color: activo ? COLORS.ink : COLORS.inkSoft,
                    cursor: 'pointer',
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>

          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Contá cómo te fue (opcional)"
            rows={3}
            style={{ ...inputBaseStyle, marginBottom: 20, textAlign: 'left', fontFamily: 'inherit', resize: 'vertical' }}
          />

          {error && <MensajeError>{error}</MensajeError>}

          <BotonPrincipal type="submit" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Enviar calificación'}
          </BotonPrincipal>
        </form>
        </div>
        </div>
      </div>
    </PantallaBase>
  )
}