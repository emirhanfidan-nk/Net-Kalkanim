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
  try {
    var st = document.createElement('style');
    st.textContent = '.nkfr{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;margin:0 .18em;font-size:.94em;line-height:1.2}.nkfr>span:first-child{border-bottom:1.5px solid currentColor;padding:0 .22em}.nkfr>span:last-child{padding:0 .22em}.nkss{font-size:.72em;line-height:0}sup.nkss{vertical-align:.5em}sub.nkss{vertical-align:-.28em}.nkrt{border-top:1.5px solid currentColor;padding:0 .12em;margin-left:1px}';
    document.head.appendChild(st);
  } catch (e) {}
})();
