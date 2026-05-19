const CACHE_NAME = 'chickenway-v5';
const BASE = self.location.pathname.replace(/\/[^/]*$/, '/'); // ex: /chickenway/

const STATIC_FILES = [
  BASE,
  BASE + 'index.html',
  BASE + 'style.css',
  BASE + 'script.js',
  BASE + 'auth.js',
  BASE + 'admin.js',
  BASE + 'pos.js',
  BASE + 'client.js',
  BASE + 'menutactile.js',
  BASE + 'db-cache.js',
  BASE + 'firebase-config.js',
  BASE + 'caissier.js',
  BASE + 'logo.png',
  BASE + 'background.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('firestore') || url.includes('googleapis')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
