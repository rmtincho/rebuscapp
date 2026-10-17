import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PublicarPedidoForm from '@/components/PublicarPedidoForm'
import BottomNav from '@/components/BottomNav'
import { COLORS } from '@/lib/theme'
import { PantallaBase, LinkVolver, TituloPagina } from '@/lib/ui'
import { proximoPedidoPermitido, PEDIDOS_POR_DIA } from '@/lib/limites'
import { formatearCuando } from '@/lib/fechas'
import { faltanDatosBasicos } from '@/lib/datosBasicos'

export default async function PublicarPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>
}) {
  const { empresa } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Para publicar, los mismos datos básicos que para postularse (nombre,
  // edad y DNI). Al completarlos vuelve acá, con lo que traía.
  if (await faltanDatosBasicos(user.id)) {
    const volver = empresa === 'true' ? '/publicar?empresa=true' : '/publicar'
    redirect(`/completar-datos?para=publicar&volver=${encodeURIComponent(volver)}`)
  }

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

  const [{ data: grupos }, { data: yo }, { data: ultimaEmpresa }] = await Promise.all([
    supabase
      .from('categorias_grupo')
      .select('slug, nombre, categorias ( slug, nombre, requiere_matricula )')
      .order('nombre'),
    supabase.from('usuarios').select('foto_perfil_url').eq('id', user.id).maybeSingle(),
    // Si ya publicó como empresa, el nombre, el logo y la imagen elegida
    // vienen cargados la próxima vez
    supabase
      .from('pedidos')
      .select('nombre_comercio, imagen_empresa, logo_comercio_url')
      .eq('solicitante_id', user.id)
      .eq('es_comercio', true)
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <PublicarPedidoForm
      grupos={grupos ?? []}
      fotoPerfil={yo?.foto_perfil_url ?? null}
      empresaAnterior={ultimaEmpresa ?? null}
    />
  )
}
