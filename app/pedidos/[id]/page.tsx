import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { COLORS } from '@/lib/theme'
import PostularseForm from '@/components/PostularseForm'
import EliminarPedidoBoton from '@/components/EliminarPedidoBoton'
import DenunciarBloquear from '@/components/DenunciarBloquear'
import { idsConBloqueo, loBloqueo } from '@/lib/bloqueos'
import Link from 'next/link'
import BannerPublicidad from '@/components/BannerPublicidad'
import { anunciosPara } from '@/lib/anuncios'
import { proximaPostulacionPermitida, POSTULACIONES_POR_DIA } from '@/lib/limites'
import { formatearCuando, haceCuanto } from '@/lib/fechas'
import { iconoParaCategoria } from '@/lib/categoryIcons'
import {
  caracteristicas,
  tituloDe,
  COLOR_CARACTERISTICA,
  COLOR_PRECIO,
  ESTILO_ETIQUETA,
} from '@/lib/tarjetaTrabajo'
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
      edad_minima,
      requiere_carnet_conducir,
      categoria_carnet_requerida,
      idioma_requerido,
      requiere_matricula_profesional,
      requisitos_adicionales,
      solicitante_id,
      prestador_asignado_id,
      estado,
      fecha_creacion,
      categorias ( nombre, grupo_slug ),
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

  // Bloqueos en cualquier dirección: el que no es dueño no se puede
  // postular, y el dueño no ve a esos postulantes
  const bloqueados = user ? await idsConBloqueo(user.id) : new Set<string>()
  const hayBloqueoConDueño = !esElDueño && bloqueados.has(pedido.solicitante_id)
  const loBloqueeYo = hayBloqueoConDueño && (await loBloqueo(user!.id, pedido.solicitante_id))

  let yaPostulado = false
  let motivoBloqueo: string | null = null
  let proximaPostulacion: Date | null = null
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
      proximaPostulacion = await proximaPostulacionPermitida(user.id)
    }

    if (!yaPostulado && pedido.estado === 'abierto') {
      // Edad y DNI no son públicos: los propios se leen con el cliente
      // admin, filtrando por el usuario de la sesión.
      const { data: miUsuario } = await createAdminClient()
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

        if (pedido.edad_minima && (miUsuario?.edad ?? 0) < pedido.edad_minima) {
          motivoBloqueo = `Este pedido pide ${pedido.edad_minima} años o más.`
        }

        if (!motivoBloqueo && pedido.categoria_carnet_requerida) {
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

    postulaciones = (postulacionesData ?? []).filter((p) => !bloqueados.has(p.prestador_id))

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

  // Publicidad: si hay un anuncio del mismo rubro que el pedido, ese
  const categoriaPedido = pedido.categorias as { grupo_slug?: string | null } | { grupo_slug?: string | null }[] | null
  const rubroPedido = (Array.isArray(categoriaPedido) ? categoriaPedido[0]?.grupo_slug : categoriaPedido?.grupo_slug) ?? null
  const { pedido: anuncioPedido } = await anunciosPara(['pedido'], rubroPedido)
  const { data: grupo } = rubroPedido
    ? await supabase.from('categorias_grupo').select('nombre').eq('slug', rubroPedido).maybeSingle()
    : { data: null }
  const nombreCategoria = (Array.isArray(categoriaPedido) ? null : (categoriaPedido as { nombre?: string } | null)?.nombre) ?? 'Sin categoría'
  const nombreRubro = grupo?.nombre ?? null
  const etiquetas = caracteristicas(pedido)

  const botonChatStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    background: COLORS.blue,
    color: '#fff',
    padding: '15px 18px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    textDecoration: 'none',
  }

  // Etiquetas de requisitos: las mismas de las tarjetas, en amarillo
  const etiquetaRequisito: React.CSSProperties = {
    ...ESTILO_ETIQUETA,
    background: COLOR_CARACTERISTICA.requisito.fondo,
    color: COLOR_CARACTERISTICA.requisito.texto,
  }
  const etiquetaNeutra: React.CSSProperties = { ...ESTILO_ETIQUETA, background: '#EDEDF2', color: '#4B4B55' }

  return (
    <div className="fondo-pantalla" style={{ background: COLORS.wrapperBg, minHeight: '100vh' }}>
      <div className="pantalla" style={{ background: COLORS.paper, minHeight: '100vh' }}>
        <div style={{ padding: 20 }}>
          <Link
            href="/"
            style={{ fontSize: 13, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 500 }}
          >
            ← Volver
          </Link>

          {/* En compu: detalle y postulantes a la izquierda, acciones fijas a la derecha */}
          <div className="pedido-grilla">
          {/* Como las tarjetas del inicio: ícono amarillo, título, Rubro ›
              Categoría, etiquetas de colores y la descripción completa */}
          <div
            className="pedido-detalle"
            style={{
              background: COLORS.card,
              borderRadius: 12,
              padding: 20,
              marginTop: 16,
              boxShadow: COLORS.cardShadow,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: COLORS.clay,
                  color: COLORS.ink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {iconoParaCategoria(nombreCategoria)}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: COLORS.ink, margin: 0 }}>
                  {tituloDe(pedido.descripcion)}
                </h1>
                <p style={{ fontSize: 14, color: COLORS.inkSoft, margin: '4px 0 0', lineHeight: 1.4 }}>
                  {nombreRubro && nombreRubro !== nombreCategoria && (
                    <>
                      {nombreRubro}
                      <span aria-hidden style={{ margin: '0 6px' }}>›</span>
                    </>
                  )}
                  <span style={{ color: COLORS.blue }}>{nombreCategoria}</span>
                  {pedido.fecha_creacion && ` · ${haceCuanto(pedido.fecha_creacion)}`}
                </p>
              </div>
            </div>

            {(precio || etiquetas.length > 0 || pedido.marca_vehiculo || pedido.tipo_comercio) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {precio && (
                  <span style={{ ...ESTILO_ETIQUETA, fontSize: 13, fontWeight: 400, padding: '5px 9px', background: COLOR_PRECIO.fondo, color: COLOR_PRECIO.texto }}>
                    {precio}
                  </span>
                )}
                {etiquetas
                  .filter((e) => e.tipo !== 'requisito')
                  .map((e) => (
                    <span
                      key={e.texto}
                      style={{ ...ESTILO_ETIQUETA, alignSelf: 'center', background: COLOR_CARACTERISTICA[e.tipo].fondo, color: COLOR_CARACTERISTICA[e.tipo].texto }}
                    >
                      {e.texto}
                    </span>
                  ))}
                {pedido.marca_vehiculo && <span style={{ ...etiquetaNeutra, alignSelf: 'center' }}>{pedido.marca_vehiculo}</span>}
                {pedido.tipo_comercio && <span style={{ ...etiquetaNeutra, alignSelf: 'center' }}>{pedido.tipo_comercio}</span>}
              </div>
            )}

            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#3F3F46', margin: '16px 0 0', whiteSpace: 'pre-line' }}>
              {pedido.descripcion}
            </p>

            {!esElDueño && (
              <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '14px 0 0' }}>
                Publicado por <span style={{ color: COLORS.ink }}>{nombrePublicador}</span>
              </p>
            )}

            {pedido.pide_videollamada_previa && pedido.estado === 'abierto' && (
              <div
                style={{
                  marginTop: 14,
                  background: COLORS.blueTint,
                  color: COLORS.blueDark,
                  fontSize: 13,
                  padding: '10px 12px',
                  borderRadius: 8,
                }}
              >
                Pide videollamada antes de elegir
              </div>
            )}

            {(pedido.requisito_nivel_educativo ||
              pedido.edad_minima ||
              pedido.requiere_carnet_conducir ||
              pedido.categoria_carnet_requerida ||
              pedido.idioma_requerido ||
              pedido.requiere_matricula_profesional ||
              pedido.requisitos_adicionales) && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${COLORS.line}` }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: '0 0 10px' }}>Requisitos</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: pedido.requisitos_adicionales ? 10 : 0 }}>
                  {pedido.requisito_nivel_educativo && (
                    <span style={etiquetaRequisito}>
                      {pedido.requisito_nivel_educativo === 'secundario' ? 'Secundario completo' : pedido.requisito_nivel_educativo === 'terciario' ? 'Terciario' : pedido.requisito_nivel_educativo === 'universitario' ? 'Universitario' : pedido.requisito_nivel_educativo === 'primario' ? 'Primario completo' : 'Posgrado'}
                    </span>
                  )}
                  {pedido.edad_minima && <span style={etiquetaRequisito}>Desde {pedido.edad_minima} años</span>}
                  {pedido.categoria_carnet_requerida ? (
                    <span style={etiquetaRequisito}>Carnet clase {pedido.categoria_carnet_requerida}</span>
                  ) : pedido.requiere_carnet_conducir ? (
                    <span style={etiquetaRequisito}>Carnet de conducir</span>
                  ) : null}
                  {pedido.idioma_requerido && <span style={etiquetaRequisito}>{pedido.idioma_requerido}</span>}
                  {pedido.requiere_matricula_profesional && <span style={etiquetaRequisito}>Matrícula profesional vigente</span>}
                </div>
                {pedido.requisitos_adicionales && (
                  <p style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.5, margin: 0 }}>{pedido.requisitos_adicionales}</p>
                )}
              </div>
            )}

            {pedido.estado === 'en_curso' && (
              <div
                style={{
                  marginTop: 14,
                  background: COLORS.greenTint,
                  color: COLORS.greenDark,
                  fontSize: 13.5,
                  padding: '10px 12px',
                  borderRadius: 8,
                }}
              >
                Coordinando {soyElPrestadorAsignado ? 'conmigo' : `con ${nombrePrestadorAsignado}`}
              </div>
            )}

            {pedido.estado === 'completado' && (
              <div
                style={{
                  marginTop: 14,
                  background: COLORS.greenTint,
                  color: COLORS.greenDark,
                  fontSize: 13.5,
                  padding: '10px 12px',
                  borderRadius: 8,
                }}
              >
                ✓ Completado {soyElPrestadorAsignado ? 'conmigo' : `con ${nombrePrestadorAsignado}`}
              </div>
            )}

            {esElDueño && pedido.estado === 'abierto' && (
              <>
                <div style={{ borderTop: `1px solid ${COLORS.line}`, margin: '18px 0 14px' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link
                    href={`/pedidos/${id}/editar`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '12px',
                      borderRadius: 8,
                      border: `1.5px solid ${COLORS.clayDark}`,
                      color: COLORS.clayDark,
                      fontSize: 13,
                      fontWeight: 500,
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

          <div className="pedido-acciones" style={{ marginTop: 20 }}>
            {esElDueño && pedido.estado !== 'abierto' && (
              <div>
                {pedido.estado === 'completado' && (
                  <a
                    href={`/pedidos/${id}/calificar`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '13px',
                      borderRadius: 8,
                      border: `1.5px solid ${COLORS.green}`,
                      color: COLORS.green,
                      fontSize: 13,
                      fontWeight: 500,
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
                          borderRadius: 8,
                          border: `1.5px solid ${COLORS.green}`,
                          color: COLORS.green,
                          fontSize: 13,
                          fontWeight: 500,
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
                          borderRadius: 8,
                          border: `1.5px solid ${COLORS.line}`,
                          color: COLORS.inkSoft,
                          fontSize: 13,
                          fontWeight: 500,
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
                <Link href="/login" style={{ color: COLORS.clayDark, fontWeight: 500 }}>
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
                          borderRadius: 8,
                          border: `1.5px solid ${COLORS.green}`,
                          color: COLORS.green,
                          fontSize: 13,
                          fontWeight: 500,
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
                          borderRadius: 8,
                          border: `1.5px solid ${COLORS.line}`,
                          color: COLORS.inkSoft,
                          fontSize: 13,
                          fontWeight: 500,
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
                      borderRadius: 8,
                      border: `1.5px solid ${COLORS.green}`,
                      color: COLORS.green,
                      fontSize: 13,
                      fontWeight: 500,
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
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
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
                    borderRadius: 8,
                  }}
                >
                  <p style={{ fontSize: 13.5, color: COLORS.clayDark, fontWeight: 500, lineHeight: 1.5, margin: '0 0 10px' }}>
                    📋 Antes de postularte, completá tus datos básicos (nombre, edad y DNI) — es una sola vez.
                  </p>
                  <Link
                    href={`/completar-datos?volver=/pedidos/${id}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '13px',
                      borderRadius: 8,
                      background: COLORS.clay,
                      color: COLORS.onClay,
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    Completar datos
                  </Link>
                </div>
              ) : hayBloqueoConDueño ? (
                <div
                  style={{
                    background: COLORS.line,
                    color: COLORS.inkSoft,
                    padding: 14,
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}
                >
                  No podés postularte a este pedido.
                </div>
              ) : motivoBloqueo ? (
                <div
                  style={{
                    background: 'rgba(185, 8, 55, 0.08)',
                    color: '#8A0A32',
                    padding: 14,
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}
                >
                  🔒 No podés postularte: {motivoBloqueo}{' '}
                  <Link href="/perfil" style={{ color: '#8A0A32', fontWeight: 700, textDecoration: 'underline' }}>
                    Revisar mi perfil
                  </Link>
                </div>
              ) : proximaPostulacion ? (
                <div
                  style={{
                    background: COLORS.line,
                    color: COLORS.inkSoft,
                    padding: 14,
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}
                >
                  Ya te postulaste a {POSTULACIONES_POR_DIA} trabajos en las últimas 24 horas. Vas a poder
                  postularte de nuevo {formatearCuando(proximaPostulacion)}.
                </div>
              ) : (
                <PostularseForm pedidoId={id} />
              )
            )}

            {user && !esElDueño && (
              <DenunciarBloquear
                pedidoId={id}
                otroId={pedido.solicitante_id}
                nombre={nombrePublicador ?? 'quien lo publicó'}
                bloqueado={loBloqueeYo}
                centrado
              />
            )}
          </div>

          {esElDueño && pedido.estado === 'abierto' && (
            <div className="pedido-postulantes" style={{ marginTop: 28 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: '0 0 12px' }}>
                {postulaciones.length === 0
                  ? 'Postulantes'
                  : `${postulaciones.length} postulante${postulaciones.length > 1 ? 's' : ''}`}
              </p>

              {postulaciones.length === 0 && (
                <div
                  style={{
                    background: COLORS.card,
                    border: `1.5px dashed ${COLORS.line}`,
                    borderRadius: 12,
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
                      boxShadow: sinLeer > 0 ? `0 0 0 2px ${COLORS.blue}` : COLORS.cardShadow,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: COLORS.clay,
                          color: COLORS.ink,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 500,
                          fontSize: 15,
                          flexShrink: 0,
                        }}
                      >
                        {nombre[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: COLORS.ink }}>
                          {nombreCompleto}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: COLORS.inkSoft }}>
                          {postulacion.estado === 'pendiente' && 'Postulación pendiente'}
                          {postulacion.estado === 'aceptada' && '✓ Aceptada'}
                          {postulacion.estado === 'rechazada' && 'Rechazada'}
                          {' · '}
                          <Link
                            href={`/prestadores/${postulacion.prestador_id}?volver=/pedidos/${id}`}
                            style={{ color: COLORS.clayDark, fontWeight: 500, textDecoration: 'underline' }}
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
                            borderRadius: 8,
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
                          borderTop: `1px solid ${COLORS.line}`,
                        }}
                      >
                        “{postulacion.mensaje}”
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
                          fontWeight: 500,
                          borderRadius: 8,
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
                              fontWeight: 500,
                              borderRadius: 8,
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
                              fontWeight: 500,
                              borderRadius: 8,
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

          {/* Publicidad: al final del detalle, fija dentro del contenido */}
          <BannerPublicidad anuncio={anuncioPedido} formato="movil" className="pedido-publicidad" style={{ marginTop: 28 }} />
          </div>
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
          fontWeight: 500,
          borderRadius: 8,
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
          fontWeight: 500,
          borderRadius: 8,
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