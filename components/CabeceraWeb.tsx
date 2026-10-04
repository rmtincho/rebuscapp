'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import { useMensajesSinLeer, useNotificacionesSinLeer } from '@/lib/useContadores'
import EnlaceConCarga from '@/components/EnlaceConCarga'
import { LEGAL } from '@/lib/legal'

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
                  borderRadius: 8,
                  fontSize: 14.5,
                  fontWeight: 500,
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

        <EnlaceConCarga
          href="/publicar"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            borderRadius: 8,
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
        </EnlaceConCarga>
      </div>
    </header>
  )
}
