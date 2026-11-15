/* Net Kalkanım - Tam ekran kırpma
   Soru ve not-cevap fotoğrafları için: köşe tutamaçlı, sürüklenebilir çerçeve, döndür ve sıfırla.
   Kendi kırpıcısıdır, internet engeline takılan harici kütüphaneye bağlı değildir.
   Eski Cropper.js ile aynı arayüzü sunar (getCroppedCanvas, destroy, rotate, reset), bu yüzden kaydetme akışı değişmez.
   Hocaya sor ekranındaki kırpma kendi kütüphanesiyle devam eder. */
(function () {
  'use strict';

  var Orig = window.Cropper;
  var IDS = { 'image-to-crop': 'front', 'note-back-image-to-crop': 'back', 'nk-ask-crop': 'ask' };
  var Z = 2147483300;

  function el(tag, css, parent) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (parent) parent.appendChild(e);
    return e;
  }

  var ICON_X = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  var ICON_OK = '<svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
  var ICON_UNDO = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62A7.96 7.96 0 0 1 12.5 10c3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 10.91 17.15 8 12.5 8z"/></svg>';
  var ICON_ROT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M15.55 5.55 11 1v3.07a8 8 0 0 0 0 15.86v-2.02a6 6 0 0 1 0-11.82V10l4.55-4.45zM19.93 11a7.9 7.9 0 0 0-1.62-3.89l-1.42 1.42A5.9 5.9 0 0 1 17.91 11h2.02zM13 17.9v2.02a7.9 7.9 0 0 0 3.89-1.61l-1.44-1.44A5.9 5.9 0 0 1 13 17.9zm3.89-2.42 1.42 1.42A7.9 7.9 0 0 0 19.93 13h-2.02a5.9 5.9 0 0 1-1.02 2.48z"/></svg>';

  function NkCrop(img) {
    this.img = img;
    this.kind = IDS[img.id];
    this.rot = 0;
    this.dead = false;
    this._build();
    this._base();
    this._initFrame();
    this._layout();
    var self = this;
    this._onResize = function () { self._layout(); };
    window.addEventListener('resize', this._onResize);
  }

  NkCrop.prototype._build = function () {
    var self = this;
    var ov = this.ov = el('div', 'position:fixed;inset:0;z-index:' + Z + ';background:#000;display:flex;flex-direction:column;touch-action:none;user-select:none;-webkit-user-select:none;font-family:inherit');
    var top = el('div', 'height:calc(56px + env(safe-area-inset-top,0px));flex:none;display:flex;align-items:flex-end;padding:0 12px 6px;padding-top:env(safe-area-inset-top,0px)', ov);
    var x = el('button', 'width:44px;height:44px;border:0;border-radius:9999px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center', top);
    x.type = 'button'; x.innerHTML = ICON_X;
    x.onclick = function () { self._cancel(); };
    var ttl = el('div', 'flex:1;text-align:center;color:#fff;font-weight:700;font-size:14px;padding-bottom:12px;margin-right:44px', top);
    ttl.textContent = 'Fotoğrafı kırp';

    var stage = this.stage = el('div', 'position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none', ov);
    this.cv = el('canvas', 'position:absolute;display:block;pointer-events:none', stage);

    var f = this.frame = el('div', 'position:absolute;box-shadow:0 0 0 9999px rgba(0,0,0,.62);pointer-events:none;outline:1px solid rgba(255,255,255,.55)', stage);
    // üçte bir çizgileri
    [33.33, 66.66].forEach(function (p) {
      el('div', 'position:absolute;left:' + p + '%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.28)', f);
      el('div', 'position:absolute;top:' + p + '%;left:0;right:0;height:1px;background:rgba(255,255,255,.28)', f);
    });
    // köşe parantezleri
    var L = '28px', B = '4px solid #fff';
    var corners = [
      'left:-3px;top:-3px;border-left:' + B + ';border-top:' + B + ';border-top-left-radius:4px',
      'right:-3px;top:-3px;border-right:' + B + ';border-top:' + B + ';border-top-right-radius:4px',
      'left:-3px;bottom:-3px;border-left:' + B + ';border-bottom:' + B + ';border-bottom-left-radius:4px',
      'right:-3px;bottom:-3px;border-right:' + B + ';border-bottom:' + B + ';border-bottom-right-radius:4px'
    ];
    corners.forEach(function (c) { el('div', 'position:absolute;width:' + L + ';height:' + L + ';' + c, f); });
    // kenar ortası tutamaçlar
    var E = 'position:absolute;background:#fff;border-radius:3px;';
    el('div', E + 'left:50%;top:-3px;width:30px;height:4px;margin-left:-15px', f);
    el('div', E + 'left:50%;bottom:-3px;width:30px;height:4px;margin-left:-15px', f);
    el('div', E + 'top:50%;left:-3px;height:30px;width:4px;margin-top:-15px', f);
    el('div', E + 'top:50%;right:-3px;height:30px;width:4px;margin-top:-15px', f);

    var hint = el('div', 'flex:none;text-align:center;color:rgba(255,255,255,.7);font-size:13px;font-weight:700;padding:10px 12px 2px', ov);
    hint.textContent = 'Soruyu çerçeve içine al';
    var bar = el('div', 'flex:none;display:flex;align-items:center;justify-content:space-between;padding:10px 28px calc(18px + env(safe-area-inset-bottom,0px))', ov);
    var undo = el('button', 'width:46px;height:46px;border:0;border-radius:9999px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center', bar);
    undo.type = 'button'; undo.innerHTML = ICON_UNDO; undo.setAttribute('aria-label', 'Sıfırla');
    undo.onclick = function () { self.reset(); };
    var ok = el('button', 'width:74px;height:74px;border:0;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--t1,#f97316),var(--t2,#ea580c));box-shadow:0 8px 22px -6px rgba(0,0,0,.6)', bar);
    ok.type = 'button'; ok.innerHTML = ICON_OK; ok.setAttribute('aria-label', 'Onayla');
    ok.onclick = function () {
      if (self.busy) return;
      self.busy = true;
      try {
        if (self.kind === 'back') window.finishCropBack();
        else if (self.kind === 'ask') { window.__nkAskCrop.ok(); setTimeout(function () { self.busy = false; }, 600); }
        else window.finishCrop();
      } catch (e) { console.warn(e); self.busy = false; }
    };
    var rot = el('button', 'width:46px;height:46px;border:0;border-radius:9999px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center', bar);
    rot.type = 'button'; rot.innerHTML = ICON_ROT; rot.setAttribute('aria-label', 'Döndür');
    rot.onclick = function () { self.rotate(90); };

    // sürükleme
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      var sr = stage.getBoundingClientRect();
      var px = e.clientX - sr.left, py = e.clientY - sr.top;
      var r = self._rectPx();
      var T = 34;
      var nl = Math.abs(px - r.l) < T, nr = Math.abs(px - r.r) < T, nt = Math.abs(py - r.t) < T, nb = Math.abs(py - r.b) < T;
      var inX = px > r.l - T && px < r.r + T, inY = py > r.t - T && py < r.b + T;
      var mode = null;
      if (nl && nt) mode = 'nw'; else if (nr && nt) mode = 'ne'; else if (nl && nb) mode = 'sw'; else if (nr && nb) mode = 'se';
      else if (nl && inY) mode = 'w'; else if (nr && inY) mode = 'e'; else if (nt && inX) mode = 'n'; else if (nb && inX) mode = 's';
      else if (px > r.l && px < r.r && py > r.t && py < r.b) mode = 'move';
      if (!mode) return;
      drag = { mode: mode, x: e.clientX, y: e.clientY, r: { x: self.r.x, y: self.r.y, w: self.r.w, h: self.r.h } };
      try { stage.setPointerCapture(e.pointerId); } catch (er) {}
      e.preventDefault();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = (e.clientX - drag.x) / self.s, dy = (e.clientY - drag.y) / self.s;
      self._drag(drag, dx, dy);
      e.preventDefault();
    });
    var end = function () { drag = null; };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);

    document.body.appendChild(ov);
  };

  NkCrop.prototype._base = function () {
    var img = this.img, w = img.naturalWidth, h = img.naturalHeight;
    var odd = this.rot % 2 === 1;
    var bc = this.bc = document.createElement('canvas');
    bc.width = odd ? h : w; bc.height = odd ? w : h;
    var ctx = bc.getContext('2d');
    ctx.translate(bc.width / 2, bc.height / 2);
    ctx.rotate(this.rot * Math.PI / 2);
    ctx.drawImage(img, -w / 2, -h / 2);
    this.cv.width = bc.width; this.cv.height = bc.height;
    this.cv.getContext('2d').drawImage(bc, 0, 0);
  };

  NkCrop.prototype._initFrame = function () {
    var W = this.bc.width, H = this.bc.height, m = 0.06;
    this.r = { x: W * m, y: H * m, w: W * (1 - 2 * m), h: H * (1 - 2 * m) };
  };

  NkCrop.prototype._layout = function () {
    var sr = this.stage.getBoundingClientRect();
    var pad = 14;
    var aw = Math.max(50, sr.width - pad * 2), ah = Math.max(50, sr.height - pad * 2);
    var s = Math.min(aw / this.bc.width, ah / this.bc.height);
    this.s = s;
    var dw = this.bc.width * s, dh = this.bc.height * s;
    this.ox = (sr.width - dw) / 2; this.oy = (sr.height - dh) / 2;
    var c = this.cv.style;
    c.left = this.ox + 'px'; c.top = this.oy + 'px'; c.width = dw + 'px'; c.height = dh + 'px';
    this._paint();
  };

  NkCrop.prototype._rectPx = function () {
    var r = this.r, s = this.s;
    var l = this.ox + r.x * s, t = this.oy + r.y * s;
    return { l: l, t: t, r: l + r.w * s, b: t + r.h * s };
  };

  NkCrop.prototype._paint = function () {
    var p = this._rectPx(), f = this.frame.style;
    f.left = p.l + 'px'; f.top = p.t + 'px'; f.width = (p.r - p.l) + 'px'; f.height = (p.b - p.t) + 'px';
  };

  NkCrop.prototype._drag = function (d, dx, dy) {
    var W = this.bc.width, H = this.bc.height, o = d.r;
    var min = 48 / this.s;
    var x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
    var m = d.mode;
    if (m === 'move') {
      var nx = Math.max(0, Math.min(W - o.w, o.x + dx)), ny = Math.max(0, Math.min(H - o.h, o.y + dy));
      this.r.x = nx; this.r.y = ny;
      this._paint();
      return;
    }
    if (m.indexOf('w') >= 0) x1 = Math.max(0, Math.min(x2 - min, o.x + dx));
    if (m.indexOf('e') >= 0) x2 = Math.min(W, Math.max(x1 + min, o.x + o.w + dx));
    if (m.indexOf('n') >= 0) y1 = Math.max(0, Math.min(y2 - min, o.y + dy));
    if (m.indexOf('s') >= 0) y2 = Math.min(H, Math.max(y1 + min, o.y + o.h + dy));
    this.r = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    this._paint();
  };

  NkCrop.prototype.rotate = function (deg) {
    this.rot = ((this.rot + Math.round(deg / 90)) % 4 + 4) % 4;
    this._base(); this._initFrame(); this._layout();
  };
  NkCrop.prototype.reset = function () {
    this.rot = 0;
    this._base(); this._initFrame(); this._layout();
  };

  NkCrop.prototype.getCroppedCanvas = function (o) {
    o = o || {};
    var r = this.r;
    var sc = Math.min(1, (o.maxWidth || 1e9) / r.w, (o.maxHeight || 1e9) / r.h);
    var out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(r.w * sc)); out.height = Math.max(1, Math.round(r.h * sc));
    var ctx = out.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(this.bc, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);
    return out;
  };

  NkCrop.prototype.destroy = function () {
    if (this.dead) return;
    this.dead = true;
    window.removeEventListener('resize', this._onResize);
    if (this.ov && this.ov.parentNode) this.ov.parentNode.removeChild(this.ov);
    this.bc = null;
  };

  // Vazgeç: düzenleyiciyi kapat, ilk haline dön
  NkCrop.prototype._cancel = function () {
    var kind = this.kind;
    this.destroy();
    try {
      if (kind === 'ask') {
        if (window.__nkAskCrop && window.__nkAskCrop.cancel) window.__nkAskCrop.cancel();
      } else if (kind === 'back') {
        if (typeof clearBackImage === 'function') clearBackImage();
      } else {
        try { cropperInstance = null; } catch (e) {}
        var ed = document.getElementById('editor-area'); if (ed) ed.classList.add('hidden');
        var ph = document.getElementById('upload-placeholder'); if (ph) ph.classList.remove('hidden');
        ['q-image-gallery', 'q-image-camera'].forEach(function (id) { var i = document.getElementById(id); if (i) i.value = ''; });
      }
    } catch (e) { console.warn(e); }
  };

  function Cropper(target, opts) {
    if (target && IDS[target.id] && target.naturalWidth) return new NkCrop(target);
    if (Orig) return new Orig(target, opts);
    throw new Error('Kırpıcı yok');
  }
  if (Orig) { for (var k in Orig) { try { Cropper[k] = Orig[k]; } catch (e) {} } Cropper.prototype = Orig.prototype; }
  window.Cropper = Cropper;
})();
