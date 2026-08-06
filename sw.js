// Service worker de "Trivial a medida"
// Necesario para que Chrome/Android considere la web instalable como app,
// y de paso permite abrir el juego sin conexión una vez visitado una vez.

const CACHE_NAME = 'trivial-a-medida-v1';
const APP_SHELL = [
  './',
  './index.html',
  './trivial-a-medida.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // si algún recurso falla al precachear, no bloquear la instalación
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Solo cacheamos respuestas válidas del mismo origen
          if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // sin red y sin caché: deja que falle de forma natural
    })
  );
});
