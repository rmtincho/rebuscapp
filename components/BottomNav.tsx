'use client'

import { usePathname } from 'next/navigation'
import { COLORS } from '@/lib/theme'
import { useMensajesSinLeer, useNotificacionesSinLeer } from '@/lib/useContadores'
import EnlaceConCarga from '@/components/EnlaceConCarga'

// Nav flotante: Inicio y Mensajes a la izquierda, Notificaciones y Mi perfil
// a la derecha (círculos negros, uno por botón) y, en el medio, el botón amarillo de "Publicar". Sin textos debajo de los íconos (cada uno
// lleva aria-label para lectores de pantalla).

type Tab = { href: string; label: string; icon: (activo: boolean) => React.ReactNode }

const IZQUIERDA: Tab[] = [
  {
    href: '/',
    label: 'Inicio',
    icon: (activo) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },  {
    href: '/mensajes',
    label: 'Mensajes',
    icon: (activo) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </svg>
    ),
  },
]

const DERECHA: Tab[] = [
  {
    href: '/notificaciones',
    label: 'Notificaciones',
    icon: (activo) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" fill="none" />
      </svg>
    ),
  },
  {
    href: '/perfil',
    label: 'Mi perfil',
    icon: (activo) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </svg>
    ),
  },
]

function Capsula({ tabs, pathname, globos = {} }: { tabs: Tab[]; pathname: string; globos?: Record<string, number> }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        background: COLORS.navBg,
        borderRadius: 100,
        padding: 5,
        boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
      }}
    >
      {tabs.map((tab) => {
        const activo = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <a
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            aria-current={activo ? 'page' : undefined}
            style={{
              // Más chicos en pantallas angostas, para que entren los cinco
              width: 'clamp(38px, 11.5vw, 46px)',
              height: 'clamp(38px, 11.5vw, 46px)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activo ? COLORS.dark : 'rgba(255,255,255,0.6)',
              background: activo ? COLORS.card : 'transparent',
              position: 'relative',
            }}
          >
            {tab.icon(activo)}
            {(globos[tab.href] ?? 0) > 0 && (
              <span
                aria-label={`${globos[tab.href]} sin leer`}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -6,
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 100,
                  background: COLORS.red,
                  color: '#FFFFFF',
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${COLORS.navBg}`,
                }}
              >
                {globos[tab.href] > 99 ? '99+' : globos[tab.href]}
              </span>
            )}
          </a>
        )
      })}
    </div>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const publicarActivo = pathname.startsWith('/publicar')
  const mensajesSinLeer = useMensajesSinLeer(pathname)
  const notificacionesSinLeer = useNotificacionesSinLeer(pathname)
  const globos = { '/mensajes': mensajesSinLeer, '/notificaciones': notificacionesSinLeer }

  return (
    <div
      className="solo-movil"
      style={{
        position: 'fixed',
        bottom: 18,
        left: 0,
        right: 0,
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'clamp(6px, 2.5vw, 10px)',
        padding: '0 12px',
      }}
    >
      {/* Un círculo por botón */}
      {IZQUIERDA.map((tab) => (
        <Capsula key={tab.href} tabs={[tab]} pathname={pathname} globos={globos} />
      ))}

      <EnlaceConCarga
        href="/publicar"
        aria-label="Publicar un trabajo"
        aria-current={publicarActivo ? 'page' : undefined}
        style={{
          width: 'clamp(50px, 15vw, 58px)',
          height: 'clamp(50px, 15vw, 58px)',
          borderRadius: '50%',
          background: COLORS.clay,
          color: COLORS.onClay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
          flexShrink: 0,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </EnlaceConCarga>

      {DERECHA.map((tab) => (
        <Capsula key={tab.href} tabs={[tab]} pathname={pathname} globos={globos} />
      ))}
    </div>
  )
}
