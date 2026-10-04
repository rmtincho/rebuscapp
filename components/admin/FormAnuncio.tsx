'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearAnuncio, editarAnuncio } from '@/app/actions/adminAnuncios'
import { ESPACIOS_ANUNCIOS, formatosPara, type ColumnaImagen } from '@/lib/espaciosAnuncios'
import { leerEnlace, type AccionAnuncio } from '@/lib/enlaceAnuncio'
import { COLORS } from '@/lib/theme'
import { MensajeError, MensajeExito, inputBaseStyle, TituloSeccion, BotonPrincipal, Chip } from '@/lib/ui'

export type AnuncioEditable = {
  id: string
  anunciante: string | null
  espacios: string[]
  rubro: string | null
  enlace: string | null
  texto_alternativo: string | null
  desde: string | null
  hasta: string | null
  imagen_url: string | null
  imagen_horizontal_url: string | null
  imagen_lateral_url: string | null
}

const ACCIONES: { valor: AccionAnuncio; label: string }[] = [
  { valor: 'nada', label: 'Nada' },
  { valor: 'web', label: 'Abrir una página' },
  { valor: 'whatsapp', label: 'WhatsApp' },
  { valor: 'telefono', label: 'Llamar' },
]

const ayuda: React.CSSProperties = { fontSize: 12.5, color: COLORS.inkSoft, margin: '6px 2px 0', lineHeight: 1.45 }
const campo: React.CSSProperties = { marginBottom: 22 }

// Formulario para cargar un anuncio: nombre del negocio (opcional), en qué
// ubicaciones sale, una imagen por cada formato que usan esas ubicaciones
// (con vista previa en su proporción), qué pasa al tocarlo, rubro y fechas.
// Con `inicial` edita ese anuncio: las imágenes que ya tiene son opcionales.
export default function FormAnuncio({
  rubros,
  inicial,
}: {
  rubros: { slug: string; nombre: string }[]
  inicial?: AnuncioEditable
}) {
  // Cambiar la key vuelve el formulario a cero después de publicar
  const [version, setVersion] = useState(0)
  return <Formulario key={version} rubros={rubros} inicial={inicial} alPublicar={() => setVersion((v) => v + 1)} publicado={version > 0} />
}

