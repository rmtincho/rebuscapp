// Tarifa del trabajador por cada categoría que eligió (opcional) y sueldo
// pretendido para un puesto fijo. Se cargan en el perfil y se ven en el
// perfil público.

export const UNIDADES_TARIFA = [
  { valor: 'hora', label: 'por hora' },
  { valor: 'jornada', label: 'por jornada' },
  { valor: 'trabajo', label: 'por trabajo' },
]

const pesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

export function formatearTarifa(monto: number | null | undefined, unidad: string | null | undefined): string | null {
  if (!monto) return null
  const label = UNIDADES_TARIFA.find((u) => u.valor === unidad)?.label ?? 'por hora'
  return `$${pesos.format(monto)} ${label}`
}

export function formatearSueldo(monto: number | null | undefined): string | null {
  return monto ? `$${pesos.format(monto)} por mes` : null
}
