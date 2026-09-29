'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'
import {
  PantallaBase,
  LinkVolver,
  TituloPagina,
  Subtitulo,
  TituloSeccion,
  Chip,
  inputBaseStyle,
  BotonPrincipal,
  MensajeError,
  MensajeExito,
  BarraProgreso,
} from '@/lib/ui'
import BottomNav from '@/components/BottomNav'
import CategoriaPicker from '@/components/CategoriaPicker'
import BotonCerrarSesion from '@/components/BotonCerrarSesion'
import { CLASES_CARNET, IDIOMAS_COMUNES } from '@/lib/carnetsIdiomas'

type Perfil = {
  nivel_educativo: string | null
  tipo_busqueda: string | null
  disponibilidad_horaria: string | null
  experiencia: string | null
  sobre_mi: string | null
  tiene_carnet: 'si' | 'no' | null
  carnets_declarados: string[] | null
  idiomas_declarados: string[] | null
} | null

type CategoriaT = { slug: string; nombre: string; requiere_matricula: boolean }
type Grupo = { slug: string; nombre: string; categorias: CategoriaT[] }
type CategoriaInteres = { slug: string; nombre: string; grupoNombre: string }

const NIVELES = [
  { valor: 'primario', label: 'Primario' },
  { valor: 'secundario', label: 'Secundario' },
  { valor: 'terciario', label: 'Terciario' },
  { valor: 'universitario', label: 'Universitario' },
  { valor: 'posgrado', label: 'Posgrado' },
]

const TIPOS_BUSQUEDA = [
  { valor: 'changa', label: 'Trabajos puntuales' },
  { valor: 'fijo', label: 'Trabajo fijo' },
  { valor: 'ambos', label: 'Cualquiera de los dos' },
]

const DISPONIBILIDADES = [
  { valor: 'fulltime', label: 'Full time' },
  { valor: 'parttime', label: 'Part time' },
  { valor: 'flexible', label: 'Flexible' },
]

