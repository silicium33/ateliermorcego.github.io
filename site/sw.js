var CACHE_NAME = 'atelier-morcego-v1';
var BASE_PATH = new URL('./', self.location).pathname;
var CORE_URLS = [
  BASE_PATH,
  BASE_PATH + 'offline.html',
  BASE_PATH + 'assets/style.css',
  BASE_PATH + 'assets/main.js',
  BASE_PATH + 'assets/img/pwa-icon-192.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(CORE_URLS.map(function (url) {
        return fetch(url, { cache: 'reload' }).then(function (response) {
          if (!response.ok) throw new Error('Não foi possível armazenar o recurso offline: ' + url);
          return cache.put(url, response);
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(cacheNames.map(function (cacheName) {
        if (cacheName.indexOf('atelier-morcego-') === 0 && cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname.indexOf(BASE_PATH) !== 0) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response.ok) {
          var copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
            return cache.put(request, copy);
          }));
        }
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cachedPage) {
          return cachedPage || caches.match(BASE_PATH + 'offline.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cachedResource) {
      if (cachedResource) return cachedResource;
      return fetch(request).then(function (response) {
        if (response.ok) {
          var copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
            return cache.put(request, copy);
          }));
        }
        return response;
      });
    })
  );
});
