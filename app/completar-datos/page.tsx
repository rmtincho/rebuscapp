import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // Edad y DNI no son públicos (ver scripts/sql/2026-09-29-seguridad-rls.sql):
  // los datos propios se leen con el cliente admin, siempre filtrando por
  // el usuario de la sesión.
  const { data: usuario } = await createAdminClient()
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