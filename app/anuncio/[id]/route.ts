import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Clic en un banner: se cuenta y se redirige al sitio del anunciante.
// Así se mide sin poner nada de seguimiento en la página.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: anuncio } = await admin.from('anuncios').select('enlace').eq('id', id).maybeSingle()
  if (!anuncio?.enlace || !/^https?:\/\//.test(anuncio.enlace)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  await admin.rpc('contar_anuncio', { anuncio_id: id, es_clic: true })
  return NextResponse.redirect(anuncio.enlace)
}
