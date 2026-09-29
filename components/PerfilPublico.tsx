import { COLORS } from '@/lib/theme'
import Link from 'next/link'
import { CLASES_CARNET_FLAT } from '@/lib/carnetsIdiomas'
import { formatearFechaCorta } from '@/lib/fechas'
import TarjetaPerfil, { lineaResumen } from '@/components/TarjetaPerfil'

// Perfil público de una persona: lo que ven los demás (desde postulantes,
// el listado de trabajadores o un chat). Arriba la tarjeta amarilla con
// foto, calificación y datos rápidos; abajo el detalle y las reseñas.
// Solo presentación: los datos los trae app/prestadores/[id]/page.tsx.

const NIVEL_LABEL: Record<string, string> = {
  primario: 'Primario',
  secundario: 'Secundario',
  terciario: 'Terciario',
  universitario: 'Universitario',
  posgrado: 'Posgrado',
}

const BUSQUEDA_LABEL: Record<string, string> = {
  changa: 'Trabajos puntuales',
  fijo: 'Trabajo fijo',
  ambos: 'Puntuales o fijos',
}

const DISPONIBILIDAD_LABEL: Record<string, string> = {
  fulltime: 'Full time',
  parttime: 'Part time',
  flexible: 'Flexible',
}

const formatoMesAnio = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  month: 'short',
  year: 'numeric',
})

function nombreClaseCarnet(valor: string): string {
  return CLASES_CARNET_FLAT.find((c) => c.valor === valor)?.label ?? valor
}

export type Calificacion = {
  estrellas: number
  comentario: string | null
  tipo: string
  fecha: string | null
}

const tituloSeccion: React.CSSProperties = {
  display: 'inline-block',
  background: COLORS.dark,
  color: COLORS.onDark,
  fontSize: 13,
  fontWeight: 600,
  padding: '7px 14px',
  borderRadius: 100,
  marginBottom: 16,
}

const tarjeta: React.CSSProperties = {
  background: COLORS.card,
  borderRadius: 24,
  padding: 18,
  boxShadow: COLORS.cardShadow,
  marginTop: 14,
}

const chip: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 12.5,
  fontWeight: 600,
  color: COLORS.ink,
  background: COLORS.iconBg,
  padding: '6px 12px',
  borderRadius: 100,
  marginRight: 6,
  marginBottom: 6,
}

function Estrellas({ valor }: { valor: number }) {
  return (
    <span aria-label={`${valor} de 5 estrellas`} style={{ fontSize: 14, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(valor) ? COLORS.clay : COLORS.line }}>
          ★
        </span>
      ))}
    </span>
  )
}

export type PerfilPublicoProps = {
  usuario: { nombre: string | null; apellido: string | null; foto_perfil_url: string | null; created_at: string | null }
  perfil: {
    nivel_educativo: string | null
    tipo_busqueda: string | null
    disponibilidad_horaria: string | null
    experiencia: string | null
    sobre_mi: string | null
    tiene_carnet: string | null
    carnets_declarados: string[] | null
    idiomas_declarados: string[] | null
  } | null
  rubros: string[]
  calificaciones: Calificacion[]
  hechos: number
  ofrecidosCompletados: number
  volver: string
}

