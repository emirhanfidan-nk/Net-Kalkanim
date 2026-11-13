/* Net Kalkanım - Oyunlaştırma (Duolingo tarzı seri, XP, günlük hedef)
   - Ana ekranda büyük seri kartı: alev, günlük seri, toplam XP, günlük hedef halkası
   - Soru çözünce +2 XP, deneme analiz edince +10 XP, günlük hedef dolunca +20 XP bonus
   - Seri o gün ilk kez devam edince tam ekran alev animasyonu (sönükken yanar)
   - Günlük tekrar bitince süre, kart sayısı ve kazanılan XP animasyonla gösterilir
   Sadece görünüm ve puan ekler: soru, not, tekrar aralıkları ve seri hesabına dokunmaz.
   Puan verisi ayarlarla birlikte saklanır (appState.oyun) ve buluta yedeklenir. */
(function () {
  'use strict';

  var GOAL = 20;          // günlük hedef (XP)
  var XP_Q = 2;           // soru çözme
  var XP_N = 2;           // not tekrarı
  var XP_DENEME = 10;     // deneme analiz etme
  var XP_BONUS = 20;      // günlük hedefi bitirme

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FLAME_D = 'M12.5 2.5c1.2 3-2.3 4.4-2.3 7.6a2.8 2.8 0 005.6 0c0-1-.4-1.9-1-2.8 2 1.1 3.2 3.3 3.2 5.6a5.5 5.5 0 11-11 0c0-4.6 3.5-6.7 5.5-10.4z';
  var BOLT_D = 'M13 2 4 14h6l-1 8 9-12h-6z';
  var SHIELD_D = 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z';
  var STAR_D = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
  var LOCK_D = 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z';
  var BOOK_D = 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z';
  var CHECK_D = 'M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z';
  var CHART_D = 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z';
  var MAX_SHIELDS = 2;
  var TITLES = ['', 'Çaylak', 'Azimli', 'Kararlı', 'Gayretli', 'Usta', 'Uzman', 'Efsane'];
  function titleOf(lv) { return TITLES[Math.min(lv, TITLES.length - 1)]; }

  // Seviye: 1. seviye 0 XP, 2. seviye 40 XP, 3. seviye 160 XP, 4. seviye 360 XP ... (40 x seviye-1 kare)
  function levelOf(xp) { return Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1; }
  function levelStart(lv) { return 40 * (lv - 1) * (lv - 1); }

  var BADGES = [
    { id: 's3',  name: '3 Gün Seri',  desc: '3 gün üst üste tekrar yap',  ok: function (c) { return c.streak >= 3; }, icon: FLAME_D, c: '#fb923c,#ef4444' },
    { id: 's7',  name: '7 Gün Seri',  desc: '7 gün üst üste tekrar yap',  ok: function (c) { return c.streak >= 7; }, icon: FLAME_D, c: '#fb923c,#ef4444' },
    { id: 's14', name: '14 Gün Seri', desc: '14 gün üst üste tekrar yap', ok: function (c) { return c.streak >= 14; }, icon: FLAME_D, c: '#fb923c,#ef4444' },
    { id: 's30', name: '30 Gün Seri', desc: '30 gün üst üste tekrar yap', ok: function (c) { return c.streak >= 30; }, icon: FLAME_D, c: '#fb923c,#ef4444' },
    { id: 'x100', name: '100 XP',  desc: 'Toplam 100 XP topla',  ok: function (c) { return c.xp >= 100; }, icon: BOLT_D, c: '#a78bfa,#7c3aed' },
    { id: 'x500', name: '500 XP',  desc: 'Toplam 500 XP topla',  ok: function (c) { return c.xp >= 500; }, icon: BOLT_D, c: '#a78bfa,#7c3aed' },
    { id: 'x1000', name: '1000 XP', desc: 'Toplam 1000 XP topla', ok: function (c) { return c.xp >= 1000; }, icon: BOLT_D, c: '#a78bfa,#7c3aed' },
    { id: 'q50',  name: '50 Soru',  desc: '50 soru çöz',  ok: function (c) { return c.answered >= 50; }, icon: BOOK_D, c: '#2dd4bf,#0891b2' },
    { id: 'q250', name: '250 Soru', desc: '250 soru çöz', ok: function (c) { return c.answered >= 250; }, icon: BOOK_D, c: '#2dd4bf,#0891b2' },
    { id: 'g1', name: 'İlk Hedef', desc: 'Günlük hedefi bir kez doldur', ok: function (c) { return c.goals >= 1; }, icon: CHECK_D, c: '#4ade80,#16a34a' },
    { id: 'd1', name: 'İlk Analiz', desc: 'Bir denemeyi analiz et', ok: function (c) { return c.analyzed >= 1; }, icon: CHART_D, c: '#60a5fa,#2563eb' }
  ];
  var uid = 0;

  /* ---------- Veri ---------- */
  function today() { return formatDate(getNowTR()); }

  function O() {
    if (!appState.oyun || typeof appState.oyun !== 'object') appState.oyun = {};
    var o = appState.oyun, t = today();
    if (typeof o.xp !== 'number') o.xp = 0;
    if (o.day !== t) { o.day = t; o.dayXp = 0; o.paid = []; }
    if (typeof o.dayXp !== 'number') o.dayXp = 0;
    if (!Array.isArray(o.paid)) o.paid = [];
    if (typeof o.shields !== 'number') o.shields = 1;      // başlangıçta 1 seri kalkanı
    if (!Array.isArray(o.badges)) o.badges = [];
    if (!Array.isArray(o.frozen)) o.frozen = [];
    return o;
  }

  var saveT = null;
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(function () { try { saveSettings(); } catch (e) {} }, 400);
  }

  function activeToday() {
    return (appState.activityDays || []).indexOf(today()) >= 0;
  }

  // Tanıtım turu bitmeden kart ve alev gösterilmez
  function ready() { return !!appState.hasSeenOnboarding; }

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#home-streak-badge{display:none!important}' +
    '@keyframes nkOFlick{0%,100%{transform:scale(1,1) rotate(0deg)}22%{transform:scale(1.06,1.12) rotate(-4deg)}50%{transform:scale(.96,1.02) rotate(3deg)}78%{transform:scale(1.05,1.14) rotate(-2deg)}}' +
    '@keyframes nkOIdle{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.03,1.05) rotate(-2deg)}}' +
    '@keyframes nkOCore{from{opacity:.65}to{opacity:1}}' +
    '@keyframes nkOGlow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.95;transform:scale(1.12)}}' +
    '@keyframes nkOFade{from{opacity:0}to{opacity:1}}' +
    '@keyframes nkOPop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}' +
    '.nk-o-card{position:relative;overflow:hidden;border-radius:24px;padding:16px 18px;color:#fff;font-family:"Sora","Plus Jakarta Sans",sans-serif;' +
      'background:linear-gradient(135deg,#64748b,#475569);box-shadow:0 10px 24px -12px rgba(71,85,105,.8);transition:box-shadow .6s}' +
    '.nk-o-card.lit{box-shadow:0 12px 28px -10px rgba(234,88,12,.8)}' +
    '.nk-o-bgon{position:absolute;inset:0;background:linear-gradient(135deg,#fb923c,#f97316 45%,#ea580c);opacity:0;transition:opacity .6s}' +
    '.nk-o-card.lit .nk-o-bgon{opacity:1}' +
    '.nk-o-row{position:relative;display:flex;align-items:center;gap:14px}' +
    '.nk-o-fire,.nk-o-core{opacity:0;transition:opacity .5s}' +
    '.nk-o-card.lit .nk-o-fire,.nk-o-card.lit .nk-o-core,.nk-o-on .nk-o-fire,.nk-o-on .nk-o-core{opacity:1}' +
    '.nk-o-flame{display:block;transform-origin:50% 90%}' +
    '.nk-o-card .nk-o-flame{animation:nkOIdle 3.2s ease-in-out infinite}' +
    '.nk-o-card.lit .nk-o-flame,.nk-o-on .nk-o-flame{animation:nkOFlick 1.15s ease-in-out infinite}' +
    '.nk-o-card.lit .nk-o-core,.nk-o-on .nk-o-core{animation:nkOCore .7s ease-in-out infinite alternate}' +
    '@media (prefers-reduced-motion:reduce){.nk-o-flame,.nk-o-core{animation:none!important}}' +
    '.nk-o-mid{flex:1;min-width:0}' +
    '.nk-o-num{display:flex;align-items:baseline;gap:6px;line-height:1}' +
    '.nk-o-num b{font-size:40px;font-weight:800;letter-spacing:-.02em}' +
    '.nk-o-num span{font-size:13px;font-weight:700;opacity:.9}' +
    '.nk-o-sub{margin-top:5px;font-size:11.5px;font-weight:700;opacity:.92;line-height:1.25}' +
    '.nk-o-xp{margin-top:7px;display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.2);padding:3px 9px;border-radius:9999px;font-size:11px;font-weight:800}' +
    '.nk-o-ringbox{position:relative;width:64px;height:64px;flex-shrink:0}' +
    '.nk-o-ringtxt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05}' +
    '.nk-o-ringtxt b{font-size:15px;font-weight:800}' +
    '.nk-o-ringtxt i{font-style:normal;font-size:9px;font-weight:700;opacity:.85}' +
    '.nk-o-ov{position:fixed;inset:0;z-index:2147483200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:24px;' +
      'background:rgba(15,23,42,.95);color:#fff;font-family:"Sora","Plus Jakarta Sans",sans-serif;text-align:center;animation:nkOFade .25s ease-out;overflow:hidden}' +
    '.nk-o-btn{margin-top:26px;width:100%;max-width:320px;padding:15px;border:0;border-radius:16px;background:#fff;color:#ea580c;font-size:15px;font-weight:800;' +
      'box-shadow:0 5px 0 #cbd5e1;font-family:inherit}' +
    '.nk-o-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #cbd5e1}' +
    '.nk-o-title{font-size:26px;font-weight:800;margin-top:6px;letter-spacing:-.01em}' +
    '.nk-o-text{font-size:14px;font-weight:600;opacity:.85;margin-top:8px;line-height:1.4;max-width:300px}' +
    '.nk-o-glow{position:absolute;left:50%;top:50%;width:340px;height:340px;margin:-210px 0 0 -170px;border-radius:50%;' +
      'background:radial-gradient(circle,rgba(249,115,22,.55),rgba(249,115,22,0) 68%);opacity:0;pointer-events:none}' +
    '.nk-o-week{display:flex;gap:8px;margin-top:22px}' +
    '.nk-o-day{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11px;font-weight:800;opacity:.9}' +
    '.nk-o-dot{width:34px;height:34px;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.12);color:#fff}' +
    '.nk-o-dot.on{background:#f97316}' +
    '.nk-o-stats{display:flex;gap:10px;margin-top:22px;width:100%;max-width:340px}' +
    '.nk-o-stat{flex:1;border-radius:16px;padding:12px 6px;background:rgba(255,255,255,.1)}' +
    '.nk-o-stat b{display:block;font-size:22px;font-weight:800;font-variant-numeric:tabular-nums}' +
    '.nk-o-stat span{display:block;margin-top:3px;font-size:11px;font-weight:700;opacity:.75}' +
    '.nk-o-stat.xp b{color:#fdba74}' +
    '.nk-o-foot{position:relative;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.22)}' +
    '.nk-o-lvrow{display:flex;justify-content:space-between;font-size:11.5px;font-weight:800}' +
    '.nk-o-lvbar{height:7px;border-radius:9999px;background:rgba(255,255,255,.25);margin-top:6px;overflow:hidden}' +
    '.nk-o-lvbar>div{height:100%;width:0;border-radius:9999px;background:#fff;transition:width .8s cubic-bezier(.22,1,.36,1)}' +
    '.nk-o-chips{display:flex;gap:8px;margin-top:10px}' +
    '.nk-o-chip{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.2);color:#fff;border:0;padding:6px 11px;border-radius:9999px;font-size:11px;font-weight:800;font-family:inherit}' +
    'button.nk-o-chip:active{transform:scale(.95)}' +
    '.nk-o-bgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:100%;max-width:340px;margin-top:18px;max-height:52vh;overflow-y:auto;padding:2px}' +
    '.nk-o-bd{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:10.5px;font-weight:800;line-height:1.2}' +
    '.nk-o-bdc{width:60px;height:60px;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);color:rgba(255,255,255,.5)}' +
    '.nk-o-bd.on .nk-o-bdc{background:linear-gradient(135deg,#fbbf24,#f97316);color:#fff;box-shadow:0 6px 16px rgba(249,115,22,.45)}' +
    '.nk-o-bd small{display:block;font-size:9.5px;font-weight:600;opacity:.7;margin-top:2px}';
  document.head.appendChild(css);

  /* ---------- Çizim yardımcıları ---------- */
  function flameSVG(size, grayFill) {
    var id = 'nkg' + (++uid);
    return '<svg class="nk-o-flame" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcd34d"/><stop offset=".5" stop-color="#fb923c"/><stop offset="1" stop-color="#ef4444"/></linearGradient></defs>' +
      '<path d="' + FLAME_D + '" fill="' + (grayFill || 'rgba(255,255,255,.38)') + '"/>' +
      '<path class="nk-o-fire" d="' + FLAME_D + '" fill="url(#' + id + ')"/>' +
      '<path class="nk-o-core" d="' + FLAME_D + '" fill="#fef08a" transform="translate(12.5 21) scale(.5) translate(-12.5 -21)"/>' +
      '</svg>';
  }

  function ringSVG(size, stroke, color, track) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, h = size / 2;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="transform:rotate(-90deg);display:block">' +
      '<circle cx="' + h + '" cy="' + h + '" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="' + stroke + '"/>' +
      '<circle class="nk-o-ringfg" data-c="' + c + '" cx="' + h + '" cy="' + h + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '"' +
      ' stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '"/></svg>';
  }

  function setRing(root, pct, animate) {
    var fg = root && root.querySelector('.nk-o-ringfg');
    if (!fg) return;
    var c = parseFloat(fg.getAttribute('data-c'));
    pct = Math.min(1, Math.max(0, pct));
    fg.style.transition = (animate && !reduce) ? 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' : 'none';
    fg.style.strokeDashoffset = String(c * (1 - pct));
  }

  function countUp(el, from, to, dur, fmt, delay) {
    if (!el) return;
    fmt = fmt || String;
    if (reduce) { el.textContent = fmt(to); return; }
    el.textContent = fmt(from);
    setTimeout(function () {
      var start = performance.now();
      function step(now) {
        var t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(Math.round(from + (to - from) * e));
        if (t < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
      }
      requestAnimationFrame(step);
    }, delay || 0);
  }

  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60), r = s % 60;
    if (m === 0) return r + ' sn';
    return m + ' dk ' + (r < 10 ? '0' : '') + r + ' sn';
  }

  function vibrate(p) { try { if (typeof haptic === 'function') haptic(p); } catch (e) {} }

  function sparks(host, cx, cy, n, colors, dist) {
    if (reduce) return;
    for (var i = 0; i < n; i++) {
      var d = document.createElement('div');
      var s = 5 + Math.random() * 7;
      d.style.cssText = 'position:absolute;left:' + cx + 'px;top:' + cy + 'px;width:' + s + 'px;height:' + s + 'px;border-radius:9999px;pointer-events:none;background:' + colors[i % colors.length];
      host.appendChild(d);
      var ang = Math.random() * Math.PI * 2, len = (dist * 0.5) + Math.random() * dist * 0.7;
      try {
        var a = d.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: 'translate(' + Math.cos(ang) * len + 'px,' + (Math.sin(ang) * len - 30) + 'px) scale(.2)', opacity: 0 }
        ], { duration: 800 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)', delay: Math.random() * 120 });
        a.onfinish = (function (n2) { return function () { n2.remove(); }; })(d);
      } catch (e) { d.remove(); }
    }
  }

  function confetti(host) {
    if (reduce) return;
    var colors = ['#facc15', '#22c55e', '#38bdf8', '#f472b6', '#fb923c', '#a78bfa'];
    var w = host.clientWidth || window.innerWidth;
    for (var i = 0; i < 46; i++) {
      var d = document.createElement('div');
      var s = 6 + Math.random() * 7;
      d.style.cssText = 'position:absolute;left:' + (Math.random() * w) + 'px;top:-14px;width:' + s + 'px;height:' + (s * 1.6) + 'px;pointer-events:none;border-radius:2px;background:' + colors[i % colors.length];
      host.appendChild(d);
      try {
        var drift = (Math.random() - 0.5) * 120, h = host.clientHeight || window.innerHeight;
        var a = d.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: 'translate(' + drift + 'px,' + (h + 40) + 'px) rotate(' + (360 + Math.random() * 540) + 'deg)', opacity: 1 }
        ], { duration: 1800 + Math.random() * 1500, easing: 'cubic-bezier(.25,.6,.4,1)', delay: Math.random() * 500 });
        a.onfinish = (function (n2) { return function () { n2.remove(); }; })(d);
      } catch (e) { d.remove(); }
    }
  }

  /* ---------- Küçük "+XP" etiketi ---------- */
  function popXp(n, label) {
    try {
      var old = document.getElementById('nk-o-pop');
      if (old) old.remove();
      var p = document.createElement('div');
      p.id = 'nk-o-pop';
      p.style.cssText = 'position:fixed;right:14px;top:calc(128px + env(safe-area-inset-top));z-index:2147483100;pointer-events:none;' +
        'display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:9999px;color:#fff;font-weight:800;font-size:13px;white-space:nowrap;' +
        'background:linear-gradient(135deg,#f97316,#ea580c);box-shadow:0 8px 18px rgba(234,88,12,.45);font-family:"Sora","Plus Jakarta Sans",sans-serif';
      p.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="' + BOLT_D + '"/></svg><span>+' + n + ' XP' + (label ? ' · ' + label : '') + '</span>';
      document.body.appendChild(p);
      if (reduce || !p.animate) { setTimeout(function () { p.remove(); }, 1400); return; }
      var a = p.animate([
        { transform: 'translateY(-14px) scale(.7)', opacity: 0 },
        { transform: 'translateY(0) scale(1.1)', opacity: 1, offset: .25 },
        { transform: 'translateY(0) scale(1)', opacity: 1, offset: .75 },
        { transform: 'translateY(-12px) scale(.95)', opacity: 0 }
      ], { duration: 1500, easing: 'ease-out' });
      a.onfinish = function () { p.remove(); };
    } catch (e) {}
  }

  /* ---------- Ana ekran kartı ---------- */
  function ensureCard() {
    var home = document.getElementById('home');
    if (!home) return null;
    var card = document.getElementById('nk-oyun-card');
    if (card) return card;
    var head = home.firstElementChild;
    if (!head) return null;
    card = document.createElement('div');
    card.id = 'nk-oyun-card';
    card.className = 'nk-o-card';
    card.innerHTML =
      '<div class="nk-o-bgon"></div>' +
      '<div class="nk-o-row">' +
        '<div style="flex-shrink:0;width:60px;height:60px">' + flameSVG(60) + '</div>' +
        '<div class="nk-o-mid">' +
          '<div class="nk-o-num"><b id="nk-o-streak">0</b><span>günlük seri</span></div>' +
          '<div class="nk-o-sub" id="nk-o-sub"></div>' +
          '<div class="nk-o-xp"><svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="' + BOLT_D + '"/></svg><span><span id="nk-o-xp">0</span> XP</span></div>' +
        '</div>' +
        '<div class="nk-o-ringbox" id="nk-o-ringbox">' + ringSVG(64, 7, '#ffffff', 'rgba(255,255,255,.28)') +
          '<div class="nk-o-ringtxt"><b id="nk-o-dayxp">0</b><i>/ ' + GOAL + ' XP</i></div></div>' +
      '</div>' +
      '<div class="nk-o-foot">' +
        '<div class="nk-o-lvrow"><span id="nk-o-lv">Seviye 1</span><span id="nk-o-lvxp" style="opacity:.85"></span></div>' +
        '<div class="nk-o-lvbar"><div id="nk-o-lvfill"></div></div>' +
        '<div class="nk-o-chips">' +
          '<span class="nk-o-chip" id="nk-o-shield"><svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="' + SHIELD_D + '"/></svg><span id="nk-o-shn">0</span> kalkan</span>' +
          '<button type="button" class="nk-o-chip" id="nk-o-badgebtn"><svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="' + STAR_D + '"/></svg><span id="nk-o-bdn">0</span> rozet</button>' +
        '</div>' +
      '</div>';
    head.insertAdjacentElement('afterend', card);
    var bb = card.querySelector('#nk-o-badgebtn');
    if (bb) bb.addEventListener('click', function () { enqueue(0, function (done) { showBadges(null, done); }); });
    return card;
  }

  var lastShown = { streak: -1, xp: -1, dayXp: -1 };
  function renderCard() {
    var card = ensureCard();
    if (!card) return;
    card.style.display = ready() ? '' : 'none';
    if (!ready()) return;
    var o = O();
    try { applyShield(o); } catch (e) { console.warn(e); }
    var streak = 0;
    try { streak = calculateStreak(); } catch (e) {}
    var lit = activeToday();
    card.classList.toggle('lit', lit);

    var sEl = document.getElementById('nk-o-streak');
    if (lastShown.streak !== streak) {
      if (lastShown.streak < 0) sEl.textContent = String(streak); else countUp(sEl, lastShown.streak, streak, 500);
      lastShown.streak = streak;
    }
    var sub = document.getElementById('nk-o-sub');
    if (lit) sub.textContent = 'Bugün tamam, harikasın!';
    else if (streak > 0) sub.textContent = 'Bugün tekrarını yap, serini koru!';
    else sub.textContent = 'Bugün tekrar yap, serini başlat!';

    var xEl = document.getElementById('nk-o-xp');
    if (lastShown.xp !== o.xp) {
      if (lastShown.xp < 0) xEl.textContent = String(o.xp); else countUp(xEl, lastShown.xp, o.xp, 600);
      lastShown.xp = o.xp;
    }
    var dEl = document.getElementById('nk-o-dayxp');
    if (lastShown.dayXp !== o.dayXp) {
      if (lastShown.dayXp < 0) dEl.textContent = String(o.dayXp); else countUp(dEl, lastShown.dayXp, o.dayXp, 600);
      setRing(document.getElementById('nk-o-ringbox'), o.dayXp / GOAL, lastShown.dayXp >= 0);
      lastShown.dayXp = o.dayXp;
    }
    try { checkShieldEarn(o, streak); checkBadges(o, streak); updateFooter(o); } catch (e) { console.warn(e); }
  }

  /* ---------- Tam ekran sıra yöneticisi ---------- */
  var queue = [], showing = false, flushT = null;
  function enqueue(prio, fn) {
    queue.push({ p: prio, fn: fn });
    queue.sort(function (a, b) { return a.p - b.p; });
    scheduleFlush(350);
  }
  function scheduleFlush(ms) { clearTimeout(flushT); flushT = setTimeout(flush, ms); }
  function reviewOpen() {
    var m = document.getElementById('review-modal');
    return !!(m && !m.classList.contains('hidden'));
  }
  function flush() {
    if (!queue.length) return;
    // Ekran bir şekilde kapanmış ama "gösteriliyor" bayrağı kalmışsa kilidi aç
    if (showing && !document.querySelector('.nk-o-ov')) showing = false;
    if (showing || reviewOpen()) { scheduleFlush(900); return; }
    var item = queue.shift();
    showing = true;
    try {
      item.fn(function () { showing = false; scheduleFlush(250); });
    } catch (e) { console.warn(e); showing = false; scheduleFlush(250); }
  }

  function makeOverlay(html) {
    var ov = document.createElement('div');
    ov.className = 'nk-o-ov';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    return ov;
  }
  function closeOverlay(ov, done) {
    ov.style.transition = 'opacity .25s';
    ov.style.opacity = '0';
    setTimeout(function () { ov.remove(); if (done) done(); }, 260);
  }
  function wireClose(ov, done) {
    var b = ov.querySelector('.nk-o-btn');
    var fired = false;
    function go() { if (fired) return; fired = true; closeOverlay(ov, done); }
    if (b) b.addEventListener('click', go);
    return go;
  }

  /* ---------- 1) Seri alevi ---------- */
  var DAY_LET = ['P', 'P', 'S', 'Ç', 'P', 'C', 'C'];   // Pazar ... Cumartesi
  function weekHTML() {
    var days = {};
    (appState.activityDays || []).forEach(function (d) { days[d] = true; });
    var out = '';
    for (var i = 6; i >= 0; i--) {
      var d = getNowTR(); d.setDate(d.getDate() - i);
      var key = formatDate(d), isToday = i === 0;
      var on = !!days[key] && !isToday;
      out += '<div class="nk-o-day"><span>' + DAY_LET[d.getDay()] + '</span>' +
        '<div class="nk-o-dot' + (on ? ' on' : '') + '"' + (isToday ? ' id="nk-o-today"' : '') + '>' +
        (on ? checkSVG() : '') + '</div></div>';
    }
    return out;
  }
  function checkSVG() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  }

  function showFlame(streak, done) {
    var first = streak <= 1;
    var ov = makeOverlay(
      '<div class="nk-o-glow" id="nk-o-glow"></div>' +
      '<div id="nk-o-bigflame" style="position:relative;width:170px;height:170px">' + flameSVG(170, 'rgba(148,163,184,.55)') + '</div>' +
      '<div style="font-size:76px;font-weight:800;line-height:1;margin-top:8px;color:#fb923c;font-variant-numeric:tabular-nums" id="nk-o-bignum">' + (first ? 0 : streak - 1) + '</div>' +
      '<div class="nk-o-title" id="nk-o-ftitle">' + (first ? 'Seri başladı!' : 'günlük seri!') + '</div>' +
      '<div class="nk-o-week">' + weekHTML() + '</div>' +
      '<div class="nk-o-text">' + (first ? 'İlk gün tamam. Yarın da gel, zinciri uzat.' : 'Bugün de geldin. Zinciri bozma, devam!') + '</div>' +
      '<button type="button" class="nk-o-btn">Devam</button>');
    var close = wireClose(ov, done);
    var flameBox = ov.querySelector('#nk-o-bigflame');
    var glow = ov.querySelector('#nk-o-glow');
    var num = ov.querySelector('#nk-o-bignum');
    var dot = ov.querySelector('#nk-o-today');

    function ignite() {
      flameBox.classList.add('nk-o-on');
      vibrate([30, 40, 60, 40, 120]);
      if (dot) { dot.classList.add('on'); dot.innerHTML = checkSVG(); }
      if (!reduce) {
        try {
          flameBox.animate([
            { transform: 'scale(.8)' }, { transform: 'scale(1.3) rotate(-5deg)', offset: .4 },
            { transform: 'scale(.95) rotate(2deg)', offset: .7 }, { transform: 'scale(1)' }
          ], { duration: 750, easing: 'cubic-bezier(.34,1.56,.64,1)' });
          glow.style.opacity = '1';
          glow.animate([{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 700, easing: 'ease-out' });
          glow.style.animation = 'nkOGlow 2.2s ease-in-out .8s infinite';
          if (dot) dot.animate([{ transform: 'scale(.4)' }, { transform: 'scale(1.35)', offset: .6 }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-out' });
          var r = flameBox.getBoundingClientRect(), hr = ov.getBoundingClientRect();
          sparks(ov, r.left - hr.left + r.width / 2, r.top - hr.top + r.height * 0.55, 22, ['#fcd34d', '#fb923c', '#f97316', '#fef08a'], 150);
        } catch (e) {}
      } else { glow.style.opacity = '1'; }
      countUp(num, first ? 0 : streak - 1, streak, 650, String, 250);
      if (!reduce) {
        try { num.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: .5 }, { transform: 'scale(1)' }], { duration: 650, delay: 700, easing: 'ease-out' }); } catch (e) {}
      }
    }
    if (reduce) ignite(); else setTimeout(ignite, 650);
    return close;
  }

  /* ---------- 2) Günlük hedef tamam ---------- */
  function showGoal(done) {
    var ov = makeOverlay(
      '<div class="nk-o-ringbox" id="nk-o-gring" style="width:170px;height:170px">' + ringSVG(170, 14, '#22c55e', 'rgba(255,255,255,.14)') +
        '<div class="nk-o-ringtxt"><div style="width:84px;height:84px;border-radius:9999px;background:#16a34a;display:flex;align-items:center;justify-content:center" id="nk-o-gcheck">' +
        checkSVG().replace('width="18" height="18"', 'width="46" height="46"') + '</div></div></div>' +
      '<div class="nk-o-title" style="margin-top:22px">Günlük hedef tamam!</div>' +
      '<div class="nk-o-text">Bugünkü ' + GOAL + ' XP hedefini doldurdun.</div>' +
      '<div class="nk-o-stats" style="max-width:220px"><div class="nk-o-stat xp" style="padding:14px 6px"><b id="nk-o-gxp">+0</b><span>Hedef bonusu (XP)</span></div></div>' +
      '<button type="button" class="nk-o-btn">Devam</button>');
    wireClose(ov, done);
    var ring = ov.querySelector('#nk-o-gring');
    setRing(ring, 0, false);
    void ring.offsetWidth;
    setTimeout(function () {
      setRing(ring, 1, true);
      vibrate([40, 30, 40, 30, 90]);
      confetti(ov);
      var chk = ov.querySelector('#nk-o-gcheck');
      if (chk && !reduce) { try { chk.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.2)', offset: .6 }, { transform: 'scale(1)' }], { duration: 600, delay: 600, easing: 'ease-out', fill: 'backwards' }); } catch (e) {} }
      countUp(ov.querySelector('#nk-o-gxp'), 0, XP_BONUS, 800, function (v) { return '+' + v; }, 500);
    }, 250);
  }

  /* ---------- 3) Tekrar bitti özeti ---------- */
  function showSummary(data, done) {
    var ov = makeOverlay(
      '<div id="nk-o-sumcheck" style="width:86px;height:86px;border-radius:9999px;background:#16a34a;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 10px rgba(34,197,94,.18)">' +
        checkSVG().replace('width="18" height="18"', 'width="48" height="48"') + '</div>' +
      '<div class="nk-o-title" style="margin-top:18px">Tekrar Tamamlandı!</div>' +
      '<div class="nk-o-stats">' +
        '<div class="nk-o-stat"><b id="nk-o-st">0 sn</b><span>Süre</span></div>' +
        '<div class="nk-o-stat"><b id="nk-o-sc">0</b><span>Kart</span></div>' +
        '<div class="nk-o-stat xp"><b id="nk-o-sx">+0</b><span>XP</span></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:14px;margin-top:22px;background:rgba(255,255,255,.08);border-radius:18px;padding:12px 18px">' +
        '<div class="nk-o-ringbox" id="nk-o-sring">' + ringSVG(64, 7, '#fb923c', 'rgba(255,255,255,.16)') +
          '<div class="nk-o-ringtxt"><b id="nk-o-sday">0</b><i>/ ' + GOAL + '</i></div></div>' +
        '<div style="text-align:left"><div style="font-size:13px;font-weight:800">Günlük hedef</div><div style="font-size:11.5px;font-weight:600;opacity:.75;margin-top:2px">' + GOAL + ' XP\'lik hedefe ilerledin</div></div>' +
      '</div>' +
      '<button type="button" class="nk-o-btn">Devam</button>');
    wireClose(ov, done);
    var o = O();
    var ring = ov.querySelector('#nk-o-sring');
    setRing(ring, data.dayBefore / GOAL, false);
    ov.querySelector('#nk-o-sday').textContent = String(data.dayBefore);
    vibrate([30, 30, 60]);
    if (!reduce) {
      try { ov.querySelector('#nk-o-sumcheck').animate([{ transform: 'scale(0)' }, { transform: 'scale(1.2)', offset: .6 }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-out' }); } catch (e) {}
      confetti(ov);
    }
    countUp(ov.querySelector('#nk-o-st'), 0, data.sec, 900, fmtTime, 350);
    countUp(ov.querySelector('#nk-o-sc'), 0, data.cards, 800, String, 500);
    countUp(ov.querySelector('#nk-o-sx'), 0, data.xp, 1000, function (v) { return '+' + v; }, 650);
    setTimeout(function () {
      setRing(ring, Math.min(o.dayXp, GOAL) / GOAL, true);
      countUp(ov.querySelector('#nk-o-sday'), data.dayBefore, Math.min(o.dayXp, 9999), 900, String, 0);
    }, 1000);
  }

  /* ---------- Seri kalkanı, seviye, rozetler ---------- */
  function dayStr(offset) { var d = getNowTR(); d.setDate(d.getDate() + offset); return formatDate(d); }

  // Dün tekrar yapılmadıysa ama önceki gün yapıldıysa ve kalkan varsa: dünü kurtarır, seri kopmaz
  function applyShield(o) {
    var days = appState.activityDays || [];
    var y = dayStr(-1), y2 = dayStr(-2);
    if (days.indexOf(y) >= 0 || days.indexOf(y2) < 0) return;
    if (o.shieldUsedFor === y || o.shields < 1) return;
    o.shields--;
    o.shieldUsedFor = y;
    o.frozen.push(y);
    appState.activityDays = days.concat([y]).sort();
    persist();
    enqueue(0, function (done) { showShieldUsed(o.shields, done); });
  }

  // Her 7 günlük seride yeni kalkan (en fazla 2)
  function checkShieldEarn(o, streak) {
    if (!activeToday() || streak < 1 || streak % 7 !== 0) return;
    if (o.shieldEarnDay === today() || o.shields >= MAX_SHIELDS) return;
    o.shields++;
    o.shieldEarnDay = today();
    persist();
    try { if (typeof showToast === 'function') showToast('Yeni seri kalkanı kazandın!'); } catch (e) {}
  }

  var lastLevel = 0;
  function updateFooter(o) {
    var lv = levelOf(o.xp), a = levelStart(lv), b = levelStart(lv + 1);
    var set = function (id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
    set('nk-o-lv', 'Seviye ' + lv + ' · ' + titleOf(lv));
    set('nk-o-lvxp', (o.xp - a) + ' / ' + (b - a) + ' XP');
    set('nk-o-shn', String(o.shields));
    set('nk-o-bdn', String(o.badges.length));
    var fill = document.getElementById('nk-o-lvfill');
    if (fill) fill.style.width = Math.min(100, Math.round((o.xp - a) / (b - a) * 100)) + '%';
    if (lastLevel > 0 && lv > lastLevel) enqueue(2, function (done) { showLevelUp(lv, done); });
    lastLevel = lv;
  }

  function checkBadges(o, streak) {
    var ctx = {
      streak: streak, xp: o.xp, answered: appState.totalAnswered || 0,
      goals: o.goals || (o.goalDay ? 1 : 0),
      analyzed: (appState.denemeler || []).filter(function (d) { return d.analyzed; }).length
    };
    var fresh = [];
    BADGES.forEach(function (b) {
      if (o.badges.indexOf(b.id) < 0 && b.ok(ctx)) { o.badges.push(b.id); fresh.push(b); }
    });
    if (fresh.length) {
      persist();
      enqueue(2.5, function (done) { showBadges(fresh, done); });
    }
  }

  function simpleOverlay(iconD, color, title, text, done) {
    var ov = makeOverlay(
      '<div id="nk-o-sico" style="width:130px;height:130px;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:' + color + ';box-shadow:0 0 0 14px rgba(255,255,255,.07)">' +
        '<svg width="64" height="64" viewBox="0 0 24 24" fill="#fff"><path d="' + iconD + '"/></svg></div>' +
      '<div class="nk-o-title" style="margin-top:22px">' + title + '</div>' +
      '<div class="nk-o-text">' + text + '</div>' +
      '<button type="button" class="nk-o-btn">Devam</button>');
    wireClose(ov, done);
    vibrate([30, 30, 70]);
    if (!reduce) {
      try { ov.querySelector('#nk-o-sico').animate([{ transform: 'scale(.3) rotate(-15deg)', opacity: 0 }, { transform: 'scale(1.18) rotate(4deg)', opacity: 1, offset: .6 }, { transform: 'scale(1) rotate(0)', opacity: 1 }], { duration: 700, easing: 'ease-out' }); } catch (e) {}
      confetti(ov);
    }
    return ov;
  }

  function showShieldUsed(left, done) {
    simpleOverlay(SHIELD_D, 'linear-gradient(135deg,#38bdf8,#2563eb)', 'Seri kalkanın seni kurtardı!',
      'Dün tekrar yapmadın ama kalkanın zinciri korudu. Kalan kalkan: ' + left + '. Her 7 günlük seride yeni kalkan kazanırsın.', done);
  }

  function showLevelUp(lv, done) {
    simpleOverlay(BOLT_D, 'linear-gradient(135deg,#a78bfa,#7c3aed)', 'Seviye ' + lv + '!', 'XP topladıkça seviye atlıyorsun. Böyle devam!', done);
  }

  function badgeCell(b, on) {
    var bg = on && b.c ? ' style="background:linear-gradient(135deg,' + b.c.split(',')[0] + ',' + b.c.split(',')[1] + ')"' : '';
    return '<div class="nk-o-bd' + (on ? ' on' : '') + '"><div class="nk-o-bdc"' + bg + '><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="' + (on ? (b.icon || STAR_D) : LOCK_D) + '"/></svg></div>' +
      '<div>' + b.name + '<small>' + b.desc + '</small></div></div>';
  }

  // fresh verilirse "Yeni rozet" ekranı, verilmezse tüm rozetler listesi
  function showBadges(fresh, done) {
    var o = O(), cells = '', title, text = '';
    if (fresh && fresh.length) {
      title = fresh.length === 1 ? 'Yeni rozet!' : fresh.length + ' yeni rozet!';
      fresh.forEach(function (b) { cells += badgeCell(b, true); });
    } else {
      title = 'Rozetlerin';
      text = o.badges.length + ' / ' + BADGES.length + ' rozet topladın';
      BADGES.forEach(function (b) { cells += badgeCell(b, o.badges.indexOf(b.id) >= 0); });
    }
    var ov = makeOverlay(
      '<div class="nk-o-title">' + title + '</div>' + (text ? '<div class="nk-o-text">' + text + '</div>' : '') +
      '<div class="nk-o-bgrid">' + cells + '</div>' +
      '<button type="button" class="nk-o-btn">Devam</button>');
    wireClose(ov, done);
    if (fresh && fresh.length) { vibrate([30, 30, 80]); confetti(ov); }
    if (!reduce) {
      var items = ov.querySelectorAll('.nk-o-bd');
      for (var i = 0; i < items.length; i++) {
        try { items[i].animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, delay: 80 + i * 55, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }); } catch (e) {}
      }
    }
  }

  /* ---------- XP verme ---------- */
  var sess = null;   // günlük tekrar oturumu

  function addXp(n, label, isBonus) {
    var o = O();
    o.xp += n;
    o.dayXp += n;
    if (sess && !isBonus) { sess.xp += n; }
    popXp(n, label);
    try { renderCard(); } catch (e) {}
    if (!isBonus && o.dayXp >= GOAL && o.goalDay !== today()) {
      o.goalDay = today();
      o.goals = (o.goals || 0) + 1;
      o.xp += XP_BONUS;
      o.dayXp += XP_BONUS;
      try { renderCard(); } catch (e) {}
      enqueue(2, showGoal);
    }
    persist();
  }

  function award(kind, id, xp, label) {
    var key = kind + id, o = O();
    if (o.paid.indexOf(key) >= 0) return;
    o.paid.push(key);
    if (sess) sess.cards++;
    addXp(xp, label);
  }

  function eligible(item) {
    return !!item && !item._retry && !isCampMode && !currentArchiveMode && currentBoxColor === 'red';
  }

  /* ---------- Bağlantılar ---------- */
  var origSubmit = window.submitQuestionAnswer;
  if (typeof origSubmit === 'function') {
    window.submitQuestionAnswer = async function () {
      var q = currentReviewQueue[currentReviewIndex];
      var already = !eligible(q) || (q.lastReviewedDate === today() && !!q.userTodayAnswer);
      var r = await origSubmit.apply(this, arguments);
      try { if (!already && q.userTodayAnswer) award('q', q.id, XP_Q, 'Soru'); } catch (e) { console.warn(e); }
      return r;
    };
  }

  var origRecall = window.submitRecallStatus;
  if (typeof origRecall === 'function') {
    window.submitRecallStatus = async function () {
      var item = currentReviewQueue[currentReviewIndex];
      var ok = eligible(item), before = item ? item.userRecallStatus : null;
      var isQ = currentReviewMode === 'questions';
      var r = await origRecall.apply(this, arguments);
      try { if (ok && !before && item.userRecallStatus) award(isQ ? 'q' : 'n', item.id, isQ ? XP_Q : XP_N, isQ ? 'Soru' : 'Not'); } catch (e) { console.warn(e); }
      return r;
    };
  }

  var origStart = window.startReview;
  if (typeof origStart === 'function') {
    window.startReview = function (mode, boxColor, specificItem, isArchiveMode) {
      var r = origStart.apply(this, arguments);
      try {
        var m = document.getElementById('review-modal');
        var opened = !!(m && !m.classList.contains('hidden'));
        if (opened && !specificItem && !isArchiveMode && (boxColor === undefined || boxColor === 'red')) {
          sess = { t0: Date.now(), xp: 0, cards: 0, dayBefore: Math.min(O().dayXp, GOAL) };
        } else { sess = null; }
      } catch (e) { sess = null; }
      return r;
    };
  }

  var origClose = window.closeReview;
  if (typeof origClose === 'function') {
    window.closeReview = function () {
      var s = sess;
      var finished = !!s && !isCampMode && !currentArchiveMode && currentReviewQueue.length > 0 &&
        currentReviewIndex === currentReviewQueue.length - 1;
      var r = origClose.apply(this, arguments);
      sess = null;
      try {
        if (finished) {
          var data = { sec: (Date.now() - s.t0) / 1000, cards: s.cards, xp: s.xp, dayBefore: s.dayBefore };
          enqueue(1, function (done) { showSummary(data, done); });
        }
      } catch (e) { console.warn(e); }
      return r;
    };
  }

  // Tanıtım turu bitince kart ve (varsa) alev hemen gelsin
  var origFinish = window.finishOnboarding;
  if (typeof origFinish === 'function') {
    window.finishOnboarding = async function () {
      var r = await origFinish.apply(this, arguments);
      try { if (typeof updateHomeStats === 'function') updateHomeStats(); } catch (e) {}
      return r;
    };
  }

  // Deneme analizi: işaretlenen her deneme bir kez 10 XP verir (işareti kaldırıp tekrar koyunca verilmez)
  function scanDenemeler() {
    var list = appState.denemeler || [], o = O(), n = 0;
    if (!o.denemeInit) {
      // Güncellemeden önce zaten işaretli olanlara puan verilmez
      list.forEach(function (d) { if (d.analyzed) d.xpPaid = true; });
      o.denemeInit = true;
      persist();
      return;
    }
    list.forEach(function (d) { if (d.analyzed && !d.xpPaid) { d.xpPaid = true; n++; } });
    if (n) addXp(n * XP_DENEME, 'Deneme analizi');
  }
  var origDeneme = window.renderDeneme;
  if (typeof origDeneme === 'function') {
    window.renderDeneme = function () {
      try { scanDenemeler(); } catch (e) { console.warn(e); }
      return origDeneme.apply(this, arguments);
    };
  }

  // Seri o gün ilk kez devam edince alev animasyonu (günde bir kez)
  function maybeFlame() {
    if (!ready()) return;
    var o = O();
    if (!activeToday() || o.flameDay === today()) return;
    o.flameDay = today();
    var streak = 1;
    try { streak = calculateStreak(); } catch (e) {}
    persist();
    enqueue(3, function (done) { showFlame(streak, done); });
  }

  var origStats = window.updateHomeStats;
  if (typeof origStats === 'function') {
    window.updateHomeStats = function () {
      var r = origStats.apply(this, arguments);
      try { renderCard(); maybeFlame(); } catch (e) { console.warn(e); }
      return r;
    };
  }

  window.__nkOyun = {
    info: function () {
      var o = O(), lv = levelOf(o.xp);
      return { xp: o.xp, level: lv, from: levelStart(lv), to: levelStart(lv + 1), title: titleOf(lv), shields: o.shields, goals: o.goals || 0,
        badges: BADGES.map(function (b) { return { id: b.id, name: b.name, desc: b.desc, icon: b.icon, c: b.c, on: o.badges.indexOf(b.id) >= 0 }; }) };
    },
    openBadges: function () { enqueue(0, function (done) { showBadges(null, done); }); },
    addXp: addXp, showFlame: function (s) { enqueue(3, function (d) { showFlame(s, d); }); },
    showGoal: function () { enqueue(2, showGoal); }, showSummary: function (d) { enqueue(1, function (x) { showSummary(d, x); }); }, renderCard: renderCard };

  try { renderCard(); } catch (e) {}
})();
