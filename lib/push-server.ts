// Lógica de envío de push, corre SOLO en el servidor (server actions,
// route handlers, o funciones invocadas por triggers de Supabase).
// Nunca importar esto desde un componente de cliente.

import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin'; // cliente con service role key, ajustar path

webpush.setVapidDetails(
  // Contacto que ven los servicios de push (Google, Apple, Mozilla) si
  // hay problemas con nuestros envíos. Definir VAPID_SUBJECT en el entorno.
  process.env.VAPID_SUBJECT ?? 'mailto:soporte@rebuscapp.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export type TipoNotificacion =
  | 'pedido_cerca'
  | 'mensaje_nuevo'
  | 'postulacion_recibida'
  | 'postulante_elegido'
  | 'pedido_editado'
  | 'postulacion_rechazada';

interface EnviarPushParams {
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  urlDestino?: string;
}

// Uso típico:
// await enviarPush({
//   usuarioId: prestador.id,
//   tipo: 'pedido_cerca',
//   titulo: 'Nuevo pedido cerca tuyo',
//   cuerpo: 'Alguien necesita un plomero en tu zona',
//   urlDestino: `/pedidos/${pedido.id}`,
// });
export async function enviarPush({ usuarioId, tipo, titulo, cuerpo, urlDestino }: EnviarPushParams) {
  const supabase = createAdminClient();

  // 1. Guardamos la notificación en la tabla (esto alimenta también
  //    la "notificación pasiva" — badges dentro de la app — aunque
  //    el push en sí falle o el usuario no tenga suscripción activa).
  const { data: notif, error: errorInsert } = await supabase
    .from('notificaciones')
    .insert({
      usuario_id: usuarioId,
      tipo,
      titulo,
      cuerpo,
      url_destino: urlDestino ?? null,
    })
    .select()
    .single();

  if (errorInsert) {
    console.error('Error guardando notificación:', errorInsert.message);
  }

  // 2. Buscamos todas las suscripciones push del usuario (puede tener
  //    varias: celular, compu, etc.) y le mandamos el push a todas.
  const { data: suscripciones, error: errorSubs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('usuario_id', usuarioId);

  if (errorSubs || !suscripciones || suscripciones.length === 0) {
    // No tiene push activado — no pasa nada, ya quedó guardada la
    // notificación pasiva en la tabla.
    return { pasiva: true, push: false };
  }

  const payload = JSON.stringify({ titulo, cuerpo, url_destino: urlDestino });

  const resultados = await Promise.allSettled(
    suscripciones.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  );

  // Si algún endpoint quedó vencido (410 Gone / 404), lo borramos —
  // pasa cuando el usuario desinstaló la PWA o borró el navegador.
  await Promise.all(
    resultados.map(async (resultado, i) => {
      if (
        resultado.status === 'rejected' &&
        (resultado.reason?.statusCode === 410 || resultado.reason?.statusCode === 404)
      ) {
        await supabase.from('push_subscriptions').delete().eq('id', suscripciones[i].id);
      }
    })
  );

  if (notif) {
    await supabase.from('notificaciones').update({ enviada_push: true }).eq('id', notif.id);
  }

  return { pasiva: true, push: true };
}