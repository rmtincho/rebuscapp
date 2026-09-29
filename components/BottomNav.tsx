'use client'

import { usePathname } from 'next/navigation'
import { COLORS } from '@/lib/theme'

// Nav flotante: dos cápsulas negras con íconos y, en el medio, el botón
// amarillo de "Publicar". Sin textos debajo de los íconos (cada uno
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
  },
  {
    href: '/mis-postulaciones',
    label: 'Postulaciones',
    icon: (activo) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
]

const DERECHA: Tab[] = [
  {
    href: '/perfil/prestador',
    label: 'Mi perfil',
    icon: (activo) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </svg>
    ),
  },
]

function Capsula({ tabs, pathname }: { tabs: Tab[]; pathname: string }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        background: COLORS.navBg,
        borderRadius: 100,
        padding: 6,
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
              width: 46,
              height: 46,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activo ? COLORS.dark : 'rgba(255,255,255,0.6)',
              background: activo ? COLORS.card : 'transparent',
            }}
          >
            {tab.icon(activo)}
          </a>
        )
      })}
    </div>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const publicarActivo = pathname.startsWith('/publicar')

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 18,
        left: 0,
        right: 0,
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        padding: '0 20px',
      }}
    >
      <Capsula tabs={IZQUIERDA} pathname={pathname} />

      <a
        href="/publicar"
        aria-label="Publicar un trabajo"
        aria-current={publicarActivo ? 'page' : undefined}
        style={{
          width: 58,
          height: 58,
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
      </a>

      <Capsula tabs={DERECHA} pathname={pathname} />
    </div>
  )
}
