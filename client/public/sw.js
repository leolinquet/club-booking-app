/* Simple, production-safe PWA service worker
 * Strategy:
 * - HTML: network-first with cache fallback (SPA-friendly)
 * - Static assets (js/css/images): stale-while-revalidate
 * - Version bump CACHE_VERSION to invalidate old cache
 */
const CACHE_VERSION = 'v1.0.4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;

const APP_SHELL_GLOB = [
  '/',                 // your SPA entry
  '/manifest.webmanifest?v=5',
  '/web-app-manifest-192x192.png?v=5',
  '/web-app-manifest-512x512.png?v=5',
  '/apple-touch-icon.png?v=5',
  '/favicon-32x32.png?v=5',
  '/favicon.ico?v=5',
  '/sportsclubnet-high-resolution-logo.png'
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL_GLOB))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, HTML_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  // Treat navigations (SPA) as network-first, fallback to cache (then to offline index if needed)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const resp = await fetch(req);
          // cache the HTML entry for offline fallback
          try {
            const clone = resp.clone();
            const c = await caches.open(HTML_CACHE);
            c.put('/', clone).catch(() => {});
          } catch (err) {
            // ignore cache put errors
          }
          return resp;
        } catch (err) {
          // network failed, try cached '/' or '/index.html'
          const cached = await caches.match('/');
          if (cached) return cached;
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          // As a last resort return a minimal offline HTML Response (guaranteed Response object)
          return new Response('<!doctype html><meta charset="utf-8"><title>Offline</title><body><h1>Offline</h1></body>', {
            headers: { 'Content-Type': 'text/html' }, status: 503
          });
        }
      })()
    );
    return;
  }

  // For static assets: stale-while-revalidate
  const url = new URL(req.url);
  const isStatic =
    url.origin === location.origin &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.startsWith('/icons/'));

  if (isStatic) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((resp) => {
            if (resp && resp.ok) {
              const clone = resp.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, clone).catch(() => {}));
            }
            return resp;
          })
          .catch(() => cached); // offline → use cache
        return cached || network;
      })
    );
    return;
  }

  // Default: try network, fallback to cache, then minimal response
  event.respondWith(
    fetch(req).catch(() => {
      return caches.match(req).then(cached => {
        if (cached) return cached;
        // Return a minimal response as last resort
        return new Response('Resource not available offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
