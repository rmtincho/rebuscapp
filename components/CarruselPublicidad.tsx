'use client'

import { useEffect, useRef, useState } from 'react'
import { COLORS } from '@/lib/theme'
import type { Anuncio } from '@/lib/anuncios'
import BannerPublicidad, { PROPORCION, useImpresion, enlaceAnuncio, textoAlternativo } from '@/components/BannerPublicidad'

// Varios anuncios en el mismo espacio: carrusel que se desliza con el dedo
// y pasa solo cada 6 segundos (se frena mientras lo tocan y no se mueve
// solo si el celular pide "reducir movimiento"). Con uno solo, es un banner.

const INTERVALO_MS = 6000

export default function CarruselPublicidad({
  anuncios,
  formato,
  style,
}: {
  anuncios: Anuncio[]
  formato: keyof typeof PROPORCION
  style?: React.CSSProperties
}) {
  const pistaRef = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(0)
  const [pausado, setPausado] = useState(false)

  // Qué placa está a la vista (al deslizar con el dedo o al pasar sola)
  function alDeslizar() {
    const pista = pistaRef.current
    if (!pista) return
    setActual(Math.round(pista.scrollLeft / pista.clientWidth))
  }

  function irA(i: number) {
    const pista = pistaRef.current
    if (!pista) return
    pista.scrollTo({ left: i * pista.clientWidth, behavior: 'smooth' })
    setActual(i)
  }

  useEffect(() => {
    if (anuncios.length < 2 || pausado) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => {
      const pista = pistaRef.current
      if (!pista) return
      const siguiente = (Math.round(pista.scrollLeft / pista.clientWidth) + 1) % anuncios.length
      pista.scrollTo({ left: siguiente * pista.clientWidth, behavior: 'smooth' })
      setActual(siguiente)
    }, INTERVALO_MS)
    return () => clearInterval(t)
  }, [anuncios.length, pausado])

  if (anuncios.length === 0) return null
  if (anuncios.length === 1) return <BannerPublicidad anuncio={anuncios[0]} formato={formato} style={style} />

  return (
    <div style={style}>
      <p
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.inkSoft,
          margin: '0 0 6px 4px',
        }}
      >
        Publicidad
      </p>
      <div
        ref={pistaRef}
        onScroll={alDeslizar}
        onPointerDown={() => setPausado(true)}
        onPointerUp={() => setPausado(false)}
        onPointerLeave={() => setPausado(false)}
        className="carrusel-pista"
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          borderRadius: 20,
          boxShadow: COLORS.cardShadow,
        }}
      >
        {anuncios.map((a) => (
          <Placa key={a.id} anuncio={a} formato={formato} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {anuncios.map((a, i) => (
          <button
            key={a.id}
            type="button"
            aria-label={`Anuncio ${i + 1} de ${anuncios.length}`}
            onClick={() => irA(i)}
            style={{
              width: i === actual ? 18 : 7,
              height: 7,
              borderRadius: 100,
              border: 'none',
              padding: 0,
              background: i === actual ? COLORS.dark : COLORS.line,
              cursor: 'pointer',
              transition: 'width 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function Placa({ anuncio, formato }: { anuncio: Anuncio; formato: keyof typeof PROPORCION }) {
  const ref = useRef<HTMLAnchorElement>(null)
  useImpresion(ref, anuncio.id)
  return (
    <a
      ref={ref}
      {...enlaceAnuncio(anuncio)}
      style={{ flex: '0 0 100%', scrollSnapAlign: 'start', aspectRatio: PROPORCION[formato], display: 'block' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen del anunciante en el storage de Supabase */}
      <img
        src={anuncio.imagen_url}
        alt={textoAlternativo(anuncio)}
        loading="lazy"
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </a>
  )
}
