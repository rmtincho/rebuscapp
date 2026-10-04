// Los espacios de publicidad (ubicaciones), con dónde están y qué formato
// de imagen usan. Mismos valores que el check de la tabla anuncios
// (scripts/sql/2026-10-04-anuncios-ubicaciones.sql).

// Cada formato es una imagen distinta del anuncio, en su propia columna
export const FORMATOS_ANUNCIO = [
  { valor: 'banner', columna: 'imagen_url', campo: 'imagen_banner', label: 'Banner', medida: '1200 × 480', proporcion: '5 / 2' },
  { valor: 'lateral', columna: 'imagen_lateral_url', campo: 'imagen_lateral', label: 'Lateral', medida: '600 × 500', proporcion: '6 / 5' },
] as const

export type FormatoAnuncio = (typeof FORMATOS_ANUNCIO)[number]['valor']
export type ColumnaImagen = (typeof FORMATOS_ANUNCIO)[number]['columna']

export const ESPACIOS_ANUNCIOS = [
  { valor: 'inicio_movil', label: 'Inicio', donde: 'Carrusel en el inicio', dispositivo: 'Celular', formato: 'banner' },
  { valor: 'inicio_web', label: 'Inicio', donde: 'Carrusel debajo del buscador', dispositivo: 'Compu', formato: 'banner' },
  { valor: 'lista', label: 'Lista de trabajos', donde: '"Patrocinado" entre los trabajos', dispositivo: 'Celular y compu', formato: 'banner' },
  { valor: 'pedido', label: 'Detalle de un trabajo', donde: 'Al final de cada trabajo', dispositivo: 'Celular y compu', formato: 'banner' },
  { valor: 'notificaciones', label: 'Notificaciones', donde: 'Al final de la lista', dispositivo: 'Celular y compu', formato: 'banner' },
  { valor: 'lateral_web', label: 'Inicio, lateral', donde: 'Debajo de los filtros', dispositivo: 'Compu', formato: 'lateral' },
  { valor: 'perfil_web', label: 'Perfil de un trabajador', donde: 'Al costado del perfil', dispositivo: 'Compu', formato: 'lateral' },
] as const

export type ValorEspacio = (typeof ESPACIOS_ANUNCIOS)[number]['valor']

export function formatoDe(espacio: string) {
  const e = ESPACIOS_ANUNCIOS.find((x) => x.valor === espacio)
  return FORMATOS_ANUNCIO.find((f) => f.valor === e?.formato) ?? FORMATOS_ANUNCIO[0]
}

// Formatos de imagen que hacen falta para esas ubicaciones
export function formatosPara(espacios: readonly string[]) {
  return FORMATOS_ANUNCIO.filter((f) => espacios.some((e) => formatoDe(e).valor === f.valor))
}
