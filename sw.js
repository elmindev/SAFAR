// SAFAR service worker — only used when self-hosted (same origin). Caches the
// app shell for offline start. It does NOT cache live data (places, routes,
// weather, prices): those must never be presented as current when offline.
const CACHE = 'safar-shell-0.7.0';
const SHELL = ['./index.html', './manifest.webmanifest'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // never cache third-party data/tiles here
  // network-first for the shell: a new upload is served immediately; the cached copy only when offline
  e.respondWith(fetch(e.request).then((res) => { if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone())).catch(() => {}); return res; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
