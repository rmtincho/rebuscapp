'use client'

import { useEffect, useRef, useState } from 'react'
import { registrarImpresion } from '@/app/actions/anuncios'
import { COLORS } from '@/lib/theme'
import type { Anuncio } from '@/lib/anuncios'
import { PROPORCION, enlaceAnuncio, textoAlternativo } from '@/components/BannerPublicidad'

// Carrusel de publicidad del inicio en compu, debajo del hero: el anuncio
// activo al centro con el 70% del ancho, y el anterior y el siguiente
// asomando a los costados. Pasa solo cada 6 segundos (se frena con el mouse
// encima y no se mueve solo si se pide "reducir movimiento"). Se pasa con
// las flechas de los costados, arrastrando con el mouse, con las flechas
// del teclado o tocando uno de los que asoman. Usa la imagen banner (1200 × 480), la
// misma del carrusel del celular.

const INTERVALO_MS = 6000
const ANCHO = 70 // % del ancho que ocupa el activo
const SEPARACION = 2 // % entre placas

export default function CarruselWeb({ anuncios }: { anuncios: Anuncio[] }) {
  // Con dos anuncios no alcanza para tener uno a cada lado: se repiten
  const placas = anuncios.length === 2 ? [...anuncios, ...anuncios] : anuncios
  const n = placas.length
  // El activo y el de antes: con el de antes se sabe qué placa dio la
  // vuelta de un costado al otro, que salta sin animación (si no, cruzaría
  // por el medio)
  const [{ actual, previo }, setEstado] = useState({ actual: 0, previo: 0 })
  const [pausado, setPausado] = useState(false)
  // Una impresión por anuncio en esta visita, aunque esté repetido
  const contados = useRef(new Set<string>())
  // Arrastre con el mouse: cuántos px se movió y desde dónde
  const [arrastre, setArrastre] = useState(0)
  const [arrastrando, setArrastrando] = useState(false)
  const inicio = useRef<number | null>(null)
  // Si hubo arrastre, el clic que viene al soltar no abre el anuncio
  const movido = useRef(false)

  function irA(i: number) {
    setEstado((e) => ({ actual: i, previo: e.actual }))
  }
  const siguiente = () => irA((actual + 1) % n)
  const anterior = () => irA((actual - 1 + n) % n)

  function alApretar(e: React.PointerEvent<HTMLDivElement>) {
    if (n < 2 || e.button !== 0) return
    inicio.current = e.clientX
    movido.current = false
  }
  function alMover(e: React.PointerEvent<HTMLDivElement>) {
    if (inicio.current === null) return
    const dx = e.clientX - inicio.current
    if (!movido.current && Math.abs(dx) > 5) {
      movido.current = true
      setArrastrando(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (movido.current) setArrastre(dx)
  }
  function alSoltar(e: React.PointerEvent<HTMLDivElement>) {
    if (inicio.current === null) return
    const dx = e.clientX - inicio.current
    inicio.current = null
    if (movido.current) {
      const umbral = Math.min(80, e.currentTarget.clientWidth * 0.08)
      if (dx < -umbral) siguiente()
      else if (dx > umbral) anterior()
    }
    setArrastre(0)
    setArrastrando(false)
  }

  useEffect(() => {
    if (n < 2 || pausado) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setEstado((e) => ({ actual: (e.actual + 1) % n, previo: e.actual })), INTERVALO_MS)
    return () => clearInterval(t)
  }, [n, pausado])

  if (n === 0) return null

  // Posición relativa al activo: 0 al centro, -1 y 1 a los costados
  const posicion = (i: number, activo: number) => {
    let p = (i - activo + n) % n
    if (p > n / 2) p -= n
    return p
  }

  return (
    <section
      className="solo-escritorio"
      aria-roledescription="carrusel"
      aria-label="Publicidad"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') siguiente()
        if (e.key === 'ArrowLeft') anterior()
      }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      // En pantallas muy anchas no crece más (si no, el banner sería enorme)
      style={{ marginTop: 28, maxWidth: 1600, marginLeft: 'auto', marginRight: 'auto' }}
    >
      <div
        onPointerDown={alApretar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onClickCapture={(e) => {
          if (movido.current) {
            e.preventDefault()
            e.stopPropagation()
            movido.current = false
          }
        }}
        style={{
          position: 'relative',
          overflow: 'hidden',
          cursor: n > 1 ? (arrastrando ? 'grabbing' : 'grab') : undefined,
          touchAction: 'pan-y',
          userSelect: 'none',
          // El alto lo da la placa del centro (70% del ancho, proporción 5:2)
          aspectRatio: `${5 * 100} / ${2 * ANCHO}`,
        }}
      >
        {placas.map((a, i) => {
          const p = posicion(i, actual)
          const visible = Math.abs(p) <= 1
          const salta = Math.abs(posicion(i, previo) - p) > 1
          return (
            <Placa
              key={`${a.id}-${i}`}
              anuncio={a}
              activa={p === 0}
              style={{
                position: 'absolute',
                top: 0,
                left: `${(100 - ANCHO) / 2}%`,
                width: `${ANCHO}%`,
                transform: `translateX(calc(${p * (100 + (SEPARACION * 100) / ANCHO)}% + ${arrastre}px))`,
                transition: salta || arrastrando ? 'none' : 'transform 0.5s ease, opacity 0.5s ease',
                opacity: p === 0 ? 1 : visible ? 0.55 : 0,
                pointerEvents: visible ? 'auto' : 'none',
              }}
              alTocarCostado={p !== 0 ? () => irA(i) : undefined}
              alVerse={() => {
                if (contados.current.has(a.id)) return
                contados.current.add(a.id)
                registrarImpresion(a.id).catch(() => {})
              }}
            />
          )
        })}

        {/* Flechas sobre los anuncios que asoman */}
        {n > 1 &&
          (
            [
              ['anterior', anterior, `${(100 - ANCHO) / 4}%`],
              ['siguiente', siguiente, `${100 - (100 - ANCHO) / 4}%`],
            ] as const
          ).map(([cual, accion, x]) => (
            <button
              key={cual}
              type="button"
              aria-label={cual === 'anterior' ? 'Anuncio anterior' : 'Anuncio siguiente'}
              onClick={(e) => {
                e.stopPropagation()
                accion()
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="carrusel-flecha"
              style={{
                position: 'absolute',
                top: '50%',
                left: x,
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
                width: 46,
                height: 46,
                borderRadius: '50%',
                border: 'none',
                background: COLORS.card,
                color: COLORS.ink,
                boxShadow: '0 6px 18px rgba(28, 28, 30, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d={cual === 'anterior' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
              </svg>
            </button>
          ))}
      </div>

      {anuncios.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.inkSoft, marginRight: 8 }}>
            Publicidad
          </span>
          {anuncios.map((a, i) => {
            const activo = actual % anuncios.length === i
            return (
              <button
                key={a.id}
                type="button"
                aria-label={`Anuncio ${i + 1} de ${anuncios.length}`}
                onClick={() => irA(i)}
                style={{
                  width: activo ? 18 : 7,
                  height: 7,
                  borderRadius: 100,
                  border: 'none',
                  padding: 0,
                  background: activo ? COLORS.dark : COLORS.line,
                  cursor: 'pointer',
                  transition: 'width 0.2s',
                }}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

function Placa({
  anuncio,
  activa,
  style,
  alTocarCostado,
  alVerse,
}: {
  anuncio: Anuncio
  activa: boolean
  style: React.CSSProperties
  alTocarCostado?: () => void
  alVerse: () => void
}) {
  const ref = useRef<HTMLAnchorElement>(null)

  // Impresión: cuando la placa del centro se ve al menos a la mitad
  useEffect(() => {
    const el = ref.current
    if (!activa || !el) return
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          alVerse()
          obs.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [activa, alVerse])

  return (
    <a
      ref={ref}
      {...(activa ? enlaceAnuncio(anuncio) : {})}
      onClick={
        alTocarCostado
          ? (e) => {
              e.preventDefault()
              alTocarCostado()
            }
          : undefined
      }
      aria-hidden={!activa}
      tabIndex={activa ? undefined : -1}
      draggable={false}
      style={{
        ...style,
        display: 'block',
        aspectRatio: PROPORCION.movil,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: alTocarCostado || anuncio.con_enlace ? 'pointer' : 'default',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imagen del anunciante en el storage de Supabase */}
      <img
        src={anuncio.imagen_url}
        alt={textoAlternativo(anuncio)}
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
      />
    </a>
  )
}
