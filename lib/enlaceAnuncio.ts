// Qué pasa al tocar un anuncio. Se guarda todo en la columna `enlace`:
//   página    https://...
//   WhatsApp  https://wa.me/549XXXXXXXXXX?text=...
//   llamada   tel:+54XXXXXXXXXX
//   nada      vacío
// Sirve en el servidor (armar y validar) y en el panel (volver a llenar el form).

export type AccionAnuncio = 'nada' | 'web' | 'whatsapp' | 'telefono'

export type DatosAccion = { accion: AccionAnuncio; url: string; numero: string; mensaje: string }

// Número argentino como lo escribe la gente (297 15 412-3456, 0297...) →
// solo dígitos, sin el 0 del área. Si ya viene con 54, se respeta.
function digitos(numero: string) {
  return numero.replace(/\D/g, '').replace(/^0+/, '')
}

export function armarEnlace(d: DatosAccion): { enlace: string | null; error: string | null } {
  if (d.accion === 'nada') return { enlace: null, error: null }

  if (d.accion === 'web') {
    let url = d.url.trim()
    if (!url) return { enlace: null, error: 'Poné la dirección de la página.' }
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    try {
      new URL(url)
    } catch {
      return { enlace: null, error: 'La dirección de la página no es válida.' }
    }
    return { enlace: url, error: null }
  }

  const n = digitos(d.numero)
  if (n.length < 10) return { enlace: null, error: 'Poné el número con código de área, ej. 297 4123456.' }

  if (d.accion === 'whatsapp') {
    const completo = n.startsWith('54') ? n : `549${n}`
    const texto = d.mensaje.trim()
    return { enlace: `https://wa.me/${completo}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`, error: null }
  }

  return { enlace: `tel:+${n.startsWith('54') ? n : `54${n}`}`, error: null }
}

export function leerEnlace(enlace: string | null | undefined): DatosAccion {
  const vacio = { url: '', numero: '', mensaje: '' }
  if (!enlace) return { accion: 'nada', ...vacio }

  const wa = enlace.match(/^https:\/\/wa\.me\/(\d+)(?:\?text=(.*))?$/)
  if (wa) {
    return { accion: 'whatsapp', ...vacio, numero: wa[1].replace(/^549?/, ''), mensaje: wa[2] ? decodeURIComponent(wa[2]) : '' }
  }
  const tel = enlace.match(/^tel:\+?(\d+)$/)
  if (tel) return { accion: 'telefono', ...vacio, numero: tel[1].replace(/^54/, '') }

  return { accion: 'web', ...vacio, url: enlace }
}

// Para el banner: página y WhatsApp abren en otra pestaña; la llamada no
export function tipoEnlace(enlace: string | null | undefined): 'web' | 'telefono' | null {
  if (!enlace) return null
  if (/^https?:\/\//.test(enlace)) return 'web'
  if (/^tel:\+?\d+$/.test(enlace)) return 'telefono'
  return null
}

// Texto corto para la lista del panel
export function describirEnlace(enlace: string | null | undefined): string {
  const d = leerEnlace(enlace)
  if (d.accion === 'nada') return 'Al tocar: nada'
  if (d.accion === 'whatsapp') return `Al tocar: WhatsApp ${d.numero}`
  if (d.accion === 'telefono') return `Al tocar: llama al ${d.numero}`
  return `Al tocar: abre ${d.url.replace(/^https?:\/\//, '')}`
}
