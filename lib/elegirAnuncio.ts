// Elige qué anuncio mostrar (sirve en servidor y en el navegador).
// Con un rubro en pantalla, primero los de ese rubro; si no hay, los
// generales (sin rubro). La semilla viene del servidor para que la elección
// rote entre visitas sin cambiar en cada render.

export type AnuncioElegible = {
  id: string
  // Nombre del negocio (opcional)
  anunciante: string | null
  // La imagen del formato de la ubicación donde se muestra
  imagen_url: string
  texto_alternativo: string | null
  rubro: string | null
  // Sin enlace, el banner es solo una imagen (no se puede tocar)
  con_enlace: boolean
  // Página o WhatsApp abren en otra pestaña; una llamada, no
  nueva_pestana: boolean
}

export function elegirAnuncio<A extends AnuncioElegible>(candidatos: A[], rubro: string | null, semilla: number): A | null {
  const delRubro = rubro ? candidatos.filter((a) => a.rubro === rubro) : []
  const lista = delRubro.length > 0 ? delRubro : candidatos.filter((a) => !a.rubro)
  if (lista.length === 0) return null
  return lista[Math.abs(semilla) % lista.length]
}
