'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Globito de la campana: notificaciones sin leer del usuario de la sesión.
// Los mensajes tienen su propio botón, así que acá no cuentan.
// Si falta la columna leida (scripts/sql/2026-09-29-notificaciones-leidas.sql)
// devuelve 0.
export async function contarNotificacionesSinLeer(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await createAdminClient()
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .eq('leida', false)
    .neq('tipo', 'mensaje_nuevo');
  if (error) return 0;
  return count ?? 0;
}
