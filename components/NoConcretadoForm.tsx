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
  TituloSeccion,
  Chip,
  inputBaseStyle,
  BotonPrincipal,
  MensajeError,
} from '@/lib/ui'

const MOTIVOS = [
  { valor: 'no_se_presento', label: 'El otro no se presentó' },
  { valor: 'no_coordinaron', label: 'No llegamos a coordinar' },
  { valor: 'cancelo_antes', label: 'Se canceló antes de empezar' },
  { valor: 'yo_cancele', label: 'Yo tuve que cancelar' },
  { valor: 'otro', label: 'Otro motivo' },
]

export default function NoConcretadoForm({
  pedidoId,
  descripcionPedido,
  otroUsuarioNombre,
}: {
  pedidoId: string
  descripcionPedido: string
  otroUsuarioNombre: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [motivo, setMotivo] = useState('no_coordinaron')
  const [descargo, setDescargo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar(e: React.FormEvent) {
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

    const { error: errorInsert } = await supabase.from('no_concretados').insert({
      pedido_id: pedidoId,
      reportado_por: user.id,
      motivo,
      descargo: descargo.trim() || null,
    })

    if (errorInsert) {
      setError('No pudimos guardar esto: ' + errorInsert.message)
      setCargando(false)
      return
    }

    // Va por el servidor porque también lo puede reportar el trabajador,
    // y la base solo deja modificar el pedido a quien lo publicó
    const resultado = await cerrarPedido(pedidoId, 'no_concretado')

    setCargando(false)

    if (!resultado.ok) {
      setError(resultado.error)
      return
    }

    router.push(`/pedidos/${pedidoId}`)
    router.refresh()
  }

  return (
    <PantallaBase>
      <div style={{ padding: '20px 20px 60px' }}>
        <LinkVolver href={`/pedidos/${pedidoId}`} />

        {/* En compu: panel amarillo fijo a la izquierda y el formulario a la derecha */}
        <div className="web-dos-columnas">
        <PanelFormulario
          titulo={'¿Qué pasó?'}
          texto={'Contanos por qué el trabajo no se hizo. Así el pedido queda cerrado y en tu historial.'}
          consejos={['No afecta tus calificaciones.', 'Si hubo un problema con la otra persona, podés contarlo acá.']}
        />
        <div style={{ minWidth: 0 }}>
        <div className="solo-movil">
        <TituloPagina>¿Qué pasó?</TituloPagina>
        <Subtitulo>{descripcionPedido}</Subtitulo>
        </div>
        <form onSubmit={confirmar}>
          <TituloSeccion>Contanos por qué no se concretó</TituloSeccion>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {MOTIVOS.map((m) => (
              <button
                key={m.valor}
                type="button"
                onClick={() => setMotivo(m.valor)}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: `1.5px solid ${motivo === m.valor ? COLORS.ink : COLORS.line}`,
                  background: motivo === m.valor ? COLORS.card : 'transparent',
                  color: COLORS.ink,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${motivo === m.valor ? COLORS.clay : COLORS.line}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {motivo === m.valor && (
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLORS.clay }} />
                  )}
                </span>
                {m.label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              background: COLORS.blueTint,
              color: COLORS.blue,
              borderRadius: 14,
              padding: '13px 15px',
              marginBottom: 20,
              fontSize: 12.5,
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            Esto no es una mala calificación pública. Solo le avisamos a {otroUsuarioNombre} que
            marcaste el pedido como no concretado, y podrá dar su versión.
          </div>

          <TituloSeccion>¿Querés contar algo más? (opcional)</TituloSeccion>
          <textarea
            value={descargo}
            onChange={(e) => setDescargo(e.target.value)}
            placeholder="Contanos qué pasó..."
            rows={3}
            style={{ ...inputBaseStyle, marginBottom: 20, fontFamily: 'inherit', resize: 'vertical' }}
          />

          {error && <MensajeError>{error}</MensajeError>}

          <BotonPrincipal type="submit" disabled={cargando}>
            {cargando ? 'Confirmando...' : 'Confirmar'}
          </BotonPrincipal>
        </form>
        </div>
        </div>
      </div>
    </PantallaBase>
  )
}