// Service worker de Rebuscapp — maneja push notifications.
// Va en /public/sw.js para que quede servido en la raíz del sitio
// (necesario para que el scope cubra toda la app).

// Que una versión nueva de este archivo tome el control enseguida, y
// que controle también las pestañas ya abiertas (si no, al tocar una
// notificación no se puede navegar en ellas).
self.addEventListener('install', function () {
  self.skipWaiting();
});
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
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
      // Si ya hay una pestaña de Rebuscapp abierta, la reusamos: la
      // enfocamos y la llevamos a la pantalla de la notificación. Si no
      // se puede navegar en ella, abrimos una nueva.
      const abierta = windowClients.find((c) => 'focus' in c);
      if (abierta) {
        return abierta
          .focus()
          .then((c) => c.navigate(urlDestino))
          .catch(() => clients.openWindow(urlDestino));
      }
      return clients.openWindow(urlDestino);
    })
  );
});