/* Arkadaşlar: arkadaş kodu, DM, gruplar, soru/not gönderme, sohbet */
(function () {
  'use strict';
  var SB_URL = 'https://bswhmwgcytxitdhvvuok.supabase.co';
  function code() { try { return (window.__nkBackup && __nkBackup.getCode()) || ''; } catch (e) { return ''; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, e) { try { showToast(m, !!e); } catch (x) {} }
  var key = null;
  function getKey() {
    if (key) return key;
    // yedek.js ile aynı anahtarı kullan
    try { key = window.__nkSbKey || null; } catch (e) {}
    return key;
  }
  async function rpc(name, body) {
    var k = getKey();
    var r = await fetch(SB_URL + '/rest/v1/rpc/' + name, { method: 'POST', headers: { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(name + ' ' + r.status);
    return r.json();
  }
  var S = { me: null, friends: [], groups: [], shares: {}, gmsgs: {}, dms: {}, greads: {}, since: null, tab: 'sohbet', view: null, seen: {}, pend: null, back: null, gRead: {}, dmRead: {}, reacts: {}, reply: null, rsig: '' };
  try { S.seen = JSON.parse(localStorage.getItem('nk_fr_seen') || '{}') || {}; } catch (e) {}
  function saveSeen() { try { localStorage.setItem('nk_fr_seen', JSON.stringify(S.seen)); } catch (e) {} }
  function myName() { try { var p = JSON.parse(localStorage.getItem('nk_profile') || 'null'); if (p && p.name) return p.name; } catch (e) {} return 'Öğrenci'; }

  async function ensureMe() {
    if (S.me) return S.me;
    S.me = await rpc('nk_me', { p_code: code(), p_name: myName() });
    return S.me;
  }
  async function refreshLists() {
    S.friends = await rpc('nk_friend_list', { p_code: code() }) || [];
    S.groups = await rpc('nk_group_list', { p_code: code() }) || [];
  }
  async function pullInbox() {
    if (!S.me) return;
    var r = await rpc('nk_inbox', { p_code: code(), p_since: S.since });
    (r.shares || []).forEach(function (s) { S.shares[s.id] = s; });
    (r.gmsgs || []).forEach(function (m) { var a = S.gmsgs[m.group_id] = S.gmsgs[m.group_id] || {}; a[m.id] = m; });
    (r.dms || []).forEach(function (m) { var a = S.dms[m.peer_fcode] = S.dms[m.peer_fcode] || {}; a[m.id] = m; });
    (r.greads || []).forEach(function (x) { var a = S.greads[x.group_id] = S.greads[x.group_id] || {}; a[x.name] = x.at; });
    var rs = {}; (r.reacts || []).forEach(function (x) { (rs[x.msg_id] = rs[x.msg_id] || []).push(x); });
    var sig = JSON.stringify(r.reacts || []), rch = sig !== S.rsig ? 1 : 0; S.rsig = sig; S.reacts = rs;
    S.since = r.now;
    badge();
    return (r.shares || []).length + (r.gmsgs || []).length + (r.dms || []).length + rch;
  }
  function findMsg(id) {
    var k, a, i;
    for (k in S.dms) if (S.dms[k][id]) return S.dms[k][id];
    for (k in S.gmsgs) if (S.gmsgs[k][id]) return S.gmsgs[k][id];
    for (k in S.shares) { a = S.shares[k].msgs || []; for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; }
    return null;
  }
  function dmList(f) { return S.dms[f] ? Object.keys(S.dms[f]).map(function (k) { return S.dms[f][k]; }) : []; }
  function unreadDm(f) { var n = dmList(f).filter(function (m) { return !m.mine; }).length; return n - (S.seen['d' + f] || 0); }
  function unreadOf(s) { var n = (s.msgs || []).length + (s.incoming ? 1 : 0); return n - (S.seen[s.id] || 0); }
  function unreadGroup(gid) { var a = S.gmsgs[gid] ? Object.keys(S.gmsgs[gid]).filter(function (k) { return !S.gmsgs[gid][k].mine; }).length : 0; return a - (S.seen['g' + gid] || 0); }
  function totalUnread() {
    var n = 0;
    Object.keys(S.shares).forEach(function (id) { var s = S.shares[id]; if (s.incoming || (s.msgs || []).length) { var u = unreadOf(s); if (u > 0) n += u; } });
    Object.keys(S.gmsgs).forEach(function (g) { var u = unreadGroup(g); if (u > 0) n += u; });
    Object.keys(S.dms).forEach(function (f) { var u = unreadDm(f); if (u > 0) n += u; });
    return n;
  }
  function badge() {
    var b = document.getElementById('nkf-badge'); if (!b) return;
    var n = totalUnread();
    b.style.display = n > 0 ? 'flex' : 'none'; b.textContent = n > 9 ? '9+' : String(n);
  }

  /* ---------- Arayüz ---------- */
  var css = '#nkf{position:fixed;inset:0;z-index:150;display:none;flex-direction:column;font-family:inherit}#nkf{background:var(--nkf-bg,#f8fafc)}' +
    '#nkf.on{display:flex}.nkfx{--nkf-fg:#0f172a;--nkf-card:#fff;--nkf-line:#e2e8f0;color:var(--nkf-fg)}body.dark-mode .nkfx{--nkf-fg:#eef0ff;--nkf-card:rgba(255,255,255,.06);--nkf-line:rgba(255,255,255,.14)}body.dark-mode #nkf{--nkf-bg:#0b0b14}' +
    '.nkfx .w{width:100%;max-width:560px;margin:0 auto;padding:0 14px}' +
    '.nkfx .card{background:var(--nkf-card,#fff);border:1px solid var(--nkf-line,#e2e8f0);border-radius:18px;padding:14px;margin-bottom:10px}' +
    '.nkfx button.b{background:#0d9488;color:#fff;font-weight:800;font-size:14px;padding:13px 18px;border-radius:14px;min-height:46px}' +
    '.nkfx button.g{background:transparent;border:1.5px solid var(--nkf-line,#cbd5e1);font-weight:700;font-size:14px;padding:11px 15px;border-radius:14px;min-height:46px}' +
    '.nkfx input,.nkfx textarea{width:100%;border:1.5px solid var(--nkf-line,#cbd5e1);background:transparent;color:inherit;border-radius:14px;padding:13px 14px;font-size:15px;min-height:48px}' +
    '.nkfx .tab{flex:1;padding:9px 0 8px;font-weight:700;border-radius:16px;opacity:.6;transition:all .15s;min-height:56px}.nkfx .tab.on{background:rgba(13,148,136,.16);opacity:1;color:#0d9488;box-shadow:inset 0 0 0 1.5px rgba(13,148,136,.5)}.nkfx .nkft{display:flex;gap:6px}' +
    '.nkfx .dot{display:inline-flex;min-width:20px;height:20px;border-radius:10px;background:#ef4444;color:#fff;font-size:11px;font-weight:800;align-items:center;justify-content:center;padding:0 6px}' +
    '.nkfx .bub{max-width:82%;padding:10px 13px;border-radius:16px;font-size:14.5px;margin:4px 0;line-height:1.4;word-break:break-word}' +
    '.nkfx .me{margin-left:auto;background:#0d9488;color:#fff}.nkfx .ot{background:var(--nkf-card,#e2e8f0);border:1px solid var(--nkf-line,transparent)}' +
    '.nkfx img.qi{width:100%;border-radius:12px;margin-top:8px}.nkfx .sub{font-size:12px;opacity:.7;font-weight:600}' +
    '.nkfx img.chim{max-width:220px;max-height:240px;border-radius:12px;display:block;cursor:zoom-in}.nkfx .emo{display:flex;gap:2px;flex-wrap:wrap;padding:6px 0;max-height:110px;overflow:auto}.nkfx .emo button{font-size:26px;padding:5px 7px}' +
    '.nkfx .av{display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:900;flex:none}' +
    '.nkfx .row{display:flex;align-items:center;gap:12px}' +
    '.nkfx .sec{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px;margin:18px 2px 10px}.nkfx .sec span.i{font-size:18px}' +
    '.nkfx .pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;padding:3px 9px;border-radius:20px;background:rgba(13,148,136,.15);color:#0d9488}' +
    '.nkfx .sw{width:54px;height:32px;border-radius:16px;background:#cbd5e1;position:relative;flex:none;transition:.2s}.nkfx .sw::after{content:"";position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}.nkfx .sw.on{background:#0d9488}.nkfx .sw.on::after{left:25px}' +
    '@keyframes nkfsh{0%{background-position:-200px 0}100%{background-position:200px 0}}.nkfx .sk{height:70px;border-radius:18px;margin-bottom:10px;background:linear-gradient(90deg,rgba(128,128,128,.12) 25%,rgba(128,128,128,.26) 50%,rgba(128,128,128,.12) 75%);background-size:400px 100%;animation:nkfsh 1.2s infinite linear}' +
    '@keyframes nkfbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}.nkfx .bob{display:inline-block;animation:nkfbob 1.1s ease-in-out infinite}' +
    '#nkf-viewer{position:fixed;inset:0;z-index:170;background:rgba(0,0,0,.94);display:none;flex-direction:column;align-items:center;justify-content:center}#nkf-viewer.on{display:flex}#nkf-viewer .vb{position:absolute;left:0;right:0;bottom:max(14px,env(safe-area-inset-bottom));display:flex;gap:10px;justify-content:center}#nkf-viewer .vb button{margin:3px;background:#fff;color:#0f172a;font-weight:800;font-size:15px;padding:14px 18px;border-radius:16px;min-height:50px}' +
    '#nkf-pick{position:fixed;inset:0;z-index:160;background:rgba(0,0,0,.6);display:none;align-items:flex-end;justify-content:center}#nkf-pick.on{display:flex}' +
    '#nkf-pick .card{display:block;background:transparent;border:1.5px solid rgba(128,128,128,.35);border-radius:16px;padding:15px;margin-top:8px;font-size:16px;min-height:54px}#nkf-pick button.b{background:#0d9488;color:#fff;font-weight:800;font-size:15px;padding:13px 16px;border-radius:14px;min-height:48px}#nkf-pick .nkf-re{font-size:34px;padding:6px 8px}' +
    '#nkf-pick>div{background:#fff;color:#0f172a;width:100%;max-width:560px;border-radius:24px 24px 0 0;padding:18px;max-height:78vh;overflow:auto}body.dark-mode #nkf-pick>div{background:#14141f;color:#eef0ff}' +
    '#library-list div.flex.items-center.shrink-0>button{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:14px}#library-list div.flex.items-center.shrink-0>button svg{width:22px;height:22px}#library-list .nkf-send{background:rgba(13,148,136,.12)}';
  function build() {
    if (document.getElementById('nkf')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'nkf'; d.className = 'nkfx';
    d.innerHTML = '<div class="w" style="padding-top:max(14px,env(safe-area-inset-top));display:flex;align-items:center;gap:10px;padding-bottom:6px"><button id="nkf-back" class="g">‹ Geri</button><div id="nkf-title" style="flex:1;font-weight:800;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div></div>' +
      '<div id="nkf-body" style="flex:1;overflow:auto;padding:8px 0 24px"><div class="w" id="nkf-in"></div></div>' +
      '<div id="nkf-foot" class="w" style="display:none;padding-bottom:max(10px,env(safe-area-inset-bottom));padding-top:8px"></div>';
    document.body.appendChild(d);
    var tabEl = document.getElementById('arkadas');
    if (tabEl) { tabEl.classList.add('nkfx'); tabEl.innerHTML = '<div id="nkft-head"></div><div id="nkft" class="nkft"></div><div id="nkfi" style="margin-top:6px"></div>'; }
    var p = document.createElement('div'); p.id = 'nkf-pick'; document.body.appendChild(p);
    var onClick = function (e) {
      var t = e.target; if (!t || !t.closest) return;
      var add = t.closest('[data-add]'); if (add) { e.stopPropagation(); var sh = S.shares[add.dataset.add]; if (sh) addToArchive(sh); return; }
      var rx = t.closest('.rx'); if (rx) { e.stopPropagation(); var p = rx.dataset.re.split('|'); react(p[0], p[1]); return; }
      if (t.tagName === 'IMG' && t.dataset.sh) { e.stopPropagation(); shareMenu(t.dataset.sh); return; }
      if (t.tagName === 'IMG' && (t.classList.contains('chim') || t.classList.contains('qi'))) { e.stopPropagation(); openViewer(t.src); return; }
      var row = t.closest('[data-mid]'); if (row && !t.closest('.rx')) { e.stopPropagation(); msgMenu(row.dataset.mid); }
    };
    d.querySelector('#nkf-in').addEventListener('click', onClick, true);
    var ti = document.getElementById('nkfi'); if (ti) ti.addEventListener('click', onClick, true);
    d.querySelector('#nkf-back').onclick = function () { if (S.view && S.view.t === 'share' && S.back) { S.view = S.back; S.back = null; S.fresh = true; } else S.view = null; render(); };
    p.onclick = function (e) { if (e.target === p) p.classList.remove('on'); };
  }
  function addHeaderBtn() {
    if (document.getElementById('nkf-btn')) return;
    var ref = document.getElementById('nav-formul'); if (!ref) return;
    var b = document.createElement('button'); b.id = 'nkf-btn'; b.title = 'Arkadaşlar'; b.className = ref.className; b.style.position = 'relative';
    b.innerHTML = '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24" style="width:20px;height:20px"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg><span id="nkf-badge" style="display:none;position:absolute;top:-2px;right:-2px;min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;align-items:center;justify-content:center;padding:0 3px"></span>';
    b.onclick = function () { switchTab('arkadas'); };
    ref.parentNode.insertBefore(b, ref);
  }
  function skeleton() { return '<div style="text-align:center;margin:26px 0 18px"><div class="bob" style="font-size:44px">💬</div><div style="font-weight:800;margin-top:6px">Sohbetlerin getiriliyor</div><div class="sub">Birkaç saniye sürebilir</div></div><div class="sk"></div><div class="sk" style="opacity:.8"></div><div class="sk" style="opacity:.6"></div>'; }
  async function onTab() {
    build();
    S.view = null; if (!S.tab) S.tab = 'sohbet';
    document.getElementById('nkf').classList.remove('on');
    if (S.me) { render(); } else { render('load'); }
    try { await ensureMe(); S.needName = !S.me.name || S.me.name === 'Öğrenci'; await refreshLists(); await pullInbox(); }
    catch (e) { var i = document.getElementById('nkfi'); if (i) i.innerHTML = '<div class="card" style="text-align:center"><div style="font-size:34px">📡</div><b>Bağlantı kurulamadı</b><div class="sub" style="margin:4px 0 10px">İnternetini kontrol edip tekrar dene.</div><button class="b" id="nkf-retry">Tekrar dene</button></div>'; var rb = document.getElementById('nkf-retry'); if (rb) rb.onclick = function () { S.me = null; onTab(); }; return; }
    render();
  }
  function isActive() { var t = document.getElementById('arkadas'), o = document.getElementById('nkf'); return !!((t && t.classList.contains('active')) || (o && o.classList.contains('on'))); }
  async function tick() {
    if (!isActive() || document.hidden) return;
    var typing = document.activeElement && document.activeElement.id === 'nkf-msg' && document.activeElement.value;
    var focusIn = document.activeElement && /^(nkf-gname|nkf-name|nkf-add|nkf-gn)$/.test(document.activeElement.id || '');
    try { var n = await pullInbox(); if (n > 0 && !typing && !focusIn && !(S.tab === 'arkadas' && !S.view) && !(S.tab === 'grup' && !S.view)) render(); else badge(); } catch (e) {}
  }

  function avColor(n) { var P = ['#0d9488', '#6366f1', '#ec4899', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#22c55e']; var h = 0; String(n || '?').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return P[h % P.length]; }
  function av(name, size, ic) { var c = avColor(name); return '<div class="av" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.42) + 'px;background:linear-gradient(135deg,' + c + ',' + c + 'bb)">' + (ic || esc(String(name || '?').trim().charAt(0).toUpperCase())) + '</div>'; }

  function render(loading) {
    var ov = document.getElementById('nkf'), inn, foot = document.getElementById('nkf-foot'), title = document.getElementById('nkf-title');
    if (S.view) {
      ov.classList.add('on'); inn = document.getElementById('nkf-in'); foot.style.display = 'none';
      var t = S.view.t; return t === 'share' ? viewShare(inn, foot, title) : t === 'group' ? viewGroup(inn, foot, title) : viewDm(inn, foot, title);
    }
    ov.classList.remove('on'); S.reply = null; foot.style.display = 'none';
    var head = document.getElementById('nkft-head'), tabs = document.getElementById('nkft'); inn = document.getElementById('nkfi');
    if (!head || !tabs || !inn) return;
    var myn = S.me ? S.me.name : '';
    head.innerHTML = '<div class="row" style="margin-bottom:12px"><div style="flex:1"><div style="font-size:24px;font-weight:900;letter-spacing:-.5px">Arkadaşlar</div><div class="sub" id="nkft-sub"></div></div>' + (S.me && !S.needName ? '<button id="nkft-me" style="border-radius:50%">' + av(myn, 44) + '</button>' : '') + '</div>';
    var me = document.getElementById('nkft-me'); if (me) me.onclick = function () { S.tab = 'arkadas'; render(); };
    if (loading) { tabs.style.display = 'none'; inn.innerHTML = skeleton(); return; }
    if (S.needName) { tabs.style.display = 'none'; return nameGate(inn); }
    tabs.style.display = 'flex';
    var cu = 0, su = 0;
    Object.keys(S.dms).forEach(function (f) { var u = unreadDm(f); if (u > 0) cu += u; });
    Object.keys(S.gmsgs).forEach(function (g) { var u = unreadGroup(g); if (u > 0) cu += u; });
    Object.keys(S.shares).forEach(function (id) { var s = S.shares[id]; var u = unreadOf(s); if (u > 0 && (s.incoming || (s.msgs || []).length)) su += u; });
    var dot = function (n) { return n > 0 ? '<span class="dot" style="position:absolute;top:3px;right:10px">' + (n > 9 ? '9+' : n) + '</span>' : ''; };
    var TABS = [['sohbet', '💬', 'Sohbet', cu, 'Arkadaşların ve gruplarınla yazış'], ['kutu', '❓', 'Sorular', su, 'Gönderilen ve gelen sorular, notlar'], ['arkadas', '🤝', 'Kişiler', 0, 'Arkadaş ekle, kodunu paylaş'], ['grup', '👥', 'Gruplar', 0, 'Grup kur, üye ekle']];
    tabs.innerHTML = TABS.map(function (t) { return '<button class="tab ' + (S.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '" style="position:relative"><span style="display:block;font-size:22px;line-height:1.1">' + t[1] + '</span><span style="display:block;font-size:12px;margin-top:2px">' + t[2] + '</span>' + dot(t[3]) + '</button>'; }).join('');
    tabs.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { S.tab = b.dataset.t; render(); }; });
    var sb = document.getElementById('nkft-sub'); if (sb) sb.textContent = TABS.filter(function (t) { return t[0] === S.tab; })[0][4];
    if (S.tab === 'sohbet') tabSohbet(inn); else if (S.tab === 'kutu') tabKutu(inn); else if (S.tab === 'arkadas') tabArk(inn); else tabGrup(inn);
  }
  function setLocalName(n) { try { var p = JSON.parse(localStorage.getItem('nk_profile') || 'null'); if (p && typeof p === 'object') { p.name = n; localStorage.setItem('nk_profile', JSON.stringify(p)); } } catch (e) {} }
  function nameGate(inn) {
        inn.innerHTML = '<div class="card"><div style="font-weight:800;font-size:15px">Arkadaşların seni nasıl görsün?</div><div class="sub" style="margin:6px 0 10px">Şu an adın "Öğrenci" görünüyor. Sohbette, grupta ve "Görenler" kısmında bu ad çıkacak.</div><input id="nkf-gname" maxlength="20" placeholder="Adın"><button class="b" id="nkf-gnb" style="margin-top:10px;width:100%">Kaydet ve devam et</button></div>';
    var go = async function () {
      var n = document.getElementById('nkf-gname').value.trim(); if (n.length < 2 || n === 'Öğrenci') return toast('Gerçek adını yaz', true);
      try { S.me = await rpc('nk_me', { p_code: code(), p_name: n }); setLocalName(n); S.needName = false; toast('Kaydedildi ✓'); render(); } catch (e) { toast('Olmadı', true); }
    };
    document.getElementById('nkf-gnb').onclick = go; document.getElementById('nkf-gname').onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }
  function hhmm(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function msgPrev(m) { return m ? (m.img ? '📷 ' : '') + esc(String(m.body || '').slice(0, 50)) : ''; }
  function convos() {
    var arr = [];
    S.friends.forEach(function (f) {
      var l = dmList(f.fcode), ss = Object.keys(S.shares).map(function (k) { return S.shares[k]; }).filter(function (x) { return !x.group_id && x.peer_fcode === f.fcode; });
      var last = null, lt = 0;
      l.forEach(function (m) { var t = new Date(m.at).getTime(); if (t >= lt) { lt = t; last = '<span>' + msgPrev(m) + '</span>'; } });
      ss.forEach(function (x) { var t = new Date(x.created_at).getTime(); if (t >= lt) { lt = t; last = '<span>' + (x.kind === 'question' ? '❓ Soru' : '📝 Not') + '</span>'; } });
      arr.push({ v: { t: 'dm', f: f.fcode }, name: f.name, ic: '👤', last: last, at: lt, u: unreadDm(f.fcode) });
    });
    S.groups.forEach(function (g) {
      var l = S.gmsgs[g.id] ? Object.keys(S.gmsgs[g.id]).map(function (k) { return S.gmsgs[g.id][k]; }) : [], ss = Object.keys(S.shares).map(function (k) { return S.shares[k]; }).filter(function (x) { return x.group_id === g.id; });
      var last = null, lt = 0;
      l.forEach(function (m) { var t = new Date(m.at).getTime(); if (t >= lt) { lt = t; last = '<span>' + esc(m.who) + ': ' + msgPrev(m) + '</span>'; } });
      ss.forEach(function (x) { var t = new Date(x.created_at).getTime(); if (t >= lt) { lt = t; last = '<span>' + esc(x.sender) + ': ' + (x.kind === 'question' ? '❓ Soru' : '📝 Not') + '</span>'; } });
      arr.push({ v: { t: 'group', id: g.id }, name: g.name, ic: '👥', last: last, at: lt, u: unreadGroup(g.id) });
    });
    arr.sort(function (a, b) { return b.at - a.at; });
    return arr;
  }
  function empty(ic, t, d, btn, id) { return '<div class="card" style="text-align:center;padding:26px 16px"><div style="font-size:46px">' + ic + '</div><div style="font-weight:800;font-size:16px;margin-top:6px">' + t + '</div><div class="sub" style="margin:6px 0 14px">' + d + '</div>' + (btn ? '<button class="b" id="' + id + '">' + btn + '</button>' : '') + '</div>'; }
  function tabSohbet(inn) {
    var c = convos();
    if (!c.length) { inn.innerHTML = empty('🫂', 'Henüz kimse yok', 'Önce Kişiler sekmesinden arkadaş kodunla birini ekle.', '🤝 Arkadaş ekle', 'nkf-e1'); document.getElementById('nkf-e1').onclick = function () { S.tab = 'arkadas'; render(); }; return; }
    inn.innerHTML = '<div class="sec"><span class="i">💬</span>Sohbetler</div>' + c.map(function (x, i) {
      var isG = x.v.t === 'group';
      return '<div class="card" data-i="' + i + '" style="cursor:pointer;padding:12px"><div class="row">' + av(x.name, 52, isG ? '👥' : null) + '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:16px;display:flex;gap:6px;align-items:center">' + esc(x.name) + (isG ? '<span class="pill">Grup</span>' : '') + '</div><div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">' + (x.last || 'Mesaj yaz...') + '</div></div><div style="text-align:right;display:flex;flex-direction:column;gap:6px;align-items:flex-end">' + (x.at ? '<div class="sub">' + hhmm(x.at) + '</div>' : '') + (x.u > 0 ? '<span class="dot">' + x.u + '</span>' : '<span></span>') + '</div></div></div>';
    }).join('');
    inn.querySelectorAll('[data-i]').forEach(function (e) { e.onclick = function () { S.view = c[+e.dataset.i].v; S.fresh = true; render(); }; });
  }
  function sharePreview(s) {
    var d = s.data || {}; var t = d.text_question || d.note || '';
    return t ? esc(String(t).slice(0, 90)) : (d.img ? '📷 Görselli' : '');
  }
  function tabKutu(inn) {
    var arr = Object.keys(S.shares).map(function (k) { return S.shares[k]; });
    arr.sort(function (a, b) { return lastAt(b) - lastAt(a); });
    if (!arr.length) { inn.innerHTML = empty('📭', 'Henüz soru yok', 'Arşivde bir sorunun yanındaki gönder butonuna bas, arkadaşına veya grubuna yolla.', null); return; }
    inn.innerHTML = arr.map(function (s) {
      var u = unreadOf(s), d = s.data || {}, q = s.kind === 'question', col = q ? '#f59e0b' : '#8b5cf6';
      return '<div class="card" data-s="' + s.id + '" style="cursor:pointer;border-left:5px solid ' + col + '"><div class="row"><div class="av" style="width:44px;height:44px;border-radius:14px;background:' + col + '22;font-size:22px">' + (q ? '❓' : '📝') + '</div><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:15px">' + (s.group_id ? '👥 ' + esc(s.peer) + ' · ' : '') + (s.incoming ? esc(s.sender) : 'Sen → ' + (s.group_id ? 'gruba' : esc(s.peer))) + '</div><div class="sub">' + esc(d.course) + ' › ' + esc(d.topic) + '</div></div>' + (u > 0 && (s.incoming || (s.msgs || []).length) ? '<span class="dot">' + u + '</span>' : '') + '</div><div style="font-size:13px;margin-top:8px;opacity:.85">' + sharePreview(s) + '</div><div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><span class="pill" style="background:' + (s.incoming ? 'rgba(99,102,241,.15);color:#6366f1' : 'rgba(13,148,136,.15)') + '">' + (s.incoming ? '📥 Gelen' : '📤 Giden') + '</span>' + (s.incoming ? (s.added ? '<span class="pill">✓ Arşivinde</span>' : '<span class="pill" style="background:rgba(245,158,11,.18);color:#d97706">Henüz eklenmedi</span>') : '') + ((s.msgs || []).length ? '<span class="pill" style="background:rgba(128,128,128,.15);color:inherit">💬 ' + s.msgs.length + '</span>' : '') + '</div></div>';
    }).join('');
    inn.querySelectorAll('[data-s]').forEach(function (c) { c.onclick = function () { S.back = null; S.view = { t: 'share', id: c.dataset.s }; render(); }; });
  }
  function lastAt(s) { var m = s.msgs && s.msgs.length ? s.msgs[s.msgs.length - 1].at : s.created_at; return new Date(m).getTime(); }

  function tabArk(inn) {
    var on = S.me.notify !== false;
    inn.innerHTML = '<div class="card" style="text-align:center;padding:20px 14px"><div style="display:flex;justify-content:center">' + av(S.me.name, 76) + '</div><div style="font-weight:900;font-size:20px;margin-top:8px">' + esc(S.me.name) + '</div>' +
      '<div class="sub" style="margin-top:10px">Arkadaş kodun</div><div style="font-size:30px;font-weight:900;letter-spacing:6px;margin:2px 0 10px">' + esc(S.me.fcode) + '</div>' +
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="b" id="nkf-copy">📋 Kodu kopyala</button><button class="g" id="nkf-share">📤 Paylaş</button></div><div class="sub" style="margin-top:8px">Bu kodu arkadaşına ver. Kurtarma kodunu kimseye verme.</div></div>' +
      '<div class="sec"><span class="i">➕</span>Arkadaş ekle</div><div class="card"><div style="display:flex;gap:8px"><input id="nkf-add" placeholder="Arkadaşının kodu" maxlength="8" style="text-transform:uppercase;letter-spacing:3px;font-weight:800"><button class="b" id="nkf-addbtn" style="flex:none">Ekle</button></div></div>' +
      '<div class="sec"><span class="i">🤝</span>Arkadaşların <span class="pill">' + S.friends.length + '</span></div>' +
      (S.friends.length ? S.friends.map(function (f) { return '<div class="card"><div class="row">' + av(f.name, 48) + '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:16px">' + esc(f.name) + '</div><div class="sub"><span class="pill">✓ Arkadaşsınız</span> <span style="letter-spacing:2px">' + esc(f.fcode) + '</span></div></div><button class="b nkf-fm" data-f="' + esc(f.fcode) + '" style="flex:none">💬 Mesaj</button></div></div>'; }).join('') : empty('🙋', 'Henüz arkadaş yok', 'Yukarıdaki kutuya arkadaşının kodunu yaz.', null)) +
      '<div class="sec"><span class="i">⚙️</span>Ayarlar</div><div class="card"><div class="row"><span style="font-size:24px">🔔</span><div style="flex:1"><div style="font-weight:800">Mesaj bildirimi</div><div class="sub">Ayarlar\'dan bildirim de açık olmalı</div></div><button id="nkf-nt" class="sw ' + (on ? 'on' : '') + '"></button></div></div>' +
      '<div class="card"><div style="font-weight:800;margin-bottom:8px">✏️ Görünen adın</div><div style="display:flex;gap:8px"><input id="nkf-name" maxlength="20" value="' + esc(S.me.name) + '"><button class="b" id="nkf-namebtn" style="flex:none">Kaydet</button></div></div>';
    document.getElementById('nkf-nt').onclick = async function (e) { var b = e.currentTarget, nv = !b.classList.contains('on'); try { await rpc('nk_notify_set', { p_code: code(), p_on: nv }); S.me.notify = nv; b.classList.toggle('on', nv); toast(nv ? 'Mesaj bildirimi açık' : 'Mesaj bildirimi kapalı'); } catch (x) { toast('Olmadı', true); } };
    document.getElementById('nkf-copy').onclick = function () { try { navigator.clipboard.writeText(S.me.fcode); toast('Kod kopyalandı'); } catch (e) { toast('Kopyalanamadı', true); } };
    document.getElementById('nkf-share').onclick = function () { var t = 'Net Kalkanım\'da beni ekle! Arkadaş kodum: ' + S.me.fcode + ' https://net-kalkanim.vercel.app'; if (navigator.share) navigator.share({ text: t }).catch(function () {}); else { try { navigator.clipboard.writeText(t); toast('Davet metni kopyalandı'); } catch (e) {} } };
    inn.querySelectorAll('.nkf-fm').forEach(function (b) { b.onclick = function () { S.view = { t: 'dm', f: b.dataset.f }; S.fresh = true; render(); }; });
    document.getElementById('nkf-namebtn').onclick = async function () {
      var n = document.getElementById('nkf-name').value.trim(); if (!n) return;
      try { S.me = await rpc('nk_me', { p_code: code(), p_name: n }); setLocalName(n); toast('Ad güncellendi'); render(); } catch (e) { toast('Olmadı', true); }
    };
    document.getElementById('nkf-addbtn').onclick = async function () {
      var f = document.getElementById('nkf-add').value.trim(); if (!f) return toast('Önce kodu yaz', true);
      try { var r = await rpc('nk_friend_add', { p_code: code(), p_fcode: f }); if (r.ok) { toast(r.name + ' arkadaş olarak eklendi ✓'); await refreshLists(); render(); } else toast(r.err || 'Olmadı', true); } catch (e) { toast('Bağlantı hatası', true); }
    };
  }
  function tabGrup(inn) {
    S.sel = S.sel || []; if (S.gname == null) S.gname = '';
    var h = '<div class="card"><div class="row" style="margin-bottom:10px"><span style="font-size:24px">➕</span><div style="font-weight:800;font-size:16px">Yeni grup kur</div></div><input id="nkf-gn" maxlength="30" placeholder="Grup adı" value="' + esc(S.gname) + '" style="margin-bottom:12px">';
    h += '<div class="sub" style="margin-bottom:8px">Üyeleri seç</div>';
    h += S.friends.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap">' + S.friends.map(function (f) { var on = S.sel.indexOf(f.fcode) >= 0; return '<button class="nkf-gc" data-f="' + esc(f.fcode) + '" style="padding:8px 14px 8px 8px;border-radius:26px;font-weight:700;font-size:14px;border:2px solid #0d9488;display:flex;align-items:center;gap:8px;min-height:46px;' + (on ? 'background:#0d9488;color:#fff' : 'background:transparent;color:inherit') + '">' + av(f.name, 30) + (on ? '✓ ' : '') + esc(f.name) + '</button>'; }).join('') + '</div>' : '<div class="sub">Önce Kişiler sekmesinden arkadaş ekle.</div>';
    h += '<button class="b" id="nkf-gmk" style="margin-top:14px;width:100%">Grubu oluştur' + (S.sel.length ? ' (' + (S.sel.length + 1) + ' kişi)' : '') + '</button></div>';
    h += '<div class="sec"><span class="i">👥</span>Gruplarım <span class="pill">' + S.groups.length + '</span></div>';
    h += S.groups.length ? S.groups.map(function (g) { var u = unreadGroup(g.id); return '<div class="card" data-g="' + g.id + '" style="cursor:pointer"><div class="row">' + av(g.name, 52, '👥') + '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:16px">' + esc(g.name) + '</div><div class="sub">' + (g.members || []).length + ' kişi · ' + (g.members || []).map(function (m) { return esc(m.name); }).join(', ') + '</div></div>' + (u > 0 ? '<span class="dot">' + u + '</span>' : '<span style="opacity:.4;font-size:20px">›</span>') + '</div></div>'; }).join('') : empty('🫶', 'Henüz grup yok', 'Yukarıdan arkadaşlarını seçip bir grup kur.', null);
    inn.innerHTML = h;
    var gn = document.getElementById('nkf-gn'); gn.oninput = function () { S.gname = gn.value; };
    inn.querySelectorAll('.nkf-gc').forEach(function (c) { c.onclick = function () { var i = S.sel.indexOf(c.dataset.f); if (i >= 0) S.sel.splice(i, 1); else S.sel.push(c.dataset.f); render(); }; });
    document.getElementById('nkf-gmk').onclick = async function () {
      var n = gn.value.trim();
      if (!n) return toast('Önce grup adı yaz', true);
      if (!S.sel.length) return toast('En az bir arkadaş seç', true);
      try { var r = await rpc('nk_group_create', { p_code: code(), p_name: n, p_fcodes: S.sel }); if (!r.ok) return toast('Grup kurulamadı', true); S.sel = []; S.gname = ''; await refreshLists(); toast('Grup kuruldu ✓'); render(); } catch (e) { toast('Grup kurulamadı', true); }
    };
    inn.querySelectorAll('[data-g]').forEach(function (c) { c.onclick = function () { S.view = { t: 'group', id: c.dataset.g }; render(); }; });
  }
  function reactHTML(mid, mine) {
    var a = S.reacts[mid]; if (!a || !a.length) return '';
    var g = {}; a.forEach(function (x) { var o = g[x.emoji] = g[x.emoji] || { n: 0, me: false, names: [] }; o.n++; o.names.push(x.name); if (x.mine) o.me = true; });
    return '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:-2px 4px 4px;' + (mine ? 'justify-content:flex-end' : '') + '">' + Object.keys(g).map(function (e) { var o = g[e]; return '<button type="button" class="rx" data-re="' + mid + '|' + e + '" title="' + esc(o.names.join(', ')) + '" style="font-size:12px;padding:2px 7px;border-radius:12px;border:1px solid ' + (o.me ? '#0d9488' : 'rgba(128,128,128,.4)') + ';background:' + (o.me ? 'rgba(13,148,136,.15)' : 'transparent') + '">' + e + (o.n > 1 ? ' ' + o.n : '') + '</button>'; }).join('') + '</div>';
  }
  function chatHTML(list) {
    return list.map(function (m) {
      if (m.share) {
        var x = m.share, d = x.data || {};
        return '<div class="card shcard" data-s="' + x.id + '" style="cursor:pointer;border-color:#0d9488;margin:8px 0"><div style="font-weight:800;font-size:12px">' + (x.kind === 'question' ? '❓ Soru' : '📝 Not') + ' · ' + (x.incoming ? esc(x.sender) : 'Sen') + '</div><div class="sub">' + esc(d.course) + ' › ' + esc(d.topic) + '</div>' + (d.img ? '<img class="chim" data-sh="' + x.id + '" src="' + d.img + '" style="max-height:140px;margin-top:6px">' : '') + '<div style="font-size:12px;opacity:.85;margin-top:4px">' + sharePreview(x) + '</div>' + (x.incoming && !x.added ? '<button class="b" data-add="' + x.id + '" style="margin-top:8px">Arşivime ekle</button>' : (x.incoming ? '<div class="sub" style="color:#0d9488;margin-top:4px">✓ Arşivine eklendi</div>' : '')) + '<div class="sub" style="color:#0d9488;margin-top:6px">Aç · ' + ((x.msgs || []).length) + ' yanıt</div></div>';
      }
      var q = m.reply_to ? findMsg(m.reply_to) : null;
      var quote = m.reply_to ? '<div style="border-left:3px solid ' + (m.mine ? '#fff' : '#0d9488') + ';background:rgba(0,0,0,.12);border-radius:8px;padding:4px 8px;margin-bottom:5px;font-size:11px;opacity:.9"><b>' + (q ? (q.mine ? 'Sen' : esc(q.who || 'Arkadaş')) : 'Mesaj') + '</b><div>' + (q ? (q.img ? '📷 ' : '') + esc(String(q.body || 'Fotoğraf').slice(0, 60)) : 'Silinmiş mesaj') + '</div></div>' : '';
      return '<div data-mid="' + m.id + '" style="display:flex;flex-direction:column;align-items:' + (m.mine ? 'flex-end' : 'flex-start') + '">' + (m.mine || !m.who ? '' : '<span class="sub" style="margin-left:6px">' + esc(m.who) + '</span>') + '<div class="bub ' + (m.mine ? 'me' : 'ot') + '" style="cursor:pointer">' + quote + (m.img ? '<img class="chim" src="' + m.img + '">' : '') + (m.body ? esc(m.body) : '') + '<span style="font-size:9px;opacity:.6;margin-left:8px;float:right;margin-top:6px">' + hhmm(m.at) + (m.mine && m.dm ? '<span style="font-size:11px;margin-left:3px;' + (m.read ? 'color:#7dd3fc' : '') + '">' + (m.read ? '✓✓' : '✓') + '</span>' : '') + '</span></div>' + reactHTML(m.id, m.mine) + (m.seenBy ? '<div class="sub" style="font-size:10px;margin:0 4px 4px">Görenler: ' + esc(m.seenBy) + '</div>' : '') + '</div>';
    }).join('');
  }
  async function react(mid, emoji) {
    try { await rpc('nk_react', { p_code: code(), p_msg: mid, p_emoji: emoji }); await pullInbox(); S.keep = true; render(); } catch (e) { toast('Olmadı', true); }
  }
  function msgMenu(mid) {
    var m = findMsg(mid); if (!m) return;
    var p = document.getElementById('nkf-pick'), R = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];
    p.innerHTML = '<div><div style="display:flex;justify-content:space-around;margin-bottom:10px">' + R.map(function (e) { return '<button class="nkf-re" data-e="' + e + '" style="font-size:28px;padding:4px 6px">' + e + '</button>'; }).join('') + '</div>' +
      '<button class="card nkf-ac" data-a="reply" style="width:100%;text-align:left;font-weight:700">↩ Yanıtla</button>' +
      (m.body ? '<button class="card nkf-ac" data-a="copy" style="width:100%;text-align:left;font-weight:700">⧉ Kopyala</button>' : '') +
      (m.img ? '<button class="card nkf-ac" data-a="view" style="width:100%;text-align:left;font-weight:700">🔍 Fotoğrafı aç</button>' : '') + '</div>';
    p.classList.add('on');
    p.querySelectorAll('.nkf-re').forEach(function (b) { b.onclick = function () { p.classList.remove('on'); react(mid, b.dataset.e); }; });
    p.querySelectorAll('.nkf-ac').forEach(function (b) {
      b.onclick = function () {
        p.classList.remove('on');
        if (b.dataset.a === 'reply') { S.reply = { id: mid, who: m.mine ? 'Sen' : (m.who || 'Arkadaş'), text: (m.img ? '📷 ' : '') + String(m.body || 'Fotoğraf').slice(0, 60) }; S.keep = true; render(); setTimeout(function () { var i = document.getElementById('nkf-msg'); if (i) i.focus(); }, 60); }
        else if (b.dataset.a === 'copy') { try { navigator.clipboard.writeText(m.body); toast('Kopyalandı'); } catch (e) { toast('Kopyalanamadı', true); } }
        else openViewer(m.img);
      };
    });
  }
  function shareMenu(id) {
    var sh = S.shares[id]; if (!sh) return;
    var p = document.getElementById('nkf-pick');
    p.innerHTML = '<div><b style="font-size:15px">' + (sh.kind === 'question' ? 'Soru' : 'Not') + '</b>' +
      (sh.incoming && !sh.added ? '<button class="card nkf-ac" data-a="add" style="width:100%;text-align:left;font-weight:800;margin-top:10px;border-color:#0d9488">✚ Arşivime ekle</button>' : '') +
      '<button class="card nkf-ac" data-a="view" style="width:100%;text-align:left;font-weight:700;margin-top:8px">🔍 Büyüt (çevir, kalem)</button>' +
      '<button class="card nkf-ac" data-a="open" style="width:100%;text-align:left;font-weight:700;margin-top:8px">💬 Yanıtlarıyla aç</button></div>';
    p.classList.add('on');
    p.querySelectorAll('.nkf-ac').forEach(function (b) {
      b.onclick = function () {
        p.classList.remove('on');
        if (b.dataset.a === 'add') addToArchive(sh);
        else if (b.dataset.a === 'view') openViewer((sh.data || {}).img);
        else { S.back = S.view; S.view = { t: 'share', id: id }; render(); }
      };
    });
  }
  var EMO = '😀 😂 🤣 😊 😍 🥰 😎 🤔 😅 😭 😡 🥳 👍 👎 👏 🙏 💪 🔥 ✨ 💯 ❤️ 🎉 📚 ✏️ 🧠 😴 🤯 😤 🙌 👀 ✅ ❌ ❓ ⏰ ☕ 🍀'.split(' ');
  function compress(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onerror = rej;
      fr.onload = function () {
        var im = new Image();
        im.onerror = rej;
        im.onload = function () {
          var mx = 1280, sc = Math.min(1, mx / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.72));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  // onSend(text, imgDataURL); opts.pick: soru/not seç butonu (hedef verilir)
  function footInput(foot, onSend, opts) {
    opts = opts || {};
    foot.style.display = 'block';
    foot.innerHTML = (S.reply ? '<div style="display:flex;gap:8px;align-items:center;border-left:3px solid #0d9488;background:rgba(13,148,136,.12);border-radius:8px;padding:6px 10px;margin-bottom:6px"><div style="flex:1;min-width:0;font-size:12px"><b>' + esc(S.reply.who) + '</b><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.8">' + esc(S.reply.text) + '</div></div><button id="nkf-rx" class="g" style="padding:4px 10px">✕</button></div>' : '') + '<div id="nkf-pend" style="display:' + (S.pend ? 'flex' : 'none') + ';gap:8px;align-items:center;margin-bottom:6px">' + (S.pend ? '<img src="' + S.pend + '" style="height:56px;border-radius:10px"><button class="g" id="nkf-pendx">Kaldır</button>' : '') + '</div>' +
      '<div id="nkf-emo" class="emo" style="display:none">' + EMO.map(function (e) { return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:6px;align-items:center"><button class="g" id="nkf-eb" style="padding:0;font-size:22px;width:46px;height:48px;flex:none">😊</button><button class="g" id="nkf-pb" style="padding:0;font-size:22px;width:46px;height:48px;flex:none">📷</button>' + (opts.pick ? '<button class="g" id="nkf-qb" style="padding:0;font-size:22px;width:46px;height:48px;flex:none">❓</button>' : '') +
      '<input id="nkf-msg" placeholder="Mesaj yaz..." maxlength="1000" style="flex:1;min-width:0"><button class="b" id="nkf-send" style="flex:none">Gönder</button></div><input type="file" id="nkf-file" accept="image/*" style="display:none">';
    var inp = document.getElementById('nkf-msg');
    document.getElementById('nkf-eb').onclick = function () { var e = document.getElementById('nkf-emo'); e.style.display = e.style.display === 'none' ? 'flex' : 'none'; };
    document.querySelectorAll('#nkf-emo button').forEach(function (b) { b.onclick = function () { var p = inp.selectionStart == null ? inp.value.length : inp.selectionStart; inp.value = inp.value.slice(0, p) + b.dataset.e + inp.value.slice(p); inp.focus(); try { inp.setSelectionRange(p + b.dataset.e.length, p + b.dataset.e.length); } catch (x) {} }; });
    var fi = document.getElementById('nkf-file');
    document.getElementById('nkf-pb').onclick = function () { fi.click(); };
    fi.onchange = async function () { var f = fi.files && fi.files[0]; if (!f) return; try { S.pend = await compress(f); footInput(foot, onSend, opts); document.getElementById('nkf-msg').value = inp.value; } catch (e) { toast('Fotoğraf okunamadı', true); } };
    var px = document.getElementById('nkf-pendx'); if (px) px.onclick = function () { S.pend = null; var v = inp.value; footInput(foot, onSend, opts); document.getElementById('nkf-msg').value = v; };
    var rxb = document.getElementById('nkf-rx'); if (rxb) rxb.onclick = function () { S.reply = null; var v = inp.value; footInput(foot, onSend, opts); document.getElementById('nkf-msg').value = v; };
    var qb = document.getElementById('nkf-qb'); if (qb) qb.onclick = function () { pickItem(opts.pick); };
    var busy = false;
    var go = async function () {
      var v = inp.value.trim(); if ((!v && !S.pend) || busy) return; busy = true;
      var im = S.pend, rp = S.reply; inp.value = ''; S.pend = null; S.reply = null;
      try { await onSend(v, im, rp ? rp.id : null); await pullInbox(); S.fresh = true; render(); } catch (e) { toast('Gönderilemedi', true); S.pend = im; S.reply = rp; inp.value = v; footInput(foot, onSend, opts); document.getElementById('nkf-msg').value = v; }
      busy = false;
    };
    document.getElementById('nkf-send').onclick = go;
    inp.onkeydown = function (e) { if (e.key === 'Enter') go(); };
  }
  function scrollEnd() { if (S.fresh) { S.fresh = false; var b = document.getElementById('nkf-body'); if (b) setTimeout(function () { b.scrollTop = b.scrollHeight; }, 30); } }
  function wireInn(inn) {
    inn.querySelectorAll('[data-s]').forEach(function (c) { c.onclick = function () { S.back = S.view; S.view = { t: 'share', id: c.dataset.s }; render(); }; });
  }

  /* ---------- Fotoğraf görüntüleyici: iki parmak yakınlaştır, çevir, kalem, geri al ---------- */
  function openViewer(src) {
    var v = document.getElementById('nkf-viewer');
    if (!v) { v = document.createElement('div'); v.id = 'nkf-viewer'; document.body.appendChild(v); }
    var T = { rot: 0, z: 1, x: 0, y: 0, pen: false }, strokes = [], cur = null, ptrs = {}, pinch = null;
    v.innerHTML = '<div id="nkf-vbox" style="position:absolute;inset:0;overflow:hidden;touch-action:none"><div id="nkf-vw" style="position:absolute;left:50%;top:44%;transform-origin:center"><img id="nkf-vimg" src="' + src + '" draggable="false" style="display:block;max-width:96vw;max-height:70vh;user-select:none;-webkit-user-drag:none"><canvas id="nkf-vcv" style="position:absolute;left:0;top:0;width:100%;height:100%"></canvas></div></div>' +
      '<div class="vb" style="flex-wrap:wrap"><button id="nkf-vpen">✏️ Kalem</button><button id="nkf-vundo">↩ Geri al</button><button id="nkf-vrot">↻ Çevir</button><button id="nkf-vsend" style="background:#0d9488;color:#fff">Sohbete gönder</button><button id="nkf-vx">Kapat</button></div>';
    v.classList.add('on');
    var box = document.getElementById('nkf-vbox'), wr = document.getElementById('nkf-vw'), im = document.getElementById('nkf-vimg'), cv = document.getElementById('nkf-vcv');
    function base() { var w = im.offsetWidth, h = im.offsetHeight; if (T.rot % 180 !== 0 && w && h) return Math.min(innerWidth * 0.96 / h, innerHeight * 0.7 / w); return 1; }
    function apply() { wr.style.transform = 'translate(calc(-50% + ' + T.x + 'px), calc(-50% + ' + T.y + 'px)) rotate(' + T.rot + 'deg) scale(' + (base() * T.z) + ')'; }
    function size() { cv.width = im.offsetWidth; cv.height = im.offsetHeight; redraw(); }
    function redraw() {
      var c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.strokeStyle = '#ef4444'; c.lineWidth = Math.max(3, cv.width / 140); c.lineCap = 'round'; c.lineJoin = 'round';
      strokes.forEach(function (st) { c.beginPath(); st.forEach(function (p, i) { var X = p[0] * cv.width, Y = p[1] * cv.height; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); if (st.length === 1) c.lineTo(st[0][0] * cv.width + 0.1, st[0][1] * cv.height); c.stroke(); });
    }
    im.onload = function () { size(); apply(); }; if (im.complete) { size(); apply(); }
    // yerel koordinat: dönüşümü geri al
    function local(e) {
      var r = wr.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, s = base() * T.z, a = -T.rot * Math.PI / 180;
      var dx = (e.clientX - cx) / s, dy = (e.clientY - cy) / s;
      var lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      return [(lx + im.offsetWidth / 2) / im.offsetWidth, (ly + im.offsetHeight / 2) / im.offsetHeight];
    }
    function dist() { var k = Object.keys(ptrs); if (k.length < 2) return 0; var a = ptrs[k[0]], b = ptrs[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }
    function mid() { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
    box.addEventListener('pointerdown', function (e) {
      try { box.setPointerCapture(e.pointerId); } catch (x) {}
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(ptrs).length;
      if (n === 2) { if (cur) { strokes.pop(); cur = null; redraw(); } pinch = { d: dist(), z: T.z, m: mid(), x: T.x, y: T.y }; }
      else if (n === 1) { if (T.pen) { cur = [local(e)]; strokes.push(cur); redraw(); } else pinch = { one: true, sx: e.clientX, sy: e.clientY, x: T.x, y: T.y }; }
    });
    box.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var n = Object.keys(ptrs).length;
      if (n >= 2 && pinch && pinch.d) { var d = dist(), m = mid(); T.z = Math.max(0.5, Math.min(6, pinch.z * d / pinch.d)); T.x = pinch.x + (m.x - pinch.m.x); T.y = pinch.y + (m.y - pinch.m.y); apply(); }
      else if (n === 1) { if (T.pen && cur) { cur.push(local(e)); redraw(); } else if (pinch && pinch.one) { T.x = pinch.x + e.clientX - pinch.sx; T.y = pinch.y + e.clientY - pinch.sy; apply(); } }
    });
    function up(e) { delete ptrs[e.pointerId]; var n = Object.keys(ptrs).length; if (n < 2) pinch = null; if (n === 0) cur = null; }
    box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
    box.addEventListener('dblclick', function () { T.z = T.z > 1 ? 1 : 2.5; T.x = 0; T.y = 0; apply(); });
    var pb = document.getElementById('nkf-vpen');
    pb.onclick = function () { T.pen = !T.pen; pb.style.background = T.pen ? '#ef4444' : ''; pb.style.color = T.pen ? '#fff' : ''; pb.textContent = T.pen ? '✏️ Kalem açık' : '✏️ Kalem'; };
    document.getElementById('nkf-vundo').onclick = function () { strokes.pop(); redraw(); };
    document.getElementById('nkf-vrot').onclick = function () { T.rot = (T.rot + 90) % 360; apply(); };
    document.getElementById('nkf-vx').onclick = function () { v.classList.remove('on'); v.innerHTML = ''; };
    document.getElementById('nkf-vsend').onclick = async function () {
      var t = S.view; if (!t || t.t === 'share') { toast('Önce bir sohbet aç', true); return; }
      try {
        var c = document.createElement('canvas'), W = im.naturalWidth, H = im.naturalHeight, sc = Math.min(1, 1280 / Math.max(W, H)); c.width = Math.round(W * sc); c.height = Math.round(H * sc);
        var x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height); x.strokeStyle = '#ef4444'; x.lineWidth = Math.max(3, c.width / 140); x.lineCap = 'round'; x.lineJoin = 'round';
        strokes.forEach(function (st) { x.beginPath(); st.forEach(function (p, i) { var X = p[0] * c.width, Y = p[1] * c.height; if (i) x.lineTo(X, Y); else x.moveTo(X, Y); }); x.stroke(); });
        var data = c.toDataURL('image/jpeg', 0.72);
        var r = t.t === 'dm' ? await rpc('nk_dm_msg', { p_code: code(), p_fcode: t.f, p_body: '', p_img: data }) : await rpc('nk_group_msg', { p_code: code(), p_group: t.id, p_body: '', p_img: data });
        if (r.ok) { toast('Gönderildi ✓'); v.classList.remove('on'); v.innerHTML = ''; await pullInbox(); S.fresh = true; render(); } else toast(r.err || 'Olmadı', true);
      } catch (e) { toast('Gönderilemedi', true); }
    };
  }

  function viewShare(inn, foot, title) {
    var s = S.shares[S.view.id]; if (!s) { S.view = null; return render(); }
    var d = s.data || {};
    title.textContent = (s.kind === 'question' ? 'Soru' : 'Not') + ' · ' + (s.group_id ? s.peer : (s.incoming ? s.sender : s.peer));
    S.seen[s.id] = (s.msgs || []).length + (s.incoming ? 1 : 0); saveSeen(); badge();
    var h = '<div class="card"><div class="sub">' + esc(d.course) + ' › ' + esc(d.topic) + (s.incoming ? ' · ' + esc(s.sender) : '') + '</div>';
    if (s.incoming) h += '<div style="margin-top:8px">' + (s.added ? '<span class="sub" style="color:#0d9488">✓ Arşivine eklendi</span>' : '<button class="b" id="nkf-addarch">✚ Arşivime ekle</button>') + '</div>';
    if (d.text_question) h += '<div style="margin-top:6px;font-size:14px">' + esc(d.text_question) + '</div>';
    if (d.note) h += '<div style="margin-top:6px;font-size:14px">' + esc(d.note) + '</div>';
    if (d.img) h += '<img class="qi" src="' + d.img + '">';
    if (s.kind === 'question' && d.answer) h += '<details style="margin-top:8px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Doğru cevap</summary><div style="margin-top:4px">' + esc(d.answer) + '</div></details>';
    if (d.note_text) h += '<details style="margin-top:6px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Çözüm notu</summary><div style="margin-top:4px">' + esc(d.note_text) + '</div></details>';
    if (d.note_img) h += '<img class="qi" src="' + d.note_img + '">';
    if (d.note_back) h += '<details style="margin-top:6px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Arka yüz</summary><div style="margin-top:4px">' + esc(d.note_back) + '</div></details>';
    if (d.note_back_img) h += '<img class="qi" src="' + d.note_back_img + '">';
    h += '</div><div>' + chatHTML(s.msgs || []) + '</div>';
    inn.innerHTML = h;
    wireInn(inn); inn.querySelectorAll('[data-s]').forEach(function (c) { c.onclick = null; });
    var ab = document.getElementById('nkf-addarch'); if (ab) ab.onclick = function () { addToArchive(s); };
    footInput(foot, function (v, im, rid) { return rpc('nk_msg_send', { p_code: code(), p_share: s.id, p_body: v, p_img: im || null, p_reply: rid || null }); });
  }
  function timeline(msgs, shares) {
    var arr = msgs.map(function (m) { return { at: new Date(m.at).getTime(), m: m }; });
    shares.forEach(function (x) { arr.push({ at: new Date(x.created_at).getTime(), m: { share: x } }); });
    arr.sort(function (a, b) { return a.at - b.at; });
    return arr.map(function (x) { return x.m; });
  }
  function viewDm(inn, foot, title) {
    var f = S.friends.filter(function (x) { return x.fcode === S.view.f; })[0]; if (!f) { S.view = null; return render(); }
    title.innerHTML = '<span style="display:inline-flex;align-items:center;gap:10px">' + av(f.name, 34) + esc(f.name) + '</span>';
    var l = dmList(f.fcode); S.seen['d' + f.fcode] = l.filter(function (m) { return !m.mine; }).length; saveSeen(); badge();
    var incoming = l.filter(function (m) { return !m.mine; }).length;
    if (incoming && S.dmRead[f.fcode] !== incoming) { S.dmRead[f.fcode] = incoming; rpc('nk_dm_read', { p_code: code(), p_fcode: f.fcode }).catch(function () {}); }
    l = l.map(function (m) { var c = {}; for (var k in m) c[k] = m[k]; c.dm = true; return c; });
    var ss = Object.keys(S.shares).map(function (k) { return S.shares[k]; }).filter(function (x) { return !x.group_id && x.peer_fcode === f.fcode; });
    var tl = timeline(l, ss);
    inn.innerHTML = tl.length ? chatHTML(tl) : '<div class="sub" style="text-align:center;margin-top:30px">Henüz mesaj yok. İlk mesajı sen yaz 👋</div>';
    wireInn(inn); scrollEnd();
    footInput(foot, function (v, im, rid) { return rpc('nk_dm_msg', { p_code: code(), p_fcode: f.fcode, p_body: v, p_img: im || null, p_reply: rid || null }); }, { pick: { f: f.fcode } });
  }
  function viewGroup(inn, foot, title) {
    var g = S.groups.filter(function (x) { return x.id === S.view.id; })[0]; if (!g) { S.view = null; return render(); }
    title.innerHTML = '<span style="display:inline-flex;align-items:center;gap:10px">' + av(g.name, 34, '👥') + esc(g.name) + '</span>';
    var msgs = S.gmsgs[g.id] ? Object.keys(S.gmsgs[g.id]).map(function (k) { return S.gmsgs[g.id][k]; }) : [];
    S.seen['g' + g.id] = msgs.filter(function (m) { return !m.mine; }).length; saveSeen(); badge();
    var newest = msgs.reduce(function (a, m) { return Math.max(a, new Date(m.at).getTime()); }, 0);
    if (newest && S.gRead[g.id] !== newest) { S.gRead[g.id] = newest; rpc('nk_group_read', { p_code: code(), p_group: g.id }).catch(function () {}); }
    var lastMine = null; msgs.forEach(function (m) { if (m.mine) lastMine = m; });
    if (lastMine) { var gr = S.greads[g.id] || {}, seen = Object.keys(gr).filter(function (n) { return new Date(gr[n]) >= new Date(lastMine.at); }); msgs = msgs.map(function (m) { if (m !== lastMine) return m; var c = {}; for (var k in m) c[k] = m[k]; c.seenBy = seen.length ? seen.join(', ') : ''; return c; }); }
    var addable = S.friends.filter(function (f) { return !(g.members || []).some(function (m) { return m.fcode === f.fcode; }); });
    var gs = Object.keys(S.shares).map(function (k) { return S.shares[k]; }).filter(function (s) { return s.group_id === g.id; });
    var tl = timeline(msgs, gs);
    var h = '<details class="card"><summary style="font-weight:800;font-size:13px;cursor:pointer">Üyeler (' + (g.members || []).length + ') ve ayarlar</summary><div class="sub" style="margin-top:6px">' + (g.members || []).map(function (m) { return esc(m.name); }).join(', ') + '</div>' +
      (addable.length ? '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' + addable.map(function (f) { return '<button class="g nkf-ga" data-f="' + esc(f.fcode) + '">+ ' + esc(f.name) + '</button>'; }).join('') + '</div>' : '') +
      '<button class="g" id="nkf-leave" style="margin-top:8px;color:#e11d48">Gruptan ayrıl</button></details>';
    h += tl.length ? chatHTML(tl) : '<div class="sub" style="text-align:center;margin-top:20px">Henüz mesaj yok.</div>';
    inn.innerHTML = h;
    wireInn(inn); scrollEnd();
    inn.querySelectorAll('.nkf-ga').forEach(function (b) { b.onclick = async function () { try { await rpc('nk_group_add', { p_code: code(), p_group: g.id, p_fcodes: [b.dataset.f] }); await refreshLists(); toast('Üye eklendi'); render(); } catch (e) { toast('Olmadı', true); } }; });
    var lv = document.getElementById('nkf-leave'), armed = false;
    lv.onclick = async function () {
      if (!armed) { armed = true; lv.textContent = 'Emin misin? Tekrar bas'; toast('Ayrılmak için bir kez daha bas'); setTimeout(function () { armed = false; if (lv) lv.textContent = 'Gruptan ayrıl'; }, 4000); return; }
      try { await rpc('nk_group_leave', { p_code: code(), p_group: g.id }); await refreshLists(); S.view = null; toast('Gruptan ayrıldın'); render(); } catch (e) { toast('Ayrılamadın, tekrar dene', true); }
    };
    footInput(foot, function (v, im, rid) { return rpc('nk_group_msg', { p_code: code(), p_group: g.id, p_body: v, p_img: im || null, p_reply: rid || null }); }, { pick: { g: g.id } });
  }

  /* ---------- Arşive ekle ---------- */
  async function addToArchive(s) {
    var d = s.data || {}, now = getNowTR(), id = Date.now();
    function bl(u) { return u ? dataURLToBlob(u) : null; }
    try {
      if (s.kind === 'question') {
        var days = appState.intervals[0] || 1, nd = getNowTR(); nd.setDate(nd.getDate() + days);
        var q = { id: id, course: d.course || 'GENEL', topic: d.topic || 'GENEL', img: bl(d.img), text_question: d.text_question || '', note_text: d.note_text || '', note_img: bl(d.note_img), type: d.type || 'text', answer: d.answer || '', level: 0, nextReview: formatDate(nd), lastReviewedDate: '', is_mastered: false, createdDate: formatDate(now), sortOrder: id };
        appState.questions.push(q); await saveQuestion(q);
      } else {
        var dn = appState.noteIntervals[0] || 1, nn = getNowTR(); nn.setDate(nn.getDate() + dn);
        var n = { id: id, course: d.course || 'GENEL', topic: d.topic || 'GENEL', img: bl(d.img), note: d.note || '', note_back: d.note_back || null, note_back_img: bl(d.note_back_img), stage: 0, nextReview: formatDate(nn), lastReviewedDate: '', createdDate: formatDate(now), sortOrder: id };
        appState.notes.push(n); await saveNote(n);
      }
      await rpc('nk_share_added', { p_code: code(), p_share: s.id });
      s.added = true; toast('Arşivine eklendi'); render();
      try { if (typeof renderLibrary === 'function') renderLibrary(); if (typeof updateDashboard === 'function') updateDashboard(); } catch (e) {}
    } catch (e) { toast('Eklenemedi', true); }
  }

  /* ---------- Gönderme ---------- */
  async function payloadOf(type, id) {
    var list = type === 'question' ? appState.questions : appState.notes;
    var it = list.filter(function (x) { return x.id === id; })[0]; if (!it) return null;
    var p = { course: it.course, topic: it.topic };
    async function du(b) { return b && b.size ? await blobToDataURL(b) : null; }
    if (type === 'question') { p.text_question = it.text_question || ''; p.note_text = it.note_text || ''; p.type = it.type; p.answer = it.answer || ''; p.img = await du(it.img); p.note_img = await du(it.note_img); }
    else { p.note = it.note || ''; p.note_back = it.note_back || ''; p.img = await du(it.img); p.note_back_img = await du(it.note_back_img); }
    return p;
  }
  async function doSend(type, id, t) {
    toast('Gönderiliyor...');
    try {
      var pl = await payloadOf(type, id); if (!pl) return toast('Bulunamadı', true);
      var r = t.g ? await rpc('nk_share_send_group', { p_code: code(), p_group: t.g, p_kind: type, p_data: pl }) : await rpc('nk_share_send', { p_code: code(), p_fcode: t.f, p_kind: type, p_data: pl });
      if (r.ok) { toast('Gönderildi ✓'); try { await pullInbox(); S.fresh = true; var d = document.getElementById('nkf'); if (d && d.classList.contains('on')) render(); } catch (e) {} } else toast(r.err || 'Olmadı', true);
    } catch (e) { toast('Gönderilemedi', true); }
  }
  async function sendItem(type, id) {
    build();
    try { await ensureMe(); await refreshLists(); } catch (e) { return toast('İnternet gerekli', true); }
    var p = document.getElementById('nkf-pick');
    if (!S.friends.length && !S.groups.length) { p.innerHTML = '<div><b>Önce arkadaş ekle</b><p class="sub" style="margin:8px 0">Arkadaşlar ekranından arkadaş kodunla birini ekle.</p><button class="b" id="nkf-go">Arkadaşlar\'ı aç</button></div>'; p.classList.add('on'); document.getElementById('nkf-go').onclick = function () { p.classList.remove('on'); switchTab('arkadas'); }; return; }
    p.innerHTML = '<div><b style="font-size:15px">Kime gönderelim?</b>' + S.groups.map(function (g) { return '<button class="card nkf-t" data-g="' + g.id + '" style="width:100%;text-align:left;margin-top:8px;font-weight:700">👥 ' + esc(g.name) + '</button>'; }).join('') + S.friends.map(function (f) { return '<button class="card nkf-t" data-f="' + esc(f.fcode) + '" style="width:100%;text-align:left;margin-top:8px;font-weight:700">👤 ' + esc(f.name) + '</button>'; }).join('') + '</div>';
    p.classList.add('on');
    p.querySelectorAll('.nkf-t').forEach(function (b) { b.onclick = function () { p.classList.remove('on'); doSend(type, id, b.dataset.g ? { g: b.dataset.g } : { f: b.dataset.f }); }; });
  }
  function pickItem(target) {
    var p = document.getElementById('nkf-pick'), rows = [];
    (appState.questions || []).forEach(function (q) { rows.push({ t: 'question', id: q.id, c: q.course, tp: q.topic, tx: q.text_question || (q.img ? '📷 Görselli soru' : ''), o: q.sortOrder || q.id }); });
    (appState.notes || []).forEach(function (n) { rows.push({ t: 'note', id: n.id, c: n.course, tp: n.topic, tx: n.note || (n.img ? '📷 Görselli not' : ''), o: n.sortOrder || n.id }); });
    rows.sort(function (a, b) { return b.o - a.o; }); rows = rows.slice(0, 40);
    if (!rows.length) { toast('Arşivinde gönderilecek soru yok', true); return; }
    p.innerHTML = '<div><b style="font-size:15px">Hangisini gönderelim?</b>' + rows.map(function (r, i) { return '<button class="card nkf-r" data-i="' + i + '" style="width:100%;text-align:left;margin-top:8px"><div class="sub">' + (r.t === 'question' ? '❓' : '📝') + ' ' + esc(r.c) + ' › ' + esc(r.tp) + '</div><div style="font-size:13px;font-weight:600">' + esc(String(r.tx).slice(0, 70)) + '</div></button>'; }).join('') + '</div>';
    p.classList.add('on');
    p.querySelectorAll('.nkf-r').forEach(function (b) { b.onclick = function () { p.classList.remove('on'); var r = rows[+b.dataset.i]; doSend(r.t, r.id, target); }; });
  }

  /* ---------- Arşiv kartlarına gönder butonu ---------- */
  var SEND_SVG = '<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>';
  function decorate() {
    var box = document.getElementById('library-list'); if (!box) return;
    box.querySelectorAll('button[onclick*="deleteItem("]').forEach(function (del) {
      if (del.parentNode.querySelector('.nkf-send')) return;
      var m = /deleteItem\('(\w+)',\s*(\d+)\)/.exec(del.getAttribute('onclick') || ''); if (!m) return;
      var b = document.createElement('button'); b.className = 'nkf-send p-1 shrink-0'; b.title = 'Arkadaşa gönder'; b.style.color = '#0d9488'; b.innerHTML = SEND_SVG;
      b.onclick = function (e) { e.stopPropagation(); sendItem(m[1], parseInt(m[2], 10)); };
      del.parentNode.insertBefore(b, del);
    });
  }
  function init() {
    // yedek.js anahtarı dışarı vermediği için aynı anahtarı sayfadan al
    var lib = document.getElementById('library-list');
    if (lib) new MutationObserver(function () { clearTimeout(init._t); init._t = setTimeout(decorate, 60); }).observe(lib, { childList: true });
    addHeaderBtn();
    setTimeout(addHeaderBtn, 1500);
    try { if (/[?&]nkf=1/.test(location.search)) setTimeout(function () { switchTab('arkadas'); }, 2500); if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'nk-open') switchTab('arkadas'); }); } catch (e) {}
    setInterval(tick, 8000);
    setInterval(async function () { if (document.hidden || !code() || !appState || !appState.field) return; try { await ensureMe(); await pullInbox(); } catch (e) {} }, 45000);
    setTimeout(async function () { try { if (appState && appState.field && code()) { await ensureMe(); await pullInbox(); } } catch (e) {} }, 4000);
  }
  window.__nkFr = { open: function () { switchTab('arkadas'); }, onTab: onTab, sendItem: sendItem };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
