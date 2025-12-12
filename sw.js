const CACHE_NAME = 'hokm-v1';
const urlsToCache = [
  '/hokm',
  '/hokm/index.html',
  '/hokm/manifest.json',
  '/hokm/icon-192.png',
  '/hokm/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
