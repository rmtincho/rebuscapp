'use client'

import { useEffect, useRef } from 'react'
import { registrarImpresion } from '@/app/actions/anuncios'
import { COLORS } from '@/lib/theme'
import { LEGAL } from '@/lib/legal'
import type { Anuncio } from '@/lib/anuncios'

// Espacio de publicidad: una imagen fija dentro del contenido, con la
// etiqueta "Publicidad". Nada de popups ni cosas que tapen. Sin anuncio
// cargado, ofrece el espacio ("Anunciá tu negocio acá").

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
}: {
  anuncio: Anuncio | null
  formato: keyof typeof PROPORCION
  className?: string
  style?: React.CSSProperties
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
        Publicidad
      </p>
      {anuncio ? (
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
      ) : (
        <div
          style={{
            aspectRatio: PROPORCION[formato],
            borderRadius: 20,
            border: `2px dashed ${COLORS.line}`,
            background: COLORS.card,
            display: 'flex',
            flexDirection: formato === 'horizontal' ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: formato === 'horizontal' ? 14 : 4,
            padding: 12,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Anunciá tu negocio acá</p>
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: 0 }}>
            {LEGAL.contacto ? `Escribinos a ${LEGAL.contacto}` : 'Llegá a la gente de Comodoro que busca y ofrece trabajo'}
          </p>
        </div>
      )}
    </div>
  )
}
