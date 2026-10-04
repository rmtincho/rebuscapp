'use client'

import { createContext, useContext, useState } from 'react'
import { guardarModo, type ModoInicio } from '@/lib/modoInicio'

// Modo del inicio en el navegador. El servidor manda los datos de los dos
// modos y el modo inicial (cookie); cambiar de modo es solo estado local,
// sin volver a pedirle el inicio al servidor (antes era un router.refresh()
// que rehacía todas las consultas y tardaba).
const ModoContext = createContext<{ modo: ModoInicio; cambiarModo: (m: ModoInicio) => void } | null>(null)

export function ModoProvider({ inicial, children }: { inicial: ModoInicio; children: React.ReactNode }) {
  const [modo, setModo] = useState<ModoInicio>(inicial)

  function cambiarModo(m: ModoInicio) {
    if (m === modo) return
    guardarModo(m)
    setModo(m)
  }

  return <ModoContext.Provider value={{ modo, cambiarModo }}>{children}</ModoContext.Provider>
}

export function useModo() {
  const ctx = useContext(ModoContext)
  if (!ctx) throw new Error('useModo va dentro de <ModoProvider>')
  return ctx
}

// Para componentes que también pueden ir fuera del inicio
export function useModoOpcional(): ModoInicio | null {
  return useContext(ModoContext)?.modo ?? null
}

// Muestra lo de adentro solo en ese modo (para partes armadas en el servidor)
export function SoloModo({ modo, children }: { modo: ModoInicio; children: React.ReactNode }) {
  return useModo().modo === modo ? <>{children}</> : null
}
