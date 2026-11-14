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
    { id: 'fz1', ders: 'AYT FİZİK', baslik: "Mekanik · Bağıl Hız", formul: "v_bağıl = v_gözlenen − v_gözlemci   (vektörel)" },
    { id: 'fz2', ders: 'AYT FİZİK', baslik: "Mekanik · Newton'un 2. Yasası ve Sürtünme", formul: "F_net = m·a\nf_s = k·N" },
    { id: 'fz3', ders: 'AYT FİZİK', baslik: "Mekanik · Sabit İvmeli Hareket", formul: "v = v₀ ± a·t\nx = v₀·t ± ½·a·t²\nv² = v₀² ± 2·a·x" },
    { id: 'fz4', ders: 'AYT FİZİK', baslik: "Mekanik · Atışlar", formul: "h = ½·g·t²\nv = g·t\nt_çıkış = v₀y / g\nx_menzil = v₀x · t_uçuş" },
    { id: 'fz5', ders: 'AYT FİZİK', baslik: "Mekanik · İş, Güç ve Enerji", formul: "W = F·Δx·cosθ\nE_k = ½·m·v²\nE_p = m·g·h\nE_yay = ½·k·x²\nP = W / t" },
    { id: 'fz6', ders: 'AYT FİZİK', baslik: "Mekanik · İtme ve Momentum", formul: "I = F_ort·Δt = ΔP\nP = m·v\nP_ilk = P_son" },
    { id: 'fz7', ders: 'AYT FİZİK', baslik: "Mekanik · Tork ve Basit Makineler", formul: "τ = F·d·sinθ\nF·x_F = P·x_P\nVerim = W_alınan / W_verilen" },
    { id: 'fz8', ders: 'AYT FİZİK', baslik: "Elektrik · Elektriksel Kuvvet ve Alan", formul: "F = k·q₁·q₂ / d²\nE = F / q = k·q / d²" },
    { id: 'fz9', ders: 'AYT FİZİK', baslik: "Elektrik · Potansiyel ve İş", formul: "V = k·q / d\nE_p = k·q₁·q₂ / d\nW = q·ΔV" },
    { id: 'fz10', ders: 'AYT FİZİK', baslik: "Elektrik · Paralel Levhalar ve Sığa", formul: "E = V / d\nF = q·E = q·V / d\nC = Q / V = ε₀·A / d\nE_sığa = ½·C·V²" },
    { id: 'fz11', ders: 'AYT FİZİK', baslik: "Manyetizma · Manyetik Alan (B)", formul: "Düz tel: B = 2k·i / d\nÇember merkezinde: B = 2kπ·i / r\nAkım makarası (bobin): B = 4kπ·N·i / L" },
    { id: 'fz12', ders: 'AYT FİZİK', baslik: "Manyetizma · Manyetik Kuvvet ve Tork", formul: "Akım geçen tele: F = B·i·l·sinα\nHareketli yüke: F = q·v·B·sinα , r = m·v / (q·B)\nÇerçeveye etkiyen tork: τ = B·i·A·N" },
    { id: 'fz13', ders: 'AYT FİZİK', baslik: "Manyetizma · İndüksiyon ve Öz İndüksiyon", formul: "Φ = B·A·cosα\nε = −ΔΦ / Δt = B·v·l\nε_öz = −L·Δi / Δt" },
    { id: 'fz14', ders: 'AYT FİZİK', baslik: "Alternatif Akım · Etkin Değerler", formul: "V_etkin = V_max / √2\ni_etkin = i_max / √2" },
    { id: 'fz15', ders: 'AYT FİZİK', baslik: "Alternatif Akım · Reaktans ve Empedans", formul: "X_L = ω·L = 2π·f·L\nX_C = 1 / (ω·C) = 1 / (2π·f·C)\nZ = √( R² + (X_L − X_C)² )" },
    { id: 'fz16', ders: 'AYT FİZİK', baslik: "Alternatif Akım · Transformatör", formul: "V_p / V_s = N_p / N_s\nVerim = (V_s·i_s) / (V_p·i_p)" },
    { id: 'fz17', ders: 'AYT FİZİK', baslik: "Çembersel Hareket · Hız ve Periyot", formul: "T·f = 1\nω = 2π / T = 2π·f\nv = ω·r = 2π·r / T" },
    { id: 'fz18', ders: 'AYT FİZİK', baslik: "Çembersel Hareket · İvme ve Kuvvet", formul: "a_m = v² / r = ω²·r\nF_m = m·v² / r = m·ω²·r" },
    { id: 'fz19', ders: 'AYT FİZİK', baslik: "Çembersel Hareket · Virajlar", formul: "v_yatay,max = √(k·g·r)\nv_eğimli = √(g·r·tanα)" },
    { id: 'fz20', ders: 'AYT FİZİK', baslik: "Dönme · Eylemsizlik Momenti ve Enerji", formul: "I = Σ m·r²\nE_dönme = ½·I·ω²\nE_top = ½·m·v² + ½·I·ω²" },
    { id: 'fz21', ders: 'AYT FİZİK', baslik: "Dönme · Açısal Momentum ve Tork", formul: "L = I·ω = m·v·r\nτ_net = I·α = ΔL / Δt" },
    { id: 'fz22', ders: 'AYT FİZİK', baslik: "Kütle Çekim · Kuvvet ve İvme", formul: "F = G·m₁·m₂ / d²\ng = G·M / r²" },
    { id: 'fz23', ders: 'AYT FİZİK', baslik: "Kütle Çekim · Yörünge ve Kurtulma Hızı", formul: "v_yörünge = √(G·M / r)\nv_kurtulma = √(2·G·M / r)" },
    { id: 'fz24', ders: 'AYT FİZİK', baslik: "Kütle Çekim · Enerjiler", formul: "E_pot = −G·M·m / r\nE_top = −G·M·m / 2r\nE_bağlanma = +G·M·m / 2r" },
    { id: 'fz25', ders: 'AYT FİZİK', baslik: "Kütle Çekim · Kepler Periyot Yasası", formul: "R³ / T² = sabit" },
    { id: 'fz26', ders: 'AYT FİZİK', baslik: "Basit Harmonik Hareket · Konum, Hız, İvme, Kuvvet", formul: "x = r·sin(ω·t)\nv = ω·√(r² − x²)   (v_max = ω·r)\na = −ω²·x   (a_max = ω²·r)\nF = −m·ω²·x" },
    { id: 'fz27', ders: 'AYT FİZİK', baslik: "Basit Harmonik Hareket · Periyotlar", formul: "T_yay = 2π·√(m / k)\nT_sarkaç = 2π·√(L / g)" },
    { id: 'fz28', ders: 'AYT FİZİK', baslik: "Dalga · Çift Yarıkta Girişim (Young)", formul: "Δx = L·λ / (d·n)\nAydınlık: Δs = n·λ\nKaranlık: Δs = (n − ½)·λ" },
    { id: 'fz29', ders: 'AYT FİZİK', baslik: "Dalga · Tek Yarıkta Kırınım", formul: "Δx = L·λ / (w·n)\nAydınlık: Δs = (n + ½)·λ\nKaranlık: Δs = n·λ" },
    { id: 'fz30', ders: 'AYT FİZİK', baslik: "Dalga · Elektromanyetik Dalgalar", formul: "c = λ·f\nE / B = c" },
    { id: 'fz31', ders: 'AYT FİZİK', baslik: "Modern Fizik · Bohr Atom Modeli", formul: "r_n = a₀·n² / Z\nE_n = −13,6·Z² / n²  eV\nL_n = n·h / 2π" },
    { id: 'fz32', ders: 'AYT FİZİK', baslik: "Modern Fizik · Fotoelektrik Olay", formul: "E_foton = h·f = h·c / λ\nE_foton = E₀ + E_k,max\nE₀ = h·f₀ = h·c / λ₀\nE_k,max = e·V_kesme" },
    { id: 'fz33', ders: 'AYT FİZİK', baslik: "Modern Fizik · Compton Saçılması ve De Broglie", formul: "E_gelen = E_saçılan + E_k,elektron\nΔλ = λ′ − λ = (h / m_e·c)·(1 − cosθ)\nλ = h / P = h / (m·v)" }
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
    state.q = ''; state.course = '';
    try { switchTab('formul'); } catch (e) {}
  }
  function render() { paint(); }

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
      var body = el('div', 'margin-top:8px;font-size:16px;line-height:1.7;color:#0f766e;font-weight:600;white-space:pre-wrap;word-break:break-word', x.formul);
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
    fin.value = d.formul || ''; fin.placeholder = 'ör. τ = F · d · sinθ'; fin.maxLength = 1500;
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
