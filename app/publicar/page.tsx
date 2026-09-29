import { createClient } from '@/lib/supabase/server'
import PublicarPedidoForm from '@/components/PublicarPedidoForm'

export default async function PublicarPage() {
  const supabase = await createClient()

  const { data: grupos } = await supabase
    .from('categorias_grupo')
    .select('slug, nombre, categorias ( slug, nombre, requiere_matricula )')
    .order('nombre')

  return <PublicarPedidoForm grupos={grupos ?? []} />
}