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

  /* ---------- Basma hissi, cevap tepkisi, açma/kapama anahtarı ---------- */
  var css2 = document.createElement('style');
  css2.textContent =
    'button:not(#nav-add):not(.nk-o-btn):not(:disabled):active{scale:.97}' +
    'button:not([class*="transition"]){transition:scale .1s}' +
    '#review-modal [id^="choice-btn-"].bg-green-500{animation:popCorrect .35s ease-out}' +
    '#review-modal [id^="choice-btn-"].bg-red-500{animation:shakeWrong .4s ease-in-out}' +
    '#nk-anim-knob{transition:transform .32s cubic-bezier(.34,1.56,.64,1)}' +
    'body.nk-noanim .tab-content.active{animation:none!important;opacity:1!important}body.nk-noanim .tab-content.active>*,body.nk-noanim #library-list>*{animation:none!important;opacity:1!important}' +
    'body.nk-noanim .toast-msg{animation-duration:.01ms!important}' +
    'body.nk-noanim #review-modal [id^="choice-btn-"]{animation:none!important}' +
    'body.nk-noanim button:active{scale:1!important}' +
    '@media (prefers-reduced-motion:reduce){#review-modal [id^="choice-btn-"]{animation:none!important}}';
  document.head.appendChild(css2);

  var LS_A = 'nk_anim';
  function animOn() { try { return localStorage.getItem(LS_A) !== '0'; } catch (e) { return true; } }
  function applyAnim() {
    var on = animOn();
    document.body.classList.toggle('nk-noanim', !on);
    var t = document.getElementById('nk-anim-toggle'), k = document.getElementById('nk-anim-knob');
    if (t) { t.classList.toggle('bg-teal-600', on); t.classList.toggle('bg-slate-300', !on); }
    if (k) k.style.transform = on ? 'translateX(20px)' : 'translateX(0)';
  }
  function buildAnimRow() {
    if (document.getElementById('nk-anim-toggle')) return true;
    var h = document.getElementById('haptics-toggle');
    var rowH = h && h.closest('.p-4');
    if (!rowH) return false;
    var row = document.createElement('div');
    row.className = 'p-4 flex items-center gap-3';
    row.innerHTML =
      '<div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">' +
        '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.3L12 16.5 5.8 21l2.4-7.3L2 9.2h7.6z"/></svg></div>' +
      '<div class="flex-1 min-w-0"><p class="text-sm font-medium text-slate-800">Animasyonlar</p>' +
        '<p class="text-xs text-slate-500 mt-0.5">Kartların belirmesi, buton basma ve cevap tepkileri.</p></div>' +
      '<button id="nk-anim-toggle" type="button" class="relative w-12 h-7 rounded-full transition-colors bg-teal-600 shrink-0">' +
        '<span id="nk-anim-knob" class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md" style="transform:translateX(20px)"></span></button>';
    rowH.parentNode.insertBefore(row, rowH.nextSibling);
    row.querySelector('#nk-anim-toggle').onclick = function () {
      try { localStorage.setItem(LS_A, animOn() ? '0' : '1'); } catch (e) {}
      applyAnim();
      try { if (typeof haptic === 'function') haptic(8); } catch (e) {}
    };
    applyAnim();
    return true;
  }
  applyAnim();
  (function wait(n) { if (!buildAnimRow() && n < 60) setTimeout(function () { wait(n + 1); }, 500); })(0);
})();