export default function PerfilPublico({
  usuario,
  perfil,
  rubros,
  calificaciones,
  hechos,
  ofrecidosCompletados,
  volver,
}: PerfilPublicoProps) {
  const promedio =
    calificaciones.length > 0
      ? calificaciones.reduce((suma, c) => suma + c.estrellas, 0) / calificaciones.length
      : null

  const nombreCompleto = usuario.apellido ? `${usuario.nombre} ${usuario.apellido}` : usuario.nombre
  const resumen = lineaResumen({
    rubros,
    horario: perfil?.disponibilidad_horaria
      ? DISPONIBILIDAD_LABEL[perfil.disponibilidad_horaria] ?? perfil.disponibilidad_horaria
      : null,
    tieneCarnet: perfil?.tiene_carnet,
    clasesCarnet: perfil?.carnets_declarados,
    idiomas: perfil?.idiomas_declarados,
  })

  // Datos rápidos de la tarjeta amarilla (solo los que tiene cargados)
  const pillsRapidas = [
    perfil?.tipo_busqueda && (BUSQUEDA_LABEL[perfil.tipo_busqueda] ?? perfil.tipo_busqueda),
    perfil?.nivel_educativo && (NIVEL_LABEL[perfil.nivel_educativo] ?? perfil.nivel_educativo),
    hechos > 0 && `${hechos} trabajo${hechos === 1 ? '' : 's'}`,
  ].filter(Boolean) as string[]

  // Grilla de datos: valor arriba, etiqueta abajo
  const datos: { valor: string; etiqueta: string }[] = [
    { valor: String(hechos), etiqueta: 'Trabajos hechos' },
    { valor: String(ofrecidosCompletados), etiqueta: 'Trabajos ofrecidos y completados' },
  ]
  if (perfil?.tipo_busqueda) {
    datos.push({ valor: BUSQUEDA_LABEL[perfil.tipo_busqueda] ?? perfil.tipo_busqueda, etiqueta: 'Busca' })
  }
  if (perfil?.disponibilidad_horaria) {
    datos.push({
      valor: DISPONIBILIDAD_LABEL[perfil.disponibilidad_horaria] ?? perfil.disponibilidad_horaria,
      etiqueta: 'Disponibilidad',
    })
  }
  if (perfil?.nivel_educativo) {
    datos.push({ valor: NIVEL_LABEL[perfil.nivel_educativo] ?? perfil.nivel_educativo, etiqueta: 'Estudios' })
  }
  if (perfil?.tiene_carnet) {
    const clases = (perfil.carnets_declarados ?? []) as string[]
    datos.push({
      valor: perfil.tiene_carnet === 'no' ? 'No tiene' : clases.length > 0 ? clases.map(nombreClaseCarnet).join(', ') : 'Sí',
      etiqueta: 'Carnet de conducir',
    })
  }
  if (perfil?.idiomas_declarados != null) {
    const idiomas = perfil.idiomas_declarados as string[]
    datos.push({ valor: idiomas.length > 0 ? idiomas.join(', ') : 'Solo español', etiqueta: 'Idiomas' })
  }
  if (usuario.created_at) {
    datos.push({ valor: formatoMesAnio.format(new Date(usuario.created_at)), etiqueta: 'En Rebuscapp desde' })
  }

  return (
    <div style={{ background: COLORS.wrapperBg, minHeight: '100vh' }}>
      <div className="pantalla" style={{ background: COLORS.paper, minHeight: '100vh' }}>
        <div style={{ padding: '20px 16px 40px' }}>
          <Link
            href={volver}
            style={{ fontSize: 13, color: COLORS.inkSoft, textDecoration: 'none', fontWeight: 600 }}
          >
            ← Volver
          </Link>

          <TarjetaPerfil
            nombre={nombreCompleto ?? ''}
            fotoUrl={usuario.foto_perfil_url}
            resumen={resumen}
            pills={pillsRapidas}
            promedio={promedio}
            cantidadCalificaciones={calificaciones.length}
            boton={calificaciones.length > 0 ? { href: '#calificaciones', label: 'Ver calificaciones' } : null}
          />

          {!perfil && (
            <p style={{ color: COLORS.inkSoft, fontSize: 13, textAlign: 'center', margin: '14px 0 0' }}>
              Esta persona todavía no completó su perfil de trabajador.
            </p>
          )}

          {/* Datos */}
          <div style={tarjeta}>
            <span style={tituloSeccion}>Datos</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 14px' }}>
              {datos.map((d) => (
                <div key={d.etiqueta}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, margin: 0, lineHeight: 1.3 }}>
                    {d.valor}
                  </p>
                  <p style={{ fontSize: 12, color: COLORS.inkSoft, margin: '2px 0 0', lineHeight: 1.35 }}>
                    {d.etiqueta}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {rubros.length > 0 && (
            <div style={tarjeta}>
              <span style={tituloSeccion}>Le interesa</span>
              <div>
                {rubros.map((r) => (
                  <span key={r} style={chip}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {perfil?.experiencia && (
            <div style={tarjeta}>
              <span style={tituloSeccion}>Experiencia</span>
              <p style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.55, margin: 0 }}>{perfil.experiencia}</p>
            </div>
          )}

          {perfil?.sobre_mi && (
            <div style={tarjeta}>
              <span style={tituloSeccion}>Sobre {usuario.nombre}</span>
              <p style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.55, margin: 0 }}>{perfil.sobre_mi}</p>
            </div>
          )}

          {calificaciones.length > 0 && (
            <div id="calificaciones" style={{ ...tarjeta, scrollMarginTop: 16 }}>
              <span style={tituloSeccion}>Calificaciones</span>
              {calificaciones.map((c, i) => (
                <div key={i} style={{ padding: '12px 0', borderTop: i > 0 ? `1px solid ${COLORS.line}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <Estrellas valor={c.estrellas} />
                    <span style={{ fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 600 }}>
                      {c.tipo === 'solicitante_a_prestador' ? 'Como trabajador' : 'Como quien ofreció'}
                      {c.fecha && ` · ${formatearFechaCorta(c.fecha)}`}
                    </span>
                  </div>
                  {c.comentario && (
                    <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.5, margin: '6px 0 0' }}>
                      {c.comentario}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
