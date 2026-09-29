import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import { formatearFechaCorta } from '@/lib/fechas'
import BottomNav from '@/components/BottomNav'
import BannerNotificaciones from '@/components/BannerNotificaciones'
import FeedPedidos from '@/components/FeedPedidos'
import InicioWeb, { type ActividadWeb } from '@/components/InicioWeb'
import { anunciosPara, anunciosDeEspacio, anunciosParaCarrusel, semillaAnuncios } from '@/lib/anuncios'
import CarruselPublicidad from '@/components/CarruselPublicidad'
import type { Trabajador } from '@/components/TrabajadoresList'

const CENTRO_DEFAULT: [number, number] = [-45.8641, -67.4966]

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let query = supabase
    .from('pedidos')
    .select(
      `
      id,
      descripcion,
      ubicacion_lat,
      ubicacion_lng,
      monto_ofrecido,
      monto_a_convenir,
      fecha_creacion,
      es_comercio,
      nombre_comercio,
      categorias ( nombre, grupo_slug ),
      usuarios!pedidos_solicitante_id_fkey ( nombre )
    `
    )
    .eq('estado', 'abierto')
    .order('fecha_creacion', { ascending: false })
    .limit(50)

  // No tiene sentido que alguien vea su propio pedido en el feed de
  // "cerca tuyo" — ya lo tiene arriba, en "Tus ofrecimientos de trabajo".
  if (user) {
    query = query.neq('solicitante_id', user.id)
  }

  const { data: pedidos, error } = await query

  const inicial = user?.email?.[0]?.toUpperCase() ?? '?'

  let fotoUsuario: string | null = null
  let primerNombre: string | null = null
  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('foto_perfil_url, nombre')
      .eq('id', user.id)
      .maybeSingle()
    fotoUsuario = usuario?.foto_perfil_url ?? null
    primerNombre = usuario?.nombre ?? null
  }

  let misPostulaciones: any[] = []
  const sinLeerPorPedido: Record<string, number> = {}

  if (user) {
    const { data: postulaciones } = await supabase
      .from('postulaciones')
      .select(
        `
        id,
        estado,
        fecha,
        pedidos ( id, descripcion, estado, jornada, solicitante_id, categorias ( nombre ) )
      `
      )
      .eq('prestador_id', user.id)
      .order('fecha', { ascending: false })
      .limit(5)

    misPostulaciones = postulaciones ?? []

    for (const p of misPostulaciones) {
      const pedido = p.pedidos as any
      // El chat ahora puede existir en cualquier momento (antes de
      // elegir a alguien, para negociar; o después, ya en curso),
      // así que siempre chequeamos si hay mensajes sin leer.
      if (pedido) {
        const { count } = await supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('pedido_id', pedido.id)
          .eq('receptor_id', user.id)
          .eq('leido', false)
        sinLeerPorPedido[pedido.id] = count ?? 0
      }
    }
  }

  // Mis pedidos publicados (lado solicitante) — simétrico a "Mis postulaciones"
  let misPedidos: any[] = []
  let tieneHistorial = false
  const postulantesPorPedido: Record<string, number> = {}
  const sinLeerPedidoPropio: Record<string, number> = {}

  if (user) {
    const { data: pedidosPropios } = await supabase
      .from('pedidos')
      .select('id, descripcion, estado, jornada, fecha_creacion, categorias ( nombre )')
      .eq('solicitante_id', user.id)
      // Solo los que siguen activos: abiertos (buscando a alguien) y en
      // curso. Los completados, no concretados y eliminados salen del inicio.
      .in('estado', ['abierto', 'en_curso'])
      .order('fecha_creacion', { ascending: false })
      .limit(5)

    misPedidos = pedidosPropios ?? []

    // ¿Hay trabajos ya cerrados? Para mostrar el acceso al historial
    const { count: cerrados } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .eq('solicitante_id', user.id)
      .in('estado', ['completado', 'cancelado'])
    tieneHistorial = (cerrados ?? 0) > 0

    for (const p of misPedidos) {
      if (p.estado === 'abierto') {
        const { count } = await supabase
          .from('postulaciones')
          .select('id', { count: 'exact', head: true })
          .eq('pedido_id', p.id)
          .eq('estado', 'pendiente')
        postulantesPorPedido[p.id] = count ?? 0
      }
      // Siempre chequeamos mensajes sin leer — el chat puede existir
      // desde antes de elegir a alguien (para negociar) o después.
      {
        const { count } = await supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('pedido_id', p.id)
          .eq('receptor_id', user.id)
          .eq('leido', false)
        sinLeerPedidoPropio[p.id] = count ?? 0
      }
    }
  }

  // Trabajadores que eligieron aparecer en el listado. Si la columna
  // visible_en_listado todavía no existe (falta la migración de
  // scripts/sql), la consulta falla y la pestaña queda vacía sin romper
  // el resto del inicio.
  let trabajadores: Trabajador[] = []
  {
    const { data: perfilesVisibles, error: errorVisibles } = await supabase
      .from('perfiles_prestador')
      .select('usuario_id, sobre_mi, tipo_busqueda')
      .eq('visible_en_listado', true)
      .neq('usuario_id', user.id)
      .limit(50)

    if (errorVisibles) {
      console.error('No se pudo cargar el listado de trabajadores:', errorVisibles.message)
    }

    const ids = (perfilesVisibles ?? []).map((p) => p.usuario_id)
    if (ids.length > 0) {
      const [{ data: usuariosVisibles }, { data: categoriasVisibles }] = await Promise.all([
        supabase.from('usuarios').select('id, nombre, apellido, foto_perfil_url').in('id', ids),
        supabase
          .from('prestador_categorias')
          .select('prestador_id, categorias ( nombre, grupo_slug )')
          .in('prestador_id', ids),
      ])

      const usuariosPorId = new Map((usuariosVisibles ?? []).map((u: any) => [u.id, u]))
      trabajadores = (perfilesVisibles ?? [])
        .map((p: any) => {
          const u: any = usuariosPorId.get(p.usuario_id)
          // Sin nombre no tiene sentido mostrarlo en un listado público
          if (!u?.nombre) return null
          return {
            id: p.usuario_id,
            nombre: [u.nombre, u.apellido?.[0] ? `${u.apellido[0]}.` : null].filter(Boolean).join(' '),
            fotoUrl: u.foto_perfil_url ?? null,
            sobreMi: p.sobre_mi ?? null,
            tipoBusqueda: p.tipo_busqueda ?? null,
            categorias: (categoriasVisibles ?? [])
              .filter((c: any) => c.prestador_id === p.usuario_id && c.categorias)
              .map((c: any) => ({ nombre: c.categorias.nombre, grupoSlug: c.categorias.grupo_slug ?? null })),
          }
        })
        .filter((t): t is Trabajador => t !== null)
    }
  }

  function fechaRelativa(fechaISO: string): string {
    const ahora = new Date()
    const fecha = new Date(fechaISO)
    const diffMs = ahora.getTime() - fecha.getTime()
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDias = Math.floor(diffHoras / 24)

    if (diffHoras < 1) return 'Recién'
    if (diffHoras < 24) return `Hace ${diffHoras}h`
    if (diffDias === 1) return 'Ayer'
    if (diffDias < 7) return `Hace ${diffDias} días`
    return formatearFechaCorta(fecha)
  }

  const tituloSeccion: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.ink,
    letterSpacing: '-0.01em',
    margin: '0 0 12px',
  }

  const tarjeta: React.CSSProperties = {
    display: 'block',
    position: 'relative',
    background: COLORS.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 10,
    textDecoration: 'none',
    boxShadow: COLORS.cardShadow,
  }

  const etiqueta = (fondo: string, texto: string): React.CSSProperties => ({
    display: 'inline-block',
    fontSize: 11.5,
    fontWeight: 500,
    color: texto,
    background: fondo,
    padding: '4px 10px',
    borderRadius: 100,
  })

  // Cápsula negra chica arriba de cada acceso rápido ("Publicar", "Buscar"...)
  const pildora: React.CSSProperties = {
    display: 'inline-block',
    background: COLORS.dark,
    color: COLORS.onDark,
    fontSize: 12,
    fontWeight: 500,
    padding: '5px 12px',
    borderRadius: 100,
  }

  const circuloIcono = (fondo: string): React.CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: fondo,
    color: COLORS.ink,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  })

  const tarjetaAmarilla: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 18,
    background: `linear-gradient(160deg, #FFD54A 0%, ${COLORS.clay} 100%)`,
    borderRadius: 24,
    padding: 14,
    textDecoration: 'none',
    color: COLORS.onClay,
    boxShadow: '0 10px 24px rgba(255, 184, 0, 0.25)',
  }

  const cantidadTrabajos = pedidos?.length ?? 0
  const [anuncios, anunciosLista, anunciosInicioMovil] = await Promise.all([
    anunciosPara(['inicio_web', 'lateral_web']),
    anunciosDeEspacio('lista'),
    anunciosParaCarrusel('inicio_movil'),
  ])
  const semilla = semillaAnuncios()

  // Para el inicio web: tus pedidos y postulaciones como tarjetas en fila
  const actividad: ActividadWeb[] = [
    ...misPedidos.map((p): ActividadWeb => {
      const postulantes = postulantesPorPedido[p.id] ?? 0
      return {
        tipo: 'pedido',
        href: `/pedidos/${p.id}`,
        titulo: p.descripcion,
        detalle: `${(p.categorias as { nombre?: string } | null)?.nombre ?? 'Trabajo'} · publicado ${fechaRelativa(p.fecha_creacion).toLowerCase()}`,
        estado:
          p.estado === 'en_curso'
            ? 'En curso'
            : `${postulantes} postulante${postulantes === 1 ? '' : 's'}`,
        colorEstado: p.estado === 'en_curso' ? 'verde' : postulantes > 0 ? 'amarillo' : 'gris',
        sinLeer: sinLeerPedidoPropio[p.id] ?? 0,
      }
    }),
    ...misPostulaciones
      .filter((p) => p.pedidos)
      .map((p): ActividadWeb => {
        const pedido = p.pedidos as { id: string; descripcion: string; solicitante_id: string }
        return {
          tipo: 'postulacion',
          href: `/pedidos/${pedido.id}/chat/${pedido.solicitante_id}`,
          titulo: pedido.descripcion,
          detalle: `Te postulaste ${fechaRelativa(p.fecha).toLowerCase()}`,
          estado: p.estado === 'aceptada' ? 'Te eligieron' : p.estado === 'rechazada' ? 'Rechazada' : 'Pendiente',
          colorEstado: p.estado === 'aceptada' ? 'verde' : p.estado === 'rechazada' ? 'rojo' : 'gris',
          sinLeer: sinLeerPorPedido[pedido.id] ?? 0,
        }
      }),
  ]

  return (
    <div className="fondo-pantalla" style={{ background: COLORS.wrapperBg, minHeight: '100vh' }}>
      {/* En compu: un inicio propio de web (components/InicioWeb) */}
      <div className="solo-escritorio">
        <InicioWeb
          nombre={primerNombre}
          pedidos={(pedidos ?? []) as never}
          trabajadores={trabajadores}
          actividad={actividad}
          tieneHistorial={tieneHistorial}
          centro={CENTRO_DEFAULT}
          anuncioHorizontal={anuncios.inicio_web}
          anuncioLateral={anuncios.lateral_web}
          anunciosLista={anunciosLista}
          semilla={semilla}
        />
      </div>

      {/* En el celular: el inicio de siempre */}
      <div className="pantalla solo-movil" style={{ background: COLORS.paper, minHeight: '100vh', paddingBottom: 110 }}>
        {/* Encabezado: avatar + saludo a la izquierda, botón redondo a la derecha */}
        <div
          style={{
            padding: '20px 20px 4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <a href="/perfil" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: COLORS.clayTint,
                color: COLORS.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 16,
                flexShrink: 0,
                backgroundImage: fotoUsuario ? `url(${fotoUsuario})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!fotoUsuario && inicial}
            </span>
            <span style={{ fontSize: 15, fontWeight: 500, color: COLORS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {primerNombre ? `Hola, ${primerNombre}` : 'Hola 👋'}
            </span>
          </a>
          <a
            href="/configuracion/notificaciones"
            aria-label="Notificaciones"
            style={{ ...circuloIcono(COLORS.card), width: 44, height: 44, boxShadow: COLORS.cardShadow }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </a>
        </div>

        <div style={{ padding: '18px 20px 18px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.12,
              color: COLORS.ink,
              letterSpacing: '-0.035em',
            }}
          >
            Trabajo
            <br />
            cerca tuyo
          </h1>
        </div>

        {/* Accesos rápidos: dos tarjetas amarillas + una blanca ancha */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <a href="/publicar" style={tarjetaAmarilla}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={pildora}>Publicar</span>
                <span style={circuloIcono('rgba(255,255,255,0.45)')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                </span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em' }}>¿Ofrecés un trabajo?</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(28,28,30,0.65)' }}>Recibí postulaciones</p>
              </div>
            </a>
            <a href="#trabajos" style={tarjetaAmarilla}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={pildora}>Buscar</span>
                <span style={circuloIcono('rgba(255,255,255,0.45)')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em' }}>¿En busca de trabajo?</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(28,28,30,0.65)' }}>
                  {cantidadTrabajos} cerca tuyo
                </p>
              </div>
            </a>
          </div>

          <a
            href="/mis-postulaciones"
            style={{ ...tarjeta, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <span style={pildora}>Gestionar</span>
              <p style={{ margin: '14px 0 0', fontSize: 16, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.01em' }}>
                Pedidos y postulaciones
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: COLORS.inkSoft }}>
                {misPedidos.length} pedido{misPedidos.length !== 1 ? 's' : ''} · {misPostulaciones.length}{' '}
                {misPostulaciones.length !== 1 ? 'postulaciones' : 'postulación'}
              </p>
            </div>
            <span style={circuloIcono(COLORS.clay)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </span>
          </a>
        </div>

        {/* Publicidad: debajo de los accesos. Con varios anuncios, carrusel */}
        <CarruselPublicidad anuncios={anunciosInicioMovil} formato="movil" style={{ padding: '0 20px 20px' }} />

        <div style={{ padding: '0 20px' }}>
          {user && <BannerNotificaciones />}
        </div>

        {(misPedidos.length > 0 || tieneHistorial) && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <p style={tituloSeccion}>Tus ofrecimientos de trabajo</p>
              {tieneHistorial && (
                <a href="/historial" style={{ fontSize: 13, fontWeight: 600, color: COLORS.clayDark, textDecoration: 'none', flexShrink: 0 }}>
                  Historial →
                </a>
              )}
            </div>
            {misPedidos.length === 0 && (
              <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '0 0 4px' }}>No tenés ofrecimientos activos.</p>
            )}
            {misPedidos.map((p) => {
              const postulantesPendientes = postulantesPorPedido[p.id] ?? 0
              const sinLeer = sinLeerPedidoPropio[p.id] ?? 0

              const href =
                sinLeer > 0 && p.estado === 'en_curso'
                  ? `/pedidos/${p.id}/chat`
                  : `/pedidos/${p.id}`

              const destacar = postulantesPendientes > 0 || sinLeer > 0

              return (
                <a
                  key={p.id}
                  href={href}
                  style={{
                    ...tarjeta,
                    outline: destacar ? `2px solid ${COLORS.clay}` : 'none',
                    paddingBottom: sinLeer > 0 ? 48 : 16,
                  }}
                >
                  {postulantesPendientes > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        background: COLORS.dark,
                        color: COLORS.onDark,
                        borderRadius: 100,
                        fontSize: 11.5,
                        fontWeight: 500,
                        padding: '4px 10px',
                      }}
                    >
                      {postulantesPendientes} postulante{postulantesPendientes > 1 ? 's' : ''}
                    </div>
                  )}
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: COLORS.ink, paddingRight: postulantesPendientes > 0 ? 100 : 0 }}>
                    {p.descripcion}
                  </p>
                  <p style={{ margin: '4px 0 10px', fontSize: 12.5, color: COLORS.inkSoft }}>
                    {fechaRelativa(p.fecha_creacion)}
                    {p.estado === 'abierto' &&
                      ` · ${postulantesPendientes} postulante${postulantesPendientes !== 1 ? 's' : ''} interesado${postulantesPendientes !== 1 ? 's' : ''}`}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.categorias?.nombre && (
                      <span style={etiqueta(COLORS.tagOrange, COLORS.tagOrangeText)}>{p.categorias.nombre}</span>
                    )}
                    {p.estado === 'abierto' && <span style={etiqueta(COLORS.tagBlue, COLORS.tagBlueText)}>Abierto</span>}
                    {p.estado === 'en_curso' && <span style={etiqueta(COLORS.greenTint, COLORS.greenDark)}>En curso</span>}
                  </div>

                  {sinLeer > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 14,
                        right: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: COLORS.blue,
                        color: '#FFFFFF',
                        fontSize: 11.5,
                        fontWeight: 500,
                        padding: '5px 11px',
                        borderRadius: 100,
                      }}
                    >
                      💬 {sinLeer} mensaje{sinLeer > 1 ? 's' : ''} nuevo{sinLeer > 1 ? 's' : ''}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        )}

        {misPostulaciones.length > 0 && (
          <div style={{ padding: '0 20px 16px' }}>
            <p style={tituloSeccion}>Mis postulaciones</p>
            {misPostulaciones.map((p) => {
              const pedido = p.pedidos as any
              if (!pedido) return null
              const sinLeer = sinLeerPorPedido[pedido.id] ?? 0
              // El postulante siempre puede entrar a chatear con el
              // solicitante, exista o no conversación todavía (el "no
              // podés escribir primero" se resuelve dentro del chat).
              const hrefChat = `/pedidos/${pedido.id}/chat/${pedido.solicitante_id}`

              if (sinLeer > 0) {
                // Destacada en negro — hay algo nuevo para leer
                return (
                  <a
                    key={p.id}
                    href={hrefChat}
                    style={{
                      ...tarjeta,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: COLORS.dark,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, color: COLORS.onDark, fontWeight: 500, fontSize: 15 }}>
                        {sinLeer} mensaje{sinLeer > 1 ? 's' : ''} nuevo{sinLeer > 1 ? 's' : ''}
                      </p>
                      <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: 12.5 }}>
                        {pedido.descripcion}
                      </p>
                    </div>
                    <span style={circuloIcono(COLORS.clay)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                  </a>
                )
              }

              return (
                <a key={p.id} href={hrefChat} style={tarjeta}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: COLORS.ink }}>
                    {pedido.descripcion}
                  </p>
                  <p style={{ margin: '4px 0 10px', fontSize: 12.5, color: COLORS.inkSoft }}>
                    Te postulaste {fechaRelativa(p.fecha).toLowerCase()}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {pedido.categorias?.nombre && (
                      <span style={etiqueta(COLORS.tagOrange, COLORS.tagOrangeText)}>{pedido.categorias.nombre}</span>
                    )}
                    {p.estado === 'pendiente' && <span style={etiqueta('#EDEDF2', '#4B4B55')}>Pendiente</span>}
                    {p.estado === 'aceptada' && <span style={etiqueta(COLORS.greenTint, COLORS.greenDark)}>✓ En chat</span>}
                    {p.estado === 'rechazada' && <span style={etiqueta(COLORS.redTint, COLORS.redDark)}>Rechazada</span>}
                  </div>
                </a>
              )
            })}
          </div>
        )}

        <div style={{ padding: '0 20px 8px' }}>
          {error && (
            <p style={{ color: COLORS.red, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Error trayendo pedidos: {error.message}
            </p>
          )}
        </div>

        <FeedPedidos
          pedidos={pedidos ?? []}
          trabajadores={trabajadores}
          centro={CENTRO_DEFAULT}
          anunciosLista={anunciosLista}
          semilla={semilla}
        />
      </div>

      <BottomNav />
    </div>
  )
}
