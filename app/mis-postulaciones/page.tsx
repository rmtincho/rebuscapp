import { createClient } from '@/lib/supabase/server'
import { COLORS } from '@/lib/theme'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default async function MisPostulacionesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: postulaciones } = await supabase
    .from('postulaciones')
    .select(
      `
      id,
      estado,
      fecha,
      pedido_id,
      pedidos ( id, descripcion, estado, categorias ( nombre ) )
    `
    )
    .eq('prestador_id', user.id)
    .order('fecha', { ascending: false })

  // Para cada pedido en curso/completado, contamos mensajes sin leer dirigidos a mí
  const mensajesSinLeerPorPedido: Record<string, number> = {}

  if (postulaciones) {
    for (const p of postulaciones) {
      const pedido = p.pedidos as any
      if (pedido && (pedido.estado === 'en_curso' || pedido.estado === 'completado')) {
        const { count } = await supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('pedido_id', pedido.id)
          .eq('receptor_id', user.id)
          .eq('leido', false)

        mensajesSinLeerPorPedido[pedido.id] = count ?? 0
      }
    }
  }

  return (
    <div style={{ background: COLORS.wrapperBg, minHeight: '100vh' }}>
      <div className="pantalla" style={{ background: COLORS.paper, minHeight: '100vh' }}>
        <div style={{ padding: '20px 20px 100px' }}>
          <Link
            href="/"
            style={{ fontSize: 13, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 600 }}
          >
            ← Volver
          </Link>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.ink,
              margin: '16px 0 20px',
            }}
          >
            Mis postulaciones
          </h1>

          {(!postulaciones || postulaciones.length === 0) && (
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
                Todavía no te postulaste a ningún pedido.
              </p>
            </div>
          )}

          {postulaciones?.map((p) => {
            const pedido = p.pedidos as any
            if (!pedido) return null

            const sinLeer = mensajesSinLeerPorPedido[pedido.id] ?? 0
            const puedeChatear = pedido.estado === 'en_curso' || pedido.estado === 'completado'

            return (
              <Link
                key={p.id}
                href={puedeChatear ? `/pedidos/${pedido.id}/chat` : `/pedidos/${pedido.id}`}
                style={{
                  display: 'block',
                  background: COLORS.card,
                  border: `1.5px solid ${COLORS.line}`,
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 12,
                  textDecoration: 'none',
                  position: 'relative',
                }}
              >
                {sinLeer > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: COLORS.blue,
                      color: '#fff',
                      borderRadius: 100,
                      minWidth: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '0 6px',
                    }}
                  >
                    {sinLeer} nuevo{sinLeer > 1 ? 's' : ''}
                  </div>
                )}

                <p style={{ margin: 0, fontWeight: 600, fontSize: 14.5, color: COLORS.ink, paddingRight: sinLeer > 0 ? 70 : 0 }}>
                  {pedido.descripcion}
                </p>
                <p style={{ margin: '4px 0 8px', fontSize: 12.5, color: COLORS.inkSoft }}>
                  {pedido.categorias?.nombre ?? 'Sin categoría'}
                </p>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {p.estado === 'pendiente' && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.inkSoft, background: COLORS.line, padding: '3px 9px', borderRadius: 100 }}>
                      Postulación pendiente
                    </span>
                  )}
                  {p.estado === 'aceptada' && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.green, background: COLORS.greenTint, padding: '3px 9px', borderRadius: 100 }}>
                      ✓ Aceptada — {puedeChatear ? 'ir al chat' : ''}
                    </span>
                  )}
                  {p.estado === 'rechazada' && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.red, background: COLORS.redTint, padding: '3px 9px', borderRadius: 100 }}>
                      No fue elegida esta vez
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}