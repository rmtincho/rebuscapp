// Modo del inicio: "busco" (busco trabajo) o "ofrezco" (necesito a alguien).
// Se guarda en una cookie para que el servidor arme el inicio ya en ese
// modo, y la próxima vez arranque en el último que se usó.

export type ModoInicio = 'busco' | 'ofrezco'
export const COOKIE_MODO = 'modo_inicio'

export function esModo(v: unknown): v is ModoInicio {
  return v === 'busco' || v === 'ofrezco'
}

// Solo en el navegador
export function guardarModo(modo: ModoInicio) {
  document.cookie = `${COOKIE_MODO}=${modo}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}
