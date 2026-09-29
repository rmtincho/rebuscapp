'use client'

import { useEffect, useRef } from 'react'
import { registrarImpresion } from '@/app/actions/anuncios'
import { COLORS } from '@/lib/theme'
import type { Anuncio } from '@/lib/anuncios'

// Espacio de publicidad: una imagen fija dentro del contenido, con la
// etiqueta "Publicidad" (o "Patrocinado" dentro de las listas). Nada de
// popups ni cosas que tapen. Sin anuncio cargado no se muestra nada.

const PROPORCION = {
  movil: '3 / 1', // 1080 x 360
  horizontal: '6 / 1', // 1200 x 200
  lateral: '6 / 5', // 600 x 500
} as const

export default function BannerPublicidad({
  anuncio,
  formato,
  className,
  style,
  etiqueta = 'Publicidad',
}: {
  anuncio: Anuncio | null
  formato: keyof typeof PROPORCION
  className?: string
  style?: React.CSSProperties
  etiqueta?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Impresión: cuando al menos la mitad del banner se ve en pantalla, una
  // sola vez. Los espacios ocultos (la versión de compu en el celular y al
  // revés) nunca se ven, así que no cuentan.
  useEffect(() => {
    const el = ref.current
    if (!anuncio || !el) return
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          registrarImpresion(anuncio.id).catch(() => {})
          obs.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [anuncio])

  if (!anuncio) return null

  return (
    <div ref={ref} className={className} style={style}>
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
        {etiqueta}
      </p>
      <a
        href={`/anuncio/${anuncio.id}`}
        target="_blank"
        rel="sponsored noopener"
        style={{ display: 'block', borderRadius: 20, overflow: 'hidden', boxShadow: COLORS.cardShadow, aspectRatio: PROPORCION[formato] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- imagen del anunciante en el storage de Supabase */}
        <img
          src={anuncio.imagen_url}
          alt={anuncio.texto_alternativo ?? `Publicidad de ${anuncio.anunciante}`}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </a>
    </div>
  )
}
