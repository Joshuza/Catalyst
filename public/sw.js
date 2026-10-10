/* Phase 0: cache the shell and same-origin static assets only. */
const cacheName = 'nexus-shell-pages-v2';
const shell = [
  '/',
  '/index.html',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      await cache.addAll(shell);
      const index = await cache.match('/index.html');
      if (!index) throw new Error('Shell was not cached.');
      const html = await index.text();
      const assets = [...html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css))"/g)]
        .map((match) => new URL(match[1], self.location.origin))
        .filter((url) => url.origin === self.location.origin)
        .map((url) => url.href);
      await cache.addAll(assets);
      const manifest = await fetch('/precache.json');
      if (!manifest.ok)
        throw new Error('Offline asset manifest was not available.');
      const chunks = await manifest.json();
      if (
        !Array.isArray(chunks) ||
        chunks.some(
          (path) =>
            typeof path !== 'string' ||
            !path.startsWith('/assets/') ||
            path.includes('..'),
        )
      )
        throw new Error('Invalid offline asset manifest.');
      await cache.addAll(chunks);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith('nexus-shell-') && name !== cacheName)
          await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin)
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(cacheName)
              .then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }
        return new Response('Offline asset unavailable.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      }),
  );
});
