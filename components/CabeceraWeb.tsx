'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import type { ModoInicio } from '@/lib/modoInicio'
import { useMensajesSinLeer, useNotificacionesSinLeer } from '@/lib/useContadores'
import EnlaceConCarga from '@/components/EnlaceConCarga'
import { LEGAL } from '@/lib/legal'

// Cabecera de la versión web (desde 900 px): de lado a lado, con el logo,
// el menú y el botón de publicar. No queda fija: se va con el scroll.
// En el celular no se muestra: ahí está la barra de abajo (BottomNav).
// No aparece en las páginas públicas.
//
// En el inicio el menú no va acá sino adentro del hero (InicioWeb), sin
// fondo y con los colores del modo; acá queda solo la franja de anunciantes.

const RUTAS_SIN_CABECERA = ['/login', '/bienvenida', '/terminos', '/privacidad', '/completar-datos']

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/mensajes', label: 'Mensajes' },
  { href: '/notificaciones', label: 'Notificaciones' },
  { href: '/perfil', label: 'Mi perfil' },
]

// Colores del menú según sobre qué va: la cabecera blanca de siempre, o
// transparente sobre el hero amarillo ("busco") u oscuro ("ofrezco")
const ESTILOS = {
  blanco: {
    logo: '/logo-color.png',
    texto: COLORS.ink,
    textoSuave: COLORS.inkSoft,
    raya: COLORS.clay,
    boton: COLORS.clay,
    sobreBoton: COLORS.onClay,
  },
  busco: {
    logo: '/logo-negro.png',
    texto: COLORS.ink,
    textoSuave: 'rgba(28, 28, 30, 0.68)',
    raya: COLORS.ink,
    boton: COLORS.dark,
    sobreBoton: COLORS.onDark,
  },
  ofrezco: {
    logo: '/logo-color.png',
    texto: '#FFFFFF',
    textoSuave: 'rgba(255, 255, 255, 0.7)',
    raya: COLORS.clay,
    boton: COLORS.clay,
    sobreBoton: COLORS.onClay,
  },
}

export default function CabeceraWeb() {
  const pathname = usePathname()

  if (RUTAS_SIN_CABECERA.some((r) => pathname.startsWith(r))) return null

  return (
    <header className="solo-escritorio">
      {/* Franja animada para conseguir anunciantes (estilos en globals.css) */}
      {LEGAL.contacto && (
        <a href={`mailto:${LEGAL.contacto}?subject=Quiero anunciar en Rebuscapp`} className="franja-anunciar">
          <svg className="franja-anunciar-icono" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
          <span>¿Tenés un negocio? Mostralo donde la gente de Comodoro busca trabajo y trabajadores.</span>
          <b className="franja-anunciar-cta">Anunciá en Rebuscapp →</b>
        </a>
      )}
      {pathname !== '/' && (
        <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.line}` }}>
          <MenuWeb />
        </div>
      )}
    </header>
  )
}

// Logo, menú y "Publicar trabajo". Sin `sobre` es la versión blanca; con
// `sobre` va transparente encima del hero del inicio en ese modo.
export function MenuWeb({ sobre }: { sobre?: ModoInicio }) {
  const pathname = usePathname()
  const mensajes = useMensajesSinLeer(pathname)
  const notificaciones = useNotificacionesSinLeer(pathname)
  const globos: Record<string, number> = { '/mensajes': mensajes, '/notificaciones': notificaciones }
  const e = ESTILOS[sobre ?? 'blanco']

  return (
    <div
      style={{
        maxWidth: 1200,
        height: 'var(--alto-menu)',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 28,
      }}
    >
      <Link href="/" aria-label="Rebuscapp, inicio" style={{ display: 'flex', flexShrink: 0 }}>
        <Image src={e.logo} alt="Rebuscapp" width={132} height={40} priority />
      </Link>

      {/* Menú a la derecha, junto a "Publicar trabajo". El activo se marca
          con una raya al pie, no con una cápsula */}
      <nav style={{ display: 'flex', alignSelf: 'stretch', gap: 28, marginLeft: 'auto' }}>
        {LINKS.map((l) => {
          const activo = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
          const globo = globos[l.href] ?? 0
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={activo ? 'page' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '0 2px',
                borderTop: '3px solid transparent',
                borderBottom: `3px solid ${activo ? e.raya : 'transparent'}`,
                fontSize: 15,
                fontWeight: 400,
                textDecoration: 'none',
                color: activo ? e.texto : e.textoSuave,
              }}
            >
              {l.label}
              {globo > 0 && (
                <span
                  style={{
                    minWidth: 19,
                    height: 19,
                    padding: '0 6px',
                    borderRadius: 100,
                    background: COLORS.red,
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {globo > 99 ? '99+' : globo}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* En el inicio en "Busco trabajo" no va: ahí se buscan trabajos, no se publican */}
      {sobre !== 'busco' && (
      <EnlaceConCarga
        href="/publicar"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 20px',
          borderRadius: 8,
          background: e.boton,
          color: e.sobreBoton,
          fontSize: 14.5,
          fontWeight: 700,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Publicar trabajo
      </EnlaceConCarga>
      )}
    </div>
  )
}
