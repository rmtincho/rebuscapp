'use client'

import { useEffect, useRef } from 'react'
import { registrarImpresion } from '@/app/actions/anuncios'
import { COLORS } from '@/lib/theme'
import type { Anuncio } from '@/lib/anuncios'

// Espacio de publicidad: una imagen fija dentro del contenido, sin
// etiqueta encima. Nada de popups ni cosas que tapen. Sin anuncio cargado
// no se muestra nada.

export const PROPORCION = {
  movil: '5 / 2', // 1200 x 480
  horizontal: '6 / 1', // 1200 x 200
  lateral: '6 / 5', // 600 x 500
} as const

// Impresión: cuando al menos la mitad del anuncio se ve en pantalla, una
// sola vez. Lo que está oculto (la versión de compu en el celular y al
// revés, o las otras placas de un carrusel) no se ve, así que no cuenta.
export function useImpresion(ref: React.RefObject<HTMLElement | null>, anuncioId: string | null) {
  useEffect(() => {
    const el = ref.current
    if (!anuncioId || !el) return
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          registrarImpresion(anuncioId).catch(() => {})
          obs.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, anuncioId])
}

// Link del anuncio: pasa por /anuncio/[id] para contar el clic. Página y
// WhatsApp abren en otra pestaña; una llamada, no.
export function enlaceAnuncio(anuncio: Anuncio) {
  if (!anuncio.con_enlace) return {}
  return {
    href: `/anuncio/${anuncio.id}`,
    target: anuncio.nueva_pestana ? '_blank' : undefined,
    rel: 'sponsored noopener',
  }
}

export function textoAlternativo(anuncio: Anuncio) {
  return anuncio.texto_alternativo ?? (anuncio.anunciante ? `Publicidad de ${anuncio.anunciante}` : 'Publicidad')
}

export default function BannerPublicidad({
  anuncio,
  formato,
  className,
  style,
}: {
  anuncio: Anuncio | null
  formato: keyof typeof PROPORCION
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useImpresion(ref, anuncio?.id ?? null)

  if (!anuncio) return null

  return (
    <div ref={ref} className={className} style={style}>
      <a
        {...enlaceAnuncio(anuncio)}
        style={{ display: 'block', borderRadius: 20, overflow: 'hidden', boxShadow: COLORS.cardShadow, aspectRatio: PROPORCION[formato] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- imagen del anunciante en el storage de Supabase */}
        <img
          src={anuncio.imagen_url}
          alt={textoAlternativo(anuncio)}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </a>
    </div>
  )
}
