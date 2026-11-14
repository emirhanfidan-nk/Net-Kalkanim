/* Net Kalkanım - "Yenilikler" tanıtımı
   Büyük bir güncelleme geldiğinde kullanıcıya bir kez, kaydırmalı kısa bir tanıtım gösterir.
   Yeni sürümde tanıtımı yeniden göstermek için VERSION değerini ve SLIDES listesini güncelle. */
(function () {
  'use strict';

  var VERSION = '2026-11-14b';
  var LS = 'nk_whatsnew_seen';
  var iOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  var SLIDES = [
    { c: '#fb923c,#ef4444', icon: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
      title: 'Seri, XP ve Seviyeler', text: 'Her gün tekrar yap, serini ve XP\'ni büyüt. Bir günü kaçırırsan Seri Kalkanı serini kurtarır. Rozetler kazan, seviye atla.' },
    { c: '#14b8a6,#059669', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      title: 'Yeni Profil', text: 'Adını yazdın mı uygulama sana adınla seslenir. Seviyeni, XP\'ni ve rozetlerini profilinde gör. Profil ekranından adını ve avatarını değiştirebilirsin.' },
    { c: '#a78bfa,#7c3aed', icon: 'M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z',
      title: 'Gemini ile Ekle', text: 'Ekle sekmesindeki "Gemini ile ekle" düğmesine bas, komutu kopyala ve Gemini\'ye yapıştır. Sorunu çözdürüp "soru hazırla" ya da "not hazırla" de, cevabı buraya yapıştır; ders, konu ve not hazır gelir.' + (iOS ? '' : ' Android\'de Gemini\'nin Paylaş menüsünden de gönderebilirsin.') },
    { c: '#60a5fa,#2563eb', icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
      title: 'Notlarda Kalem', text: 'Not tekrarında da artık kalemle yazıp çizebilirsin. Kaydır, kalem, silgi ve geri al düğmeleri tekrar ekranının altında.' },
    { c: '#f59e0b,#d97706', icon: 'M5 4v3h5.5v12h3V7H19V4z',
      title: 'Formüller', text: 'Arşiv sekmesinde yeni "Formüller" bölümü var. Formülleri derse göre gör, arama yap, yıldızla. Tekrar kutularına karışmaz, sadece bakılacak yer. Kendi formülünü de ekleyebilirsin.' },
    { c: '#4ade80,#16a34a', icon: 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
      title: 'Denemelerin de Yedekte', text: 'Soruların, notların, denemelerin, serin ve XP\'ni artık hepsi bulut yedeğe giriyor. Uygulamayı silsen bile kurtarma koduyla geri gelir.' }
  ];

  function seen() { try { return localStorage.getItem(LS) === VERSION; } catch (e) { return false; } }
  function mark() { try { localStorage.setItem(LS, VERSION); } catch (e) {} }

  function css() {
    if (document.getElementById('nk-wn-css')) return;
    var s = document.createElement('style');
    s.id = 'nk-wn-css';
    s.textContent =
      '@keyframes nkWnIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
      '@keyframes nkWnPop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}' +
      '.nk-wn{position:fixed;inset:0;z-index:2147483100;background:rgba(15,23,42,.92);display:flex;align-items:center;justify-content:center;padding:20px;font-family:"Sora","Plus Jakarta Sans",sans-serif}' +
      '.nk-wn-box{width:100%;max-width:360px;background:#fff;border-radius:28px;padding:28px 22px 20px;text-align:center;animation:nkWnIn .3s ease-out}' +
      '.nk-wn-ic{width:84px;height:84px;margin:0 auto 18px;border-radius:26px;display:flex;align-items:center;justify-content:center;color:#fff;animation:nkWnPop .45s cubic-bezier(.34,1.56,.64,1)}' +
      '.nk-wn-t{font-size:20px;font-weight:800;color:#0f172a}' +
      '.nk-wn-p{margin-top:10px;font-size:13px;line-height:1.55;color:#475569;font-weight:500;min-height:96px}' +
      '.nk-wn-dots{display:flex;justify-content:center;gap:6px;margin:14px 0}' +
      '.nk-wn-dots i{width:7px;height:7px;border-radius:9999px;background:#e2e8f0;transition:all .2s}' +
      '.nk-wn-dots i.on{width:20px;background:#0d9488}' +
      '.nk-wn-btn{width:100%;padding:14px;border:0;border-radius:16px;background:#0d9488;color:#fff;font-size:14px;font-weight:800;font-family:inherit;box-shadow:0 4px 0 #0f766e}' +
      '.nk-wn-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #0f766e}' +
      '.nk-wn-tag{display:inline-block;margin-bottom:12px;padding:4px 10px;border-radius:9999px;background:#ccfbf1;color:#0f766e;font-size:11px;font-weight:800}' +
      '@media (prefers-reduced-motion:reduce){.nk-wn-box,.nk-wn-ic{animation:none}}';
    document.head.appendChild(s);
  }

  function show() {
    if (document.querySelector('.nk-wn')) return;
    css();
    var i = 0;
    var ov = document.createElement('div');
    ov.className = 'nk-wn';
    var box = document.createElement('div');
    box.className = 'nk-wn-box';
    ov.appendChild(box);
    document.body.appendChild(ov);

    function paint() {
      var s = SLIDES[i], g = s.c.split(',');
      var last = i === SLIDES.length - 1;
      box.innerHTML =
        '<div class="nk-wn-tag">Yenilikler ' + (i + 1) + ' / ' + SLIDES.length + '</div>' +
        '<div class="nk-wn-ic" style="background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')"><svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor"><path d="' + s.icon + '"/></svg></div>' +
        '<div class="nk-wn-t"></div><p class="nk-wn-p"></p>' +
        '<div class="nk-wn-dots">' + SLIDES.map(function (_, k) { return '<i' + (k === i ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
        '<button type="button" class="nk-wn-btn">' + (last ? 'Hadi Başlayalım' : 'Devam') + '</button>';
      box.querySelector('.nk-wn-t').textContent = s.title;
      box.querySelector('.nk-wn-p').textContent = s.text;
      box.querySelector('.nk-wn-btn').onclick = function () {
        if (last) { mark(); ov.remove(); } else { i++; paint(); }
      };
    }
    paint();
  }

  function ready() {
    var ls = document.getElementById('login-screen');
    var loginGone = !ls || ls.style.display === 'none' || ls.classList.contains('hidden');
    var onb = document.getElementById('onboarding-modal');
    var onbOpen = onb && !onb.classList.contains('hidden');
    var rev = document.getElementById('review-modal');
    var revOpen = rev && !rev.classList.contains('hidden');
    return typeof appState !== 'undefined' && appState && appState.field && appState.hasSeenOnboarding &&
      loginGone && !onbOpen && !revOpen && !document.querySelector('.nk-o-ov');
  }

  function start() {
    if (seen()) return;
    // Yeni kullanıcı rehberi bitirince bu tanıtıma ihtiyaç duymaz (rehber zaten aynı özellikleri anlatıyor).
    var fo = window.finishOnboarding;
    if (typeof fo === 'function') {
      window.finishOnboarding = function () { mark(); return fo.apply(this, arguments); };
    }
    var quiet = 0, tries = 0;
    (function wait() {
      if (seen()) return;
      if (ready()) quiet++; else quiet = 0;
      if (quiet >= 3) { show(); return; }   // ~1,5 sn boyunca başka pencere yoksa göster
      if (++tries < 240) setTimeout(wait, 500);
    })();
  }

  window.__nkYenilikler = { show: show, version: VERSION };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
