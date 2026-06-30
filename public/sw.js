const CACHE_NAME = 'lagos-map-tiles-v1';
const MAP_HOSTS = [
  'wayback.maptiles.arcgis.com',
  'server.arcgisonline.com'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Cache-First Strategy for Map Tiles
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Cache only if it's a request to the ESRI Wayback or standard satellite tile server
  const isTileRequest = MAP_HOSTS.some(host => requestUrl.hostname.includes(host)) && requestUrl.pathname.includes('/tile/');

  if (isTileRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached tile immediately
            return cachedResponse;
          }

          // Fetch from network, cache it, and return
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // If offline and not cached, return transparent placeholder if possible, or just fail
          });
        });
      })
    );
  }
});
