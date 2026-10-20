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
        cropperInstance = new Cropper(image, { viewMode: 1, autoCropArea: 1 });
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
        cropperInstanceBack = new Cropper(image, { viewMode: 1, autoCropArea: 1 });
      };
      image.src = lastBackCropUrl;
    } catch (err) {
      console.error(err);
      showToast('Fotoğraf açılamadı. Tekrar dene.', true);
    } finally {
      input.value = '';
    }
  };

  /* ---------- 4) DİĞER MODÜLLER (Bulut yedek + Profil) ---------- */
  ['yedek.js', 'profil.js'].forEach(function (src) {
    try {
      const s = document.createElement('script');
      s.src = src;
      document.head.appendChild(s);
    } catch (e) { console.warn('Modül yüklenemedi:', src, e); }
  });

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
