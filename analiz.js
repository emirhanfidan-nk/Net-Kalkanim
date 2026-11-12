/* Net Kalkanım - Deneme "Analiz Edildi" İşareti
   Deneme detayında "Analiz edildi olarak işaretle" düğmesi çıkar; listede de her denemenin
   yanındaki küçük kutucukla içeri girmeden işaretlenebilir. İşaretlenen deneme,
   Denemeler listesinde yeşile bürünür ve üzerinde "Analiz edildi" yazar.
   İşaret ayarlarla birlikte saklanır ve buluta yedeklenir. */
(function () {
  'use strict';

  var CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 6 9 17l-5-5"/></svg>';

  function isDark() { return document.body && document.body.classList.contains('dark-mode'); }

  function findDeneme(id) {
    return (appState.denemeler || []).find(function (d) { return d.id === id; }) || null;
  }

  // Tailwind'in koyu mod kuralları !important kullandığı için bizimki de öyle olmalı
  function imp(node, prop, value) { node.style.setProperty(prop, value, 'important'); }

  function greenSurface(node) {
    imp(node, 'background-color', isDark() ? 'rgba(34,197,94,.14)' : '#ecfdf5');
    imp(node, 'border-color', isDark() ? 'rgba(34,197,94,.5)' : '#86efac');
  }

  /* ---------- Deneme listesi ---------- */
  // Kartın soluna küçük yuvarlak kutucuk: içeri girmeden "analiz edildi" işareti
  function makeBox(d) {
    var on = !!d.analyzed;
    var box = document.createElement('span');
    box.className = 'nk-analiz-box';
    box.setAttribute('role', 'checkbox');
    box.setAttribute('aria-checked', on ? 'true' : 'false');
    box.setAttribute('aria-label', 'Analiz edildi');
    // 40px'lik dokunma alanı, içinde 24px'lik daire
    box.style.cssText = 'flex-shrink:0;width:40px;height:40px;margin:-8px 0 -8px -10px;display:flex;align-items:center;justify-content:center;';
    var dot = document.createElement('span');
    dot.style.cssText = 'width:24px;height:24px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:2px solid;';
    if (on) {
      dot.style.backgroundColor = '#16a34a';
      dot.style.borderColor = '#16a34a';
      dot.style.color = '#fff';
      dot.innerHTML = CHECK.replace('width="14" height="14"', 'width="14" height="14"');
    } else {
      dot.className = 'bg-white border-slate-300';
    }
    box.appendChild(dot);
    box.addEventListener('click', async function (e) {
      e.stopPropagation();   // kartın "denemeyi aç" tıklamasını tetikleme
      e.preventDefault();
      d.analyzed = !d.analyzed;
      try { await saveSettings(); } catch (err) {
        d.analyzed = !d.analyzed;
        showToast('Kaydedilemedi, tekrar dene.', true);
        return;
      }
      try { if (d.analyzed && window.__nkFx) window.__nkFx.burst(dot); } catch (err) {}
      renderDeneme();
    });
    return box;
  }

  function paintList() {
    var root = document.getElementById('deneme-root');
    if (!root) return;
    var cards = root.querySelectorAll('button[onclick^="openDeneme("]');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var m = /openDeneme\((\d+)\)/.exec(card.getAttribute('onclick') || '');
      if (!m) continue;
      var d = findDeneme(parseInt(m[1], 10));
      if (!d) continue;
      if (!card.querySelector('.nk-analiz-box')) card.insertBefore(makeBox(d), card.firstChild);
      if (!d.analyzed) continue;
      greenSurface(card);
      var left = card.querySelector('.min-w-0');
      if (left && !left.querySelector('.nk-analiz-badge')) {
        var badge = document.createElement('p');
        badge.className = 'nk-analiz-badge';
        badge.style.cssText = 'display:flex;align-items:center;gap:4px;margin-top:4px;font-size:10px;font-weight:800;color:' + (isDark() ? '#4ade80' : '#15803d');
        badge.innerHTML = CHECK + '<span>Analiz edildi</span>';
        left.appendChild(badge);
      }
      var net = card.querySelector('.text-teal-600');
      if (net) imp(net, 'color', isDark() ? '#4ade80' : '#15803d');
    }
  }

  /* ---------- Deneme detayı ---------- */
  function paintDetail() {
    var root = document.getElementById('deneme-root');
    if (!root || typeof denemeOpenId === 'undefined' || !denemeOpenId) return;
    var d = findDeneme(denemeOpenId);
    if (!d || root.querySelector('#nk-analiz-toggle')) return;

    var btns = root.querySelectorAll('button');
    var editBtn = null;
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].textContent || '').trim() === 'Düzenle') { editBtn = btns[i]; break; }
    }
    if (!editBtn) return;
    var actionRow = editBtn.parentNode;
    var card = actionRow.parentNode;

    var t = document.createElement('button');
    t.id = 'nk-analiz-toggle';
    t.type = 'button';
    var on = !!d.analyzed;
    t.style.cssText = 'width:100%;margin-top:12px;padding:11px;border-radius:12px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;';
    if (on) {
      t.style.backgroundColor = '#16a34a';
      t.style.color = '#fff';
      t.innerHTML = CHECK + '<span>Analiz edildi (geri almak için dokun)</span>';
    } else {
      t.className = 'bg-slate-100 text-slate-700';
      t.innerHTML = CHECK + '<span>Analiz edildi olarak işaretle</span>';
    }
    t.onclick = async function () {
      d.analyzed = !d.analyzed;
      try { await saveSettings(); } catch (e) { showToast('Kaydedilemedi, tekrar dene.', true); return; }
      if (d.analyzed) {
        try { if (window.__nkFx) window.__nkFx.burst(t); } catch (e) {}
        showToast('Deneme analiz edildi olarak işaretlendi.');
      }
      renderDeneme();
    };
    card.insertBefore(t, actionRow);
    if (on) greenSurface(card);
  }

  /* ---------- Bağlantılar ---------- */
  var origList = window.renderDenemeList;
  if (typeof origList === 'function') {
    window.renderDenemeList = function () {
      var r = origList.apply(this, arguments);
      try { paintList(); } catch (e) { console.warn(e); }
      return r;
    };
  }
  var origDetail = window.renderDenemeDetail;
  if (typeof origDetail === 'function') {
    window.renderDenemeDetail = function () {
      var r = origDetail.apply(this, arguments);
      try { paintDetail(); } catch (e) { console.warn(e); }
      return r;
    };
  }
})();
