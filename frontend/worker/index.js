// S5-07: Custom service worker additions — merged by next-pwa into sw.js

// ── Push event handler ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'BlueWork', body: event.data.text() };
  }

  const title   = payload.title ?? 'BlueWork';
  const options = {
    body:  payload.body ?? '',
    icon:  '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data:  payload,
    tag:   payload.type ?? 'default',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));

  // Inform open clients to refresh their unread badge
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'PUSH_RECEIVED' }));
    })
  );
});

// ── Notification click — open the app ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((c) => c.url.includes(self.registration.scope));
      if (existingClient) {
        existingClient.focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
