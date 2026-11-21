/* Net Kalkanım - Renk temaları (pastel + fosforlu neon)
   Seçim Ayarlar'da. Tema, mevcut Tailwind renklerinin (teal-*) üzerine değişkenlerle binen bir katmandır;
   neon temalar karanlık modu otomatik açar, pastel temalar kapatır. Seçim ayarlarla buluta yedeklenir (appState.tema).
   Yeni tema eklemek için THEMES listesine bir satır eklemek yeterli. */
(function () {
  'use strict';

  var LS = 'nk_tema';

  /* Tema = renk paleti + sabit zemin (Açık ya da Koyu). Karanlık mod anahtarı yok; zemin temaya bağlı.
     kind: pastel (yumuşak) · canli (orta doygun) · neon (parlayan). lay: arka plan ışık düzeni (0/1/2). ink: 'dark' = gradyan üstünde koyu yazı. */
  var THEMES = [
    { id: '', name: 'Klasik', group: 'Açık', mode: 'light', swatch: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
    { id: 'seker', name: 'Şeker', group: 'Açık', mode: 'light', kind: 'pastel', t1: '#f472b6', t2: '#a78bfa', lay: 0 },
    { id: 'nane', name: 'Nane', group: 'Açık', mode: 'light', kind: 'pastel', t1: '#34d399', t2: '#38bdf8', lay: 1 },
    { id: 'seftali', name: 'Şeftali', group: 'Açık', mode: 'light', kind: 'pastel', t1: '#fb923c', t2: '#f472b6', lay: 2 },
    { id: 'okyanus', name: 'Okyanus', group: 'Açık', mode: 'light', kind: 'canli', t1: '#0ea5e9', t2: '#14b8a6', lay: 2 },
    { id: 'gunes', name: 'Güneş', group: 'Açık', mode: 'light', kind: 'canli', t1: '#f6c200', t2: '#ff9a1f', lay: 1, ink: 'dark' },
    { id: 'lazer', name: 'Lazer', group: 'Açık', mode: 'light', kind: 'neon', t1: '#ff3bd4', t2: '#a24bff', lay: 0 },
    { id: 'klasik-koyu', name: 'Klasik Koyu', group: 'Koyu', mode: 'dark', swatch: 'linear-gradient(135deg,#1d1e26,#0d9488)' },
    { id: 'lila', name: 'Lila Gece', group: 'Koyu', mode: 'dark', kind: 'pastel', t1: '#a78bfa', t2: '#f0abfc', lay: 1 },
        { id: 'neon-gece', name: 'Neon Gece', group: 'Koyu', mode: 'dark', kind: 'neon', t1: '#38bdf8', t2: '#818cf8', lay: 0 },
    { id: 'ates', name: 'Ateş', group: 'Koyu', mode: 'dark', kind: 'neon', t1: '#ff6a00', t2: '#ff1f6b', lay: 1 },
    { id: 'zehir', name: 'Zehir', group: 'Koyu', mode: 'dark', kind: 'neon', t1: '#00e0a0', t2: '#00c2d4', lay: 2 }
  ];

  function find(id) { if (id === 'gecemavi') id = 'neon-gece'; for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i]; return THEMES[0]; }
  var LS_R = 'nk_tema_rnd', LS_OFF = 'nk_tema_off', LS_LAST = 'nk_tema_last';
  function rndOn() { try { return localStorage.getItem(LS_R) === '1'; } catch (e) { return false; } }
  function offList() { try { return JSON.parse(localStorage.getItem(LS_OFF) || '[]') || []; } catch (e) { return []; } }
  function pool() { var off = offList(); var p = THEMES.filter(function (t) { return off.indexOf(t.id) < 0; }); return p.length ? p : THEMES.slice(); }
  function pickRandom() {
    var p = pool(), last = ''; try { last = localStorage.getItem(LS_LAST) || ''; } catch (e) {}
    var c = p.filter(function (t) { return t.id !== last; }); if (!c.length) c = p;
    var t = c[Math.floor(Math.random() * c.length)];
    try { localStorage.setItem(LS_LAST, t.id); localStorage.setItem(LS, t.id); } catch (e) {}
    return t;
  }
  function current() { var t = ''; try { t = rndOn() ? (localStorage.getItem(LS) || '') : ((window.appState && appState.tema) || localStorage.getItem(LS) || ''); } catch (e) {} return find(t); }
  function isDark() { return document.body.classList.contains('dark-mode'); }

  function sheet() {
    var S = 'html body[data-nk-theme]';
    var M = function (m) { return S + '[data-nk-mode="' + m + '"]'; };
    var K = function (k, m) { return S + '[data-nk-kind="' + k + '"]' + (m ? '[data-nk-mode="' + m + '"]' : ''); };
    var css = '';
    THEMES.forEach(function (t) {
      if (!t.id) return;
      css += S + '[data-nk-theme="' + t.id + '"]{--t1:' + t.t1 + ';--t2:' + t.t2 + '}';
    });

    // Moda göre türetilen renkler (Açık / Koyu)
    css +=
      M('light') + '{--tbase:color-mix(in srgb,var(--t1) 7%,#fff);--ta:color-mix(in srgb,var(--t1) 62%,#1a1030);--tsoft:color-mix(in srgb,var(--t1) 16%,#fff);--tcard:#ffffff}' +
      M('dark') + '{--tbase:color-mix(in srgb,var(--t1) 9%,#07070d);--ta:color-mix(in srgb,var(--t1) 62%,#fff);--tsoft:color-mix(in srgb,var(--t1) 22%,transparent);--tcard:color-mix(in srgb,var(--t1) 9%,#0a0a14);color:#eef0ff}' +
      // doygunluğa göre ışık ve parıltı miktarı
      K('pastel', 'light') + '{--tA:22%;--tglow:color-mix(in srgb,var(--t1) 30%,transparent)}' +
      K('canli', 'light') + '{--tA:28%;--tglow:color-mix(in srgb,var(--t1) 40%,transparent)}' +
      K('neon', 'light') + '{--tA:34%;--tglow:color-mix(in srgb,var(--t1) 45%,transparent)}' +
      K('pastel', 'dark') + '{--tA:22%;--tglow:color-mix(in srgb,var(--t1) 26%,transparent)}' +
      K('canli', 'dark') + '{--tA:30%;--tglow:color-mix(in srgb,var(--t1) 40%,transparent)}' +
      K('neon', 'dark') + '{--tA:32%;--tglow:color-mix(in srgb,var(--t1) 48%,transparent)}' +
      // arka plan: palet renklerinden ışık lekeleri (3 farklı düzen)
      S + '[data-nk-lay="0"]{--tbg:radial-gradient(120% 55% at 0% 0%,color-mix(in srgb,var(--t1) var(--tA),transparent),transparent 62%),radial-gradient(110% 55% at 100% 100%,color-mix(in srgb,var(--t2) var(--tA),transparent),transparent 62%)}' +
      S + '[data-nk-lay="1"]{--tbg:radial-gradient(110% 50% at 100% 0%,color-mix(in srgb,var(--t2) var(--tA),transparent),transparent 62%),radial-gradient(120% 55% at 0% 100%,color-mix(in srgb,var(--t1) var(--tA),transparent),transparent 62%)}' +
      S + '[data-nk-lay="2"]{--tbg:linear-gradient(180deg,color-mix(in srgb,var(--t1) var(--tA),transparent),transparent 45%,color-mix(in srgb,var(--t2) var(--tA),transparent))}' +
      S + '{background-color:var(--tbase)!important;background-image:var(--tbg)!important;background-attachment:fixed!important;--brand-primary:var(--ta);--brand-primary-soft:var(--tsoft)}';

    // Ortak katman: teal yerine palet
    css +=
      S + ' .max-w-md.bg-slate-50{background:transparent!important}' +
      S + ' .bg-teal-600,' + S + ' .bg-teal-700,' + S + ' .bg-teal-500,' + S + ' .hover\\:bg-teal-700:hover{background-image:linear-gradient(135deg,var(--t1),var(--t2))!important;background-color:var(--t1)!important}' +
      S + ' .bg-teal-50,' + S + ' .bg-teal-100{background-color:var(--tsoft)!important}' +
      S + ' .text-teal-600,' + S + ' .text-teal-700,' + S + ' .text-teal-500,' + S + ' .hover\\:text-teal-600:hover{color:var(--ta)!important}' +
      S + ' .border-teal-200,' + S + ' .border-teal-300,' + S + ' .border-teal-500,' + S + ' .border-teal-600,' + S + ' .focus\\:border-teal-600:focus{border-color:color-mix(in srgb,var(--t1) 60%,transparent)!important}' +
      S + ' .ring-teal-100{--tw-ring-color:color-mix(in srgb,var(--t1) 30%,transparent)!important}' +
      'html body.dark-mode[data-nk-theme] .bg-white.text-teal-600{background-image:linear-gradient(135deg,var(--t1),var(--t2))!important;color:#fff!important}' +
      S + ' .nk-o-card{background:linear-gradient(135deg,color-mix(in srgb,var(--t1) 38%,#64748b),color-mix(in srgb,var(--t2) 38%,#475569))!important}' +
      S + ' .nk-o-bgon{background:linear-gradient(135deg,var(--t1),var(--t2))!important}' +
      S + ' .nk-o-card.lit{box-shadow:0 10px 26px -10px var(--tglow)!important}' +
      S + ' .nk-o-dot.on{background:var(--t1)!important}' +
      S + ' header.bg-white,' + S + ' #bottom-nav{background-color:color-mix(in srgb,var(--tcard) 78%,transparent)!important;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}' +
      S + '[data-nk-ink="dark"] .bg-teal-600,' + S + '[data-nk-ink="dark"] .bg-teal-700,' + S + '[data-nk-ink="dark"] .nk-o-card.lit,' + S + '[data-nk-ink="dark"] #nav-add{color:#07110c!important}';

    // Koyu zemin: yüzeyler palete boyanır
    css +=
      M('dark') + ' .bg-white,' + M('dark') + ' .bg-slate-50:not(.max-w-md){background-color:color-mix(in srgb,var(--tcard) 84%,transparent)!important}' +
      M('dark') + ' .bg-slate-100{background-color:rgba(255,255,255,.06)!important}' +
      M('dark') + ' .border-slate-100,' + M('dark') + ' .border-slate-200,' + M('dark') + ' .border-slate-300{border-color:rgba(255,255,255,.12)!important}';

    // Pastel: yumuşak, renkli gölgeler
    css +=
      K('pastel') + ' #nav-add{box-shadow:0 14px 28px -10px var(--tglow)!important}';

    // Canlı: palet renginde kenarlık ve orta parıltı
    css +=
      K('canli') + ' header.bg-white{border-bottom:1px solid color-mix(in srgb,var(--t1) 35%,transparent)!important}' +
      K('canli') + ' #nav-add{box-shadow:0 14px 30px -8px var(--tglow)!important}' +
      K('canli') + ' .nk-box{box-shadow:0 10px 26px -14px var(--bx)!important}';

    // Neon: koyu zemin + ince parlak çizgi; ışıma sadece öne çıkan yerlerde (tüp ışığı gibi katmanlı)
    var tube = function (c) { return '0 0 0 1px color-mix(in srgb,' + c + ' 80%,transparent),0 0 11px -1px color-mix(in srgb,' + c + ' 65%,transparent),0 0 30px -5px color-mix(in srgb,' + c + ' 52%,transparent)'; };
    css +=
      K('neon') + ' .nk-box{box-shadow:0 0 0 1px color-mix(in srgb,var(--bx) 44%,transparent),0 0 24px -11px var(--bx)!important}' +
      K('neon') + ' .nk-box-btn{box-shadow:0 0 16px -5px var(--bx)!important}' +
      K('neon') + ' #nav-add{box-shadow:' + tube('var(--t1)') + ',0 0 46px -10px var(--tglow)!important;border-color:transparent!important}' +
      K('neon') + ' button.bg-teal-600.rounded-2xl,' + K('neon') + ' button.bg-teal-600.rounded-xl{box-shadow:0 0 14px -7px var(--tglow)!important}' +
      K('neon') + ' header.bg-white{border-bottom:1px solid color-mix(in srgb,var(--t1) 50%,transparent)!important;box-shadow:0 12px 28px -18px var(--tglow)!important}' +
      K('neon') + ' #bottom-nav{border-top:1px solid color-mix(in srgb,var(--t2) 50%,transparent)!important;box-shadow:0 -12px 28px -18px var(--tglow)!important}' +
      K('neon') + ' .nk-af-on{box-shadow:' + tube('var(--bx)') + '!important}' +
      K('neon') + ' .nk-arch-card{box-shadow:0 0 0 1px color-mix(in srgb,var(--bx) 40%,transparent),0 0 22px -11px var(--bx)!important}' +
      K('neon', 'dark') + ' h2.font-display{text-shadow:0 0 18px color-mix(in srgb,var(--t1) 65%,transparent)}' +
      K('neon', 'dark') + ' [style*="--box-yellow-accent"] .nk-box-btn,' + K('neon', 'dark') + ' [style*="--box-green-accent"] .nk-box-btn{color:#07110c!important}' +
      // açık zeminde neon: çizgi ve tüp ışığı yerine renkli yumuşak gölge
      K('neon', 'light') + ' .nk-box,' + K('neon', 'light') + ' .nk-arch-card{box-shadow:0 10px 24px -15px var(--bx)!important}' +
      K('neon', 'light') + ' .nk-af-on{box-shadow:0 8px 20px -10px var(--bx)!important}' +
      K('neon', 'light') + ' #nav-add{box-shadow:0 12px 28px -8px var(--tglow)!important}' +
      K('neon', 'light') + ' header.bg-white,' + K('neon', 'light') + ' #bottom-nav{box-shadow:none!important}';

    // Uygulamanın geneline yayılan renkler: kamera düğmesi, profil kartı, grafik, formüller, hocaya sor
    css +=
      S + ' .bg-sky-500,' + S + ' .bg-sky-600,' + S + ' .bg-sky-700,' + S + ' .hover\\:bg-sky-600:hover{background-image:linear-gradient(135deg,var(--t2),var(--t1))!important;background-color:var(--t2)!important}' +
      S + ' .text-sky-600,' + S + ' .text-indigo-600{color:var(--ta)!important}' +
      S + ' .bg-indigo-100,' + S + ' .bg-sky-100{background-color:var(--tsoft)!important}' +
      S + ' .nk-hero{background:linear-gradient(135deg,color-mix(in srgb,var(--t1) 45%,#0b0b16),color-mix(in srgb,var(--t1) 75%,#0b0b16) 55%,color-mix(in srgb,var(--t2) 70%,#0b0b16))!important}' +
      S + ' .face-heading-front{background:var(--tsoft)!important;color:var(--ta)!important;border-color:color-mix(in srgb,var(--t1) 45%,transparent)!important}' +
      S + ' .face-heading-back{background:color-mix(in srgb,var(--t2) 18%,transparent)!important;color:color-mix(in srgb,var(--t2) 70%,var(--nk-ink))!important;border-color:color-mix(in srgb,var(--t2) 45%,transparent)!important}' +
      S + ' .bg-amber-500,' + S + ' .bg-amber-600,' + S + ' .hover\\:bg-amber-600:hover{background-image:linear-gradient(135deg,var(--t2),color-mix(in srgb,var(--t2) 62%,#000))!important;background-color:var(--t2)!important;border-color:var(--t2)!important;color:#fff!important}' +
      S + ' .bg-white.text-amber-600{color:var(--t2)!important}' +
      S + ' .hover\\:text-amber-600:hover{color:var(--t2)!important}' +
      M('dark') + ' .bg-white.text-amber-600{background-image:linear-gradient(135deg,var(--t2),color-mix(in srgb,var(--t2) 55%,#000))!important;color:#fff!important}' +
      // Arşiv: kamp düğmesi, kutu filtreleri, kartlar
      S + ' .toast-msg:not(.toast-error){background:linear-gradient(135deg,var(--t1),var(--t2))!important}' +
      S + '[data-nk-ink="dark"] .toast-msg:not(.toast-error){color:#2a1c00!important}' +
      S + ' #btn-random-camp{background:color-mix(in srgb,var(--t2) 16%,transparent)!important;border-color:color-mix(in srgb,var(--t2) 50%,transparent)!important;color:var(--ta)!important}' +
      S + ' #btn-random-camp:hover{background-image:linear-gradient(135deg,var(--t2),var(--t1))!important;color:#fff!important}' +
      S + '[data-nk-ink="dark"] #btn-random-camp:hover{color:#2a1c00!important}' +
      S + ' .nk-af-on{border-color:color-mix(in srgb,var(--bx) 75%,transparent)!important;background-color:color-mix(in srgb,var(--bx) 12%,#fff)!important;color:color-mix(in srgb,var(--bx) 72%,#000)!important}' +
      M('dark') + ' .nk-af-on{background-color:color-mix(in srgb,var(--bx) 14%,var(--tcard))!important;color:color-mix(in srgb,var(--bx) 55%,#fff)!important}' +
      M('dark') + ' .nk-af:not(.nk-af-on)>div.absolute{background-color:rgba(255,255,255,.07)!important}' +
      S + ' .nk-af-on>div.absolute{background:var(--bx)!important}' +
      K('canli') + ' .nk-af-on,' + K('canli') + ' .nk-arch-card{box-shadow:0 8px 20px -12px var(--bx)!important}' +
      S + ' #library-list .bg-amber-50,' + S + ' #library-list .bg-amber-100\\/70{background-color:color-mix(in srgb,var(--t2) 15%,transparent)!important}' +
      S + ' #library-list .text-amber-800,' + S + ' #library-list .text-amber-900{color:color-mix(in srgb,var(--t2) 55%,var(--nk-ink))!important}' +
      M('dark') + ' #library-list .archive-back-tag{color:var(--ta)!important}' +
      S + ' #nk-cloud-card .bg-emerald-50{background-color:var(--tsoft)!important}' +
      S + ' #nk-cloud-card .text-emerald-600{color:var(--ta)!important}' +
      S + ' #nk-cloud-card .bg-emerald-600{background-image:linear-gradient(135deg,var(--t1),var(--t2))!important;background-color:var(--t1)!important}' +
      S + ' #nk-cloud-card .border-emerald-200{border-color:color-mix(in srgb,var(--t1) 50%,transparent)!important}' +
      S + '[data-nk-ink="dark"] #nk-cloud-card .bg-emerald-600,' + S + '[data-nk-ink="dark"] .bg-sky-600,' + S + '[data-nk-ink="dark"] .bg-sky-500{color:#2a1c00!important}';
    // Formüller vb. için ortak yüzey renkleri (açık / koyu)
    css +=
      'body{--nk-surf:#ffffff;--nk-soft:#f8fafc;--nk-ink:#0f172a;--nk-mute:#475569;--nk-line:#e2e8f0;--nk-line2:#cbd5e1}' +
      'body.dark-mode{--nk-surf:#1d1e26;--nk-soft:#17181f;--nk-ink:#f0f0f4;--nk-mute:#c6c7d1;--nk-line:#34353f;--nk-line2:#44454f}' +
      S + '[data-nk-mode="dark"]{--nk-surf:color-mix(in srgb,var(--tcard) 92%,#fff 4%);--nk-soft:color-mix(in srgb,var(--tcard) 80%,#000)}';


    // Soru / not çözme ekranı: tema zemini, renkli üst/alt şerit, çerçeve ve düğmeler
    var R = S + ' #review-modal';
    css +=
      R + '{background-color:var(--tbase)!important;background-image:var(--tbg)!important;background-attachment:scroll!important}' +
      R + ' #review-header{background-color:color-mix(in srgb,var(--tcard) 82%,transparent)!important;border-bottom:2px solid color-mix(in srgb,var(--t1) 45%,transparent)!important;box-shadow:0 8px 20px -14px var(--tglow)!important;backdrop-filter:blur(10px)}' +
      R + ' #review-progress-bar{background-color:color-mix(in srgb,var(--tcard) 70%,transparent)!important;border-bottom-color:transparent!important}' +
      R + ' #review-progress-bar .bg-slate-200{background-color:color-mix(in srgb,var(--t1) 18%,transparent)!important}' +
      R + ' #review-progress-bar .bg-teal-600{background-image:linear-gradient(90deg,var(--t1),var(--t2))!important}' +
      R + ' .bg-slate-100\\/50{background-color:transparent!important}' +
      R + ' #review-breadcrumbs{color:var(--ta)!important;font-weight:800}' +
      R + ' #review-frame-box{border:1.5px solid color-mix(in srgb,var(--t1) 40%,transparent)!important;box-shadow:0 14px 34px -18px var(--tglow)!important;background:color-mix(in srgb,var(--tcard) 92%,transparent)!important}' +
      R + ' #review-flip-front{background:transparent!important}' +
      R + ' #review-question-text{border-color:color-mix(in srgb,var(--t1) 30%,transparent)!important}' +
      R + ' #review-unified-board{border-color:color-mix(in srgb,var(--t1) 38%,transparent)!important}' +
      R + ' > .bg-white.border-t{background-color:color-mix(in srgb,var(--tcard) 84%,transparent)!important;border-top:2px solid color-mix(in srgb,var(--t2) 40%,transparent)!important;backdrop-filter:blur(10px)}' +
      R + ' [id^="choice-btn-"]:not(:disabled):not(.bg-green-500):not(.bg-red-500){border-color:color-mix(in srgb,var(--t1) 45%,transparent)!important;color:var(--ta);font-weight:800}' +
      R + ' [id^="choice-btn-"]:not(:disabled):not(.bg-green-500):not(.bg-red-500):hover,' + R + ' [id^="choice-btn-"]:not(:disabled):not(.bg-green-500):not(.bg-red-500):active{background-image:linear-gradient(135deg,var(--t1),var(--t2))!important;color:#fff!important;border-color:transparent!important}' +
      R + ' #btn-rev-prev,' + R + ' #btn-rev-next{border-color:color-mix(in srgb,var(--t1) 35%,transparent)!important;color:var(--ta)!important}' +
      R + ' #review-text-val{border-color:color-mix(in srgb,var(--t1) 40%,transparent)!important}' +
      // 4 hatırlama düğmesi ve ilerleme parçaları anlam taşıyor: mavi kalsın
      R + ' #recall-btn-veryeasy{background-image:none!important}' +
      R + ' #recall-btn-veryeasy:disabled{background-color:#e2e8f0!important;border-color:#cbd5e1!important}' +
      M('dark') + ' #review-modal #recall-btn-veryeasy:disabled{background-color:#34353f!important;border-color:#34353f!important}' +
      R + ' #recall-btn-veryeasy:not(:disabled),' + R + ' #review-progress-bar .bg-sky-500{background-image:none!important;background-color:#0284c7!important;border-color:#0284c7!important}' +
      // Neon: çerçeveye hafif parıltı
      K('neon') + ' #review-modal #review-frame-box{box-shadow:0 0 0 1px color-mix(in srgb,var(--t1) 35%,transparent),0 0 26px -10px var(--tglow)!important}' +
      // Koyu temalarda yeşil kutu daha açık ve okunur
      M('dark') + '{--box-green-accent:#34d399;--board-bg:color-mix(in srgb,var(--tcard) 82%,#fff 9%)}';

    // Ayarlar'daki tema seçici
    css +=
      '.nk-th-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}' +
      '.nk-th{border:0;background:transparent;padding:0;text-align:center;font-family:inherit}' +
      '.nk-th i{display:block;height:46px;border-radius:14px;border:2px solid transparent;box-shadow:0 0 0 1px rgba(15,23,42,.12) inset}' +
      '.nk-th.on i{border-color:#0f172a;box-shadow:0 0 0 2px #fff inset,0 6px 14px -6px rgba(15,23,42,.5)}' +
      'body.dark-mode .nk-th.on i{border-color:#fff}' +
      '.nk-th span{display:block;margin-top:5px;font-size:11px;font-weight:700;color:#475569}' +
      'body.dark-mode .nk-th span{color:#c6c7d1}' +
      '.nk-rnd{display:flex;align-items:center;gap:10px;margin:12px 0 2px;padding:9px 12px;border-radius:14px;background:var(--tsoft,#f1f5f9);border:0;width:100%;text-align:left;font-family:inherit}' +
      '.nk-rnd b{flex:1;font-size:12px;font-weight:800;color:var(--nk-ink,#0f172a)}' +
      '.nk-rnd small{display:block;font-size:10px;font-weight:600;color:var(--nk-mute,#475569);margin-top:1px}' +
      '.nk-sw{width:38px;height:22px;border-radius:99px;background:#94a3b8;position:relative;transition:background .2s;flex:none}' +
      '.nk-sw:after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .2s}' +
      '.nk-rnd.on .nk-sw{background:linear-gradient(135deg,var(--t1,#0d9488),var(--t2,#14b8a6))}' +
      '.nk-rnd.on .nk-sw:after{transform:translateX(16px)}' +
      '.nk-th{position:relative}' +
      '.nk-th.off i{opacity:.28;filter:grayscale(1)}' +
      '.nk-th.chk:after{content:"✓";position:absolute;top:4px;right:6px;width:16px;height:16px;border-radius:50%;background:#fff;color:#0f172a;font-size:11px;font-weight:900;line-height:16px;box-shadow:0 1px 4px rgba(0,0,0,.3)}' +
      '.nk-th-g{margin:14px 0 6px;font-size:10px;font-weight:800;letter-spacing:.08em;color:#94a3b8;text-transform:uppercase}' +
      '';
    return css;
  }

  function injectCss() {
    var old = document.getElementById('nk-tema-css');
    if (old) old.remove();
    var early = document.getElementById('nk-tema-early');
    if (early) early.remove();
    var st = document.createElement('style');
    st.id = 'nk-tema-css';
    st.textContent = sheet();
    document.head.appendChild(st);
  }

  function setMeta(t) {
    try {
      var m = document.getElementById('meta-theme-color');
      if (m) m.setAttribute('content', t.mode === 'dark' ? (t.id && t.t1 ? '#07070d' : '#131319') : (t.id ? '#fbf7ff' : '#f8fafc'));
    } catch (e) {}
  }

  // Zemin (açık/koyu) temaya bağlıdır
  function syncMode(t) {
    var want = t.mode === 'dark';
    try {
      if (typeof applyDarkMode === 'function' && (isDark() !== want || !!appState.darkMode !== want)) { appState.darkMode = want; applyDarkMode(want); }
    } catch (e) {}
  }

  function paint(t) {
    if (!document.getElementById('nk-tema-css')) injectCss();
    var b = document.body;
    if (!b) return;
    if (t.t1) {
      b.setAttribute('data-nk-theme', t.id);
      b.setAttribute('data-nk-kind', t.kind);
      b.setAttribute('data-nk-lay', String(t.lay || 0));
      b.setAttribute('data-nk-mode', t.mode);
      if (t.ink) b.setAttribute('data-nk-ink', t.ink); else b.removeAttribute('data-nk-ink');
    } else {
      ['data-nk-theme', 'data-nk-kind', 'data-nk-lay', 'data-nk-mode', 'data-nk-ink'].forEach(function (a) { b.removeAttribute(a); });
    }
    setMeta(t);
    try { var sn = JSON.parse(localStorage.getItem('nk_th_seen') || '[]') || []; var sid = t.id || 'klasik'; if (sn.indexOf(sid) < 0) { sn.push(sid); localStorage.setItem('nk_th_seen', JSON.stringify(sn)); } } catch (e) {}
    markSelected(t.id);
    // Bir sonraki açılışta ilk çizimden itibaren doğru tema görünsün diye önbelleğe al
    try {
      var cs = document.getElementById('nk-tema-css');
      if (t.t1 && cs && !rndOn()) {
        localStorage.setItem('nk_tema_cache', JSON.stringify({ id: t.id, css: cs.textContent, dark: t.mode === 'dark',
          attrs: { 'data-nk-theme': t.id, 'data-nk-kind': t.kind, 'data-nk-lay': String(t.lay || 0), 'data-nk-mode': t.mode, 'data-nk-ink': t.ink || '' } }));
      } else { localStorage.removeItem('nk_tema_cache'); }
    } catch (e) {}
  }

  function markSelected(id) {
    var g = document.getElementById('nk-th-wrap');
    if (!g) return;
    var sub = document.getElementById('nk-th-sub');
    var r = rndOn(), off = offList();
    var rb = document.getElementById('nk-rnd'); if (rb) { rb.classList.toggle('on', r); var rs = rb.querySelector('small'); if (rs) rs.textContent = r ? 'Her girişte havuzdan biri gelir. İstemediğine dokunup kapat.' : 'Her girişte farklı bir tema'; }
    if (sub) sub.textContent = r ? 'Rastgele · ' + pool().length + ' tema havuzda' : (find(id).name || 'Klasik');
    g.querySelectorAll('.nk-th').forEach(function (b) {
      var bid = b.getAttribute('data-id'), isOff = off.indexOf(bid) >= 0;
      b.classList.toggle('on', !r && bid === id);
      b.classList.toggle('off', r && isOff);
      b.classList.toggle('chk', r && !isOff);
    });
  }

  async function choose(id) {
    var t = find(id);
    try { localStorage.setItem(LS, id); } catch (e) {}
    try { appState.tema = id; } catch (e) {}
    syncMode(t);
    paint(t);
    try { haptic(10); } catch (e) {}
    try { await saveSettings(); } catch (e) {}
  }

  function toggleOff(id) {
    var off = offList(), i = off.indexOf(id);
    if (i >= 0) off.splice(i, 1); else { if (THEMES.length - off.length <= 1) return; off.push(id); }
    try { localStorage.setItem(LS_OFF, JSON.stringify(off)); haptic(8); } catch (e) {}
    markSelected(current().id);
  }

  function buildPicker() {
    if (document.getElementById('nk-th-wrap')) return true;
    var tg = document.getElementById('dark-mode-toggle');
    var list = tg && tg.closest('.divide-y');
    if (!list) return false;
    // Eski karanlık mod anahtarı kaldırıldı: zemin seçimi tema kartında
    var oldRow = tg.closest('.p-4');
    if (oldRow) oldRow.style.display = 'none';
    var row = document.createElement('div');
    row.className = 'p-4';
    row.id = 'nk-th-wrap';
    var head = '<button type="button" id="nk-th-head" class="w-full flex items-center gap-3 text-left"><div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">' +
      '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.3A4.9 4.9 0 0 0 22 11c0-4.4-4.5-8-10-8zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg></div>' +
      '<div class="flex-1 min-w-0"><p class="text-sm font-medium text-slate-800">Renk Teması</p><p id="nk-th-sub" class="text-xs text-slate-500 mt-0.5"></p></div><svg id="nk-th-chev" class="w-4 h-4 fill-current text-slate-400 transition-transform shrink-0" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></button><div id="nk-th-body" class="hidden">';
    var html = head + '<button type="button" id="nk-rnd" class="nk-rnd"><span style="font-size:18px">🎲</span><span style="flex:1"><b>Rastgele tema</b><small></small></span><i class="nk-sw"></i></button>';
    ['Açık', 'Koyu'].forEach(function (g) {
      html += '<div class="nk-th-g">' + g + '</div><div class="nk-th-grid">';
      THEMES.filter(function (t) { return t.group === g; }).forEach(function (t) {
        var sw = t.swatch || ('linear-gradient(135deg,' + t.t1 + ',' + t.t2 + ')');
        var glow = t.kind === 'neon' ? 'box-shadow:0 0 14px -2px ' + t.t1 + ';' : '';
        html += '<button type="button" class="nk-th" data-id="' + t.id + '"><i style="background:' + sw + ';' + glow + '"></i><span>' + t.name + '</span></button>';
      });
      html += '</div>';
    });
    html += '</div>';
    row.innerHTML = html;
    var open = false; try { open = localStorage.getItem('nk_th_open') === '1'; } catch (e) {}
    var setOpen = function (o) { row.querySelector('#nk-th-body').classList.toggle('hidden', !o); row.querySelector('#nk-th-chev').style.transform = o ? 'rotate(180deg)' : ''; try { localStorage.setItem('nk_th_open', o ? '1' : '0'); } catch (e) {} };
    setOpen(open);
    row.querySelector('#nk-th-head').onclick = function () { setOpen(row.querySelector('#nk-th-body').classList.contains('hidden')); };
    list.insertBefore(row, list.firstChild);
    row.querySelectorAll('.nk-th').forEach(function (b) { b.onclick = function () { var bid = b.getAttribute('data-id'); if (rndOn()) toggleOff(bid); else choose(bid); }; });
    row.querySelector('#nk-rnd').onclick = function () {
      var on = !rndOn(); try { localStorage.setItem(LS_R, on ? '1' : '0'); } catch (e) {}
      if (on) { try { localStorage.setItem(LS_LAST, current().id); } catch (e) {} }
      try { haptic(10); } catch (e) {}
      markSelected(current().id);
    };
    markSelected(current().id);
    return true;
  }

  function start() {
    if (rndOn()) { var rt = pickRandom(); try { window.__nkRndId = rt.id; } catch (e) {} }
    paint(current());
    // Başka bir yer karanlık modu değiştirirse temanın zeminine geri dön
    try {
      new MutationObserver(function () { var t = current(); if (isDark() !== (t.mode === 'dark')) syncMode(t); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
    var tries = 0;
    (function wait() {
      var okApp = typeof appState !== 'undefined' && appState && appState.field !== undefined;
      if (okApp) {
        var cloud = appState.tema;
        var local = ''; try { local = localStorage.getItem(LS) || ''; } catch (e) {}
        if (rndOn()) { appState.tema = local; }
        else if (typeof cloud === 'string' && cloud !== local) { try { localStorage.setItem(LS, cloud); } catch (e) {} }
        else if (typeof cloud !== 'string') {
          // Eski kullanıcı: tema seçmemiş ama karanlık modu açıksa Klasik Koyu olarak devam
          appState.tema = local || (appState.darkMode ? 'klasik-koyu' : '');
          try { localStorage.setItem(LS, appState.tema); } catch (e) {}
        }
        var t = current();
        syncMode(t);
        paint(t);
      }
      var pick = buildPicker();
      if ((!okApp || !pick) && ++tries < 120) setTimeout(wait, 500);
    })();
  }

  window.__nkTema = { choose: choose, themes: THEMES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
