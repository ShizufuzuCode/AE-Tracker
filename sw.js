// Service Worker für Atlas Earth Tracker (PWA, Offline-Cache).
// WICHTIG: CACHE-Namen bei jedem Release mit der App-Version hochziehen,
// damit Nutzer das Update bekommen (alte Caches werden beim activate gelöscht).
const CACHE = 'ae-tracker-v0.4.2';
const ASSETS = ['./', 'index.html', 'AtlasEarthTracker.html', 'reaktionstrainer.html', 'manifest.json', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Cache-first mit Netzwerk-Fallback; neue Antworten zur Laufzeit nachcachen.
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return resp;
      }).catch(() => cached)
    )
  );
});
