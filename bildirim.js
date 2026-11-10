/* Net Kalkanım - Günlük Hatırlatma Bildirimi
   Ayarlar'a bir kart ekler. Açılınca her gün seçilen saatte "Bugün X soru ve Y not tekrarın var" bildirimi gelir.
   Bildirim kullanıcının kurtarma koduna bağlanır, yani yedeklenen veriden sayılır ve telefon değişse bile devam eder. */
(function () {
  'use strict';

  var SB_URL = 'https://bswhmwgcytxitdhvvuok.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzd2htd2djeXR4aXRkaHZ2dW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NjgzMTksImV4cCI6MjEwNjM0NDMxOX0.RrH67fDFVHxBZZJ7PKH46JSuLHd57y0EAWXXm5_w1TQ';
  var FN = SB_URL + '/functions/v1/send-reminders';
  var LS_HOUR = 'nk_push_hour';

  function supported() {
    return ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
  }
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;

  function getHour() {
    var h = parseInt(localStorage.getItem(LS_HOUR) || '20', 10);
    return (h >= 5 && h <= 23) ? h : 20;
  }
  function getCode() {
    try { if (window.__nkBackup) return window.__nkBackup.getCode(); } catch (e) {}
    try { return localStorage.getItem('nk_code') || ''; } catch (e) { return ''; }
  }

  async function rpc(name, body) {
    var r = await fetch(SB_URL + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(name + ' ' + r.status);
  }
  async function callFn(body) {
    var r = await fetch(FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    var j = {};
    try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(j.error || ('hata ' + r.status));
    return j;
  }
  function b64uToBytes(s) {
    var pad = '='.repeat((4 - s.length % 4) % 4);
    var b = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  }

  async function currentSub() {
    if (!supported()) return null;
    try {
      var reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    } catch (e) { return null; }
  }

  async function saveSub(sub) {
    var code = getCode();
    if (!code || code.length < 16) throw new Error('kod yok');
    await rpc('nk_push_save', { p_code: code, p_sub: sub.toJSON(), p_hour: getHour() });
  }

  async function enable() {
    if (!supported()) { showToast('Bu tarayıcı bildirimleri desteklemiyor.', true); return; }
    if (isIOS && !standalone) {
      showToast('iPhone\'da önce uygulamayı ana ekrana ekleyip oradan aç.', true);
      return;
    }
    try {
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        showToast('Bildirim izni verilmedi. Telefon ayarlarından izin verebilirsin.', true);
        await refresh();
        return;
      }
      var reg = await navigator.serviceWorker.ready;
      var kr = await callFn({ action: 'public_key' });
      var sub = await reg.pushManager.getSubscription();
      if (!sub) {
        try {
          sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(kr.key) });
        } catch (e1) {
          // eski bir abonelik anahtar uyuşmazlığı yapıyorsa temizleyip tekrar dene
          var old = await reg.pushManager.getSubscription();
          if (old) await old.unsubscribe();
          sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(kr.key) });
        }
      }
      await saveSub(sub);
      showToast('Hatırlatma açıldı!');
    } catch (e) {
      console.warn('Bildirim açılamadı:', e);
      showToast('Bildirim açılamadı. İnternetini kontrol edip tekrar dene.', true);
    }
    await refresh();
  }

  async function disable() {
    try {
      var sub = await currentSub();
      if (sub) {
        var ep = sub.endpoint;
        await sub.unsubscribe();
        try { await rpc('nk_push_remove', { p_code: getCode(), p_endpoint: ep }); } catch (e) {}
      }
      showToast('Hatırlatma kapatıldı.');
    } catch (e) {
      showToast('Kapatılamadı, tekrar dene.', true);
    }
    await refresh();
  }

  async function sendTest() {
    try {
      var sub = await currentSub();
      if (!sub) { showToast('Önce hatırlatmayı aç.', true); return; }
      await saveSub(sub);
      showToast('Test gönderiliyor...');
      await callFn({ action: 'test', code: getCode(), endpoint: sub.endpoint });
    } catch (e) {
      showToast('Test gönderilemedi: ' + e.message, true);
    }
  }

  /* ---------- Arayüz ---------- */
  function hourLabel(h) { return String(h).padStart(2, '0') + ':00'; }

  async function refresh() {
    var st = document.getElementById('nk-push-status');
    var btn = document.getElementById('nk-push-toggle');
    var sel = document.getElementById('nk-push-hour');
    var test = document.getElementById('nk-push-test');
    if (!st || !btn) return;

    if (!supported()) {
      st.textContent = isIOS && !standalone
        ? 'iPhone\'da bildirim için önce uygulamayı ana ekrana ekleyip oradan açmalısın.'
        : 'Bu tarayıcı bildirimleri desteklemiyor.';
      btn.classList.add('hidden'); sel.parentNode.classList.add('hidden'); test.classList.add('hidden');
      return;
    }
    if (isIOS && !standalone) {
      st.textContent = 'iPhone\'da bildirim için önce uygulamayı ana ekrana ekleyip oradan açmalısın.';
      btn.classList.add('hidden'); sel.parentNode.classList.add('hidden'); test.classList.add('hidden');
      return;
    }
    var sub = await currentSub();
    var granted = Notification.permission === 'granted';
    sel.value = String(getHour());
    if (Notification.permission === 'denied') {
      st.textContent = 'Bildirim izni kapalı. Telefon ayarlarından Net Kalkanım için bildirimi aç.';
      btn.classList.add('hidden'); sel.parentNode.classList.add('hidden'); test.classList.add('hidden');
    } else if (sub && granted) {
      st.textContent = 'Açık. Her gün saat ' + hourLabel(getHour()) + '\'da o günkü tekrarlarını hatırlatırım.';
      btn.textContent = 'Hatırlatmayı Kapat';
      btn.className = 'w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-semibold rounded-lg';
      sel.parentNode.classList.remove('hidden'); test.classList.remove('hidden');
    } else {
      st.textContent = 'Kapalı. Açarsan her gün tekrar vakti gelince bildirim alırsın.';
      btn.textContent = 'Hatırlatmayı Aç';
      btn.className = 'w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold rounded-lg';
      btn.classList.remove('hidden'); sel.parentNode.classList.add('hidden'); test.classList.add('hidden');
    }
  }

  function ensureUI() {
    var list = document.querySelector('#profile .divide-y');
    if (!list || document.getElementById('nk-push-card')) return;
    var d = document.createElement('div');
    d.id = 'nk-push-card';
    d.className = 'p-4 space-y-2';
    var opts = '';
    for (var h = 5; h <= 23; h++) opts += '<option value="' + h + '">' + hourLabel(h) + '</option>';
    d.innerHTML =
      '<p class="text-sm font-medium text-slate-800">Günlük Hatırlatma</p>' +
      '<p id="nk-push-status" class="text-xs text-slate-500">Yükleniyor...</p>' +
      '<div class="flex items-center gap-2"><span class="text-xs font-semibold text-slate-600">Saat</span>' +
      '<select id="nk-push-hour" class="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-semibold text-slate-700">' + opts + '</select></div>' +
      '<button id="nk-push-toggle" class="w-full bg-emerald-600 text-white px-3 py-2 text-xs font-semibold rounded-lg">Hatırlatmayı Aç</button>' +
      '<button id="nk-push-test" class="hidden w-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 text-xs font-semibold rounded-lg">Test Bildirimi Gönder</button>';
    list.insertBefore(d, list.lastElementChild);

    document.getElementById('nk-push-toggle').onclick = async function () {
      var sub = await currentSub();
      if (sub && Notification.permission === 'granted') await disable(); else await enable();
    };
    document.getElementById('nk-push-test').onclick = sendTest;
    document.getElementById('nk-push-hour').onchange = async function (e) {
      try { localStorage.setItem(LS_HOUR, e.target.value); } catch (er) {}
      var sub = await currentSub();
      if (sub) { try { await saveSub(sub); showToast('Saat güncellendi.'); } catch (er) { showToast('Saat kaydedilemedi.', true); } }
      refresh();
    };
    refresh();
  }

  // Açılışta: bildirim zaten açıksa aboneliği güncel kurtarma koduna / saate bağla (telefon değiştirme, geri yükleme sonrası)
  async function resync() {
    try {
      if (!supported() || Notification.permission !== 'granted') return;
      var sub = await currentSub();
      if (sub) await saveSub(sub);
    } catch (e) {}
  }

  function start() {
    ensureUI();
    setTimeout(resync, 8000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.__nkPush = { enable: enable, disable: disable, refresh: refresh };
})();
