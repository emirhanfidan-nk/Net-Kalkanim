/* Net Kalkanım - Uygulama Geneli Animasyonlar
   Soru çözme ekranındaki Duolingo hissini diğer ekranlara küçük ve hızlı dokunuşlarla taşır.
   Sadece görünüm: hiçbir veriye ya da işleve dokunmaz. "Hareketi azalt" ayarı açık telefonlarda kendiliğinden kısılır. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent =
    '@keyframes nkRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}' +
    '@keyframes nkToastIn{0%{opacity:0;transform:translateY(-24px) scale(.85)}55%{opacity:1;transform:translateY(2px) scale(1.06)}100%{opacity:1;transform:translateY(0) scale(1)}}' +
    '@keyframes nkToastShake{0%{opacity:0;transform:translateY(-16px) scale(.9)}30%{opacity:1;transform:translateX(-8px)}50%{transform:translateX(8px)}70%{transform:translateX(-5px)}100%{opacity:1;transform:translateX(0)}}' +
    // Sekme açılınca kartlar sırayla yukarı kayarak gelir
    '.tab-content.active>*{animation:nkRise .4s cubic-bezier(.16,1,.3,1) both}' +
    '.tab-content.active>*:nth-child(2){animation-delay:.04s}.tab-content.active>*:nth-child(3){animation-delay:.08s}' +
    '.tab-content.active>*:nth-child(4){animation-delay:.12s}.tab-content.active>*:nth-child(5){animation-delay:.16s}' +
    '.tab-content.active>*:nth-child(6){animation-delay:.2s}.tab-content.active>*:nth-child(7){animation-delay:.24s}' +
    '.tab-content.active>*:nth-child(n+8){animation-delay:.28s}' +
    '#library-list>*:nth-child(-n+8){animation:nkRise .4s cubic-bezier(.16,1,.3,1) both}' +
    '#library-list>*:nth-child(2){animation-delay:.04s}#library-list>*:nth-child(3){animation-delay:.08s}#library-list>*:nth-child(4){animation-delay:.12s}' +
    '#library-list>*:nth-child(5){animation-delay:.16s}#library-list>*:nth-child(6){animation-delay:.2s}#library-list>*:nth-child(n+7){animation-delay:.24s}' +
    // Küçük mesajlar zıplayarak girer, hata sallanır
    '.toast-msg{animation:nkToastIn .5s cubic-bezier(.34,1.56,.64,1),toastOut .3s ease-in 2.2s forwards!important;background:linear-gradient(135deg,#0d9488,#059669)!important;font-weight:700!important}' +
    '.toast-msg.toast-error{animation:nkToastShake .5s ease-out,toastOut .3s ease-in 2.2s forwards!important;background:linear-gradient(135deg,#e11d48,#be123c)!important}' +
    // Ayarlardaki düğmeler: yuvarlak zıplayarak kayar
    '#dark-mode-toggle-knob,#haptics-toggle-knob{transition:transform .32s cubic-bezier(.34,1.56,.64,1)!important}' +
    // Arşiv kartları ve alt çubuk basınca hafifçe çöker
    '#library-list>div:active{transform:scale(.985);transition:transform .08s}' +
    '#bottom-nav .nav-pill{transition:transform .25s cubic-bezier(.34,1.56,.64,1)}' +
    // Tutarlı başlık yazı tipi
    'h2,h3{font-family:"Sora","Plus Jakarta Sans",sans-serif}';
  document.head.appendChild(css);

  /* ---------- Sayılar sayarak değişsin ---------- */
  var COUNTERS = ['red-total-count', 'red-question-count', 'red-note-count', 'yellow-question-count', 'yellow-note-count',
    'green-question-count', 'green-note-count', 'home-streak-count'];
  var busy = {};

  function animateTo(el, from, to) {
    var id = el.id;
    var start = performance.now(), dur = 420;
    busy[id] = true;
    function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (to - from) * e));
      if (t < 1) requestAnimationFrame(step);
      else { el.textContent = String(to); setTimeout(function () { busy[id] = false; }, 0); }
    }
    requestAnimationFrame(step);
  }

  function watch(id) {
    var el = document.getElementById(id);
    if (!el || typeof MutationObserver === 'undefined') return;
    var last = parseInt(el.textContent, 10);
    if (isNaN(last)) last = 0;
    new MutationObserver(function () {
      if (busy[id]) return;
      var now = parseInt(el.textContent, 10);
      if (isNaN(now) || now === last) { return; }
      var from = last;
      last = now;
      if (reduce || Math.abs(now - from) > 500) return;
      el.textContent = String(from);
      animateTo(el, from, now);
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }
  COUNTERS.forEach(watch);

  /* ---------- Alt çubuk: dokunulan sekme zıplar ---------- */
  var origSwitch = window.switchTab;
  if (typeof origSwitch === 'function') {
    window.switchTab = function (tabId) {
      var r = origSwitch.apply(this, arguments);
      try {
        if (!reduce) {
          var map = { home: 'nav-home-pill', add: 'nav-add', library: 'nav-library-pill', profile: 'nav-profile', deneme: 'nav-deneme' };
          var el = document.getElementById(map[tabId]);
          if (el) {
            el.classList.remove('nk-bounce');
            void el.offsetWidth;
            el.classList.add('nk-bounce');
            setTimeout(function () { el.classList.remove('nk-bounce'); }, 700);
          }
        }
      } catch (e) {}
      return r;
    };
  }

  /* ---------- Soru/not kaydedilince kutlama ---------- */
  var origToast = window.showToast;
  if (typeof origToast === 'function') {
    window.showToast = function (message, isError) {
      var r = origToast.apply(this, arguments);
      try {
        if (!isError && !reduce && /başarıyla kaydedildi/i.test(String(message))) {
          var btn = document.getElementById('btn-save-data');
          if (btn && window.__nkFx) window.__nkFx.burst(btn);
        }
      } catch (e) {}
      return r;
    };
  }
})();
