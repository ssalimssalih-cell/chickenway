const CACHE_NAME = 'chickenway-v3';
const STATIC_ASSETS = [
  '.',
  'index.html',
  'style.css',
  'script.js',
  'auth.js',
  'admin.js',
  'pos.js',
  'client.js',
  'menutactile.js',
  'db-cache.js',
  'firebase-config.js',
  'caissier.js',
  'logo.png',
  'background.jpg'
];

const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage-compat.js'
];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Ajouter les assets locaux avec gestion des erreurs individuelles
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => cache.add(asset).catch(e => console.warn(`Échec cache ${asset}:`, e)))
        ).then(() => 
          Promise.allSettled(
            EXTERNAL_ASSETS.map(url => cache.add(url).catch(e => console.warn(`Échec cache externe ${url}:`, e)))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de fetch : cache d'abord, puis réseau, fallback sur index.html
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Exclure les appels Firestore (traités par IndexedDB)
  if (url.pathname.includes('/firestore') || url.hostname.includes('firestore')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Stratégie : Cache d'abord (pour les ressources statiques)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          // Mettre en cache les nouvelles ressources récupérées
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        }).catch(error => {
          // En cas d'échec réseau, retourner la page d'accueil en fallback
          console.warn('Fetch échoué, fallback index.html', event.request.url);
          return caches.match('index.html');
        });
      })
  );
});
