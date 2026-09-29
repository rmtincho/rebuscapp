// Grupos de categorías que se muestran como filtros rápidos en el inicio.
// No son todos (hay más de 20): solo los más pedidos, con nombre corto
// para que entren en una pill. El slug es el de categorias_grupo.
export const CATEGORIAS_DESTACADAS = [
  { slug: 'limpieza', label: 'Limpieza' },
  { slug: 'plomeria', label: 'Plomería' },
  { slug: 'electricidad-gas-instalaciones', label: 'Electricidad' },
  { slug: 'construccion', label: 'Construcción' },
  { slug: 'pintura', label: 'Pintura' },
  { slug: 'jardineria', label: 'Jardinería' },
  { slug: 'mudanzas', label: 'Mudanzas' },
  { slug: 'cuidado-personas', label: 'Cuidado de personas' },
  { slug: 'mascotas', label: 'Mascotas' },
  { slug: 'servicio-tecnico', label: 'Servicio técnico' },
] as const
