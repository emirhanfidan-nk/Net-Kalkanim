/* Net Kalkanım - Ayarlar sekmesini bölümlere ayırır
   Mevcut satırları (karanlık mod, alan, yedek, bildirim...) silmeden başlıklı gruplara TAŞIR.
   Satırlar taşındığı için düğmeleri ve ayarları aynen çalışmaya devam eder. */
(function () {
  'use strict';

  var CARD = 'bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden';
  var LABEL = 'text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2';
  var TUNE = 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z';

  function $(id) { return document.getElementById(id); }

  // Verilen elemanın, liste içindeki doğrudan çocuğunu (satırı) bulur
  function rowOf(list, el) {
    while (el && el.parentNode !== list) el = el.parentNode;
    return el || null;
  }
  function findRow(list, sel) {
    var inner = list.querySelector(sel);
    return inner ? rowOf(list, inner) : null;
  }

  function section(label, rows) {
    var wrap = document.createElement('div');
    if (label) {
      var l = document.createElement('p');
      l.className = LABEL;
      l.textContent = label;
      wrap.appendChild(l);
    }
    var card = document.createElement('div');
    card.className = CARD;
    rows.forEach(function (r) { if (r) card.appendChild(r); });
    wrap.appendChild(card);
    return { wrap: wrap, card: card };
  }

  function build() {
    var tab = $('profile');
    if (!tab || $('nk-settings-sections')) return true;
    var list = tab.querySelector('.divide-y');
    if (!list) return false;

    var rDark = findRow(list, '#dark-mode-toggle');
    var rHaptic = findRow(list, '#haptics-toggle');
    var rField = findRow(list, '#current-field-display');
    var rCurr = findRow(list, '#current-curriculum-display');
    var rGuide = findRow(list, 'button[onclick*="showOnboarding"]');
    var rStore = findRow(list, '#storage-usage-info');
    var rFile = findRow(list, '#backup-import-input');
    var rAdv = findRow(list, '#advanced-settings-content');
    var rCloud = findRow(list, '#nk-cloud-card');
    var rPush = findRow(list, '#nk-push-card');

    // "Yedekleme" satırı artık dosya yedeği; adı ve açıklaması buna göre
    if (rFile) {
      var ps = rFile.querySelectorAll('p');
      for (var i = 0; i < ps.length; i++) {
        if (ps[i].textContent.trim() === 'Yedekleme') ps[i].textContent = 'Yedek dosyası';
      }
    }

    var root = document.createElement('div');
    root.id = 'nk-settings-sections';
    root.className = 'space-y-5';

    if (rPush) root.appendChild(section('Bildirim', [rPush]).wrap);
    if (rCloud) root.appendChild(section('Yedek', [rCloud]).wrap);
    if (rField || rCurr) root.appendChild(section('Çalışma', [rField, rCurr]).wrap);
    if (rDark || rHaptic) root.appendChild(section('Görünüm', [rDark, rHaptic]).wrap);

    // Gelişmiş: varsayılan kapalı, tek dokunuşla açılır
    var advRows = [rGuide, rFile, rStore, rAdv].filter(Boolean);
    if (advRows.length) {
      var wrap = document.createElement('div');
      var card = document.createElement('div');
      card.className = CARD;

      var head = document.createElement('button');
      head.type = 'button';
      head.id = 'nk-adv-head';
      head.className = 'w-full p-4 flex items-center gap-3 text-left';
      head.innerHTML =
        '<div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">' +
          '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="' + TUNE + '"/></svg>' +
        '</div>' +
        '<span class="flex-1 text-sm font-medium text-slate-700">Gelişmiş</span>' +
        '<svg id="nk-adv-chevron" class="w-4 h-4 fill-current text-slate-400 transition-transform shrink-0" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>';

      var body = document.createElement('div');
      body.id = 'nk-adv-body';
      body.className = 'hidden divide-y divide-slate-100 border-t border-slate-100';
      advRows.forEach(function (r) { body.appendChild(r); });

      head.onclick = function () {
        var open = body.classList.toggle('hidden') === false;
        $('nk-adv-chevron').style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
      };
      card.appendChild(head);
      card.appendChild(body);
      wrap.appendChild(card);
      root.appendChild(wrap);
    }

    // Eski, tek parça listenin yerine yeni bölümleri koy
    list.parentNode.insertBefore(root, list);
    // Başka satırlar kalmışsa (ileride eklenen bir şey) kaybolmasın: "Diğer" altında göster
    if (list.children.length) {
      var rest = section('Diğer', Array.prototype.slice.call(list.children));
      root.insertBefore(rest.wrap, root.firstChild);
    }
    list.remove();
    return true;
  }

  // Bildirim ve yedek kartları başka dosyalar tarafından biraz gecikmeyle eklenir; hazır olana kadar bekle
  var tries = 0;
  function attempt() {
    var ready = $('nk-push-card') && $('nk-cloud-card');
    if (ready || tries >= 30) {
      try { build(); } catch (e) { console.warn('Ayarlar düzeni kurulamadı:', e); }
      return;
    }
    tries++;
    setTimeout(attempt, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attempt);
  else attempt();
})();
