import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que cualquiera puede ver sin estar logueado
// /anuncio/<id> es el clic en un banner: se abre en otra pestaña (o en el
// navegador, si la app está instalada), donde puede no haber sesión
const RUTAS_PUBLICAS = ['/login', '/terminos', '/privacidad', '/bienvenida', '/anuncio/']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) =>
    request.nextUrl.pathname.startsWith(ruta)
  )

  // No logueado intentando entrar a una ruta protegida → a /login.
  // La raíz va a la landing: es lo que ve quien llega por primera vez.
  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone()
    url.pathname = request.nextUrl.pathname === '/' ? '/bienvenida' : '/login'
    return NextResponse.redirect(url)
  }

  // Ya logueado intentando entrar a /login → a la home
  // (Términos y Privacidad se ven igual, logueado o no)
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}