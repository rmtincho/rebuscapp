import { createClient } from '@/lib/supabase/server'
import { COLORS } from '@/lib/theme'
import PostularseForm from '@/components/PostularseForm'
import EliminarPedidoBoton from '@/components/EliminarPedidoBoton'
import Link from 'next/link'
import { elegirPrestador, rechazarPostulante } from '@/app/actions/postulaciones'

export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select(
      `
      id,
      descripcion,
      monto_ofrecido,
      monto_a_convenir,
      pide_videollamada_previa,
      es_comercio,
      nombre_comercio,
      marca_vehiculo,
      tipo_comercio,
      jornada,
      requisito_nivel_educativo,
      requiere_carnet_conducir,
      categoria_carnet_requerida,
      idioma_requerido,
      requiere_matricula_profesional,
      requisitos_adicionales,
      solicitante_id,
      prestador_asignado_id,
      estado,
      categorias ( nombre ),
      usuarios!pedidos_solicitante_id_fkey ( nombre, apellido )
    `
    )
    .eq('id', id)
    .single()

  if (error || !pedido) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-body)' }}>
        <p>No encontramos este pedido.</p>
        <Link href="/">Volver</Link>
      </div>
    )
  }

  const esElDueño = user?.id === pedido.solicitante_id
  const soyElPrestadorAsignado = user?.id === pedido.prestador_asignado_id

  let yaPostulado = false
  let motivoBloqueo: string | null = null
  let faltanDatosBasicos = false

  if (user && !esElDueño) {
    const { data: postulacionExistente } = await supabase
      .from('postulaciones')
      .select('id')
      .eq('pedido_id', id)
      .eq('prestador_id', user.id)
      .maybeSingle()

    yaPostulado = !!postulacionExistente

    if (!yaPostulado && pedido.estado === 'abierto') {
      const { data: miUsuario } = await supabase
        .from('usuarios')
        .select('nombre, apellido, edad, dni')
        .eq('id', user.id)
        .maybeSingle()

      const nombreCompleto = (miUsuario?.nombre ?? '').trim().length >= 2 && (miUsuario?.apellido ?? '').trim().length >= 2
      faltanDatosBasicos = !nombreCompleto || !miUsuario?.edad || !miUsuario?.dni

      if (!faltanDatosBasicos) {
        const { data: perfil } = await supabase
          .from('perfiles_prestador')
          .select('tiene_carnet, carnets_declarados, idiomas_declarados')
          .eq('usuario_id', user.id)
          .maybeSingle()

        if (pedido.categoria_carnet_requerida) {
          if (perfil?.tiene_carnet === 'no') {
            motivoBloqueo = `Este pedido requiere carnet de conducir (${pedido.categoria_carnet_requerida}), y declaraste en tu perfil que no tenés.`
          } else if (
            perfil?.tiene_carnet === 'si' &&
            !(perfil.carnets_declarados ?? []).includes(pedido.categoria_carnet_requerida)
          ) {
            motivoBloqueo = `Este pedido requiere carnet de conducir clase ${pedido.categoria_carnet_requerida}, que no tenés declarado en tu perfil.`
          }
        }

        if (!motivoBloqueo && pedido.idioma_requerido && perfil?.idiomas_declarados != null) {
          if (!perfil.idiomas_declarados.includes(pedido.idioma_requerido)) {
            motivoBloqueo = `Este pedido requiere hablar ${pedido.idioma_requerido}, que no tenés declarado en tu perfil.`
          }
        }
      }
    }
  }

  let postulaciones: any[] = []
  const sinLeerPorPrestador: Record<string, number> = {}
  if (esElDueño && pedido.estado === 'abierto') {
    const { data: postulacionesData } = await supabase
      .from('postulaciones')
      .select(
        `
        id,
        mensaje,
        estado,
        fecha,
        prestador_id,
        usuarios!postulaciones_prestador_id_fkey ( nombre, apellido )
      `
      )
      .eq('pedido_id', id)
      .order('fecha', { ascending: false })

    postulaciones = postulacionesData ?? []

    for (const postulacion of postulaciones) {
      const { count } = await supabase
        .from('mensajes')
        .select('id', { count: 'exact', head: true })
        .eq('pedido_id', id)
        .eq('emisor_id', postulacion.prestador_id)
        .eq('receptor_id', user!.id)
        .eq('leido', false)
      sinLeerPorPrestador[postulacion.prestador_id] = count ?? 0
    }
  }

  const nombrePublicador = pedido.es_comercio
    ? pedido.nombre_comercio
    : (() => {
        const nombre = (pedido.usuarios as any)?.nombre ?? 'Alguien'
        const apellido = (pedido.usuarios as any)?.apellido ?? ''
        return apellido ? `${nombre} ${apellido}` : nombre
      })()

  const precio = pedido.monto_a_convenir
    ? 'A convenir'
    : pedido.monto_ofrecido
    ? `$${pedido.monto_ofrecido.toLocaleString('es-AR')}`
    : ''

  let nombrePrestadorAsignado: string | null = null
  if ((pedido.estado === 'en_curso' || pedido.estado === 'completado') && !soyElPrestadorAsignado) {
    const { data: prestador } = await supabase
      .from('usuarios')
      .select('nombre')
      .eq('id', pedido.prestador_asignado_id)
      .maybeSingle()
    nombrePrestadorAsignado = prestador?.nombre ?? 'un trabajador'
  }

  const botonChatStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    background: COLORS.blue,
    color: '#fff',
    padding: '16px 18px',
    borderRadius: 100,
    fontSize: 15,
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
  }

  return (
    <div style={{ background: COLORS.wrapperBg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', background: COLORS.paper, minHeight: '100vh' }}>
        <div style={{ padding: 20 }}>
          <Link
            href="/"
            style={{ fontSize: 13, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 600 }}
          >
            ← Volver
          </Link>

          <div
            style={{
              background: COLORS.card,
              border: `1.5px solid ${COLORS.line}`,
              borderRadius: 28,
              padding: 18,
              marginTop: 16,
              boxShadow: '0 4px 14px rgba(31,41,55,0.06)',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.ink,
                margin: '0 0 12px',
              }}
            >
              {pedido.descripcion}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: !esElDueño ? 12 : 0 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: COLORS.clayDark,
                  background: COLORS.line,
                  padding: '5px 12px',
                  borderRadius: 100,
                }}
              >
                {(pedido.categorias as any)?.nombre ?? 'Sin categoría'}
              </span>
              {precio && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#4B4B55',
                    background: '#EDEDF2',
                    padding: '5px 12px',
                    borderRadius: 100,
                  }}
                >
                  {precio}
                </span>
              )}
            </div>

            {!esElDueño && (
              <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: 0, fontWeight: 600 }}>
                Publicado por {nombrePublicador}
                {pedido.es_comercio && ' 🏢'}
              </p>
            )}

            {pedido.marca_vehiculo && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.ink,
                  background: COLORS.line,
                  padding: '4px 10px',
                  borderRadius: 100,
                }}
              >
                🚗 {pedido.marca_vehiculo}
              </span>
            )}

            {pedido.tipo_comercio && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  marginLeft: pedido.marca_vehiculo ? 8 : 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.ink,
                  background: COLORS.line,
                  padding: '4px 10px',
                  borderRadius: 100,
                }}
              >
                🏪 {pedido.tipo_comercio}
              </span>
            )}

            {pedido.pide_videollamada_previa && pedido.estado === 'abierto' && (
              <div
                style={{
                  marginTop: 14,
                  background: COLORS.blueTint,
                  color: COLORS.blue,
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: '10px 12px',
                  borderRadius: 10,
                }}
              >
                📹 Pide videollamada antes de elegir
              </div>
            )}

            {(pedido.requisito_nivel_educativo ||
              pedido.requiere_carnet_conducir ||
              pedido.categoria_carnet_requerida ||
              pedido.idioma_requerido ||
              pedido.requiere_matricula_profesional ||
              pedido.requisitos_adicionales) && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${COLORS.line}` }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Requisitos
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: pedido.requisitos_adicionales ? 8 : 0 }}>
                  {pedido.requisito_nivel_educativo && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, background: COLORS.line, padding: '4px 10px', borderRadius: 100 }}>
                      🎓 {pedido.requisito_nivel_educativo === 'secundario' ? 'Secundario completo' : pedido.requisito_nivel_educativo === 'terciario' ? 'Terciario' : pedido.requisito_nivel_educativo === 'universitario' ? 'Universitario' : 'Posgrado'}
                    </span>
                  )}
                  {pedido.categoria_carnet_requerida ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, background: COLORS.line, padding: '4px 10px', borderRadius: 100 }}>
                      🚗 Carnet clase {pedido.categoria_carnet_requerida}
                    </span>
                  ) : pedido.requiere_carnet_conducir ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, background: COLORS.line, padding: '4px 10px', borderRadius: 100 }}>
                      🚗 Carnet de conducir
                    </span>
                  ) : null}
                  {pedido.idioma_requerido && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, background: COLORS.line, padding: '4px 10px', borderRadius: 100 }}>
                      🗣️ {pedido.idioma_requerido}
                    </span>
                  )}
                  {pedido.requiere_matricula_profesional && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, background: COLORS.line, padding: '4px 10px', borderRadius: 100 }}>
                      📋 Matrícula profesional vigente
                    </span>
                  )}
                </div>
                {pedido.requisitos_adicionales && (
                  <p style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5, margin: 0 }}>
                    {pedido.requisitos_adicionales}
                  </p>
                )}
              </div>
            )}

            {pedido.estado === 'en_curso' && (
              <div
                style={{
                  marginTop: 14,
                  background: COLORS.greenTint,
                  color: COLORS.green,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '10px 12px',
                  borderRadius: 10,
                }}
              >
                🤝 Coordinando {soyElPrestadorAsignado ? 'conmigo' : `con ${nombrePrestadorAsignado}`}
              </div>
            )}

            {pedido.estado === 'completado' && (
              <div
                style={{
                  marginTop: 14,
                  background: COLORS.greenTint,
                  color: COLORS.green,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '10px 12px',
                  borderRadius: 10,
                }}
              >
                ✓ Completado {soyElPrestadorAsignado ? 'conmigo' : `con ${nombrePrestadorAsignado}`}
              </div>
            )}

            {esElDueño && pedido.estado === 'abierto' && (
              <>
                <div style={{ borderTop: `1px dashed ${COLORS.line}`, margin: '16px -18px 14px' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link
                    href={`/pedidos/${id}/editar`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '12px',
                      borderRadius: 100,
                      border: `1.5px solid ${COLORS.clayDark}`,
                      color: COLORS.clayDark,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Editar
                  </Link>
                  <EliminarPedidoBoton pedidoId={id} />
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            {esElDueño && pedido.estado !== 'abierto' && (
              <div>
                {pedido.estado === 'completado' && (
                  <a
                    href={`/pedidos/${id}/calificar`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '13px',
                      borderRadius: 100,
                      border: `1.5px solid ${COLORS.green}`,
                      color: COLORS.green,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    ✓ Calificar
                  </a>
                )}
                {pedido.estado === 'en_curso' && (
                  <>
                    <a href={`/pedidos/${id}/chat`} style={botonChatStyle}>
                      💬 Ir al chat
                    </a>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <a
                        href={`/pedidos/${id}/calificar`}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '13px',
                          borderRadius: 100,
                          border: `1.5px solid ${COLORS.green}`,
                          color: COLORS.green,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        ✓ Marcar completado
                      </a>
                      <a
                        href={`/pedidos/${id}/no-concretado`}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '13px',
                          borderRadius: 100,
                          border: `1.5px solid ${COLORS.line}`,
                          color: COLORS.inkSoft,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        No se concretó
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}

            {!user && (
              <p style={{ color: COLORS.inkSoft, fontSize: 14 }}>
                <Link href="/login" style={{ color: COLORS.clayDark, fontWeight: 600 }}>
                  Iniciá sesión
                </Link>{' '}
                para postularte.
              </p>
            )}

            {user && !esElDueño && pedido.estado !== 'abierto' && (
              <>
                {pedido.estado === 'en_curso' && soyElPrestadorAsignado ? (
                  <>
                    <a href={`/pedidos/${id}/chat`} style={botonChatStyle}>
                      💬 Ir al chat
                    </a>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <a
                        href={`/pedidos/${id}/calificar`}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '13px',
                          borderRadius: 100,
                          border: `1.5px solid ${COLORS.green}`,
                          color: COLORS.green,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        ✓ Marcar completado
                      </a>
                      <a
                        href={`/pedidos/${id}/no-concretado`}
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '13px',
                          borderRadius: 100,
                          border: `1.5px solid ${COLORS.line}`,
                          color: COLORS.inkSoft,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        No se concretó
                      </a>
                    </div>
                  </>
                ) : pedido.estado === 'completado' && soyElPrestadorAsignado ? (
                  <a
                    href={`/pedidos/${id}/calificar`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '13px',
                      borderRadius: 100,
                      border: `1.5px solid ${COLORS.green}`,
                      color: COLORS.green,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    ✓ Calificar
                  </a>
                ) : (
                  <p style={{ color: COLORS.inkSoft, fontSize: 14 }}>
                    Este pedido ya no está abierto para postulaciones.
                  </p>
                )}
              </>
            )}

            {user && !esElDueño && pedido.estado === 'abierto' && yaPostulado && (
              <div
                style={{
                  background: COLORS.greenTint,
                  color: COLORS.green,
                  padding: 14,
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                ✓ Ya te postulaste a este pedido
              </div>
            )}

            {user && !esElDueño && pedido.estado === 'abierto' && !yaPostulado && (
              faltanDatosBasicos ? (
                <div
                  style={{
                    background: 'rgba(226, 105, 28, 0.08)',
                    padding: 14,
                    borderRadius: 14,
                  }}
                >
                  <p style={{ fontSize: 13.5, color: COLORS.clayDark, fontWeight: 600, lineHeight: 1.5, margin: '0 0 10px' }}>
                    📋 Antes de postularte, completá tus datos básicos (nombre, edad y DNI) — es una sola vez.
                  </p>
                  <Link
                    href={`/completar-datos?volver=/pedidos/${id}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '13px',
                      borderRadius: 100,
                      background: COLORS.clay,
                      color: COLORS.onClay,
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Completar datos
                  </Link>
                </div>
              ) : motivoBloqueo ? (
                <div
                  style={{
                    background: 'rgba(185, 8, 55, 0.08)',
                    color: '#8A0A32',
                    padding: 14,
                    borderRadius: 14,
                    fontSize: 13.5,
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  🔒 No podés postularte: {motivoBloqueo}{' '}
                  <Link href="/perfil" style={{ color: '#8A0A32', fontWeight: 700, textDecoration: 'underline' }}>
                    Revisar mi perfil
                  </Link>
                </div>
              ) : (
                <PostularseForm pedidoId={id} />
              )
            )}
          </div>

          {esElDueño && pedido.estado === 'abierto' && (
            <div style={{ marginTop: 28 }}>
              <p
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: COLORS.inkSoft,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                {postulaciones.length === 0
                  ? 'Postulantes'
                  : `${postulaciones.length} postulante${postulaciones.length > 1 ? 's' : ''}`}
              </p>

              {postulaciones.length === 0 && (
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
                    Todavía nadie se postuló a este pedido.
                  </p>
                </div>
              )}

              {postulaciones.map((postulacion) => {
                const nombre = (postulacion.usuarios as any)?.nombre ?? 'Alguien'
                const apellido = (postulacion.usuarios as any)?.apellido ?? ''
                const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre
                const sinLeer = sinLeerPorPrestador[postulacion.prestador_id] ?? 0

                return (
                  <div
                    key={postulacion.id}
                    style={{
                      background: COLORS.card,
                      border: `1.5px solid ${sinLeer > 0 ? COLORS.blue : COLORS.line}`,
                      borderRadius: 18,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: COLORS.card,
                          color: COLORS.ink,
                          border: `1.5px solid ${COLORS.line}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 15,
                          flexShrink: 0,
                        }}
                      >
                        {nombre[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>
                          {nombreCompleto}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: COLORS.inkSoft }}>
                          {postulacion.estado === 'pendiente' && 'Postulación pendiente'}
                          {postulacion.estado === 'aceptada' && '✓ Aceptada'}
                          {postulacion.estado === 'rechazada' && 'Rechazada'}
                          {' · '}
                          <Link
                            href={`/prestadores/${postulacion.prestador_id}?volver=/pedidos/${id}`}
                            style={{ color: COLORS.clayDark, fontWeight: 600, textDecoration: 'underline' }}
                          >
                            Ver perfil
                          </Link>
                        </p>
                      </div>
                      {sinLeer > 0 && (
                        <span
                          style={{
                            background: COLORS.blue,
                            color: '#FFFFFF',
                            borderRadius: 100,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            flexShrink: 0,
                          }}
                        >
                          💬 {sinLeer}
                        </span>
                      )}
                    </div>

                    {postulacion.mensaje && (
                      <p
                        style={{
                          fontSize: 13,
                          color: COLORS.inkSoft,
                          lineHeight: 1.5,
                          margin: '0 0 12px',
                          paddingTop: 10,
                          borderTop: `1px dashed ${COLORS.line}`,
                        }}
                      >
                        "{postulacion.mensaje}"
                      </p>
                    )}

                    {postulacion.estado === 'aceptada' && (
                      <Link
                        href={`/pedidos/${id}/chat`}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: 12,
                          fontSize: 14,
                          fontWeight: 600,
                          borderRadius: 100,
                          border: 'none',
                          background: COLORS.blue,
                          color: '#FFFFFF',
                          textDecoration: 'none',
                        }}
                      >
                        {sinLeer > 0 ? `💬 Ver mensajes (${sinLeer})` : '💬 Ir al chat'}
                      </Link>
                    )}

                    {postulacion.estado === 'pendiente' &&
                      (pedido.jornada === 'changa' ? (
                        <div>
                          <Link
                            href={`/pedidos/${id}/chat/${postulacion.prestador_id}`}
                            style={{
                              display: 'block',
                              textAlign: 'center',
                              padding: 12,
                              fontSize: 14,
                              fontWeight: 600,
                              borderRadius: 100,
                              border: `1.5px solid ${COLORS.blue}`,
                              background: 'transparent',
                              color: COLORS.blue,
                              textDecoration: 'none',
                              marginBottom: 8,
                            }}
                          >
                            {sinLeer > 0 ? `💬 Mensajes (${sinLeer})` : '💬 Chatear'}
                          </Link>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <ElegirBoton pedidoId={id} postulacionId={postulacion.id} prestadorId={postulacion.prestador_id} />
                            <RechazarBoton pedidoId={id} postulacionId={postulacion.id} prestadorId={postulacion.prestador_id} />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link
                            href={`/pedidos/${id}/chat/${postulacion.prestador_id}`}
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              padding: 12,
                              fontSize: 14,
                              fontWeight: 600,
                              borderRadius: 100,
                              border: 'none',
                              background: COLORS.blue,
                              color: '#FFFFFF',
                              textDecoration: 'none',
                            }}
                          >
                            {sinLeer > 0 ? `💬 Mensajes (${sinLeer})` : '💬 Iniciar chat'}
                          </Link>
                          <RechazarBoton pedidoId={id} postulacionId={postulacion.id} prestadorId={postulacion.prestador_id} />
                        </div>
                      ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ElegirBoton({
  pedidoId,
  postulacionId,
  prestadorId,
}: {
  pedidoId: string
  postulacionId: string
  prestadorId: string
}) {
  return (
    <form action={elegirPrestador} style={{ flex: 1 }}>
      <input type="hidden" name="pedidoId" value={pedidoId} />
      <input type="hidden" name="postulacionId" value={postulacionId} />
      <input type="hidden" name="prestadorId" value={prestadorId} />
      <button
        type="submit"
        style={{
          width: '100%',
          padding: 12,
          fontSize: 14,
          fontWeight: 600,
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
  )
}

function RechazarBoton({
  pedidoId,
  postulacionId,
  prestadorId,
}: {
  pedidoId: string
  postulacionId: string
  prestadorId: string
}) {
  return (
    <form action={rechazarPostulante} style={{ flex: 1 }}>
      <input type="hidden" name="pedidoId" value={pedidoId} />
      <input type="hidden" name="postulacionId" value={postulacionId} />
      <input type="hidden" name="prestadorId" value={prestadorId} />
      <button
        type="submit"
        style={{
          width: '100%',
          padding: 12,
          fontSize: 14,
          fontWeight: 600,
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
  )
}