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
      icon(ICON_HELP, 20) + '</div>' +
      '<div class="flex-1 min-w-0"><p class="text-sm font-bold text-slate-700">Hocaya Sorulacaklar</p>' +
      '<p id="nk-hoca-sub" class="text-xs text-slate-400"></p></div>' +
      '<span id="nk-hoca-count" class="text-sm font-bold text-white rounded-full px-2.5 py-1" style="background:#6366f1;min-width:28px;text-align:center">0</span>';
    if (anchor && anchor.parentNode === home) home.insertBefore(card, anchor);
    else home.appendChild(card);
    card.onclick = openSheet;
    updateCard();
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
    if (!cache.length) {
      var empty = el('div', 'text-center py-14 px-6');
      empty.appendChild(el('p', 'text-sm font-bold text-slate-600 mb-1', 'Henüz bir şey yok'));
      empty.appendChild(el('p', 'text-xs text-slate-400', 'Anlamadığın bir soruyu fotoğrafla, hocaya gösterene kadar burada beklesin.'));
      list.appendChild(empty);
    }
    cache.forEach(function (it) {
      var row = el('div', 'bg-white border border-slate-200 rounded-2xl p-3 space-y-2 shadow-sm');
      var head = el('div', 'flex items-start gap-3');
      if (it.img) {
        var u = URL.createObjectURL(it.img);
        thumbUrls.push(u);
        var im = document.createElement('img');
        im.src = u;
        im.style.cssText = 'width:72px;height:72px;object-fit:cover;border-radius:12px;flex-shrink:0;background:#f1f5f9';
        im.onclick = function () { if (typeof openLightbox === 'function') openLightbox(u); };
        head.appendChild(im);
      }
      var info = el('div', 'min-w-0 flex-1');
      var label = (it.course ? it.course : 'Ders seçilmedi') + (it.topic ? ' › ' + it.topic : '');
      info.appendChild(el('p', 'text-xs font-bold text-slate-700 truncate', label));
      info.appendChild(el('p', 'text-[10px] font-semibold text-slate-400', dateTR(it.createdDate)));
      if (it.text) info.appendChild(el('p', 'text-xs text-slate-600 mt-1 whitespace-pre-wrap', it.text));
      head.appendChild(info);
      row.appendChild(head);

      var btns = el('div', 'flex gap-2');
      function b(label, cls, fn) {
        var x = el('button', 'flex-1 py-2 text-xs font-semibold rounded-xl ' + cls, label);
        x.type = 'button';
        x.onclick = fn;
        btns.appendChild(x);
      }
      b('Soru yap', 'bg-teal-600 text-white', function () { convert(it, false); });
      b('Not yap', 'bg-amber-500 text-white', function () { convert(it, true); });
      b('Sil', 'bg-slate-100 text-rose-600', function () {
        showCustomConfirm('Bu kayıt hocaya sorulacaklar listesinden silinsin mi?', async function () {
          try {
            await del(it.id);
            cache = cache.filter(function (x) { return x.id !== it.id; });
            renderList(); updateCard(); schedBackup();
          } catch (e) { showToast('Silinemedi.', true); }
        });
      });
      row.appendChild(btns);
      list.appendChild(row);
    });
  }

  function openSheet() {
    if (!db) { showToast('Bu özellik şu an açılamadı. Uygulamayı yenile.', true); return; }
    if (document.getElementById('nk-hoca-sheet')) return;
    var ov = el('div', 'bg-slate-50');
    ov.id = 'nk-hoca-sheet';
    ov.style.cssText = 'position:fixed;inset:0;z-index:70;display:flex;flex-direction:column';

    var head = el('div', 'bg-white border-b border-slate-200 flex items-center justify-between px-4 pb-3');
    head.style.paddingTop = 'max(14px, env(safe-area-inset-top))';
    head.appendChild(el('h3', 'text-base font-semibold text-slate-800', 'Hocaya Sorulacaklar'));
    var close = el('button', 'text-xs font-semibold text-slate-500 px-2 py-1', 'KAPAT');
    close.type = 'button';
    close.onclick = closeSheet;
    head.appendChild(close);

    var list = el('div', 'flex-1 overflow-y-auto p-4 space-y-3');
    list.id = 'nk-hoca-list';

    var foot = el('div', 'bg-white border-t border-slate-200 p-3');
    foot.style.paddingBottom = 'max(12px, env(safe-area-inset-bottom))';
    var add = el('button', 'btn-cyber w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 font-semibold text-sm rounded-2xl', '+ Yeni Soru Ekle');
    add.type = 'button';
    add.onclick = openEditor;
    foot.appendChild(add);

    ov.appendChild(head); ov.appendChild(list); ov.appendChild(foot);
    document.body.appendChild(ov);
    if (typeof openWithBackSupport === 'function') openWithBackSupport('hoca', closeSheet);
    renderList();
  }

  /* ---------- Yeni soru ekleme penceresi ---------- */
  function openEditor() {
    var state = { img: null, url: null };
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:75;background:rgba(15,23,42,.6);display:flex;align-items:flex-end;justify-content:center';
    var box = el('div', 'bg-white w-full max-w-md p-4 space-y-3');
    box.style.cssText = 'border-radius:24px 24px 0 0;max-height:92vh;overflow-y:auto;padding-bottom:max(16px, env(safe-area-inset-bottom))';
    box.appendChild(el('p', 'text-sm font-bold text-slate-800 text-center', 'Hocaya sorulacak soru'));

    var photoArea = el('div', 'space-y-2');
    var preview = document.createElement('img');
    preview.style.cssText = 'display:none;width:100%;max-height:220px;object-fit:contain;border-radius:14px;background:#f1f5f9';
    var pbtns = el('div', 'flex gap-2');
    var cam = el('button', 'flex-1 bg-sky-500 text-white py-3 text-xs font-semibold rounded-xl', 'Kamera');
    cam.type = 'button';
    var gal = el('button', 'flex-1 bg-teal-600 text-white py-3 text-xs font-semibold rounded-xl', 'Galeri');
    gal.type = 'button';
    var file = document.createElement('input');
    file.type = 'file'; file.accept = 'image/*'; file.style.display = 'none';
    pbtns.appendChild(cam); pbtns.appendChild(gal);
    photoArea.appendChild(preview); photoArea.appendChild(pbtns); photoArea.appendChild(file);
    box.appendChild(photoArea);

    async function setPhoto(f) {
      try {
        var blob = f;
        if (typeof window.nkShrinkImage === 'function') blob = await window.nkShrinkImage(f, 1600, 0.85);
        state.img = blob;
        if (state.url) URL.revokeObjectURL(state.url);
        state.url = URL.createObjectURL(blob);
        preview.src = state.url;
        preview.style.display = 'block';
      } catch (e) { showToast('Fotoğraf açılamadı. Tekrar dene.', true); }
    }
    gal.onclick = function () { file.click(); };
    file.onchange = function () { var f = file.files && file.files[0]; file.value = ''; if (f) setPhoto(f); };
    cam.onclick = function () {
      if (window.__nkCamera && window.__nkCamera.supported()) window.__nkCamera.open(setPhoto);
      else file.click();
    };

    var text = document.createElement('textarea');
    text.placeholder = 'Neyi anlamadın? (isteğe bağlı)';
    text.className = 'w-full bg-white p-3 border border-slate-300 outline-none text-slate-800 text-xs font-medium h-20 rounded-xl resize-none';
    box.appendChild(text);

    var courseSel = document.createElement('select');
    courseSel.className = 'w-full bg-white p-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700';
    var topicSel = document.createElement('select');
    topicSel.className = courseSel.className;
    function fillCourses() {
      courseSel.innerHTML = '<option value="">Ders (isteğe bağlı)</option>';
      Object.keys((typeof appState !== 'undefined' && appState.categories) || {}).forEach(function (c) {
        var o = document.createElement('option'); o.value = c; o.textContent = c; courseSel.appendChild(o);
      });
    }
    function fillTopics() {
      topicSel.innerHTML = '<option value="">Konu (isteğe bağlı)</option>';
      var c = courseSel.value;
      ((appState.categories && appState.categories[c]) || []).forEach(function (t) {
        var o = document.createElement('option'); o.value = t; o.textContent = t; topicSel.appendChild(o);
      });
    }
    fillCourses(); fillTopics();
    courseSel.onchange = fillTopics;
    box.appendChild(courseSel); box.appendChild(topicSel);

    var row = el('div', 'flex gap-2 pt-1');
    var cancel = el('button', 'flex-1 bg-slate-100 text-slate-600 py-3 text-xs font-semibold rounded-xl', 'Vazgeç');
    cancel.type = 'button';
    var save = el('button', 'flex-1 bg-teal-600 text-white py-3 text-xs font-semibold rounded-xl', 'Kaydet');
    save.type = 'button';
    row.appendChild(cancel); row.appendChild(save); box.appendChild(row);

    function close() { if (state.url) URL.revokeObjectURL(state.url); ov.remove(); }
    cancel.onclick = close;
    save.onclick = async function () {
      var t = text.value.trim();
      if (!state.img && !t) { showToast('Fotoğraf çek ya da bir not yaz.', true); return; }
      var item = {
        id: Date.now(), course: courseSel.value, topic: topicSel.value, text: t, img: state.img || null,
        createdDate: formatDate(getNowTR())
      };
      try {
        await put(item);
        cache.unshift(item); sortCache();
        close(); renderList(); updateCard(); schedBackup();
        showToast('Hocaya sorulacaklara eklendi.');
      } catch (e) { showToast('Kaydedilemedi, tekrar dene.', true); }
    };

    ov.appendChild(box);
    document.body.appendChild(ov);
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
