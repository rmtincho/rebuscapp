// Motivos de denuncia: los usa el formulario (DenunciarBloquear) y el
// panel de admin. Los valores tienen que coincidir con el check de la
// tabla denuncias (scripts/sql/2026-09-29-denuncias-bloqueos.sql).

export const MOTIVOS_DENUNCIA = [
  { valor: 'estafa', label: 'Estafa o me pidió plata por adelantado' },
  { valor: 'acoso', label: 'Acoso, insultos o discriminación' },
  { valor: 'falso', label: 'Perfil o trabajo falso' },
  { valor: 'ilegal', label: 'Trabajo ilegal o peligroso' },
  { valor: 'otro', label: 'Otro motivo' },
] as const

export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number]['valor']

export function etiquetaMotivo(valor: string): string {
  return MOTIVOS_DENUNCIA.find((m) => m.valor === valor)?.label ?? valor
}

// Aviso a quien denunció al cerrar la denuncia. Nunca dice qué sanción
// recibió la otra persona: solo si se hizo algo o no.
export const AVISOS_DENUNCIA = [
  {
    valor: 'medidas',
    label: 'Tomamos medidas',
    cuerpo: 'Gracias por avisarnos: tomamos las medidas que correspondían. Si vuelve a pasar, denunciá de nuevo.',
  },
  {
    valor: 'sin_medidas',
    label: 'No encontramos motivos',
    cuerpo:
      'Por ahora no encontramos elementos suficientes para tomar medidas. Si vuelve a pasar o tenés más información, denunciá de nuevo. También podés bloquear a esa persona desde su perfil.',
  },
  { valor: 'no', label: 'No avisar', cuerpo: null },
] as const

export type AvisoDenuncia = (typeof AVISOS_DENUNCIA)[number]['valor']
