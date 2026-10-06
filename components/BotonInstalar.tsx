'use client'

import { useEffect, useState } from 'react'
import { COLORS } from '@/lib/theme'

// Botón "Instalar la app" de la landing. Rebuscapp es una PWA:
// - Android / Chrome / Edge: el navegador avisa que se puede instalar
//   (beforeinstallprompt) y el botón abre su cartel de instalación.
// - iPhone: no hay botón posible; mostramos los pasos (Compartir → Agregar a inicio).
// - Si no hay cartel (otro navegador, o ya se rechazó), mostramos los pasos del menú.
// Si la página se abre desde la app ya instalada, va directo al login.

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

type Plataforma = 'ios' | 'android' | 'escritorio'

function detectarPlataforma(): Plataforma {
  const ua = navigator.userAgent
  // iPadOS se presenta como Mac, pero con pantalla táctil
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'escritorio'
}

export default function BotonInstalar({ variante = 'amarillo' }: { variante?: 'amarillo' | 'oscuro' }) {
  const [evento, setEvento] = useState<EventoInstalar | null>(null)
  const [instrucciones, setInstrucciones] = useState<Plataforma | null>(null)
  const [instalada, setInstalada] = useState(false)

  useEffect(() => {
    // Abierta desde la app instalada: la landing no hace falta
    if (window.matchMedia('(display-mode: standalone)').matches) {
      window.location.replace('/login')
      return
    }

    // Chrome necesita un service worker registrado para ofrecer la instalación
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})

    function alPoderInstalar(e: Event) {
      e.preventDefault()
      setEvento(e as EventoInstalar)
    }
    function alInstalar() {
      setInstalada(true)
      setEvento(null)
    }
    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  async function instalar() {
    if (evento) {
      await evento.prompt()
      const { outcome } = await evento.userChoice
      if (outcome === 'accepted') setInstalada(true)
      setEvento(null)
      return
    }
    setInstrucciones(detectarPlataforma())
  }

  const oscuro = variante === 'oscuro'

  return (
    <>
      {instalada ? (
        <a
          href="/login"
          style={{
            display: 'inline-block',
            padding: '15px 28px',
            borderRadius: 6,
            background: COLORS.green,
            color: '#FFFFFF',
            fontSize: 15.5,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ✓ Instalada: abrila desde tu pantalla de inicio
        </a>
      ) : (
        <button
          type="button"
          onClick={instalar}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '15px 28px',
            borderRadius: 6,
            border: 'none',
            background: oscuro ? COLORS.dark : COLORS.clay,
            color: oscuro ? COLORS.onDark : COLORS.onClay,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
          Instalar la app
        </button>
      )}

      {instrucciones && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cómo instalar Rebuscapp"
          onClick={() => setInstrucciones(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20000,
            background: 'rgba(28, 28, 30, 0.55)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: COLORS.card,
              borderRadius: 10,
              padding: 22,
              textAlign: 'left',
              color: COLORS.ink,
            }}
          >
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Instalá Rebuscapp</p>
            {instrucciones === 'ios' && (
              <Pasos
                pasos={[
                  <>Abrí esta página en <b>Safari</b>.</>,
                  <>Tocá el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</>,
                  <>Elegí <b>Agregar a inicio</b> y después <b>Agregar</b>.</>,
                ]}
              />
            )}
            {instrucciones === 'android' && (
              <Pasos
                pasos={[
                  <>Abrí el menú del navegador (los <b>tres puntos</b> arriba a la derecha).</>,
                  <>Tocá <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</>,
                  <>Confirmá con <b>Instalar</b>.</>,
                ]}
              />
            )}
            {instrucciones === 'escritorio' && (
              <Pasos
                pasos={[
                  <>Rebuscapp está pensada para el celular: abrí <b>{window.location.host}</b> en el navegador de tu teléfono y tocá <b>Instalar la app</b>.</>,
                  <>En la compu también podés usarla desde el navegador con <b>Entrar</b>.</>,
                ]}
              />
            )}
            <button
              type="button"
              onClick={() => setInstrucciones(null)}
              style={{
                width: '100%',
                marginTop: 16,
                padding: 13,
                borderRadius: 6,
                border: 'none',
                background: COLORS.dark,
                color: COLORS.onDark,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Pasos({ pasos }: { pasos: React.ReactNode[] }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pasos.map((paso, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, fontSize: 14.5, lineHeight: 1.45 }}>
          <span
            style={{
              flexShrink: 0,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: COLORS.clay,
              color: COLORS.onClay,
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i + 1}
          </span>
          <span>{paso}</span>
        </li>
      ))}
    </ol>
  )
}
