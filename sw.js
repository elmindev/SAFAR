// Versioned, scope-local shell. User data lives in IndexedDB; never cleared here.
const ROOT = new URL('./', self.location.href);
const PREFIX = 'safar-shell-' + ROOT.pathname + '-';
const CACHE = PREFIX + '0.15.1';
const SHELL = ['index.html', 'manifest.webmanifest'].map(p => new URL(p, ROOT).href);
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && (k.startsWith(PREFIX) || /^safar-shell-\d+\.\d+\.\d+$/.test(k))).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  const relative = url.pathname.slice(ROOT.pathname.length);
  const shell = relative === '' || relative === 'index.html' || relative === 'manifest.webmanifest';
  const asset = /^(audio|ocr)\/[\w./-]+$/.test(relative);
  if (!shell && !asset) return; // never cache arbitrary same-origin documents or API data
  const key = new URL(relative === '' ? 'index.html' : relative, ROOT).href;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const response = await fetch(e.request);
      if (response.ok) { try { await c.put(key, response.clone()); } catch {} }
      if (!response.ok && shell) { const old = await c.match(key); if (old) return old; }
      return response;
    } catch {
      return (await c.match(key)) || new Response('SAFAR: ovaj resurs nije spremljen za offline.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
