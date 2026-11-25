/* Soru / not düzenleyici + fotoğraf seçici (uygulama içi kamera, galeri, tam ekran kırpma) */
(function () {
  'use strict';
  function toast(m, e) { try { showToast(m, !!e); } catch (x) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Fotoğraf: kamera/galeri -> kırpma -> küçük JPEG ---------- */
  function pickFile(source, cb) {
    if (source === 'camera' && window.__nkCamera && window.__nkCamera.supported()) { window.__nkCamera.open(cb); return; }
    var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.style.display = 'none';
    if (source === 'camera') i.setAttribute('capture', 'environment');
    document.body.appendChild(i);
    i.onchange = function () { var f = i.files && i.files[0]; setTimeout(function () { i.remove(); }, 500); if (f) cb(f); };
    i.click();
  }
  function cropFile(file, maxPx, cb) {
    var url = URL.createObjectURL(file), img = document.createElement('img');
    img.id = 'nk-ask-crop'; img.style.cssText = 'position:fixed;left:-9999px;top:0;max-width:100%'; document.body.appendChild(img);
    var prev = window.__nkAskCrop, cr = null, finished = false;
    function done() { if (finished) return; finished = true; try { if (cr) cr.destroy(); } catch (e) {} img.remove(); URL.revokeObjectURL(url); window.__nkAskCrop = prev; }
    window.__nkAskCrop = {
      ok: function () { try { var cv = cr.getCroppedCanvas({ maxWidth: maxPx, maxHeight: maxPx }); var d = cv.toDataURL('image/jpeg', 0.78); done(); cb(d); } catch (e) { done(); toast('Fotoğraf işlenemedi', true); } },
      cancel: function () { done(); }
    };
    img.onload = function () {
      try { cr = new Cropper(img, { viewMode: 1, dragMode: 'move', autoCropArea: 0.92, background: false, center: false, highlight: false, cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false, restore: false }); }
      catch (e) { done(); toast('Fotoğraf açılamadı', true); }
    };
    img.onerror = function () { done(); toast('Fotoğraf açılamadı', true); };
    img.src = url;
  }
  // Büyük (50 MP'ye kadar) telefon fotoğraflarını bellek yetmeden önce küçült
  async function shrink(file, max) {
    var tries = [{ imageOrientation: 'from-image' }, { imageOrientation: 'from-image', resizeWidth: max, resizeQuality: 'medium' }, { resizeWidth: 1600 }];
    if (window.createImageBitmap) {
      for (var i = 0; i < tries.length; i++) {
        try {
          var bm = await createImageBitmap(file, tries[i]);
          var sc = Math.min(1, max / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(bm.width * sc)); c.height = Math.max(1, Math.round(bm.height * sc));
          c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
          try { bm.close(); } catch (e) {}
          var blob = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.9); });
          c.width = c.height = 1;
          if (blob) return blob;
        } catch (e) {}
      }
    }
    return file;
  }
  function photo(source, maxPx, cb) {
    pickFile(source, function (f) {
      toast('Fotoğraf hazırlanıyor...');
      shrink(f, 2200).then(function (b) { cropFile(b, maxPx || 1280, cb); });
    });
  }

  /* ---------- Düzenleyici ---------- */
  var css = '#nke{position:fixed;inset:0;z-index:400;background:#f8fafc;color:#0f172a;display:flex;flex-direction:column}body.dark-mode #nke{background:#0b0b14;color:#eef0ff}' +
    '#nke .h{display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top)) 14px 10px;border-bottom:1px solid rgba(128,128,128,.25)}#nke .h b{flex:1;font-size:17px}' +
    '#nke .bd{flex:1;overflow:auto;padding:14px;max-width:560px;width:100%;margin:0 auto}' +
    '#nke label.l{display:block;font-size:12px;font-weight:700;opacity:.7;margin:14px 2px 6px}' +
    '#nke input,#nke textarea,#nke select{width:100%;border:1.5px solid rgba(128,128,128,.4);background:transparent;color:inherit;border-radius:14px;padding:13px 14px;font-size:15px;min-height:48px}#nke select option{color:#0f172a}' +
    '#nke textarea{min-height:90px;resize:vertical}' +
    '#nke button.b{background:#0d9488;color:#fff;font-weight:800;font-size:15px;padding:14px 18px;border-radius:14px;min-height:50px}' +
    '#nke button.g{border:1.5px solid rgba(128,128,128,.4);font-weight:700;font-size:14px;padding:11px 14px;border-radius:14px;min-height:46px}' +
    '#nke .im{border:1.5px dashed rgba(128,128,128,.45);border-radius:16px;padding:10px;text-align:center}#nke .im img{max-width:100%;max-height:220px;border-radius:10px;display:block;margin:0 auto 10px}' +
    '#nke .ch{display:flex;gap:8px}#nke .ch button{flex:1;height:52px;border-radius:14px;font-weight:800;font-size:17px;border:2px solid rgba(128,128,128,.4)}#nke .ch button.on{background:#0d9488;color:#fff;border-color:#0d9488}' +
    '#nke .f{padding:10px 14px max(12px,env(safe-area-inset-bottom));border-top:1px solid rgba(128,128,128,.25);display:flex;gap:10px}';
  var cssOn = false;
  function open(opts) {
    if (!cssOn) { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); cssOn = true; }
    var old = document.getElementById('nke'); if (old) old.remove();
    var d = {}; for (var k in opts.data) d[k] = opts.data[k];
    var isQ = opts.kind === 'question';
    var cats = (window.appState && appState.categories) || {};
    var ov = document.createElement('div'); ov.id = 'nke';
    function imgBox(key, label) {
      return '<label class="l">' + label + '</label><div class="im" data-k="' + key + '">' + (d[key] ? '<img src="' + d[key] + '">' : '<div style="opacity:.55;font-size:13px;margin-bottom:10px">Görsel yok</div>') +
        '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="g" data-a="cam">📷 Kamera</button><button class="g" data-a="gal">🖼️ Galeri</button>' + (d[key] ? '<button class="g" data-a="del" style="color:#e11d48">Kaldır</button>' : '') + '</div></div>';
    }
    function draw() {
      var courses = Object.keys(cats); if (d.course && courses.indexOf(d.course) < 0) courses.unshift(d.course);
      var topics = (cats[d.course] || []).slice(); if (d.topic && topics.indexOf(d.topic) < 0) topics.unshift(d.topic);
      var h = '<div class="h"><button class="g" id="nke-x">‹ Vazgeç</button><b>' + esc(opts.title || (isQ ? 'Soruyu düzenle' : 'Notu düzenle')) + '</b></div><div class="bd">' +
        '<label class="l">Ders</label><select id="nke-c">' + courses.map(function (c) { return '<option' + (c === d.course ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' +
        '<label class="l">Konu</label><select id="nke-t">' + topics.map(function (c) { return '<option' + (c === d.topic ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>';
      if (isQ) {
        h += '<label class="l">Soru metni</label><textarea id="nke-q" placeholder="İstersen soruyu yazı olarak da ekleyebilirsin">' + esc(d.text_question || '') + '</textarea>' + imgBox('img', 'Soru görseli') +
          '<label class="l">Cevap türü</label><div class="ch"><button data-ty="choice" class="' + (d.type === 'choice' ? 'on' : '') + '" style="font-size:14px">Şıklı</button><button data-ty="text" class="' + (d.type !== 'choice' ? 'on' : '') + '" style="font-size:14px">Yazılı</button></div>' +
          '<label class="l">Doğru cevap</label>' + (d.type === 'choice' ? '<div class="ch">' + ['A', 'B', 'C', 'D', 'E'].map(function (x) { return '<button data-ans="' + x + '" class="' + (d.answer === x ? 'on' : '') + '">' + x + '</button>'; }).join('') + '</div>' : '<input id="nke-a" value="' + esc(d.answer || '') + '" placeholder="Cevap">') +
          '<label class="l">Çözüm notu</label><textarea id="nke-n" placeholder="Püf noktası, çözüm yolu...">' + esc(d.note_text || '') + '</textarea>' + imgBox('note_img', 'Çözüm görseli');
      } else {
        h += '<label class="l">Ön yüz (metin)</label><textarea id="nke-q">' + esc(d.note || '') + '</textarea>' + imgBox('img', 'Ön yüz görseli') +
          '<label class="l">Arka yüz (metin)</label><textarea id="nke-n">' + esc(d.note_back || '') + '</textarea>' + imgBox('note_back_img', 'Arka yüz görseli');
      }
      h += '<div style="height:20px"></div></div><div class="f"><button class="b" id="nke-s" style="flex:1">' + esc(opts.saveLabel || 'Kaydet') + '</button></div>';
      ov.innerHTML = h; wire();
    }
    function grab() {
      var q = ov.querySelector('#nke-q'), n = ov.querySelector('#nke-n'), a = ov.querySelector('#nke-a');
      if (isQ) { if (q) d.text_question = q.value; if (n) d.note_text = n.value; if (a) d.answer = a.value; }
      else { if (q) d.note = q.value; if (n) d.note_back = n.value; }
    }
    function wire() {
      ov.querySelector('#nke-x').onclick = function () { ov.remove(); };
      ov.querySelector('#nke-c').onchange = function () { grab(); d.course = this.value; var t = (cats[d.course] || [])[0] || ''; d.topic = t; draw(); };
      ov.querySelector('#nke-t').onchange = function () { grab(); d.topic = this.value; };
      ov.querySelectorAll('[data-ty]').forEach(function (b) { b.onclick = function () { grab(); d.type = b.dataset.ty; if (d.type === 'choice' && !/^[A-E]$/.test(d.answer || '')) d.answer = ''; draw(); }; });
      ov.querySelectorAll('[data-ans]').forEach(function (b) { b.onclick = function () { grab(); d.answer = b.dataset.ans; draw(); }; });
      ov.querySelectorAll('.im').forEach(function (box) {
        var key = box.dataset.k;
        box.querySelectorAll('button').forEach(function (b) {
          b.onclick = function () {
            grab();
            if (b.dataset.a === 'del') { d[key] = null; draw(); return; }
            photo(b.dataset.a === 'cam' ? 'camera' : 'gallery', 1400, function (url) { d[key] = url; draw(); });
          };
        });
      });
      ov.querySelector('#nke-s').onclick = function () {
        grab();
        if (!d.course || !d.topic) return toast('Ders ve konu seç', true);
        if (isQ && !d.text_question && !d.img) return toast('Soru için metin veya görsel gerekli', true);
        if (isQ && !d.answer) return toast('Doğru cevabı gir', true);
        if (!isQ && !d.note && !d.img) return toast('Not metni veya görsel gerekli', true);
        var btn = this; btn.disabled = true;
        Promise.resolve(opts.onSave(d)).then(function () { ov.remove(); }, function () { btn.disabled = false; toast('Kaydedilemedi', true); });
      };
    }
    document.body.appendChild(ov); draw();
  }

  /* ---------- Arşivdeki bir kaydı düzenle ---------- */
  function blobToURL(b) { return b && b.size ? (typeof blobToDataURL === 'function' ? blobToDataURL(b) : null) : Promise.resolve(null); }
  async function editItem(type, id) {
    var list = type === 'question' ? appState.questions : appState.notes;
    var it = list.filter(function (x) { return x.id === id; })[0]; if (!it) return toast('Kayıt bulunamadı', true);
    var data = { course: it.course, topic: it.topic };
    try {
      if (type === 'question') { data.text_question = it.text_question || ''; data.answer = it.answer || ''; data.type = it.type || 'text'; data.note_text = it.note_text || ''; data.img = await blobToURL(it.img); data.note_img = await blobToURL(it.note_img); }
      else { data.note = it.note || ''; data.note_back = it.note_back || ''; data.img = await blobToURL(it.img); data.note_back_img = await blobToURL(it.note_back_img); }
    } catch (e) { return toast('Görsel okunamadı', true); }
    open({
      kind: type, data: data, title: type === 'question' ? 'Soruyu düzenle' : 'Notu düzenle',
      onSave: async function (d) {
        function bl(u) { return u && u.indexOf('data:') === 0 ? dataURLToBlob(u) : null; }
        it.course = d.course; it.topic = d.topic;
        if (type === 'question') { it.text_question = d.text_question || ''; it.answer = d.answer; it.type = d.type; it.note_text = d.note_text || ''; it.img = bl(d.img); it.note_img = bl(d.note_img); await saveQuestion(it); }
        else { it.note = d.note || ''; it.note_back = d.note_back || null; it.img = bl(d.img); it.note_back_img = bl(d.note_back_img); await saveNote(it); }
        try { renderLibrary(); updateHomeStats(); } catch (e) {}
        toast('Kaydedildi ✓');
      }
    });
  }

  /* ---------- Arşiv kartlarına düzenle butonu ---------- */
  var PEN = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:22px;height:22px"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
  function decorate() {
    var box = document.getElementById('library-list'); if (!box) return;
    box.querySelectorAll('button[onclick*="deleteItem("]').forEach(function (del) {
      if (del.parentNode.querySelector('.nke-edit')) return;
      var m = /deleteItem\('(\w+)',\s*(\d+)\)/.exec(del.getAttribute('onclick') || ''); if (!m) return;
      var b = document.createElement('button'); b.className = 'nke-edit p-1 shrink-0'; b.title = 'Düzenle'; b.style.cssText = 'color:#6366f1;background:rgba(99,102,241,.12);min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:14px';
      b.innerHTML = PEN;
      b.onclick = function (e) { e.stopPropagation(); editItem(m[1], parseInt(m[2], 10)); };
      del.parentNode.insertBefore(b, del);
    });
  }
  function init() {
    var lib = document.getElementById('library-list');
    if (lib) new MutationObserver(function () { clearTimeout(init._t); init._t = setTimeout(decorate, 60); }).observe(lib, { childList: true });
  }
  window.__nkEdit = { open: open, photo: photo, editItem: editItem };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
