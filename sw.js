const CACHE_NAME = 'net-kalkanim-v41';

// Mutlak yol (/) yerine göreceli yol (./) kullanarak alt klasör ve GitHub Pages uyumu sağlandı.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'
];

// Kurulum aşaması
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // APP_SHELL dosyalarını tek tek yakalayarak 404 hatasında tüm yapının patlamasını engelledik
      for (const file of APP_SHELL) {
        try {
          await cache.add(file);
        } catch (err) {
          console.warn('App Shell dosyası eklenemedi:', file, err);
        }
      }

      // CDN dosyalarını no-cors olarak önbelleğe alma
      for (const url of CDN_URLS) {
        try {
          const response = await fetch(url, { mode: 'no-cors' });
          await cache.put(url, response);
        } catch (err) {
          console.warn('CDN önbelleğe alınamadı:', url, err);
        }
      }
    })
  );
});

// Aktivasyon ve eski cache temizliği
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch yakalama ve Cache-First stratejisi
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return; // Chrome extension ve tarayıcı içi istekleri filtrele

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response) return response;
          
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
    })
  );
});
