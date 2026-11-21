/* Net Kalkanım - Kalem seti: renk paleti + fosforlu kalem (tekrar ve kamp ekranları) */
(function () {
  'use strict';
  var P = (window.__nkPen = window.__nkPen || { color: '#e11d48', hl: false, penSeen: false });
  var COLORS = [
    { c: '#e11d48', n: 'Kırmızı' }, { c: '#2563eb', n: 'Mavi' }, { c: '#16a34a', n: 'Yeşil' },
    { c: '#7c3aed', n: 'Mor' }, { c: 'ink', n: 'Siyah/Beyaz' }
  ];
  var css = document.createElement('style');
  css.textContent =
    '.nk-pal{display:flex;align-items:center;gap:7px;margin-left:6px;padding-left:8px;border-left:1px solid rgba(148,163,184,.5)}' +
    '.nk-pen-sw{width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.9);box-shadow:0 0 0 1px rgba(100,116,139,.5);padding:0;flex:none}' +
    '.nk-pen-sw.on{box-shadow:0 0 0 2.5px var(--ta,#0d9488);transform:scale(1.12)}' +
    '.nk-pen-sw.hl{background:linear-gradient(135deg,#fde047 55%,#fef9c3 55%);}' +
    '@media (min-width:700px){.nk-pen-sw{width:34px;height:34px}.nk-pal{gap:10px}}';
  document.head.appendChild(css);

  function paint(root) {
    root.querySelectorAll('.nk-pen-sw').forEach(function (b) {
      var on = b.dataset.hl ? P.hl : (!P.hl && b.dataset.c === P.color);
      b.classList.toggle('on', !!on);
    });
  }
  function build(host) {
    if (!host || host.querySelector('.nk-pal')) return;
    host.style.flexWrap = 'wrap';
    var d = document.createElement('div');
    d.className = 'nk-pal';
    COLORS.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'nk-pen-sw'; b.title = o.n; b.dataset.c = o.c;
      b.style.background = o.c === 'ink' ? 'linear-gradient(135deg,#111827 50%,#f8fafc 50%)' : o.c;
      b.onclick = function () { P.color = o.c; P.hl = false; document.querySelectorAll('.nk-pal').forEach(paint); };
      d.appendChild(b);
    });
    var h = document.createElement('button');
    h.type = 'button'; h.className = 'nk-pen-sw hl'; h.title = 'Fosforlu'; h.dataset.hl = '1';
    h.onclick = function () { P.hl = !P.hl; document.querySelectorAll('.nk-pal').forEach(paint); };
    d.appendChild(h);
    host.appendChild(d); paint(d);
  }
  function init() {
    build(document.getElementById('review-pen-sizes'));
    build(document.getElementById('camp-pen-sizes'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(init, 1500);
})();
