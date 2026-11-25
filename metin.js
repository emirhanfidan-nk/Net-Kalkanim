/* Yapay zekâdan (Gemini vb.) gelen LaTeX'li metni uygulamanın yazı tipine uygun, okunur HTML'e çevirir.
   window.__nkFmt(metin) -> güvenli (kaçışlı) HTML */
(function () {
  'use strict';
  var SYM = { dots: '…', ldots: '…', cdots: '⋯', cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', approx: '≈', equiv: '≡', infty: '∞', pi: 'π', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', theta: 'θ', lambda: 'λ', mu: 'μ', sigma: 'σ', Sigma: 'Σ', sum: '∑', prod: '∏', int: '∫', omega: 'ω', Omega: 'Ω', phi: 'φ', varphi: 'φ', epsilon: 'ε', varepsilon: 'ε', rho: 'ρ', tau: 'τ', eta: 'η', kappa: 'κ', to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', implies: '⇒', Leftrightarrow: '⇔', iff: '⇔', in: '∈', notin: '∉', subset: '⊂', cup: '∪', cap: '∩', forall: '∀', exists: '∃', circ: '°', degree: '°', angle: '∠', perp: '⊥', parallel: '∥', quad: ' ', qquad: '  ', neg: '¬', land: '∧', lor: '∨', emptyset: '∅', prime: '′', ' ': ' ' };
  var SKIP = { left: 1, right: 1, displaystyle: 1, textstyle: 1, limits: 1, nolimits: 1, big: 1, Big: 1, bigg: 1, Bigg: 1 };
  var TXT = { text: 1, mathrm: 1, textbf: 1, mathbf: 1, mathit: 1, operatorname: 1, mbox: 1, textit: 1, boldsymbol: 1 };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function parse(t, tex) {
    var out = '', i = 0;
    function group() { var d = 0, st = i + 1; for (; i < t.length; i++) { if (t[i] === '{') d++; else if (t[i] === '}') { d--; if (d === 0) { var r = t.slice(st, i); i++; return r; } } } return t.slice(st); }
    function cmdAt() { var m = /^\\[a-zA-Z]+/.exec(t.slice(i, i + 24)); return m ? m[0] : null; }
    function sp() { while (t[i] === ' ') i++; }
    function arg() { sp(); if (t[i] === '{') return group(); var m = cmdAt(); if (m) { i += m.length; return m; } var c = t[i] || ''; i++; return c; }
    function sarg() {
      if (t[i] === '{') return group();
      var m = cmdAt(); if (m) { i += m.length; return m; }
      var r = /^[+\-−]?\d+|^[a-zA-Z]/.exec(t.slice(i, i + 12)); if (r) { i += r[0].length; return r[0]; }
      return '';
    }
    while (i < t.length) {
      var c = t[i];
      if (c === '\\') {
        var m = /^\\([a-zA-Z]+)/.exec(t.slice(i, i + 24));
        if (m) {
          var nm = m[1]; i += m[0].length;
          if (nm === 'frac' || nm === 'dfrac' || nm === 'tfrac') { var a = arg(), b = arg(); out += '<span class="nkfr"><span>' + parse(a, tex) + '</span><span>' + parse(b, tex) + '</span></span>'; continue; }
          if (nm === 'sqrt') { if (t[i] === '[') { var e = t.indexOf(']', i); if (e > 0) i = e + 1; } var r = arg(); out += '√<span class="nkrt">' + parse(r, tex) + '</span>'; continue; }
          if (TXT[nm]) { out += parse(arg(), tex); continue; }
          if (SKIP[nm]) { if (t[i] === '.') i++; continue; }
          if (SYM[nm] != null) { out += SYM[nm]; continue; }
          out += nm; continue;
        }
        var n = t[i + 1];
        if (n === '\\') { out += '<br>'; i += 2; continue; }
        if (n && /[,;:! ]/.test(n)) { out += n === '!' ? '' : ' '; i += 2; continue; }
        if (n && /[%{}_#&$|]/.test(n)) { out += n; i += 2; continue; }
        out += c; i++; continue;
      }
      if (c === '^' && i > 0) { i++; var a2 = sarg(); out += a2 ? '<sup class="nkss">' + parse(a2, tex) + '</sup>' : '^'; continue; }
      if (c === '_' && i > 0 && /[A-Za-z0-9)\]}]/.test(t[i - 1]) && (t[i + 1] === '{' || /^_[A-Za-z0-9](?![A-Za-z])/.test(t.slice(i, i + 3)) || /^_\d+/.test(t.slice(i, i + 6)))) { i++; var a3 = sarg(); out += a3 ? '<sub class="nkss">' + parse(a3, tex) + '</sub>' : '_'; continue; }
      if ((c === '{' || c === '}') && tex) { i++; continue; }
      out += c; i++;
    }
    return out;
  }
  function fmt(s) {
    s = String(s == null ? '' : s);
    if (!s) return '';
    s = s.replace(/\$\$([^$]+)\$\$/g, '$1').replace(/\$([^$\n]+)\$/g, '$1').replace(/\\[()\[\]]/g, '');
    var tex = /\\[a-zA-Z]|[\^_]\{/.test(s);
    var h = parse(esc(s), tex);
    h = h.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/\r?\n/g, '<br>');
    return h;
  }
  window.__nkFmt = fmt;
  var ICO = {"chat": "<path d=\"M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z\"/>", "question": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01\"/>", "note": "<path d=\"M6 3h9l4 4v14H6z\"/><path d=\"M14 3v5h5M9 13h7M9 17h5\"/>", "user": "<circle cx=\"12\" cy=\"8\" r=\"3.5\"/><path d=\"M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5\"/>", "users": "<circle cx=\"9\" cy=\"8\" r=\"3.2\"/><path d=\"M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5\"/><circle cx=\"17\" cy=\"9\" r=\"2.5\"/><path d=\"M16 14.3c3 .1 5 2 5 5\"/>", "wifioff": "<path d=\"M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01M3 3l18 18\"/>", "camera": "<path d=\"M4 8h3l1.5-2h7L17 8h3v11H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/>", "inbox": "<path d=\"M3 13l3-8h12l3 8v6H3z\"/><path d=\"M3 13h5l1 2h6l1-2h5\"/>", "inboxin": "<path d=\"M12 3v9M8.5 9 12 12.5 15.5 9M3 13v6h18v-6h-5l-1 2H9l-1-2z\"/>", "send": "<path d=\"M12 15V4M8 7.5 12 3.5l4 4M4 14v6h16v-6\"/>", "copy": "<rect x=\"8\" y=\"8\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2\"/>", "plus": "<path d=\"M12 5v14M5 12h14\"/>", "gear": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z\"/>", "bell": "<path d=\"M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10.3 20a2 2 0 0 0 3.4 0\"/>", "pen": "<path d=\"M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4\"/>", "heart": "<path d=\"M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z\"/>", "search": "<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"M20 20l-4.2-4.2\"/>", "close": "<path d=\"M6 6l12 12M18 6 6 18\"/>", "smile": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01\"/>", "image": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"1.7\"/><path d=\"M21 16l-5-5-9 9\"/>"};
  window.__nkIco = function (n) { return '<svg class="nkic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICO[n] || '') + '</svg>'; };
  try {
    var st = document.createElement('style');
    st.textContent = '.nkic{display:inline-block;width:1.1em;height:1.1em;vertical-align:-.2em;flex:none}.nkfr{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;margin:0 .18em;font-size:.94em;line-height:1.2}.nkfr>span:first-child{border-bottom:1.5px solid currentColor;padding:0 .22em}.nkfr>span:last-child{padding:0 .22em}.nkss{font-size:.72em;line-height:0}sup.nkss{vertical-align:.5em}sub.nkss{vertical-align:-.28em}.nkrt{border-top:1.5px solid currentColor;padding:0 .12em;margin-left:1px}';
    document.head.appendChild(st);
  } catch (e) {}
})();
