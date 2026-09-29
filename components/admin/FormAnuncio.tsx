'use client'

import { useRef, useState } from 'react'
import { crearAnuncio } from '@/app/actions/adminAnuncios'
import { ESPACIOS_ANUNCIOS } from '@/lib/espaciosAnuncios'
import { COLORS } from '@/lib/theme'
import { MensajeError, MensajeExito, inputBaseStyle, TituloSeccion, BotonPrincipal } from '@/lib/ui'

// Formulario para cargar un anuncio: imagen (con vista previa en la
// proporción del espacio elegido), espacio, rubro, enlace y fechas.
export default function FormAnuncio({ rubros }: { rubros: { slug: string; nombre: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [espacio, setEspacio] = useState<string>(ESPACIOS_ANUNCIOS[0].valor)
  const [preview, setPreview] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  const info = ESPACIOS_ANUNCIOS.find((e) => e.valor === espacio)!

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    setListo(false)
    const resultado = await crearAnuncio(new FormData(e.currentTarget))
    setCargando(false)
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }
    formRef.current?.reset()
    setPreview(null)
    setListo(true)
  }

  const campo: React.CSSProperties = { marginBottom: 16 }

  return (
    <form
      ref={formRef}
      onSubmit={enviar}
      style={{ background: COLORS.card, borderRadius: 24, padding: 20, boxShadow: COLORS.cardShadow }}
    >
      <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px' }}>Nuevo anuncio</p>

      <div style={campo}>
        <TituloSeccion>Anunciante</TituloSeccion>
        <input name="anunciante" required placeholder="Ferretería El Tornillo" style={inputBaseStyle} />
      </div>

      <div style={campo}>
        <TituloSeccion>Espacio</TituloSeccion>
        <select name="espacio" value={espacio} onChange={(e) => setEspacio(e.target.value)} style={inputBaseStyle}>
          {ESPACIOS_ANUNCIOS.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.label}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '6px 2px 0' }}>
          {info.donde}. Imagen de <b>{info.medida}</b> px.
        </p>
      </div>

      <div style={campo}>
        <TituloSeccion>Imagen</TituloSeccion>
        <input
          name="imagen"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          onChange={(e) => {
            const f = e.target.files?.[0]
            setPreview(f ? URL.createObjectURL(f) : null)
          }}
          style={{ fontSize: 13.5 }}
        />
        <div
          style={{
            marginTop: 10,
            aspectRatio: info.proporcion,
            borderRadius: 16,
            overflow: 'hidden',
            background: COLORS.iconBg,
            border: `1.5px dashed ${COLORS.line}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local del archivo elegido
            <img src={preview} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>Así se va a ver ({info.medida})</span>
          )}
        </div>
      </div>

      <div style={campo}>
        <TituloSeccion>Enlace (opcional)</TituloSeccion>
        <input name="enlace" type="url" placeholder="https://instagram.com/..." style={inputBaseStyle} />
        <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '6px 2px 0' }}>
          A dónde lleva el toque. Sin enlace, el banner es solo una imagen: no se puede tocar y se miden solo las impresiones.
        </p>
      </div>

      <div style={campo}>
        <TituloSeccion>Rubro (opcional)</TituloSeccion>
        <select name="rubro" defaultValue="" style={inputBaseStyle}>
          <option value="">Para todos</option>
          {rubros.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.nombre}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '6px 2px 0' }}>
          Con rubro, sale cuando se miran trabajos de ese rubro (lista y detalle del pedido).
        </p>
      </div>

      <div style={{ ...campo, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <TituloSeccion>Desde</TituloSeccion>
          <input name="desde" type="date" style={{ ...inputBaseStyle, padding: '13px 10px' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <TituloSeccion>Hasta</TituloSeccion>
          <input name="hasta" type="date" style={{ ...inputBaseStyle, padding: '13px 10px' }} />
        </div>
      </div>

      <div style={campo}>
        <TituloSeccion>Texto alternativo (opcional)</TituloSeccion>
        <input name="texto_alternativo" placeholder="Lo que dice el banner, para lectores de pantalla" style={inputBaseStyle} />
      </div>

      {error && <MensajeError>{error}</MensajeError>}
      {listo && <MensajeExito>✓ Anuncio publicado</MensajeExito>}

      <BotonPrincipal type="submit" disabled={cargando}>
        {cargando ? 'Subiendo...' : 'Publicar anuncio'}
      </BotonPrincipal>
    </form>
  )
}
