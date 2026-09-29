import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import { PantallaBase, LinkVolver, TituloPagina, Subtitulo } from '@/lib/ui'
import { formatearFechaCorta, formatearHora } from '@/lib/fechas'
import BottomNav from '@/components/BottomNav'
import BannerPublicidad from '@/components/BannerPublicidad'
import { anunciosPara } from '@/lib/anuncios'

// Avisos del usuario (los mismos que llegan como push), el más reciente
// arriba. Los de mensajes nuevos no van acá: tienen su propio botón.
// Al abrir la pantalla quedan todos como leídos.

type Notificacion = {
  id: string
  tipo: string
  titulo: string
  cuerpo: string | null
  url: string | null
  fecha: string | null
  leida: boolean
}

// Ícono y color según el tipo de aviso
const ESTILO: Record<string, { color: string; fondo: string; icono: React.ReactNode }> = {
  pedido_cerca: {
    color: COLORS.clayDark,
    fondo: COLORS.clayTint,
    icono: <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  },
  postulacion_recibida: {
    color: COLORS.blueDark,
    fondo: COLORS.blueTint,
    icono: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" />,
  },
  postulante_elegido: {
    color: COLORS.greenDark,
    fondo: COLORS.greenTint,
    icono: <path d="M20 6L9 17l-5-5" />,
  },
  postulacion_rechazada: {
    color: COLORS.redDark,
    fondo: COLORS.redTint,
    icono: <path d="M18 6L6 18M6 6l12 12" />,
  },
  pedido_editado: {
    color: COLORS.inkSoft,
    fondo: COLORS.iconBg,
    icono: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  },
}
const ESTILO_GENERICO = {
  color: COLORS.inkSoft,
  fondo: COLORS.iconBg,
  icono: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
}

function cuando(fecha: string) {
  return formatearFechaCorta(fecha) === formatearFechaCorta(new Date()) ? formatearHora(fecha) : formatearFechaCorta(fecha)
}

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Por el servidor, siempre filtrando por el usuario de la sesión
  const admin = createAdminClient()
  const { data } = await admin
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', user.id)
    .neq('tipo', 'mensaje_nuevo')
    .limit(300)

  const notificaciones: Notificacion[] = (data ?? [])
    .map((n: Record<string, unknown>) => ({
      id: String(n.id),
      tipo: String(n.tipo ?? ''),
      titulo: String(n.titulo ?? 'Aviso'),
      cuerpo: (n.cuerpo as string | null) ?? null,
      url: (n.url_destino as string | null) ?? null,
      fecha: ((n.created_at ?? n.fecha) as string | null) ?? null,
      // Sin la columna leida (falta el SQL) se muestran todas como leídas
      leida: n.leida === undefined ? true : !!n.leida,
    }))
    .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
    .slice(0, 60)

  // Ya las vio: el globito de la campana vuelve a cero
  if (notificaciones.some((n) => !n.leida)) {
    await admin.from('notificaciones').update({ leida: true }).eq('usuario_id', user.id).eq('leida', false)
  }

  const { notificaciones: anuncio } = await anunciosPara(['notificaciones'])

  return (
    <PantallaBase>
      <div style={{ padding: '20px 16px 120px' }}>
        <LinkVolver href="/" />
        <TituloPagina>Notificaciones</TituloPagina>
        <Subtitulo>
          Trabajos nuevos, postulaciones y respuestas.{' '}
          <a href="/configuracion/notificaciones" style={{ color: COLORS.ink, fontWeight: 600 }}>
            Configurar avisos
          </a>
        </Subtitulo>

        {notificaciones.length === 0 && (
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
              Todavía no tenés notificaciones. Acá vas a ver los trabajos nuevos de tus rubros y las novedades de
              tus pedidos y postulaciones.
            </p>
          </div>
        )}

        <div className="web-grilla" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notificaciones.map((n) => {
            const estilo = ESTILO[n.tipo] ?? ESTILO_GENERICO
            const contenido = (
              <>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: estilo.fondo,
                    color: estilo.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {estilo.icono}
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 14.5, fontWeight: 700, color: COLORS.ink }}>
                      {n.titulo}
                    </p>
                    {n.fecha && (
                      <span style={{ flexShrink: 0, fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 600 }}>
                        {cuando(n.fecha)}
                      </span>
                    )}
                  </div>
                  {n.cuerpo && (
                    <p style={{ margin: '2px 0 0', fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.45 }}>{n.cuerpo}</p>
                  )}
                </div>
                {!n.leida && (
                  <span
                    aria-label="Nueva"
                    style={{ width: 9, height: 9, borderRadius: '50%', background: COLORS.red, flexShrink: 0, alignSelf: 'center' }}
                  />
                )}
              </>
            )
            const estiloTarjeta: React.CSSProperties = {
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 14,
              borderRadius: 18,
              background: n.leida ? COLORS.card : COLORS.highlight,
              boxShadow: COLORS.cardShadow,
              textDecoration: 'none',
            }
            return n.url ? (
              <a key={n.id} href={n.url} style={estiloTarjeta}>
                {contenido}
              </a>
            ) : (
              <div key={n.id} style={estiloTarjeta}>
                {contenido}
              </div>
            )
          })}
        </div>
        {/* Publicidad: al final de la lista */}
        <BannerPublicidad anuncio={anuncio} formato="movil" style={{ marginTop: 28, maxWidth: 720 }} />
      </div>
      <BottomNav />
    </PantallaBase>
  )
}
