/* Net Kalkanım - Hocaya Sorulacaklar
   Anlamadığın soruları hızlıca biriktir. Tekrar döngüsüne girmezler, ayrı bir yerde durur.
   Hocadan cevabı alınca bir dokunuşla "soru" ya da "not" olarak asıl arşivine eklersin.
   Kayıtlar bulut yedeğe de dahildir. */
(function () {
  'use strict';

  var DB_NAME = 'nk_hoca', STORE = 'items';
  var db = null, cache = [], ready = false, pendingId = null, thumbUrls = [];

  /* ---------- Depolama (kendi küçük veritabanı) ---------- */
  function openDB() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function getAll() {
    return new Promise(function (res, rej) {
      var q = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
      q.onsuccess = function () { res(q.result || []); };
      q.onerror = function () { rej(q.error); };
    });
  }
  function put(item) {
    return new Promise(function (res, rej) {
      var t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).put(item);
      t.oncomplete = function () { res(); };
      t.onerror = function () { rej(t.error); };
    });
  }
  function del(id) {
    return new Promise(function (res, rej) {
      var t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).delete(id);
      t.oncomplete = function () { res(); };
      t.onerror = function () { rej(t.error); };
    });
  }
  function sortCache() { cache.sort(function (a, b) { return b.id - a.id; }); }
  function schedBackup() {
    setTimeout(function () { try { if (window.__nkBackup) window.__nkBackup.pushAll(); } catch (e) {} }, 2500);
  }

  async function restoreItem(item) {
    if (!db || !item || item.id === undefined) return;
    if (cache.some(function (x) { return String(x.id) === String(item.id); })) return;
    await put(item);
    cache.push(item);
    sortCache();
  }

  /* ---------- Yardımcılar ---------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function icon(path, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }
  var ICON_HELP = '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>';
  function dateTR(iso) {
    var p = String(iso || '').split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : '';
  }
  function revokeThumbs() { thumbUrls.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} }); thumbUrls = []; }

  /* ---------- Ana ekran kartı ---------- */
  function updateCard() {
    var c = document.getElementById('nk-hoca-count');
    var s = document.getElementById('nk-hoca-sub');
    if (c) c.textContent = String(cache.length);
    if (s) s.textContent = cache.length
      ? cache.length + ' soru hocaya gösterilmeyi bekliyor'
      : 'Anlamadıklarını burada biriktir, döngüye girmez';
  }
  function ensureCard() {
    var home = document.getElementById('home');
    if (!home || document.getElementById('nk-hoca-card')) return;
    var perf = document.getElementById('today-total-count');
    var anchor = perf && perf.closest ? perf.closest('.bg-white') : null;
    var card = document.createElement('button');
    card.id = 'nk-hoca-card';
    card.type = 'button';
    card.className = 'w-full bg-white rounded-2xl p-4 flex items-center gap-3 text-left';
    card.style.boxShadow = 'var(--card-shadow)';
    card.innerHTML =
      '<div style="width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#6366f122;color:#6366f1;flex-shrink:0">' +
      fillIcon(I_Q, 20) + '</div>' +
      '<div class="flex-1 min-w-0"><p class="text-sm font-bold text-slate-700">Hocaya Sorulacaklar</p>' +
      '<p id="nk-hoca-sub" class="text-xs text-slate-400"></p></div>' +
      '<span id="nk-hoca-count" class="text-sm font-bold text-white rounded-full px-2.5 py-1" style="background:#6366f1;min-width:28px;text-align:center">0</span>';
    if (anchor && anchor.parentNode === home) home.insertBefore(card, anchor);
    else home.appendChild(card);
    card.onclick = openSheet;
    updateCard();
  }

  /* ---------- Simgeler (uygulamanın kendi simgeleri) ---------- */
  var I_GALLERY = '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>';
  var I_CAMERA = '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2L7.17 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>';
  var I_TRASH = '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>';
  var I_CHEV = '<path d="M7 10l5 5 5-5z"/>';
  var I_CLOSE = '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>';
  var I_PLUS = '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>';
  var I_Q = '<path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>';
  var I_NOTE = '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>';
  function fillIcon(path, size, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="' + size + '" height="' + size + '" style="flex-shrink:0;' + (extra || '') + '">' + path + '</svg>';
  }
  function row(cls, style) { var d = el('div', cls); if (style) d.style.cssText = style; return d; }
  function iconBtn(path, label, cls, fn, size) {
    var b = el('button', cls);
    b.type = 'button';
    b.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;';
    b.innerHTML = fillIcon(path, size || 16) + (label ? '<span>' + label + '</span>' : '');
    b.onclick = fn;
    return b;
  }

  /* ---------- Liste ekranı ---------- */
  function closeSheet() {
    var s = document.getElementById('nk-hoca-sheet');
    if (s) s.remove();
    revokeThumbs();
    if (typeof closeWithBackSupport === 'function') closeWithBackSupport('hoca');
  }

  function renderList() {
    var list = document.getElementById('nk-hoca-list');
    if (!list) return;
    revokeThumbs();
    list.innerHTML = '';
    var cnt = document.getElementById('nk-hoca-title-count');
    if (cnt) cnt.textContent = cache.length ? String(cache.length) : '';

    if (!cache.length) {
      var empty = row('flex flex-col items-center text-center bg-white rounded-2xl border-2 border-dashed border-slate-200', 'padding:44px 24px;');
      var ic = row('', 'width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#6366f122;color:#6366f1;margin-bottom:14px');
      ic.innerHTML = fillIcon(I_Q, 28);
      empty.appendChild(ic);
      empty.appendChild(el('p', 'text-sm font-bold text-slate-600', 'Henüz bir şey yok'));
      var p2 = el('p', 'text-xs text-slate-400', 'Anlamadığın bir soruyu fotoğrafla, hocaya gösterene kadar burada beklesin.');
      p2.style.cssText = 'max-width:230px;line-height:1.5;margin-top:4px';
      empty.appendChild(p2);
      list.appendChild(empty);
    }

    cache.forEach(function (it) {
      var card = el('div', 'bg-white rounded-2xl');
      card.style.cssText = 'padding:12px;box-shadow:var(--card-shadow);';

      var head = row('', 'display:flex;align-items:flex-start;gap:12px;');
      if (it.img) {
        var u = URL.createObjectURL(it.img);
        thumbUrls.push(u);
        var im = document.createElement('img');
        im.src = u;
        im.style.cssText = 'width:76px;height:76px;object-fit:cover;border-radius:14px;flex-shrink:0;background:#f1f5f9;cursor:zoom-in';
        im.onclick = function () { if (typeof openLightbox === 'function') openLightbox(u); };
        head.appendChild(im);
      } else {
        var ph = row('', 'width:76px;height:76px;border-radius:14px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#6366f114;color:#6366f1');
        ph.innerHTML = fillIcon(I_NOTE, 28);
        head.appendChild(ph);
      }
      var info = row('', 'min-width:0;flex:1;');
      var label = (it.course || 'Ders seçilmedi') + (it.topic ? ' › ' + it.topic : '');
      var l1 = el('p', 'text-xs font-bold text-slate-700', label);
      l1.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      info.appendChild(l1);
      info.appendChild(el('p', 'text-[10px] font-semibold text-slate-400', dateTR(it.createdDate)));
      if (it.text) {
        var tx = el('p', 'text-xs text-slate-600', it.text);
        tx.style.cssText = 'margin-top:6px;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden';
        info.appendChild(tx);
      }
      head.appendChild(info);
      card.appendChild(head);

      var btns = row('', 'display:flex;gap:8px;margin-top:12px;');
      var q = iconBtn(I_Q, 'Soru yap', 'bg-teal-600 text-white text-xs font-semibold rounded-xl', function () { convert(it, false); }, 15);
      var n = iconBtn(I_NOTE, 'Not yap', 'bg-amber-500 text-white text-xs font-semibold rounded-xl', function () { convert(it, true); }, 15);
      [q, n].forEach(function (b) { b.style.flex = '1'; b.style.padding = '10px 6px'; });
      var d = iconBtn(I_TRASH, '', 'bg-slate-100 text-rose-600 rounded-xl', function () {
        showCustomConfirm('Bu kayıt hocaya sorulacaklar listesinden silinsin mi?', async function () {
          try {
            await del(it.id);
            cache = cache.filter(function (x) { return x.id !== it.id; });
            renderList(); updateCard(); schedBackup();
          } catch (e) { showToast('Silinemedi.', true); }
        });
      }, 18);
      d.style.padding = '10px 14px';
      btns.appendChild(q); btns.appendChild(n); btns.appendChild(d);
      card.appendChild(btns);
      list.appendChild(card);
    });
  }

  function openSheet() {
    if (!db) { showToast('Bu özellik şu an açılamadı. Uygulamayı yenile.', true); return; }
    if (document.getElementById('nk-hoca-sheet')) return;
    var ov = el('div', 'bg-slate-50');
    ov.id = 'nk-hoca-sheet';
    ov.style.cssText = 'position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;';

    var head = el('div', 'bg-white border-b border-slate-200');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:max(14px, env(safe-area-inset-top)) 16px 12px;';
    var left = row('', 'display:flex;align-items:center;gap:10px;');
    var ic = row('', 'width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:#6366f122;color:#6366f1');
    ic.innerHTML = fillIcon(I_Q, 20);
    left.appendChild(ic);
    left.appendChild(el('h3', 'text-base font-semibold text-slate-800', 'Hocaya Sorulacaklar'));
    var tc = el('span', 'text-xs font-bold text-white rounded-full');
    tc.id = 'nk-hoca-title-count';
    tc.style.cssText = 'background:#6366f1;padding:2px 9px;';
    left.appendChild(tc);
    head.appendChild(left);
    var close = iconBtn(I_CLOSE, '', 'text-slate-500', closeSheet, 22);
    close.style.padding = '6px';
    head.appendChild(close);

    var list = el('div', 'flex-1');
    list.id = 'nk-hoca-list';
    list.style.cssText = 'overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;';

    var foot = el('div', 'bg-white border-t border-slate-200');
    foot.style.cssText = 'padding:12px 16px max(12px, env(safe-area-inset-bottom));';
    var add = iconBtn(I_PLUS, 'Yeni Soru Ekle', 'btn-cyber w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-2xl', openEditor, 22);
    add.style.padding = '14px';
    foot.appendChild(add);

    ov.appendChild(head); ov.appendChild(list); ov.appendChild(foot);
    document.body.appendChild(ov);
    if (typeof openWithBackSupport === 'function') openWithBackSupport('hoca', closeSheet);
    renderList();
  }

  /* ---------- Ders / konu seçici (ekleme ekranındakiyle aynı görünüm) ---------- */
  function openPickerSheet(kind, course, done) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:78;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
    var box = el('div', 'bg-white');
    box.style.cssText = 'width:100%;max-width:340px;border-radius:24px;padding:18px;display:flex;flex-direction:column;max-height:70vh;box-shadow:0 20px 60px rgba(0,0,0,.3);';
    var top = row('border-b border-slate-100', 'display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;margin-bottom:12px;');
    var title = kind === 'course' ? 'Ders Seç' : (course + ' › Konu Seç');
    var t = el('h3', 'text-sm font-bold text-teal-700', title);
    t.style.cssText = 'font-size:14px;padding-right:8px;';
    top.appendChild(t);
    var x = iconBtn(I_CLOSE, '', 'text-slate-400', function () { ov.remove(); }, 20);
    x.style.padding = '4px';
    top.appendChild(x);
    var list = row('', 'overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px;');
    var items = kind === 'course'
      ? Object.keys((typeof appState !== 'undefined' && appState.categories) || {})
      : ((appState.categories && appState.categories[course]) || []);
    function opt(label, value, soft) {
      var b = el('button', 'text-slate-700 bg-slate-50 border border-slate-200 text-sm font-bold', label);
      b.type = 'button';
      b.style.cssText = 'width:100%;text-align:left;padding:12px 16px;border-radius:12px;' + (soft ? 'color:#64748b;font-weight:600;' : '');
      b.onclick = function () { ov.remove(); done(value); };
      list.appendChild(b);
    }
    if (kind === 'topic') opt('Konu seçmeden devam et', '', true);
    items.forEach(function (it) { opt(it, it); });
    box.appendChild(top); box.appendChild(list); ov.appendChild(box);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
  }

  function pickerButton(labelText, placeholder, onTap) {
    var wrap = el('div', '');
    wrap.appendChild(el('label', 'text-slate-600', labelText));
    wrap.firstChild.style.cssText = 'display:block;font-size:12px;font-weight:600;margin-bottom:8px;';
    var b = el('button', 'bg-white border border-slate-300 text-slate-700 shadow-sm');
    b.type = 'button';
    b.style.cssText = 'width:100%;padding:14px;border-radius:12px;text-align:left;display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:500;';
    var span = document.createElement('span');
    span.textContent = placeholder;
    b.appendChild(span);
    var chev = document.createElement('span');
    chev.style.cssText = 'color:#94a3b8;display:flex';
    chev.innerHTML = fillIcon(I_CHEV, 16);
    b.appendChild(chev);
    b.onclick = onTap;
    wrap.appendChild(b);
    wrap.setText = function (txt) { span.textContent = txt; };
    return wrap;
  }

  /* ---------- Yeni soru ekleme (tam ekran, ekleme ekranına benzer) ---------- */
  function openEditor() {
    var state = { img: null, url: null, course: '', topic: '', cropper: null, cropUrl: null };
    var ov = el('div', 'bg-slate-50');
    ov.style.cssText = 'position:fixed;inset:0;z-index:75;display:flex;flex-direction:column;';

    var head = el('div', 'bg-white border-b border-slate-200');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:max(14px, env(safe-area-inset-top)) 16px 12px;';
    head.appendChild(el('h3', 'text-base font-semibold text-slate-800', 'Hocaya sorulacak soru'));
    var xb = iconBtn(I_CLOSE, '', 'text-slate-500', function () { close(); }, 22);
    xb.style.padding = '6px';
    head.appendChild(xb);

    var body = el('div', '');
    body.style.cssText = 'flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:16px;';

    /* Fotoğraf alanı: yükleme / kırpma / önizleme */
    var photo = el('div', '');
    var placeholder = el('div', 'bg-white border-2 border-dashed border-slate-300');
    placeholder.style.cssText = 'border-radius:16px;padding:18px 16px;display:flex;flex-direction:column;align-items:center;';
    placeholder.appendChild(el('p', 'text-slate-400', 'Soruyu fotoğrafla'));
    placeholder.firstChild.style.cssText = 'font-size:12px;font-weight:600;letter-spacing:.05em;margin-bottom:12px;';
    var pr = row('', 'display:flex;gap:12px;width:100%;max-width:280px;');
    var gal = iconBtn(I_GALLERY, '', 'bg-teal-600 text-white rounded-xl shadow-sm', function () { file.click(); }, 24);
    var cam = iconBtn(I_CAMERA, '', 'bg-sky-500 text-white rounded-xl shadow-sm', function () {
      if (window.__nkCamera && window.__nkCamera.supported()) window.__nkCamera.open(startCrop);
      else file.click();
    }, 24);
    [gal, cam].forEach(function (b) { b.style.flex = '1'; b.style.padding = '12px'; });
    pr.appendChild(gal); pr.appendChild(cam);
    placeholder.appendChild(pr);
    var file = document.createElement('input');
    file.type = 'file'; file.accept = 'image/*'; file.style.display = 'none';
    file.onchange = function () { var f = file.files && file.files[0]; file.value = ''; if (f) startCrop(f); };

    var cropBox = el('div', 'bg-white border border-slate-300');
    cropBox.style.cssText = 'display:none;border-radius:16px;padding:10px;';
    var cropHost = row('', 'height:52vh;border-radius:12px;overflow:hidden;');
    var cropImg = document.createElement('img');
    cropImg.style.cssText = 'max-width:100%;display:block;';
    cropHost.appendChild(cropImg);
    var cropBtns = row('', 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px;');
    cropBox.appendChild(cropHost); cropBox.appendChild(cropBtns);

    var prevBox = el('div', 'bg-white border border-slate-300');
    prevBox.style.cssText = 'display:none;border-radius:16px;padding:10px;position:relative;';
    var prevImg = document.createElement('img');
    prevImg.style.cssText = 'width:100%;max-height:240px;object-fit:contain;border-radius:12px;display:block;';
    var rm = iconBtn(I_CLOSE, '', 'bg-rose-600 text-white', function () { clearPhoto(); }, 16);
    rm.style.cssText += 'position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:9999px;box-shadow:0 2px 8px rgba(0,0,0,.25);';
    prevBox.appendChild(prevImg); prevBox.appendChild(rm);

    photo.appendChild(placeholder); photo.appendChild(cropBox); photo.appendChild(prevBox); photo.appendChild(file);

    function showOnly(which) {
      placeholder.style.display = which === 'ph' ? 'flex' : 'none';
      cropBox.style.display = which === 'crop' ? 'block' : 'none';
      prevBox.style.display = which === 'prev' ? 'block' : 'none';
    }
    function destroyCropper() {
      if (state.cropper) { try { state.cropper.destroy(); } catch (e) {} state.cropper = null; }
      if (state.cropUrl) { URL.revokeObjectURL(state.cropUrl); state.cropUrl = null; }
    }
    function clearPhoto() {
      destroyCropper();
      if (state.url) { URL.revokeObjectURL(state.url); state.url = null; }
      state.img = null;
      showOnly('ph');
    }
    function usePhoto(blob) {
      destroyCropper();
      state.img = blob;
      if (state.url) URL.revokeObjectURL(state.url);
      state.url = URL.createObjectURL(blob);
      prevImg.src = state.url;
      showOnly('prev');
    }
    async function startCrop(f) {
      try {
        var blob = f;
        if (typeof window.nkShrinkImage === 'function') blob = await window.nkShrinkImage(f, 1600, 0.85);
        if (typeof Cropper === 'undefined') { usePhoto(blob); return; }
        destroyCropper();
        state.cropUrl = URL.createObjectURL(blob);
        cropBtns.innerHTML = '';
        showOnly('crop');
        cropImg.onload = function () {
          state.cropper = new Cropper(cropImg, {
            viewMode: 1, dragMode: 'move', autoCropArea: 0.92, background: false, center: false, highlight: false,
            cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false, restore: false
          });
        };
        cropImg.src = state.cropUrl;
        function cb(label, cls, fn) {
          var b = el('button', cls + ' px-4 py-2 text-xs font-semibold rounded-xl shadow-sm', label);
          b.type = 'button';
          b.style.cssText = 'padding:9px 16px;';
          b.onclick = fn;
          cropBtns.appendChild(b);
        }
        cb('Döndür', 'bg-slate-200 text-slate-700', function () { if (state.cropper) state.cropper.rotate(90); });
        cb('Sıfırla', 'bg-slate-200 text-slate-700', function () { if (state.cropper) state.cropper.reset(); });
        cb('Kırpmadan Kullan', 'bg-slate-200 text-slate-700', function () { usePhoto(blob); });
        cb('Kırpmayı Onayla', 'bg-emerald-600 text-white', function () {
          if (!state.cropper) { usePhoto(blob); return; }
          var cv = state.cropper.getCroppedCanvas({ maxWidth: 1400, maxHeight: 1400 });
          cv.toBlob(function (out) { usePhoto(out || blob); }, 'image/jpeg', 0.85);
        });
      } catch (e) { console.warn(e); showToast('Fotoğraf açılamadı. Tekrar dene.', true); }
    }
    showOnly('ph');

    /* Ders / konu */
    var courseBtn = pickerButton('Ders Seç', 'Ders Seç (isteğe bağlı)', function () {
      openPickerSheet('course', '', function (c) {
        state.course = c; state.topic = '';
        courseBtn.setText(c || 'Ders Seç (isteğe bağlı)');
        topicBtn.setText('Konu Seç (isteğe bağlı)');
      });
    });
    var topicBtn = pickerButton('Konu Seç', 'Önce Ders Seç', function () {
      if (!state.course) { showToast('Önce ders seçmelisin!', true); return; }
      openPickerSheet('topic', state.course, function (t) {
        state.topic = t;
        topicBtn.setText(t || 'Konu Seç (isteğe bağlı)');
      });
    });
    // ders seçilince konu butonu "Konu Seç" olsun
    var origCourseSet = courseBtn.setText;
    courseBtn.setText = function (txt) { origCourseSet(txt); topicBtn.setText(state.course ? 'Konu Seç (isteğe bağlı)' : 'Önce Ders Seç'); };

    /* Not */
    var noteWrap = el('div', '');
    var nl = el('label', 'text-slate-600', 'Neyi anlamadın?');
    nl.style.cssText = 'display:block;font-size:12px;font-weight:600;margin-bottom:8px;';
    var text = document.createElement('textarea');
    text.placeholder = 'İstersen kısaca yaz...';
    text.className = 'bg-white border border-slate-300 text-slate-800 shadow-sm';
    text.style.cssText = 'width:100%;height:84px;padding:14px;border-radius:12px;font-size:13px;font-weight:500;resize:none;outline:none;';
    noteWrap.appendChild(nl); noteWrap.appendChild(text);

    body.appendChild(photo); body.appendChild(courseBtn); body.appendChild(topicBtn); body.appendChild(noteWrap);

    var foot = el('div', 'bg-white border-t border-slate-200');
    foot.style.cssText = 'padding:12px 16px max(12px, env(safe-area-inset-bottom));';
    var save = el('button', 'btn-cyber w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-2xl', 'Kaydet');
    save.type = 'button';
    save.style.padding = '14px';
    foot.appendChild(save);

    function close() {
      destroyCropper();
      if (state.url) URL.revokeObjectURL(state.url);
      ov.remove();
      if (typeof closeWithBackSupport === 'function') closeWithBackSupport('hocaeditor');
    }
    save.onclick = async function () {
      if (state.cropper) { showToast('Önce kırpmayı onayla ya da "Kırpmadan Kullan"a bas.', true); return; }
      var t = text.value.trim();
      if (!state.img && !t) { showToast('Fotoğraf çek ya da bir not yaz.', true); return; }
      var item = {
        id: Date.now(), course: state.course, topic: state.topic, text: t, img: state.img || null,
        createdDate: formatDate(getNowTR())
      };
      try {
        await put(item);
        cache.unshift(item); sortCache();
        close(); renderList(); updateCard(); schedBackup();
        showToast('Hocaya sorulacaklara eklendi.');
      } catch (e) { showToast('Kaydedilemedi, tekrar dene.', true); }
    };

    ov.appendChild(head); ov.appendChild(body); ov.appendChild(foot);
    document.body.appendChild(ov);
    if (typeof openWithBackSupport === 'function') openWithBackSupport('hocaeditor', close);
  }

  /* ---------- Asıl arşive ekleme ---------- */
  async function convert(item, asNote) {
    try {
      closeSheet();
      switchTab('add');
      setEntryType(asNote ? 'note' : 'question');
      if (item.course && appState.categories && appState.categories[item.course]) {
        document.getElementById('q-course').value = item.course;
        document.getElementById('btn-pick-course-text').innerText = item.course;
        if (item.topic) {
          document.getElementById('q-topic').value = item.topic;
          document.getElementById('btn-pick-topic-text').innerText = item.topic;
        } else {
          document.getElementById('q-topic').value = '';
          document.getElementById('btn-pick-topic-text').innerText = 'Konu Seç';
        }
      }
      if (item.img) {
        if (!asNote) setQuestionInputType('image');
        var f = new File([item.img], 'hoca.jpg', { type: item.img.type || 'image/jpeg' });
        await window.handleImageUpload({ target: { files: [f], value: '' } });
        if (item.text && asNote) document.getElementById('q-note').value = item.text;
      } else if (item.text) {
        if (asNote) document.getElementById('q-note').value = item.text;
        else { setQuestionInputType('text'); document.getElementById('q-text-question').value = item.text; }
      }
      pendingId = item.id;
      showToast(asNote ? 'Notu tamamlayıp kaydet, listeden kalkacak.' : 'Cevabı işaretleyip kaydet, listeden kalkacak.');
    } catch (e) {
      console.warn('Dönüştürme hatası:', e);
      showToast('Açılamadı, tekrar dene.', true);
    }
  }

  /* ---------- Bağlantılar ---------- */
  // Kaydedilince hocaya sorulacaklardan kaldır; başka sekmeye geçilirse vazgeçilmiş say
  var origToast = window.showToast;
  if (typeof origToast === 'function') {
    window.showToast = function (message) {
      var r = origToast.apply(this, arguments);
      try {
        if (pendingId && /başarıyla kaydedildi/i.test(String(message))) {
          var id = pendingId; pendingId = null;
          del(id).then(function () {
            cache = cache.filter(function (x) { return x.id !== id; });
            updateCard(); schedBackup();
          }).catch(function () {});
        }
      } catch (e) {}
      return r;
    };
  }
  var origSwitch = window.switchTab;
  if (typeof origSwitch === 'function') {
    window.switchTab = function (tabId) {
      var r = origSwitch.apply(this, arguments);
      try {
        if (tabId !== 'add') pendingId = null;
        if (tabId === 'home') { ensureCard(); updateCard(); }
      } catch (e) {}
      return r;
    };
  }

  window.__nkHoca = {
    getCache: function () { return cache; },
    get ready() { return ready; },
    restoreItem: restoreItem
  };

  async function init() {
    try {
      db = await openDB();
      cache = await getAll();
      sortCache();
      ready = true;
    } catch (e) {
      console.warn('Hocaya sorulacaklar açılamadı:', e);
    }
    ensureCard();
    updateCard();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
