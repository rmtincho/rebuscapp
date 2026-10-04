import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { usuarioAdmin } from '@/lib/admin'
import { etiquetaMotivo } from '@/lib/denuncias'
import { formatearCuando } from '@/lib/fechas'
import { COLORS } from '@/lib/theme'
import { PantallaBase, TituloPagina, Subtitulo } from '@/lib/ui'
import BottomNav from '@/components/BottomNav'
import CerrarDenuncia from '@/components/admin/CerrarDenuncia'
import Link from 'next/link'

// Panel de admin → denuncias: qué se denunció, quién, el chat entre los
// dos y los antecedentes, para decidir y cerrarla anotando la resolución.
// Solo para los mails de ADMIN_EMAILS; para el resto la página no existe.
// Suspender una cuenta sigue siendo a mano en Supabase (consultas al final
// de scripts/sql/2026-09-29-denuncias-bloqueos.sql).

type Denuncia = {
  id: string
  denunciante_id: string
  denunciado_id: string | null
  pedido_id: string | null
  motivo: string
  detalle: string | null
  estado: 'pendiente' | 'revisada'
  resolucion: string | null
  created_at: string
}

type Usuario = { id: string; nombre: string | null; apellido: string | null; email: string | null }
type Mensaje = { emisor_id: string; contenido: string; fecha: string }

const tarjeta: React.CSSProperties = {
  background: COLORS.card,
  borderRadius: 22,
  padding: 18,
  boxShadow: COLORS.cardShadow,
  scrollMarginTop: 90,
}

const etiqueta: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: COLORS.inkSoft,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px',
}

function nombreDe(u: Usuario | undefined) {
  if (!u) return 'Cuenta eliminada'
  return [u.nombre, u.apellido].filter(Boolean).join(' ') || 'Sin nombre'
}

