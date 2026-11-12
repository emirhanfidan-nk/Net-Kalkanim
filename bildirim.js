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
  function $(id) { return document.getElementById(id); }

  var BELL = 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z';

  function setToggle(on) {
    var tg = $('nk-push-toggle'), knob = $('nk-push-knob');
    if (!tg || !knob) return;
    tg.classList.toggle('bg-teal-600', !!on);
    tg.classList.toggle('bg-slate-300', !on);
    tg.setAttribute('aria-checked', on ? 'true' : 'false');
    knob.style.transform = on ? 'translateX(20px)' : 'translateX(0px)';
  }

  async function refresh() {
    var st = $('nk-push-status'), tg = $('nk-push-toggle'), extra = $('nk-push-extra'), chip = $('nk-push-hour-text');
    if (!st || !tg || !extra) return;

    function lock(text) {
      st.textContent = text;
      tg.classList.add('hidden');
      extra.classList.add('hidden');
    }
    if (!supported()) {
      lock(isIOS && !standalone
        ? 'iPhone\'da bildirim için önce uygulamayı ana ekrana ekleyip oradan açmalısın.'
        : 'Bu tarayıcı bildirimleri desteklemiyor.');
      return;
    }
    if (isIOS && !standalone) {
      lock('iPhone\'da bildirim için önce uygulamayı ana ekrana ekleyip oradan açmalısın.');
      return;
    }
    if (Notification.permission === 'denied') {
      lock('Bildirim izni kapalı. Telefon ayarlarından Net Kalkanım için bildirimi aç.');
      return;
    }
    tg.classList.remove('hidden');
    var sub = await currentSub();
    var on = !!(sub && Notification.permission === 'granted');
    setToggle(on);
    if (chip) chip.textContent = hourLabel(getHour());
    if (on) {
      st.textContent = 'Açık. Her gün seçtiğin saatte tekrarlarını hatırlatırım.';
      extra.classList.remove('hidden');
    } else {
      st.textContent = 'Kapalı. Açarsan her gün tekrar vakti gelince haber veririm.';
      extra.classList.add('hidden');
    }
  }

  /* ---------- Saat seçme penceresi ---------- */
  function openHourPicker() {
    if ($('nk-hour-sheet')) return;
    var ov = document.createElement('div');
    ov.id = 'nk-hour-sheet';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px';
    var cur = getHour();
    var chips = '';
    for (var h = 6; h <= 23; h++) {
      chips += '<button type="button" data-h="' + h + '" class="nk-hour-chip py-3 rounded-xl border text-sm font-semibold tabular-nums bg-slate-50 border-slate-200 text-slate-700">' + hourLabel(h) + '</button>';
    }
    ov.innerHTML =
      '<div class="modal-animate bg-white w-full max-w-xs rounded-3xl shadow-2xl p-5" role="dialog" aria-label="Hatırlatma saati">' +
        '<div class="flex items-start justify-between gap-3 mb-4">' +
          '<div><h3 class="font-display font-bold text-base text-slate-800">Hatırlatma saati</h3>' +
          '<p class="text-xs text-slate-500 mt-0.5">Bildirim her gün bu saatte gelir.</p></div>' +
          '<button type="button" id="nk-hour-close" aria-label="Kapat" class="text-slate-400 p-1 -mr-1 -mt-1">' +
            '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="grid grid-cols-4 gap-2">' + chips + '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function paint() {
      var btns = ov.querySelectorAll('.nk-hour-chip');
      for (var i = 0; i < btns.length; i++) {
        var on = parseInt(btns[i].getAttribute('data-h'), 10) === cur;
        if (on) {
          btns[i].style.setProperty('background-color', '#0d9488', 'important');
          btns[i].style.setProperty('border-color', '#0d9488', 'important');
          btns[i].style.setProperty('color', '#ffffff', 'important');
          btns[i].style.setProperty('box-shadow', '0 3px 0 rgba(0,0,0,.16)', 'important');
        } else {
          btns[i].style.removeProperty('background-color');
          btns[i].style.removeProperty('border-color');
          btns[i].style.removeProperty('color');
          btns[i].style.removeProperty('box-shadow');
        }
      }
    }
    paint();

    function close() {
      if (ov.parentNode) ov.remove();
      if (window.closeWithBackSupport) closeWithBackSupport('nkhour');
    }
    if (window.openWithBackSupport) openWithBackSupport('nkhour', function () { if (ov.parentNode) ov.remove(); });
    $('nk-hour-close').onclick = close;
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.grid').addEventListener('click', async function (e) {
      var b = e.target.closest ? e.target.closest('.nk-hour-chip') : null;
      if (!b) return;
      cur = parseInt(b.getAttribute('data-h'), 10);
      paint();
      try { localStorage.setItem(LS_HOUR, String(cur)); } catch (er) {}
      setTimeout(close, 180);
      var sub = await currentSub();
      if (sub) {
        try { await saveSub(sub); showToast('Saat ' + hourLabel(cur) + ' olarak güncellendi.'); }
        catch (er) { showToast('Saat kaydedilemedi.', true); }
      }
      refresh();
    });
  }

  /* ---------- Ayarlar satırı ---------- */
  function ensureUI() {
    var list = document.querySelector('#profile .divide-y');
    if (!list || $('nk-push-card')) return;
    var d = document.createElement('div');
    d.id = 'nk-push-card';
    d.className = 'p-4';
    d.innerHTML =
      '<div class="flex items-center gap-3">' +
        '<div class="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">' +
          '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="' + BELL + '"/></svg>' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-medium text-slate-800">Günlük Hatırlatma</p>' +
          '<p id="nk-push-status" class="text-xs text-slate-500 mt-0.5">Yükleniyor...</p>' +
        '</div>' +
        '<button id="nk-push-toggle" type="button" role="switch" aria-checked="false" aria-label="Günlük hatırlatma" class="relative w-12 h-7 rounded-full transition-colors bg-slate-300 shrink-0">' +
          '<span id="nk-push-knob" class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform"></span>' +
        '</button>' +
      '</div>' +
      '<div id="nk-push-extra" class="hidden flex items-center gap-3 mt-3 pl-12">' +
        '<button id="nk-push-hour-btn" type="button" class="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full pl-3 pr-2.5 py-1.5 text-xs font-semibold">' +
          '<span class="text-slate-500 font-medium">Saat</span><span id="nk-push-hour-text" class="tabular-nums">20:00</span>' +
          '<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>' +
        '</button>' +
        '<button id="nk-push-test" type="button" class="text-xs font-semibold text-teal-600 px-1 py-1.5">Test et</button>' +
      '</div>';
    list.insertBefore(d, list.lastElementChild);

    var busy = false;
    $('nk-push-toggle').onclick = async function () {
      if (busy) return;
      busy = true;
      var tg = $('nk-push-toggle');
      tg.style.opacity = '.6';
      try {
        var sub = await currentSub();
        if (sub && Notification.permission === 'granted') await disable(); else await enable();
      } finally {
        busy = false;
        tg.style.opacity = '';
      }
    };
    $('nk-push-test').onclick = sendTest;
    $('nk-push-hour-btn').onclick = openHourPicker;
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

  /* ---------- İzin sorma penceresi (eski kullanıcılar dahil) ---------- */
  var LS_ASK_N = 'nk_push_ask_n', LS_ASK_T = 'nk_push_ask_t';
  var MAX_ASKS = 2, GAP_MS = 3 * 24 * 3600 * 1000;

  function readNum(k) { try { return parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) { return 0; } }

  function anyBlocking() {
    var ids = ['onboarding-modal', 'login-screen', 'install-modal', 'review-modal', 'camp-setup-modal', 'picker-modal',
      'field-change-modal', 'curriculum-change-modal', 'code-modal', 'deneme-form-modal', 'lightbox',
      'custom-confirm-overlay', 'nk-hour-sheet', 'nk-ask-sheet'];
    for (var i = 0; i < ids.length; i++) {
      var e = document.getElementById(ids[i]);
      if (e && window.getComputedStyle(e).display !== 'none') return true;
    }
    return false;
  }

  function showAskModal(onYes) {
    var ov = document.createElement('div');
    ov.id = 'nk-ask-sheet';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(15,23,42,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML =
      '<div class="modal-animate bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center" role="dialog" aria-label="Günlük hatırlatma">' +
        '<div class="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4">' +
          '<svg class="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="' + BELL + '"/></svg>' +
        '</div>' +
        '<h3 class="font-display font-bold text-lg text-slate-800 mb-2">Tekrarlarını hatırlatayım mı?</h3>' +
        '<p class="text-xs leading-relaxed font-medium text-slate-500 mb-5">Her gün seçtiğin saatte "Bugün X soru ve Y not tekrarın var" diye haber veririm. Seriyi kaçırmazsın. Saati istediğin zaman Ayarlar\'dan değiştirebilirsin.</p>' +
        '<div class="flex gap-3">' +
          '<button id="nk-ask-no" type="button" class="flex-1 bg-slate-100 text-slate-600 py-3.5 font-semibold text-sm rounded-xl">Şimdi değil</button>' +
          '<button id="nk-ask-yes" type="button" class="flex-1 text-white py-3.5 font-semibold text-sm rounded-xl" style="background:#0d9488;box-shadow:0 3px 0 rgba(0,0,0,.16)">Aç</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    function close() {
      if (ov.parentNode) ov.remove();
      if (window.closeWithBackSupport) closeWithBackSupport('nkask');
    }
    if (window.openWithBackSupport) openWithBackSupport('nkask', function () { if (ov.parentNode) ov.remove(); });
    $('nk-ask-no').onclick = close;
    $('nk-ask-yes').onclick = function () { close(); onYes(); };
  }

  // Bildirim izni sorulmamış herkese (yeni ya da eski kullanıcı) en fazla 2 kez, aralarında en az 3 gün olacak şekilde sorar.
  var askTries = 0;
  async function askOnce() {
    try {
      if (!supported() || (isIOS && !standalone)) return;
      if (Notification.permission !== 'default') return;
      var n = readNum(LS_ASK_N);
      if (n >= MAX_ASKS) return;
      if (n >= 1 && Date.now() - readNum(LS_ASK_T) < GAP_MS) return;

      // Uygulama meşgulse (giriş, tanıtım, soru çözme, başka pencere) biraz sonra tekrar dene
      var ready = (typeof appState !== 'undefined') && appState.hasSeenOnboarding && appState.field;
      if (!ready || anyBlocking() || document.visibilityState !== 'visible') {
        if (++askTries < 20) setTimeout(askOnce, 15000);
        return;
      }
      var sub = await currentSub();
      if (sub) return;
      try {
        localStorage.setItem(LS_ASK_N, String(n + 1));
        localStorage.setItem(LS_ASK_T, String(Date.now()));
      } catch (e) {}
      showAskModal(function () { enable(); });
    } catch (e) {}
  }

  function start() {
    ensureUI();
    setTimeout(resync, 8000);
    setTimeout(askOnce, 12000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.__nkPush = { enable: enable, disable: disable, refresh: refresh, askOnce: askOnce };
})();
