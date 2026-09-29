'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import { useMensajesSinLeer, useNotificacionesSinLeer } from '@/lib/useContadores'

// Cabecera de la versión web (desde 900 px): de lado a lado, con el logo,
// el menú y el botón de publicar. En el celular no se muestra: ahí está
// la barra de abajo (BottomNav). No aparece en las páginas públicas.

const RUTAS_SIN_CABECERA = ['/login', '/bienvenida', '/terminos', '/privacidad', '/completar-datos']

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/mensajes', label: 'Mensajes' },
  { href: '/notificaciones', label: 'Notificaciones' },
  { href: '/perfil', label: 'Mi perfil' },
]

export default function CabeceraWeb() {
  const pathname = usePathname()
  const mensajes = useMensajesSinLeer(pathname)
  const notificaciones = useNotificacionesSinLeer(pathname)
  const globos: Record<string, number> = { '/mensajes': mensajes, '/notificaciones': notificaciones }

  if (RUTAS_SIN_CABECERA.some((r) => pathname.startsWith(r))) return null

  return (
    <header
      className="solo-escritorio"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        height: 'var(--alto-cabecera)',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${COLORS.line}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          height: '100%',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <Link href="/" aria-label="Rebuscapp, inicio" style={{ display: 'flex', flexShrink: 0 }}>
          <Image src="/logo-color.png" alt="Rebuscapp" width={132} height={40} priority />
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
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
                  padding: '9px 14px',
                  borderRadius: 100,
                  fontSize: 14.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: activo ? COLORS.onDark : COLORS.ink,
                  background: activo ? COLORS.dark : 'transparent',
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

        <a
          href="/publicar"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            borderRadius: 100,
            background: COLORS.clay,
            color: COLORS.onClay,
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
        </a>
      </div>
    </header>
  )
}
