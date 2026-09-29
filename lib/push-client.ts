// Lógica de suscripción a push, corre en el navegador.
// Se usa desde la pantalla de "activar notificaciones"
// (la que ya tenés mockeada como notificaciones.html).

import { createClient } from '@/lib/supabase/client';
import { guardarSuscripcionPush } from '@/app/actions/push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

// Convierte la public key de base64url a Uint8Array, formato que
// pide la Push API del navegador.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);

  // Construido a partir de un ArrayBuffer explícito (no SharedArrayBuffer),
  // así el tipo queda Uint8Array<ArrayBuffer> y matchea lo que pide
  // PushSubscriptionOptionsInit.applicationServerKey.
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function pushSoportado(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

// true / false / null (null = el usuario nunca contestó el permiso del navegador)
export function estadoPermiso(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  return Notification.permission;
}

export async function activarNotificaciones(): Promise<
  { ok: true } | { ok: false; motivo: 'no_soportado' | 'permiso_denegado' | 'error'; detalle?: string }
> {
  if (!pushSoportado()) {
    return { ok: false, motivo: 'no_soportado' };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      return { ok: false, motivo: 'permiso_denegado' };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const subJson = subscription.toJSON();

    // Guardamos la suscripción asociada al usuario logueado (en el
    // servidor, para poder reasignarla si este dispositivo antes
    // estaba con otra cuenta).
    const resultado = await guardarSuscripcionPush({
      endpoint: subJson.endpoint!,
      p256dh: subJson.keys!.p256dh,
      auth: subJson.keys!.auth,
    });

    if (!resultado.ok) {
      return { ok: false, motivo: 'error', detalle: resultado.error };
    }

    marcarDesactivado(false);
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: 'error', detalle: e instanceof Error ? e.message : String(e) };
  }
}

// Si el permiso ya está concedido, vuelve a guardar la suscripción de
// este dispositivo a nombre del usuario actual, sin mostrar ningún
// popup. Cubre dos casos: que el guardado haya fallado antes, y que en
// este celular se haya entrado con otra cuenta.
// Si el usuario tocó "Desactivar" en este dispositivo, no lo
// reactivamos solos.
const CLAVE_DESACTIVADO = 'rebuscapp_push_desactivado';

function marcarDesactivado(valor: boolean) {
  try {
    if (valor) localStorage.setItem(CLAVE_DESACTIVADO, '1');
    else localStorage.removeItem(CLAVE_DESACTIVADO);
  } catch {}
}

function estaDesactivado() {
  try {
    return localStorage.getItem(CLAVE_DESACTIVADO) === '1';
  } catch {
    return false;
  }
}

export async function sincronizarNotificaciones() {
  if (!pushSoportado() || estadoPermiso() !== 'granted' || estaDesactivado()) return null;
  return activarNotificaciones();
}

// Para cuando el usuario desactiva las notificaciones desde configuración.
export async function desactivarNotificaciones(): Promise<void> {
  if (!pushSoportado()) return;
  marcarDesactivado(true);

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    const supabase = createClient();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
}