function Formulario({
  rubros,
  inicial,
  alPublicar,
  publicado,
}: {
  rubros: { slug: string; nombre: string }[]
  inicial?: AnuncioEditable
  alPublicar: () => void
  publicado: boolean
}) {
  const router = useRouter()
  const accionInicial = leerEnlace(inicial?.enlace)
  const [espacios, setEspacios] = useState<string[]>(inicial?.espacios ?? [])
  const [accion, setAccion] = useState<AccionAnuncio>(accionInicial.accion)
  const [previews, setPreviews] = useState<Partial<Record<ColumnaImagen, string>>>({})
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatos = formatosPara(espacios)

  function alternarEspacio(valor: string) {
    setEspacios((prev) => (prev.includes(valor) ? prev.filter((e) => e !== valor) : [...prev, valor]))
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    const datos = new FormData(e.currentTarget)
    const resultado = inicial ? await editarAnuncio(inicial.id, datos) : await crearAnuncio(datos)
    setCargando(false)
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }
    if (inicial) {
      // Volver al panel sin el anuncio en edición
      router.push('/admin/anuncios')
    } else {
      alPublicar()
    }
    router.refresh()
  }

  return (
    <form onSubmit={enviar} style={{ background: COLORS.card, borderRadius: 14, padding: 20, boxShadow: COLORS.cardShadow }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0 0 18px' }}>
        <p style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{inicial ? 'Editar anuncio' : 'Nuevo anuncio'}</p>
        {inicial && (
          <a href="/admin/anuncios" style={{ fontSize: 13, color: COLORS.inkSoft }}>
            Cancelar
          </a>
        )}
      </div>

      <div style={campo}>
        <TituloSeccion>Nombre del negocio (opcional)</TituloSeccion>
        <input name="anunciante" defaultValue={inicial?.anunciante ?? ''} placeholder="Ferretería El Tornillo" style={inputBaseStyle} />
        <p style={ayuda}>Para reconocerlo en este panel. No se muestra en la app.</p>
      </div>

      <div style={campo}>
        <TituloSeccion>Ubicaciones</TituloSeccion>
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${COLORS.line}` }}>
          {ESPACIOS_ANUNCIOS.map((e) => {
            const marcado = espacios.includes(e.valor)
            return (
              <label
                key={e.valor}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 2px', borderBottom: `1px solid ${COLORS.line}`, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  name="espacios"
                  value={e.valor}
                  checked={marcado}
                  onChange={() => alternarEspacio(e.valor)}
                  style={{ width: 18, height: 18, marginTop: 1, accentColor: COLORS.dark, flexShrink: 0 }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, color: COLORS.ink }}>{e.label}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: COLORS.inkSoft }}>
                    {e.donde} · {e.dispositivo}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div style={campo}>
        <TituloSeccion>Imágenes</TituloSeccion>
        {formatos.length === 0 ? (
          <p style={{ ...ayuda, margin: 0 }}>Elegí las ubicaciones y acá aparecen las imágenes que hacen falta.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {formatos.map((f) => {
              const actual = inicial?.[f.columna] ?? null
              const vista = previews[f.columna] ?? actual
              const usadoEn = ESPACIOS_ANUNCIOS.filter((e) => e.formato === f.valor && espacios.includes(e.valor)).map((e) => e.label)
              return (
                <div key={f.valor}>
                  <p style={{ fontSize: 14, margin: '0 0 2px' }}>
                    {f.label} · <b>{f.medida}</b> px
                  </p>
                  <p style={{ ...ayuda, margin: '0 0 8px' }}>Para: {usadoEn.join(', ')}</p>
                  <div
                    style={{
                      aspectRatio: f.proporcion,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: COLORS.iconBg,
                      border: `1.5px dashed ${COLORS.line}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    {vista ? (
                      // eslint-disable-next-line @next/next/no-img-element -- vista previa local o imagen del storage
                      <img src={vista} alt={`Vista previa ${f.label}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Así se va a ver ({f.medida})</span>
                    )}
                  </div>
                  <input
                    name={f.campo}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const archivo = e.target.files?.[0]
                      setPreviews((p) => ({ ...p, [f.columna]: archivo ? URL.createObjectURL(archivo) : undefined }))
                    }}
                    style={{ fontSize: 13.5 }}
                  />
                  {actual && <p style={ayuda}>Subí otra solo si querés cambiarla.</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={campo}>
        <TituloSeccion>Al tocar el anuncio</TituloSeccion>
        <input type="hidden" name="accion" value={accion} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: accion === 'nada' ? 0 : 12 }}>
          {ACCIONES.map((a) => (
            <Chip key={a.valor} activo={accion === a.valor} onClick={() => setAccion(a.valor)}>
              {a.label}
            </Chip>
          ))}
        </div>
        {accion === 'nada' && <p style={ayuda}>Es solo una imagen: no se puede tocar y se miden solo las impresiones.</p>}
        {accion === 'web' && (
          <>
            <input name="url" defaultValue={accionInicial.url} placeholder="instagram.com/ferreteria o www.ferreteria.com" style={inputBaseStyle} />
            <p style={ayuda}>Se abre en otra pestaña.</p>
          </>
        )}
        {(accion === 'whatsapp' || accion === 'telefono') && (
          <>
            <input name="numero" inputMode="tel" defaultValue={accionInicial.numero} placeholder="297 4123456" style={inputBaseStyle} />
            <p style={ayuda}>Con código de área, sin 0 ni 15. Ej.: 297 4123456.</p>
          </>
        )}
        {accion === 'whatsapp' && (
          <div style={{ marginTop: 12 }}>
            <input
              name="mensaje"
              defaultValue={accionInicial.mensaje}
              placeholder="Hola, los vi en Rebuscapp y quería consultar..."
              style={inputBaseStyle}
            />
            <p style={ayuda}>Mensaje que ya aparece escrito al abrir el chat (opcional).</p>
          </div>
        )}
      </div>

      <div style={campo}>
        <TituloSeccion>Rubro (opcional)</TituloSeccion>
        <select name="rubro" defaultValue={inicial?.rubro ?? ''} style={inputBaseStyle}>
          <option value="">Para todos</option>
          {rubros.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.nombre}
            </option>
          ))}
        </select>
        <p style={ayuda}>Con rubro, sale cuando se miran trabajos de ese rubro (lista y detalle de un trabajo).</p>
      </div>

      <div style={{ ...campo, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <TituloSeccion>Desde</TituloSeccion>
          <input name="desde" type="date" defaultValue={inicial?.desde ?? ''} style={{ ...inputBaseStyle, padding: '13px 10px' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <TituloSeccion>Hasta</TituloSeccion>
          <input name="hasta" type="date" defaultValue={inicial?.hasta ?? ''} style={{ ...inputBaseStyle, padding: '13px 10px' }} />
        </div>
      </div>

      <div style={campo}>
        <TituloSeccion>Texto alternativo (opcional)</TituloSeccion>
        <input name="texto_alternativo" defaultValue={inicial?.texto_alternativo ?? ''} placeholder="Lo que dice el banner, para lectores de pantalla" style={inputBaseStyle} />
      </div>

      {error && <MensajeError>{error}</MensajeError>}
      {publicado && !error && !cargando && <MensajeExito>✓ Anuncio publicado</MensajeExito>}

      <BotonPrincipal type="submit" disabled={cargando}>
        {cargando ? 'Guardando...' : inicial ? 'Guardar cambios' : 'Publicar anuncio'}
      </BotonPrincipal>
    </form>
  )
}
