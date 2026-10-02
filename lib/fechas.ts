// Formato de fechas y horas para toda la app.
//
// Siempre con zona horaria fija: el servidor (Vercel) corre en UTC y el
// navegador en hora local; sin fijarla, una misma hora se renderiza
// distinto en cada lado (3 h de diferencia y error de hidratación).
// Hora en 24 h ("19:40"): evita el "p. m.", que Node y los navegadores
// escriben con espacios distintos.
const ZONA = 'America/Argentina/Buenos_Aires'

const formatoHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const formatoFechaCorta = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA,
  day: 'numeric',
  month: 'short',
})

/** "19:40" */
export function formatearHora(fecha: string | Date): string {
  return formatoHora.format(new Date(fecha))
}

/** "28 sept" */
export function formatearFechaCorta(fecha: string | Date): string {
  return formatoFechaCorta.format(new Date(fecha))
}

/** "hoy a las 19:40", "mañana a las 08:15" o "2 oct a las 10:00" */
export function formatearCuando(fecha: string | Date): string {
  const d = new Date(fecha)
  const dia = (x: Date) => formatoFechaCorta.format(x)
  const hoy = new Date()
  const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
  const prefijo = dia(d) === dia(hoy) ? 'hoy' : dia(d) === dia(manana) ? 'mañana' : dia(d)
  return `${prefijo} a las ${formatearHora(d)}`
}

/** "Recién", "Hace 3 h", "Ayer", "Hace 4 días" o, pasada una semana, "28 sept" */
export function haceCuanto(fecha: string | Date): string {
  const d = new Date(fecha)
  const horas = Math.floor((Date.now() - d.getTime()) / 3_600_000)
  if (horas < 1) return 'Recién'
  if (horas < 24) return `Hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  return formatearFechaCorta(d)
}
