'use client'

import { Fragment, useMemo, useState } from 'react'
import { TEMA_MODO, type ModoInicio } from '@/lib/modoInicio'
import { useModo } from '@/components/ModoContext'
import { COLORS } from '@/lib/theme'
import { CATEGORIAS_DESTACADAS } from '@/lib/categoriasDestacadas'
import { iconoParaCategoria } from '@/lib/categoryIcons'
import { haceCuanto } from '@/lib/fechas'
import TrabajadoresList, { type Trabajador } from '@/components/TrabajadoresList'
import BannerPublicidad from '@/components/BannerPublicidad'
import CarruselWeb from '@/components/CarruselWeb'
import InterruptorHabilidades from '@/components/InterruptorHabilidades'
import type { Anuncio } from '@/lib/anuncios'
import { elegirAnuncio } from '@/lib/elegirAnuncio'
import { MenuWeb } from '@/components/CabeceraWeb'

// Inicio de la versión web (compu). No es el inicio del celular estirado:
// franja de bienvenida con buscador, rubros como tiles, tu actividad en una
// fila, y los trabajos como un sitio de avisos (filtros a la izquierda,
// la grilla a la derecha). En el celular se usa el inicio de siempre.

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
  categoria_slug?: string | null
  // Calculado en el servidor: ¿cumplo edad, estudios, carnet e idioma?
  cumple_requisitos?: boolean
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

// Fondos de los círculos de rubro, alternados para que la fila no sea un
// bloque de un solo color. Verde y rojo quedan afuera: son de estados.
const COLORES_RUBRO = [
  { fondo: COLORS.clayTint, texto: COLORS.clayDark },
  { fondo: COLORS.tagBlue, texto: COLORS.tagBlueText },
  { fondo: COLORS.tagOrange, texto: COLORS.tagOrangeText },
  { fondo: COLORS.tagPink, texto: COLORS.tagPinkText },
]

function tagDe(nombre: string) {
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TAGS[h % TAGS.length]
}

const tituloSeccion: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: COLORS.ink,
  margin: 0,
}

