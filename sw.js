// Service Worker für Atlas Earth Tracker (PWA, Offline-Cache).
// WICHTIG: CACHE-Namen bei jedem Release mit der App-Version hochziehen,
// damit Nutzer das Update bekommen (alte Caches werden beim activate gelöscht).
const CACHE = 'ae-tracker-v0.5.0';
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
  const req = e.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Seiten: NETWORK-FIRST – online immer die aktuelle Version, offline aus dem Cache.
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(req).then(c => c || caches.match('AtlasEarthTracker.html')))
    );
    return;
  }

  // Statische Assets (Icon, Manifest): cache-first mit Laufzeit-Nachcaching.
  e.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => cached)
    )
  );
});
