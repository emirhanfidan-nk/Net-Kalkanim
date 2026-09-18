const CACHE_NAME = 'net-kalkanim-v40'; // Her deploy'da bu numarayı artırmayı unutma

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
      // ÖNEMLİ: fetch'i {cache: 'reload'} ile çağırıyoruz ki tarayıcının kendi HTTP
      // önbelleği araya girip bize eski bir index.html vermesin — gerçekten ağdan
      // taze kopya çekmesini garantiliyoruz.
      for (const file of APP_SHELL) {
        try {
          const response = await fetch(file, { cache: 'reload' });
          await cache.put(file, response);
        } catch (err) {
          console.warn('App Shell dosyası eklenemedi:', file, err);
        }
      }

      // CDN dosyalarını no-cors olarak önbelleğe alma (bunlar nadiren değiştiği için
      // normal fetch/cache davranışı yeterli).
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

// Fetch yakalama
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return; // Chrome extension ve tarayıcı içi istekleri filtrele

  const isNavigation =
    event.request.mode === 'navigate' ||
    event.request.url.endsWith('/') ||
    event.request.url.endsWith('/index.html');

  if (isNavigation) {
    // NETWORK-FIRST: Ana uygulama dosyası (index.html) için önce ağdan taze halini dene.
    // Böylece kod her güncellendiğinde kullanıcı bir sonraki açılışta anında yeni sürümü
    // görür — cache sadece internet yokken devreye giren bir yedek olur.
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html') || caches.match('./')))
    );
    return;
  }

  // CACHE-FIRST: CSS/JS/görsel gibi statik dosyalar için hız öncelikli, eskisi gibi.
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
          // Statik dosya offline'da yoksa sessizce geç
        });
    })
  );
});
