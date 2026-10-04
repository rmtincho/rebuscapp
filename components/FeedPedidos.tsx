'use client'

import { useRef, useState } from 'react'
import { COLORS } from '@/lib/theme'
import { CATEGORIAS_DESTACADAS } from '@/lib/categoriasDestacadas'
import PedidosList, { type Ubicacion } from '@/components/PedidosList'
import TrabajadoresList, { type Trabajador } from '@/components/TrabajadoresList'
import BannerPublicidad from '@/components/BannerPublicidad'
import InterruptorHabilidades from '@/components/InterruptorHabilidades'
import { elegirAnuncio, type AnuncioElegible } from '@/lib/elegirAnuncio'
import { useModoOpcional } from '@/components/ModoContext'

type Seccion = 'trabajos' | 'trabajadores'

export default function FeedPedidos({
  pedidos,
  trabajadores,
  anunciosLista = [],
  semilla = 0,
  misCategorias = [],
  nombresRubro = {},
}: {
  pedidos: any[]
  trabajadores: Trabajador[]
  anunciosLista?: AnuncioElegible[]
  semilla?: number
  // Rubros del perfil de trabajador, para el filtro rápido
  misCategorias?: string[]
  // slug → nombre de cada rubro, para el "Rubro › Categoría" de las tarjetas
  nombresRubro?: Record<string, string>
}) {
  // Dentro del inicio con modo, solo la sección de ese modo y sin las pestañas
  const modoInicio = useModoOpcional()
  const seccionFija: Seccion | undefined = modoInicio ? (modoInicio === 'busco' ? 'trabajos' : 'trabajadores') : undefined
  const [seccionElegida, setSeccion] = useState<Seccion>('trabajos')
  const seccion = seccionFija ?? seccionElegida
  // null = "Todas"
  const [grupo, setGrupo] = useState<string | null>(null)
  const filaPillsRef = useRef<HTMLDivElement>(null)

  // "Coinciden con mis habilidades": trabajos de mis rubros cuyos requisitos cumplo
  const [soloMios, setSoloMios] = useState(false)

  // Orden: recientes o cercanos (para cercanos hace falta la ubicación)
  const [orden, setOrden] = useState<'recientes' | 'cercanos'>('recientes')
  const [miUbicacion, setMiUbicacion] = useState<Ubicacion | null>(null)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)
  const [errorUbicacion, setErrorUbicacion] = useState(false)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const filtrosActivos = (orden === 'cercanos' ? 1 : 0) + (soloMios ? 1 : 0)

  function elegirCercanos() {
    setErrorUbicacion(false)
    if (miUbicacion) {
      setOrden('cercanos')
      return
    }
    if (!navigator.geolocation) {
      setErrorUbicacion(true)
      return
    }
    setBuscandoUbicacion(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMiUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setOrden('cercanos')
        setBuscandoUbicacion(false)
      },
      () => {
        setBuscandoUbicacion(false)
        setErrorUbicacion(true)
      }
    )
  }
  const pedidosFiltrados = pedidos.filter(
    (p) =>
      (!grupo || p.categorias?.grupo_slug === grupo) &&
      (!soloMios || (misCategorias.includes(p.categoria_slug) && p.cumple_requisitos !== false))
  )
  const trabajadoresFiltrados = grupo
    ? trabajadores.filter((t) => t.categorias.some((c) => c.grupoSlug === grupo))
    : trabajadores

  const labelGrupo = CATEGORIAS_DESTACADAS.find((c) => c.slug === grupo)?.label

  // Tarjeta "Patrocinado" en la lista: del rubro filtrado si hay, si no general
  const patrocinado = elegirAnuncio(anunciosLista, grupo, semilla)

  const segmentoBase: React.CSSProperties = {
    flex: 1,
    padding: '11px 10px',
    borderRadius: 100,
    fontWeight: 500,
    fontSize: 13.5,
    border: 'none',
    cursor: 'pointer',
  }

  const pill = (activa: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 100,
    fontSize: 12.5,
    fontWeight: 500,
    border: `1px solid ${activa ? COLORS.dark : COLORS.line}`,
    background: activa ? COLORS.dark : COLORS.card,
    color: activa ? COLORS.onDark : COLORS.ink,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    flexShrink: 0,
  })

  const vacio = (texto: string) => (
    <div
      style={{
        background: COLORS.card,
        border: `2px dashed ${COLORS.line}`,
        borderRadius: 22,
        padding: 28,
        textAlign: 'center',
      }}
    >
      <p style={{ color: COLORS.inkSoft, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{texto}</p>
    </div>
  )

  const cantidad = seccion === 'trabajos' ? pedidosFiltrados.length : trabajadoresFiltrados.length

  return (
    <div id="trabajos" style={{ scrollMarginTop: 16 }}>
      {/* Trabajos | Trabajadores */}
      <div style={{ padding: '8px 20px 12px' }} hidden={!!seccionFija}>
        <div
          role="tablist"
          style={{ display: 'flex', background: COLORS.card, boxShadow: COLORS.cardShadow, borderRadius: 100, padding: 4 }}
        >
          {(['trabajos', 'trabajadores'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={seccion === s}
              onClick={() => {
                // Al cambiar de pestaña el filtro vuelve a "Todas", y la
                // fila de pills al principio para que se vea
                setSeccion(s)
                setGrupo(null)
                filaPillsRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
              }}
              style={{
                ...segmentoBase,
                background: seccion === s ? COLORS.dark : 'transparent',
                color: seccion === s ? COLORS.onDark : COLORS.inkSoft,
              }}
            >
              {s === 'trabajos' ? 'Trabajos' : 'Trabajadores'}
            </button>
          ))}
        </div>
      </div>

      {/* Rubros arriba de todo: sueltos sobre el fondo, sin recuadro, para
          que no se confundan con las tarjetas de trabajo */}
      <div style={{ padding: '4px 0 8px' }}>
        <div>
          <p style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkSoft, margin: '0 20px 8px' }}>
            Filtrar por rubro
          </p>
          <div
            ref={filaPillsRef}
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '0 20px 2px',
              scrollbarWidth: 'none',
            }}
          >
            <button type="button" style={pill(grupo === null)} onClick={() => setGrupo(null)}>
              Todas
            </button>
            {CATEGORIAS_DESTACADAS.map((c) => (
              <button
                key={c.slug}
                type="button"
                style={pill(grupo === c.slug)}
                onClick={() => setGrupo(grupo === c.slug ? null : c.slug)}
              >
                {c.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Título de la sección y, en Trabajos, el botón de Filtros */}
      <div style={{ padding: '8px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, letterSpacing: '-0.02em', margin: 0 }}>
          {seccion === 'trabajos' ? 'Trabajos cerca tuyo' : 'Trabajadores'}
          <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> · {cantidad}</span>
        </p>
        {seccion === 'trabajos' && (
          <button
            type="button"
            onClick={() => setPanelAbierto(true)}
            aria-haspopup="dialog"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1.5px solid ${filtrosActivos > 0 ? COLORS.dark : COLORS.line}`,
              background: filtrosActivos > 0 ? COLORS.dark : COLORS.card,
              color: filtrosActivos > 0 ? COLORS.onDark : COLORS.ink,
              fontSize: 13,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="10" cy="12" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
            Filtros
            {filtrosActivos > 0 && (
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 100,
                  background: COLORS.clay,
                  color: COLORS.onClay,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {filtrosActivos}
              </span>
            )}
          </button>
        )}
      </div>

      {seccion === 'trabajos' ? (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ minWidth: 0 }}>
            {pedidosFiltrados.length === 0 &&
              vacio(
                soloMios
                  ? 'No hay trabajos de tus rubros por ahora. Probá sacar el filtro o sumar rubros en tu perfil.'
                  : grupo
                  ? `No hay trabajos de ${labelGrupo} por ahora.`
                  : 'Todavía no hay trabajos publicados. Sé el primero.'
              )}
            {pedidosFiltrados.length > 0 && (
              <PedidosList
                pedidos={pedidosFiltrados as any}
                cercaDe={orden === 'cercanos' ? miUbicacion : null}
                nombresRubro={nombresRubro}
                patrocinado={
                  patrocinado ? <BannerPublicidad anuncio={patrocinado} formato="movil" /> : undefined
                }
              />
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 20px 20px' }}>
          {grupo && trabajadores.length > 0 && trabajadoresFiltrados.length === 0
            ? vacio(`Nadie de ${labelGrupo} en el listado por ahora.`)
            : <TrabajadoresList trabajadores={trabajadoresFiltrados} />}
        </div>
      )}

      {/* Panel de Filtros: sube desde abajo */}
      {panelAbierto && (
        <div
          role="presentation"
          onClick={() => setPanelAbierto(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(28, 28, 30, 0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            role="dialog"
            aria-label="Filtros"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: COLORS.paper,
              borderRadius: '16px 16px 0 0',
              padding: '18px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Filtros</p>
              {filtrosActivos > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOrden('recientes')
                    setSoloMios(false)
                  }}
                  style={{ border: 'none', background: 'none', padding: 0, fontSize: 13.5, color: COLORS.clayDark, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Limpiar
                </button>
              )}
            </div>

            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>Ordenar por</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(
                [
                  ['recientes', 'Más recientes'],
                  ['cercanos', buscandoUbicacion ? 'Buscando…' : 'Más cercanos'],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={orden === v}
                  onClick={() => (v === 'cercanos' ? elegirCercanos() : setOrden('recientes'))}
                  style={{
                    padding: '11px 8px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: `1.5px solid ${orden === v ? COLORS.dark : COLORS.line}`,
                    background: orden === v ? COLORS.dark : COLORS.card,
                    color: orden === v ? COLORS.onDark : COLORS.ink,
                    cursor: 'pointer',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            {errorUbicacion && (
              <p style={{ fontSize: 12.5, color: COLORS.redDark, margin: '8px 0 0', lineHeight: 1.4 }}>
                No pudimos saber dónde estás. Revisá que el navegador tenga permiso de ubicación.
              </p>
            )}

            <div style={{ borderTop: `1px solid ${COLORS.line}`, margin: '18px 0', paddingTop: 18 }}>
              <InterruptorHabilidades activo={soloMios} onChange={setSoloMios} sinRubros={misCategorias.length === 0} />
            </div>

            <button
              type="button"
              onClick={() => setPanelAbierto(false)}
              style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700, borderRadius: 10, border: 'none', background: COLORS.clay, color: COLORS.onClay, cursor: 'pointer' }}
            >
              Ver {pedidosFiltrados.length} trabajo{pedidosFiltrados.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
