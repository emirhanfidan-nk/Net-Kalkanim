const CACHE_NAME = 'net-kalkanim-v11';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// CDN'ler de cache'lensin ki tamamen offline çalışabilsin (zorunlu değil ama iyi olur)
const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'
];

// Kurulum aşamasında gerekli dosyaları önbelleğe al
self.addEventListener('install', event => {
	self. skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(APP_SHELL);
      // Çapraz kökenli CDN'leri no-cors modda cache'lemeyi dene
      for (let url of CDN_URLS) {
        try {
          const response = await fetch(url, { mode: 'no-cors' });
          if (response.ok || response.type === 'opaque') {
            cache.put(url, response);
          }
        } catch (err) {
          // Hata olursa boşver
        }
      }
    })
  );
});

// Eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // ⬅️ BU SATIRI EKLE
  );
});

// İstekleri cache-first stratejisiyle karşıla
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Sadece başarılı ve aynı kökenli cevapları cache'le
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Offline navigasyonda index.html göster
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
