const CACHE_SCOPE_KEY = new URL(self.registration.scope).pathname
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-|-$/g, '') || 'root';
const IMAGE_CACHE_NAME = `mandatum-image-cache-v2-${CACHE_SCOPE_KEY}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.destination !== 'image') return;

  const requestUrl = new URL(request.url);
  const isCrossOriginCorsRequest = requestUrl.origin !== self.location.origin
    && request.mode !== 'no-cors';
  if (isCrossOriginCorsRequest) return;

  event.respondWith((async () => {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    try {
      const networkResponse = await fetch(request);
      const cacheableOpaqueResponse = networkResponse.type === 'opaque'
        && request.mode === 'no-cors';
      if (networkResponse.ok || cacheableOpaqueResponse) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const fallbackResponse = await cache.match(request);
      if (fallbackResponse) return fallbackResponse;
      throw error;
    }
  })());
});

