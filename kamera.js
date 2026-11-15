/* Net Kalkanım - Uygulama İçi Kamera
   Kamera düğmesine basınca telefonun kamera uygulamasına geçmek yerine, uygulamanın içinde canlı görüntü açılır.
   Böylece uygulama arka plana düşmez, telefon onu hafıza için kapatıp yeniden başlatmaz.
   Çekilen fotoğraf mevcut kırpma ekranına gider. Kamera izni verilmezse galeri düğmesi çalışmaya devam eder. */
(function () {
  'use strict';

  var TARGETS = [
    { id: 'q-image-camera', handler: 'handleImageUpload' },
    { id: 'note-image-camera', handler: 'handleNoteImageUpload' },
    { id: 'note-image-camera-back', handler: 'handleImageUploadBack' }
  ];

  function supported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.File);
  }

  function openCamera(onFile) {
    var stream = null, closed = false;

    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:#000;z-index:2147483200;display:flex;flex-direction:column;touch-action:none';

    var video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.autoplay = true;
    video.style.cssText = 'flex:1;width:100%;min-height:0;object-fit:contain;background:#000';

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;justify-content:center;position:relative;padding:18px 0 calc(22px + env(safe-area-inset-bottom));background:#000';

    var shutter = document.createElement('button');
    shutter.type = 'button';
    shutter.setAttribute('aria-label', 'Fotoğraf çek');
    shutter.style.cssText = 'width:72px;height:72px;border-radius:9999px;background:#fff;border:5px solid rgba(255,255,255,.45);box-shadow:0 0 0 3px #000 inset';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Vazgeç';
    closeBtn.style.cssText = 'position:absolute;left:18px;color:#fff;font-weight:600;font-size:14px;background:transparent;border:none;padding:10px';

    var hint = document.createElement('div');
    hint.textContent = 'Soruyu çerçeveye al ve çek';
    hint.style.cssText = 'position:absolute;top:calc(14px + env(safe-area-inset-top));left:0;right:0;text-align:center;color:#fff;font-size:13px;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.7);pointer-events:none';

    // Flaş (el feneri): destekleyen telefonlarda sağ üstte düğme çıkar
    var flash = document.createElement('button');
    flash.type = 'button';
    flash.setAttribute('aria-label', 'Flaş');
    flash.style.cssText = 'position:absolute;top:calc(8px + env(safe-area-inset-top));right:12px;width:46px;height:46px;border:0;border-radius:9999px;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;z-index:2;color:#fff';
    var BOLT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>';
    var SLASH = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.27 3 2 4.27l5 5V13h3v9l3.58-6.14L17.73 20 19 18.73 3.27 3zM17 10h-4l4-8H7v2.18l8.46 8.46L17 10z"/></svg>';
    var torchOn = false;
    function paintFlash() {
      flash.innerHTML = torchOn ? BOLT : SLASH;
      flash.style.background = torchOn ? '#facc15' : 'rgba(0,0,0,.45)';
      flash.style.color = torchOn ? '#1f1700' : '#fff';
    }
    paintFlash();
    flash.onclick = function () {
      var tr = stream && stream.getVideoTracks()[0];
      if (!tr) return;
      var want = !torchOn;
      tr.applyConstraints({ advanced: [{ torch: want }] }).then(function () { torchOn = want; paintFlash(); })
        .catch(function () { showToast('Bu telefonda flaş açılamadı.', true); });
    };
    ov.appendChild(flash);

    bar.appendChild(closeBtn);
    bar.appendChild(shutter);
    ov.appendChild(video);
    ov.appendChild(bar);
    ov.appendChild(hint);
    document.body.appendChild(ov);

    function stop() {
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    }
    function close() {
      if (closed) return;
      closed = true;
      stop();
      document.removeEventListener('visibilitychange', onHide);
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }
    function onHide() { if (document.visibilityState === 'hidden') close(); }
    document.addEventListener('visibilitychange', onHide);

    closeBtn.onclick = close;

    shutter.onclick = function () {
      if (!video.videoWidth) return;
      var w = video.videoWidth, h = video.videoHeight;
      var sc = Math.min(1, 2000 / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.round(w * sc);
      c.height = Math.round(h * sc);
      c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
      c.toBlob(function (blob) {
        close();
        if (!blob) { showToast('Fotoğraf alınamadı, tekrar dene.', true); return; }
        onFile(new File([blob], 'kamera.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.92);
    };

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1440 } },
      audio: false
    }).then(function (s) {
      if (closed) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s;
      video.srcObject = s;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      // Flaş desteği kamera açıldıktan hemen sonra belli olur
      var tryFlash = function (n) {
        try {
          var tr = s.getVideoTracks()[0];
          var caps = tr && tr.getCapabilities ? tr.getCapabilities() : {};
          if (caps && caps.torch) { flash.style.display = 'flex'; return; }
        } catch (e) {}
        if (n < 5 && !closed) setTimeout(function () { tryFlash(n + 1); }, 300);
      };
      tryFlash(0);
    }).catch(function (err) {
      close();
      var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      showToast(denied
        ? 'Kamera izni verilmedi. Telefon ayarlarından izin verebilir ya da galeriden seçebilirsin.'
        : 'Kamera açılamadı. Galeriden seçebilirsin.', true);
    });
  }

  function wire() {
    TARGETS.forEach(function (t) {
      var input = document.getElementById(t.id);
      if (!input) return;
      input.addEventListener('click', function (ev) {
        if (!supported()) return; // eski telefonlarda eski yöntem çalışsın
        ev.preventDefault();
        openCamera(function (file) {
          // Mevcut yükleme/kırpma akışına, dosya seçilmiş gibi ver
          window[t.handler]({ target: { files: [file], value: '' } });
        });
      }, true);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.__nkCamera = { open: openCamera, supported: supported };
})();
