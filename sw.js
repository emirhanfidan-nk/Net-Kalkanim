// Sürüm numarasını artık elle değiştirmen gerekmiyor: uygulama dosyaları her açılışta
// internetten kontrol edilir, internet yoksa kayıtlı kopya kullanılır.
const CACHE_NAME = 'net-kalkanim-v66';

const APP_SHELL = [
  './',
  './index.html',
  './duzeltme.js',
  './yedek.js',
  './profil.js',
  './kamera.js',
  './duzen.js',
  './animasyon.js',
  './hoca.js',
  './analiz.js',
  './bildirim.js',
  './ayarlar.js',
  './oyunlastirma.js',
  './paylas.js',
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

// Kurulum
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const file of APP_SHELL) {
        try {
          await cache.add(new Request(file, { cache: 'reload' }));
        } catch (err) {
          console.warn('App Shell dosyası eklenemedi:', file, err);
        }
      }
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

// Aktivasyon ve eski önbellek temizliği
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== 'nk-share').map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Kendi dosyalarımız: önce internet (hep güncel), 4 saniyede gelmezse ya da internet yoksa kayıtlı kopya.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('zaman aşımı')), 4000))
    ]);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const page = (await cache.match('./index.html')) || (await cache.match('./'));
      if (page) return page;
    }
    throw err;
  }
}

// Dış kaynaklar (CDN): önce kayıtlı kopya
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response) {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
  }
  return response;
}

// Android "Paylaş" menüsünden (ör. Gemini) gelen metin/görseli sakla, uygulamaya yönlendir.
async function handleShare(request) {
  try {
    const fd = await request.formData();
    const cache = await caches.open('nk-share');
    const data = { title: String(fd.get('title') || ''), text: String(fd.get('text') || ''), url: String(fd.get('url') || ''), t: Date.now() };
    await cache.put('/__share/data', new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }));
    const img = fd.get('image');
    if (img && typeof img !== 'string' && img.size) {
      await cache.put('/__share/image', new Response(img, { headers: { 'Content-Type': img.type || 'image/jpeg' } }));
    } else {
      await cache.delete('/__share/image');
    }
  } catch (e) { /* paylaşım okunamadı, yine de uygulamayı aç */ }
  return Response.redirect('/?shared=1', 303);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method === 'POST' && new URL(req.url).pathname === '/share-target') {
    event.respondWith(handleShare(req));
    return;
  }
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;
  // Bulut yedek ve lisans sunucusu istekleri asla önbelleğe alınmasın
  if (req.url.includes('.supabase.co') || req.url.includes('firebaseio.com')) return;

  const sameOrigin = new URL(req.url).origin === self.location.origin;
  event.respondWith(sameOrigin ? networkFirst(req) : cacheFirst(req));
});

// Günlük hatırlatma bildirimi
self.addEventListener('push', event => {
  let data = { title: 'Net Kalkanım', body: 'Bugün tekrar zamanı!', url: './' };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './logo.png',
      badge: './logo.png',
      tag: 'nk-daily',
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
