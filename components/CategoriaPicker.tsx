'use client'

import { useState, useMemo } from 'react'
import { COLORS } from '@/lib/theme'

type CategoriaT = { slug: string; nombre: string; requiere_matricula: boolean }
type Grupo = { slug: string; nombre: string; categorias: CategoriaT[] }

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function CategoriaPicker({
  grupos,
  onSeleccionar,
  onCerrar,
  multiple = false,
  seleccionadasIniciales = [],
  onConfirmarMultiple,
}: {
  grupos: Grupo[]
  onSeleccionar?: (categoria: CategoriaT, grupoNombre: string) => void
  onCerrar: () => void
  multiple?: boolean
  seleccionadasIniciales?: string[]
  onConfirmarMultiple?: (categorias: { slug: string; nombre: string; grupoNombre: string }[]) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState<Record<string, boolean>>({})
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set(seleccionadasIniciales))

  function toggleGrupo(slug: string) {
    setExpandido((prev) => ({ ...prev, [slug]: !prev[slug] }))
  }

  function toggleCategoria(cat: CategoriaT) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(cat.slug)) next.delete(cat.slug)
      else next.add(cat.slug)
      return next
    })
  }

  function confirmarMultiple() {
    if (!onConfirmarMultiple) return
    const elegidas: { slug: string; nombre: string; grupoNombre: string }[] = []
    for (const grupo of grupos) {
      for (const cat of grupo.categorias) {
        if (seleccionadas.has(cat.slug)) elegidas.push({ slug: cat.slug, nombre: cat.nombre, grupoNombre: grupo.nombre })
      }
    }
    onConfirmarMultiple(elegidas)
  }

  const gruposFiltrados = useMemo(() => {
    if (!busqueda.trim()) return grupos
    const q = normalizar(busqueda)
    return grupos
      .map((g) => ({
        ...g,
        categorias: g.categorias.filter((c) => normalizar(c.nombre).includes(q)),
      }))
      .filter((g) => g.categorias.length > 0)
  }, [grupos, busqueda])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: COLORS.wrapperBg,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%', background: COLORS.paper, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={onCerrar}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: COLORS.card,
              border: `1px solid ${COLORS.line}`,
              color: COLORS.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: COLORS.ink, margin: 0 }}>
            {multiple ? 'Elegí tus categorías' : '¿Qué necesitás?'}
          </p>
        </div>

        <div style={{ padding: '0 20px 14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              background: COLORS.card,
              border: `1.5px solid ${COLORS.line}`,
              borderRadius: 100,
              padding: '11px 16px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.inkSoft} strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscá una categoría..."
              autoFocus
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'inherit',
                fontSize: 14,
                color: COLORS.ink,
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: `4px 20px ${multiple ? 100 : 110}px` }}>
          {gruposFiltrados.length === 0 && (
            <p style={{ textAlign: 'center', color: COLORS.inkSoft, fontSize: 14, marginTop: 40 }}>
              No encontramos nada con "{busqueda}"
            </p>
          )}

          {gruposFiltrados.map((grupo) => {
            const abierto = busqueda.trim() !== '' || !!expandido[grupo.slug]
            return (
              <div key={grupo.slug} style={{ marginBottom: 6, borderBottom: `1px solid ${COLORS.line}` }}>
                <button
                  type="button"
                  onClick={() => toggleGrupo(grupo.slug)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '12px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: 0, flex: 1 }}>{grupo.nombre}</p>
                  <span style={{ fontSize: 14, color: COLORS.ink, fontWeight: 600 }}>{grupo.categorias.length}</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={COLORS.ink}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {abierto && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 14 }}>
                    {grupo.categorias.map((cat) => {
                      const elegida = multiple && seleccionadas.has(cat.slug)
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() =>
                            multiple ? toggleCategoria(cat) : onSeleccionar?.(cat, grupo.nombre)
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            padding: '9px 14px',
                            borderRadius: 100,
                            border: `1.5px solid ${elegida ? COLORS.clay : COLORS.line}`,
                            background: elegida ? COLORS.clayTint : COLORS.card,
                            color: COLORS.ink,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {elegida && <span style={{ color: COLORS.clayDark, fontWeight: 700 }}>✓</span>}
                          {cat.nombre}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {multiple && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              padding: 16,
              background: `linear-gradient(to top, ${COLORS.paper} 60%, transparent)`,
            }}
          >
            <button
              type="button"
              onClick={confirmarMultiple}
              style={{
                maxWidth: 448,
                width: '100%',
                padding: 15,
                borderRadius: 100,
                border: 'none',
                background: COLORS.clay,
                color: COLORS.onClay,
                fontWeight: 700,
                fontSize: 14.5,
                cursor: 'pointer',
              }}
            >
              Listo {seleccionadas.size > 0 ? `(${seleccionadas.size})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}