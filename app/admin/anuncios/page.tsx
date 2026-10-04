import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { usuarioAdmin } from '@/lib/admin'
import { ESPACIOS_ANUNCIOS, FORMATOS_ANUNCIO, formatosPara } from '@/lib/espaciosAnuncios'
import { describirEnlace } from '@/lib/enlaceAnuncio'
import { COLORS } from '@/lib/theme'
import { PantallaBase, TituloPagina, Subtitulo } from '@/lib/ui'
import BottomNav from '@/components/BottomNav'
import FormAnuncio from '@/components/admin/FormAnuncio'
import Link from 'next/link'
import AccionesAnuncio from '@/components/admin/AccionesAnuncio'

// Panel de admin → anuncios: cargar, pausar y ver cómo rinde cada uno.
// Solo para los mails de ADMIN_EMAILS; para el resto la página no existe.

type Fila = {
  id: string
  anunciante: string | null
  espacios: string[]
  rubro: string | null
  imagen_url: string | null
  imagen_horizontal_url: string | null
  imagen_lateral_url: string | null
  enlace: string | null
  texto_alternativo: string | null
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

export default async function AdminAnunciosPage({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  if (!(await usuarioAdmin())) notFound()
  const { editar } = await searchParams

  const admin = createAdminClient()
  const [{ data, error }, { data: rubros }] = await Promise.all([
    admin
      .from('anuncios')
      .select(
        'id, anunciante, espacios, rubro, imagen_url, imagen_horizontal_url, imagen_lateral_url, enlace, texto_alternativo, activo, desde, hasta, impresiones, clics'
      )
      .order('created_at', { ascending: false }),
    admin.from('categorias_grupo').select('slug, nombre').order('nombre'),
  ])
  // Sin la migración de ubicaciones las columnas nuevas no existen
  const faltaMigracion = !!error && /espacios|imagen_(horizontal|lateral)_url/.test(error.message)
  const anuncios = (data ?? []) as Fila[]
  const hoy = new Date().toISOString().slice(0, 10)
  const enEdicion = editar ? anuncios.find((a) => a.id === editar) : undefined
  const nombreRubro = new Map((rubros ?? []).map((r) => [r.slug, r.nombre]))

  const enCurso = anuncios.filter((a) => estadoDe(a, hoy).texto !== 'Pausado' && estadoDe(a, hoy).texto !== 'Vencido')
  const totalImpresiones = anuncios.reduce((s, a) => s + Number(a.impresiones), 0)
  const totalClics = anuncios.reduce((s, a) => s + Number(a.clics), 0)

  return (
    <PantallaBase>
      <div style={{ padding: '20px 16px 120px' }}>
        <TituloPagina>Anuncios</TituloPagina>
        <Subtitulo>Panel de administración. Solo lo ves vos.</Subtitulo>

        <p style={{ fontSize: 13, margin: '-8px 0 20px' }}>
          <Link href="/admin/denuncias" style={{ color: COLORS.inkSoft, fontWeight: 500 }}>
            Ir a denuncias →
          </Link>
        </p>

        {error && (
          <div style={{ background: COLORS.redTint, color: COLORS.redDark, borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 14 }}>
            {faltaMigracion
              ? 'Falta correr scripts/sql/2026-10-04-anuncios-ubicaciones.sql en Supabase (SQL Editor). Hasta entonces la app sigue mostrando los anuncios viejos, pero acá no se pueden ver ni cargar.'
              : `No se pudo leer la tabla de anuncios (${error.message}). ¿Ya corriste scripts/sql/2026-09-29-anuncios.sql?`}
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
          {/* key: al pasar de un anuncio a otro, el formulario arranca de cero */}
          <FormAnuncio key={enEdicion?.id ?? 'nuevo'} rubros={rubros ?? []} inicial={enEdicion} />

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {anuncios.length === 0 && !error && (
              <div style={{ background: COLORS.card, border: `2px dashed ${COLORS.line}`, borderRadius: 22, padding: 32, textAlign: 'center' }}>
                <p style={{ color: COLORS.inkSoft, fontSize: 14.5, margin: 0 }}>
                  Todavía no hay anuncios. Cargá el primero con el formulario.
                </p>
              </div>
            )}

            {anuncios.map((a) => {
              const ubicaciones = ESPACIOS_ANUNCIOS.filter((e) => a.espacios.includes(e.valor))
              const imagenes = FORMATOS_ANUNCIO.filter((f) => a[f.columna])
              const faltan = formatosPara(a.espacios).filter((f) => !a[f.columna])
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
                    alignItems: 'start',
                    gap: 16,
                    opacity: estado.texto === 'Pausado' || estado.texto === 'Vencido' ? 0.7 : 1,
                    outline: enEdicion?.id === a.id ? `2px solid ${COLORS.dark}` : 'none',
                  }}
                >
                  {/* Una imagen por formato */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {imagenes.map((f) => (
                      // eslint-disable-next-line @next/next/no-img-element -- imagen del anunciante en el storage
                      <img
                        key={f.valor}
                        src={a[f.columna]!}
                        alt={`${f.label} de ${a.anunciante ?? 'anuncio'}`}
                        title={`${f.label} (${f.medida})`}
                        style={{ width: '100%', aspectRatio: f.proporcion, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                      />
                    ))}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: a.anunciante ? COLORS.ink : COLORS.inkSoft }}>
                          {a.anunciante ?? 'Sin nombre'}
                        </p>
                        <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '2px 0 0', lineHeight: 1.45 }}>
                          {ubicaciones.map((u) => `${u.label} (${u.dispositivo.toLowerCase()})`).join(' · ')}
                          {a.rubro && ` · Rubro: ${nombreRubro.get(a.rubro) ?? a.rubro}`}
                        </p>
                        {faltan.length > 0 && (
                          <p style={{ fontSize: 12.5, color: COLORS.redDark, margin: '4px 0 0' }}>
                            Falta la imagen {faltan.map((f) => f.label.toLowerCase()).join(' y ')}: ahí no sale.
                          </p>
                        )}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 12, background: estado.fondo, color: estado.color, padding: '4px 9px', borderRadius: 6 }}>
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
                      {describirEnlace(a.enlace)}
                    </p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link
                        href={`/admin/anuncios?editar=${a.id}`}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 100,
                          background: COLORS.dark,
                          color: COLORS.onDark,
                          fontSize: 12.5,
                          fontWeight: 500,
                          textDecoration: 'none',
                        }}
                      >
                        Editar
                      </Link>
                      <AccionesAnuncio id={a.id} activo={a.activo} anunciante={a.anunciante ?? 'este anuncio'} />
                    </div>
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
