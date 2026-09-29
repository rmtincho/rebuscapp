'use client'

// Contadores de los globitos rojos (mensajes y notificaciones sin leer).
// Los usan la barra de abajo (celular) y la cabecera (compu).

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { contarNotificacionesSinLeer } from '@/app/actions/notificacionesLeidas'

// Mensajes sin leer del usuario, para el globito rojo. Se vuelve a contar
// al cambiar de pantalla y cada vez que llega o se lee un mensaje.
export function useMensajesSinLeer(pathname: string) {
  const [cantidad, setCantidad] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let cancelado = false
    let canal: ReturnType<typeof supabase.channel> | null = null

    async function contar(usuarioId: string) {
      const { count } = await supabase
        .from('mensajes')
        .select('id', { count: 'exact', head: true })
        .eq('receptor_id', usuarioId)
        .eq('leido', false)
      if (!cancelado) setCantidad(count ?? 0)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const usuarioId = session?.user.id
      if (!usuarioId || cancelado) return
      contar(usuarioId)
      canal = supabase
        // Nombre único: la cabecera y la barra de abajo escuchan a la vez
        .channel(`sin-leer-${usuarioId}-${Math.random().toString(36).slice(2)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mensajes', filter: `receptor_id=eq.${usuarioId}` },
          () => contar(usuarioId)
        )
        .subscribe()
    })

    return () => {
      cancelado = true
      if (canal) supabase.removeChannel(canal)
    }
  }, [pathname])

  return cantidad
}

// Lo mismo para la campana. Se cuenta por el servidor; se actualiza al
// cambiar de pantalla.
export function useNotificacionesSinLeer(pathname: string) {
  const [cantidad, setCantidad] = useState(0)
  useEffect(() => {
    let cancelado = false
    contarNotificacionesSinLeer()
      .then((n) => {
        if (!cancelado) setCantidad(n)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [pathname])
  return cantidad
}