export default function InicioWeb({
  pedidos,
  trabajadores,
  actividad,
  tieneHistorial,
  anunciosCarrusel,
  anuncioLateral,
  anunciosLista,
  semilla,
  misCategorias,
}: {
  pedidos: PedidoWeb[]
  trabajadores: Trabajador[]
  actividad: ActividadWeb[]
  tieneHistorial: boolean
  // Carrusel de publicidad debajo del hero
  anunciosCarrusel: Anuncio[]
  anuncioLateral: Anuncio | null
  anunciosLista: Anuncio[]
  semilla: number
  // Rubros del perfil de trabajador, para "Coinciden con mis habilidades"
  misCategorias: string[]
}) {
  // Busco trabajo → trabajos; busco contratar → trabajadores y tus pedidos
  const { modo, cambiarModo: cambiarModoContexto } = useModo()
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState<string | null>(null)
  const [pago, setPago] = useState<Pago>('todos')
  const [orden, setOrden] = useState<Orden>('recientes')
  const [soloMios, setSoloMios] = useState(false)
  const seccion = modo === 'busco' ? 'trabajos' : 'trabajadores'
  // Color del modo: amarillo para "busco trabajo", oscuro para "busco contratar"
  const tema = TEMA_MODO[modo]
  const actividadDelModo = actividad.filter((a) => (modo === 'busco' ? a.tipo === 'postulacion' : a.tipo === 'pedido'))

  function cambiarModo(m: ModoInicio) {
    if (m === modo) return
    cambiarModoContexto(m)
    setBusqueda('')
    setTexto('')
    setGrupo(null)
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = pedidos.filter((p) => {
      if (grupo && p.categorias?.grupo_slug !== grupo) return false
      if (soloMios && (!misCategorias.includes(p.categoria_slug ?? '') || p.cumple_requisitos === false)) return false
      if (pago === 'con_monto' && !p.monto_ofrecido) return false
      if (pago === 'a_convenir' && !p.monto_a_convenir) return false
      if (q && !`${p.descripcion} ${p.categorias?.nombre ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    if (orden === 'monto') return [...lista].sort((a, b) => (b.monto_ofrecido ?? 0) - (a.monto_ofrecido ?? 0))
    return lista
  }, [pedidos, grupo, pago, orden, busqueda, soloMios, misCategorias])

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
    setSoloMios(false)
  }

  const hayFiltros = !!busqueda || !!grupo || pago !== 'todos' || soloMios

  return (
    <div>
      {/* ——— Bienvenida con buscador, con el color del modo: de lado a lado,
          pegada a la cabecera; el contenido con el mismo ancho que el resto ——— */}
      <section style={{ background: tema.fondo, color: tema.texto }}>
      {/* El menú de la cabecera va acá adentro, transparente sobre el color */}
      <MenuWeb sobre={modo} />
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '36px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Centrado: modo, pregunta y buscador, nada más */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div role="tablist" aria-label="¿Qué querés hacer?" style={{ display: 'inline-flex', background: tema.superficie, borderRadius: 10, padding: 4, marginBottom: 22 }}>
            {(
              [
                ['busco', 'Busco trabajo'],
                ['ofrezco', 'Busco contratar'],
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
                  borderRadius: 7,
                  border: 'none',
                  background: modo === v ? tema.activo : 'transparent',
                  color: modo === v ? tema.sobreActivo : tema.textoSuave,
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 22px', color: tema.texto }}>
            {modo === 'busco' ? '¿Qué trabajo buscás hoy?' : '¿A quién necesitás?'}
          </h1>
          <form
            onSubmit={buscar}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: COLORS.card,
              borderRadius: 10,
              padding: 6,
              boxShadow: '0 12px 30px rgba(80, 60, 20, 0.15)',
              width: '100%',
              maxWidth: 640,
              textAlign: 'left',
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
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 15, padding: '12px 4px', background: 'transparent', color: COLORS.ink }}
            />
            <button
              type="submit"
              style={{
                padding: '13px 26px',
                borderRadius: 7,
                border: 'none',
                background: COLORS.dark,
                color: COLORS.onDark,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Buscar
            </button>
          </form>
        </div>
      </div>
      </section>

      {/* ——— Publicidad: carrusel con el activo al centro ——— */}
      <CarruselWeb anuncios={anunciosCarrusel} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
      {/* ——— Rubros ——— */}
      <section style={{ marginTop: 36 }}>
        <h2 style={{ ...tituloSeccion, marginBottom: 16 }}>Explorá por rubro</h2>
        {/* Círculos sueltos con el nombre abajo, sin tarjeta: cada rubro con su
            color, el elegido en oscuro con un aro alrededor */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          {[{ slug: null, label: 'Todos' }, ...CATEGORIAS_DESTACADAS].map((c, i) => {
            const activa = grupo === c.slug
            const color = COLORES_RUBRO[i % COLORES_RUBRO.length]
            return (
              <button
                key={c.label}
                type="button"
                className="rubro-circulo"
                aria-pressed={activa}
                onClick={() => {
                  setGrupo(activa ? null : c.slug)
                  document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  color: COLORS.ink,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: activa ? 700 : 400,
                  lineHeight: 1.25,
                  textAlign: 'center',
                }}
              >
                <span
                  className="rubro-disco"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: activa ? COLORS.dark : color.fondo,
                    color: activa ? COLORS.clay : color.texto,
                    boxShadow: activa ? `0 0 0 3px ${COLORS.paper}, 0 0 0 5px ${COLORS.dark}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ display: 'flex', transform: 'scale(1.35)' }}>
                    {c.slug ? (
                      iconoParaCategoria(c.label)
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="7" cy="7" r="3.2" />
                        <circle cx="17" cy="7" r="3.2" />
                        <circle cx="7" cy="17" r="3.2" />
                        <circle cx="17" cy="17" r="3.2" />
                      </svg>
                    )}
                  </span>
                </span>
                <span style={{ maxWidth: 96 }}>{c.label}</span>
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
                <a href="/mis-postulaciones" style={{ fontSize: 14, fontWeight: 500, color: COLORS.clayDark, textDecoration: 'none' }}>
                  Mis postulaciones →
                </a>
              )}
              {modo === 'ofrezco' && tieneHistorial && (
                <a href="/historial" style={{ fontSize: 14, fontWeight: 500, color: COLORS.clayDark, textDecoration: 'none' }}>
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
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: COLORS.cardShadow,
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: a.sinLeer > 0 ? COLORS.onDark : COLORS.inkSoft,
                      }}
                    >
                      {a.tipo === 'pedido' ? 'Tu pedido' : 'Tu postulación'}
                    </span>
                    {a.sinLeer > 0 ? (
                      <span style={{ fontSize: 13, fontWeight: 700, background: COLORS.clay, color: COLORS.onClay, padding: '4px 10px', borderRadius: 6 }}>
                        {a.sinLeer} mensaje{a.sinLeer > 1 ? 's' : ''} nuevo{a.sinLeer > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 500, background: est.fondo, color: est.texto, padding: '4px 10px', borderRadius: 6 }}>
                        {a.estado}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      margin: '0 0 4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.titulo.charAt(0).toUpperCase() + a.titulo.slice(1)}
                  </p>
                  <p style={{ fontSize: 14, margin: 0, color: a.sinLeer > 0 ? COLORS.onDark : COLORS.inkSoft }}>{a.detalle}</p>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* ——— Publicidad: franja ancha fija ——— */}

      {/* ——— Resultados: filtros a la izquierda, la grilla a la derecha ——— */}
      <section id="resultados" style={{ marginTop: 44, scrollMarginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <h2 style={{ ...tituloSeccion, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0,
                background: tema.fondoBarra,
                color: tema.texto,
                padding: '6px 12px',
                borderRadius: 5,
              }}
            >
              {tema.nombre}
            </span>
            <span>
              {seccion === 'trabajos' ? 'Trabajos cerca tuyo' : 'Trabajadores'}
              <span style={{ color: COLORS.inkSoft, fontWeight: 500 }}>
                {' '}
                · {seccion === 'trabajos' ? filtrados.length : trabajadoresFiltrados.length}
              </span>
            </span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr)', gap: 28, alignItems: 'start' }}>
          {/* Filtros, y debajo un espacio de publicidad */}
          <div>
          <aside>
            {seccion === 'trabajos' && (
              <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${COLORS.line}` }}>
                <InterruptorHabilidades activo={soloMios} onChange={setSoloMios} sinRubros={misCategorias.length === 0} />
              </div>
            )}
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
        borderRadius: 12,
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
            borderRadius: 8,
            background: tag.fondo,
            color: tag.texto,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {iconoParaCategoria(cat)}
        </span>
        <span style={{ fontSize: 13, color: COLORS.inkSoft, fontWeight: 500 }}>{p.fecha_creacion ? haceCuanto(p.fecha_creacion) : ''}</span>
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ display: 'inline-block', fontSize: 13, color: tag.texto, background: tag.fondo, padding: '4px 9px', borderRadius: 6 }}>
          {cat}
        </span>
        <p
          style={{
            fontSize: 17.5,
            fontWeight: 700,
            lineHeight: 1.3,
            margin: '10px 0 0',
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
        <span style={{ fontSize: 14, color: COLORS.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {quien ?? ''}
        </span>
        {precio && (
          <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 400, background: COLORS.blueTint, color: COLORS.blueDark, padding: '5px 10px', borderRadius: 6 }}>
            {precio}
          </span>
        )}
      </div>
    </a>
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
        borderRadius: 6,
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
    <div style={{ background: COLORS.card, border: `2px dashed ${COLORS.line}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
      <p style={{ color: COLORS.inkSoft, fontSize: 15, margin: 0 }}>{texto}</p>
    </div>
  )
}
