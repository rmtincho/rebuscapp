// Los espacios de publicidad, con dónde están y la medida de imagen
// recomendada. Mismos valores que el check de la tabla anuncios.
export const ESPACIOS_ANUNCIOS = [
  { valor: 'inicio_movil', label: 'Inicio (celular)', donde: 'Debajo de los accesos rápidos', medida: '1080 × 360', proporcion: '3 / 1' },
  { valor: 'inicio_web', label: 'Inicio (compu), franja ancha', donde: 'Entre los rubros y los trabajos', medida: '1200 × 200', proporcion: '6 / 1' },
  { valor: 'lateral_web', label: 'Inicio (compu), lateral', donde: 'Debajo de los filtros', medida: '600 × 500', proporcion: '6 / 5' },
  { valor: 'lista', label: 'Lista de trabajos (Patrocinado)', donde: 'Intercalada entre los trabajos', medida: '1080 × 360', proporcion: '3 / 1' },
  { valor: 'pedido', label: 'Detalle de un pedido', donde: 'Al final del pedido', medida: '1080 × 360', proporcion: '3 / 1' },
  { valor: 'notificaciones', label: 'Notificaciones', donde: 'Al final de la lista', medida: '1080 × 360', proporcion: '3 / 1' },
  { valor: 'perfil_web', label: 'Perfil público (compu)', donde: 'Debajo de la tarjeta amarilla', medida: '600 × 500', proporcion: '6 / 5' },
] as const

export type ValorEspacio = (typeof ESPACIOS_ANUNCIOS)[number]['valor']
