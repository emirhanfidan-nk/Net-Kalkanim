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
    { id: 'fz1', ders: 'AYT FİZİK', baslik: "Vektörler (Bileşke Büyüklüğü)", formul: "$R^2 = F_1^2 + F_2^2 + 2 F_1 F_2 \\cos\\alpha$" },
    { id: 'fz2', ders: 'AYT FİZİK', baslik: "Bağıl Hız", formul: "$\\vec{v}_{\\text{bağıl}} = \\vec{v}_{\\text{gözlenen}} - \\vec{v}_{\\text{gözlemci}}$" },
    { id: 'fz3', ders: 'AYT FİZİK', baslik: "Tork ve Denge", formul: "Tork: $\\tau = F \\cdot d \\cdot \\sin\\theta$\nKütle merkezi koordinatı: $x_{\\text{km}} = \\frac{\\sum m_i x_i}{\\sum m_i}$" },
    { id: 'fz4', ders: 'AYT FİZİK', baslik: "Basit Makineler", formul: "İş prensibi: $F \\cdot x_F = P \\cdot x_P$\nVida denklemi: $F \\cdot 2\\pi r = R \\cdot a$\nVerim: $\\text{Verim} = \\frac{W_{\\text{alınan}}}{W_{\\text{verilen}}}$" },
    { id: 'fz5', ders: 'AYT FİZİK', baslik: "Newton’un Hareket Yasaları", formul: "Net kuvvet: $F_{\\text{net}} = m \\cdot a$\nSürtünme kuvveti: $f_s = k \\cdot N$" },
    { id: 'fz6', ders: 'AYT FİZİK', baslik: "Bir Boyutta Sabit İvmeli Hareket", formul: "Son hız: $v = v_0 \\pm a t$\nYer değiştirme: $x = v_0 t \\pm \\frac{1}{2} a t^2$\nZamansız hız: $v^2 = v_0^2 \\pm 2 a x$" },
    { id: 'fz7', ders: 'AYT FİZİK', baslik: "Atışlar", formul: "Serbest düşme yüksekliği: $h = \\frac{1}{2} g t^2$\nEğik atış uçuş süresi: $t_{\\text{uçuş}} = \\frac{2 v_{0y}}{g}$\nMaksimum yükseklik: $h_{\\text{max}} = \\frac{v_{0y}^2}{2g}$\nYatay menzil: $x_{\\text{menzil}} = v_{0x} \\cdot t_{\\text{uçuş}}$" },
    { id: 'fz8', ders: 'AYT FİZİK', baslik: "İş, Güç ve Enerji", formul: "Mekanik iş: $W = F \\cdot \\Delta x \\cdot \\cos\\theta$\nÖteleme kinetik enerjisi: $E_k = \\frac{1}{2} m v^2$\nYer çekimi potansiyel enerjisi: $E_p = m g h$\nYay potansiyel enerjisi: $E_{\\text{yay}} = \\frac{1}{2} k x^2$\nGüç: $P = \\frac{W}{t}$" },
    { id: 'fz9', ders: 'AYT FİZİK', baslik: "İtme ve Momentum", formul: "İtme: $\\vec{I} = \\vec{F}_{\\text{ort}} \\cdot \\Delta t = \\Delta \\vec{P}$\nÇizgisel momentum: $\\vec{P} = m \\cdot \\vec{v}$\nMomentum korunumu: $\\vec{P}_{\\text{ilk}} = \\vec{P}_{\\text{son}}$\nEsnek çarpışmada hız korunumu: $\\vec{v}_1 + \\vec{v}_1' = \\vec{v}_2 + \\vec{v}_2'$" },
    { id: 'fz10', ders: 'AYT FİZİK', baslik: "Elektriksel Kuvvet ve Alan", formul: "Elektriksel kuvvet: $F = k \\frac{q_1 q_2}{d^2}$\nElektrik alan: $E = \\frac{F}{q} = k \\frac{q}{d^2}$" },
    { id: 'fz11', ders: 'AYT FİZİK', baslik: "Elektriksel Potansiyel ve İş", formul: "Elektriksel potansiyel: $V = k \\frac{q}{d}$\nElektriksel potansiyel enerji: $E_p = k \\frac{q_1 q_2}{d}$\nElektriksel iş: $W = q \\cdot \\Delta V$" },
    { id: 'fz12', ders: 'AYT FİZİK', baslik: "Paralel Levhalar ve Sığa", formul: "Levhalar arası elektrik alan: $E = \\frac{V}{d}$\nYüke etkiyen kuvvet: $F = \\frac{q V}{d}$\nKarşı levhaya çarpma kinetik enerjisi: $E_k = q \\cdot V$\nSığa (kapasite): $C = \\frac{Q}{V} = \\varepsilon_0 \\frac{A}{d}$\nSığaçta depolanan enerji: $E_{\\text{sığa}} = \\frac{1}{2} C V^2 = \\frac{Q^2}{2C}$" },
    { id: 'fz13', ders: 'AYT FİZİK', baslik: "Manyetik Alan (B)", formul: "Düz telin manyetik alanı: $B = \\frac{2 k i}{d}$\nÇember telin merkezindeki manyetik alan: $B = \\frac{2 k \\pi i}{r}$\nAkım makarasının (bobin) manyetik alanı: $B = \\frac{4 k \\pi N i}{L}$" },
    { id: 'fz14', ders: 'AYT FİZİK', baslik: "Manyetik Kuvvet ve Tork", formul: "Akım geçen tele etkiyen kuvvet: $F = B \\cdot i \\cdot l \\cdot \\sin\\alpha$\nHareketli yüke etkiyen kuvvet: $F = q \\cdot v \\cdot B \\cdot \\sin\\alpha$\nYörünge yarıçapı: $r = \\frac{m v}{q B}$\nAkım çerçevesine etkiyen tork: $\\tau = B \\cdot i \\cdot A \\cdot N$" },
    { id: 'fz15', ders: 'AYT FİZİK', baslik: "İndüksiyon ve Öz İndüksiyon", formul: "Manyetik akı: $\\Phi = B \\cdot A \\cdot \\cos\\alpha$\nİndüksiyon EMK'sı: $\\varepsilon = -\\frac{\\Delta \\Phi}{\\Delta t}$\nHareketli telde oluşan EMK: $\\varepsilon = B \\cdot v \\cdot l$\nBir ucu sabit dönen telde oluşan EMK: $\\varepsilon = \\frac{1}{2} B \\omega l^2$\nÖz indüksiyon EMK'sı: $\\varepsilon_{\\text{öz}} = -L \\frac{\\Delta i}{\\Delta t}$" },
    { id: 'fz16', ders: 'AYT FİZİK', baslik: "Alternatif Akım ve Transformatörler", formul: "Etkin gerilim ve akım: $V_{\\text{etkin}} = \\frac{V_{\\text{max}}}{\\sqrt{2}}$\n$i_{\\text{etkin}} = \\frac{i_{\\text{max}}}{\\sqrt{2}}$\nİndüktif reaktans (bobin) ve kapasitif reaktans (sığaç): $X_L = \\omega L = 2\\pi f L$\n$X_C = \\frac{1}{\\omega C} = \\frac{1}{2\\pi f C}$\nEmpedans (eşdeğer direnç): $Z = \\sqrt{R^2 + (X_L - X_C)^2}$\nRezonans şartı: $X_L = X_C \\implies Z = R$\nTransformatör gerilim oranı ve verim: $\\frac{V_p}{V_s} = \\frac{N_p}{N_s}$\n$\\text{Verim} = \\frac{V_s \\cdot i_s}{V_p \\cdot i_p}$" },
    { id: 'fz17', ders: 'AYT FİZİK', baslik: "Düzgün Çembersel Hareket", formul: "Periyot-frekans ilişkisi: $T \\cdot f = 1$\nAçısal hız ve çizgisel hız: $\\omega = \\frac{2\\pi}{T} = 2\\pi f$\n$v = \\omega \\cdot r = \\frac{2\\pi r}{T}$\nMerkezcil ivme ve merkezcil kuvvet: $a_m = \\frac{v^2}{r} = \\omega^2 r$\n$F_m = m \\frac{v^2}{r} = m \\omega^2 r$\nYatay viraj maksimum emniyetli hız: $v_{\\text{max}} = \\sqrt{k g r}$\nEğimli viraj emniyetli hız: $v = \\sqrt{g r \\tan\\alpha}$" },
    { id: 'fz18', ders: 'AYT FİZİK', baslik: "Dönme, Yuvarlanma ve Açısal Momentum", formul: "Eylemsizlik momenti: $I = \\sum m r^2$\nDönme kinetik enerjisi: $E_{\\text{dönme}} = \\frac{1}{2} I \\omega^2$\nDönerek öteleme toplam kinetik enerjisi: $E_{\\text{toplam}} = \\frac{1}{2} m v^2 + \\frac{1}{2} I \\omega^2$\nAçısal momentum ve net tork ilişkisi: $L = I \\cdot \\omega = m \\cdot v \\cdot r$\n$\\tau_{\\text{net}} = I \\cdot \\alpha = \\frac{\\Delta L}{\\Delta t}$" },
    { id: 'fz19', ders: 'AYT FİZİK', baslik: "Kütle Çekim ve Kepler Yasaları", formul: "Kütle çekim kuvveti ve çekim ivmesi: $F = G \\frac{m_1 m_2}{d^2}$\n$g = G \\frac{M}{r^2}$\nKütle çekim potansiyel enerjisi: $E_p = -G \\frac{M m}{r}$\nUydu toplam enerjisi ve bağlanma enerjisi: $E_{\\text{toplam}} = -G \\frac{M m}{2r}$\n$E_{\\text{bağlanma}} = +G \\frac{M m}{2r}$\nUydu yörünge hızı ve kurtulma hızı: $v_{\\text{yörünge}} = \\sqrt{\\frac{G M}{r}}$\n$v_{\\text{kurtulma}} = \\sqrt{\\frac{2 G M}{r}}$\nKepler periyotlar yasası: $\\frac{R_{\\text{ort}}^3}{T^2} = \\text{sabit}$" },
    { id: 'fz20', ders: 'AYT FİZİK', baslik: "Basit Harmonik Hareket", formul: "Konum, anlık hız ve maksimum hız: $x = r \\sin(\\omega t)$\n$v = \\omega \\sqrt{r^2 - x^2}$\n$v_{\\text{max}} = \\omega r$\nGeri çağırıcı kuvvet ve ivme: $F = -m \\omega^2 x \\; (F_{\\text{max}} = m \\omega^2 r)$\n$a = -\\omega^2 x \\; (a_{\\text{max}} = \\omega^2 r)$\nYay sarkacı periyodu: $T_{\\text{yay}} = 2\\pi \\sqrt{\\frac{m}{k}}$\nSeri yay: $\\frac{1}{k_{\\text{eş}}} = \\frac{1}{k_1} + \\frac{1}{k_2}$\nParalel yay: $k_{\\text{eş}} = k_1 + k_2$\nBasit sarkaç periyodu: $T_{\\text{sarkaç}} = 2\\pi \\sqrt{\\frac{L}{g}}$" },
    { id: 'fz21', ders: 'AYT FİZİK', baslik: "Su Dalgalarında Girişim (Yol Farkı)", formul: "Dalga katarı: $\\Delta s = n \\lambda$\nDüğüm çizgisi: $\\Delta s = \\left(n - \\frac{1}{2}\\right)\\lambda$" },
    { id: 'fz22', ders: 'AYT FİZİK', baslik: "Çift Yarıkta Girişim (Young)", formul: "Saçak genişliği: $\\Delta x = \\frac{L \\cdot \\lambda}{d \\cdot n}$\nAydınlık saçak: $\\Delta s = n \\lambda$\nKaranlık saçak: $\\Delta s = \\left(n - \\frac{1}{2}\\right)\\lambda$" },
    { id: 'fz23', ders: 'AYT FİZİK', baslik: "Tek Yarıkta Kırınım", formul: "Saçak genişliği: $\\Delta x = \\frac{L \\cdot \\lambda}{w \\cdot n}$\nAydınlık saçak: $\\Delta s = \\left(n + \\frac{1}{2}\\right)\\lambda$\nKaranlık saçak: $\\Delta s = n \\lambda$" },
    { id: 'fz24', ders: 'AYT FİZİK', baslik: "Doppler Olayı (Algılanan Frekans)", formul: "$f_{\\text{algılanan}} = f_{\\text{kaynak}} \\cdot \\frac{v \\pm v_{\\text{gözlemci}}}{v \\mp v_{\\text{kaynak}}}$" },
    { id: 'fz25', ders: 'AYT FİZİK', baslik: "Elektromanyetik Dalgalar", formul: "Işık hızı: $c = \\lambda \\cdot f$\nElektrik-manyetik alan oranı: $\\frac{E}{B} = c$" },
    { id: 'fz26', ders: 'AYT FİZİK', baslik: "Bohr Atom Modeli", formul: "Yörünge yarıçapı: $r_n = a_0 \\frac{n^2}{Z}$\nEnerji seviyeleri: $E_n = -13{,}6 \\frac{Z^2}{n^2}\\text{ eV}$\nAçısal momentum: $L_n = n \\frac{h}{2\\pi}$\nSalınan foton enerjisi: $E_{\\text{foton}} = E_{\\text{üst}} - E_{\\text{alt}} = \\frac{h c}{\\lambda}$" },
    { id: 'fz27', ders: 'AYT FİZİK', baslik: "Radyoaktivite ve Kara Cisim Işıması", formul: "Yarılanma sonrası kalan çekirdek: $N = N_0 \\left(\\frac{1}{2}\\right)^n$\nWien kayma yasası: $\\lambda_{\\text{max}} \\cdot T = \\text{sabit}$" },
    { id: 'fz28', ders: 'AYT FİZİK', baslik: "Fotoelektrik Olay", formul: "Foton enerjisi: $E_{\\text{foton}} = h \\cdot f = \\frac{h c}{\\lambda}$\nFotoelektrik denklemi: $E_{\\text{foton}} = E_{\\text{bağlanma}} + E_{k,\\text{max}}$\nEşik (bağlanma) enerjisi: $E_{\\text{bağlanma}} = h \\cdot f_0 = \\frac{h c}{\\lambda_0}$\nKesme gerilimi ilişkisi: $E_{k,\\text{max}} = e \\cdot V_{\\text{kesme}}$" },
    { id: 'fz29', ders: 'AYT FİZİK', baslik: "Compton Saçılması ve De Broglie", formul: "Enerji korunumu: $E_{\\text{gelen}} = E_{\\text{saçılan}} + E_{k,\\text{elektron}}$\nDalga boyu artışı: $\\Delta \\lambda = \\lambda' - \\lambda = \\frac{h}{m_e c}(1 - \\cos\\theta)$\nDe Broglie madde dalga boyu: $\\lambda = \\frac{h}{P} = \\frac{h}{m v}$" }
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
  // "Etiket: $formül$ (not)" biçimindeki satırı çizer; $...$ arası matematik olarak gösterilir.
  // $ olmayan ama matematik gibi görünen satırlar (ör. F = m \\cdot a) otomatik matematik sayılır.
  function mathHtml(tex) {
    var m = el('span', 'font-size:1.1em');
    if (kx.st === 2 && window.katex) {
      try { m.innerHTML = window.katex.renderToString(tex, { throwOnError: false, displayMode: false }); }
      catch (e) { m.textContent = plainTex(tex); }
    } else m.textContent = plainTex(tex);
    return m;
  }
  function renderLine(line) {
    var d = el('div', 'margin-top:8px;color:#0f766e;font-weight:600;max-width:100%');
    var text = String(line).trim();
    if (text.indexOf('$') < 0 && /[\\^_=]/.test(text)) {
      var lm = text.match(/^([^=\\^_{}]{1,80}?):\s+(.*)$/);
      text = lm ? lm[1] + ': $' + lm[2] + '$' : '$' + text + '$';
    }
    var parts = text.split('$');
    if (parts.length < 3) { d.style.cssText += ';font-size:15px;line-height:1.6;white-space:pre-wrap;word-break:break-word'; d.textContent = text; return d; }
    var label = '';
    if (parts[0].trim()) { label = parts[0].trim().replace(/:$/, ''); }
    if (label) d.appendChild(el('div', 'font-size:11px;font-weight:700;color:#64748b;margin-bottom:1px', label));
    var row = el('div', 'font-size:16px;line-height:1.5;overflow-x:auto;overflow-y:hidden');
    for (var i = 1; i < parts.length; i++) {
      if (i % 2 === 1) { if (parts[i]) row.appendChild(mathHtml(parts[i])); }
      else if (parts[i].trim()) row.appendChild(el('span', 'color:#475569;font-weight:600;font-size:13px', parts[i]));
    }
    d.appendChild(row);
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
    fin.value = d.formul || ''; fin.placeholder = 'Her formülü ayrı satıra yaz. Örn: F = m \\cdot a'; fin.maxLength = 1500;
    var snips = [['a/b', '\\frac{a}{b}'], ['xⁿ', '^{n}'], ['xₙ', '_{n}'], ['√', '\\sqrt{x}'], ['·', ' \\cdot '], ['±', ' \\pm '], ['π', '\\pi '], ['Δ', '\\Delta '], ['ω', '\\omega '], ['θ', '\\theta '], ['λ', '\\lambda '], ['τ', '\\tau '], ['α', '\\alpha '], ['Σ', '\\sum ']];
    var bar = el('div', 'display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px');
    snips.forEach(function (sn) {
      var b = el('button', 'padding:6px 10px;border-radius:9px;border:1px solid #cbd5e1;background:#f8fafc;color:#334155;font-size:13px;font-weight:700', sn[0]);
      b.type = 'button';
      b.onmousedown = function (e) { e.preventDefault(); };
      b.onclick = function () {
        var st = fin.selectionStart == null ? fin.value.length : fin.selectionStart, en = fin.selectionEnd == null ? st : fin.selectionEnd;
        fin.value = fin.value.slice(0, st) + sn[1] + fin.value.slice(en);
        var pos = st + sn[1].length; fin.focus(); try { fin.setSelectionRange(pos, pos); } catch (e) {}
        prev();
      };
      bar.appendChild(b);
    });
    box.appendChild(bar);
    box.appendChild(fin);
    var pv = el('div', 'margin-top:10px;padding:10px 12px;border:1px dashed #cbd5e1;border-radius:12px;background:#f8fafc;min-height:40px');
    function prev() {
      pv.innerHTML = '';
      var any = false;
      fin.value.split('\n').forEach(function (ln) { if (ln.trim()) { any = true; pv.appendChild(renderLine(ln)); } });
      if (!any) pv.appendChild(el('div', 'font-size:12px;color:#94a3b8', 'Önizleme burada görünür'));
    }
    fin.oninput = prev;
    box.appendChild(el('div', 'font-size:11px;font-weight:700;color:#64748b;margin:12px 0 4px', 'Önizleme'));
    box.appendChild(pv);
    loadKatex();
    prev();
    if (kx.st === 1) { var t = setInterval(function () { if (kx.st !== 1 || !document.body.contains(pv)) { clearInterval(t); prev(); } }, 200); }

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
