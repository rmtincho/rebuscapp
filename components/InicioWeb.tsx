'use client'

import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { guardarModo, type ModoInicio } from '@/lib/modoInicio'
import { COLORS } from '@/lib/theme'
import { CATEGORIAS_DESTACADAS } from '@/lib/categoriasDestacadas'
import { iconoParaCategoria } from '@/lib/categoryIcons'
import MapaPedidosWrapper from '@/components/MapaPedidosWrapper'
import TrabajadoresList, { type Trabajador } from '@/components/TrabajadoresList'
import BannerPublicidad from '@/components/BannerPublicidad'
import type { Anuncio } from '@/lib/anuncios'
import { elegirAnuncio } from '@/lib/elegirAnuncio'

// Inicio de la versión web (compu). No es el inicio del celular estirado:
// franja de bienvenida con buscador, rubros como tiles, tu actividad en una
// fila, y los trabajos como un sitio de avisos (filtros a la izquierda,
// grilla o mapa grande a la derecha). En el celular se usa el inicio de siempre.

export type PedidoWeb = {
  id: string
  descripcion: string
  ubicacion_lat: number | null
  ubicacion_lng: number | null
  monto_ofrecido: number | null
  monto_a_convenir: boolean
  es_comercio: boolean
  nombre_comercio: string | null
  fecha_creacion?: string | null
  categorias: { nombre: string; grupo_slug: string | null } | null
  usuarios: { nombre: string } | null
}

export type ActividadWeb = {
  tipo: 'pedido' | 'postulacion'
  href: string
  titulo: string
  detalle: string
  estado: string
  colorEstado: 'amarillo' | 'verde' | 'rojo' | 'gris' | 'azul'
  sinLeer: number
}

type Orden = 'recientes' | 'monto'
type Pago = 'todos' | 'con_monto' | 'a_convenir'

const COLORES_ESTADO: Record<ActividadWeb['colorEstado'], { fondo: string; texto: string }> = {
  amarillo: { fondo: COLORS.clayTint, texto: COLORS.clayDark },
  verde: { fondo: COLORS.greenTint, texto: COLORS.greenDark },
  rojo: { fondo: COLORS.redTint, texto: COLORS.redDark },
  gris: { fondo: '#EDEDF2', texto: '#4B4B55' },
  azul: { fondo: COLORS.blueTint, texto: COLORS.blueDark },
}

const TAGS = [
  { fondo: COLORS.tagBlue, texto: COLORS.tagBlueText },
  { fondo: COLORS.tagPink, texto: COLORS.tagPinkText },
  { fondo: COLORS.tagOrange, texto: COLORS.tagOrangeText },
]

function tagDe(nombre: string) {
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TAGS[h % TAGS.length]
}

