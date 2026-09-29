import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { usuarioAdmin } from '@/lib/admin'
import { ESPACIOS_ANUNCIOS } from '@/lib/espaciosAnuncios'
import { COLORS } from '@/lib/theme'
import { PantallaBase, TituloPagina, Subtitulo } from '@/lib/ui'
import BottomNav from '@/components/BottomNav'
import FormAnuncio from '@/components/admin/FormAnuncio'
import AccionesAnuncio from '@/components/admin/AccionesAnuncio'

// Panel de admin → anuncios: cargar, pausar y ver cómo rinde cada uno.
// Solo para los mails de ADMIN_EMAILS; para el resto la página no existe.

type Fila = {
  id: string
  anunciante: string
  espacio: string
  rubro: string | null
  imagen_url: string
  enlace: string | null
  activo: boolean
  desde: string | null
  hasta: string | null
  impresiones: number
  clics: number
}

const DIA_MS = 86_400_000

function estadoDe(a: Fila, hoy: string): { texto: string; fondo: string; color: string } {
  if (!a.activo) return { texto: 'Pausado', fondo: '#EDEDF2', color: '#4B4B55' }
  if (a.desde && a.desde > hoy) return { texto: `Empieza el ${a.desde.split('-').reverse().join('/')}`, fondo: COLORS.blueTint, color: COLORS.blueDark }
  if (a.hasta && a.hasta < hoy) return { texto: 'Vencido', fondo: COLORS.redTint, color: COLORS.redDark }
  if (a.hasta) {
    const dias = Math.ceil((new Date(a.hasta).getTime() - new Date(hoy).getTime()) / DIA_MS)
    if (dias <= 7) return { texto: dias === 0 ? 'Vence hoy' : `Vence en ${dias} día${dias === 1 ? '' : 's'}`, fondo: COLORS.clayTint, color: COLORS.clayDark }
  }
  return { texto: 'Activo', fondo: COLORS.greenTint, color: COLORS.greenDark }
}

function numero(n: number) {
  return n.toLocaleString('es-AR')
}

export default async function AdminAnunciosPage() {
  if (!(await usuarioAdmin())) notFound()

  const admin = createAdminClient()
  const [{ data, error }, { data: rubros }] = await Promise.all([
    admin
      .from('anuncios')
      .select('id, anunciante, espacio, rubro, imagen_url, enlace, activo, desde, hasta, impresiones, clics')
      .order('created_at', { ascending: false }),
    admin.from('categorias_grupo').select('slug, nombre').order('nombre'),
  ])
  const anuncios = (data ?? []) as Fila[]
  const hoy = new Date().toISOString().slice(0, 10)
  const nombreRubro = new Map((rubros ?? []).map((r) => [r.slug, r.nombre]))

  const enCurso = anuncios.filter((a) => estadoDe(a, hoy).texto !== 'Pausado' && estadoDe(a, hoy).texto !== 'Vencido')
  const totalImpresiones = anuncios.reduce((s, a) => s + Number(a.impresiones), 0)
  const totalClics = anuncios.reduce((s, a) => s + Number(a.clics), 0)

  return (
    <PantallaBase>
      <div style={{ padding: '20px 16px 120px' }}>
        <TituloPagina>Anuncios</TituloPagina>
        <Subtitulo>Panel de administración. Solo lo ves vos.</Subtitulo>

        {error && (
          <div style={{ background: COLORS.redTint, color: COLORS.redDark, borderRadius: 16, padding: 16, marginBottom: 20, fontSize: 14 }}>
            No se pudo leer la tabla de anuncios ({error.message}). ¿Ya corriste scripts/sql/2026-09-29-anuncios.sql?
          </div>
        )}

        {/* Resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { v: enCurso.length, l: 'Anuncios en curso' },
            { v: totalImpresiones, l: 'Impresiones' },
            { v: totalClics, l: 'Clics' },
            { v: totalImpresiones ? `${((100 * totalClics) / totalImpresiones).toFixed(1)}%` : '—', l: 'Clics / impresiones' },
          ].map((d) => (
            <div key={d.l} style={{ background: COLORS.card, borderRadius: 20, padding: 16, boxShadow: COLORS.cardShadow }}>
              <p style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {typeof d.v === 'number' ? numero(d.v) : d.v}
              </p>
              <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: 0 }}>{d.l}</p>
            </div>
          ))}
        </div>

        <div className="web-dos-columnas">
          <FormAnuncio rubros={rubros ?? []} />

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {anuncios.length === 0 && !error && (
              <div style={{ background: COLORS.card, border: `2px dashed ${COLORS.line}`, borderRadius: 22, padding: 32, textAlign: 'center' }}>
                <p style={{ color: COLORS.inkSoft, fontSize: 14.5, margin: 0 }}>
                  Todavía no hay anuncios. Cargá el primero con el formulario.
                </p>
              </div>
            )}

            {anuncios.map((a) => {
              const espacio = ESPACIOS_ANUNCIOS.find((e) => e.valor === a.espacio)
              const estado = estadoDe(a, hoy)
              const ctr = a.impresiones ? `${((100 * Number(a.clics)) / Number(a.impresiones)).toFixed(1)}%` : '—'
              return (
                <div
                  key={a.id}
                  style={{
                    background: COLORS.card,
                    borderRadius: 22,
                    padding: 16,
                    boxShadow: COLORS.cardShadow,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 200px) minmax(0, 1fr)',
                    gap: 16,
                    opacity: estado.texto === 'Pausado' || estado.texto === 'Vencido' ? 0.7 : 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagen del anunciante en el storage */}
                  <img
                    src={a.imagen_url}
                    alt={a.anunciante}
                    style={{ width: '100%', aspectRatio: espacio?.proporcion ?? '3 / 1', objectFit: 'cover', borderRadius: 14, alignSelf: 'start' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{a.anunciante}</p>
                        <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '2px 0 0' }}>
                          {espacio?.label ?? a.espacio}
                          {a.rubro && ` · ${nombreRubro.get(a.rubro) ?? a.rubro}`}
                        </p>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, background: estado.fondo, color: estado.color, padding: '4px 10px', borderRadius: 100 }}>
                        {estado.texto}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 18, margin: '12px 0' }}>
                      {[
                        { v: numero(Number(a.impresiones)), l: 'impresiones' },
                        { v: numero(Number(a.clics)), l: 'clics' },
                        { v: ctr, l: 'clics / impr.' },
                      ].map((d) => (
                        <div key={d.l}>
                          <p style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{d.v}</p>
                          <p style={{ fontSize: 11.5, color: COLORS.inkSoft, margin: 0 }}>{d.l}</p>
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.desde || a.hasta
                        ? `Del ${a.desde ? a.desde.split('-').reverse().join('/') : 'inicio'} al ${a.hasta ? a.hasta.split('-').reverse().join('/') : 'sin fecha de fin'}`
                        : 'Sin fechas'}
                      {' · '}
                      {a.enlace ? (
                        <a href={a.enlace} target="_blank" rel="noopener" style={{ color: COLORS.clayDark }}>
                          {a.enlace.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        'Sin enlace (no se puede tocar)'
                      )}
                    </p>

                    <AccionesAnuncio id={a.id} activo={a.activo} anunciante={a.anunciante} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </PantallaBase>
  )
}
