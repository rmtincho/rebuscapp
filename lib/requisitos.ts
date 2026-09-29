// ¿Una persona cumple los requisitos de un pedido? Se usa en el inicio para
// "Coinciden con mis habilidades". La matrícula no se puede comprobar (no
// se declara en el perfil), así que no cuenta. Lo mismo se chequea al
// postularse, en el detalle del pedido.

const ORDEN_NIVEL = ['primario', 'secundario', 'terciario', 'universitario', 'posgrado']

export type RequisitosPedido = {
  edad_minima?: number | null
  requisito_nivel_educativo?: string | null
  requiere_carnet_conducir?: boolean | null
  categoria_carnet_requerida?: string | null
  idioma_requerido?: string | null
}

export type PerfilParaRequisitos = {
  edad: number | null
  nivel_educativo: string | null
  tiene_carnet: string | null
  carnets_declarados: string[] | null
  idiomas_declarados: string[] | null
}

export function cumpleRequisitos(p: RequisitosPedido, yo: PerfilParaRequisitos): boolean {
  if (p.edad_minima && (yo.edad ?? 0) < p.edad_minima) return false

  if (p.requisito_nivel_educativo) {
    const pide = ORDEN_NIVEL.indexOf(p.requisito_nivel_educativo)
    const tengo = yo.nivel_educativo ? ORDEN_NIVEL.indexOf(yo.nivel_educativo) : -1
    if (tengo < pide) return false
  }

  if (p.categoria_carnet_requerida) {
    if (!(yo.carnets_declarados ?? []).includes(p.categoria_carnet_requerida)) return false
  } else if (p.requiere_carnet_conducir && yo.tiene_carnet !== 'si') {
    return false
  }

  if (p.idioma_requerido && p.idioma_requerido.toLowerCase() !== 'español') {
    if (!(yo.idiomas_declarados ?? []).includes(p.idioma_requerido)) return false
  }

  return true
}
