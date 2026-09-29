import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PublicarPedidoForm from '@/components/PublicarPedidoForm'
import BottomNav from '@/components/BottomNav'
import { COLORS } from '@/lib/theme'
import { PantallaBase, LinkVolver, TituloPagina } from '@/lib/ui'
import { proximoPedidoPermitido, PEDIDOS_POR_DIA } from '@/lib/limites'
import { formatearCuando } from '@/lib/fechas'

export default async function PublicarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Si ya usó su cupo, se lo decimos antes de que complete el formulario
  const proximo = await proximoPedidoPermitido(user.id)
  if (proximo) {
    return (
      <PantallaBase>
        <div style={{ padding: 20 }}>
          <LinkVolver href="/" />
          <TituloPagina>Ofrecer un trabajo</TituloPagina>
          <div style={{ marginTop: 16, padding: 18, borderRadius: 16, background: COLORS.card, boxShadow: COLORS.cardShadow }}>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>
              Ya publicaste {PEDIDOS_POR_DIA === 1 ? 'un pedido' : `${PEDIDOS_POR_DIA} pedidos`} en las últimas 24 horas
            </p>
            <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.5 }}>
              Vas a poder publicar otro {formatearCuando(proximo)}. Mientras tanto, podés editar el que ya
              publicaste desde el inicio.
            </p>
          </div>
        </div>
        <BottomNav />
      </PantallaBase>
    )
  }

  const { data: grupos } = await supabase
    .from('categorias_grupo')
    .select('slug, nombre, categorias ( slug, nombre, requiere_matricula )')
    .order('nombre')

  return <PublicarPedidoForm grupos={grupos ?? []} />
}
