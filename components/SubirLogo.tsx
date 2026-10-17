'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COLORS } from '@/lib/theme'

// Logo de la empresa, al publicar o editar un trabajo "en nombre de una
// empresa". Se sube al bucket "logos", en la carpeta del usuario
// (scripts/sql/2026-10-16-logo-empresa.sql), y se guarda la URL en el pedido.
// Nombre nuevo cada vez: así no queda en caché el logo anterior.

const MAX_MB = 2

export default function SubirLogo({ url, onChange }: { url: string | null; onChange: (url: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) return setError('Elegí un archivo de imagen.')
    if (archivo.size > MAX_MB * 1024 * 1024) return setError(`El logo no puede pesar más de ${MAX_MB}MB.`)

    setSubiendo(true)
    setError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSubiendo(false)
      return setError('Tu sesión expiró, volvé a loguearte.')
    }

    const extension = (archivo.name.split('.').pop() || 'png').toLowerCase()
    const ruta = `${user.id}/${Date.now()}.${extension}`
    const { error: errorSubida } = await supabase.storage.from('logos').upload(ruta, archivo, { contentType: archivo.type })
    setSubiendo(false)
    if (errorSubida) return setError('No pudimos subir el logo: ' + errorSubida.message)

    onChange(supabase.storage.from('logos').getPublicUrl(ruta).data.publicUrl)
  }

  const boton: React.CSSProperties = {
    border: `1.5px solid ${COLORS.line}`,
    background: COLORS.card,
    borderRadius: 100,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: COLORS.ink,
    cursor: 'pointer',
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: COLORS.card,
            border: `1.5px ${url ? 'solid' : 'dashed'} ${COLORS.line}`,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.inkSoft,
            fontSize: 11,
          }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo subido al storage de Supabase
            <img src={url} alt="Logo de la empresa" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            'Logo'
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => input.current?.click()} disabled={subiendo} style={boton}>
            {subiendo ? 'Subiendo...' : url ? 'Cambiar logo' : 'Subir logo (opcional)'}
          </button>
          {url && !subiendo && (
            <button type="button" onClick={() => onChange(null)} style={{ ...boton, border: 'none', background: 'none', color: COLORS.inkSoft }}>
              Quitar
            </button>
          )}
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={elegir} style={{ display: 'none' }} />
      </div>
      {error && <p style={{ color: COLORS.red, fontSize: 13, fontWeight: 500, margin: '8px 0 0' }}>{error}</p>}
    </div>
  )
}
