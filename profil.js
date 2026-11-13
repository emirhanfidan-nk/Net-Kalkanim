/* Net Kalkanım - Profil Kartı
   Ayarlar sekmesinin en üstüne: avatar, isim, seviye, seri ve istatistikler ekler.
   Seçilen isim/avatar buluta da yedeklenir (yedek.js). Mevcut verilere dokunmaz, sadece okur. */
(function () {
  'use strict';

  var LS = 'nk_profile';

  /* ---------- Simge seti (24x24 çizgi simgeler) ---------- */
  var ICONS = {
    kalkan: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    roket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    simsek: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    yildiz: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    kitap: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    hedef: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    sapka: '<path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    tac: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>',
    ates: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    not: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    saat: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
  };
  var AVATAR_ICONS = ['kalkan', 'roket', 'simsek', 'yildiz', 'kitap', 'hedef', 'sapka', 'tac', 'harf'];

  var GRADS = [
    ['#14b8a6', '#059669'],
    ['#6366f1', '#8b5cf6'],
    ['#f97316', '#e11d48'],
    ['#0ea5e9', '#2563eb'],
    ['#ec4899', '#a855f7'],
    ['#475569', '#1e293b']
  ];

  function svg(name, size, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' + (extra || '') + '>' + ICONS[name] + '</svg>';
  }

  /* ---------- Profil verisi ---------- */
  function load() {
    var d = { name: 'Öğrenci', icon: 'kalkan', grad: 0 };
    try {
      var p = JSON.parse(localStorage.getItem(LS) || 'null');
      if (p && typeof p === 'object') {
        if (p.name) d.name = String(p.name).slice(0, 20);
        if (p.icon && (ICONS[p.icon] || p.icon === 'harf')) d.icon = p.icon;
        if (typeof p.grad === 'number' && GRADS[p.grad]) d.grad = p.grad;
      }
    } catch (e) {}
    return d;
  }
  function save(p) { try { localStorage.setItem(LS, JSON.stringify(p)); } catch (e) {} }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Degrade daire içinde simge ya da baş harf
  function avatar(p, size, ring) {
    var g = GRADS[p.grad] || GRADS[0];
    var a = document.createElement('div');
    a.style.cssText = 'width:' + size + 'px;height:' + size + 'px;border-radius:9999px;flex-shrink:0;display:flex;align-items:center;' +
      'justify-content:center;color:#fff;background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ');' +
      (ring ? 'box-shadow:0 0 0 3px rgba(255,255,255,.55);' : '');
    if (p.icon === 'harf') {
      a.style.fontWeight = '800';
      a.style.fontSize = Math.round(size * 0.46) + 'px';
      a.textContent = (p.name || 'Ö').trim().charAt(0).toLocaleUpperCase('tr-TR');
    } else {
      a.innerHTML = svg(p.icon, Math.round(size * 0.5));
    }
    return a;
  }

  function tile(icon, color, value, label) {
    var t = el('div', 'bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center shadow-sm');
    var ic = document.createElement('div');
    ic.style.cssText = 'width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;color:' + color + ';background:' + color + '22';
    ic.innerHTML = svg(icon, 16);
    t.appendChild(ic);
    t.appendChild(el('div', 'text-base font-bold text-slate-800 tabular-nums leading-tight', String(value)));
    t.appendChild(el('div', 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5', label));
    return t;
  }

  /* ---------- Düzenleme penceresi ---------- */
  function openEditor() {
    var p = load();
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:24px;padding:20px;max-width:340px;width:100%;max-height:90vh;overflow-y:auto;text-align:center';

    var preview = document.createElement('div');
    preview.style.cssText = 'display:flex;justify-content:center;margin-bottom:14px';
    var input = document.createElement('input');
    input.maxLength = 20;
    input.value = p.name;
    input.placeholder = 'Adın';
    input.style.cssText = 'width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:12px;text-align:center;font-size:14px;font-weight:600;color:#1e293b;background:#fff;margin-bottom:14px';

    var iconGrid = document.createElement('div');
    iconGrid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px;justify-items:center';
    var gradRow = document.createElement('div');
    gradRow.style.cssText = 'display:flex;justify-content:center;gap:10px;margin-bottom:16px';

    function repaint() {
      p.name = input.value.trim().slice(0, 20) || 'Öğrenci';
      preview.innerHTML = '';
      preview.appendChild(avatar(p, 76, true));
      iconGrid.innerHTML = '';
      AVATAR_ICONS.forEach(function (ic) {
        var cell = document.createElement('button');
        cell.type = 'button';
        var on = p.icon === ic;
        cell.style.cssText = 'border-radius:9999px;padding:3px;border:2px solid ' + (on ? '#0d9488' : 'transparent') + ';background:transparent';
        cell.appendChild(avatar({ icon: ic, grad: p.grad, name: p.name }, 40, false));
        cell.onclick = function () { p.icon = ic; repaint(); };
        iconGrid.appendChild(cell);
      });
      gradRow.innerHTML = '';
      GRADS.forEach(function (g, gi) {
        var sw = document.createElement('button');
        sw.type = 'button';
        var on = p.grad === gi;
        sw.style.cssText = 'width:30px;height:30px;border-radius:9999px;background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ');' +
          'border:3px solid #fff;box-shadow:0 0 0 2px ' + (on ? '#0d9488' : '#e2e8f0');
        sw.onclick = function () { p.grad = gi; repaint(); };
        gradRow.appendChild(sw);
      });
    }
    input.oninput = function () {
      p.name = input.value.trim().slice(0, 20) || 'Öğrenci';
      if (p.icon === 'harf') repaint();
    };

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px';
    var cancel = document.createElement('button');
    cancel.textContent = 'Vazgeç';
    cancel.style.cssText = 'flex:1;padding:12px;border-radius:12px;font-weight:600;font-size:13px;background:#f1f5f9;color:#475569;border:none';
    var ok = document.createElement('button');
    ok.textContent = 'Kaydet';
    ok.style.cssText = 'flex:1;padding:12px;border-radius:12px;font-weight:600;font-size:13px;background:#0D9488;color:#fff;border:none';
    cancel.onclick = function () { ov.remove(); };
    ok.onclick = function () {
      save({ name: input.value.trim().slice(0, 20) || 'Öğrenci', icon: p.icon, grad: p.grad });
      ov.remove();
      render();
    };
    row.appendChild(cancel);
    row.appendChild(ok);

    box.appendChild(preview);
    box.appendChild(input);
    box.appendChild(iconGrid);
    box.appendChild(gradRow);
    box.appendChild(row);
    ov.appendChild(box);
    document.body.appendChild(ov);
    repaint();
  }

  /* ---------- Kart ---------- */
  var BOLT = '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>';
  var SHIELD = ICONS.kalkan;

  function ringAvatar(p, frac, level) {
    var S = 92, R = 42, C = 2 * Math.PI * R;
    var w = el('div', '');
    w.style.cssText = 'position:relative;width:' + S + 'px;height:' + S + 'px;flex-shrink:0';
    w.innerHTML = '<svg width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" style="position:absolute;inset:0;transform:rotate(-90deg)">' +
      '<circle cx="46" cy="46" r="' + R + '" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="5"/>' +
      '<circle cx="46" cy="46" r="' + R + '" fill="none" stroke="#fde68a" stroke-width="5" stroke-linecap="round" ' +
      'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '"/></svg>';
    var av = avatar(p, 70, false);
    av.style.position = 'absolute';
    av.style.left = '11px';
    av.style.top = '11px';
    w.appendChild(av);
    if (level) {
      var b = el('div', '', String(level));
      b.style.cssText = 'position:absolute;right:-2px;bottom:-2px;min-width:28px;height:28px;padding:0 6px;border-radius:9999px;' +
        'background:linear-gradient(135deg,#fbbf24,#f97316);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;' +
        'justify-content:center;box-shadow:0 0 0 3px #0f766e';
      w.appendChild(b);
    }
    return w;
  }

  function badgeChip(b) {
    var c = el('div', '');
    c.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;width:56px;flex-shrink:0';
    var g = (b.c || '#fbbf24,#f97316').split(',');
    var ic = el('div', '');
    ic.style.cssText = 'width:46px;height:46px;border-radius:9999px;display:flex;align-items:center;justify-content:center;' +
      (b.on ? 'color:#fff;background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ');box-shadow:0 4px 10px ' + g[1] + '55'
            : 'color:#cbd5e1;background:#f1f5f9;border:1px dashed #cbd5e1');
    ic.innerHTML = b.on
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="' + b.icon + '"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6z"/></svg>';
    c.appendChild(ic);
    var t = el('div', 'text-[10px] font-semibold text-center leading-tight', b.name);
    t.style.color = b.on ? '#334155' : '#94a3b8';
    c.appendChild(t);
    return c;
  }

  function render() {
    var tab = document.getElementById('profile');
    if (!tab || typeof appState === 'undefined') return;
    var old = document.getElementById('nk-profile-card');
    if (old) old.remove();

    var p = load();
    var qs = (appState.questions || []).length;
    var ns = (appState.notes || []).length;
    var ans = appState.totalAnswered || 0, cor = appState.totalCorrect || 0;
    var acc = ans > 0 ? Math.round(cor / ans * 100) + '%' : '–';
    var streak = 0;
    try { streak = calculateStreak(); } catch (e) {}

    var g = null;
    try { if (window.__nkOyun && window.__nkOyun.info) g = window.__nkOyun.info(); } catch (e) {}

    var card = el('div', 'space-y-3');
    card.id = 'nk-profile-card';

    var hero = el('div', 'rounded-3xl p-5 text-white');
    hero.style.background = 'linear-gradient(135deg,#134e4a,#0f766e 60%,#0d9488)';

    var frac = g ? Math.max(0.03, Math.min(1, (g.xp - g.from) / Math.max(1, g.to - g.from))) : 0;
    var top = el('div', 'flex items-center gap-4');
    top.appendChild(ringAvatar(p, frac, g ? g.level : 0));
    var info = el('div', 'min-w-0 flex-1');
    var nameRow = el('div', 'flex items-center gap-2');
    nameRow.appendChild(el('h3', 'text-lg font-bold truncate', p.name));
    var edit = el('button', 'text-[11px] font-semibold rounded-full px-2.5 py-1', 'Düzenle');
    edit.type = 'button';
    edit.style.cssText = 'background:rgba(255,255,255,.2);color:#fff';
    edit.onclick = openEditor;
    nameRow.appendChild(edit);
    info.appendChild(nameRow);

    var lvl = el('div', 'mt-1 text-sm font-bold');
    lvl.style.color = '#fde68a';
    lvl.textContent = g ? g.title + ' · Seviye ' + g.level : 'Öğrenci';
    info.appendChild(lvl);
    if (appState.field) info.appendChild(el('div', 'text-[11px] opacity-80 mt-0.5', appState.field));

    var badge = document.getElementById('yks-countdown-badge');
    if (badge && badge.textContent) {
      var cd = el('div', 'mt-1 flex items-center gap-1.5 text-[11px]');
      var ci = document.createElement('span');
      ci.style.cssText = 'display:inline-flex;opacity:.85';
      ci.innerHTML = svg('saat', 12);
      cd.appendChild(ci);
      cd.appendChild(el('span', '', badge.textContent));
      info.appendChild(cd);
    }
    top.appendChild(info);
    hero.appendChild(top);

    if (g) {
      var barWrap = el('div', 'mt-4');
      var row = el('div', 'flex items-center justify-between text-[11px] font-semibold mb-1.5');
      row.appendChild(el('span', '', g.xp + ' XP'));
      row.appendChild(el('span', '', 'Seviye ' + (g.level + 1) + ' için ' + (g.to - g.xp) + ' XP kaldı'));
      barWrap.appendChild(row);
      var track = el('div', 'w-full rounded-full overflow-hidden');
      track.style.cssText = 'height:8px;background:rgba(255,255,255,.2)';
      var fill = el('div', '');
      fill.style.cssText = 'height:100%;border-radius:9999px;background:linear-gradient(90deg,#fde68a,#fb923c);width:' + Math.round(frac * 100) + '%';
      track.appendChild(fill);
      barWrap.appendChild(track);
      hero.appendChild(barWrap);
    }
    card.appendChild(hero);

    var grid = el('div', 'grid grid-cols-3 gap-2');
    grid.appendChild(tile('ates', '#f97316', streak, 'Seri'));
    if (g) {
      grid.appendChild(tile('simsek', '#7c3aed', g.xp, 'Toplam XP'));
      grid.appendChild(tile('kalkan', '#0891b2', g.shields, 'Kalkan'));
    }
    grid.appendChild(tile('kitap', '#0d9488', qs, 'Soru'));
    grid.appendChild(tile('not', '#d97706', ns, 'Not'));
    grid.appendChild(tile('hedef', '#e11d48', acc, 'Doğruluk'));
    card.appendChild(grid);

    if (g && g.badges && g.badges.length) {
      var got = g.badges.filter(function (b) { return b.on; }).length;
      var box = el('button', 'w-full text-left bg-white border border-slate-200 rounded-2xl p-4 shadow-sm');
      box.type = 'button';
      box.id = 'nk-profile-badges';
      var head = el('div', 'flex items-center justify-between mb-3');
      head.appendChild(el('div', 'text-sm font-bold text-slate-800', 'Rozetlerim'));
      head.appendChild(el('div', 'text-xs font-semibold text-teal-600', got + ' / ' + g.badges.length + ' ›'));
      box.appendChild(head);
      var strip = el('div', '');
      strip.style.cssText = 'display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch';
      var sorted = g.badges.slice().sort(function (a, b) { return (b.on ? 1 : 0) - (a.on ? 1 : 0); });
      sorted.forEach(function (b) { strip.appendChild(badgeChip(b)); });
      box.appendChild(strip);
      box.onclick = function () { try { window.__nkOyun.openBadges(); } catch (e) {} };
      card.appendChild(box);
    }

    var first = tab.children[0];
    if (first && first.nextSibling) tab.insertBefore(card, first.nextSibling);
    else tab.appendChild(card);
  }

  // Ayarlar sekmesi her açıldığında kartı tazele
  var origSwitch = window.switchTab;
  if (typeof origSwitch === 'function') {
    window.switchTab = function (tabId) {
      var r = origSwitch.apply(this, arguments);
      if (tabId === 'profile') { try { render(); } catch (e) { console.warn(e); } }
      return r;
    };
  }

  window.__nkProfile = { render: render };
})();
