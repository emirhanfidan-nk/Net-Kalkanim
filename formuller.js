/* Net Kalkanım - Formüller
   Derslere göre dizilmiş, arama yapılabilen bir formül başvuru bölümü. Tekrar kutularına GİRMEZ (ezberlenecek kart değil, bakılacak yer).
   - Hazır formüller (BUILTIN): herkeste görünür. Yeni formül eklemek için listeye bir satır eklemek yeterli.
   - Kişisel formüller: kullanıcı ekler (elle ya da Gemini ile), ayarlarla birlikte buluta yedeklenir (appState.formuller).
   - Favoriler (yıldız) cihaza özel tutulur. */
(function () {
  'use strict';

  /* ---------- Hazır formüller (herkeste) ----------
     { id: 'benzersiz-kısa-ad', ders: 'TYT MATEMATİK', baslik: 'Başlık', formul: 'Formül metni', kaynak: 'İsteğe bağlı: nereden geldiği' }
     ders, uygulamadaki ders adıyla aynı olmalı (TYT MATEMATİK, AYT FİZİK ...). */
  var BUILTIN = [
    { id: 'fz1', ders: 'AYT FİZİK', baslik: "Bağıl Hız", formul: "$\\vec{v}_{\\text{bağıl}} = \\vec{v}_{\\text{gözlenen}} - \\vec{v}_{\\text{gözlemci}}$" },
    { id: 'fz2', ders: 'AYT FİZİK', baslik: "Newton’un 2. Yasası ve Sürtünme", formul: "$F_{\\text{net}} = m \\cdot a$\n$f_s = k \\cdot N$" },
    { id: 'fz3', ders: 'AYT FİZİK', baslik: "Sabit İvmeli Hareket", formul: "$v = v_0 \\pm a t$\n$x = v_0 t \\pm \\frac{1}{2} a t^2$\n$v^2 = v_0^2 \\pm 2 a x$" },
    { id: 'fz4', ders: 'AYT FİZİK', baslik: "Atışlar", formul: "$h = \\frac{1}{2} g t^2$\n$v = g t$\n$t_{\\text{çıkış}} = \\frac{v_{0y}}{g}$\n$x_{\\text{menzil}} = v_{0x} \\cdot t_{\\text{uçuş}}$" },
    { id: 'fz5', ders: 'AYT FİZİK', baslik: "İş, Güç ve Enerji", formul: "$W = F \\cdot \\Delta x \\cdot \\cos\\theta$\n$E_k = \\frac{1}{2} m v^2$\n$E_p = m g h$\n$E_{\\text{yay}} = \\frac{1}{2} k x^2$\n$P = \\frac{W}{t}$" },
    { id: 'fz6', ders: 'AYT FİZİK', baslik: "İtme ve Momentum", formul: "$\\vec{I} = \\vec{F}_{\\text{ort}} \\cdot \\Delta t = \\Delta \\vec{P}$\n$\\vec{P} = m \\cdot \\vec{v}$\n$\\vec{P}_{\\text{ilk}} = \\vec{P}_{\\text{son}}$" },
    { id: 'fz7', ders: 'AYT FİZİK', baslik: "Tork ve Basit Makineler", formul: "$\\tau = F \\cdot d \\cdot \\sin\\theta$\n$F \\cdot x_F = P \\cdot x_P$\n$\\text{Verim} = \\frac{W_{\\text{alınan}}}{W_{\\text{verilen}}}$" },
    { id: 'fz8', ders: 'AYT FİZİK', baslik: "Elektriksel Kuvvet ve Alan", formul: "$F = k \\frac{q_1 q_2}{d^2}$\n$E = \\frac{F}{q} = k \\frac{q}{d^2}$" },
    { id: 'fz9', ders: 'AYT FİZİK', baslik: "Elektriksel Potansiyel ve İş", formul: "$V = k \\frac{q}{d}$\n$E_p = k \\frac{q_1 q_2}{d}$\n$W = q \\cdot \\Delta V$" },
    { id: 'fz10', ders: 'AYT FİZİK', baslik: "Paralel Levhalar ve Sığa", formul: "$E = \\frac{V}{d}$\n$F = q \\cdot E = \\frac{q V}{d}$\n$C = \\frac{Q}{V} = \\varepsilon_0 \\frac{A}{d}$\n$E_{\\text{sığa}} = \\frac{1}{2} C V^2$" },
    { id: 'fz11', ders: 'AYT FİZİK', baslik: "Manyetik Alan (B)", formul: "Düz tel: $B = \\frac{2 k i}{d}$\nÇember merkezinde: $B = \\frac{2 k \\pi i}{r}$\nAkım makarası (bobin): $B = \\frac{4 k \\pi N i}{L}$" },
    { id: 'fz12', ders: 'AYT FİZİK', baslik: "Manyetik Kuvvet ve Tork", formul: "Akım geçen tele: $F = B \\cdot i \\cdot l \\cdot \\sin\\alpha$\nHareketli yüke: $F = q \\cdot v \\cdot B \\cdot \\sin\\alpha$\n$r = \\frac{m v}{q B}$\nÇerçeveye etkiyen tork: $\\tau = B \\cdot i \\cdot A \\cdot N$" },
    { id: 'fz13', ders: 'AYT FİZİK', baslik: "İndüksiyon ve Öz İndüksiyon", formul: "$\\Phi = B \\cdot A \\cdot \\cos\\alpha$\n$\\varepsilon = -\\frac{\\Delta \\Phi}{\\Delta t} = B \\cdot v \\cdot l$\n$\\varepsilon_{\\text{öz}} = -L \\frac{\\Delta i}{\\Delta t}$" },
    { id: 'fz14', ders: 'AYT FİZİK', baslik: "Alternatif Akım ve Transformatörler", formul: "Etkin değerler: $V_{\\text{etkin}} = \\frac{V_{\\text{max}}}{\\sqrt{2}}$\n$i_{\\text{etkin}} = \\frac{i_{\\text{max}}}{\\sqrt{2}}$\nReaktans ve Empedans: $X_L = \\omega L = 2\\pi f L$\n$X_C = \\frac{1}{\\omega C} = \\frac{1}{2\\pi f C}$\n$Z = \\sqrt{R^2 + (X_L - X_C)^2}$\nTransformatör: $\\frac{V_p}{V_s} = \\frac{N_p}{N_s}$\n$\\text{Verim} = \\frac{V_s \\cdot i_s}{V_p \\cdot i_p}$" },
    { id: 'fz15', ders: 'AYT FİZİK', baslik: "Düzgün Çembersel Hareket", formul: "Hız ve Periyot: $T \\cdot f = 1$\n$\\omega = \\frac{2\\pi}{T} = 2\\pi f$\n$v = \\omega \\cdot r = \\frac{2\\pi r}{T}$\nİvme ve Kuvvet: $a_m = \\frac{v^2}{r} = \\omega^2 r$\n$F_m = m \\frac{v^2}{r} = m \\omega^2 r$\nVirajlar: $v_{\\text{yatay, max}} = \\sqrt{k g r}$\n$v_{\\text{eğimli}} = \\sqrt{g r \\tan\\alpha}$" },
    { id: 'fz16', ders: 'AYT FİZİK', baslik: "Dönme ve Açısal Momentum", formul: "Eylemsizlik Momenti ve Enerji: $I = \\sum m r^2$\n$E_{\\text{dönme}} = \\frac{1}{2} I \\omega^2$\n$E_{\\text{top}} = \\frac{1}{2} m v^2 + \\frac{1}{2} I \\omega^2$\nAçısal Momentum ve Tork: $L = I \\cdot \\omega = m \\cdot v \\cdot r$\n$\\tau_{\\text{net}} = I \\cdot \\alpha = \\frac{\\Delta L}{\\Delta t}$" },
    { id: 'fz17', ders: 'AYT FİZİK', baslik: "Kütle Çekim ve Kepler", formul: "Çekim Kuvveti ve İvmesi: $F = G \\frac{m_1 m_2}{d^2}$\n$g = G \\frac{M}{r^2}$\nYörünge ve Kurtulma Hızı: $v_{\\text{yörünge}} = \\sqrt{\\frac{G M}{r}}$\n$v_{\\text{kurtulma}} = \\sqrt{\\frac{2 G M}{r}}$\nEnerjiler: $E_{\\text{pot}} = -G \\frac{M m}{r}$\n$E_{\\text{top}} = -G \\frac{M m}{2r}$\n$E_{\\text{bağlanma}} = +G \\frac{M m}{2r}$\nKepler Periyot Yasası: $\\frac{R^3}{T^2} = \\text{sabit}$" },
    { id: 'fz18', ders: 'AYT FİZİK', baslik: "Basit Harmonik Hareket", formul: "Konum, Hız, İvme, Kuvvet: $x = r \\sin(\\omega t)$\n$v = \\omega \\sqrt{r^2 - x^2} \\; (v_{\\text{max}} = \\omega r)$\n$a = -\\omega^2 x \\; (a_{\\text{max}} = \\omega^2 r)$\n$F = -m \\omega^2 x$\nPeriyotlar: $T_{\\text{yay}} = 2\\pi \\sqrt{\\frac{m}{k}}$\n$T_{\\text{sarkaç}} = 2\\pi \\sqrt{\\frac{L}{g}}$" },
    { id: 'fz19', ders: 'AYT FİZİK', baslik: "Çift Yarıkta Girişim (Young)", formul: "$\\Delta x = \\frac{L \\cdot \\lambda}{d \\cdot n}$\n$\\Delta s = n \\lambda$ (Aydınlık)\n$\\Delta s = \\left(n - \\frac{1}{2}\\right)\\lambda$ (Karanlık)" },
    { id: 'fz20', ders: 'AYT FİZİK', baslik: "Tek Yarıkta Kırınım", formul: "$\\Delta x = \\frac{L \\cdot \\lambda}{w \\cdot n}$\n$\\Delta s = \\left(n + \\frac{1}{2}\\right)\\lambda$ (Aydınlık)\n$\\Delta s = n \\lambda$ (Karanlık)" },
    { id: 'fz21', ders: 'AYT FİZİK', baslik: "Elektromanyetik Dalgalar", formul: "$c = \\lambda \\cdot f$\n$\\frac{E}{B} = c$" },
    { id: 'fz22', ders: 'AYT FİZİK', baslik: "Bohr Atom Modeli", formul: "$r_n = a_0 \\frac{n^2}{Z}$\n$E_n = -13{,}6 \\frac{Z^2}{n^2}\\text{ eV}$\n$L_n = n \\frac{h}{2\\pi}$" },
    { id: 'fz23', ders: 'AYT FİZİK', baslik: "Fotoelektrik Olay", formul: "$E_{\\text{foton}} = h \\cdot f = \\frac{h c}{\\lambda}$\n$E_{\\text{foton}} = E_0 + E_{k,\\text{max}}$\n$E_0 = h f_0 = \\frac{h c}{\\lambda_0}$\n$E_{k,\\text{max}} = e \\cdot V_{\\text{kesme}}$" },
    { id: 'fz24', ders: 'AYT FİZİK', baslik: "Compton Saçılması ve De Broglie", formul: "$E_{\\text{gelen}} = E_{\\text{saçılan}} + E_{k,\\text{elektron}}$\n$\\Delta \\lambda = \\lambda' - \\lambda = \\frac{h}{m_e c}(1 - \\cos\\theta)$\n$\\lambda = \\frac{h}{P} = \\frac{h}{m v}$" }
  ];

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
  /* ---------- KaTeX (uygulamayla birlikte, internetsiz çalışır) ---------- */
  var kx = { st: 0 };   // 0 yüklenmedi, 1 yükleniyor, 2 hazır, 3 hata
  function loadKatex() {
    if (window.katex) { kx.st = 2; return; }
    if (kx.st) return;
    kx.st = 1;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'katex/katex.min.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = 'katex/katex.min.js';
    sc.onload = function () { kx.st = 2; try { if (host() && host().offsetParent !== null) list(); } catch (e) {} };
    sc.onerror = function () { kx.st = 3; };
    document.head.appendChild(sc);
  }
  function plainTex(t) { return t.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\(cdot|times)/g, '·').replace(/\\([a-zA-Z]+)/g, '$1').replace(/[{}]/g, ''); }
  // "Etiket: $formül$ (not)" biçimindeki satırı çizer; $...$ arası matematik olarak gösterilir
  function renderLine(line) {
    var d = el('div', 'margin-top:6px;font-size:16px;line-height:1.5;color:#0f766e;font-weight:600;overflow-x:auto;overflow-y:hidden;max-width:100%');
    var parts = line.split('$');
    if (parts.length < 3) { d.textContent = line; return d; }
    parts.forEach(function (p, i) {
      if (i % 2 === 0) {
        if (p) { var sp = el('span', 'color:#475569;font-weight:600;font-size:13px', p); d.appendChild(sp); }
      } else if (kx.st === 2 && window.katex) {
        var m = el('span', 'font-size:1.1em');
        try { m.innerHTML = window.katex.renderToString(p, { throwOnError: false, displayMode: false }); }
        catch (e) { m.textContent = plainTex(p); }
        d.appendChild(m);
      } else {
        d.appendChild(el('span', '', plainTex(p)));
      }
    });
    return d;
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

  /* ---------- Sekme (denemeler gibi) ---------- */
  var state = { q: '', course: '' };
  function host() { return document.getElementById('formul-root'); }

  function open() {
    loadKatex();
    state.q = ''; state.course = '';
    try { switchTab('formul'); } catch (e) {}
  }
  function render() { loadKatex(); paint(); }

  function paint() {
    var root = host();
    if (!root) return;
    var oldList = root.querySelector('#nk-fm-list');
    root.innerHTML = '';

    var head = el('div', 'display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:12px');
    head.appendChild(el('h2', 'font-size:20px;font-weight:600;color:#1e293b;font-family:inherit', 'Formüller'));
    var add = el('button', 'padding:8px 14px;border-radius:12px;border:0;background:#0d9488;color:#fff;font-weight:800;font-size:12px;box-shadow:0 3px 0 #0f766e', '+ Ekle');
    add.onclick = function () { openAdd(null); };
    head.appendChild(add);
    root.appendChild(head);

    var inp = el('input', 'width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;font-size:13px;color:#0f172a;background:#fff;margin-bottom:10px');
    inp.type = 'search';
    inp.placeholder = 'Formül ara (ör. tork, momentum)';
    inp.value = state.q;
    inp.oninput = function () { state.q = inp.value; list(); };
    root.appendChild(inp);

    // Çipler alt alta sarılır (yatay kaydırma yok); sadece formülü olan dersler gösterilir
    var have = courses().filter(function (c) { return all().some(function (x) { return x.ders === c; }); });
    if (state.course && have.indexOf(state.course) < 0) state.course = '';
    var chips = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px');
    function chip(label, val) {
      var on = state.course === val;
      var b = el('button', 'padding:6px 12px;border-radius:9999px;font-size:11px;font-weight:700;border:1px solid ' + (on ? '#0d9488' : '#cbd5e1') + ';background:' + (on ? '#0d9488' : '#fff') + ';color:' + (on ? '#fff' : '#475569'), label);
      b.onclick = function () { state.course = val; paint(); };
      chips.appendChild(b);
    }
    chip('Tümü', '');
    have.forEach(function (c) { chip(pretty(c), c); });
    chips.id = 'nk-fm-chips';
    root.appendChild(chips);

    var lst = el('div', '');
    lst.id = 'nk-fm-list';
    root.appendChild(lst);
    list();
  }

  function list() {
    var lst = document.getElementById('nk-fm-list');
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
      var body = el('div', 'margin-top:4px');
      String(x.formul).split('\n').forEach(function (ln) { if (ln.trim()) body.appendChild(renderLine(ln)); });
      card.appendChild(body);
      if (x.kaynak) card.appendChild(el('div', 'margin-top:8px;font-size:10px;font-weight:600;color:#94a3b8', 'Kaynak: ' + x.kaynak));
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
    var ov = el('div', 'position:fixed;inset:0;z-index:2147483200;background:#fff;overflow-y:auto;font-family:inherit');
    var box = el('div', 'max-width:480px;margin:0 auto;padding:18px 18px 40px');
    var hd = el('div', 'display:flex;align-items:center;gap:10px;margin-bottom:8px');
    var bk = el('button', 'width:38px;height:38px;border-radius:12px;border:0;background:#f1f5f9;color:#334155;font-size:18px;font-weight:700', '←');
    bk.onclick = function () { ov.remove(); };
    hd.appendChild(bk);
    hd.appendChild(el('div', 'font-weight:800;font-size:17px;color:#0f172a', item ? 'Formülü düzenle' : 'Yeni formül'));
    box.appendChild(hd);

    function lab(t) { box.appendChild(el('div', 'font-size:11px;font-weight:700;color:#64748b;margin:14px 0 6px', t)); }
    lab('Ders');
    var cs = Object.keys((appState && appState.categories) || {});
    if (d.ders && cs.indexOf(d.ders) < 0) cs.push(d.ders);
    if (!cs.length) cs = ['GENEL'];
    var chosen = d.ders || state.course || cs[0];
    var wrap = el('div', 'display:flex;flex-wrap:wrap;gap:6px');
    function drawChips() {
      wrap.innerHTML = '';
      cs.forEach(function (c) {
        var on = c === chosen;
        var b = el('button', 'padding:7px 12px;border-radius:9999px;font-size:11px;font-weight:700;border:1px solid ' + (on ? '#0d9488' : '#cbd5e1') + ';background:' + (on ? '#0d9488' : '#fff') + ';color:' + (on ? '#fff' : '#475569'), pretty(c));
        b.onclick = function () { chosen = c; drawChips(); };
        wrap.appendChild(b);
      });
    }
    drawChips();
    box.appendChild(wrap);
    lab('Başlık');
    var tin = el('input', 'width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:11px;font-size:14px;color:#0f172a;background:#fff');
    tin.value = d.baslik || ''; tin.placeholder = 'ör. Tork'; tin.maxLength = 80;
    box.appendChild(tin);
    lab('Formül');
    var fin = el('textarea', 'width:100%;height:140px;border:1px solid #cbd5e1;border-radius:12px;padding:11px;font-size:15px;color:#0f172a;background:#fff');
    fin.value = d.formul || ''; fin.placeholder = 'ör. $\\tau = F \\cdot d \\cdot \\sin\\theta$  (matematik $ $ arasına yazılır)'; fin.maxLength = 1500;
    box.appendChild(fin);

    var row = el('div', 'display:flex;gap:8px;margin-top:18px');
    var cancel = el('button', 'flex:1;padding:13px;border-radius:12px;border:0;background:#f1f5f9;color:#475569;font-weight:700;font-size:13px', 'Vazgeç');
    cancel.onclick = function () { ov.remove(); };
    var ok = el('button', 'flex:1;padding:13px;border-radius:12px;border:0;background:#0d9488;color:#fff;font-weight:800;font-size:13px', 'Kaydet');
    ok.onclick = async function () {
      var b = tin.value.trim(), f = fin.value.trim();
      if (!b || !f) { toast('Başlık ve formülü yaz!', true); return; }
      var l = userList();
      if (item) {
        l.forEach(function (x) { if (x.id === item.id) { x.ders = chosen; x.baslik = b; x.formul = f; } });
      } else {
        l.push({ id: 'u' + Date.now(), ders: chosen, baslik: b, formul: f });
      }
      ov.remove();
      await persist();
      toast('Formül kaydedildi');
      if (host() && host().offsetParent !== null) paint(); else open();
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
    render: render,
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
