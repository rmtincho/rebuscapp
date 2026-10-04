import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tipoEnlace } from '@/lib/enlaceAnuncio'

// Clic en un banner: se cuenta y se manda a donde diga el anuncio (una
// página, un WhatsApp o una llamada). Así se mide sin poner nada de
// seguimiento en la página.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: anuncio } = await admin.from('anuncios').select('enlace').eq('id', id).maybeSingle()
  const tipo = tipoEnlace(anuncio?.enlace)
  if (!anuncio?.enlace || !tipo) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  await admin.rpc('contar_anuncio', { anuncio_id: id, es_clic: true })

  if (tipo === 'web') return NextResponse.redirect(anuncio.enlace)

  // Llamada: no todos los navegadores siguen una redirección a tel:, así
  // que se abre desde una página mínima, con el número a la vista por las dudas
  const numero = anuncio.enlace.replace(/^tel:/, '')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Llamar</title><meta http-equiv="refresh" content="0;url=${anuncio.enlace}"></head><body style="font-family:sans-serif;text-align:center;padding:48px 16px"><p><a href="${anuncio.enlace}" style="font-size:20px">Llamar al ${numero}</a></p></body></html>`
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
