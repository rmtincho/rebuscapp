import { COLORS } from '@/lib/theme'

// Lo que comparten las tarjetas de trabajo del celular (PedidosList) y de
// la web (InicioWeb): el título, las etiquetas de características con sus
// colores y el color del ícono según la categoría.

export type DatosTrabajo = {
  es_comercio: boolean
  jornada?: string | null
  edad_minima?: number | null
  requisito_nivel_educativo?: string | null
  requiere_carnet_conducir?: boolean | null
  categoria_carnet_requerida?: string | null
  idioma_requerido?: string | null
}

// Etiquetas: Inter en mayúsculas, peso 600
export const ESTILO_ETIQUETA: React.CSSProperties = {
  fontFamily: 'var(--font-inter), sans-serif',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0,
  padding: '4px 8px',
  borderRadius: 5,
  whiteSpace: 'nowrap',
}

// Color del ícono de la categoría (siempre el mismo para el mismo nombre)
const TAGS = [
  { fondo: COLORS.tagBlue, texto: COLORS.tagBlueText },
  { fondo: COLORS.tagPink, texto: COLORS.tagPinkText },
  { fondo: COLORS.tagOrange, texto: COLORS.tagOrangeText },
]

export function tagDe(nombre: string) {
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TAGS[h % TAGS.length]
}

const JORNADA: Record<string, string> = { changa: 'Trabajo puntual', fulltime: 'Full time', parttime: 'Part time' }

const NIVEL: Record<string, string> = {
  primario: 'Primario completo',
  secundario: 'Secundario completo',
  terciario: 'Terciario',
  universitario: 'Universitario',
  posgrado: 'Posgrado',
}

// Características del trabajo para las etiquetas de cada fila
// Cada tipo de dato con su color: tipo de trabajo en naranja, comercio en
// rosa y requisitos en amarillo (verde y rojo quedan para "cumplís / no")
// Colores llenos y vivos. Texto oscuro sobre el amarillo y blanco sobre
// el resto, para que se lean
export const COLOR_CARACTERISTICA = {
  jornada: { fondo: '#FF6600', texto: '#FFFFFF' },
  comercio: { fondo: '#E6195E', texto: '#FFFFFF' },
  requisito: { fondo: '#FFD000', texto: '#1C1C1E' },
}
export const COLOR_CUMPLE = { fondo: '#12873C', texto: '#FFFFFF' }
export const COLOR_NO_CUMPLE = { fondo: '#D92D20', texto: '#FFFFFF' }
export const COLOR_PRECIO = { fondo: '#2563EB', texto: '#FFFFFF' }

export function caracteristicas(p: DatosTrabajo): { texto: string; tipo: keyof typeof COLOR_CARACTERISTICA }[] {
  const lista: ({ texto: string | null | undefined; tipo: keyof typeof COLOR_CARACTERISTICA })[] = [
    { texto: p.jornada ? JORNADA[p.jornada] : null, tipo: 'jornada' },
    { texto: p.es_comercio ? 'Comercio' : null, tipo: 'comercio' },
    { texto: p.edad_minima ? `Desde ${p.edad_minima} años` : null, tipo: 'requisito' },
    { texto: p.requisito_nivel_educativo ? NIVEL[p.requisito_nivel_educativo] ?? p.requisito_nivel_educativo : null, tipo: 'requisito' },
    {
      texto: p.requiere_carnet_conducir ? (p.categoria_carnet_requerida ? `Carnet ${p.categoria_carnet_requerida}` : 'Con carnet') : null,
      tipo: 'requisito',
    },
    { texto: p.idioma_requerido, tipo: 'requisito' },
  ]
  return lista.filter((c): c is { texto: string; tipo: keyof typeof COLOR_CARACTERISTICA } => !!c.texto)
}

// Los trabajos no tienen título: se usa la primera oración de la
// descripción, cortada en una palabra si es larga. Debajo va siempre la
// descripción completa, así nunca queda una tarjeta sin el detalle.
export function tituloDe(descripcion: string): string {
  const texto = descripcion.trim().replace(/\s+/g, ' ')
  const corte = texto.search(/[.!?](\s|$)/)
  let oracion = corte >= 0 ? texto.slice(0, corte) : texto
  if (oracion.length > 80) {
    const espacio = oracion.lastIndexOf(' ', 76)
    oracion = `${oracion.slice(0, espacio > 30 ? espacio : 76).replace(/[,;:\s]+$/, '')}…`
  }
  // Con mayúscula inicial, aunque la descripción arranque en minúscula
  return oracion.charAt(0).toUpperCase() + oracion.slice(1)
}

export function tieneRequisitos(p: DatosTrabajo) {
  return !!(p.edad_minima || p.requisito_nivel_educativo || p.requiere_carnet_conducir || p.idioma_requerido)
}
