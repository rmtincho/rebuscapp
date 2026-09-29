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
