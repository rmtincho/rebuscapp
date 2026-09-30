'use client'

import PanelFormulario from '@/components/PanelFormulario'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'
import {
  PantallaBase,
  LinkVolver,
  TituloPagina,
  TituloSeccion,
  Etiqueta,
  Chip,
  inputBaseStyle,
  BotonPrincipal,
  MensajeError,
  MensajeExito,
} from '@/lib/ui'
import BottomNav from '@/components/BottomNav'
import CategoriaPicker from '@/components/CategoriaPicker'
import { iconoParaCategoria } from '@/lib/categoryIcons'
import { notificarPedidoCerca } from '@/app/actions/notificaciones'
import { sugerirCategorias, type Sugerencia } from '@/lib/categorySuggest'
import { CLASES_CARNET, IDIOMAS_COMUNES } from '@/lib/carnetsIdiomas'

type CategoriaT = { slug: string; nombre: string; requiere_matricula: boolean }
type Grupo = { slug: string; nombre: string; categorias: CategoriaT[] }

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 12,
  fontSize: 14,
  color: COLORS.ink,
  background: COLORS.card,
  border: `1.5px solid ${COLORS.line}`,
  borderRadius: 14,
  padding: '13px 14px',
}

export default function PublicarPedidoForm({ grupos }: { grupos: Grupo[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [categoriaSlug, setCategoriaSlug] = useState('')
  const [categoriaNombre, setCategoriaNombre] = useState('')
  const [grupoNombre, setGrupoNombre] = useState('')
  const [marcaVehiculo, setMarcaVehiculo] = useState('')
  const [marcaOtra, setMarcaOtra] = useState('')
  const [tipoComercio, setTipoComercio] = useState('')
  const [tipoComercioOtra, setTipoComercioOtra] = useState('')
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [aConvenir, setAConvenir] = useState(false)
  const [pideVideollamada, setPideVideollamada] = useState(false)
  const [esComercio, setEsComercio] = useState(() => searchParams.get('empresa') === 'true')
  const [nombreComercio, setNombreComercio] = useState('')
  const [jornada, setJornada] = useState<'changa' | 'fulltime' | 'parttime'>('changa')
  const [nivelRequerido, setNivelRequerido] = useState('')
  // Edad mínima: '' = sin requisito
  const [edadMinima, setEdadMinima] = useState('')
  const [requiereCarnet, setRequiereCarnet] = useState(false)
  const [claseCarnet, setClaseCarnet] = useState('')
  const [requiereIdioma, setRequiereIdioma] = useState(false)
  const [idiomaRequerido, setIdiomaRequerido] = useState('')
  const [idiomaOtro, setIdiomaOtro] = useState('')
  const [requiereMatricula, setRequiereMatricula] = useState(false)
  const [requisitosAdicionales, setRequisitosAdicionales] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [direccionTexto, setDireccionTexto] = useState('')
  const [buscandoDireccion, setBuscandoDireccion] = useState(false)
  const [direccionEncontrada, setDireccionEncontrada] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])

  // Sugerimos categorías a medida que escribe la descripción, con un
  // pequeño debounce para no recalcular en cada tecla.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSugerencias(sugerirCategorias(descripcion, grupos))
    }, 250)
    return () => clearTimeout(timeoutId)
  }, [descripcion, grupos])

  function elegirSugerencia(s: Sugerencia) {
    setCategoriaSlug(s.categoria.slug)
    setCategoriaNombre(s.categoria.nombre)
    setGrupoNombre(s.grupoNombre)
    setSugerencias([])
  }

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setDireccionEncontrada(null)
      },
      () => setError('No pudimos obtener tu ubicación. Activá el permiso e intentá de nuevo.')
    )
  }

  async function buscarDireccion() {
    if (!direccionTexto.trim()) return
    setBuscandoDireccion(true)
    setError(null)
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          direccionTexto + ', Argentina'
        )}`
      )
      const data = await resp.json()
      if (data.length === 0) {
        setError('No encontramos esa dirección. Probá con más detalle (calle, número, ciudad).')
        setBuscandoDireccion(false)
        return
      }
      setLat(parseFloat(data[0].lat))
      setLng(parseFloat(data[0].lon))
      setDireccionEncontrada(data[0].display_name)
    } catch {
      setError('No pudimos buscar la dirección. Probá de nuevo.')
    }
    setBuscandoDireccion(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!categoriaSlug) return setError('Elegí una categoría.')
    if (!descripcion.trim()) return setError('Contanos qué necesitás.')

    setCargando(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Tu sesión expiró, volvé a loguearte.')
      setCargando(false)
      return
    }

    const { error: errorUsuario } = await supabase.from('usuarios').upsert(
      {
        id: user.id,
        email: user.email,
        nombre: user.email?.split('@')[0] ?? 'Usuario',
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    if (errorUsuario) {
      setError('No pudimos preparar tu cuenta: ' + errorUsuario.message)
      setCargando(false)
      return
    }

    const { data: pedidoCreado, error: errorPedido } = await supabase
      .from('pedidos')
      .insert({
        solicitante_id: user.id,
        categoria_slug: categoriaSlug,
        marca_vehiculo: grupoNombre === 'Automotor' ? (marcaVehiculo === 'Otra' ? marcaOtra.trim() || null : marcaVehiculo || null) : null,
        tipo_comercio: esComercio ? (tipoComercio === 'Otro' ? tipoComercioOtra.trim() || null : tipoComercio || null) : null,
        descripcion: descripcion.trim(),
        ubicacion_lat: lat,
        ubicacion_lng: lng,
        monto_ofrecido: aConvenir ? null : monto ? Number(monto) : null,
        monto_a_convenir: aConvenir,
        unidad_monto: 'trabajo',
        pide_videollamada_previa: pideVideollamada,
        es_comercio: esComercio,
        nombre_comercio: esComercio ? nombreComercio : null,
        jornada: esComercio ? jornada : 'changa',
        requisito_nivel_educativo: nivelRequerido || null,
        edad_minima: edadMinima ? Number(edadMinima) : null,
        requiere_carnet_conducir: requiereCarnet,
        categoria_carnet_requerida: requiereCarnet ? claseCarnet || null : null,
        idioma_requerido: requiereIdioma ? (idiomaRequerido === 'Otro' ? idiomaOtro.trim() || null : idiomaRequerido || null) : null,
        requiere_matricula_profesional: requiereMatricula,
        requisitos_adicionales: requisitosAdicionales.trim() || null,
        estado: 'abierto',
      })
      .select('id')
      .single()

    setCargando(false)

    if (errorPedido) {
      setError('No pudimos publicar el pedido: ' + errorPedido.message)
      return
    }

    // Avisamos a los prestadores interesados en esta categoría. No
    // bloqueamos ni mostramos error si esto falla — el pedido ya se
    // publicó bien, el push es un extra.
    if (pedidoCreado) {
      notificarPedidoCerca(pedidoCreado.id).catch(() => {})
    }

    router.push('/')
    router.refresh()
  }

  return (
    <PantallaBase>
      <div className="sin-limite-web" style={{ maxWidth: 420, margin: '0 auto', padding: '28px 20px 100px' }}>
        <LinkVolver href="/" />
        {/* En compu: panel amarillo fijo a la izquierda y el formulario a la derecha */}
        <div className="web-dos-columnas">
        <PanelFormulario
          titulo={'Contá qué necesitás'}
          texto={'Describí el trabajo y les avisamos al instante a los trabajadores de ese rubro en Comodoro.'}
          consejos={['Sé concreto: qué hay que hacer, cuándo y dónde.', 'Poné un monto o dejalo a convenir.', 'Si agregás la ubicación, te encuentran los que están cerca.', 'Podés publicar un trabajo cada 24 horas.']}
        />
        <div style={{ minWidth: 0 }}>
        <div className="solo-movil">
        <TituloPagina>Contá qué necesitás</TituloPagina>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          {/* Eje principal: cuánto dura el compromiso */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              background: COLORS.wrapperBg,
              borderRadius: 100,
              padding: 5,
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              onClick={() => setJornada('changa')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '11px 10px',
                borderRadius: 100,
                border: 'none',
                background: jornada === 'changa' ? COLORS.card : 'transparent',
                color: jornada === 'changa' ? COLORS.ink : COLORS.inkSoft,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: jornada === 'changa' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              🔧 Pedido puntual
            </button>
            <button
              type="button"
              onClick={() => setJornada('fulltime')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '11px 10px',
                borderRadius: 100,
                border: 'none',
                background: jornada !== 'changa' ? COLORS.card : 'transparent',
                color: jornada !== 'changa' ? COLORS.ink : COLORS.inkSoft,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: jornada !== 'changa' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              💼 Puesto fijo
            </button>
          </div>

          {jornada !== 'changa' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { valor: 'fulltime', label: 'Full time' },
                { valor: 'parttime', label: 'Part time' },
              ].map((op) => (
                <div key={op.valor} style={{ flex: 1 }}>
                  <Chip activo={jornada === op.valor} onClick={() => setJornada(op.valor as any)}>
                    {op.label}
                  </Chip>
                </div>
              ))}
            </div>
          )}

          <label style={{ ...checkboxRowStyle, marginBottom: esComercio ? 12 : 20 }}>
            <input type="checkbox" checked={esComercio} onChange={(e) => setEsComercio(e.target.checked)} />
            Publico en nombre de una empresa
          </label>

          {esComercio && (
            <>
              <input
                type="text"
                value={nombreComercio}
                onChange={(e) => setNombreComercio(e.target.value)}
                placeholder="Nombre de la empresa"
                style={{ ...inputBaseStyle, marginBottom: 14 }}
              />

              <p style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 600, margin: '0 0 8px' }}>
                ¿De qué rubro es? (opcional)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {['Ropa', 'Calzado', 'Kiosco / Almacén', 'Mueblería', 'Librería', 'Audio y tuning', 'Regalería y cotillón', 'Joyería', 'Café y restaurante', 'Repuestos', 'Otro'].map((tipo) => (
                  <Chip key={tipo} activo={tipoComercio === tipo} onClick={() => setTipoComercio(tipo)}>
                    {tipo}
                  </Chip>
                ))}
              </div>
              {tipoComercio === 'Otro' && (
                <input
                  type="text"
                  value={tipoComercioOtra}
                  onChange={(e) => setTipoComercioOtra(e.target.value)}
                  placeholder="¿Qué rubro?"
                  style={{ ...inputBaseStyle, marginBottom: 20 }}
                />
              )}
            </>
          )}

          <TituloSeccion>Categoría</TituloSeccion>
          <button
            type="button"
            onClick={() => setMostrarPicker(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              ...inputBaseStyle,
              marginBottom: 20,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {categoriaSlug ? (
              <>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: COLORS.iconBg,
                    color: COLORS.iconFg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {iconoParaCategoria(categoriaNombre)}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 600, color: COLORS.ink }}>{categoriaNombre}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: COLORS.inkSoft }}>{grupoNombre}</span>
                </span>
              </>
            ) : (
              <span style={{ color: COLORS.inkSoft, flex: 1 }}>Elegí una categoría</span>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.inkSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {mostrarPicker && (
            <CategoriaPicker
              grupos={grupos}
              onCerrar={() => setMostrarPicker(false)}
              onSeleccionar={(cat, grupo) => {
                setCategoriaSlug(cat.slug)
                setCategoriaNombre(cat.nombre)
                setGrupoNombre(grupo)
                setMostrarPicker(false)
              }}
            />
          )}

          {grupoNombre === 'Automotor' && (
            <>
              <TituloSeccion>Marca del vehículo (opcional)</TituloSeccion>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {['Ford', 'Chevrolet', 'Peugeot', 'Volkswagen', 'Fiat', 'Renault', 'Volvo', 'Nissan', 'Toyota', 'Citroën', 'Otra'].map((marca) => (
                  <Chip key={marca} activo={marcaVehiculo === marca} onClick={() => setMarcaVehiculo(marca)}>
                    {marca}
                  </Chip>
                ))}
              </div>
              {marcaVehiculo === 'Otra' && (
                <input
                  type="text"
                  value={marcaOtra}
                  onChange={(e) => setMarcaOtra(e.target.value)}
                  placeholder="¿Qué marca?"
                  style={{ ...inputBaseStyle, marginBottom: 20 }}
                />
              )}
            </>
          )}

          <TituloSeccion>{jornada === 'changa' ? 'Contanos con tus palabras' : 'Contanos del puesto'}</TituloSeccion>

          {jornada !== 'changa' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {['Administrativo/a', 'Atención al público', 'Gerente', 'Supervisor/a', 'Encargado/a', 'Vendedor/a', 'Operario/a', 'Recepcionista'].map((puesto) => (
                <button
                  key={puesto}
                  type="button"
                  onClick={() => setDescripcion(puesto)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 100,
                    border: `1.5px solid ${COLORS.line}`,
                    background: COLORS.card,
                    color: COLORS.inkSoft,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {puesto}
                </button>
              ))}
            </div>
          )}

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={
              jornada === 'changa'
                ? 'Ej: necesito que alguien me arregle una puerta de madera'
                : 'Ej: buscamos un administrativo con manejo de Excel y atención al público'
            }
            rows={4}
            style={{ ...inputBaseStyle, marginBottom: sugerencias.length > 0 ? 10 : 20, resize: 'vertical', lineHeight: 1.5 }}
          />

          {sugerencias.length > 0 && !categoriaSlug && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 600, margin: '0 0 8px' }}>
                ¿Es alguna de estas? Tocá para elegir
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {sugerencias.map((s) => (
                  <button
                    key={s.categoria.slug}
                    type="button"
                    onClick={() => elegirSugerencia(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 14px',
                      borderRadius: 100,
                      border: `1.5px solid ${COLORS.clay}`,
                      background: COLORS.card,
                      color: COLORS.clayDark,
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    {iconoParaCategoria(s.categoria.nombre)}
                    {s.categoria.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          <TituloSeccion>Monto</TituloSeccion>
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            disabled={aConvenir}
            placeholder="$"
            style={{ ...inputBaseStyle, marginBottom: 16, opacity: aConvenir ? 0.5 : 1 }}
          />

          <label style={checkboxRowStyle}>
            <input type="checkbox" checked={aConvenir} onChange={(e) => setAConvenir(e.target.checked)} />
            Prefiero dejarlo a convenir
          </label>

          <label style={{ ...checkboxRowStyle, marginBottom: 20 }}>
            <input type="checkbox" checked={pideVideollamada} onChange={(e) => setPideVideollamada(e.target.checked)} />
            Quiero hacer una videollamada antes de elegir
          </label>

          <TituloSeccion>Requisitos (opcional)</TituloSeccion>

          <Etiqueta>Nivel educativo requerido</Etiqueta>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { valor: '', label: 'Sin requisito' },
              { valor: 'secundario', label: 'Secundario' },
              { valor: 'terciario', label: 'Terciario' },
              { valor: 'universitario', label: 'Universitario' },
            ].map((op) => (
              <Chip
                key={op.valor || 'ninguno'}
                activo={nivelRequerido === op.valor}
                onClick={() => setNivelRequerido(op.valor)}
              >
                {op.label}
              </Chip>
            ))}
          </div>

          <Etiqueta>Edad mínima</Etiqueta>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {[
              { valor: '', label: 'Sin requisito' },
              { valor: '21', label: '21 o más' },
              { valor: '25', label: '25 o más' },
            ].map((op) => (
              <Chip key={op.valor || 'ninguna'} activo={edadMinima === op.valor} onClick={() => setEdadMinima(op.valor)}>
                {op.label}
              </Chip>
            ))}
          </div>
          <p style={{ fontSize: 12, color: COLORS.inkSoft, margin: '0 0 14px' }}>
            Pedila solo si el trabajo lo justifica (por ejemplo, manejar un vehículo). Todos en la app son mayores de 18.
          </p>

          <label style={{ ...checkboxRowStyle, marginBottom: requiereCarnet ? 8 : 14 }}>
            <input type="checkbox" checked={requiereCarnet} onChange={(e) => setRequiereCarnet(e.target.checked)} />
            Requiere carnet de conducir
          </label>

          {requiereCarnet && (
            <select
              value={claseCarnet}
              onChange={(e) => setClaseCarnet(e.target.value)}
              style={{ ...inputBaseStyle, marginBottom: 14 }}
            >
              <option value="">¿Qué clase específica?</option>
              {CLASES_CARNET.map((grupo) => (
                <optgroup key={grupo.grupo} label={grupo.grupo}>
                  {grupo.opciones.map((op) => (
                    <option key={op.valor} value={op.valor}>
                      {op.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}

          <label style={{ ...checkboxRowStyle, marginBottom: requiereIdioma ? 8 : 14 }}>
            <input type="checkbox" checked={requiereIdioma} onChange={(e) => setRequiereIdioma(e.target.checked)} />
            Requiere hablar un idioma en particular
          </label>

          {requiereIdioma && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {[...IDIOMAS_COMUNES, 'Otro'].map((idioma) => (
                  <Chip key={idioma} activo={idiomaRequerido === idioma} onClick={() => setIdiomaRequerido(idioma)}>
                    {idioma}
                  </Chip>
                ))}
              </div>
              {idiomaRequerido === 'Otro' && (
                <input
                  type="text"
                  value={idiomaOtro}
                  onChange={(e) => setIdiomaOtro(e.target.value)}
                  placeholder="¿Qué idioma?"
                  style={{ ...inputBaseStyle, marginBottom: 14 }}
                />
              )}
            </>
          )}

          <label style={{ ...checkboxRowStyle, marginBottom: 14 }}>
            <input type="checkbox" checked={requiereMatricula} onChange={(e) => setRequiereMatricula(e.target.checked)} />
            Requiere matrícula profesional vigente
          </label>

          <textarea
            value={requisitosAdicionales}
            onChange={(e) => setRequisitosAdicionales(e.target.value)}
            placeholder="Otros requisitos o certificaciones (ej: curso de manejo de autoelevador, matrícula profesional...)"
            rows={2}
            style={{ ...inputBaseStyle, marginBottom: 24, resize: 'vertical', lineHeight: 1.5 }}
          />

          <TituloSeccion>¿Dónde es? (opcional)</TituloSeccion>
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '-4px 0 12px', lineHeight: 1.4 }}>
            Si todavía no lo sabés, dejalo así nomás — lo podés charlar con el trabajador después. Sin ubicación, el trabajo no aparece en el mapa, pero sí en la lista.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              value={direccionTexto}
              onChange={(e) => setDireccionTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  buscarDireccion()
                }
              }}
              placeholder="Escribí una dirección (calle, número, ciudad)"
              style={{ ...inputBaseStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={buscarDireccion}
              disabled={buscandoDireccion || !direccionTexto.trim()}
              style={{
                padding: '0 18px',
                borderRadius: 14,
                border: 'none',
                background: COLORS.navActiveBg,
                color: COLORS.ink,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {buscandoDireccion ? '...' : 'Buscar'}
            </button>
          </div>

          <div style={{ textAlign: 'center', color: COLORS.inkSoft, fontSize: 12, margin: '6px 0 10px' }}>
            — o —
          </div>

          <button
            type="button"
            onClick={usarMiUbicacion}
            style={{
              ...inputBaseStyle,
              marginBottom: 10,
              textAlign: 'left',
              cursor: 'pointer',
              color: COLORS.inkSoft,
              fontWeight: 600,
            }}
          >
            📍 Usar mi ubicación actual
          </button>

          {lat !== null && (
            <MensajeExito>
              ✓ {direccionEncontrada ? direccionEncontrada : `Ubicación tomada (${lat.toFixed(3)}, ${lng?.toFixed(3)})`}
            </MensajeExito>
          )}

          {error && <MensajeError>{error}</MensajeError>}

          <BotonPrincipal type="submit" disabled={cargando}>
            {cargando ? 'Publicando...' : 'Publicar pedido'}
          </BotonPrincipal>
        </form>
        </div>
        </div>
      </div>
      <BottomNav />
    </PantallaBase>
  )
}