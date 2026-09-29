import { redirect } from 'next/navigation'

// Esta pantalla ya no existe como tal — los postulantes ahora se
// muestran integrados en el detalle del pedido. Si algo viejo todavía
// apunta acá (un link guardado, una notificación vieja), lo mandamos
// al lugar correcto.
export default async function PostulantesPageRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/pedidos/${id}`)
}