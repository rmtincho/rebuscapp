import { COLORS } from '@/lib/theme'
import { iconoParaCategoria } from '@/lib/categoryIcons'

// Qué imagen va en el círculo: en un trabajo de empresa, el logo o la foto
// de perfil de quien publica (lo elige al publicar); si no, ninguna.
export function imagenDeTrabajo(p: {
  es_comercio: boolean
  imagen_empresa?: string | null
  logo_comercio_url?: string | null
  usuarios?: { foto_perfil_url?: string | null } | null
}): string | null {
  if (!p.es_comercio) return null
  if (p.imagen_empresa === 'logo') return p.logo_comercio_url ?? null
  if (p.imagen_empresa === 'foto') return p.usuarios?.foto_perfil_url ?? null
  return null
}

// El círculo de cada trabajo (tarjetas y detalle): el logo de la empresa si
// lo subió, y si no el ícono de la categoría sobre amarillo.
export default function IconoTrabajo({
  categoria,
  logoUrl,
  tamano,
}: {
  categoria: string
  logoUrl?: string | null
  tamano: number
}) {
  return (
    <span
      style={{
        width: tamano,
        height: tamano,
        borderRadius: '50%',
        background: logoUrl ? COLORS.card : COLORS.clay,
        border: logoUrl ? `1px solid ${COLORS.line}` : 'none',
        overflow: 'hidden',
        color: COLORS.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo de la empresa en el storage de Supabase
        <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        iconoParaCategoria(categoria)
      )}
    </span>
  )
}