function hace(fecha?: string | null) {
  if (!fecha) return ''
  const horas = Math.floor((Date.now() - new Date(fecha).getTime()) / 3_600_000)
  if (horas < 1) return 'Recién'
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`
}

const tituloSeccion: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: COLORS.ink,
  margin: 0,
}

export default function InicioWeb({
  nombre,
  pedidos,
  trabajadores,
  actividad,
  tieneHistorial,
  centro,
  anuncioHorizontal,
  anuncioLateral,
  anunciosLista,
  semilla,
  modo,
}: {
  nombre: string | null
  pedidos: PedidoWeb[]
  trabajadores: Trabajador[]
  actividad: ActividadWeb[]
  tieneHistorial: boolean
  centro: [number, number]
  anuncioHorizontal: Anuncio | null
  anuncioLateral: Anuncio | null
  anunciosLista: Anuncio[]
  semilla: number
  // Busco trabajo → trabajos; necesito a alguien → trabajadores y tus pedidos
  modo: ModoInicio
}) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState<string | null>(null)
  const [pago, setPago] = useState<Pago>('todos')
  const [orden, setOrden] = useState<Orden>('recientes')
  const seccion = modo === 'busco' ? 'trabajos' : 'trabajadores'
  const actividadDelModo = actividad.filter((a) => (modo === 'busco' ? a.tipo === 'postulacion' : a.tipo === 'pedido'))

  function cambiarModo(m: ModoInicio) {
    if (m === modo) return
    guardarModo(m)
    setBusqueda('')
    setTexto('')
    setGrupo(null)
    router.refresh()
  }
  const [vista, setVista] = useState<'grilla' | 'mapa'>('grilla')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = pedidos.filter((p) => {
      if (grupo && p.categorias?.grupo_slug !== grupo) return false
      if (pago === 'con_monto' && !p.monto_ofrecido) return false
      if (pago === 'a_convenir' && !p.monto_a_convenir) return false
      if (q && !`${p.descripcion} ${p.categorias?.nombre ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    if (orden === 'monto') return [...lista].sort((a, b) => (b.monto_ofrecido ?? 0) - (a.monto_ofrecido ?? 0))
    return lista
  }, [pedidos, grupo, pago, orden, busqueda])

  const trabajadoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return trabajadores.filter((t) => {
      if (grupo && !t.categorias.some((c) => c.grupoSlug === grupo)) return false
      if (q && !`${t.nombre} ${t.sobreMi ?? ''} ${t.categorias.map((c) => c.nombre).join(' ')}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [trabajadores, grupo, busqueda])

  // Tarjeta "Patrocinado" en la grilla: del rubro filtrado si hay, si no general
  const patrocinado = elegirAnuncio(anunciosLista, grupo, semilla)
  const posicionPatrocinado = Math.min(6, filtrados.length)

  const conUbicacion = filtrados.filter((p) => p.ubicacion_lat !== null && p.ubicacion_lng !== null)

  function buscar(e: React.FormEvent) {
    e.preventDefault()
    setBusqueda(texto)
    document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })
  }

  function limpiar() {
    setTexto('')
    setBusqueda('')
    setGrupo(null)
    setPago('todos')
  }

  const hayFiltros = !!busqueda || !!grupo || pago !== 'todos'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 80px' }}>
      {/* ——— Bienvenida con buscador ——— */}
      <section
        style={{
          background: COLORS.clayGradient,
          borderRadius: 32,
          padding: '40px 44px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <div>
          <div role="tablist" aria-label="¿Qué querés hacer?" style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.5)', borderRadius: 100, padding: 4, marginBottom: 22 }}>
            {(
              [
                ['busco', 'Busco trabajo'],
                ['ofrezco', 'Necesito a alguien'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={modo === v}
                onClick={() => cambiarModo(v)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 100,
                  border: 'none',
                  background: modo === v ? COLORS.dark : 'transparent',
                  color: modo === v ? COLORS.onDark : COLORS.ink,
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(28,28,30,0.7)', margin: '0 0 6px' }}>
            {nombre ? `Hola, ${nombre}` : 'Hola'}
          </p>
          <h1 style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 24px', color: COLORS.ink }}>
            {modo === 'busco' ? '¿Qué trabajo buscás hoy?' : '¿A quién necesitás?'}
          </h1>
          <form
            onSubmit={buscar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: COLORS.card,
              borderRadius: 100,
              padding: 6,
              boxShadow: '0 12px 30px rgba(80, 60, 20, 0.15)',
              maxWidth: 640,
            }}
          >
            <span style={{ paddingLeft: 14, color: COLORS.inkSoft, display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={modo === 'busco' ? 'Plomería, limpieza, flete, pintar una pieza...' : 'Plomero, electricista, pintor, cuidado de personas...'}
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 16, padding: '12px 4px', background: 'transparent', color: COLORS.ink }}
            />
            <button
              type="submit"
              style={{
                padding: '13px 26px',
                borderRadius: 100,
                border: 'none',
                background: COLORS.dark,
                color: COLORS.onDark,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Buscar
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { n: pedidos.length, l: pedidos.length === 1 ? 'trabajo abierto' : 'trabajos abiertos' },
              { n: trabajadores.length, l: trabajadores.length === 1 ? 'trabajador' : 'trabajadores' },
            ].map((d) => (
              <div key={d.l} style={{ background: 'rgba(255,255,255,0.55)', borderRadius: 20, padding: '16px 16px 14px' }}>
                <p style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: COLORS.ink }}>{d.n}</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'rgba(28,28,30,0.7)' }}>{d.l}</p>
              </div>
            ))}
          </div>
          <a
            href="/publicar"
            style={{
              display: 'block',
              background: COLORS.dark,
              color: COLORS.onDark,
              borderRadius: 20,
              padding: '18px 18px',
              textDecoration: 'none',
            }}
          >
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 4px', fontWeight: 600 }}>¿Necesitás a alguien?</p>
            <p style={{ fontSize: 17, fontWeight: 700, margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Publicá un trabajo
              <span style={{ color: COLORS.clay, fontSize: 20 }}>→</span>
            </p>
          </a>
        </div>
      </section>

      {/* ——— Rubros ——— */}
      <section style={{ marginTop: 36 }}>
        <h2 style={{ ...tituloSeccion, marginBottom: 16 }}>Explorá por rubro</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12 }}>
          {[{ slug: null, label: 'Todos' }, ...CATEGORIAS_DESTACADAS].map((c) => {
            const activa = grupo === c.slug
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setGrupo(activa ? null : c.slug)
                  document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 14px',
                  borderRadius: 18,
                  border: 'none',
                  background: activa ? COLORS.dark : COLORS.card,
                  color: activa ? COLORS.onDark : COLORS.ink,
                  boxShadow: COLORS.cardShadow,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: activa ? 'rgba(255,255,255,0.12)' : COLORS.clayTint,
                    color: activa ? COLORS.clay : COLORS.clayDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {c.slug ? (
                    iconoParaCategoria(c.label)
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  )}
                </span>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ——— Tu actividad ——— */}
      {actividadDelModo.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={tituloSeccion}>Tu actividad</h2>
            <div style={{ display: 'flex', gap: 18 }}>
              {modo === 'busco' && (
                <a href="/mis-postulaciones" style={{ fontSize: 14, fontWeight: 600, color: COLORS.clayDark, textDecoration: 'none' }}>
                  Mis postulaciones →
                </a>
              )}
              {modo === 'ofrezco' && tieneHistorial && (
                <a href="/historial" style={{ fontSize: 14, fontWeight: 600, color: COLORS.clayDark, textDecoration: 'none' }}>
                  Historial →
                </a>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
            {actividadDelModo.slice(0, 6).map((a) => {
              const est = COLORES_ESTADO[a.colorEstado]
              return (
                <a
                  key={a.href + a.tipo}
                  href={a.href}
                  style={{
                    display: 'block',
                    position: 'relative',
                    background: a.sinLeer > 0 ? COLORS.dark : COLORS.card,
                    color: a.sinLeer > 0 ? COLORS.onDark : COLORS.ink,
                    borderRadius: 22,
                    padding: 18,
                    boxShadow: COLORS.cardShadow,
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: a.sinLeer > 0 ? 'rgba(255,255,255,0.6)' : COLORS.inkSoft,
                      }}
                    >
                      {a.tipo === 'pedido' ? 'Tu pedido' : 'Tu postulación'}
                    </span>
                    {a.sinLeer > 0 ? (
                      <span style={{ fontSize: 12, fontWeight: 700, background: COLORS.clay, color: COLORS.onClay, padding: '4px 10px', borderRadius: 100 }}>
                        {a.sinLeer} mensaje{a.sinLeer > 1 ? 's' : ''} nuevo{a.sinLeer > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, background: est.fondo, color: est.texto, padding: '4px 10px', borderRadius: 100 }}>
                        {a.estado}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      margin: '0 0 4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.titulo.charAt(0).toUpperCase() + a.titulo.slice(1)}
                  </p>
                  <p style={{ fontSize: 13, margin: 0, color: a.sinLeer > 0 ? 'rgba(255,255,255,0.65)' : COLORS.inkSoft }}>{a.detalle}</p>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* ——— Publicidad: franja ancha fija ——— */}
      <BannerPublicidad anuncio={anuncioHorizontal} formato="horizontal" style={{ marginTop: 40 }} />

      {/* ——— Resultados: filtros a la izquierda, grilla o mapa a la derecha ——— */}
      <section id="resultados" style={{ marginTop: 44, scrollMarginTop: 'calc(var(--alto-cabecera) + 16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <h2 style={tituloSeccion}>
            {seccion === 'trabajos' ? 'Trabajos cerca tuyo' : 'Trabajadores'}
            <span style={{ color: COLORS.inkSoft, fontWeight: 500 }}>
              {' '}
              · {seccion === 'trabajos' ? filtrados.length : trabajadoresFiltrados.length}
            </span>
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {seccion === 'trabajos' && (
              <Segmento
                opciones={[
                  { valor: 'grilla', label: 'Grilla' },
                  { valor: 'mapa', label: 'Mapa' },
                ]}
                valor={vista}
                onChange={(v) => setVista(v as 'grilla' | 'mapa')}
              />
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr)', gap: 28, alignItems: 'start' }}>
          {/* Filtros, y debajo un espacio de publicidad */}
          <div>
          <aside
            style={{
              background: COLORS.card,
              borderRadius: 22,
              padding: 20,
              boxShadow: COLORS.cardShadow,
            }}
          >
            <Filtro titulo="Rubro">
              {[{ slug: null, label: 'Todos' }, ...CATEGORIAS_DESTACADAS].map((c) => (
                <OpcionFiltro key={c.label} activa={grupo === c.slug} onClick={() => setGrupo(c.slug)}>
                  {c.label}
                </OpcionFiltro>
              ))}
            </Filtro>
            {seccion === 'trabajos' && (
              <>
                <Filtro titulo="Pago">
                  {(
                    [
                      ['todos', 'Todos'],
                      ['con_monto', 'Con monto'],
                      ['a_convenir', 'A convenir'],
                    ] as const
                  ).map(([v, l]) => (
                    <OpcionFiltro key={v} activa={pago === v} onClick={() => setPago(v)}>
                      {l}
                    </OpcionFiltro>
                  ))}
                </Filtro>
                <Filtro titulo="Ordenar">
                  {(
                    [
                      ['recientes', 'Más recientes'],
                      ['monto', 'Mayor monto'],
                    ] as const
                  ).map(([v, l]) => (
                    <OpcionFiltro key={v} activa={orden === v} onClick={() => setOrden(v)}>
                      {l}
                    </OpcionFiltro>
                  ))}
                </Filtro>
              </>
            )}
            {hayFiltros && (
              <button
                type="button"
                onClick={limpiar}
                style={{ marginTop: 4, border: 'none', background: 'none', padding: 0, color: COLORS.clayDark, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
              >
                Limpiar filtros
              </button>
            )}
          </aside>
          <BannerPublicidad anuncio={anuncioLateral} formato="lateral" style={{ marginTop: 18 }} />
          </div>

          {/* Resultados */}
          <div style={{ minWidth: 0 }}>
            {busqueda && (
              <p style={{ fontSize: 14, color: COLORS.inkSoft, margin: '0 0 14px' }}>
                Resultados para <b style={{ color: COLORS.ink }}>“{busqueda}”</b>
              </p>
            )}

            {seccion === 'trabajadores' ? (
              trabajadoresFiltrados.length === 0 ? (
                <Vacio texto="No hay trabajadores con esos filtros." />
              ) : (
                <TrabajadoresList trabajadores={trabajadoresFiltrados} />
              )
            ) : filtrados.length === 0 ? (
              <Vacio texto={hayFiltros ? 'No hay trabajos con esos filtros.' : 'Todavía no hay trabajos publicados. Sé el primero.'} />
            ) : vista === 'mapa' ? (
              <div style={{ borderRadius: 26, overflow: 'hidden', boxShadow: COLORS.cardShadow }}>
                <MapaPedidosWrapper pedidos={conUbicacion as never} centro={centro} alto="calc(100vh - var(--alto-cabecera) - 140px)" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {filtrados.map((p, i) => (
                  <Fragment key={p.id}>
                    <TarjetaTrabajo p={p} />
                    {patrocinado && i === posicionPatrocinado - 1 && (
                      <BannerPublicidad anuncio={patrocinado} formato="movil" etiqueta="Patrocinado" style={{ gridColumn: 'span 2' }} />
                    )}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function TarjetaTrabajo({ p }: { p: PedidoWeb }) {
  const cat = p.categorias?.nombre ?? 'Trabajo'
  const tag = tagDe(cat)
  const quien = p.es_comercio ? p.nombre_comercio : p.usuarios?.nombre
  const precio = p.monto_a_convenir ? 'A convenir' : p.monto_ofrecido ? `$${p.monto_ofrecido.toLocaleString('es-AR')}` : null
  return (
    <a
      href={`/pedidos/${p.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: COLORS.card,
        borderRadius: 22,
        padding: 18,
        boxShadow: COLORS.cardShadow,
        textDecoration: 'none',
        color: COLORS.ink,
        minHeight: 190,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: tag.fondo,
            color: tag.texto,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {iconoParaCategoria(cat)}
        </span>
        <span style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 600 }}>{hace(p.fecha_creacion)}</span>
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: tag.texto }}>{cat}</span>
        <p
          style={{
            fontSize: 16.5,
            fontWeight: 700,
            lineHeight: 1.3,
            margin: '4px 0 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {p.descripcion}
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: COLORS.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {quien ?? ''}
        </span>
        {precio && (
          <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, background: COLORS.dark, color: COLORS.onDark, padding: '5px 11px', borderRadius: 100 }}>
            {precio}
          </span>
        )}
      </div>
    </a>
  )
}

