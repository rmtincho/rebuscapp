'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { rubrosParaMenu, type RubroMenu } from '@/app/actions/rubros'
import { iconoParaCategoria } from '@/lib/categoryIcons'
import { COLORS } from '@/lib/theme'

// "Rubros" en el menú de la cabecera web: se abre un panel grande con
// todos los rubros en columnas y sus categorías debajo. Cada uno lleva al
// inicio con ese filtro puesto (trabajos o trabajadores, según el modo).
// Los rubros se piden la primera vez que se abre y quedan guardados.

const CATEGORIAS_A_LA_VISTA = 6

let cache: Promise<RubroMenu[]> | null = null
function cargarRubros() {
  cache ??= rubrosParaMenu().catch(() => {
    cache = null
    return []
  })
  return cache
}

export function enlaceRubro(rubro: string, categoria?: string) {
  const params = new URLSearchParams({ rubro })
  if (categoria) params.set('categoria', categoria)
  return `/?${params.toString()}`
}

export default function MegaMenuRubros({
  colores,
}: {
  colores: { texto: string; textoSuave: string; raya: string }
}) {
  const [abierto, setAbierto] = useState(false)
  const [rubros, setRubros] = useState<RubroMenu[] | null>(null)
  const cierre = useRef<ReturnType<typeof setTimeout> | null>(null)

  function abrir() {
    if (cierre.current) clearTimeout(cierre.current)
    setAbierto(true)
    if (!rubros) cargarRubros().then(setRubros)
  }
  // Con un respiro, para poder pasar el mouse del botón al panel
  function cerrarPronto() {
    if (cierre.current) clearTimeout(cierre.current)
    cierre.current = setTimeout(() => setAbierto(false), 160)
  }

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto])

  return (
    <div onMouseEnter={abrir} onMouseLeave={cerrarPronto} style={{ display: 'flex', alignSelf: 'stretch' }}>
      <button
        type="button"
        aria-expanded={abierto}
        aria-haspopup="true"
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 2px',
          border: 'none',
          borderTop: '3px solid transparent',
          borderBottom: `3px solid ${abierto ? colores.raya : 'transparent'}`,
          background: 'none',
          fontSize: 13,
          color: abierto ? colores.texto : colores.textoSuave,
          cursor: 'pointer',
        }}
      >
        Rubros
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div
          role="menu"
          onMouseEnter={abrir}
          style={{
            position: 'absolute',
            top: '100%',
            left: 24,
            right: 24,
            zIndex: 50,
            background: COLORS.card,
            color: COLORS.ink,
            borderRadius: 10,
            boxShadow: '0 18px 50px rgba(28, 28, 30, 0.18)',
            padding: '24px 28px 28px',
            maxHeight: 'min(70vh, 640px)',
            overflowY: 'auto',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Rubros</p>
            <Link href="/#resultados" onClick={() => setAbierto(false)} style={{ fontSize: 14, color: COLORS.inkSoft }}>
              Ver todos →
            </Link>
          </div>

          {!rubros ? (
            <p style={{ fontSize: 14, color: COLORS.inkSoft, margin: 0 }}>Cargando rubros…</p>
          ) : rubros.length === 0 ? (
            <p style={{ fontSize: 14, color: COLORS.inkSoft, margin: 0 }}>No pudimos cargar los rubros.</p>
          ) : (
            <div style={{ columnCount: 4, columnGap: 32 }}>
              {rubros.map((r) => {
                const extra = r.categorias.length - CATEGORIAS_A_LA_VISTA
                return (
                  <div key={r.slug} style={{ breakInside: 'avoid', marginBottom: 22 }}>
                    <Link
                      href={enlaceRubro(r.slug)}
                      onClick={() => setAbierto(false)}
                      className="megamenu-rubro"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: COLORS.ink, textDecoration: 'none', marginBottom: 6 }}
                    >
                      <span style={{ display: 'flex', color: COLORS.clayDark, flexShrink: 0 }}>{iconoParaCategoria(r.nombre)}</span>
                      {r.nombre}
                    </Link>
                    <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 0 28px' }}>
                      {r.categorias.slice(0, CATEGORIAS_A_LA_VISTA).map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={enlaceRubro(r.slug, c.slug)}
                            onClick={() => setAbierto(false)}
                            className="megamenu-categoria"
                            style={{ display: 'block', padding: '3px 0', fontSize: 13, color: COLORS.inkSoft, textDecoration: 'none' }}
                          >
                            {c.nombre}
                          </Link>
                        </li>
                      ))}
                      {extra > 0 && (
                        <li>
                          <Link
                            href={enlaceRubro(r.slug)}
                            onClick={() => setAbierto(false)}
                            style={{ display: 'block', padding: '3px 0', fontSize: 12.5, color: COLORS.clayDark }}
                          >
                            y {extra} más →
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
