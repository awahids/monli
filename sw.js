const CACHE_NAME = 'monli-v2';
const CDN_CACHE = 'monli-cdn-v2';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS)),
      caches.open(CDN_CACHE).then(cache => Promise.allSettled(
        CDN_ASSETS.map(asset => cache.add(asset))
      ))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== CDN_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol === 'chrome-extension:') return;
  if (url.hostname.includes('script.google.com')) return;

  if (url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(cacheFirst(CDN_CACHE, request));
    return;
  }

  event.respondWith(cacheFirst(CACHE_NAME, request));
});

async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (_) {
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}