function Segmento({
  opciones,
  valor,
  onChange,
}: {
  opciones: { valor: string; label: string }[]
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', background: COLORS.card, borderRadius: 100, padding: 4, boxShadow: COLORS.cardShadow }}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          style={{
            padding: '9px 18px',
            borderRadius: 100,
            border: 'none',
            background: valor === o.valor ? COLORS.dark : 'transparent',
            color: valor === o.valor ? COLORS.onDark : COLORS.inkSoft,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Filtro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkSoft, margin: '0 0 8px' }}>
        {titulo}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  )
}

function OpcionFiltro({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 8px',
        borderRadius: 10,
        border: 'none',
        background: activa ? COLORS.clayTint : 'transparent',
        color: COLORS.ink,
        fontSize: 14,
        fontWeight: activa ? 700 : 500,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          flexShrink: 0,
          border: `2px solid ${activa ? COLORS.dark : COLORS.line}`,
          background: activa ? COLORS.dark : 'transparent',
          boxShadow: activa ? `inset 0 0 0 3px ${COLORS.clayTint}` : 'none',
        }}
      />
      {children}
    </button>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div style={{ background: COLORS.card, border: `2px dashed ${COLORS.line}`, borderRadius: 22, padding: 40, textAlign: 'center' }}>
      <p style={{ color: COLORS.inkSoft, fontSize: 15, margin: 0 }}>{texto}</p>
    </div>
  )
}
