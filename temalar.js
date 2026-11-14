/* Net Kalkanım - Renk temaları (pastel + fosforlu neon)
   Seçim Ayarlar'da. Tema, mevcut Tailwind renklerinin (teal-*) üzerine değişkenlerle binen bir katmandır;
   neon temalar karanlık modu otomatik açar, pastel temalar kapatır. Seçim ayarlarla buluta yedeklenir (appState.tema).
   Yeni tema eklemek için THEMES listesine bir satır eklemek yeterli. */
(function () {
  'use strict';

  var LS = 'nk_tema';

  /* id, ad, grup, mod (dark/light), t1-t2 (ana gradyan), ta (vurgu yazı), soft (açık zemin), bg (sayfa zemini),
     kutu renkleri: kırmızı/sarı/yeşil zemin + vurgu */
  var THEMES = [
    { id: '', name: 'Klasik', group: 'Klasik', swatch: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
    { id: 'seker', name: 'Şeker', group: 'Pastel', mode: 'light', t1: '#f472b6', t2: '#a78bfa', ta: '#c026a3', soft: '#fce7f3',
      bg: 'linear-gradient(160deg,#fff1f7 0%,#f5e8ff 55%,#e3f0ff 100%)', glow: 'rgba(167,139,250,.35)',
      box: { r: ['#FFE0EB', '#E11D74'], y: ['#FFF1CF', '#D99A00'], g: ['#D9F6E8', '#0E9F6E'] } },
    { id: 'nane', name: 'Nane', group: 'Pastel', mode: 'light', t1: '#34d399', t2: '#38bdf8', ta: '#0f9d8a', soft: '#dcfbf0',
      bg: 'linear-gradient(160deg,#ecfffa 0%,#e6fbff 55%,#eaf3ff 100%)', glow: 'rgba(52,211,153,.35)',
      box: { r: ['#FFE3E3', '#E0485B'], y: ['#FFF3D1', '#D9A000'], g: ['#D6F8E8', '#0E9F6E'] } },
    { id: 'seftali', name: 'Şeftali', group: 'Pastel', mode: 'light', t1: '#fb923c', t2: '#f472b6', ta: '#e2570f', soft: '#ffedd8',
      bg: 'linear-gradient(160deg,#fff6ea 0%,#ffe9ee 55%,#f8eaff 100%)', glow: 'rgba(251,146,60,.35)',
      box: { r: ['#FFE1DC', '#E5484D'], y: ['#FFEFC9', '#E39B00'], g: ['#DEF6E5', '#1AA163'] } },
    { id: 'neon-gece', name: 'Neon Gece', group: 'Neon', mode: 'dark', t1: '#00b8ff', t2: '#d400ff', ta: '#3be8ff', soft: 'rgba(0,200,255,.16)',
      bg: 'linear-gradient(160deg,#06060f 0%,#0e0720 55%,#120626 100%)', glow: 'rgba(0,200,255,.55)',
      box: { r: ['#12121c', '#ff2d6f'], y: ['#12121c', '#ffe14a'], g: ['#12121c', '#2dff9a'] } },
    { id: 'zehir', name: 'Zehir', group: 'Neon', mode: 'dark', t1: '#00d68f', t2: '#00a3ff', ta: '#3dffb4', soft: 'rgba(0,230,150,.15)',
      bg: 'linear-gradient(160deg,#04100b 0%,#07141a 55%,#05101c 100%)', glow: 'rgba(0,230,150,.5)',
      box: { r: ['#101a16', '#ff4d7a'], y: ['#101a16', '#d6ff3a'], g: ['#101a16', '#2dffa0'] } },
    { id: 'ates', name: 'Ateş', group: 'Neon', mode: 'dark', t1: '#ff6a00', t2: '#ff1f6b', ta: '#ff9a4d', soft: 'rgba(255,100,40,.16)',
      bg: 'linear-gradient(160deg,#0f0707 0%,#1a0a12 55%,#1d0710 100%)', glow: 'rgba(255,90,40,.55)',
      box: { r: ['#1a1114', '#ff3b6b'], y: ['#1a1411', '#ffc933'], g: ['#111a15', '#38ffa0'] } }
  ];

  function find(id) { for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; }
  function current() { var t = ''; try { t = (window.appState && appState.tema) || localStorage.getItem(LS) || ''; } catch (e) {} return find(t); }

  function sheet() {
    var s = 'html body[data-nk-theme]';
    var css = '';
    THEMES.forEach(function (t) {
      if (!t.id) return;
      var b = t.box, neon = t.mode === 'dark';
      css += s + '[data-nk-theme="' + t.id + '"]{' +
        '--t1:' + t.t1 + ';--t2:' + t.t2 + ';--ta:' + t.ta + ';--tsoft:' + t.soft + ';--tbg:' + t.bg + ';--tglow:' + t.glow + ';' +
        '--brand-primary:' + t.ta + ';--brand-primary-soft:' + t.soft + ';' +
        '--box-red-bg:' + b.r[0] + ';--box-red-accent:' + b.r[1] + ';--box-yellow-bg:' + b.y[0] + ';--box-yellow-accent:' + b.y[1] + ';' +
        '--box-green-bg:' + b.g[0] + ';--box-green-accent:' + b.g[1] + ';' +
        '--box-inner-bg:' + (neon ? '#0c0c16' : '#ffffff') + ';--box-desc-text:' + (neon ? '#b7b8c9' : '#4a4358') + ';' +
        '--board-bg:' + (neon ? '#0c0c16' : '#ffffff') + ';--board-border:' + (neon ? 'rgba(255,255,255,.14)' : '#e2e8f0') + '}';
    });

    // Ortak katman: tüm temalarda teal yerine tema gradyanı / rengi
    css +=
      s + '{background:var(--tbg) fixed!important}' +
      s + ' .max-w-md.bg-slate-50{background:transparent!important}' +
      s + ' .bg-teal-600,' + s + ' .bg-teal-700,' + s + ' .bg-teal-500,' + s + ' .hover\\:bg-teal-700:hover{background-image:linear-gradient(135deg,var(--t1),var(--t2))!important;background-color:var(--t1)!important}' +
      s + ' .bg-teal-50,' + s + ' .bg-teal-100{background-color:var(--tsoft)!important}' +
      s + ' .text-teal-600,' + s + ' .text-teal-700,' + s + ' .text-teal-500,' + s + ' .hover\\:text-teal-600:hover{color:var(--ta)!important}' +
      s + ' .border-teal-200,' + s + ' .border-teal-300,' + s + ' .border-teal-500,' + s + ' .border-teal-600,' + s + ' .focus\\:border-teal-600:focus{border-color:color-mix(in srgb,var(--t1) 60%,transparent)!important}' +
      s + ' .ring-teal-100{--tw-ring-color:color-mix(in srgb,var(--t1) 30%,transparent)!important}' +
      // seçili sekme (beyaz zemin + teal yazı) → gradyan
      'html body.dark-mode[data-nk-theme] .bg-white.text-teal-600{background-image:linear-gradient(135deg,var(--t1),var(--t2))!important;color:#fff!important}' +
      // seri kartı (yanık hali)
      s + ' .nk-o-bgon{background:linear-gradient(135deg,var(--t1),var(--t2))!important}' +
      s + ' .nk-o-card.lit{box-shadow:0 10px 26px -10px var(--tglow)!important}' +
      s + ' .nk-o-dot.on{background:var(--t1)!important}' +
      // üst çubuk ve alt menü: yarı saydam cam
      s + ' header.bg-white,' + s + ' #bottom-nav{background-color:color-mix(in srgb,var(--tcard,#fff) 78%,transparent)!important;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}';

    // Pastel: yumuşak, renkli gölgeler
    css +=
      s + '[data-nk-mode="light"]{--tcard:#ffffff}' +
      s + '[data-nk-mode="light"] .bg-white{box-shadow:0 8px 22px -14px var(--tglow)}' +
      s + '[data-nk-mode="light"] .nk-box{box-shadow:0 12px 24px -16px var(--bx),0 1px 0 rgba(255,255,255,.7) inset!important}' +
      s + '[data-nk-mode="light"] #nav-add{box-shadow:0 14px 28px -10px var(--tglow)!important}';

    // Neon: koyu zemin, parlayan kenar ve gölgeler
    css +=
      s + '[data-nk-mode="dark"]{--tcard:#0b0b16;color:#eef0ff}' +
      s + '[data-nk-mode="dark"] .bg-white,' + s + '[data-nk-mode="dark"] .bg-slate-50:not(.max-w-md){background-color:rgba(16,16,30,.82)!important}' +
      s + '[data-nk-mode="dark"] .bg-slate-100{background-color:rgba(255,255,255,.06)!important}' +
      s + '[data-nk-mode="dark"] .border-slate-100,' + s + '[data-nk-mode="dark"] .border-slate-200,' + s + '[data-nk-mode="dark"] .border-slate-300{border-color:rgba(255,255,255,.12)!important}' +
      s + '[data-nk-mode="dark"] .nk-box{box-shadow:0 0 0 1px color-mix(in srgb,var(--bx) 55%,transparent),0 0 26px -8px var(--bx)!important}' +
      s + '[data-nk-mode="dark"] .nk-box-title{text-shadow:0 0 12px color-mix(in srgb,var(--bx) 70%,transparent)}' +
      s + '[data-nk-mode="dark"] .nk-box-btn{box-shadow:0 0 16px -2px var(--bx)!important}' +
      s + '[data-nk-mode="dark"] [style*="--box-yellow-accent"] .nk-box-btn,' + s + '[data-nk-mode="dark"] [style*="--box-green-accent"] .nk-box-btn{color:#07110c!important}' +
      s + '[data-nk-mode="dark"] #nav-add{box-shadow:0 0 28px 2px var(--tglow),0 0 0 4px rgba(255,255,255,.06)!important;border-color:rgba(255,255,255,.14)!important}' +
      s + '[data-nk-mode="dark"] button.bg-teal-600.rounded-2xl,' + s + '[data-nk-mode="dark"] button.bg-teal-600.rounded-xl{box-shadow:0 0 18px -4px var(--tglow)!important}' +
      s + '[data-nk-mode="dark"] header.bg-white{border-bottom:1px solid color-mix(in srgb,var(--t1) 35%,transparent)!important}' +
      s + '[data-nk-mode="dark"] #bottom-nav{border-top:1px solid color-mix(in srgb,var(--t2) 35%,transparent)!important}' +
      s + '[data-nk-mode="dark"] h2.font-display,' + s + '[data-nk-mode="dark"] h2.text-xl{text-shadow:0 0 14px var(--tglow)}';

    // Ayarlar'daki tema seçici
    css +=
      '.nk-th-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}' +
      '.nk-th{border:0;background:transparent;padding:0;text-align:center;font-family:inherit}' +
      '.nk-th i{display:block;height:46px;border-radius:14px;border:2px solid transparent;box-shadow:0 0 0 1px rgba(15,23,42,.12) inset}' +
      '.nk-th.on i{border-color:#0f172a;box-shadow:0 0 0 2px #fff inset,0 6px 14px -6px rgba(15,23,42,.5)}' +
      'body.dark-mode .nk-th.on i{border-color:#fff}' +
      '.nk-th span{display:block;margin-top:5px;font-size:11px;font-weight:700;color:#475569}' +
      'body.dark-mode .nk-th span{color:#c6c7d1}' +
      '.nk-th-g{margin:12px 0 6px;font-size:10px;font-weight:800;letter-spacing:.08em;color:#94a3b8;text-transform:uppercase}';
    return css;
  }

  function injectCss() {
    var old = document.getElementById('nk-tema-css');
    if (old) return;
    var st = document.createElement('style');
    st.id = 'nk-tema-css';
    st.textContent = sheet();
    document.head.appendChild(st);
  }

  function setMeta(t) {
    try {
      var m = document.getElementById('meta-theme-color');
      if (m) m.setAttribute('content', t.id ? (t.mode === 'dark' ? '#080812' : '#fff4fa') : (document.body.classList.contains('dark-mode') ? '#131319' : '#f8fafc'));
    } catch (e) {}
  }

  function paint(t) {
    injectCss();
    var b = document.body;
    if (!b) return;
    if (t.id) { b.setAttribute('data-nk-theme', t.id); b.setAttribute('data-nk-mode', t.mode); }
    else { b.removeAttribute('data-nk-theme'); b.removeAttribute('data-nk-mode'); }
    setMeta(t);
    markSelected(t.id);
  }

  function markSelected(id) {
    var g = document.getElementById('nk-th-wrap');
    if (!g) return;
    g.querySelectorAll('.nk-th').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-id') === id); });
  }

  async function choose(id) {
    var prev = current();
    var t = find(id);
    try { localStorage.setItem(LS, id); } catch (e) {}
    try { appState.tema = id; } catch (e) {}
    // Neon = karanlık, pastel = açık; Klasik'e dönünce neon'dan kalan karanlık kapanır
    var wantDark = t.mode === 'dark' ? true : (t.mode === 'light' ? false : (prev.mode === 'dark' ? false : !!appState.darkMode));
    if (typeof applyDarkMode === 'function' && !!appState.darkMode !== wantDark) { appState.darkMode = wantDark; applyDarkMode(wantDark); }
    paint(t);
    try { haptic(10); } catch (e) {}
    try { await saveSettings(); } catch (e) {}
  }

  function buildPicker() {
    if (document.getElementById('nk-th-wrap')) return true;
    var tg = document.getElementById('dark-mode-toggle');
    var list = tg && tg.closest('.divide-y');
    if (!list) return false;
    var row = document.createElement('div');
    row.className = 'p-4';
    row.id = 'nk-th-wrap';
    var head = '<div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">' +
      '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.3A4.9 4.9 0 0 0 22 11c0-4.4-4.5-8-10-8zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg></div>' +
      '<div class="flex-1 min-w-0"><p class="text-sm font-medium text-slate-800">Renk Teması</p><p class="text-xs text-slate-500 mt-0.5">Pastel ya da fosforlu neon gradyanlar.</p></div></div>';
    var html = head;
    ['Klasik', 'Pastel', 'Neon'].forEach(function (g) {
      html += '<div class="nk-th-g">' + g + '</div><div class="nk-th-grid">';
      THEMES.filter(function (t) { return t.group === g; }).forEach(function (t) {
        var sw = t.swatch || ('linear-gradient(135deg,' + t.t1 + ',' + t.t2 + ')');
        var glow = t.mode === 'dark' ? 'box-shadow:0 0 14px -2px ' + t.glow + ';' : '';
        html += '<button type="button" class="nk-th" data-id="' + t.id + '"><i style="background:' + sw + ';' + glow + '"></i><span>' + t.name + '</span></button>';
      });
      html += '</div>';
    });
    row.innerHTML = html;
    list.insertBefore(row, list.firstChild);
    row.querySelectorAll('.nk-th').forEach(function (b) { b.onclick = function () { choose(b.getAttribute('data-id')); }; });
    markSelected(current().id);
    return true;
  }

  // Karanlık modu elle kapatırsan neon tema açık zeminde bozulmasın: Klasik'e dön
  function guardDarkToggle() {
    var orig = window.toggleDarkMode;
    if (typeof orig !== 'function' || orig.__nkTh) return;
    window.toggleDarkMode = function () {
      var t = current();
      if (t.mode === 'dark' && appState.darkMode) { choose(''); return; }
      return orig.apply(this, arguments);
    };
    window.toggleDarkMode.__nkTh = true;
  }

  function start() {
    paint(current());
    var tries = 0;
    (function wait() {
      var okApp = typeof appState !== 'undefined' && appState && appState.field !== undefined;
      if (okApp) {
        // Buluttan gelen seçim yerelden farklıysa bulut kazanır
        var cloud = appState.tema;
        var local = ''; try { local = localStorage.getItem(LS) || ''; } catch (e) {}
        if (typeof cloud === 'string' && cloud !== local) { try { localStorage.setItem(LS, cloud); } catch (e) {} }
        else if (typeof cloud !== 'string') { appState.tema = local; }
        var t = current();
        paint(t);
        // karanlık mod tema ile uyumlu kalsın (yükleme applyDarkMode'u sonradan çağırabilir)
        if (t.mode && typeof applyDarkMode === 'function') {
          var want = t.mode === 'dark';
          if (!!appState.darkMode !== want) { appState.darkMode = want; applyDarkMode(want); }
          else document.body.classList.toggle('dark-mode', want);
          setMeta(t);
        }
        guardDarkToggle();
      }
      var pick = buildPicker();
      if ((!okApp || !pick) && ++tries < 120) setTimeout(wait, 500);
    })();
  }

  window.__nkTema = { choose: choose, themes: THEMES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
