// Qala Saku service worker: makes the installed app open and show the last
// known data without a connection. Writes made offline are queued by the app
// itself (lib/offline-storage.ts) and synced when it is back online.

const STATIC = 'saku-static-v1'; // hashed build files, fonts, images
const PAGES = 'saku-pages-v1'; // HTML of pages, for offline navigation
const DATA = 'saku-data-v1'; // last API/Supabase reads; cleared on sign-out
const KEEP = [STATIC, PAGES, DATA];
// ponytail: plain entry cap per cache; switch to LRU if storage ever matters.
const MAX_STATIC = 300;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (!KEEP.includes(key)) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'warm') event.waitUntil(warm(event.data.urls || []));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(page(request));
  } else if (url.origin === location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC));
  } else if (url.origin === location.origin && /\.(?:png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC));
  } else if (isData(url)) {
    event.respondWith(networkFirst(request, DATA));
  }
});

/** Reads worth showing offline: app API routes and Supabase REST/user lookups. */
function isData(url) {
  if (url.origin === location.origin) {
    return url.pathname.startsWith('/api/') && url.pathname !== '/api/version';
  }
  return url.pathname.startsWith('/rest/v1/') || url.pathname === '/auth/v1/user';
}

async function page(request) {
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) {
      const cache = await caches.open(PAGES);
      await cache.put(stripSearch(request.url), response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(stripSearch(request.url), { cacheName: PAGES });
    return cached || offlinePage();
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { cacheName });
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { cacheName });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    trim(cache, MAX_STATIC);
  }
  return response;
}

async function trim(cache, max) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(keys.length - max, 0))) await cache.delete(key);
}

/**
 * Caches the main pages and the build files they load, so pages the user has
 * not opened in this session still work offline. A page goes in only after its
 * build files, so a cached page is always one that can render offline.
 */
async function warm(urls) {
  const pages = await caches.open(PAGES);
  const statics = await caches.open(STATIC);
  try {
    for (const url of urls) {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok || response.redirected) continue;
      const html = await response.clone().text();
      // Route groups put parentheses in chunk paths: app/(dashboard)/budgets/page-….js
      for (const [asset] of html.matchAll(/\/_next\/static\/[^"'\\\s]+?\.(?:js|css)/g)) {
        if (await statics.match(asset)) continue;
        const file = await fetch(asset);
        if (file.ok) await statics.put(asset, file);
      }
      await pages.put(url, response);
    }
  } catch {
    // Offline: try again next time.
  }
  trim(statics, MAX_STATIC);
}

function stripSearch(href) {
  const url = new URL(href);
  url.search = '';
  return url.href;
}

function offlinePage() {
  return new Response(
    `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · Qala Saku</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#F2EFE9;color:#1f2937;text-align:center;padding:24px">
<div><h1 style="font-size:20px">Kamu sedang offline</h1>
<p style="color:#6b7280">Halaman ini belum tersimpan di perangkat. Buka lagi saat terhubung ke internet.</p>
<p><a href="/dashboard" style="color:#14A7A0;font-weight:600">Ke Beranda</a></p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
