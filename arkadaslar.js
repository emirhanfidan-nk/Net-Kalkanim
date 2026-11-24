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
  var S = { admin: null, me: null, friends: [], groups: [], shares: {}, gmsgs: {}, dms: {}, greads: {}, since: null, tab: 'sohbet', view: null, seen: {}, pend: null, back: null, gRead: {}, dmRead: {}, reacts: {}, reply: null, rsig: '' };
  try { S.seen = JSON.parse(localStorage.getItem('nk_fr_seen') || '{}') || {}; } catch (e) {}
  function saveSeen() { try { localStorage.setItem('nk_fr_seen', JSON.stringify(S.seen)); } catch (e) {} }
  function myName() { try { var q = localStorage.getItem('nk_fr_name'); if (q && q !== 'Öğrenci') return q; } catch (e) {} try { var p = JSON.parse(localStorage.getItem('nk_profile') || 'null'); if (p && p.name) return p.name; } catch (e) {} return 'Öğrenci'; }

  async function ensureMe() {
    if (S.me) return S.me;
    S.me = await rpc('nk_me', { p_code: code(), p_name: myName() });
    try { if (S.me && S.me.name && S.me.name !== 'Öğrenci') localStorage.setItem('nk_fr_name', S.me.name); } catch (e) {}
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
    '#nkf-down{position:absolute;right:16px;bottom:90px;width:50px;height:50px;border-radius:50%;background:#0d9488;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35);display:none;align-items:center;justify-content:center;z-index:5}#nkf-down.on{display:flex}' +
    '#nkf-pick{position:fixed;inset:0;z-index:160;background:rgba(0,0,0,.6);display:none;align-items:flex-end;justify-content:center}#nkf-pick.on{display:flex}' +
    '#nkf-pick .card{display:block;background:transparent;border:1.5px solid rgba(128,128,128,.35);border-radius:16px;padding:15px;margin-top:8px;font-size:16px;min-height:54px}#nkf-pick button.b{background:#0d9488;color:#fff;font-weight:800;font-size:15px;padding:13px 16px;border-radius:14px;min-height:48px}#nkf-pick .nkf-re{font-size:34px;padding:6px 8px}' +
    '#nkf-pick>div{background:#fff;color:#0f172a;width:100%;max-width:560px;border-radius:24px 24px 0 0;padding:18px;max-height:78vh;overflow:auto}body.dark-mode #nkf-pick>div{background:#14141f;color:#eef0ff}' +
    '#library-list div.flex.items-center.shrink-0>button{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:14px}#library-list div.flex.items-center.shrink-0>button svg{width:22px;height:22px}#library-list .nkf-send{background:rgba(13,148,136,.12)}';
  function build() {
    if (document.getElementById('nkf')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'nkf'; d.className = 'nkfx';
    d.innerHTML = '<div class="w" style="padding-top:max(14px,env(safe-area-inset-top));display:flex;align-items:center;gap:10px;padding-bottom:6px"><button id="nkf-back" class="g">‹ Geri</button><div id="nkf-title" style="flex:1;font-weight:800;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div><button id="nkf-gear" class="g" aria-label="Grup ayarları" style="display:none;padding:0;width:46px;height:46px;flex:none;align-items:center;justify-content:center;line-height:0"><svg viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px"><path d="M19.400 13a7.800 7.800 0 0 0 0-2l2.100-1.600-2-3.500-2.500 1a7.600 7.600 0 0 0-1.700-1L15 3.200h-4l-.4 2.700c-.6.300-1.200.6-1.700 1l-2.500-1-2 3.500L6.600 11a7.800 7.800 0 0 0 0 2l-2.100 1.600 2 3.500 2.500-1c.5.400 1.100.7 1.700 1l.4 2.700h4l.4-2.700c.6-.3 1.200-.6 1.700-1l2.500 1 2-3.500zM13 15.500a3.500 3.500 0 1 1 0-7 3.500 3.500 0 0 1 0 7z" transform="translate(-1 0)"/></svg></button></div>' +
      '<div id="nkf-body" style="flex:1;overflow:auto;padding:8px 0 24px"><div class="w" id="nkf-in"></div></div>' +
      '<div id="nkf-foot" class="w" style="display:none;padding-bottom:max(10px,env(safe-area-inset-bottom));padding-top:8px"></div>';
    document.body.appendChild(d);
    var dn = document.createElement('button'); dn.id = 'nkf-down'; dn.setAttribute('aria-label', 'En alta in'); dn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:26px;height:26px"><path d="M12 16.500 5 9.500l1.400-1.400L12 13.700l5.600-5.600L19 9.500z"/></svg>'; d.appendChild(dn);
    var bd = d.querySelector('#nkf-body'), upd = function () { var far = bd.scrollHeight - bd.scrollTop - bd.clientHeight > 260, ft = document.getElementById('nkf-foot'); dn.style.bottom = ((ft && ft.style.display !== 'none' ? ft.offsetHeight : 0) + 18) + 'px'; dn.classList.toggle('on', far && !!(S.view && S.view.t !== 'gset')); };
    bd.addEventListener('scroll', upd, { passive: true }); dn.onclick = function () { bd.scrollTo({ top: bd.scrollHeight, behavior: 'smooth' }); };
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
    d.querySelector('#nkf-back').onclick = function () { if (S.view && S.view.t === 'gset') { S.view = { t: 'group', id: S.view.id }; S.fresh = true; } else if (S.view && S.view.t === 'share' && S.back) { S.view = S.back; S.back = null; S.fresh = true; } else S.view = null; render(); };
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
    try { await ensureMe(); S.needName = !S.me.name || S.me.name === 'Öğrenci'; await refreshLists(); await pullInbox(); if (S.admin === undefined || S.admin === null) { rpc('nk_admin_stats', { p_code: code() }).then(function (r) { S.admin = r && r.ok ? r : false; if (S.admin && S.tab === 'arkadas' && !S.view) render(); }).catch(function () {}); } }
    catch (e) { var i = document.getElementById('nkfi'); if (i) i.innerHTML = '<div class="card" style="text-align:center"><div style="font-size:34px">📡</div><b>Bağlantı kurulamadı</b><div class="sub" style="margin:4px 0 10px">İnternetini kontrol edip tekrar dene.</div><button class="b" id="nkf-retry">Tekrar dene</button></div>'; var rb = document.getElementById('nkf-retry'); if (rb) rb.onclick = function () { S.me = null; onTab(); }; return; }
    render();
  }
  function isActive() { var t = document.getElementById('arkadas'), o = document.getElementById('nkf'); return !!((t && t.classList.contains('active')) || (o && o.classList.contains('on'))); }
  async function tick() {
    if (!isActive() || document.hidden) return;
    var typing = document.activeElement && document.activeElement.id === 'nkf-msg' && document.activeElement.value;
    var focusIn = document.activeElement && /^(nkf-gname|nkf-name|nkf-add|nkf-gn|nkf-gedn)$/.test(document.activeElement.id || '');
    try { var n = await pullInbox(); if (n > 0 && !typing && !focusIn && !(S.view && S.view.t === 'gset') && !(S.tab === 'arkadas' && !S.view) && !(S.tab === 'grup' && !S.view)) render(); else badge(); } catch (e) {}
  }

  function fmt(x) { return window.__nkFmt ? window.__nkFmt(x) : esc(x); }
  function avColor(n) { var P = ['#0d9488', '#6366f1', '#ec4899', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#22c55e']; var h = 0; String(n || '?').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return P[h % P.length]; }
  var ICON = {
    group: ['#0d9488', '#14b8a6', '<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3 19c0-3.300 2.700-5.500 6-5.500s6 2.200 6 5.500zM15.500 14.200c2.800-.5 5.500 1.200 5.500 4.300h-4.500c0-1.700-.4-3.200-1-4.300z"/>'],
    bat: ['#2e1065', '#7f1d1d', '<path d="M12 6.500c-.9 0-1.300.9-1.700 1.400L7.500 6.200 4.200 5 2 8l2 1.200c.4 1.300 1 3 2.200 4.300l2.300-1 1.200 3.500L12 14l2.300 2 1.200-3.500 2.300 1c1.200-1.300 1.800-3 2.200-4.300L22 8l-2.200-3-3.300 1.200-2.800 1.700c-.4-.5-.8-1.400-1.700-1.400z"/>'],
    moon: ['#1e1b4b', '#6d28d9', '<path d="M20 14.800A8.500 8.500 0 0 1 9.200 4 8.500 8.500 0 1 0 20 14.800z"/><circle cx="17.500" cy="5.500" r="1.200"/><circle cx="20.500" cy="9" r=".8"/>'],
    drop: ['#7f1d1d', '#dc2626', '<path d="M12 2.500c3.200 4.200 6 7.600 6 11a6 6 0 0 1-12 0c0-3.400 2.800-6.800 6-11z"/>'],
    coffin: ['#292524', '#7f1d1d', '<path d="M9.300 2h5.400l4.300 6.500-3 13.500H8L5 8.500z"/><path d="M12 7v8M9 10h6" stroke="#0008" stroke-width="1.600" fill="none"/>'],
    castle: ['#1f2937', '#5b21b6', '<path d="M3 21V8h3v2h2V8h2v2h4V8h2v2h2V8h3v13h-7v-4.500a3 3 0 0 0-6 0V21z"/>'],
    book: ['#0f766e', '#0d9488', '<path d="M4 4.500h6.200A2 2 0 0 1 12 5.600 2 2 0 0 1 13.800 4.500H20V19h-6.200a1.200 1.200 0 0 0-1.800 1 1.200 1.200 0 0 0-1.800-1H4z"/>'],
    target: ['#be123c', '#f43f5e', '<circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="1.900"/>'],
    trophy: ['#b45309', '#f59e0b', '<path d="M7 3h10v5.500a5 5 0 0 1-10 0z"/><path d="M7 5H3.500v1.500A3.500 3.500 0 0 0 7 10M17 5h3.500v1.500A3.500 3.500 0 0 1 17 10" fill="none" stroke="#fff" stroke-width="1.800"/><path d="M11 14h2v3h3.500v3h-9v-3H11z"/>'],
    bolt: ['#4338ca', '#6366f1', '<path d="M13.500 2 4.500 13.500H11L10 22l9-11.500h-6.500z"/>'],
    star: ['#a16207', '#eab308', '<path d="M12 2.500l2.900 6.100 6.600.8-4.900 4.600 1.300 6.600L12 17.300 6.100 20.600l1.300-6.600L2.500 9.400l6.600-.8z"/>']
  };
  var ICON_KEYS = ['bat', 'moon', 'drop', 'coffin', 'castle', 'book', 'target', 'trophy', 'bolt', 'star', 'group'];
  function iconHTML(ic, size) {
    if (ic && ic.indexOf('data:') === 0) return '<div class="av" style="width:' + size + 'px;height:' + size + 'px;background:#0003;overflow:hidden"><img src="' + ic + '" style="width:100%;height:100%;object-fit:cover"></div>';
    var k = ic && ic.indexOf('i:') === 0 ? ic.slice(2) : 'group', d = ICON[k] || ICON.group;
    return '<div class="av" style="width:' + size + 'px;height:' + size + 'px;background:linear-gradient(135deg,' + d[0] + ',' + d[1] + ')"><svg viewBox="0 0 24 24" fill="#fff" style="width:58%;height:58%">' + d[2] + '</svg></div>';
  }
  function av(name, size, ic) { if (ic) return iconHTML(ic, size); var c = avColor(name); return '<div class="av" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.42) + 'px;background:linear-gradient(135deg,' + c + ',' + c + 'bb)">' + esc(String(name || '?').trim().charAt(0).toUpperCase()) + '</div>'; }

  function render(loading) {
    var ov = document.getElementById('nkf'), inn, foot = document.getElementById('nkf-foot'), title = document.getElementById('nkf-title');
    if (S.view) {
      ov.classList.add('on'); inn = document.getElementById('nkf-in'); foot.style.display = 'none';
      var t = S.view.t; document.getElementById('nkf-gear').style.display = 'none'; document.getElementById('nkf-down').classList.remove('on'); setTimeout(function () { var b = document.getElementById('nkf-body'); if (b) b.dispatchEvent(new Event('scroll')); }, 80);
      return t === 'share' ? viewShare(inn, foot, title) : t === 'group' ? viewGroup(inn, foot, title) : t === 'gset' ? viewGset(inn, foot, title) : t === 'stats' ? viewStats(inn, foot, title) : viewDm(inn, foot, title);
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
  function setLocalName(n) { try { localStorage.setItem('nk_fr_name', n); } catch (e) {} try { var p = JSON.parse(localStorage.getItem('nk_profile') || 'null'); if (p && typeof p === 'object') { p.name = n; localStorage.setItem('nk_profile', JSON.stringify(p)); } } catch (e) {} }
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
      arr.push({ v: { t: 'group', id: g.id }, name: g.name, ic: g.icon || 'i:group', last: last, at: lt, u: unreadGroup(g.id) });
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
      return '<div class="card" data-i="' + i + '" style="cursor:pointer;padding:12px"><div class="row">' + av(x.name, 52, isG ? x.ic : null) + '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:16px;display:flex;gap:6px;align-items:center">' + esc(x.name) + (isG ? '<span class="pill">Grup</span>' : '') + '</div><div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">' + (x.last || 'Mesaj yaz...') + '</div></div><div style="text-align:right;display:flex;flex-direction:column;gap:6px;align-items:flex-end">' + (x.at ? '<div class="sub">' + hhmm(x.at) + '</div>' : '') + (x.u > 0 ? '<span class="dot">' + x.u + '</span>' : '<span></span>') + '</div></div></div>';
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
    if (S.admin) { var sc = document.createElement('div'); sc.className = 'card'; sc.id = 'nkf-stat'; sc.style.cssText = 'cursor:pointer;margin-top:14px;display:flex;align-items:center;gap:12px'; sc.innerHTML = '<div style="font-size:26px">📊</div><div style="flex:1"><div style="font-weight:800">Kullanım</div><div class="sub">Genel durum</div></div><span style="opacity:.4;font-size:20px">›</span>'; inn.appendChild(sc); sc.onclick = function () { S.view = { t: 'stats' }; render(); }; }
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
    h += S.groups.length ? S.groups.map(function (g) { var u = unreadGroup(g.id); return '<div class="card" data-g="' + g.id + '" style="cursor:pointer"><div class="row">' + av(g.name, 52, g.icon || 'i:group') + '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:16px">' + esc(g.name) + '</div><div class="sub">' + (g.members || []).length + ' kişi · ' + (g.members || []).map(function (m) { return esc(m.name); }).join(', ') + '</div></div>' + (u > 0 ? '<span class="dot">' + u + '</span>' : '<span style="opacity:.4;font-size:20px">›</span>') + '</div></div>'; }).join('') : empty('🫶', 'Henüz grup yok', 'Yukarıdan arkadaşlarını seçip bir grup kur.', null);
    inn.innerHTML = h;
    var gn = document.getElementById('nkf-gn'); gn.oninput = function () { S.gname = gn.value; };
    inn.querySelectorAll('.nkf-gc').forEach(function (c) { c.onclick = function () { var i = S.sel.indexOf(c.dataset.f); if (i >= 0) S.sel.splice(i, 1); else S.sel.push(c.dataset.f); render(); }; });
    document.getElementById('nkf-gmk').onclick = async function () {
      var n = gn.value.trim();
      if (!n) return toast('Önce grup adı yaz', true);
      if (!S.sel.length) return toast('En az bir arkadaş seç', true);
      try { var r = await rpc('nk_group_create', { p_code: code(), p_name: n, p_fcodes: S.sel }); if (!r.ok) return toast('Grup kurulamadı', true); S.sel = []; S.gname = ''; await refreshLists(); toast('Grup kuruldu ✓'); render(); } catch (e) { toast('Grup kurulamadı', true); }
    };
    inn.querySelectorAll('[data-g]').forEach(function (c) { c.onclick = function () { S.view = { t: 'group', id: c.dataset.g }; S.gopen = null; S.gedit = null; render(); }; });
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
      return '<div data-mid="' + m.id + '" style="display:flex;flex-direction:column;align-items:' + (m.mine ? 'flex-end' : 'flex-start') + '">' + (m.mine || !m.who ? '' : '<span class="sub" style="margin-left:6px">' + esc(m.who) + '</span>') + '<div class="bub ' + (m.mine ? 'me' : 'ot') + '" style="cursor:pointer">' + quote + (m.img ? '<img class="chim" src="' + m.img + '">' : '') + (m.body ? fmt(m.body) : '') + '<span style="font-size:9px;opacity:.6;margin-left:8px;float:right;margin-top:6px">' + hhmm(m.at) + (m.mine && m.dm ? '<span style="font-size:11px;margin-left:3px;' + (m.read ? 'color:#7dd3fc' : '') + '">' + (m.read ? '✓✓' : '✓') + '</span>' : '') + '</span></div>' + reactHTML(m.id, m.mine) + (m.seenBy ? '<div class="sub" style="font-size:10px;margin:0 4px 4px">Görenler: ' + esc(m.seenBy) + '</div>' : '') + '</div>';
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
  // onSend(text, imgDataURL); opts.pick: soru/not seç butonu (hedef verilir)
  function footInput(foot, onSend, opts) {
    opts = opts || {};
    foot.style.display = 'block';
    foot.innerHTML = (S.reply ? '<div style="display:flex;gap:8px;align-items:center;border-left:3px solid #0d9488;background:rgba(13,148,136,.12);border-radius:8px;padding:6px 10px;margin-bottom:6px"><div style="flex:1;min-width:0;font-size:12px"><b>' + esc(S.reply.who) + '</b><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.8">' + esc(S.reply.text) + '</div></div><button id="nkf-rx" class="g" style="padding:4px 10px">✕</button></div>' : '') + '<div id="nkf-pend" style="display:' + (S.pend ? 'flex' : 'none') + ';gap:8px;align-items:center;margin-bottom:6px">' + (S.pend ? '<img src="' + S.pend + '" style="height:56px;border-radius:10px"><button class="g" id="nkf-pendx">Kaldır</button>' : '') + '</div>' +
      '<div id="nkf-emo" class="emo" style="display:none">' + EMO.map(function (e) { return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><button class="g" id="nkf-eb" style="padding:0;font-size:22px;width:46px;height:48px;flex:none">😊</button><button class="g" id="nkf-cb" style="padding:0;font-size:22px;width:46px;height:48px;flex:none">📷</button><button class="g" id="nkf-pb" style="padding:0;font-size:22px;width:46px;height:48px;flex:none">🖼️</button>' + (opts.pick ? '<button class="g" id="nkf-qb" style="padding:0 14px;font-size:15px;height:48px;flex:none">❓ Soru/Not</button>' : '') + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center"><input id="nkf-msg" placeholder="Mesaj yaz..." maxlength="1000" style="flex:1;min-width:0"><button class="b" id="nkf-send" style="flex:none">Gönder</button></div>';
    var inp = document.getElementById('nkf-msg');
    document.getElementById('nkf-eb').onclick = function () { var e = document.getElementById('nkf-emo'); e.style.display = e.style.display === 'none' ? 'flex' : 'none'; };
    document.querySelectorAll('#nkf-emo button').forEach(function (b) { b.onclick = function () { var p = inp.selectionStart == null ? inp.value.length : inp.selectionStart; inp.value = inp.value.slice(0, p) + b.dataset.e + inp.value.slice(p); inp.focus(); try { inp.setSelectionRange(p + b.dataset.e.length, p + b.dataset.e.length); } catch (x) {} }; });
    var getPhoto = function (src) {
      if (!window.__nkEdit) return toast('Fotoğraf modülü yüklenmedi', true);
      var v = inp.value;
      window.__nkEdit.photo(src, 1280, function (url) { S.pend = url; footInput(foot, onSend, opts); document.getElementById('nkf-msg').value = v; });
    };
    document.getElementById('nkf-pb').onclick = function () { getPhoto('gallery'); };
    document.getElementById('nkf-cb').onclick = function () { getPhoto('camera'); };
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
    if (s.incoming) h += '<div style="margin-top:8px">' + (s.added ? '<span class="sub" style="color:#0d9488">✓ Arşivine eklendi</span>' : '<button class="b" id="nkf-addarch">✚ Arşivime ekle</button> <button class="g" id="nkf-editarch" style="margin-left:8px">✏️ Düzenleyip ekle</button>') + '</div>';
    if (d.text_question) h += '<div style="margin-top:6px;font-size:14px">' + fmt(d.text_question) + '</div>';
    if (d.note) h += '<div style="margin-top:6px;font-size:14px">' + fmt(d.note) + '</div>';
    if (d.img) h += '<img class="qi" src="' + d.img + '">';
    if (s.kind === 'question' && d.answer) h += '<details style="margin-top:8px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Doğru cevap</summary><div style="margin-top:4px">' + esc(d.answer) + '</div></details>';
    if (d.note_text) h += '<details style="margin-top:6px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Çözüm notu</summary><div style="margin-top:4px">' + fmt(d.note_text) + '</div></details>';
    if (d.note_img) h += '<img class="qi" src="' + d.note_img + '">';
    if (d.note_back) h += '<details style="margin-top:6px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Arka yüz</summary><div style="margin-top:4px">' + fmt(d.note_back) + '</div></details>';
    if (d.note_back_img) h += '<img class="qi" src="' + d.note_back_img + '">';
    h += '</div><div>' + chatHTML(s.msgs || []) + '</div>';
    inn.innerHTML = h;
    wireInn(inn); inn.querySelectorAll('[data-s]').forEach(function (c) { c.onclick = null; });
    var ab = document.getElementById('nkf-addarch'); if (ab) ab.onclick = function () { addToArchive(s); };
    var eb = document.getElementById('nkf-editarch'); if (eb) eb.onclick = function () { if (!window.__nkEdit) return toast('Modül yüklenmedi', true); window.__nkEdit.open({ kind: s.kind, data: d, title: 'Düzenleyip arşive ekle', saveLabel: 'Arşive ekle', onSave: function (nd) { return addToArchive(s, nd); } }); };
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
    title.innerHTML = '<span style="display:inline-flex;align-items:center;gap:10px">' + av(g.name, 34, g.icon || 'i:group') + esc(g.name) + '</span>';
    var msgs = S.gmsgs[g.id] ? Object.keys(S.gmsgs[g.id]).map(function (k) { return S.gmsgs[g.id][k]; }) : [];
    S.seen['g' + g.id] = msgs.filter(function (m) { return !m.mine; }).length; saveSeen(); badge();
    var newest = msgs.reduce(function (a, m) { return Math.max(a, new Date(m.at).getTime()); }, 0);
    if (newest && S.gRead[g.id] !== newest) { S.gRead[g.id] = newest; rpc('nk_group_read', { p_code: code(), p_group: g.id }).catch(function () {}); }
    var lastMine = null; msgs.forEach(function (m) { if (m.mine) lastMine = m; });
    if (lastMine) { var gr = S.greads[g.id] || {}, seen = Object.keys(gr).filter(function (n) { return new Date(gr[n]) >= new Date(lastMine.at); }); msgs = msgs.map(function (m) { if (m !== lastMine) return m; var c = {}; for (var k in m) c[k] = m[k]; c.seenBy = seen.length ? seen.join(', ') : ''; return c; }); }
    var gs = Object.keys(S.shares).map(function (k) { return S.shares[k]; }).filter(function (s) { return s.group_id === g.id; });
    var tl = timeline(msgs, gs);
    inn.innerHTML = tl.length ? chatHTML(tl) : '<div class="sub" style="text-align:center;margin-top:20px">Henüz mesaj yok.</div>';
    wireInn(inn); scrollEnd();
    var gear = document.getElementById('nkf-gear'); gear.style.display = 'inline-flex';
    gear.onclick = function () { S.gedit = null; S.view = { t: 'gset', id: g.id }; render(); setTimeout(function () { var bd = document.getElementById('nkf-body'); if (bd) bd.scrollTop = 0; }, 30); };
    footInput(foot, function (v, im, rid) { return rpc('nk_group_msg', { p_code: code(), p_group: g.id, p_body: v, p_img: im || null, p_reply: rid || null }); }, { pick: { g: g.id } });
  }

  async function viewStats(inn, foot, title) {
    title.textContent = 'Kullanım';
    inn.innerHTML = skeleton();
    var r; try { r = await rpc('nk_admin_stats', { p_code: code() }); } catch (e) { inn.innerHTML = '<div class="card">Bağlantı kurulamadı.</div>'; return; }
    if (!S.view || S.view.t !== 'stats') return;
    if (!r || !r.ok) { inn.innerHTML = '<div class="card">Yetkin yok.</div>'; return; }
    var now = Date.now(), u = r.users || [], d = r.daily || [];
    var act = function (h) { return u.filter(function (x) { return now - new Date(x.son).getTime() < h * 3600000; }).length; };
    var mx = d.reduce(function (a, x) { return Math.max(a, x.n); }, 1);
    var h = '<div style="display:flex;gap:8px;margin-bottom:10px">' + [['Toplam', u.length], ['Bugün', act(24)], ['Son 7 gün', act(168)]].map(function (x) { return '<div class="card" style="flex:1;text-align:center;margin:0;padding:12px 6px"><div style="font-size:26px;font-weight:900;color:#0d9488">' + x[1] + '</div><div class="sub">' + x[0] + '</div></div>'; }).join('') + '</div>';
    h += '<div class="card"><div style="font-weight:800;margin-bottom:8px">Günlük aktif kişi (14 gün)</div><div style="display:flex;align-items:flex-end;gap:4px;height:90px">' + d.map(function (x) { return '<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%"><div style="font-size:10px;opacity:.7">' + (x.n || '') + '</div><div style="width:100%;border-radius:4px 4px 0 0;background:#0d9488;height:' + Math.max(3, Math.round(x.n / mx * 64)) + 'px;opacity:' + (x.n ? 1 : .25) + '"></div></div>'; }).join('') + '</div><div style="display:flex;justify-content:space-between;font-size:10px;opacity:.6;margin-top:4px"><span>' + String(d[0] && d[0].d || '').slice(5) + '</span><span>' + String(d.length && d[d.length - 1].d || '').slice(5) + '</span></div></div>';
    h += u.map(function (x) {
      var ago = Math.round((now - new Date(x.son).getTime()) / 3600000), at = ago < 1 ? 'az önce' : ago < 24 ? ago + ' sa önce' : Math.round(ago / 24) + ' gün önce';
      return '<div class="card"><div class="row">' + av(x.name, 40) + '<div style="flex:1;min-width:0"><div style="font-weight:800">' + esc(x.name) + '</div><div class="sub">' + x.soru + ' soru · ' + x['not'] + ' not · ' + x.mesaj + ' mesaj · ' + x.gun + ' aktif gün</div></div><div class="sub" style="text-align:right">' + at + '</div></div><div style="display:flex;gap:3px;margin-top:8px">' + (x.hafta || []).map(function (a) { return '<div style="flex:1;height:8px;border-radius:3px;background:' + (a ? '#0d9488' : 'rgba(128,128,128,.25)') + '"></div>'; }).join('') + '</div></div>';
    }).join('');
    inn.innerHTML = h;
  }
  function viewGset(inn, foot, title) {
    var g = S.groups.filter(function (x) { return x.id === S.view.id; })[0]; if (!g) { S.view = null; return render(); }
    title.textContent = 'Grup ayarları';
    var addable = S.friends.filter(function (f) { return !(g.members || []).some(function (m) { return m.fcode === f.fcode; }); });
    var cur = S.gedit && S.gedit.id === g.id ? S.gedit : (S.gedit = { id: g.id, name: g.name, icon: g.icon || 'i:group' });
    var sel = function (on) { return 'border:3px solid ' + (on ? '#0d9488' : 'transparent') + ';border-radius:50%;padding:2px;background:none;flex:none'; };
    var isImg = cur.icon.indexOf('data:') === 0;
    var h = '<div class="card"><div style="display:flex;justify-content:center">' + iconHTML(cur.icon, 84) + '</div>' +
      '<div class="sub" style="margin:14px 0 6px">Grup adı</div><input id="nkf-gedn" maxlength="30" value="' + esc(cur.name) + '">' +
      '<div class="sub" style="margin:14px 0 8px">Grup ikonu</div><div style="display:flex;gap:6px;flex-wrap:wrap">' + ICON_KEYS.map(function (k) { return '<button class="nkf-gic" data-ic="i:' + k + '" style="' + sel(cur.icon === 'i:' + k) + '">' + iconHTML('i:' + k, 48) + '</button>'; }).join('') +
      '<button class="nkf-gic" id="nkf-gup" style="' + sel(isImg) + '">' + (isImg ? iconHTML(cur.icon, 48) : '<div class="av" style="width:48px;height:48px;background:rgba(128,128,128,.2);color:inherit;font-size:22px">🖼️</div>') + '</button></div><div class="sub" style="margin-top:6px">Sondaki kutu: galeriden kendi görselini yükle</div>' +
      '<button class="b" id="nkf-gsave" style="width:100%;margin-top:16px">Kaydet</button></div>' +
      '<div class="card"><div style="font-weight:800;margin-bottom:6px">Üyeler (' + (g.members || []).length + ')</div>' + (g.members || []).map(function (m) { return '<div class="row" style="padding:6px 0">' + av(m.name, 40) + '<div style="flex:1;min-width:0;font-weight:700">' + esc(m.name) + (m.owner ? ' <span class="pill">Kurucu</span>' : '') + '</div>' + (g.owner && !m.owner ? '<button class="g nkf-rm" data-f="' + esc(m.fcode) + '" data-n="' + esc(m.name) + '" style="flex:none;color:#e11d48;padding:8px 12px">Çıkar</button>' : '') + '</div>'; }).join('') +
      (addable.length ? '<div class="sub" style="margin:14px 0 6px">Gruba ekle</div><div style="display:flex;gap:8px;flex-wrap:wrap">' + addable.map(function (f) { return '<button class="nkf-ga" data-f="' + esc(f.fcode) + '" style="padding:8px 14px 8px 8px;border-radius:26px;font-weight:700;font-size:14px;border:2px solid #0d9488;display:flex;align-items:center;gap:8px;min-height:46px">' + av(f.name, 30) + '＋ ' + esc(f.name) + '</button>'; }).join('') + '</div>' : '<div class="sub" style="margin-top:12px">Tüm arkadaşların zaten grupta.</div>') + '</div>' +
      '<button class="g" id="nkf-leave" style="color:#e11d48;width:100%">Gruptan ayrıl</button>';
    inn.innerHTML = h;
    var gn = document.getElementById('nkf-gedn'); gn.oninput = function () { cur.name = gn.value; };
    inn.querySelectorAll('.nkf-gic[data-ic]').forEach(function (b) { b.onclick = function () { cur.icon = b.dataset.ic; cur.name = gn.value; render(); }; });
    document.getElementById('nkf-gup').onclick = function () {
      cur.name = gn.value;
      if (!window.__nkEdit) return toast('Modül yüklenmedi', true);
      window.__nkEdit.photo('gallery', 160, function (url) { if (url.length > 60000) return toast('Görsel çok büyük', true); cur.icon = url; render(); });
    };
    document.getElementById('nkf-gsave').onclick = async function () {
      var n = gn.value.trim(); if (!n) return toast('Grup adı boş olamaz', true);
      try { var r = await rpc('nk_group_update', { p_code: code(), p_group: g.id, p_name: n, p_icon: cur.icon }); if (!r.ok) return toast('Kaydedilemedi', true); S.gedit = null; await refreshLists(); toast('Grup güncellendi ✓'); render(); } catch (e) { toast('Kaydedilemedi', true); }
    };
    inn.querySelectorAll('.nkf-ga').forEach(function (b) { b.onclick = async function () { try { await rpc('nk_group_add', { p_code: code(), p_group: g.id, p_fcodes: [b.dataset.f] }); await refreshLists(); toast('Üye eklendi ✓'); render(); } catch (e) { toast('Olmadı', true); } }; });
    inn.querySelectorAll('.nkf-rm').forEach(function (b) {
      var armed = false;
      b.onclick = async function () {
        if (!armed) { armed = true; b.textContent = 'Emin misin?'; toast(b.dataset.n + ' çıkarılacak, bir kez daha bas'); setTimeout(function () { armed = false; if (b) b.textContent = 'Çıkar'; }, 4000); return; }
        try { var r = await rpc('nk_group_remove', { p_code: code(), p_group: g.id, p_fcode: b.dataset.f }); if (!r.ok) return toast(r.err || 'Olmadı', true); await refreshLists(); toast(b.dataset.n + ' gruptan çıkarıldı'); render(); } catch (e) { toast('Olmadı', true); }
      };
    });
    var lv = document.getElementById('nkf-leave'), armed = false;
    lv.onclick = async function () {
      if (!armed) { armed = true; lv.textContent = 'Emin misin? Tekrar bas'; toast('Ayrılmak için bir kez daha bas'); setTimeout(function () { armed = false; if (lv) lv.textContent = 'Gruptan ayrıl'; }, 4000); return; }
      try { await rpc('nk_group_leave', { p_code: code(), p_group: g.id }); await refreshLists(); S.view = null; S.gedit = null; toast('Gruptan ayrıldın'); render(); } catch (e) { toast('Ayrılamadın, tekrar dene', true); }
    };
  }

  /* ---------- Arşive ekle ---------- */
  async function addToArchive(s, override) {
    var d = override || s.data || {}, now = getNowTR(), id = Date.now();
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
