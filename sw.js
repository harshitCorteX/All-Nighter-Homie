/* Cache only this app's public files. Notes, API calls and keys are never cached here. */
const CACHE = 'all-nighter-homie-v3-2';
const FILES = ['./', 'index.html', 'styles.css', 'core.js', 'app.js', 'manifest.webmanifest', 'assets/icon.svg', 'assets/homie-desk.svg'];
const url = relative => new URL(relative, self.registration.scope).href;
const allowed = new Set(FILES.map(url));
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(url))).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(name => name.startsWith('all-nighter-homie-') && name !== CACHE).map(name => caches.delete(name)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const target = new URL(event.request.url); target.hash = ''; target.search = '';
  if (!allowed.has(target.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      // Do not store redirected sign-in or error pages.
      if (response.ok && !response.redirected && response.type !== 'opaque') {
        await cache.put(target.href, response.clone());
      }
      return response;
    } catch {
      const cached = await cache.match(target.href);
      return cached || new Response('Your homie needs a connection for this file. Reconnect and reload.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});
