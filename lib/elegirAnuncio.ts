// Elige qué anuncio mostrar (sirve en servidor y en el navegador).
// Con un rubro en pantalla, primero los de ese rubro; si no hay, los
// generales (sin rubro). La semilla viene del servidor para que la elección
// rote entre visitas sin cambiar en cada render.

export type AnuncioElegible = {
  id: string
  anunciante: string
  imagen_url: string
  texto_alternativo: string | null
  rubro: string | null
}

export function elegirAnuncio<A extends AnuncioElegible>(candidatos: A[], rubro: string | null, semilla: number): A | null {
  const delRubro = rubro ? candidatos.filter((a) => a.rubro === rubro) : []
  const lista = delRubro.length > 0 ? delRubro : candidatos.filter((a) => !a.rubro)
  if (lista.length === 0) return null
  return lista[Math.abs(semilla) % lista.length]
}
