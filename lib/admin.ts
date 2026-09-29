// Solo servidor. Quién puede entrar al panel de administración (/admin).
// ADMIN_EMAILS en las variables de entorno: mails separados por coma.
// Sin esa variable no entra nadie.

import { createClient } from '@/lib/supabase/server'

export function esEmailAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

// El usuario de la sesión si es admin; si no, null
export async function usuarioAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user && esEmailAdmin(user.email) ? user : null
}
