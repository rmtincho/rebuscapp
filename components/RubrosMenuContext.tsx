'use client'

import { createContext, useContext } from 'react'
import type { RubroMenu } from '@/app/actions/rubros'

// Los rubros del megamenú llegan con la página (los lee app/layout.tsx de
// la caché del servidor), así el menú los tiene desde el primer momento.
const RubrosMenuContext = createContext<RubroMenu[]>([])

export function RubrosMenuProvider({ rubros, children }: { rubros: RubroMenu[]; children: React.ReactNode }) {
  return <RubrosMenuContext.Provider value={rubros}>{children}</RubrosMenuContext.Provider>
}

export function useRubrosMenu() {
  return useContext(RubrosMenuContext)
}