export default async function AdminDenunciasPage() {
  if (!(await usuarioAdmin())) notFound()

  const admin = createAdminClient()
  const [{ data: pendientesData, error }, { data: revisadasData }] = await Promise.all([
    admin.from('denuncias').select('*').eq('estado', 'pendiente').order('created_at', { ascending: true }),
    admin.from('denuncias').select('*').eq('estado', 'revisada').order('created_at', { ascending: false }).limit(30),
  ])
  const pendientes = (pendientesData ?? []) as Denuncia[]
  const revisadas = (revisadasData ?? []) as Denuncia[]
  const todas = [...pendientes, ...revisadas]

  const idsUsuarios = [...new Set(todas.flatMap((d) => [d.denunciante_id, d.denunciado_id]).filter(Boolean))] as string[]
  const idsPedidos = [...new Set(todas.map((d) => d.pedido_id).filter(Boolean))] as string[]
  const idsDenunciados = [...new Set(pendientes.map((d) => d.denunciado_id).filter(Boolean))] as string[]

  const [{ data: usuariosData }, { data: pedidosData }, { data: antecedentesData }, chats] = await Promise.all([
    idsUsuarios.length
      ? admin.from('usuarios').select('id, nombre, apellido, email').in('id', idsUsuarios)
      : Promise.resolve({ data: [] }),
    idsPedidos.length
      ? admin.from('pedidos').select('id, descripcion, estado').in('id', idsPedidos)
      : Promise.resolve({ data: [] }),
    // Todas las denuncias contra quienes tienen una pendiente
    idsDenunciados.length
      ? admin
          .from('denuncias')
          .select('id, denunciado_id, denunciante_id, motivo, estado, resolucion, created_at')
          .in('denunciado_id', idsDenunciados)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    // El chat entre quien denuncia y el denunciado (Privacidad avisa que
    // ante una denuncia se puede revisar). Solo para las pendientes.
    Promise.all(
      pendientes.map(async (d) => {
        if (!d.denunciado_id) return [d.id, [] as Mensaje[]] as const
        const a = d.denunciante_id
        const b = d.denunciado_id
        const { data } = await admin
          .from('mensajes')
          .select('emisor_id, contenido, fecha')
          .or(`and(emisor_id.eq.${a},receptor_id.eq.${b}),and(emisor_id.eq.${b},receptor_id.eq.${a})`)
          .order('fecha', { ascending: false })
          .limit(100)
        return [d.id, ((data ?? []) as Mensaje[]).reverse()] as const
      })
    ),
  ])

  const usuarios = new Map(((usuariosData ?? []) as Usuario[]).map((u) => [u.id, u]))
  const pedidos = new Map(
    ((pedidosData ?? []) as { id: string; descripcion: string; estado: string }[]).map((p) => [p.id, p])
  )
  const chatPorDenuncia = new Map(chats)
  const antecedentes = (antecedentesData ?? []) as Omit<Denuncia, 'pedido_id' | 'detalle'>[]

  function Detalle({ d }: { d: Denuncia }) {
    const denunciado = d.denunciado_id ? usuarios.get(d.denunciado_id) : undefined
    const pedido = d.pedido_id ? pedidos.get(d.pedido_id) : undefined
    const previas = antecedentes.filter((x) => x.denunciado_id === d.denunciado_id && x.id !== d.id)
    const personasDistintas = new Set(antecedentes.filter((x) => x.denunciado_id === d.denunciado_id).map((x) => x.denunciante_id)).size

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
          <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{etiquetaMotivo(d.motivo)}</p>
          <span style={{ flexShrink: 0, fontSize: 12, color: COLORS.inkSoft, fontWeight: 500 }}>{formatearCuando(d.created_at)}</span>
        </div>

        {d.detalle ? (
          <p style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.5, margin: '10px 0 0', whiteSpace: 'pre-wrap', background: COLORS.paper, borderRadius: 12, padding: '10px 12px' }}>
            “{d.detalle}”
          </p>
        ) : (
          <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: '8px 0 0' }}>Sin observaciones.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 14 }}>
          <div>
            <p style={etiqueta}>Denunciado</p>
            {d.denunciado_id ? (
              <Link href={`/prestadores/${d.denunciado_id}?volver=/admin/denuncias`} style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink }}>
                {nombreDe(denunciado)}
              </Link>
            ) : (
              <span style={{ fontSize: 14 }}>—</span>
            )}
            {denunciado?.email && <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '2px 0 0', wordBreak: 'break-all' }}>{denunciado.email}</p>}
          </div>
          <div>
            <p style={etiqueta}>Denunció</p>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{nombreDe(usuarios.get(d.denunciante_id))}</span>
          </div>
          {d.pedido_id && (
            <div>
              <p style={etiqueta}>Trabajo</p>
              <Link href={`/pedidos/${d.pedido_id}`} style={{ fontSize: 14, fontWeight: 500, color: COLORS.ink }}>
                {pedido?.descripcion ? pedido.descripcion.slice(0, 80) : 'Ver publicación'}
              </Link>
              {pedido?.estado === 'cancelado' && <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '2px 0 0' }}>Ya dado de baja</p>}
            </div>
          )}
        </div>

        {d.estado === 'pendiente' && d.denunciado_id && (
          <p style={{ fontSize: 13, margin: '14px 0 0', color: previas.length ? COLORS.redDark : COLORS.inkSoft, fontWeight: 500 }}>
            {previas.length === 0
              ? 'Primera denuncia contra esta persona.'
              : `${previas.length + 1} denuncias contra esta persona, de ${personasDistintas} persona${personasDistintas === 1 ? '' : 's'} distinta${personasDistintas === 1 ? '' : 's'}.`}
          </p>
        )}
        {d.estado === 'pendiente' && previas.length > 0 && (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.6 }}>
            {previas.map((p) => (
              <li key={p.id}>
                {formatearCuando(p.created_at)} · {etiquetaMotivo(p.motivo)} · {p.estado === 'revisada' ? p.resolucion ?? 'revisada' : 'pendiente'}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  function Chat({ d }: { d: Denuncia }) {
    const mensajes = chatPorDenuncia.get(d.id) ?? []
    return (
      <div>
        <p style={etiqueta}>Chat entre los dos</p>
        {mensajes.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: 0 }}>No hablaron por el chat.</p>
        ) : (
          <div style={{ maxHeight: 320, overflowY: 'auto', background: COLORS.paper, borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mensajes.map((m, i) => {
              const delDenunciado = m.emisor_id === d.denunciado_id
              return (
                <div key={i} style={{ alignSelf: delDenunciado ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      padding: '7px 11px',
                      borderRadius: 14,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      background: delDenunciado ? COLORS.redTint : COLORS.card,
                      color: COLORS.ink,
                    }}
                  >
                    {m.contenido}
                  </p>
                  <p style={{ margin: '2px 4px 0', fontSize: 11, color: COLORS.inkSoft, textAlign: delDenunciado ? 'left' : 'right' }}>
                    {delDenunciado ? 'Denunciado' : 'Quien denunció'} · {formatearCuando(m.fecha)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <PantallaBase>
      <div style={{ padding: '20px 16px 120px' }}>
        <TituloPagina>Denuncias</TituloPagina>
        <Subtitulo>Panel de administración. Solo lo ves vos.</Subtitulo>

        <p style={{ fontSize: 13, margin: '-8px 0 20px' }}>
          <Link href="/admin/anuncios" style={{ color: COLORS.inkSoft, fontWeight: 500 }}>
            Ir a anuncios →
          </Link>
        </p>

        {error && (
          <div style={{ background: COLORS.redTint, color: COLORS.redDark, borderRadius: 16, padding: 16, marginBottom: 20, fontSize: 14 }}>
            No se pudo leer la tabla de denuncias ({error.message}). ¿Ya corriste scripts/sql/2026-09-29-denuncias-bloqueos.sql?
          </div>
        )}

        <p style={{ ...etiqueta, fontSize: 12.5, marginBottom: 12 }}>Pendientes ({pendientes.length})</p>
        {pendientes.length === 0 && !error && (
          <div style={{ background: COLORS.card, border: `2px dashed ${COLORS.line}`, borderRadius: 22, padding: 28, textAlign: 'center', marginBottom: 28 }}>
            <p style={{ color: COLORS.inkSoft, fontSize: 14.5, margin: 0 }}>No hay denuncias pendientes.</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {pendientes.map((d) => (
            <div key={d.id} id={`d-${d.id}`} style={tarjeta}>
              {/* En compu: el detalle a la izquierda, el chat a la derecha */}
              <div className="web-columnas">
                <div>
                  <Detalle d={d} />
                  <CerrarDenuncia id={d.id} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <Chat d={d} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {revisadas.length > 0 && (
          <>
            <p style={{ ...etiqueta, fontSize: 12.5, marginBottom: 12 }}>Revisadas (últimas {revisadas.length})</p>
            <div className="web-grilla" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {revisadas.map((d) => (
                <div key={d.id} id={`d-${d.id}`} style={{ ...tarjeta, opacity: 0.85 }}>
                  <Detalle d={d} />
                  <p style={{ fontSize: 13, margin: '12px 0 0', fontWeight: 500, color: COLORS.greenDark }}>
                    ✓ {d.resolucion ?? 'Revisada'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </PantallaBase>
  )
}
