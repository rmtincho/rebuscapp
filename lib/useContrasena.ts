'use client'

// ¿Al usuario le falta crear la contraseña? Para el aviso en el menú
// (punto en "Mi perfil") y para poner "Creá tu contraseña" primero en el
// perfil. Lo responde la función tengo_contrasena() de la base
// (scripts/sql/2026-10-04-tengo-contrasena.sql); si no existe todavía o
// no hay sesión, no se avisa nada.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const EVENTO = 'rebuscapp:contrasena-creada'

// Una consulta por usuario y visita, compartida por el menú y el perfil
const consultas = new Map<string, Promise<boolean>>()

async function consultar(): Promise<boolean> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const id = session?.user.id
  if (!id) return false
  if (!consultas.has(id)) {
    consultas.set(
      id,
      Promise.resolve(supabase.rpc('tengo_contrasena'))
        .then(({ data, error }) => !error && data === false)
        .catch(() => false)
    )
  }
  return consultas.get(id)!
}

export function useSinContrasena(): boolean {
  const [sin, setSin] = useState(false)
  useEffect(() => {
    let cancelado = false
    consultar().then((v) => {
      if (!cancelado) setSin(v)
    })
    const alCrear = () => setSin(false)
    window.addEventListener(EVENTO, alCrear)
    return () => {
      cancelado = true
      window.removeEventListener(EVENTO, alCrear)
    }
  }, [])
  return sin
}

// Después de guardar la contraseña: se apagan los avisos
export function avisarContrasenaCreada() {
  consultas.clear()
  window.dispatchEvent(new Event(EVENTO))
}
