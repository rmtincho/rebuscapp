'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { TEMA_MODO, type ModoInicio } from '@/lib/modoInicio'
import { useModo } from '@/components/ModoContext'
import { COLORS } from '@/lib/theme'
import { CATEGORIAS_DESTACADAS } from '@/lib/categoriasDestacadas'
import { iconoParaCategoria } from '@/lib/categoryIcons'
import { haceCuanto } from '@/lib/fechas'
import {
  caracteristicas,
  tieneRequisitos,
  tituloDe,
  COLOR_CARACTERISTICA,
  COLOR_CUMPLE,
  COLOR_NO_CUMPLE,
  COLOR_PRECIO,
  ESTILO_ETIQUETA,
} from '@/lib/tarjetaTrabajo'
import TrabajadoresList, { type Trabajador } from '@/components/TrabajadoresList'
import BannerPublicidad from '@/components/BannerPublicidad'
import CarruselWeb from '@/components/CarruselWeb'
import InterruptorHabilidades from '@/components/InterruptorHabilidades'
import type { Anuncio } from '@/lib/anuncios'
import { elegirAnuncio } from '@/lib/elegirAnuncio'
import { MenuWeb } from '@/components/CabeceraWeb'

// Inicio de la versión web (compu). No es el inicio del celular estirado:
// franja de bienvenida con buscador, carrusel de publicidad, tu actividad en una
// fila, y los trabajos como un sitio de avisos (filtros a la izquierda,
// los trabajos en filas a la derecha). En el celular se usa el inicio de siempre.

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
  // 'changa' (puntual), 'fulltime' o 'parttime'
  jornada?: string | null
  edad_minima?: number | null
  requisito_nivel_educativo?: string | null
  requiere_carnet_conducir?: boolean | null
  categoria_carnet_requerida?: string | null
  idioma_requerido?: string | null
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
type Publicado = 'cualquiera' | '1d' | '3d' | '1w'
type Tipo = 'todos' | 'puntual' | 'fijo'

const HORAS_PUBLICADO: Record<Exclude<Publicado, 'cualquiera'>, number> = { '1d': 24, '3d': 72, '1w': 168 }


