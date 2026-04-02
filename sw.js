const CACHE_NAME = 'link-quest-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/maker.css',
  '/js/engine.js',
  '/js/main.js',
  '/js/maker.js',
  '/js/player.js',
  '/js/room.js',
  '/js/state.js'
];

// Install: Cache new assets
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force activation
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: Clean up OLD caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch: Try network first, then cache (Better for development)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});