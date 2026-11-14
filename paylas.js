/* Net Kalkanım - Gemini'den paylaş / yapıştır ile ekleme
   1) Android'de Gemini'nin "Paylaş" menüsünden Net Kalkanım seçilince (manifest share_target + sw.js),
      gelen metin ve görsel soru/kart ekleme ekranına doldurulur.
   2) Aynı iş "Gemini ile ekle" düğmesiyle (metni yapıştırarak) elle de yapılabilir.
   Format (Gemini'ye komut olarak verilir):
     TÜR: SORU | KART
     DERS: ...   KONU: ...
     SORU türü: CEVAP: A-E   NOT: ...
     KART türü: ÖN: ...      ARKA: ...                                                            */
(function () {
  'use strict';

  /* ---------- Yardımcılar ---------- */
  function norm(s) {
    return String(s || '').toLocaleLowerCase('tr-TR')
      .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g').replace(/[üÜ]/g, 'u')
      .replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function clean(s) {
    return String(s || '').replace(/\*\*/g, '').replace(/`/g, '').replace(/^#+\s*/gm, '').trim();
  }
  function $(id) { return document.getElementById(id); }
  function toast(m, err) { try { showToast(m, !!err); } catch (e) {} }

  /* ---------- Ayrıştırma ---------- */
  var KEY_RE = /^\s*[*_#>\-\s]*(TÜR|TUR|DERS|KONU|CEVAP|NOT|ÖN|ON|ARKA|SORU|ŞIKLAR|SIKLAR|SIK|BAŞLIK|BASLIK|FORMÜL|FORMUL)(?:\s*YÜZ|\s*YUZ)?\s*[*_]*\s*[:：]\s*(.*)$/i;

  function parse(text) {
    var out = { type: '', ders: '', konu: '', cevap: '', not: '', on: '', arka: '', soru: '', baslik: '', formul: '', raw: String(text || '') };
    var cur = null, any = false;
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var m = line.match(KEY_RE);
      if (m) {
        var k = m[1].toLocaleUpperCase('tr-TR').replace('Ö', 'O').replace('Ü', 'U').replace('Ş', 'S');
        var map = { TUR: 'type', DERS: 'ders', KONU: 'konu', CEVAP: 'cevap', NOT: 'not', ON: 'on', ARKA: 'arka', SORU: 'soru', SIKLAR: 'siklar', SIK: 'siklar', BASLIK: 'baslik', FORMUL: 'formul' };
        cur = map[k];
        if (cur && cur !== 'siklar') { out[cur] = m[2]; any = true; } else cur = cur === 'siklar' ? '_' : null;
      } else if (cur && cur !== '_' && line.trim()) {
        out[cur] += (out[cur] ? '\n' : '') + line;
      }
    });
    ['type', 'ders', 'konu', 'cevap', 'not', 'on', 'arka', 'soru', 'baslik', 'formul'].forEach(function (k) { out[k] = clean(out[k]); });
    out.any = any;
    var t = norm(out.type);
    if (t.indexOf('formul') >= 0 || out.formul) out.kind = 'formula';
    else if (t.indexOf('kart') >= 0) out.kind = 'card';
    else if (t.indexOf('soru') >= 0) out.kind = 'question';
    else if (out.on || out.arka) out.kind = 'card';
    else out.kind = 'question';
    return out;
  }

  /* ---------- Ders / konu eşleştirme ---------- */
  function bestMatch(list, wanted) {
    var w = norm(wanted);
    if (!w) return '';
    var i, n;
    for (i = 0; i < list.length; i++) if (norm(list[i]) === w) return list[i];
    for (i = 0; i < list.length; i++) { n = norm(list[i]); if (n && (n.indexOf(w) >= 0 || w.indexOf(n) >= 0)) return list[i]; }
    return '';
  }
  function setCourse(c) {
    $('q-course').value = c;
    $('btn-pick-course-text').innerText = c;
    $('q-topic').value = '';
    $('btn-pick-topic-text').innerText = 'Konu Seç';
  }
  function setTopic(t) {
    $('q-topic').value = t;
    $('btn-pick-topic-text').innerText = t;
  }

  /* ---------- Forma doldurma ---------- */
  function setFile(blob) {
    try {
      var inp = $('q-image-gallery');
      var f = new File([blob], 'paylasilan.jpg', { type: blob.type || 'image/jpeg' });
      var dt = new DataTransfer();
      dt.items.add(f);
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (e) { console.warn('Görsel eklenemedi', e); return false; }
  }

  function fill(p, image) {
    if (p.kind === 'formula') {
      if (window.__nkFormul) { window.__nkFormul.open(); window.__nkFormul.addFromParsed(p); }
      return;
    }
    switchTab('add');
    var notes = [];
    setEntryType(p.kind === 'card' ? 'note' : 'question');

    if (p.kind === 'card') {
      setNoteInputType('text');
      $('q-note').value = p.on || p.soru || '';
      $('q-note-back').value = p.arka || p.not || '';
    } else {
      setQuestionInputType('image');
      setNoteInputType('text');
      $('q-note').value = p.not || (p.any ? '' : p.raw.trim());
      var c = (p.cevap || '').trim().toUpperCase().replace(/[^A-E]/g, '');
      var onlyLetter = /^[A-E][\)\.]?$/i.test(p.cevap.trim()) || (c.length === 1 && p.cevap.trim().length <= 3);
      if (onlyLetter && c.length === 1) { setAnsType('choice'); selectChoice(c); }
      else if (p.cevap) { setAnsType('text'); $('q-text-answer').value = p.cevap; }
    }

    // Ders ve konu: listede varsa seç, yoksa boş bırak
    var courses = Object.keys(appState.categories || {});
    var course = bestMatch(courses, p.ders);
    if (course) {
      setCourse(course);
      var topic = bestMatch(appState.categories[course] || [], p.konu);
      if (topic) setTopic(topic);
      else { notes.push('konuyu seç'); setTimeout(function () { try { openPicker('topic'); } catch (e) {} }, 350); }
    } else {
      notes.push('ders ve konuyu seç');
    }

    if (image && p.kind !== 'card') { if (setFile(image)) notes.push('görsel eklendi'); }
    else if (p.kind !== 'card') notes.push('fotoğrafı ekle');

    toast('Gemini kaydı hazır' + (notes.length ? ': ' + notes.join(', ') : '. Kontrol edip kaydet.'));
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  /* ---------- Gemini komutu ---------- */
  function buildPrompt() {
    var cats = (appState && appState.categories) || {};
    var lines = Object.keys(cats).map(function (c) { return c + ': ' + (cats[c] || []).join(' | '); });
    return 'Bu sohbette benimle normal konuşmaya devam et: sorularımı çöz, anlamadığım yerleri anlat. Sadece ben "soru hazırla", "not hazırla" ya da "formül hazırla" dediğimde o ana kadarki konuşmadan Net Kalkanım uygulaması için bir kayıt hazırla. O zaman SADECE ilgili formatı yaz, başka açıklama, ** veya markdown kullanma.\n\n' +
      'Ben "soru hazırla" dersem:\nTÜR: SORU\nDERS: (aşağıdaki listeden)\nKONU: (aşağıdaki listeden)\nCEVAP: (doğru şık harfi, A-E)\nNOT: (anlamadığım yerin kısa notu, en fazla 3-4 cümle)\n\n' +
      'Ben "not hazırla" dersem:\nTÜR: KART\nDERS: (aşağıdaki listeden)\nKONU: (aşağıdaki listeden)\nÖN: (kısa soru veya başlık)\nARKA: (kısa bilgi)\n\n' +
      'Ben "formül hazırla" dersem:\nTÜR: FORMÜL\nDERS: (aşağıdaki listeden)\nBAŞLIK: (formülün kısa adı)\nFORMÜL: (her formülü ayrı satıra ve LaTeX olarak $ işaretleri arasına yaz, ör. $F = m \\cdot a$ ; istersen satırın başına kısa etiket koy, ör. Düz tel: $B = \\frac{2ki}{d}$)\n\n' +
      'DERS ve KONU sadece şu listeden seçilmeli, aynen yazılmalı:\n' + lines.join('\n') + '\n\nŞimdi sadece "Hazır" de.';
  }

  function copy(text) {
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
        return true;
      } catch (e) { return false; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  /* ---------- Yapıştırma penceresi ---------- */
  function openSheet() {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;padding:12px';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:24px;padding:18px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto';
    var step = function (n, t) {
      return '<div style="display:flex;gap:10px;align-items:flex-start;margin-top:9px"><div style="flex-shrink:0;width:22px;height:22px;border-radius:9999px;background:#0d9488;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center">' + n + '</div><div style="font-size:12.5px;line-height:1.45;color:#334155">' + t + '</div></div>';
    };
    box.innerHTML =
      '<div style="font-weight:800;font-size:16px;color:#0f172a">Gemini ile ekle</div>' +
      '<p style="font-size:12px;color:#64748b;margin:6px 0 4px;line-height:1.5">Gemini\'de çözdüğün soruyu, notu ya da formülü uygulamaya kolayca aktar.</p>' +
      step(1, 'Aşağıdaki <b>Komutu kopyala</b> düğmesine bas.') +
      step(2, 'Gemini\'de <b>yeni bir sohbet</b> aç, komutu yapıştırıp gönder. (Her yeni sohbetin başında bir kez.)') +
      step(3, 'Sorunu normal şekilde sor, anlamadığın yerleri konuş.') +
      step(4, 'İşin bitince Gemini\'ye şunlardan birini yaz: <b>soru hazırla</b> (soru kaydı), <b>not hazırla</b> (kart) ya da <b>formül hazırla</b> (formül).') +
      step(5, 'Gemini\'nin yazdığı cevabı kopyala, aşağıdaki kutuya yapıştır, <b>Forma aktar</b>\'a bas.') +
      '<button id="nk-gm-copy" type="button" style="width:100%;margin-top:14px;padding:12px;border-radius:12px;font-weight:800;font-size:12.5px;background:#0d9488;color:#fff;border:none;box-shadow:0 3px 0 #0f766e">Komutu kopyala</button>' +
      '<textarea id="nk-gm-text" placeholder="Gemini\'nin cevabını buraya yapıştır..." style="width:100%;height:110px;border:1px solid #cbd5e1;border-radius:12px;padding:10px;font-size:12px;color:#1e293b;background:#fff;margin-top:12px"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button id="nk-gm-go" type="button" style="flex:1;padding:12px;border-radius:12px;font-weight:700;font-size:13px;background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4">Forma aktar</button>' +
        '<button id="nk-gm-x" type="button" style="padding:12px 16px;border-radius:12px;font-weight:600;font-size:13px;background:#f1f5f9;color:#475569;border:none">Kapat</button>' +
      '</div>';
    ov.appendChild(box);
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    box.querySelector('#nk-gm-x').onclick = function () { ov.remove(); };
    box.querySelector('#nk-gm-go').onclick = function () {
      var t = box.querySelector('#nk-gm-text').value;
      if (!t.trim()) { toast('Önce Gemini cevabını yapıştır!', true); return; }
      ov.remove();
      fill(parse(t), null);
    };
    box.querySelector('#nk-gm-copy').onclick = function () {
      copy(buildPrompt()).then(function (ok) { toast(ok ? 'Komut kopyalandı. Gemini\'ye yapıştır.' : 'Kopyalanamadı', !ok); });
    };
  }

  function ensureButton() {
    var add = $('add');
    if (!add || $('nk-gm-btn')) return;
    var b = document.createElement('button');
    b.id = 'nk-gm-btn';
    b.type = 'button';
    b.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;border-radius:16px;font-weight:700;font-size:12px;' +
      'color:#0f766e;background:#f0fdfa;border:1px solid #99f6e4';
    b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>Gemini ile ekle';
    b.onclick = openSheet;
    var banner = $('add-deneme-banner');
    if (banner && banner.nextSibling) add.insertBefore(b, banner.nextSibling); else add.insertBefore(b, add.firstChild);
  }

  /* ---------- Android paylaşımı (sw.js'in sakladığı veri) ---------- */
  function takeShared() {
    if (!('caches' in window)) return Promise.resolve(null);
    return caches.open('nk-share').then(function (c) {
      return c.match('/__share/data').then(function (r) {
        if (!r) return null;
        return r.json().then(function (d) {
          return c.match('/__share/image').then(function (ir) {
            return (ir ? ir.blob() : Promise.resolve(null)).then(function (blob) {
              return Promise.all([c.delete('/__share/data'), c.delete('/__share/image')]).then(function () { return { d: d, img: blob }; });
            });
          });
        });
      });
    }).catch(function () { return null; });
  }

  function ready() {
    var ls = $('login-screen');
    var loginGone = !ls || ls.style.display === 'none' || ls.classList.contains('hidden');
    return typeof appState !== 'undefined' && appState && appState.field && loginGone && appState.hasSeenOnboarding;
  }

  function handleShare() {
    var tries = 0;
    (function wait() {
      if (ready()) {
        takeShared().then(function (s) {
          if (!s) return;
          var text = (s.d && (s.d.text || s.d.title)) || '';
          fill(parse(text), s.img && s.img.size ? s.img : null);
        });
        return;
      }
      if (++tries < 75) setTimeout(wait, 400);
    })();
  }

  function start() {
    ensureButton();
    var sw = window.switchTab;
    if (typeof sw === 'function') {
      window.switchTab = function (id) { var r = sw.apply(this, arguments); if (id === 'add') ensureButton(); return r; };
    }
    if (/[?&]shared=1/.test(location.search)) {
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      handleShare();
    }
  }

  window.__nkPaylas = { parse: parse, fill: fill, buildPrompt: buildPrompt, openSheet: openSheet };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
