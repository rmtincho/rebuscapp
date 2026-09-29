import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompletarDatosForm from '@/components/CompletarDatosForm'

export default async function CompletarDatosPage({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>
}) {
  const { volver } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, apellido, edad, dni')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <CompletarDatosForm
      nombreActual={usuario?.nombre ?? ''}
      apellidoActual={usuario?.apellido ?? ''}
      edadActual={usuario?.edad ?? null}
      dniActual={usuario?.dni ?? ''}
      volverA={volver || '/'}
    />
  )
}