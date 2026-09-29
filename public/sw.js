// Service worker de Rebuscapp — maneja push notifications.
// Va en /public/sw.js para que quede servido en la raíz del sitio
// (necesario para que el scope cubra toda la app).

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { titulo: 'Rebuscapp', cuerpo: event.data.text() };
  }

  const titulo = payload.titulo || 'Rebuscapp';
  const opciones = {
    body: payload.cuerpo || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: {
      url: payload.url_destino || '/',
    },
    // vibración corta, útil en Android para que se note aunque el
    // celular esté en modo silencioso normal (no afecta "no molestar")
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

// Al tocar la notificación, abrir (o enfocar) la app en la pantalla
// correspondiente en vez de siempre abrir una pestaña nueva.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlDestino = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        // Si ya hay una pestaña de Rebuscapp abierta, la reusamos y navegamos.
        if ('focus' in client) {
          client.navigate(urlDestino);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlDestino);
      }
    })
  );
});