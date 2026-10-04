'use client'

import { useRef, useState } from 'react'
import { COLORS } from '@/lib/theme'
import { CATEGORIAS_DESTACADAS } from '@/lib/categoriasDestacadas'
import PedidosList from '@/components/PedidosList'
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
}: {
  pedidos: any[]
  trabajadores: Trabajador[]
  anunciosLista?: AnuncioElegible[]
  semilla?: number
  // Rubros del perfil de trabajador, para el filtro rápido
  misCategorias?: string[]
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

      {/* Título de la sección */}
      <div style={{ padding: '8px 20px 12px' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, letterSpacing: '-0.02em', margin: 0 }}>
          {seccion === 'trabajos' ? 'Trabajos cerca tuyo' : 'Trabajadores'}
          <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> · {cantidad}</span>
        </p>
      </div>

      {/* Filtros: sueltos sobre el fondo, sin recuadro, para que no se
          confundan con las tarjetas de trabajo de abajo */}
      <div style={{ padding: '0 0 14px' }}>
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

          {seccion === 'trabajos' && (
            <div style={{ padding: '12px 20px 0' }}>
              <InterruptorHabilidades activo={soloMios} onChange={setSoloMios} sinRubros={misCategorias.length === 0} />
            </div>
          )}
        </div>
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
    </div>
  )
}
