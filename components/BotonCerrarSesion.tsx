'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'

export default function BotonCerrarSesion() {
  const router = useRouter()
  const supabase = createClient()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={cerrarSesion}
      style={{
        border: 'none',
        background: 'none',
        color: COLORS.inkSoft,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        textDecoration: 'underline',
      }}
    >
      Cerrar sesión
    </button>
  )
}