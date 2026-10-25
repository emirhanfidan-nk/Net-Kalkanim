/* Net Kalkanım - Düzenlemeler
   1) Arşiv filtresi artık kendiliğinden açılmaz, tek dokunuşla temizlenir
   2) Derse alakasız özlü sözler çıkarıldı
   3) Soru çözerken Duolingo tarzı animasyonlar
   4) Seans bitmeden kapatınca "Tekrar Tamamlandı" demez */
(function () {
  'use strict';

  /* ---------- 1) ARŞİV FİLTRESİ ---------- */
  function addClearButton() {
    var box = document.getElementById('arch-filters-container');
    if (!box) return;
    var b = document.getElementById('nk-arch-clear');
    if (!b) {
      b = document.createElement('button');
      b.id = 'nk-arch-clear';
      b.type = 'button';
      b.textContent = 'Filtreyi temizle (hepsini göster)';
      b.className = 'w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 text-xs font-semibold rounded-xl';
      b.onclick = async function () {
        appState.archSelectedCourses = [];
        appState.archSelectedTopics = [];
        await saveSettings();
        populateArchiveFilters();
        renderLibrary();
      };
      box.insertBefore(b, box.firstChild);
    }
    var active = (appState.archSelectedCourses || []).length > 0 || (appState.archSelectedTopics || []).length > 0;
    b.style.display = active ? '' : 'none';
  }

  var origPop = window.populateArchiveFilters;
  if (typeof origPop === 'function') {
    window.populateArchiveFilters = async function () {
      var r = await origPop.apply(this, arguments);
      try { addClearButton(); } catch (e) {}
      return r;
    };
  }

  // Soru/not eklenince filtre kendiliğinden daralmasın
  var origSave = window.saveData;
  if (typeof origSave === 'function') {
    window.saveData = async function () {
      var courseEmpty = (appState.archSelectedCourses || []).length === 0;
      var topicEmpty = (appState.archSelectedTopics || []).length === 0;
      var r = await origSave.apply(this, arguments);
      try {
        if (courseEmpty) appState.archSelectedCourses = [];
        if (topicEmpty) appState.archSelectedTopics = [];
        await saveSettings();
      } catch (e) {}
      return r;
    };
  }

  // Bir kereliğine mevcut filtreyi kapat
  window.addEventListener('load', function () {
    setTimeout(async function () {
      try {
        if (localStorage.getItem('nk_arch_reset_v1')) return;
        localStorage.setItem('nk_arch_reset_v1', '1');
        appState.archSelectedCourses = [];
        appState.archSelectedTopics = [];
        await saveSettings();
        populateArchiveFilters();
        renderLibrary();
      } catch (e) {}
    }, 3000);
  });

  /* ---------- 2) DERSE ALAKASIZ SÖZLERİ ÇIKAR ---------- */
  (function () {
    var BAD = [
      'Antrenmanın her dakikasından nefret ettim', '10 bin tekmeyi', 'Altın madalyalar her gün spor salonunda',
      'Spor yaparken savaştığınız direnç', 'Antrenmanlar acı verebilir', 'Gerçek antrenman, durmak istediğiniz zaman başlar',
      'Spor yapmak kraldır', 'Kaslarınız ve zihniniz birlikte', 'Her antrenman sizi, hayal ettiğiniz kişiye',
      'yeterince hızlı gitmiyorsunuzdur', 'Kan, ter ve saygı', 'Kısa vadede acımasızca dürüst olun',
      'diyen herkese minnettarım', 'birisi bir zamanlar mutlaka cesur bir karar almıştır',
      'Kendine liderlik edemeyen biri', 'Her gün kendini yeniliyorsun', 'Karanlıktan korkan bir çocuğu'
    ];
    try {
      if (typeof MOTIVATION_QUOTES !== 'undefined') {
        for (var i = MOTIVATION_QUOTES.length - 1; i >= 0; i--) {
          var t = (MOTIVATION_QUOTES[i] && MOTIVATION_QUOTES[i].text) || '';
          if (BAD.some(function (b) { return t.indexOf(b) !== -1; })) MOTIVATION_QUOTES.splice(i, 1);
        }
        if (typeof updateMotivationBanner === 'function') updateMotivationBanner();
      }
    } catch (e) {}
  })();

  /* ---------- 3) DUOLINGO TARZI ANİMASYONLAR ---------- */
  (function () {
    var css = document.createElement('style');
    css.textContent =
      '@keyframes nkBounce{0%{transform:scale(1)}30%{transform:scale(1.3)}55%{transform:scale(.93)}100%{transform:scale(1)}}' +
      '@keyframes nkShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}' +
      '.nk-bounce{animation:nkBounce .55s cubic-bezier(.34,1.56,.64,1)!important}' +
      '.nk-shake{animation:nkShake .45s ease-in-out!important}' +
      '#review-choice-input button,#review-recall-input button{border-bottom-width:4px!important;border-bottom-color:rgba(0,0,0,.22)!important;transition:transform .08s,border-bottom-width .08s!important}' +
      '#review-choice-input button:active:not(:disabled),#review-recall-input button:active:not(:disabled){transform:translateY(3px)!important;border-bottom-width:1px!important}';
    document.head.appendChild(css);

    var combo = 0;
    var GOOD = ['Harika!', 'Süper!', 'Tam isabet!', 'Mükemmel!', 'Aferin!', 'Müthiş!'];
    var BADMSG = ['Olsun, tekrar edeceğiz', 'Bir dahaki sefere!', 'Neredeyse!'];

    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

    function pill(ok, text) {
      var host = document.getElementById('review-modal');
      if (!host) return;
      var old = document.getElementById('nk-pill');
      if (old) old.remove();
      var p = document.createElement('div');
      p.id = 'nk-pill';
      p.textContent = text;
      p.style.cssText = 'position:absolute;left:50%;top:84px;transform:translateX(-50%);z-index:70;padding:10px 20px;border-radius:9999px;' +
        'font-weight:800;font-size:14px;color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.25);pointer-events:none;white-space:nowrap;background:' +
        (ok ? '#16a34a' : '#e11d48');
      host.appendChild(p);
      try {
        var a = p.animate([
          { transform: 'translate(-50%,-30px) scale(.8)', opacity: 0 },
          { transform: 'translate(-50%,0) scale(1.08)', opacity: 1, offset: 0.45 },
          { transform: 'translate(-50%,0) scale(1)', opacity: 1, offset: 0.8 },
          { transform: 'translate(-50%,-10px) scale(.95)', opacity: 0 }
        ], { duration: 1600, easing: 'ease-out' });
        a.onfinish = function () { p.remove(); };
      } catch (e) { setTimeout(function () { p.remove(); }, 1600); }
    }

    function burst(el) {
      try {
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var colors = ['#facc15', '#22c55e', '#38bdf8', '#f472b6', '#fb923c'];
        for (var i = 0; i < 14; i++) {
          var d = document.createElement('div');
          var s = 5 + Math.random() * 5;
          d.style.cssText = 'position:fixed;left:' + cx + 'px;top:' + cy + 'px;width:' + s + 'px;height:' + s + 'px;border-radius:9999px;background:' +
            colors[i % colors.length] + ';z-index:2147483100;pointer-events:none';
          document.body.appendChild(d);
          var ang = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 55;
          var an = d.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist - 20) + 'px) scale(.3)', opacity: 0 }
          ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.3,1)' });
          an.onfinish = (function (n) { return function () { n.remove(); }; })(d);
        }
      } catch (e) {}
    }

    function play(el, cls) {
      if (!el) return;
      el.classList.remove('nk-bounce', 'nk-shake');
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(function () { el.classList.remove(cls); }, 700);
    }

    var origSub = window.submitQuestionAnswer;
    if (typeof origSub === 'function') {
      window.submitQuestionAnswer = async function (userAns) {
        var q = currentReviewQueue[currentReviewIndex];
        var today = formatDate(getNowTR());
        var already = !q || q._retry ||
          (isCampMode ? campAnswers[currentReviewIndex] !== undefined : (q.lastReviewedDate === today && !!q.userTodayAnswer));
        var r = await origSub.apply(this, arguments);
        if (already) return r;
        try {
          var given = String(userAns).trim().toUpperCase();
          var right = String(q.answer).trim().toUpperCase();
          var ok = given === right;
          var chosenBtn = document.getElementById('choice-btn-' + given);
          var rightBtn = document.getElementById('choice-btn-' + right);
          if (ok) {
            combo++;
            pill(true, combo >= 3 ? combo + ' üst üste! ' + pick(GOOD) : pick(GOOD));
            var target = rightBtn || document.getElementById('review-frame-box');
            play(rightBtn, 'nk-bounce');
            if (target) burst(target);
          } else {
            combo = 0;
            pill(false, 'Doğru cevap: ' + q.answer + ' · ' + pick(BADMSG));
            play(chosenBtn, 'nk-shake');
            setTimeout(function () { play(rightBtn, 'nk-bounce'); }, 380);
          }
        } catch (e) {}
        return r;
      };
    }

    var origRecall = window.submitRecallStatus;
    if (typeof origRecall === 'function') {
      window.submitRecallStatus = async function (status) {
        var r = await origRecall.apply(this, arguments);
        try {
          var ids = { forgot: 'recall-btn-forgot', partial: 'recall-btn-partial', remembered: 'recall-btn-remembered', veryeasy: 'recall-btn-veryeasy' };
          play(document.getElementById(ids[status]), 'nk-bounce');
        } catch (e) {}
        return r;
      };
    }

    // Oturum kapanınca üst üste sayacı sıfırlansın
    var origCloseForCombo = window.closeReview;
    window.__nkResetCombo = function () { combo = 0; };
    void origCloseForCombo;
  })();

  /* ---------- 4) "TEKRAR TAMAMLANDI" SADECE GERÇEKTEN BİTİNCE ---------- */
  var origClose = window.closeReview;
  if (typeof origClose === 'function') {
    window.closeReview = function () {
      try {
        if (window.__nkResetCombo) window.__nkResetCombo();
        if (!isCampMode && !currentArchiveMode) {
          var q = currentReviewQueue || [];
          var today = formatDate(getNowTR());
          var allDone = q.length > 0 && q.every(function (it) {
            return it._retry || (it.userRecallStatus && it.lastReviewedDate === today);
          });
          if (!allDone) {
            // Eski kod "son karttaysan bitti" sanıyor; bitmediğini ona hissettirme
            var saved = currentReviewIndex;
            currentReviewIndex = -1;
            try { return origClose.apply(this, arguments); }
            finally { currentReviewIndex = saved; }
          }
        }
      } catch (e) {}
      return origClose.apply(this, arguments);
    };
  }
})();
