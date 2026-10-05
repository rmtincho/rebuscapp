import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CabeceraWeb from '@/components/CabeceraWeb'
import { RubrosMenuProvider } from '@/components/RubrosMenuContext'
import { rubrosParaMenu } from '@/app/actions/rubros'

// Fuente: Helvetica LT Pro, de Adobe Fonts (proyecto web iym1qdq,
// pesos 400 y 700), para títulos y texto. Inter queda de respaldo por si
// el CSS de Adobe no carga; --font-body y --font-display se arman en globals.css.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Rubros del megamenú de la cabecera: de la caché del servidor (una hora),
  // así llegan con la página y el menú abre sin esperar
  const rubros = await rubrosParaMenu()
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href="https://use.typekit.net/iym1qdq.css" />
      </head>
      <body>
        <RubrosMenuProvider rubros={rubros}>
          <CabeceraWeb />
          {children}
        </RubrosMenuProvider>
      </body>
    </html>
  )
}