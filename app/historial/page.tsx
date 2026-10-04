import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import { PantallaBase, LinkVolver, TituloPagina, Subtitulo } from '@/lib/ui'
import { formatearFechaCorta } from '@/lib/fechas'
import BottomNav from '@/components/BottomNav'

// Historial de los trabajos que ofreció el usuario y ya se cerraron
// (completados o no concretados), con quién lo hizo y quiénes se
// postularon, para poder recordarlos y volver a contactarlos.
// Los que el usuario eliminó no aparecen.

type Persona = { nombre: string | null; apellido: string | null; foto_perfil_url: string | null }
type Postulacion = {
  id: string
  estado: string
  prestador_id: string
  usuarios: Persona | Persona[] | null
}

function persona(p: Postulacion): Persona | null {
  return Array.isArray(p.usuarios) ? (p.usuarios[0] ?? null) : p.usuarios
}

function nombreCompleto(p: Persona | null) {
  return `${p?.nombre ?? ''} ${p?.apellido ?? ''}`.trim() || 'Usuario'
}

export default async function HistorialPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(
      `
      id,
      descripcion,
      estado,
      fecha_creacion,
      fecha_cierre,
      prestador_asignado_id,
      categorias ( nombre ),
      postulaciones (
        id,
        estado,
        prestador_id,
        usuarios!postulaciones_prestador_id_fkey ( nombre, apellido, foto_perfil_url )
      )
    `
    )
    .eq('solicitante_id', user.id)
    .in('estado', ['completado', 'cancelado'])
    .order('fecha_creacion', { ascending: false })
    .limit(50)

  const ids = (pedidos ?? []).map((p) => p.id)

  // "Cancelado" es tanto "no concretado" como "eliminado": los no
  // concretados son los que tienen su fila en no_concretados.
  const [{ data: noConcretados }, { data: misCalificaciones }] = await Promise.all([
    ids.length > 0
      ? supabase.from('no_concretados').select('pedido_id').in('pedido_id', ids)
      : Promise.resolve({ data: [] as { pedido_id: string }[] }),
    ids.length > 0
      ? supabase.from('calificaciones').select('pedido_id, estrellas').in('pedido_id', ids).eq('calificador_id', user.id)
      : Promise.resolve({ data: [] as { pedido_id: string; estrellas: number }[] }),
  ])

  const idsNoConcretados = new Set((noConcretados ?? []).map((n) => n.pedido_id))
  const estrellasPorPedido: Record<string, number> = {}
  for (const c of misCalificaciones ?? []) estrellasPorPedido[c.pedido_id] = c.estrellas

  const historial = (pedidos ?? []).filter((p) => p.estado === 'completado' || idsNoConcretados.has(p.id))

  const tarjeta: React.CSSProperties = {
    background: COLORS.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
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

  const subtitulo: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: COLORS.inkSoft,
    margin: '14px 0 8px',
  }

  return (
    <PantallaBase>
      <div style={{ padding: '20px 20px 110px' }}>
        <LinkVolver href="/" />
        <TituloPagina>Historial</TituloPagina>
        <Subtitulo>Los trabajos que publicaste y ya se cerraron, con quién los hizo y quiénes se postularon.</Subtitulo>

        {historial.length === 0 && (
          <div
            style={{
              background: COLORS.card,
              boxShadow: COLORS.cardShadow,
              borderRadius: 22,
              padding: 28,
              textAlign: 'center',
            }}
          >
            <p style={{ color: COLORS.inkSoft, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
              Todavía no cerraste ningún trabajo. Cuando termine uno, va a quedar acá.
            </p>
          </div>
        )}

        {/* En compu, las tarjetas en grilla */}
        <div className="web-grilla">
        {historial.map((p) => {
          const postulaciones = (p.postulaciones ?? []) as Postulacion[]
          const elegida = postulaciones.find((po) => po.prestador_id === p.prestador_asignado_id)
          const otros = postulaciones.filter((po) => po.prestador_id !== p.prestador_asignado_id)
          const categoria = p.categorias as { nombre: string } | { nombre: string }[] | null
          const nombreCategoria = Array.isArray(categoria) ? categoria[0]?.nombre : categoria?.nombre
          const estrellas = estrellasPorPedido[p.id]
          const completado = p.estado === 'completado'

          return (
            <div key={p.id} style={tarjeta}>
              <a href={`/pedidos/${p.id}`} style={{ textDecoration: 'none' }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: COLORS.ink }}>{p.descripcion}</p>
              </a>
              <p style={{ margin: '4px 0 10px', fontSize: 12.5, color: COLORS.inkSoft }}>
                Publicado el {formatearFechaCorta(p.fecha_creacion)}
                {p.fecha_cierre && ` · cerrado el ${formatearFechaCorta(p.fecha_cierre)}`}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {nombreCategoria && <span style={etiqueta(COLORS.tagOrange, COLORS.tagOrangeText)}>{nombreCategoria}</span>}
                {completado ? (
                  <span style={etiqueta(COLORS.greenTint, COLORS.greenDark)}>✓ Completado</span>
                ) : (
                  <span style={etiqueta(COLORS.navActiveBg, COLORS.inkSoft)}>No concretado</span>
                )}
              </div>

              {elegida && (
                <>
                  <p style={subtitulo}>{completado ? 'Lo hizo' : 'Elegiste a'}</p>
                  <FilaPersona
                    id={elegida.prestador_id}
                    persona={persona(elegida)}
                    detalle={estrellas ? `Le diste ${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)}` : undefined}
                  />
                </>
              )}

              {otros.length > 0 && (
                <>
                  <p style={subtitulo}>
                    {elegida ? 'También se postularon' : 'Se postularon'} ({otros.length})
                  </p>
                  {otros.map((po) => (
                    <FilaPersona key={po.id} id={po.prestador_id} persona={persona(po)} />
                  ))}
                </>
              )}
            </div>
          )
        })}
        </div>
      </div>
      <BottomNav />
    </PantallaBase>
  )
}

function FilaPersona({ id, persona: p, detalle }: { id: string; persona: Persona | null; detalle?: string }) {
  const nombre = nombreCompleto(p)
  return (
    <a
      href={`/prestadores/${id}?volver=/historial`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        marginBottom: 6,
        borderRadius: 14,
        background: COLORS.paper,
        textDecoration: 'none',
        color: COLORS.ink,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: COLORS.clayTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 500,
          flexShrink: 0,
          backgroundImage: p?.foto_perfil_url ? `url(${p.foto_perfil_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!p?.foto_perfil_url && nombre[0]?.toUpperCase()}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 500 }}>{nombre}</span>
        {detalle && <span style={{ display: 'block', fontSize: 12, color: COLORS.clayDark, marginTop: 1 }}>{detalle}</span>}
      </span>
      <span style={{ color: COLORS.inkSoft, fontSize: 16 }}>›</span>
    </a>
  )
}
