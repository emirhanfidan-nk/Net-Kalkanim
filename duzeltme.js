/* Net Kalkanım - Düzeltme Paketi 1
   1) Tarayıcının verileri kendiliğinden silmesine karşı "kalıcı depolama" izni ister
   2) Telefondan çekilen büyük fotoğrafları hafıza dolmasın diye hemen küçültür
   3) Kayıtlar bir şekilde kaybolursa kullanıcıyı uyarır ve yedek dosyasını seçtirir
   Mevcut soru ve notlara hiçbir şekilde dokunmaz. */
(function () {
  'use strict';

  /* ---------- 1) KALICI DEPOLAMA ---------- */
  async function askPersist() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
        if (!already) await navigator.storage.persist();
      }
    } catch (e) { /* sessizce geç */ }
  }
  askPersist();
  document.addEventListener('click', askPersist, { once: true });
  document.addEventListener('touchend', askPersist, { once: true });

  /* ---------- 1b) KIRPMA EKRANI: büyük, kolay tutulur ---------- */
  var CROP_OPTS = {
    viewMode: 1, dragMode: 'move', autoCropArea: 0.92, background: false, center: false, highlight: false,
    movable: true, zoomable: true, zoomOnTouch: true, zoomOnWheel: true,
    cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false, restore: false
  };
  (function () {
    var css = document.createElement('style');
    css.textContent =
      '#cropper-container,#note-back-cropper-container{height:62vh!important;max-height:none!important}' +
      '.cropper-view-box{outline:2px solid #14b8a6!important;outline-color:#14b8a6!important}' +
      '.cropper-line{background:transparent!important;opacity:1!important}' +
      '.cropper-line.line-e{right:-14px!important;width:28px!important}' +
      '.cropper-line.line-w{left:-14px!important;width:28px!important}' +
      '.cropper-line.line-n{top:-14px!important;height:28px!important}' +
      '.cropper-line.line-s{bottom:-14px!important;height:28px!important}' +
      '.cropper-point{width:22px!important;height:22px!important;opacity:1!important;background:#0d9488!important;border:3px solid #fff;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,.45)}' +
      '.cropper-point.point-e{right:-11px!important;margin-top:-11px!important}' +
      '.cropper-point.point-w{left:-11px!important;margin-top:-11px!important}' +
      '.cropper-point.point-n{top:-11px!important;margin-left:-11px!important}' +
      '.cropper-point.point-s{bottom:-11px!important;margin-left:-11px!important}' +
      '.cropper-point.point-ne{right:-11px!important;top:-11px!important}' +
      '.cropper-point.point-nw{left:-11px!important;top:-11px!important}' +
      '.cropper-point.point-sw{left:-11px!important;bottom:-11px!important}' +
      '.cropper-point.point-se{right:-11px!important;bottom:-11px!important;width:22px!important;height:22px!important}';
    document.head.appendChild(css);
  })();
  function addCropTools(okBtn, getCropper) {
    if (!okBtn || okBtn.getAttribute('data-nk-tools')) return;
    okBtn.setAttribute('data-nk-tools', '1');
    function mk(label, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.className = 'bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 text-xs font-semibold rounded-xl shadow-sm';
      b.onclick = function () { var c = getCropper(); if (c) fn(c); };
      okBtn.parentNode.insertBefore(b, okBtn);
      return b;
    }
    var b1 = mk('Döndür', function (c) { c.rotate(90); });
    var b2 = mk('Sıfırla', function (c) { c.reset(); });
    new MutationObserver(function () {
      var hide = okBtn.classList.contains('hidden');
      b1.style.display = b2.style.display = hide ? 'none' : '';
    }).observe(okBtn, { attributes: true, attributeFilter: ['class'] });
  }
  addCropTools(document.getElementById('btn-crop-ok'), function () { return cropperInstance; });
  addCropTools(document.querySelector('#note-back-editor-area button'), function () { return cropperInstanceBack; });

  /* ---------- 2) FOTOĞRAF KÜÇÜLTME ---------- */
  async function nkShrinkImage(file, maxSide, quality) {
    maxSide = maxSide || 1600;
    quality = quality || 0.85;
    let source = null, bitmap = null, w = 0, h = 0;
    try {
      try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch (e1) { bitmap = await createImageBitmap(file); }
      source = bitmap; w = bitmap.width; h = bitmap.height;
    } catch (e2) {
      const url = URL.createObjectURL(file);
      const img = await new Promise(function (res, rej) {
        const i = new Image();
        i.onload = function () { res(i); };
        i.onerror = rej;
        i.src = url;
      });
      URL.revokeObjectURL(url);
      source = img; w = img.naturalWidth; h = img.naturalHeight;
    }
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    c.getContext('2d').drawImage(source, 0, 0, cw, ch);
    if (bitmap && bitmap.close) bitmap.close();
    const blob = await new Promise(function (res) { c.toBlob(res, 'image/jpeg', quality); });
    c.width = 0; c.height = 0;
    if (!blob) throw new Error('Fotoğraf küçültülemedi');
    return blob;
  }

  window.nkShrinkImage = nkShrinkImage;

  let lastCropUrl = null;
  let lastBackCropUrl = null;

  // Soru / not ön yüz görseli
  window.handleImageUpload = async function (e) {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      showToast('Fotoğraf hazırlanıyor...');
      const blob = await nkShrinkImage(file);
      if (lastCropUrl) { URL.revokeObjectURL(lastCropUrl); lastCropUrl = null; }
      lastCropUrl = URL.createObjectURL(blob);

      document.getElementById('upload-placeholder').classList.add('hidden');
      document.getElementById('editor-area').classList.remove('hidden');
      document.getElementById('cropper-container').classList.remove('hidden');
      document.getElementById('canvas-container').classList.add('hidden');
      document.getElementById('btn-crop-ok').classList.remove('hidden');
      document.getElementById('upload-zoom-ui').classList.add('hidden');
      document.getElementById('upload-zoom-ui').classList.remove('flex');
      document.getElementById('upload-pen-sizes').classList.add('hidden');

      const image = document.getElementById('image-to-crop');
      if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
      image.onload = function () {
        cropperInstance = new Cropper(image, CROP_OPTS);
      };
      image.src = lastCropUrl;
    } catch (err) {
      console.error(err);
      showToast('Fotoğraf açılamadı. Tekrar dene.', true);
    } finally {
      input.value = '';
    }
  };

  // Soru içindeki "çözüm notu" görseli
  window.handleNoteImageUpload = async function (e) {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      showToast('Fotoğraf hazırlanıyor...');
      const blob = await nkShrinkImage(file);
      noteImageDataUrl = await blobToDataURL(blob);
      document.getElementById('note-upload-placeholder').classList.add('hidden');
      document.getElementById('note-image-preview-area').classList.remove('hidden');
      document.getElementById('note-image-preview').src = noteImageDataUrl;
    } catch (err) {
      console.error(err);
      showToast('Fotoğraf açılamadı. Tekrar dene.', true);
    } finally {
      input.value = '';
    }
  };

  // Not arka yüz (cevap) görseli
  window.handleImageUploadBack = async function (e) {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      showToast('Fotoğraf hazırlanıyor...');
      const blob = await nkShrinkImage(file);
      if (lastBackCropUrl) { URL.revokeObjectURL(lastBackCropUrl); lastBackCropUrl = null; }
      lastBackCropUrl = URL.createObjectURL(blob);

      document.getElementById('note-back-upload-placeholder').classList.add('hidden');
      document.getElementById('note-back-image-preview-area').classList.add('hidden');
      document.getElementById('note-back-editor-area').classList.remove('hidden');

      const image = document.getElementById('note-back-image-to-crop');
      if (cropperInstanceBack) { cropperInstanceBack.destroy(); cropperInstanceBack = null; }
      image.onload = function () {
        cropperInstanceBack = new Cropper(image, CROP_OPTS);
      };
      image.src = lastBackCropUrl;
    } catch (err) {
      console.error(err);
      showToast('Fotoğraf açılamadı. Tekrar dene.', true);
    } finally {
      input.value = '';
    }
  };

  /* ---------- 3b) OTOMATİK GÜNCELLEME ---------- */
  (function () {
    if (!('serviceWorker' in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;
    let shown = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController || shown) return; // ilk kurulumda gösterme
      shown = true;
      const bar = document.createElement('div');
      bar.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:2147482000;' +
        'background:#0f766e;color:#fff;border-radius:14px;padding:10px 12px;font-size:12px;font-weight:600;display:flex;' +
        'align-items:center;gap:10px;box-shadow:0 6px 18px rgba(0,0,0,.25)';
      const txt = document.createElement('span');
      txt.style.flex = '1';
      txt.textContent = 'Yeni sürüm hazır.';
      const yenile = document.createElement('button');
      yenile.textContent = 'Yenile';
      yenile.style.cssText = 'background:#fff;color:#0f766e;border:none;border-radius:10px;padding:6px 12px;font-weight:700;font-size:12px';
      yenile.onclick = function () { location.reload(); };
      const sonra = document.createElement('button');
      sonra.textContent = 'Sonra';
      sonra.style.cssText = 'background:transparent;color:#fff;border:none;font-weight:600;font-size:12px';
      sonra.onclick = function () { bar.remove(); };
      bar.appendChild(txt); bar.appendChild(yenile); bar.appendChild(sonra);
      document.body.appendChild(bar);
    });
    function check() {
      navigator.serviceWorker.getRegistration().then(function (r) { if (r) r.update(); }).catch(function () {});
    }
    check();
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') check();
    });
  })();

  /* ---------- 4) DİĞER MODÜLLER (Bulut yedek + Profil) ---------- */
  ['yedek.js', 'profil.js', 'kamera.js', 'duzen.js', 'animasyon.js', 'hoca.js', 'analiz.js', 'bildirim.js', 'ayarlar.js', 'oyunlastirma.js'].forEach(function (src) {
    try {
      const s = document.createElement('script');
      s.src = src;
      document.head.appendChild(s);
    } catch (e) { console.warn('Modül yüklenemedi:', src, e); }
  });

  /* ---------- 5) OTOMATİK GÜNCELLEME ---------- */
  (function () {
    if (!('serviceWorker' in navigator)) return;
    var hadController = !!navigator.serviceWorker.controller;
    var pending = false, banner = null;

    function hasValue(id) { var e = document.getElementById(id); return !!(e && e.value && e.value.trim()); }
    function visible(id) { var e = document.getElementById(id); return !!(e && !e.classList.contains('hidden')); }
    // Kullanıcı bir şey yaparken (soru çözme, fotoğraf düzenleme, yazı yazma) sayfayı kendiliğinden yenileme
    function busy() {
      return visible('review-modal') || visible('camp-review-modal') || visible('editor-area') ||
        visible('note-back-editor-area') || visible('note-image-preview-area') ||
        hasValue('q-text-question') || hasValue('q-note') || hasValue('q-note-back') || hasValue('q-text-answer');
    }
    function showBanner() {
      if (banner) return;
      banner = document.createElement('button');
      banner.textContent = 'Yeni sürüm hazır. Yenilemek için dokun';
      banner.style.cssText = 'position:fixed;top:calc(10px + env(safe-area-inset-top));left:12px;right:12px;z-index:2147483000;' +
        'padding:12px;border-radius:14px;background:#0f766e;color:#fff;font-weight:600;font-size:13px;border:none;box-shadow:0 6px 18px rgba(0,0,0,.25)';
      banner.onclick = function () { location.reload(); };
      document.body.appendChild(banner);
    }
    function tryReload() {
      if (!pending) return;
      if (busy()) { showBanner(); return; }
      try {
        var last = parseInt(sessionStorage.getItem('nk_upd_reload') || '0', 10);
        if (Date.now() - last < 15000) return; // döngü olmasın
        sessionStorage.setItem('nk_upd_reload', String(Date.now()));
      } catch (e) {}
      location.reload();
    }
    function check() {
      navigator.serviceWorker.getRegistration().then(function (r) { if (r) r.update(); }).catch(function () {});
    }
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController) return; // ilk kurulumda yenileme yok
      pending = true;
      tryReload();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { check(); tryReload(); }
    });
    check();
  })();

  /* ---------- 3) KAYIT KAYBOLURSA UYAR ---------- */
  const KEY = 'nk_seen_total';
  function totalNow() {
    try { return (appState.questions || []).length + (appState.notes || []).length; }
    catch (e) { return null; }
  }
  function remember() {
    const t = totalNow();
    if (t === null) return;
    try { localStorage.setItem(KEY, String(t)); } catch (e) {}
  }

  window.addEventListener('load', function () {
    setTimeout(function () {
      const t = totalNow();
      let seen = 0;
      try { seen = parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) {}

      if (t === 0 && seen > 0) {
        showCustomConfirm(
          'Dikkat: Daha önce kayıtlı ' + seen + ' soru/notun şimdi görünmüyor. ' +
          'Yedek dosyan varsa şimdi seçip geri yükleyebilirsin. Yedek dosyasını seçmek ister misin?',
          function () {
            const inp = document.getElementById('backup-import-input');
            if (inp) inp.click();
          }
        );
        return; // kayıtlar geri gelene kadar sayıyı güncelleme, uyarı tekrar çıksın
      }
      remember();
      setInterval(remember, 8000);
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') remember();
      });
    }, 4000);
  });
})();
