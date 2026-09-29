import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CabeceraWeb from '@/components/CabeceraWeb'

// Una sola familia (Inter, fuente variable) para títulos y texto: estética
// neutra y limpia. Las dos variables se mantienen para no tocar el CSS.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  // Dirección pública del sitio: la imagen de "compartir link" (og.png)
  // necesita URL completa. Con el dominio nuevo, definir NEXT_PUBLIC_SITE_URL.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rebuscapp.vercel.app'),
  title: 'Rebuscapp',
  description: 'Trabajos y trabajadores cerca tuyo en Comodoro Rivadavia.',
  // Sin este link el navegador no ofrece "Agregar a pantalla de inicio"
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Rebuscapp',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#FFC21A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        <CabeceraWeb />
        {children}
      </body>
    </html>
  )
}