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
  Etiqueta,
  Eyebrow,
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
import EliminarCuenta from '@/components/EliminarCuenta'
import TusEstadisticas, { type Estadisticas } from '@/components/TusEstadisticas'
import { CLASES_CARNET, IDIOMAS_COMUNES } from '@/lib/carnetsIdiomas'
import { guardarDatosPersonales } from '@/app/actions/usuarios'

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

// Tarjeta blanca de cada bloque del perfil
const tarjeta: React.CSSProperties = {
  background: COLORS.card,
  boxShadow: COLORS.cardShadow,
  borderRadius: 22,
  padding: 18,
  marginBottom: 28,
}

// Dentro de una tarjeta blanca los campos van sobre el fondo cálido,
// para que se distingan de la tarjeta
const inputEnTarjeta: React.CSSProperties = { ...inputBaseStyle, background: COLORS.paper }

const ayuda: React.CSSProperties = { fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.45 }

export default function PerfilForm({
  perfilExistente,
  fotoActual,
  nombreActual,
  apellidoActual,
  edadActual,
  dniActual,
  grupos,
  categoriasInteresIniciales,
  visibleEnListadoInicial,
  estadisticas,
}: {
  perfilExistente: Perfil
  fotoActual: string | null
  nombreActual: string
  apellidoActual: string
  edadActual: number | null
  dniActual: string
  grupos: Grupo[]
  categoriasInteresIniciales: CategoriaInteres[]
  // null = la columna todavía no existe en la base: no mostramos la opción
  visibleEnListadoInicial: boolean | null
  estadisticas?: Estadisticas
}) {
  const supabase = createClient()

  // Datos personales (todos los usuarios)
  const [nombre, setNombre] = useState(nombreActual)
  const [apellido, setApellido] = useState(apellidoActual)
  const [edad, setEdad] = useState(edadActual !== null ? String(edadActual) : '')
  const [dni, setDni] = useState(dniActual)
  const [fotoUrl, setFotoUrl] = useState(fotoActual)
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  // Perfil como trabajador
  const [nivelEducativo, setNivelEducativo] = useState(perfilExistente?.nivel_educativo ?? '')
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

  // Quien solo publica trabajos no tiene por qué tener perfil de
  // trabajador: lo guardamos solo si ya existía o si cargó algo.
  const tieneDatosTrabajador =
    perfilExistente !== null ||
    categoriasInteres.length > 0 ||
    nivelEducativo !== '' ||
    disponibilidad !== '' ||
    sobreMi.trim() !== '' ||
    experiencia.trim() !== '' ||
    tieneCarnet !== '' ||
    idiomasDeclarados !== null ||
    visibleEnListado

  const inicial = (nombre.trim()[0] ?? '').toUpperCase()

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

    const resultado = await guardarDatosPersonales({ fotoPerfilUrl: urlConCacheBuster })
    if (!resultado.ok) {
      setError(resultado.error)
      setSubiendoFoto(false)
      return
    }

    setFotoUrl(urlConCacheBuster)
    setSubiendoFoto(false)
  }

  function chipRow(
    opciones: { valor: string; label: string }[],
    valorActual: string,
    onChange: (v: string) => void
  ) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
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
    setGuardado(false)

    const nombreLimpio = nombre.trim()
    const apellidoLimpio = apellido.trim()
    if (nombreLimpio.length < 2 || apellidoLimpio.length < 2) {
      setError('Ingresá tu nombre y tu apellido.')
      return
    }

    // Edad y DNI son opcionales acá (se piden recién para postularse),
    // pero si los completa tienen que ser válidos
    const edadNum = Number(edad)
    if (edad !== '' && (isNaN(edadNum) || edadNum < 18 || edadNum > 99)) {
      setError('Ingresá una edad válida (entre 18 y 99).')
      return
    }
    if (dni !== '' && (dni.length < 7 || dni.length > 8)) {
      setError('Ingresá un DNI válido, sin puntos (solo números).')
      return
    }

    setCargando(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Tu sesión expiró, volvé a loguearte.')
      setCargando(false)
      return
    }

    const resultadoUsuario = await guardarDatosPersonales({
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      ...(edad !== '' && { edad: edadNum }),
      ...(dni !== '' && { dni }),
      rolPrestadorActivo: categoriasInteres.length > 0,
    })

    if (!resultadoUsuario.ok) {
      setError(resultadoUsuario.error)
      setCargando(false)
      return
    }

    if (tieneDatosTrabajador) {
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
        setError('No pudimos guardar tu perfil de trabajador: ' + errorPerfil.message)
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
    }

    setCargando(false)
    setGuardado(true)
  }

  return (
    <PantallaBase>
      <div style={{ padding: '20px 20px 110px' }}>
        <LinkVolver href="/" />

        <TituloPagina>Tu perfil</TituloPagina>
        <Subtitulo>Así te ven los demás, tanto si publicás trabajos como si te postulás.</Subtitulo>

        {estadisticas && <TusEstadisticas e={estadisticas} />}

        <form onSubmit={guardar}>
          {/* ——— Datos personales ——— */}
          <Eyebrow>Datos personales</Eyebrow>
          <div style={tarjeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: COLORS.clayTint,
                  color: COLORS.ink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 600,
                  flexShrink: 0,
                  overflow: 'hidden',
                  backgroundImage: fotoUrl ? `url(${fotoUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!fotoUrl && inicial}
              </div>
              <div>
                <label
                  style={{
                    display: 'inline-block',
                    padding: '9px 15px',
                    borderRadius: 100,
                    background: COLORS.dark,
                    color: COLORS.onDark,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: subiendoFoto ? 'default' : 'pointer',
                    opacity: subiendoFoto ? 0.7 : 1,
                  }}
                >
                  {subiendoFoto ? 'Subiendo...' : fotoUrl ? 'Cambiar foto' : 'Agregar foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={subirFoto}
                    disabled={subiendoFoto}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ ...ayuda, margin: '6px 0 0' }}>JPG o PNG, hasta 5MB</p>
              </div>
            </div>

            <Etiqueta>Nombre</Etiqueta>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: María"
              style={{ ...inputEnTarjeta, marginBottom: 14 }}
            />
            <Etiqueta>Apellido</Etiqueta>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Ej: Fernández"
              style={{ ...inputEnTarjeta, marginBottom: 6 }}
            />
            <p style={{ ...ayuda, marginBottom: 16 }}>
              Usá tu nombre real, no un apodo: es lo que ven los demás.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Etiqueta>Edad</Etiqueta>
                <input
                  type="number"
                  inputMode="numeric"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="Ej: 34"
                  style={inputEnTarjeta}
                />
              </div>
              <div style={{ flex: 1.4, minWidth: 0 }}>
                <Etiqueta>DNI</Etiqueta>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Solo números"
                  style={inputEnTarjeta}
                />
              </div>
            </div>
            <p style={{ ...ayuda, margin: '6px 0 0' }}>
              Edad y DNI no se muestran a nadie. Los pedimos para verificar que sos una persona real antes de postularte.
            </p>
          </div>

          {/* ——— Perfil como trabajador ——— */}
          <div id="trabajador" style={{ scrollMarginTop: 16 }}>
            <Eyebrow>Perfil como trabajador</Eyebrow>
            <p style={{ ...ayuda, fontSize: 13, margin: '-4px 0 12px' }}>
              Completalo si querés ofrecer tu trabajo. Si solo publicás trabajos, podés saltearlo.
            </p>

            <BarraProgreso porcentaje={porcentajeCompleto} />

            <div style={tarjeta}>
              <TituloSeccion>¿En qué querés trabajar?</TituloSeccion>
              <p style={{ ...ayuda, marginBottom: 12 }}>
                Te avisamos cuando se publique un trabajo de estas categorías, y así te encuentran.
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
                        padding: '6px 6px 6px 14px',
                        borderRadius: 100,
                        background: COLORS.dark,
                        color: COLORS.onDark,
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      {c.nombre}
                      <button
                        type="button"
                        onClick={() => quitarCategoria(c.slug)}
                        aria-label={`Quitar ${c.nombre}`}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(255,255,255,0.18)',
                          color: COLORS.onDark,
                          fontSize: 11,
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
                  width: '100%',
                  padding: 13,
                  borderRadius: 100,
                  border: 'none',
                  background: COLORS.clayTint,
                  color: COLORS.ink,
                  fontWeight: 600,
                  fontSize: 13.5,
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

              <TituloSeccion>¿Qué tipo de trabajo buscás?</TituloSeccion>
              {chipRow(TIPOS_BUSQUEDA, tipoBusqueda, setTipoBusqueda)}

              <TituloSeccion>Disponibilidad horaria</TituloSeccion>
              {chipRow(DISPONIBILIDADES, disponibilidad, setDisponibilidad)}

              <TituloSeccion>Nivel educativo</TituloSeccion>
              {chipRow(NIVELES, nivelEducativo, setNivelEducativo)}

              <TituloSeccion>¿Tenés carnet de conducir?</TituloSeccion>
              <p style={{ ...ayuda, marginBottom: 12 }}>
                Algunos trabajos piden una clase específica. Contestarlo te evita postularte a algo que no podés hacer.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: tieneCarnet === 'si' ? 14 : 22 }}>
                <Chip activo={tieneCarnet === 'si'} onClick={() => setTieneCarnet(tieneCarnet === 'si' ? '' : 'si')}>
                  Sí
                </Chip>
                <Chip activo={tieneCarnet === 'no'} onClick={() => setTieneCarnet(tieneCarnet === 'no' ? '' : 'no')}>
                  No
                </Chip>
              </div>

              {tieneCarnet === 'si' && (
                <div style={{ marginBottom: 22 }}>
                  {CLASES_CARNET.map((grupo) => (
                    <div key={grupo.grupo} style={{ marginBottom: 12 }}>
                      <Etiqueta>{grupo.grupo}</Etiqueta>
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
              <p style={{ ...ayuda, marginBottom: 12 }}>
                Marcá los que hablás. Si no hablás ninguno, tocá el botón de abajo para que quede contestado.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
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
              {idiomasDeclarados !== null ? (
                <p style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.green, marginBottom: 22 }}>
                  ✓ Contestado
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setIdiomasDeclarados([])}
                  style={{
                    background: 'transparent',
                    border: `1.5px solid ${COLORS.line}`,
                    borderRadius: 100,
                    padding: '8px 14px',
                    marginBottom: 22,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: COLORS.inkSoft,
                    cursor: 'pointer',
                  }}
                >
                  No hablo otro idioma
                </button>
              )}

              <TituloSeccion>Experiencia</TituloSeccion>
              <textarea
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
                placeholder="Contá en qué trabajaste antes..."
                rows={3}
                style={{ ...inputEnTarjeta, marginBottom: 6, fontFamily: 'inherit', resize: 'vertical' }}
              />
              <ContadorTexto texto={experiencia} completo={experienciaCompleta} />

              <TituloSeccion>Sobre vos</TituloSeccion>
              <textarea
                value={sobreMi}
                onChange={(e) => setSobreMi(e.target.value)}
                placeholder="Una breve presentación para quienes publican trabajos..."
                rows={3}
                style={{ ...inputEnTarjeta, marginBottom: 6, fontFamily: 'inherit', resize: 'vertical' }}
              />
              <ContadorTexto texto={sobreMi} completo={sobreMiCompleto} />

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
                    background: visibleEnListado ? COLORS.clayTint : COLORS.paper,
                    border: 'none',
                    borderRadius: 18,
                    padding: 16,
                    marginTop: 4,
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
            </div>
          </div>

          {error && <MensajeError>{error}</MensajeError>}
          {guardado && <MensajeExito>✓ Guardado</MensajeExito>}

          <BotonPrincipal type="submit" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar perfil'}
          </BotonPrincipal>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <BotonCerrarSesion />
        </div>

        <EliminarCuenta />

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: COLORS.inkSoft }}>
          <a href="/terminos" style={{ color: 'inherit' }}>Términos y condiciones</a>
          {' · '}
          <a href="/privacidad" style={{ color: 'inherit' }}>Política de privacidad</a>
        </p>
      </div>
      <BottomNav />
    </PantallaBase>
  )
}

// Contador debajo de "Experiencia" y "Sobre vos": pide al menos 100
// caracteres y que parezca texto real, no relleno
function ContadorTexto({ texto, completo }: { texto: string; completo: boolean }) {
  const largo = texto.trim().length
  return (
    <p style={{ fontSize: 12, color: completo ? COLORS.green : COLORS.inkSoft, marginBottom: 22, fontWeight: 600 }}>
      {largo < 100
        ? `${largo} / 100 caracteres mínimo`
        : completo
        ? '✓ Se ve como una descripción real'
        : 'Necesitamos algo más descriptivo, con varias palabras'}
    </p>
  )
}
