// Qubators offline shell. Solid-cache strategy, no build step.
// - App shell + /offline precached on install
// - GET same-origin non-API: network first, cache fallback, /offline for navigations
// - /api/* never cached (always fresh order data)
const CACHE = 'qubators-v1';
const OFFLINE = '/offline';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add(OFFLINE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  e.respondWith(
    (async () => {
      try {
        const res = await fetch(e.request);
        const cache = await caches.open(CACHE);
        cache.put(e.request, res.clone());
        return res;
      } catch (err) {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        if (e.request.mode === 'navigate') return caches.match(OFFLINE);
        throw err;
      }
    })()
  );
});
