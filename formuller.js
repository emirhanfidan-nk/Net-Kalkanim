/* Net Kalkanım - Formüller
   Derslere göre dizilmiş, arama yapılabilen bir formül başvuru bölümü. Tekrar kutularına GİRMEZ (ezberlenecek kart değil, bakılacak yer).
   - Hazır formüller (BUILTIN): herkeste görünür. Yeni formül eklemek için listeye bir satır eklemek yeterli.
   - Kişisel formüller: kullanıcı ekler (elle ya da Gemini ile), ayarlarla birlikte buluta yedeklenir (appState.formuller).
   - Favoriler (yıldız) cihaza özel tutulur. */
(function () {
  'use strict';

  /* ---------- Hazır formüller (herkeste) ----------
     { id: 'benzersiz-kısa-ad', ders: 'TYT MATEMATİK', baslik: 'Başlık', formul: 'Formül metni' }
     ders, uygulamadaki ders adıyla aynı olmalı (TYT MATEMATİK, AYT FİZİK ...). */
  var BUILTIN = [];

  var FAV = 'nk_fav_formul';

  function el(tag, css, text) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function toast(m, err) { try { showToast(m, !!err); } catch (e) {} }
  function norm(s) {
    return String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  }
  function pretty(c) {
    return String(c).toLocaleLowerCase('tr-TR').split(' ').map(function (w) {
      return /^(tyt|ayt)$/.test(w) ? w.toUpperCase() : w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1);
    }).join(' ');
  }
  function favs() { try { return JSON.parse(localStorage.getItem(FAV) || '{}') || {}; } catch (e) { return {}; } }
  function setFav(id, on) { var f = favs(); if (on) f[id] = 1; else delete f[id]; try { localStorage.setItem(FAV, JSON.stringify(f)); } catch (e) {} }

  function userList() {
    if (!Array.isArray(appState.formuller)) appState.formuller = [];
    return appState.formuller;
  }
  function courses() {
    var c = Object.keys((appState && appState.categories) || {});
    BUILTIN.forEach(function (f) { if (c.indexOf(f.ders) < 0) c.push(f.ders); });
    userList().forEach(function (f) { if (!f.deleted && c.indexOf(f.ders) < 0) c.push(f.ders); });
    return c;
  }
  function all() {
    var mine = userList().filter(function (f) { return !f.deleted; }).map(function (f) { return Object.assign({ mine: true }, f); });
    return BUILTIN.map(function (f) { return Object.assign({ mine: false }, f); }).concat(mine);
  }

  /* ---------- Ana pencere ---------- */
  var state = { q: '', course: '', chipLeft: 0 };
  var root = null;

  function close() {
    if (root) { root.remove(); root = null; }
    try { closeWithBackSupport('formul'); } catch (e) {}
  }

  function open() {
    if (root) return;
    state = { q: '', course: '', chipLeft: 0 };
    root = el('div', 'position:fixed;inset:0;z-index:2147482000;background:#f8fafc;display:flex;flex-direction:column;font-family:inherit');
    root.id = 'nk-formul';
    document.body.appendChild(root);
    try { openWithBackSupport('formul', close); } catch (e) {}
    paint();
  }

  function paint() {
    if (!root) return;
    var oldChips = root.querySelector('#nk-fm-chips');
    if (oldChips) state.chipLeft = oldChips.scrollLeft;
    var keepScroll = root.querySelector('#nk-fm-list');
    var st = keepScroll ? keepScroll.scrollTop : 0;
    root.innerHTML = '';

    var head = el('div', 'display:flex;align-items:center;gap:10px;padding:14px 16px 8px;background:#fff;border-bottom:1px solid #e2e8f0');
    var back = el('button', 'width:38px;height:38px;border-radius:12px;border:0;background:#f1f5f9;color:#334155;font-size:18px;font-weight:700', '←');
    back.onclick = close;
    head.appendChild(back);
    head.appendChild(el('div', 'flex:1;font-weight:800;font-size:18px;color:#0f172a', 'Formüller'));
    var add = el('button', 'padding:9px 14px;border-radius:12px;border:0;background:#0d9488;color:#fff;font-weight:800;font-size:12px;box-shadow:0 3px 0 #0f766e', '+ Ekle');
    add.onclick = function () { openAdd(null); };
    head.appendChild(add);
    root.appendChild(head);

    var bar = el('div', 'padding:10px 16px 6px;background:#fff');
    var inp = el('input', 'width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-size:13px;color:#0f172a;background:#fff');
    inp.type = 'search';
    inp.placeholder = 'Formül ara (ör. tork, türev)';
    inp.value = state.q;
    inp.oninput = function () { state.q = inp.value; list(); };
    bar.appendChild(inp);
    root.appendChild(bar);

    var chips = el('div', 'display:flex;gap:6px;overflow-x:auto;padding:4px 16px 10px;background:#fff;border-bottom:1px solid #e2e8f0;-webkit-overflow-scrolling:touch');
    function chip(label, val) {
      var on = state.course === val;
      var b = el('button', 'flex-shrink:0;padding:6px 12px;border-radius:9999px;font-size:11px;font-weight:700;border:1px solid ' + (on ? '#0d9488' : '#cbd5e1') + ';background:' + (on ? '#0d9488' : '#fff') + ';color:' + (on ? '#fff' : '#475569'), label);
      b.onclick = function () { state.course = val; paint(); };
      chips.appendChild(b);
    }
    chip('Tümü', '');
    courses().forEach(function (c) { chip(pretty(c), c); });
    chips.id = 'nk-fm-chips';
    root.appendChild(chips);
    chips.scrollLeft = state.chipLeft;

    var lst = el('div', 'flex:1;overflow-y:auto;padding:12px 16px 90px');
    lst.id = 'nk-fm-list';
    root.appendChild(lst);
    list();
    lst.scrollTop = st;
  }

  function list() {
    var lst = root && root.querySelector('#nk-fm-list');
    if (!lst) return;
    lst.innerHTML = '';
    var f = favs(), q = norm(state.q).trim();
    var items = all().filter(function (x) {
      if (state.course && x.ders !== state.course) return false;
      if (q && norm(x.baslik + ' ' + x.formul + ' ' + x.ders).indexOf(q) < 0) return false;
      return true;
    });
    var order = courses();
    items.sort(function (a, b) {
      var fa = f[a.id] ? 0 : 1, fb = f[b.id] ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return order.indexOf(a.ders) - order.indexOf(b.ders);
    });

    if (!items.length) {
      var empty = el('div', 'text-align:center;color:#64748b;padding:48px 16px;font-size:13px;line-height:1.6');
      empty.innerHTML = all().length
        ? 'Bu aramayla eşleşen formül yok.'
        : '<b style="color:#0f172a">Henüz formül yok.</b><br>Sağ üstten <b>+ Ekle</b> ile kendi formülünü ekleyebilirsin. Gemini ile de ekleyebilirsin: Ekle sekmesindeki "Gemini ile ekle" düğmesine bas ve adımları izle.';
      lst.appendChild(empty);
      return;
    }

    var lastCourse = null;
    items.forEach(function (x) {
      var starred = !!f[x.id];
      if (!state.course && !starred && x.ders !== lastCourse) {
        lastCourse = x.ders;
        lst.appendChild(el('div', 'margin:14px 2px 6px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#64748b;text-transform:uppercase', pretty(x.ders)));
      }
      var card = el('div', 'background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(15,23,42,.04)');
      var top = el('div', 'display:flex;align-items:flex-start;gap:8px');
      var t = el('div', 'flex:1;font-weight:800;font-size:14px;color:#0f172a;line-height:1.3', x.baslik);
      top.appendChild(t);
      var star = el('button', 'border:0;background:transparent;font-size:20px;line-height:1;color:' + (starred ? '#f59e0b' : '#cbd5e1'), '★');
      star.setAttribute('aria-label', 'Yıldızla');
      star.onclick = function () { setFav(x.id, !starred); list(); };
      top.appendChild(star);
      card.appendChild(top);
      if (starred) card.appendChild(el('div', 'font-size:10px;font-weight:800;color:#64748b;margin-top:2px', pretty(x.ders)));
      var body = el('div', 'margin-top:8px;font-size:16px;line-height:1.7;color:#0f766e;font-weight:600;white-space:pre-wrap;word-break:break-word', x.formul);
      card.appendChild(body);
      if (x.mine) {
        var row = el('div', 'display:flex;gap:14px;margin-top:10px');
        var ed = el('button', 'border:0;background:transparent;font-size:11px;font-weight:700;color:#0d9488;padding:0', 'Düzenle');
        ed.onclick = function () { openAdd(x); };
        var del = el('button', 'border:0;background:transparent;font-size:11px;font-weight:700;color:#e11d48;padding:0', 'Sil');
        del.onclick = function () { remove(x.id); };
        row.appendChild(ed); row.appendChild(del);
        card.appendChild(row);
      }
      lst.appendChild(card);
    });
  }

  /* ---------- Kaydetme ---------- */
  async function persist() { try { await saveSettings(); } catch (e) { console.warn(e); } }

  async function remove(id) {
    var l = userList();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) { l[i] = { id: id, deleted: true }; }
    await persist();
    toast('Formül silindi');
    list();
  }

  /* ---------- Ekleme / düzenleme formu ---------- */
  function openAdd(item, pre) {
    var d = item || pre || {};
    var ov = el('div', 'position:fixed;inset:0;z-index:2147483200;background:rgba(15,23,42,.6);display:flex;align-items:flex-end;justify-content:center;padding:12px');
    var box = el('div', 'background:#fff;border-radius:24px;padding:18px;width:100%;max-width:420px;max-height:92vh;overflow-y:auto');
    box.appendChild(el('div', 'font-weight:800;font-size:16px;color:#0f172a;margin-bottom:12px', item ? 'Formülü düzenle' : 'Yeni formül'));

    function lab(t) { box.appendChild(el('div', 'font-size:11px;font-weight:700;color:#64748b;margin:10px 0 4px', t)); }
    lab('Ders');
    var sel = el('select', 'width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:11px;font-size:13px;background:#fff;color:#0f172a');
    var cs = Object.keys((appState && appState.categories) || {});
    if (d.ders && cs.indexOf(d.ders) < 0) cs.push(d.ders);
    if (!cs.length) cs = ['GENEL'];
    cs.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = pretty(c); if (c === d.ders || (!d.ders && c === state.course)) o.selected = true; sel.appendChild(o); });
    box.appendChild(sel);
    lab('Başlık');
    var tin = el('input', 'width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:11px;font-size:13px;color:#0f172a;background:#fff');
    tin.value = d.baslik || ''; tin.placeholder = 'ör. Tork'; tin.maxLength = 80;
    box.appendChild(tin);
    lab('Formül');
    var fin = el('textarea', 'width:100%;height:110px;border:1px solid #cbd5e1;border-radius:12px;padding:11px;font-size:14px;color:#0f172a;background:#fff');
    fin.value = d.formul || ''; fin.placeholder = 'ör. τ = F · d · sinθ'; fin.maxLength = 1500;
    box.appendChild(fin);

    var row = el('div', 'display:flex;gap:8px;margin-top:14px');
    var cancel = el('button', 'flex:1;padding:12px;border-radius:12px;border:0;background:#f1f5f9;color:#475569;font-weight:700;font-size:13px', 'Vazgeç');
    cancel.onclick = function () { ov.remove(); };
    var ok = el('button', 'flex:1;padding:12px;border-radius:12px;border:0;background:#0d9488;color:#fff;font-weight:800;font-size:13px', 'Kaydet');
    ok.onclick = async function () {
      var b = tin.value.trim(), f = fin.value.trim();
      if (!b || !f) { toast('Başlık ve formülü yaz!', true); return; }
      var l = userList();
      if (item) {
        l.forEach(function (x) { if (x.id === item.id) { x.ders = sel.value; x.baslik = b; x.formul = f; } });
      } else {
        l.push({ id: 'u' + Date.now(), ders: sel.value, baslik: b, formul: f });
      }
      ov.remove();
      await persist();
      toast('Formül kaydedildi');
      if (!root) open(); else paint();
    };
    row.appendChild(cancel); row.appendChild(ok);
    box.appendChild(row);
    ov.appendChild(box);
    document.body.appendChild(ov);
  }

  function start() { /* giriş düğmesi üst çubukta (index.html) */ }

  window.__nkFormul = {
    open: open,
    openAdd: openAdd,
    // Gemini'den gelen kayıt: ders listede varsa seçilir
    addFromParsed: function (p) {
      var cs = Object.keys((appState && appState.categories) || {});
      var w = norm(p.ders), found = '';
      cs.forEach(function (c) { var n = norm(c); if (!found && w && (n === w || n.indexOf(w) >= 0 || w.indexOf(n) >= 0)) found = c; });
      openAdd(null, { ders: found, baslik: p.baslik || p.on || '', formul: p.formul || p.not || '' });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
