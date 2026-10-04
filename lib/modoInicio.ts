// Modo del inicio: "busco" (busco trabajo) o "ofrezco" (busco contratar).
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

// Cada modo tiene su color, para que se note en qué lado estás sin leer
// nada: "busco" en el amarillo de la marca, "ofrezco" en oscuro con
// detalles amarillos. Son los dos colores de la marca: verde, rojo, azul y
// rosa ya significan otra cosa (lib/theme.ts).
export const TEMA_MODO = {
  busco: {
    nombre: 'Busco trabajo',
    fondo: 'linear-gradient(180deg, #FFCC2E 0%, #FFC21A 100%)',
    fondoBarra: '#FFC21A',
    texto: '#1C1C1E',
    textoSuave: 'rgba(28, 28, 30, 0.7)',
    superficie: 'rgba(255, 255, 255, 0.5)',
    activo: '#1C1C1E',
    sobreActivo: '#FFFFFF',
  },
  ofrezco: {
    nombre: 'Busco contratar',
    fondo: 'linear-gradient(180deg, #3A3A40 0%, #1C1C1E 100%)',
    fondoBarra: '#1C1C1E',
    texto: '#FFFFFF',
    // Sobre el oscuro, todo el texto en blanco (el gris se leía poco)
    textoSuave: '#FFFFFF',
    superficie: 'rgba(255, 255, 255, 0.12)',
    activo: '#FFC21A',
    sobreActivo: '#1C1C1E',
  },
} as const
