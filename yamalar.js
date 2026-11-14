/* Net Kalkanım - tek seferlik veri düzeltmeleri
   Sadece daha önce toplu eklenen denemeleri (id 1763000000000 ile başlayanlar) olan hesapta çalışır; diğer kullanıcılara dokunmaz. */
(function () {
  'use strict';
  var FLAG = 'nk_patch_20261114';
  var MARK = 1763000000000;
  var RENAME = { 1763000000001: ['Beş İşler 1', 'Bes 1'], 1763000000002: ['Beş İşler 2', 'Bes 2'], 1763000000016: ['Nitelik Beceri 1', 'Nitelik'] };
  var ADD = {
    id: 1763000000018, type: 'TYT', name: 'Apotemi 1', date: '2026-11-06',
    scores: {
      'TYT TÜRKÇE': { c: 38, w: 2 }, 'TYT TARİH': { c: 3, w: 2 }, 'TYT COĞRAFYA': { c: 3, w: 2 }, 'TYT FELSEFE': { c: 5, w: 0 }, 'TYT DİN KÜLTÜRÜ': { c: 4, w: 1 },
      'TYT MATEMATİK': { c: 25, w: 3 }, 'TYT GEOMETRİ': { c: 8, w: 1 },
      'TYT FİZİK': { c: 6, w: 1 }, 'TYT KİMYA': { c: 7, w: 0 }, 'TYT BİYOLOJİ': { c: 5, w: 1 }
    }
  };

  function run() {
    try { if (localStorage.getItem(FLAG)) return true; } catch (e) {}
    if (typeof appState === 'undefined' || !appState || !Array.isArray(appState.denemeler) || !appState.field) return false;
    if (!appState.denemeler.some(function (d) { return d.id === MARK; })) return true;   // bu hesapta toplu ekleme yok
    var changed = false;
    appState.denemeler.forEach(function (d) {
      var r = RENAME[d.id];
      if (r && d.name === r[0]) { d.name = r[1]; changed = true; }
    });
    if (!appState.denemeler.some(function (d) { return d.id === ADD.id; })) { appState.denemeler.push(ADD); changed = true; }
    if (changed && typeof saveSettings === 'function') {
      saveSettings();
      try { if (typeof renderDeneme === 'function') renderDeneme(); } catch (e) {}
    }
    try { localStorage.setItem(FLAG, '1'); } catch (e) {}
    return true;
  }

  var tries = 0;
  (function wait() { if (run()) return; if (++tries < 60) setTimeout(wait, 500); })();
})();
