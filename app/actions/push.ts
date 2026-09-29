'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Guarda la suscripción push de ESTE dispositivo a nombre del usuario
// logueado. La suscripción es del navegador, no de la cuenta: si en el
// mismo celular se entra con otra cuenta, el endpoint es el mismo y hay
// que pasárselo a la cuenta nueva. Desde el navegador RLS no deja tocar
// una fila de otro usuario, por eso se hace acá con el cliente admin,
// tomando el usuario de la sesión (nunca del cliente).
export async function guardarSuscripcionPush(sub: { endpoint: string; p256dh: string; auth: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'usuario no logueado' };

  const valido =
    typeof sub?.endpoint === 'string' &&
    sub.endpoint.startsWith('https://') &&
    sub.endpoint.length < 1000 &&
    typeof sub.p256dh === 'string' &&
    sub.p256dh.length < 200 &&
    typeof sub.auth === 'string' &&
    sub.auth.length < 100;
  if (!valido) return { ok: false as const, error: 'suscripción inválida' };

  const admin = createAdminClient();
  const { error } = await admin.from('push_subscriptions').upsert(
    {
      usuario_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    console.error('No se pudo guardar la suscripción push:', error.message);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}
