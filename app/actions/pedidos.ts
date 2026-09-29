'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Cierra un trabajo en curso, como "completado" (al calificar) o como
// "no concretado". Lo puede hacer cualquiera de las dos partes, pero RLS
// solo deja actualizar el pedido a quien lo publicó: por eso se hace acá
// con el cliente admin, después de verificar que quien llama es parte
// del trabajo y ya dejó su calificación o su reporte.
export async function cerrarPedido(pedidoId: string, resultado: 'completado' | 'no_concretado') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Tu sesión expiró, volvé a loguearte.' };

  const admin = createAdminClient();

  const { data: pedido } = await admin
    .from('pedidos')
    .select('estado, solicitante_id, prestador_asignado_id')
    .eq('id', pedidoId)
    .maybeSingle();

  if (!pedido || ![pedido.solicitante_id, pedido.prestador_asignado_id].includes(user.id)) {
    return { ok: false as const, error: 'No encontramos este trabajo.' };
  }

  const estadoNuevo = resultado === 'completado' ? 'completado' : 'cancelado';
  if (pedido.estado === estadoNuevo) return { ok: true as const };
  if (pedido.estado !== 'en_curso') {
    return { ok: false as const, error: 'Este trabajo ya estaba cerrado.' };
  }

  // Tiene que existir la calificación o el reporte de quien cierra
  const { data: respaldo } =
    resultado === 'completado'
      ? await admin
          .from('calificaciones')
          .select('id')
          .eq('pedido_id', pedidoId)
          .eq('calificador_id', user.id)
          .limit(1)
          .maybeSingle()
      : await admin
          .from('no_concretados')
          .select('id')
          .eq('pedido_id', pedidoId)
          .eq('reportado_por', user.id)
          .limit(1)
          .maybeSingle();

  if (!respaldo) return { ok: false as const, error: 'No pudimos cerrar el trabajo.' };

  const { error } = await admin
    .from('pedidos')
    .update({ estado: estadoNuevo, fecha_cierre: new Date().toISOString() })
    .eq('id', pedidoId)
    .eq('estado', 'en_curso');

  if (error) {
    console.error('No se pudo cerrar el pedido:', error.message);
    return { ok: false as const, error: 'No pudimos actualizar el trabajo: ' + error.message };
  }
  return { ok: true as const };
}
