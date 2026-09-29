'use client'

import { useRef, useState } from 'react'
import { COLORS } from '@/lib/theme'
import { CATEGORIAS_DESTACADAS } from '@/lib/categoriasDestacadas'
import MapaPedidosWrapper from '@/components/MapaPedidosWrapper'
import PedidosList from '@/components/PedidosList'
import TrabajadoresList, { type Trabajador } from '@/components/TrabajadoresList'
import BannerPublicidad from '@/components/BannerPublicidad'
import { elegirAnuncio, type AnuncioElegible } from '@/lib/elegirAnuncio'

type Seccion = 'trabajos' | 'trabajadores'
type Vista = 'lista' | 'mapa'

export default function FeedPedidos({
  pedidos,
  trabajadores,
  centro,
  anunciosLista = [],
  semilla = 0,
}: {
  pedidos: any[]
  trabajadores: Trabajador[]
  centro: [number, number]
  anunciosLista?: AnuncioElegible[]
  semilla?: number
}) {
  const [seccion, setSeccion] = useState<Seccion>('trabajos')
  const [vista, setVista] = useState<Vista>('lista')
  // null = "Todas"
  const [grupo, setGrupo] = useState<string | null>(null)
  const filaPillsRef = useRef<HTMLDivElement>(null)
  const mostrarLista = vista === 'lista'
  const mostrarMapa = vista === 'mapa'

  const pedidosFiltrados = grupo ? pedidos.filter((p) => p.categorias?.grupo_slug === grupo) : pedidos
  const trabajadoresFiltrados = grupo
    ? trabajadores.filter((t) => t.categorias.some((c) => c.grupoSlug === grupo))
    : trabajadores

  const pedidosConUbicacion = pedidosFiltrados.filter(
    (p) => p.ubicacion_lat !== null && p.ubicacion_lng !== null
  )
  const sinUbicacion = pedidosFiltrados.length - pedidosConUbicacion.length

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

  const mapa = (
    <div style={{ marginBottom: 12 }}>
      <div style={{ borderRadius: 28, overflow: 'hidden', boxShadow: COLORS.cardShadow }}>
        <MapaPedidosWrapper pedidos={pedidosConUbicacion as any} centro={centro} />
      </div>
      {sinUbicacion > 0 && (
        <p style={{ fontSize: 12, color: COLORS.inkSoft, margin: '10px 4px 0' }}>
          {sinUbicacion} pedido{sinUbicacion > 1 ? 's' : ''} sin ubicación — visible{sinUbicacion > 1 ? 's' : ''} solo en la lista
        </p>
      )}
    </div>
  )

  return (
    <div id="trabajos" style={{ scrollMarginTop: 16 }}>
      {/* Trabajos | Trabajadores */}
      <div style={{ padding: '8px 20px 12px' }}>
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

      {/* Filtro por categoría: fila deslizable de pills */}
      <div
        ref={filaPillsRef}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '2px 20px 14px',
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

      {/* Título de la sección + botón redondo Lista/Mapa (solo en Trabajos) */}
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink, letterSpacing: '-0.01em', margin: 0 }}>
          {seccion === 'trabajos' ? 'Trabajos cerca tuyo' : 'Trabajadores'}
          <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> · {cantidad}</span>
        </p>
        {seccion === 'trabajos' && (
          <button
            type="button"
            onClick={() => setVista(vista === 'lista' ? 'mapa' : 'lista')}
            aria-label={vista === 'lista' ? 'Ver en el mapa' : 'Ver como lista'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px 8px 11px',
              borderRadius: 100,
              border: 'none',
              background: vista === 'mapa' ? COLORS.dark : COLORS.card,
              color: vista === 'mapa' ? COLORS.onDark : COLORS.ink,
              boxShadow: COLORS.cardShadow,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {vista === 'lista' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
                <path d="M8 2v16M16 6v16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            )}
            {vista === 'lista' ? 'Mapa' : 'Lista'}
          </button>
        )}
      </div>

      {seccion === 'trabajos' ? (
        // Mapa arriba (si se eligió) y lista abajo
        <div style={{ padding: '0 20px 20px' }}>
          {mostrarMapa && mapa}
          <div style={{ minWidth: 0 }}>
            {pedidosFiltrados.length === 0 &&
              vacio(
                grupo
                  ? `No hay trabajos de ${labelGrupo} por ahora.`
                  : 'Todavía no hay trabajos publicados. Sé el primero.'
              )}
            {mostrarLista && pedidosFiltrados.length > 0 && (
              <PedidosList
                pedidos={pedidosFiltrados as any}
                patrocinado={
                  patrocinado ? <BannerPublicidad anuncio={patrocinado} formato="movil" etiqueta="Patrocinado" /> : undefined
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
    </div>
  )
}