export default function PerfilPrestadorForm({
  perfilExistente,
  fotoActual,
  nombreActual,
  apellidoActual,
  grupos,
  categoriasInteresIniciales,
  visibleEnListadoInicial,
}: {
  perfilExistente: Perfil
  fotoActual: string | null
  nombreActual: string
  apellidoActual: string
  grupos: Grupo[]
  categoriasInteresIniciales: CategoriaInteres[]
  // null = la columna todavía no existe en la base: no mostramos la opción
  visibleEnListadoInicial: boolean | null
}) {
  const supabase = createClient()

  const [nombre, setNombre] = useState(nombreActual)
  const [apellido, setApellido] = useState(apellidoActual)

  const [nivelEducativo, setNivelEducativo] = useState(perfilExistente?.nivel_educativo ?? '')
  const [fotoUrl, setFotoUrl] = useState(fotoActual)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [tipoBusqueda, setTipoBusqueda] = useState(perfilExistente?.tipo_busqueda ?? 'changa')
  const [disponibilidad, setDisponibilidad] = useState(perfilExistente?.disponibilidad_horaria ?? '')
  const [sobreMi, setSobreMi] = useState(perfilExistente?.sobre_mi ?? '')
  const [experiencia, setExperiencia] = useState(perfilExistente?.experiencia ?? '')
  const [categoriasInteres, setCategoriasInteres] = useState<CategoriaInteres[]>(categoriasInteresIniciales)
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const [visibleEnListado, setVisibleEnListado] = useState(visibleEnListadoInicial ?? false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  // Carnet de conducir: '' = nunca contestó, 'si' / 'no' = respuesta explícita
  const [tieneCarnet, setTieneCarnet] = useState<'si' | 'no' | ''>(perfilExistente?.tiene_carnet ?? '')
  const [carnetsDeclarados, setCarnetsDeclarados] = useState<string[]>(perfilExistente?.carnets_declarados ?? [])

  // Idiomas: null = nunca contestó esta sección; array (aunque vacío) = contestó
  const [idiomasDeclarados, setIdiomasDeclarados] = useState<string[] | null>(
    perfilExistente?.idiomas_declarados ?? null
  )

  function pareceTextoReal(texto: string): boolean {
    const limpio = texto.trim()
    if (limpio.length < 100) return false
    const palabras = limpio.split(/\s+/).filter(Boolean)
    if (palabras.length < 15) return false
    const promedioLargoPalabra = limpio.replace(/\s/g, '').length / palabras.length
    if (promedioLargoPalabra > 12) return false
    return true
  }

  const experienciaCompleta = pareceTextoReal(experiencia)
  const sobreMiCompleto = pareceTextoReal(sobreMi)
  const camposClave = [
    nivelEducativo !== '',
    disponibilidad !== '',
    experienciaCompleta,
    sobreMiCompleto,
    fotoUrl !== null,
    categoriasInteres.length > 0,
  ]
  const completados = camposClave.filter(Boolean).length
  const porcentajeCompleto = Math.round((completados / camposClave.length) * 100)

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    if (!archivo.type.startsWith('image/')) {
      setError('Elegí un archivo de imagen.')
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 5MB.')
      return
    }

    setSubiendoFoto(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Tu sesión expiró, volvé a loguearte.')
      setSubiendoFoto(false)
      return
    }

    const extension = archivo.name.split('.').pop()
    const ruta = `${user.id}/avatar.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from('avatars')
      .upload(ruta, archivo, { upsert: true })

    if (errorSubida) {
      setError('No pudimos subir la foto: ' + errorSubida.message)
      setSubiendoFoto(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(ruta)
    const urlConCacheBuster = `${publicUrlData.publicUrl}?t=${Date.now()}`

    await supabase.from('usuarios').upsert(
      { id: user.id, email: user.email, nombre: user.email?.split('@')[0] ?? 'Usuario', foto_perfil_url: urlConCacheBuster },
      { onConflict: 'id' }
    )

    setFotoUrl(urlConCacheBuster)
    setSubiendoFoto(false)
  }

  function chipRow(
    opciones: { valor: string; label: string }[],
    valorActual: string,
    onChange: (v: string) => void
  ) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {opciones.map((op) => (
          <Chip key={op.valor} activo={valorActual === op.valor} onClick={() => onChange(op.valor)}>
            {op.label}
          </Chip>
        ))}
      </div>
    )
  }

  function quitarCategoria(slug: string) {
    setCategoriasInteres((prev) => prev.filter((c) => c.slug !== slug))
  }

  function toggleCarnet(valor: string) {
    setCarnetsDeclarados((prev) =>
      prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]
    )
  }

  function toggleIdioma(idioma: string) {
    setIdiomasDeclarados((prev) => {
      const actual = prev ?? []
      return actual.includes(idioma) ? actual.filter((i) => i !== idioma) : [...actual, idioma]
    })
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    setGuardado(false)

    const nombreLimpio = nombre.trim()
    const apellidoLimpio = apellido.trim()
    if (nombreLimpio.length < 2 || apellidoLimpio.length < 2) {
      setError('Ingresá tu nombre y tu apellido.')
      setCargando(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Tu sesión expiró, volvé a loguearte.')
      setCargando(false)
      return
    }

    await supabase.from('usuarios').upsert(
      { id: user.id, email: user.email, nombre: nombreLimpio, apellido: apellidoLimpio, rol_prestador_activo: true },
      { onConflict: 'id' }
    )

    const { error: errorPerfil } = await supabase.from('perfiles_prestador').upsert(
      {
        usuario_id: user.id,
        nivel_educativo: nivelEducativo || null,
        tipo_busqueda: tipoBusqueda,
        disponibilidad_horaria: disponibilidad || null,
        sobre_mi: sobreMi || null,
        experiencia: experiencia || null,
        porcentaje_perfil_completo: porcentajeCompleto,
        tiene_carnet: tieneCarnet || null,
        carnets_declarados: tieneCarnet === 'si' ? carnetsDeclarados : [],
        idiomas_declarados: idiomasDeclarados,
        ...(visibleEnListadoInicial !== null && { visible_en_listado: visibleEnListado }),
      },
      { onConflict: 'usuario_id' }
    )

    if (errorPerfil) {
      setError('No pudimos guardar tu perfil: ' + errorPerfil.message)
      setCargando(false)
      return
    }

    // Sincronizamos categorías de interés: borramos todas las viejas y
    // volvemos a insertar las actuales — más simple y confiable que
    // calcular diferencias
    await supabase.from('prestador_categorias').delete().eq('prestador_id', user.id)

    if (categoriasInteres.length > 0) {
      const { error: errorCategorias } = await supabase.from('prestador_categorias').insert(
        categoriasInteres.map((c) => ({ prestador_id: user.id, categoria_slug: c.slug }))
      )
      if (errorCategorias) {
        setError('Guardamos el perfil, pero no las categorías: ' + errorCategorias.message)
        setCargando(false)
        return
      }
    }

    setCargando(false)
    setGuardado(true)
  }

  return (
    <PantallaBase>
      <div style={{ padding: '20px 20px 100px' }}>
        <LinkVolver href="/" />

        <TituloPagina>Tu perfil como prestador</TituloPagina>
        <Subtitulo>Todo esto es opcional, pero ayuda a que te elijan mejor.</Subtitulo>

        <BarraProgreso porcentaje={porcentajeCompleto} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: COLORS.card,
              border: `1.5px solid ${COLORS.line}`,
              flexShrink: 0,
              overflow: 'hidden',
              backgroundImage: fotoUrl ? `url(${fotoUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div>
            <label
              style={{
                display: 'inline-block',
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.clayDark,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {subiendoFoto ? 'Subiendo...' : fotoUrl ? 'Cambiar foto' : 'Agregar foto de perfil'}
              <input
                type="file"
                accept="image/*"
                onChange={subirFoto}
                disabled={subiendoFoto}
                style={{ display: 'none' }}
              />
            </label>
            <p style={{ fontSize: 11.5, color: COLORS.inkSoft, margin: '2px 0 0' }}>JPG o PNG, hasta 5MB</p>
          </div>
        </div>

        <form onSubmit={guardar}>
          <TituloSeccion>Nombre y apellido</TituloSeccion>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            style={{ ...inputBaseStyle, marginBottom: 10 }}
          />
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Apellido"
            style={{ ...inputBaseStyle, marginBottom: 6 }}
          />
          <p style={{ fontSize: 11.5, color: COLORS.inkSoft, marginBottom: 20 }}>
            Así te van a ver los demás — usá tu nombre real, no un apodo o usuario.
          </p>

          <TituloSeccion>Categorías de interés</TituloSeccion>
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 12 }}>
            Elegí en qué tipo de trabajos te interesa que te avisemos y te encuentren.
          </p>

          {categoriasInteres.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {categoriasInteres.map((c) => (
                <span
                  key={c.slug}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 8px 8px 14px',
                    borderRadius: 100,
                    background: COLORS.clayTint,
                    color: COLORS.clayDark,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  {c.nombre}
                  <button
                    type="button"
                    onClick={() => quitarCategoria(c.slug)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.1)',
                      color: COLORS.clayDark,
                      fontSize: 12,
                      lineHeight: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMostrarPicker(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '13px',
              borderRadius: 14,
              border: `1.5px dashed ${COLORS.line}`,
              background: 'transparent',
              color: COLORS.inkSoft,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 24,
            }}
          >
            + {categoriasInteres.length > 0 ? 'Agregar más categorías' : 'Elegir categorías'}
          </button>

          {mostrarPicker && (
            <CategoriaPicker
              grupos={grupos}
              multiple
              seleccionadasIniciales={categoriasInteres.map((c) => c.slug)}
              onCerrar={() => setMostrarPicker(false)}
              onConfirmarMultiple={(elegidas) => {
                setCategoriasInteres(elegidas)
                setMostrarPicker(false)
              }}
            />
          )}

          <TituloSeccion>Nivel educativo</TituloSeccion>
          {chipRow(NIVELES, nivelEducativo, setNivelEducativo)}

          <TituloSeccion>¿Qué tipo de trabajo buscás?</TituloSeccion>
          {chipRow(TIPOS_BUSQUEDA, tipoBusqueda, setTipoBusqueda)}

          <TituloSeccion>Disponibilidad horaria</TituloSeccion>
          {chipRow(DISPONIBILIDADES, disponibilidad, setDisponibilidad)}

          <TituloSeccion>¿Tenés carnet de conducir?</TituloSeccion>
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 12 }}>
            Algunos pedidos piden una clase específica — contestar esto te evita perder tiempo postulándote a algo que no podés hacer.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: tieneCarnet === 'si' ? 12 : 20 }}>
            <div style={{ flex: 1 }}>
              <Chip activo={tieneCarnet === 'si'} onClick={() => setTieneCarnet(tieneCarnet === 'si' ? '' : 'si')}>
                Sí
              </Chip>
            </div>
            <div style={{ flex: 1 }}>
              <Chip activo={tieneCarnet === 'no'} onClick={() => setTieneCarnet(tieneCarnet === 'no' ? '' : 'no')}>
                No
              </Chip>
            </div>
          </div>

          {tieneCarnet === 'si' && (
            <div style={{ marginBottom: 20 }}>
              {CLASES_CARNET.map((grupo) => (
                <div key={grupo.grupo} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    {grupo.grupo}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {grupo.opciones.map((op) => (
                      <Chip key={op.valor} activo={carnetsDeclarados.includes(op.valor)} onClick={() => toggleCarnet(op.valor)}>
                        {op.valor}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <TituloSeccion>¿Hablás algún idioma además de español?</TituloSeccion>
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 12 }}>
            Marcá los que hablás. Si no hablás ninguno, dejalo así — igual queda registrado que contestaste.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {IDIOMAS_COMUNES.map((idioma) => (
              <Chip
                key={idioma}
                activo={(idiomasDeclarados ?? []).includes(idioma)}
                onClick={() => toggleIdioma(idioma)}
              >
                {idioma}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIdiomasDeclarados((prev) => (prev === null ? [] : prev))}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              marginBottom: 20,
              fontSize: 12,
              fontWeight: 600,
              color: idiomasDeclarados !== null ? COLORS.green : COLORS.clayDark,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {idiomasDeclarados !== null ? '✓ Ya contestaste esta pregunta' : 'No hablo ningún otro idioma — marcar como contestado'}
          </button>

          <TituloSeccion>Experiencia</TituloSeccion>
          <textarea
            value={experiencia}
            onChange={(e) => setExperiencia(e.target.value)}
            placeholder="Contá en qué trabajaste antes..."
            rows={3}
            style={{ ...inputBaseStyle, marginBottom: 6, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <p style={{ fontSize: 11.5, color: experienciaCompleta ? COLORS.green : COLORS.inkSoft, marginBottom: 20, fontWeight: 600 }}>
            {experiencia.trim().length < 100
              ? `${experiencia.trim().length} / 100 caracteres mínimo`
              : experienciaCompleta
              ? '✓ Se ve como una descripción real'
              : 'Necesitamos algo más descriptivo, con varias palabras'}
          </p>

          <TituloSeccion>Sobre vos</TituloSeccion>
          <textarea
            value={sobreMi}
            onChange={(e) => setSobreMi(e.target.value)}
            placeholder="Una breve presentación..."
            rows={3}
            style={{ ...inputBaseStyle, marginBottom: 6, fontFamily: 'inherit', resize: 'vertical' }}
          />
          <p style={{ fontSize: 11.5, color: sobreMiCompleto ? COLORS.green : COLORS.inkSoft, marginBottom: 24, fontWeight: 600 }}>
            {sobreMi.trim().length < 100
              ? `${sobreMi.trim().length} / 100 caracteres mínimo`
              : sobreMiCompleto
              ? '✓ Se ve como una descripción real'
              : 'Necesitamos algo más descriptivo, con varias palabras'}
          </p>

          {visibleEnListadoInicial !== null && (
            <button
              type="button"
              role="switch"
              aria-checked={visibleEnListado}
              onClick={() => setVisibleEnListado((v) => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
                background: visibleEnListado ? COLORS.clayTint : COLORS.card,
                boxShadow: COLORS.cardShadow,
                border: 'none',
                borderRadius: 22,
                padding: 16,
                marginBottom: 24,
                cursor: 'pointer',
                color: COLORS.ink,
              }}
            >
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>Aparecer en el listado de trabajadores</span>
                <span style={{ display: 'block', fontSize: 12.5, color: COLORS.inkSoft, marginTop: 3, lineHeight: 1.4 }}>
                  Tu nombre, foto, categorías y presentación se muestran en el inicio para que te contacten. Podés sacarlo cuando quieras.
                </span>
              </span>
              {/* Interruptor tipo iOS */}
              <span
                aria-hidden
                style={{
                  width: 46,
                  height: 28,
                  borderRadius: 100,
                  background: visibleEnListado ? COLORS.dark : COLORS.line,
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: visibleEnListado ? 21 : 3,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: visibleEnListado ? COLORS.clay : COLORS.card,
                    transition: 'left 0.2s',
                  }}
                />
              </span>
            </button>
          )}

          {error && <MensajeError>{error}</MensajeError>}
          {guardado && <MensajeExito>✓ Guardado</MensajeExito>}

          <BotonPrincipal type="submit" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar perfil'}
          </BotonPrincipal>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <BotonCerrarSesion />
        </div>
      </div>
      <BottomNav />
    </PantallaBase>
  )
}