const COLORES_ESTADO: Record<ActividadWeb['colorEstado'], { fondo: string; texto: string }> = {
  amarillo: { fondo: COLORS.clayTint, texto: COLORS.clayDark },
  verde: { fondo: COLORS.greenTint, texto: COLORS.greenDark },
  rojo: { fondo: COLORS.redTint, texto: COLORS.redDark },
  gris: { fondo: '#EDEDF2', texto: '#4B4B55' },
  azul: { fondo: COLORS.blueTint, texto: COLORS.blueDark },
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
  nombresRubro,
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
  // slug → nombre de cada rubro, para el "Rubro › Categoría" de las filas
  nombresRubro: Record<string, string>
}) {
  // Busco trabajo → trabajos; busco contratar → trabajadores y tus pedidos
  const { modo, cambiarModo: cambiarModoContexto } = useModo()
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState<string | null>(null)
  // Categoría elegida en el menú Rubros de la cabecera (dentro de un rubro)
  const [categoria, setCategoria] = useState<string | null>(null)

  // El menú Rubros lleva a /?rubro=…&categoria=…: se aplica el filtro y se
  // baja a los resultados
  const params = useSearchParams()
  const rubroUrl = params.get('rubro')
  const categoriaUrl = params.get('categoria')
  const claveUrl = `${rubroUrl ?? ''}|${categoriaUrl ?? ''}`
  const [urlAplicada, setUrlAplicada] = useState('|')
  if (claveUrl !== urlAplicada) {
    setUrlAplicada(claveUrl)
    if (rubroUrl || categoriaUrl) {
      setGrupo(rubroUrl)
      setCategoria(categoriaUrl)
    }
  }
  useEffect(() => {
    if (rubroUrl || categoriaUrl) document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })
  }, [rubroUrl, categoriaUrl])

  function elegirRubro(slug: string | null) {
    setGrupo(slug)
    setCategoria(null)
  }
  const [pago, setPago] = useState<Pago>('todos')
  const [orden, setOrden] = useState<Orden>('recientes')
  const [publicado, setPublicado] = useState<Publicado>('cualquiera')
  const [tipo, setTipo] = useState<Tipo>('todos')
  // Hora de referencia para "Fecha de publicación" (la de cuando se abrió)
  const [ahora] = useState(() => Date.now())
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
    elegirRubro(null)
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = pedidos.filter((p) => {
      if (publicado !== 'cualquiera') {
        if (!p.fecha_creacion) return false
        if (ahora - new Date(p.fecha_creacion).getTime() > HORAS_PUBLICADO[publicado] * 3_600_000) return false
      }
      if (tipo === 'puntual' && p.jornada && p.jornada !== 'changa') return false
      if (tipo === 'fijo' && (!p.jornada || p.jornada === 'changa')) return false
      if (grupo && p.categorias?.grupo_slug !== grupo) return false
      if (categoria && p.categoria_slug !== categoria) return false
      if (soloMios && (!misCategorias.includes(p.categoria_slug ?? '') || p.cumple_requisitos === false)) return false
      if (pago === 'con_monto' && !p.monto_ofrecido) return false
      if (pago === 'a_convenir' && !p.monto_a_convenir) return false
      if (q && !`${p.descripcion} ${p.categorias?.nombre ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    if (orden === 'monto') return [...lista].sort((a, b) => (b.monto_ofrecido ?? 0) - (a.monto_ofrecido ?? 0))
    return lista
  }, [pedidos, grupo, pago, orden, busqueda, soloMios, misCategorias, publicado, tipo, ahora, categoria])

  const trabajadoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return trabajadores.filter((t) => {
      if (grupo && !t.categorias.some((c) => c.grupoSlug === grupo)) return false
      if (categoria && !t.categorias.some((c) => c.slug === categoria)) return false
      if (q && !`${t.nombre} ${t.sobreMi ?? ''} ${t.categorias.map((c) => c.nombre).join(' ')}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [trabajadores, grupo, categoria, busqueda])

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
    elegirRubro(null)
    setPago('todos')
    setPublicado('cualquiera')
    setTipo('todos')
    setSoloMios(false)
  }

  // Todos los rubros en el desplegable (si no llegaron, los destacados)
  const opcionesRubro =
    Object.keys(nombresRubro).length > 0
      ? Object.entries(nombresRubro)
          .map(([valor, label]) => ({ valor, label }))
          .sort((x, y) => x.label.localeCompare(y.label, 'es'))
      : CATEGORIAS_DESTACADAS.map((c) => ({ valor: c.slug as string, label: c.label as string }))
  const nombreCategoria = categoria
    ? pedidos.find((p) => p.categoria_slug === categoria)?.categorias?.nombre ??
      trabajadores.flatMap((t) => t.categorias).find((c) => c.slug === categoria)?.nombre ??
      categoria.replace(/-/g, ' ')
    : null

  const hayFiltros = !!busqueda || !!grupo || !!categoria || pago !== 'todos' || publicado !== 'cualquiera' || tipo !== 'todos' || soloMios

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
          padding: '36px 24px 34px',
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
            className="buscador-inicio"
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

      {/* ——— Resultados: filtros a la izquierda, los trabajos en filas a la derecha ——— */}
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
              <Desplegable
                valor={grupo ?? ''}
                onChange={(v) => elegirRubro(v || null)}
                opciones={[{ valor: '', label: 'Todos los rubros' }, ...opcionesRubro]}
              />
              {categoria && (
                <button
                  type="button"
                  onClick={() => setCategoria(null)}
                  aria-label={`Quitar la categoría ${nombreCategoria}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 8,
                    padding: '5px 9px',
                    fontSize: 13,
                    border: 'none',
                    borderRadius: 6,
                    background: COLORS.clayTint,
                    color: COLORS.ink,
                    cursor: 'pointer',
                  }}
                >
                  {nombreCategoria} <span aria-hidden>✕</span>
                </button>
              )}
            </Filtro>
            {seccion === 'trabajos' && (
              <>
                <Filtro titulo="Fecha de publicación">
                  <Desplegable
                    valor={publicado}
                    onChange={(v) => setPublicado(v as Publicado)}
                    opciones={[
                      { valor: 'cualquiera', label: 'En cualquier momento' },
                      { valor: '1d', label: 'Últimas 24 horas' },
                      { valor: '3d', label: 'Últimos 3 días' },
                      { valor: '1w', label: 'Última semana' },
                    ]}
                  />
                </Filtro>
                <Filtro titulo="Tipo de trabajo">
                  <Cajas
                    valor={tipo}
                    onChange={(v) => setTipo(v as Tipo)}
                    opciones={[
                      { valor: 'todos', label: 'Todos' },
                      { valor: 'puntual', label: 'Puntual' },
                      { valor: 'fijo', label: 'Fijo' },
                    ]}
                  />
                </Filtro>
                <Filtro titulo="Pago">
                  <Cajas
                    valor={pago}
                    onChange={(v) => setPago(v as Pago)}
                    opciones={[
                      { valor: 'todos', label: 'Todos' },
                      { valor: 'con_monto', label: 'Con monto' },
                      { valor: 'a_convenir', label: 'A convenir' },
                    ]}
                  />
                </Filtro>
                <Filtro titulo="Ordenar por">
                  <Desplegable
                    valor={orden}
                    onChange={(v) => setOrden(v as Orden)}
                    opciones={[
                      { valor: 'recientes', label: 'Más recientes' },
                      { valor: 'monto', label: 'Mayor monto' },
                    ]}
                  />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtrados.map((p, i) => (
                  <Fragment key={p.id}>
                    <FilaTrabajo p={p} rubro={p.categorias?.grupo_slug ? nombresRubro[p.categorias.grupo_slug] : undefined} />
                    {patrocinado && i === posicionPatrocinado - 1 && (
                      <BannerPublicidad anuncio={patrocinado} formato="movil" style={{ maxWidth: 560, margin: '10px 0' }} />
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

// Un trabajo como fila (como un sitio de avisos), en una tarjeta blanca:
// título (la primera oración), debajo "Rubro › Categoría" y cuándo, la
// descripción y las características como etiquetas; a la
// derecha el pago y quién lo publica.
function FilaTrabajo({ p, rubro }: { p: PedidoWeb; rubro?: string }) {
  const cat = p.categorias?.nombre ?? 'Trabajo'
  const quien = p.es_comercio ? p.nombre_comercio : p.usuarios?.nombre
  const precio = p.monto_a_convenir ? 'A convenir' : p.monto_ofrecido ? `$${p.monto_ofrecido.toLocaleString('es-AR')}` : null
  const etiquetas = caracteristicas(p)
  const titulo = tituloDe(p.descripcion)
  const etiqueta = ESTILO_ETIQUETA
  return (
    <a
      href={`/pedidos/${p.id}`}
      className="fila-trabajo"
      style={{
        display: 'grid',
        gridTemplateColumns: '44px minmax(0, 1fr) 170px',
        gap: 18,
        padding: '18px 20px',
        background: COLORS.card,
        borderRadius: 8,
        boxShadow: COLORS.cardShadow,
        textDecoration: 'none',
        color: COLORS.ink,
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: COLORS.clay,
          color: COLORS.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {iconoParaCategoria(cat)}
      </span>

      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.35, margin: 0 }}>{titulo}</p>
        <p style={{ fontSize: 13.5, color: COLORS.inkSoft, margin: '3px 0 0' }}>
          {rubro && rubro !== cat && (
            <>
              {rubro}
              <span aria-hidden style={{ margin: '0 6px' }}>›</span>
            </>
          )}
          <span style={{ color: COLORS.blue }}>{cat}</span>
          {p.fecha_creacion && <span> · {haceCuanto(p.fecha_creacion)}</span>}
        </p>
        {p.descripcion && (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: '#3F3F46',
              margin: '10px 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {p.descripcion}
          </p>
        )}
        {(etiquetas.length > 0 || tieneRequisitos(p)) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
            {etiquetas.map((e) => (
              <span
                key={e.texto}
                style={{ ...etiqueta, background: COLOR_CARACTERISTICA[e.tipo].fondo, color: COLOR_CARACTERISTICA[e.tipo].texto }}
              >
                {e.texto}
              </span>
            ))}
            {tieneRequisitos(p) && p.cumple_requisitos !== undefined && (
              <span
                style={{
                  ...etiqueta,
                  background: (p.cumple_requisitos ? COLOR_CUMPLE : COLOR_NO_CUMPLE).fondo,
                  color: (p.cumple_requisitos ? COLOR_CUMPLE : COLOR_NO_CUMPLE).texto,
                }}
              >
                {p.cumple_requisitos ? '✓ Cumplís los requisitos' : 'No cumplís los requisitos'}
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, textAlign: 'right' }}>
        {precio && (
          <span style={{ ...etiqueta, fontSize: 13, background: COLOR_PRECIO.fondo, color: COLOR_PRECIO.texto, padding: '5px 9px' }}>{precio}</span>
        )}
        {quien && (
          <span style={{ fontSize: 12.5, color: COLORS.inkSoft, maxWidth: '100%', lineHeight: 1.35 }}>
            Publicado por
            <span style={{ display: 'block', fontSize: 13.5, color: COLORS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {quien}
            </span>
          </span>
        )}
      </div>
    </a>
  )
}

function Filtro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, margin: '0 0 8px' }}>{titulo}</p>
      {children}
    </div>
  )
}

// Desplegable de filtro (rubro, fecha, orden)
function Desplegable({
  valor,
  onChange,
  opciones,
}: {
  valor: string
  onChange: (v: string) => void
  opciones: { valor: string; label: string }[]
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 12px',
        fontSize: 14,
        color: COLORS.ink,
        background: COLORS.card,
        border: `1.5px solid ${COLORS.line}`,
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// Opciones en caja, una al lado de la otra (tipo de trabajo, pago)
function Cajas({
  valor,
  onChange,
  opciones,
}: {
  valor: string
  onChange: (v: string) => void
  opciones: { valor: string; label: string }[]
}) {
  return (
    <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))`, gap: 6 }}>
      {opciones.map((o) => {
        const activa = valor === o.valor
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activa}
            onClick={() => onChange(o.valor)}
            style={{
              padding: '9px 4px',
              fontSize: 13,
              borderRadius: 8,
              border: `1.5px solid ${activa ? COLORS.dark : COLORS.line}`,
              background: activa ? COLORS.dark : COLORS.card,
              color: activa ? COLORS.onDark : COLORS.ink,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div style={{ background: COLORS.card, border: `2px dashed ${COLORS.line}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
      <p style={{ color: COLORS.inkSoft, fontSize: 15, margin: 0 }}>{texto}</p>
    </div>
  )
}
