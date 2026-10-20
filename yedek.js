/* Net Kalkanım - Bulut Yedek (Supabase)
   - Her kullanıcıya rastgele bir "Kurtarma Kodu" verir (giriş şifresi gibi çalışır)
   - Soruları, notları, fotoğrafları ve ayarları arka planda buluta kopyalar
   - Veriler silinirse ya da telefon değişirse kodla geri getirir
   Telefondaki mevcut verilere dokunmaz, sadece okur. Geri yüklerken var olanların üstüne yazmaz. */
(function () {
  'use strict';

  var SB_URL = 'https://bswhmwgcytxitdhvvuok.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzd2htd2djeXR4aXRkaHZ2dW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NjgzMTksImV4cCI6MjEwNjM0NDMxOX0.RrH67fDFVHxBZZJ7PKH46JSuLHd57y0EAWXXm5_w1TQ';

  var LS_CODE = 'nk_code';
  var LS_STATE = 'nk_sync_v1';
  var LS_SHOWN = 'nk_code_shown';

  var SETTINGS_KEYS = [
    'field', 'authState', 'dailyLimitQ', 'dailyLimitN', 'intervals', 'noteIntervals',
    'selectedCourses', 'selectedTopics', 'archSelectedCourses', 'archSelectedTopics',
    'hasSeenOnboarding', 'activityDays', 'darkMode', 'hapticsEnabled', 'curriculum',
    'totalAnswered', 'totalCorrect', 'recallForgot', 'recallPartial', 'recallRemembered',
    'recallVeryEasy', 'denemeler'
  ];

  /* ---------- Kurtarma kodu ---------- */
  function makeCode() {
    var al = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var a = new Uint8Array(20);
    crypto.getRandomValues(a);
    var s = '';
    for (var i = 0; i < a.length; i++) s += al[a[i] % 32];
    return s;
  }
  function rawCode() { try { return localStorage.getItem(LS_CODE) || ''; } catch (e) { return ''; } }
  function getCode() {
    var c = rawCode();
    if (!c || c.length < 16) {
      c = makeCode();
      try { localStorage.setItem(LS_CODE, c); } catch (e) {}
    }
    return c;
  }
  function pretty(c) { return c.replace(/(.{4})(?=.)/g, '$1-'); }
  function normalize(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  /* ---------- Sunucu ile konuşma ---------- */
  function headers(extra) {
    var h = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };
    for (var k in extra) h[k] = extra[k];
    return h;
  }
  async function rpc(name, body) {
    var r = await fetch(SB_URL + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(name + ' ' + r.status);
    return r.json();
  }
  async function uploadImage(path, blob) {
    var r = await fetch(SB_URL + '/storage/v1/object/nk-images/' + path, {
      method: 'POST',
      headers: headers({ 'Content-Type': blob.type || 'image/jpeg', 'x-upsert': 'false' }),
      body: blob
    });
    if (r.ok || r.status === 409) return true;
    var t = '';
    try { t = await r.text(); } catch (e) {}
    if (/Duplicate|already exists/i.test(t)) return true;
    throw new Error('upload ' + r.status);
  }
  async function downloadImage(path) {
    var url = SB_URL + '/storage/v1/object/public/nk-images/' + path;
    for (var i = 0; i < 3; i++) {
      try {
        var r = await fetch(url, { cache: 'no-store' });
        if (r.ok) return await r.blob();
      } catch (e) {}
    }
    throw new Error('image ' + path);
  }

  /* ---------- Eşitleme durumu (hangi kayıt yedeklendi) ---------- */
  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(LS_STATE) || 'null');
      if (s && s.h && s.img) return s;
    } catch (e) {}
    return { h: {}, img: {} };
  }
  function saveState(s) { try { localStorage.setItem(LS_STATE, JSON.stringify(s)); } catch (e) {} }
  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36) + str.length;
  }
  function split(item) {
    var o = {}, imgs = {};
    for (var k in item) {
      var v = item[k];
      if (typeof Blob !== 'undefined' && v instanceof Blob) imgs[k] = v;
      else if (typeof v === 'function' || k.charAt(0) === '_') continue;
      else o[k] = v;
    }
    return { o: o, imgs: imgs };
  }
  function itemHash(o, imgs) {
    return hash(JSON.stringify(o) + '|' + Object.keys(imgs).map(function (k) { return k + ':' + imgs[k].size; }).join(','));
  }
  function settingsObj() {
    var o = {};
    SETTINGS_KEYS.forEach(function (k) { if (appState[k] !== undefined) o[k] = appState[k]; });
    return o;
  }

  /* ---------- Buluta yedekleme ---------- */
  var running = false, lastOk = 0, lastFail = false, progress = null, again = false, pushTimer = null, bannerShown = false;

  function schedulePush(ms) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushAll, ms || 2500);
  }

  function setBanner(kind, text) {
    var b = document.getElementById('nk-backup-banner');
    if (!kind) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('div');
      b.id = 'nk-backup-banner';
      document.body.appendChild(b);
    }
    var bg = kind === 'ok' ? '#059669' : (kind === 'warn' ? '#d97706' : '#0f766e');
    b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:9999;' +
      'background:' + bg + ';color:#fff;border-radius:14px;padding:10px 14px;font-size:12px;font-weight:600;' +
      'text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.25);pointer-events:none';
    b.textContent = text;
  }

  async function pushAll() {
    if (running) { again = true; return; }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { lastFail = true; if (bannerShown) setBanner('warn', 'İnternet yok. Yedekleme internet gelince devam edecek.'); return; }
    if (typeof appState === 'undefined') return;
    running = true;
    clearTimeout(pushTimer);
    try {
      var code = getCode();
      var st = loadState();
      var cur = {};
      (appState.questions || []).forEach(function (q) { if (q && q.id !== undefined) cur['question:' + q.id] = { kind: 'question', item: q }; });
      (appState.notes || []).forEach(function (n) { if (n && n.id !== undefined) cur['note:' + n.id] = { kind: 'note', item: n }; });
      var curCount = Object.keys(cur).length;

      // Neyin yedeklenmesi gerekiyor?
      var dirty = [];
      for (var key in cur) {
        var sp = split(cur[key].item);
        var h = itemHash(sp.o, sp.imgs);
        if (st.h[key] !== h) dirty.push({ key: key, kind: cur[key].kind, item: cur[key].item, o: sp.o, imgs: sp.imgs, h: h });
      }
      progress = { done: 0, total: dirty.length };
      // Çok kayıt varsa (ilk yedekleme gibi) kullanıcıya görünür ilerleme göster
      if (dirty.length >= 3 || bannerShown) {
        bannerShown = true;
        setBanner('run', 'Yedekleniyor ' + progress.done + '/' + progress.total + ' — bitene kadar uygulamayı kapatma');
      }
      updateStatus();

      var batch = [], keys = [], hashes = [];
      async function flush() {
        if (!batch.length) return;
        await rpc('nk_upsert', { p_code: code, p_items: batch });
        for (var i = 0; i < keys.length; i++) {
          st.h[keys[i]] = hashes[i];
          if (keys[i].indexOf('settings:') !== 0) progress.done++;
        }
        saveState(st);
        batch = []; keys = []; hashes = [];
        if (bannerShown) setBanner('run', 'Yedekleniyor ' + progress.done + '/' + progress.total + ' — bitene kadar uygulamayı kapatma');
        updateStatus();
      }

      // Ayarlar (sadece alan seçilmişse, boş bir telefon eski ayarları ezmesin)
      if (appState.field) {
        var sObj = settingsObj();
        var sh = hash(JSON.stringify(sObj));
        if (st.h['settings:main'] !== sh) {
          batch.push({ kind: 'settings', id: 'main', data: sObj });
          keys.push('settings:main'); hashes.push(sh);
        }
      }

      // Profil (isim / avatar)
      try {
        var pr = localStorage.getItem('nk_profile');
        if (pr) {
          var ph = hash(pr);
          if (st.h['settings:profile'] !== ph) {
            batch.push({ kind: 'settings', id: 'profile', data: JSON.parse(pr) });
            keys.push('settings:profile'); hashes.push(ph);
          }
        }
      } catch (e) {}

      // Soru ve notlar
      var skipped = 0;
      for (var di = 0; di < dirty.length; di++) {
        var d = dirty[di], o = d.o, imgs = d.imgs, ok = true;
        for (var f in imgs) {
          var bl = imgs[f];
          var ext = bl.type === 'image/webp' ? 'webp' : (bl.type === 'image/png' ? 'png' : 'jpg');
          var path = code + '/' + d.kind + '_' + d.item.id + '_' + f + '_' + bl.size + '.' + ext;
          if (!st.img[path]) {
            try { await uploadImage(path, bl); st.img[path] = 1; saveState(st); }
            catch (e) { ok = false; break; }
          }
          o[f] = { __img: path, type: bl.type || 'image/jpeg' };
        }
        if (!ok) { skipped++; continue; }
        batch.push({ kind: d.kind, id: String(d.item.id), data: o });
        keys.push(d.key); hashes.push(d.h);
        if (batch.length >= 25) await flush();
      }
      await flush();
      if (skipped) throw new Error('bazı fotoğraflar yüklenemedi');

      // Silinenler (güvenlik: telefon boşsa ya da çok fazla kayıt birden kaybolduysa silme bilgisi gönderme)
      var synced = Object.keys(st.h).filter(function (k) { return k.indexOf('settings:') !== 0; });
      var missing = synced.filter(function (k) { return !cur[k]; });
      if (missing.length && curCount > 0 && (missing.length <= 5 || missing.length <= synced.length * 0.3)) {
        var dels = missing.map(function (k) {
          var p = k.split(':');
          return { kind: p[0], id: p[1], deleted: true };
        });
        await rpc('nk_upsert', { p_code: code, p_items: dels });
        missing.forEach(function (k) { delete st.h[k]; });
        saveState(st);
      }

      lastOk = Date.now(); lastFail = false;
      if (bannerShown) {
        bannerShown = false;
        setBanner('ok', 'Yedekleme tamamlandı, her şey güvende!');
        setTimeout(function () { if (!bannerShown) setBanner(null); }, 3500);
      }
      try {
        if (!localStorage.getItem(LS_SHOWN)) {
          localStorage.setItem(LS_SHOWN, '1');
          if (typeof showCustomConfirm === 'function') {
            showCustomConfirm('Bulut yedek açıldı. Kurtarma kodun: ' + pretty(code) + ' — Bunu bir yere not al ya da ekran görüntüsü çek. Ayarlar bölümündeki Bulut Yedek kısmında da görebilirsin.', function () {});
          }
        }
      } catch (e) {}
    } catch (e) {
      lastFail = true;
      console.warn('Yedekleme hatası:', e);
      if (bannerShown) setBanner('warn', 'Yedekleme yarım kaldı. Bağlantı düzelince kaldığı yerden devam eder, uygulamayı açık tut.');
      schedulePush(15000);
    } finally {
      running = false;
      progress = null;
      updateStatus();
      if (again) { again = false; schedulePush(1500); }
    }
  }

  /* ---------- Geri yükleme ---------- */
  function applySettings(d) {
    var fresh = !appState.field;
    Object.keys(d || {}).forEach(function (k) {
      if (SETTINGS_KEYS.indexOf(k) === -1) return;
      if (k === 'authState') {
        if (d.authState === 'full' || !appState.authState || appState.authState === 'none') appState.authState = d.authState;
      } else if (fresh) {
        appState[k] = d[k];
      }
    });
  }

  async function restoreFromCode(input) {
    var code = normalize(input);
    if (code.length < 16) { showToast('Kod eksik görünüyor.', true); return false; }
    showToast('Yedek aranıyor...');
    var rows;
    try { rows = await rpc('nk_fetch', { p_code: code, p_since: null }); }
    catch (e) { showToast('Bağlantı kurulamadı. İnternetini kontrol et.', true); return false; }
    rows = (rows || []).filter(function (r) { return !r.deleted; });
    if (!rows.length) { showToast('Bu kodla kayıtlı bir yedek bulunamadı.', true); return false; }

    try { localStorage.setItem(LS_CODE, code); localStorage.setItem(LS_SHOWN, '1'); } catch (e) {}

    var haveQ = {}, haveN = {};
    (appState.questions || []).forEach(function (x) { haveQ[String(x.id)] = 1; });
    (appState.notes || []).forEach(function (x) { haveN[String(x.id)] = 1; });

    var total = rows.filter(function (r) { return r.kind !== 'settings'; }).length;
    var n = 0, failed = 0;

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.kind === 'settings') {
        if (r.item_id === 'profile') { try { if (!localStorage.getItem('nk_profile')) localStorage.setItem('nk_profile', JSON.stringify(r.data)); } catch (e) {} }
        else applySettings(r.data);
        continue;
      }
      n++;
      if (n % 10 === 0) showToast('Geri yükleniyor: ' + n + '/' + total);
      var have = r.kind === 'question' ? haveQ : haveN;
      if (have[String(r.item_id)]) continue;
      try {
        var item = {};
        var d = r.data || {};
        for (var k in d) {
          var v = d[k];
          if (v && typeof v === 'object' && v.__img) item[k] = await downloadImage(v.__img);
          else item[k] = v;
        }
        if (r.kind === 'question') { await saveQuestion(item); appState.questions.push(item); }
        else { await saveNote(item); appState.notes.push(item); }
      } catch (e) {
        failed++;
        console.warn('Kayıt geri yüklenemedi:', r.item_id, e);
      }
    }
    await saveSettings();

    if (failed) showToast(failed + ' kayıt yüklenemedi. Kodu tekrar girerek eksikleri tamamlayabilirsin.', true);
    else showToast('Geri yükleme tamamlandı! Uygulama yenileniyor...');
    setTimeout(function () { location.reload(); }, failed ? 3000 : 1500);
    return true;
  }

  /* ---------- Arayüz ---------- */
  function copyText(t) {
    return navigator.clipboard.writeText(t).then(function () { return true; }).catch(function () {
      var ta = document.createElement('textarea');
      ta.value = t; document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) {}
      ta.remove();
      return ok;
    });
  }

  function askCode(cb) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML =
      '<div style="background:#fff;border-radius:20px;padding:20px;max-width:340px;width:100%;text-align:center">' +
      '<p style="font-weight:600;font-size:14px;color:#1e293b;margin-bottom:12px">Kurtarma kodunu gir</p>' +
      '<input id="nk-code-input" autocapitalize="characters" autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" ' +
      'style="width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:12px;text-align:center;font-size:14px;letter-spacing:1px;color:#1e293b;background:#fff">' +
      '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button id="nk-code-cancel" style="flex:1;padding:12px;border-radius:12px;font-weight:600;font-size:13px;background:#f1f5f9;color:#475569;border:none">Vazgeç</button>' +
      '<button id="nk-code-ok" style="flex:1;padding:12px;border-radius:12px;font-weight:600;font-size:13px;background:#0D9488;color:#fff;border:none">Geri Yükle</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    var inp = ov.querySelector('#nk-code-input');
    setTimeout(function () { inp.focus(); }, 50);
    ov.querySelector('#nk-code-cancel').onclick = function () { ov.remove(); };
    ov.querySelector('#nk-code-ok').onclick = function () { var v = inp.value; ov.remove(); cb(v); };
  }

  function statusText() {
    if (running) return progress && progress.total ? 'Yedekleniyor ' + progress.done + '/' + progress.total + '...' : 'Yedekleniyor...';
    if (lastFail) return 'Yedek bekliyor (bağlantı yok ya da sorun var). Bağlantı gelince kendiliğinden devam eder.';
    if (lastOk) {
      var d = new Date(lastOk);
      var hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
      return 'Her şey yedekte. Son yedekleme: ' + hh + ':' + mm;
    }
    return 'Hazırlanıyor...';
  }
  function updateStatus() {
    var el = document.getElementById('nk-cloud-status');
    if (el) el.textContent = statusText();
    var ce = document.getElementById('nk-cloud-code');
    if (ce) ce.textContent = pretty(getCode());
  }

  function ensureUI() {
    var list = document.querySelector('#profile .divide-y');
    if (list && !document.getElementById('nk-cloud-card')) {
      var d = document.createElement('div');
      d.id = 'nk-cloud-card';
      d.className = 'p-4 space-y-2';
      d.innerHTML =
        '<p class="text-sm font-medium text-slate-800">Bulut Yedek</p>' +
        '<p id="nk-cloud-status" class="text-xs text-slate-500"></p>' +
        '<p class="text-[11px] font-semibold text-slate-500">Kurtarma Kodun</p>' +
        '<div class="flex items-center gap-2">' +
        '<code id="nk-cloud-code" class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-[11px] font-mono text-slate-700 text-center"></code>' +
        '<button id="nk-cloud-copy" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold rounded-lg">Kopyala</button>' +
        '</div>' +
        '<p class="text-[11px] text-slate-500">Bu kodu bir yere yaz. Telefon değişir ya da veriler silinirse bununla geri getirirsin. Kimseyle paylaşma.</p>' +
        '<button id="nk-cloud-now" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold rounded-lg">Şimdi Yedekle</button>' +
        '<button id="nk-cloud-restore" class="w-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 px-3 py-2 text-xs font-semibold rounded-lg">Kodla Geri Yükle</button>';
      list.insertBefore(d, list.lastElementChild);
      document.getElementById('nk-cloud-copy').onclick = function () {
        copyText(pretty(getCode())).then(function (ok) { showToast(ok ? 'Kod kopyalandı.' : 'Kopyalanamadı, kodu elle yaz.', !ok); });
      };
      document.getElementById('nk-cloud-now').onclick = function () { showToast('Yedekleme başlatıldı...'); pushAll(); };
      document.getElementById('nk-cloud-restore').onclick = function () { askCode(restoreFromCode); };
    }
    var ls = document.getElementById('login-screen');
    if (ls && !document.getElementById('nk-login-restore')) {
      var a = document.createElement('button');
      a.id = 'nk-login-restore';
      a.className = 'mt-4 text-xs font-semibold text-teal-600 underline underline-offset-2';
      a.textContent = 'Kurtarma koduyla geri yükle';
      a.onclick = function () { askCode(restoreFromCode); };
      ls.appendChild(a);
    }
    updateStatus();
  }

  /* ---------- Başlat ---------- */
  function start() {
    ensureUI();
    // Kaydetme / silme işlemlerinden hemen sonra (2,5 sn içinde) yedeklemeyi tetikle
    ['saveQuestion', 'saveNote', 'deleteQuestion', 'deleteNote', 'saveSettings'].forEach(function (n) {
      var orig = window[n];
      if (typeof orig === 'function') {
        window[n] = function () {
          var r = orig.apply(this, arguments);
          schedulePush(2500);
          return r;
        };
      }
    });
    setTimeout(pushAll, 3000);
    setInterval(pushAll, 20000);
    setInterval(updateStatus, 5000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') pushAll();
    });
    window.addEventListener('online', function () { setTimeout(pushAll, 1500); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.__nkBackup = { pushAll: pushAll, restoreFromCode: restoreFromCode, getCode: getCode };
})();
