const CACHE_NAME = 'bjt-j2-shell-v2';
const AUDIO_CACHE = 'bjt-j2-audio-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/date.js',
  './js/i18n.js',
  './js/router.js',
  './js/store.js',
  './js/audio.js',
  './js/srs.js',
  './js/quiz.js',
  './js/views/home.js',
  './js/views/part.js',
  './js/views/lesson.js',
  './js/views/vocab.js',
  './js/views/listening.js',
  './js/views/review.js',
  './js/views/progress.js',
  './js/views/settings.js',
  './data/index.json',
  './data/review-pool.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== AUDIO_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Audio: cache on demand
  if (url.pathname.includes('/audio/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res && res.status === 200) {
          cache.put(req, res.clone());
        }
        return res;
      })
    );
    return;
  }

  // App shell & JSON: cache-first, update in background
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
