/* Service Worker — BEM.ai Push Notifications */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

/* ── Push event — recebe notificacao do servidor ─────────────────────────── */
self.addEventListener('push', (event) => {
  let data = { title: 'BEM.ai', body: 'Lembrete da BEM para você!', icon: '/favicon.ico' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch { /* fallback defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.tag || 'bemai-reminder',
      renotify: true,
      data: { url: data.url || '/' },
    })
  )
})

/* ── Clique na notificacao — abre o app ──────────────────────────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
