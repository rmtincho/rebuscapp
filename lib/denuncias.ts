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
