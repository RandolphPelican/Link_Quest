const CACHE_NAME = 'link-quest-v1';
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
  '/js/state.js',
  '/assets/characters/rogues.png',
  '/assets/characters/monsters.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});