const CACHE = 'takvim-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => c.addAll(['./', './index.html', './manifest.json'])))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp.ok && e.request.url.startsWith(self.location.origin)) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {title: 'Takvim', body: 'Tamamlanmamış görevlerin var!'};
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'takvim-alert',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type: 'window'}).then(list => {
    const w = list.find(c => c.url.includes(self.location.origin));
    return w ? w.focus() : clients.openWindow('./');
  }));
});

// Page-triggered local notification (called from index.html via postMessage)
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [100, 50, 100],
      tag: 'takvim-alert',
      renotify: true
    });
  }
});
