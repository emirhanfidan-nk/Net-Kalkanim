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
  var S = { me: null, friends: [], groups: [], shares: {}, gmsgs: {}, dms: {}, greads: {}, since: null, tab: 'sohbet', view: null, seen: {}, pend: null, back: null, gRead: {}, dmRead: {} };
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
    S.since = r.now;
    badge();
    return (r.shares || []).length + (r.gmsgs || []).length + (r.dms || []).length;
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
  var css = '#nkf{position:fixed;inset:0;z-index:150;background:var(--nkf-bg,#f8fafc);color:var(--nkf-fg,#0f172a);display:none;flex-direction:column;font-family:inherit}' +
    '#nkf.on{display:flex}body.dark-mode #nkf{--nkf-bg:#0b0b14;--nkf-fg:#eef0ff;--nkf-card:#15152233;--nkf-line:#ffffff22}' +
    '#nkf .w{width:100%;max-width:560px;margin:0 auto;padding:0 14px}' +
    '#nkf .card{background:var(--nkf-card,#fff);border:1px solid var(--nkf-line,#e2e8f0);border-radius:16px;padding:12px;margin-bottom:10px}' +
    '#nkf button.b{background:#0d9488;color:#fff;font-weight:700;font-size:12px;padding:9px 14px;border-radius:12px}' +
    '#nkf button.g{background:transparent;border:1px solid var(--nkf-line,#cbd5e1);font-weight:700;font-size:12px;padding:8px 12px;border-radius:12px}' +
    '#nkf input,#nkf textarea{width:100%;border:1px solid var(--nkf-line,#cbd5e1);background:transparent;color:inherit;border-radius:12px;padding:10px 12px;font-size:14px}' +
    '#nkf .tab{flex:1;padding:10px 0;font-weight:700;font-size:13px;border-bottom:3px solid transparent;opacity:.55}#nkf .tab.on{border-color:#0d9488;opacity:1}' +
    '#nkf .dot{display:inline-flex;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:10px;font-weight:800;align-items:center;justify-content:center;padding:0 5px}' +
    '#nkf .bub{max-width:80%;padding:8px 11px;border-radius:14px;font-size:13px;margin:4px 0;line-height:1.35;word-break:break-word}' +
    '#nkf .me{margin-left:auto;background:#0d9488;color:#fff}#nkf .ot{background:var(--nkf-card,#e2e8f0);border:1px solid var(--nkf-line,transparent)}' +
    '#nkf img.qi{width:100%;border-radius:12px;margin-top:8px}#nkf .sub{font-size:11px;opacity:.65;font-weight:600}' +
    '#nkf img.chim{max-width:200px;max-height:220px;border-radius:12px;display:block;cursor:zoom-in}#nkf .emo{display:flex;gap:2px;flex-wrap:wrap;padding:6px 0;max-height:96px;overflow:auto}#nkf .emo button{font-size:22px;padding:3px 5px}#nkf-viewer{position:fixed;inset:0;z-index:170;background:rgba(0,0,0,.94);display:none;flex-direction:column;align-items:center;justify-content:center}#nkf-viewer.on{display:flex}#nkf-viewer .vb{position:absolute;left:0;right:0;bottom:max(14px,env(safe-area-inset-bottom));display:flex;gap:10px;justify-content:center}#nkf-viewer .vb button{margin:3px;background:#fff;color:#0f172a;font-weight:800;font-size:14px;padding:11px 16px;border-radius:14px}#nkf-pick{position:fixed;inset:0;z-index:160;background:rgba(0,0,0,.6);display:none;align-items:flex-end;justify-content:center}#nkf-pick.on{display:flex}' +
    '#nkf-pick>div{background:#fff;color:#0f172a;width:100%;max-width:560px;border-radius:22px 22px 0 0;padding:16px;max-height:75vh;overflow:auto}' +
    'body.dark-mode #nkf-pick>div{background:#14141f;color:#eef0ff}';
  function build() {
    if (document.getElementById('nkf')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'nkf';
    d.innerHTML = '<div class="w" style="padding-top:max(14px,env(safe-area-inset-top));display:flex;align-items:center;gap:10px"><button id="nkf-back" class="g" style="display:none">‹ Geri</button><div id="nkf-title" style="flex:1;font-weight:800;font-size:17px">Arkadaşlar</div><button id="nkf-close" class="g">Kapat</button></div>' +
      '<div class="w" id="nkf-tabs" style="display:flex;margin-top:6px"></div><div id="nkf-body" style="flex:1;overflow:auto;padding:12px 0 24px"><div class="w" id="nkf-in"></div></div>' +
      '<div id="nkf-foot" class="w" style="display:none;padding-bottom:max(10px,env(safe-area-inset-bottom));padding-top:8px"></div>';
    document.body.appendChild(d);
    var p = document.createElement('div'); p.id = 'nkf-pick'; document.body.appendChild(p);
    d.querySelector('#nkf-close').onclick = close;
    d.querySelector('#nkf-in').addEventListener('click', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && (t.classList.contains('chim') || t.classList.contains('qi'))) { e.stopPropagation(); openViewer(t.src); } }, true);
    d.querySelector('#nkf-back').onclick = function () { if (S.view && S.view.t === 'share' && S.back) { S.view = S.back; S.back = null; S.fresh = true; } else S.view = null; render(); };
    p.onclick = function (e) { if (e.target === p) p.classList.remove('on'); };
  }
  function addHeaderBtn() {
    if (document.getElementById('nkf-btn')) return;
    var ref = document.getElementById('nav-formul'); if (!ref) return;
    var b = document.createElement('button'); b.id = 'nkf-btn'; b.title = 'Arkadaşlar'; b.className = ref.className; b.style.position = 'relative';
    b.innerHTML = '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24" style="width:20px;height:20px"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg><span id="nkf-badge" style="display:none;position:absolute;top:-2px;right:-2px;min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;align-items:center;justify-content:center;padding:0 3px"></span>';
    b.onclick = open;
    ref.parentNode.insertBefore(b, ref);
  }
  var timer = null;
  async function open() {
    build();
    document.getElementById('nkf').classList.add('on');
    S.view = null; S.tab = 'sohbet';
    render('Yükleniyor...');
    try { await ensureMe(); await refreshLists(); await pullInbox(); }
    catch (e) { document.getElementById('nkf-in').innerHTML = '<div class="card">Bağlantı kurulamadı. İnternetini kontrol et.</div>'; return; }
    render();
    clearInterval(timer); timer = setInterval(tick, 8000);
  }
  function close() { var d = document.getElementById('nkf'); if (d) d.classList.remove('on'); clearInterval(timer); timer = null; badge(); }
  async function tick() {
    var d = document.getElementById('nkf');
    if (!d || !d.classList.contains('on') || document.hidden) return;
    var typing = document.activeElement && document.activeElement.id === 'nkf-msg' && document.activeElement.value;
    try { var n = await pullInbox(); if (n > 0 && !typing && S.tab !== 'arkadas' && !(S.tab === 'grup' && !S.view)) render(); else badge(); } catch (e) {}
  }

  function render(loading) {
    var tabs = document.getElementById('nkf-tabs'), inn = document.getElementById('nkf-in'), foot = document.getElementById('nkf-foot'), back = document.getElementById('nkf-back'), title = document.getElementById('nkf-title');
    foot.style.display = 'none'; back.style.display = S.view ? '' : 'none';
    if (loading) { inn.innerHTML = '<div class="card">' + loading + '</div>'; return; }
    if (S.view) { tabs.style.display = 'none'; var t = S.view.t; return t === 'share' ? viewShare(inn, foot, title) : t === 'group' ? viewGroup(inn, foot, title) : viewDm(inn, foot, title); }
    tabs.style.display = 'flex'; title.textContent = 'Arkadaşlar';
    var cu = 0, su = 0;
    Object.keys(S.dms).forEach(function (f) { var u = unreadDm(f); if (u > 0) cu += u; });
    Object.keys(S.gmsgs).forEach(function (g) { var u = unreadGroup(g); if (u > 0) cu += u; });
    Object.keys(S.shares).forEach(function (id) { var s = S.shares[id]; var u = unreadOf(s); if (u > 0 && (s.incoming || (s.msgs || []).length)) su += u; });
    var dot = function (n) { return n > 0 ? ' <span class="dot">' + (n > 9 ? '9+' : n) + '</span>' : ''; };
    tabs.innerHTML = [['sohbet', 'Sohbet' + dot(cu)], ['kutu', 'Sorular' + dot(su)], ['arkadas', 'Arkadaşlar'], ['grup', 'Gruplar']].map(function (t) { return '<button class="tab ' + (S.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '" style="font-size:12px">' + t[1] + '</button>'; }).join('');
    tabs.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { S.tab = b.dataset.t; render(); }; });
    if (S.tab === 'sohbet') tabSohbet(inn); else if (S.tab === 'kutu') tabKutu(inn); else if (S.tab === 'arkadas') tabArk(inn); else tabGrup(inn);
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
  function tabSohbet(inn) {
    var c = convos();
    if (!c.length) { inn.innerHTML = '<div class="card" style="text-align:center">Sohbet etmek için önce <b>Arkadaşlar</b> sekmesinden arkadaş ekle.</div>'; return; }
    inn.innerHTML = c.map(function (x, i) {
      return '<div class="card" data-i="' + i + '" style="cursor:pointer;display:flex;gap:10px;align-items:center"><div style="font-size:24px">' + x.ic + '</div><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">' + esc(x.name) + '</div><div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (x.last || 'Mesaj yaz...') + '</div></div>' + (x.at ? '<div class="sub">' + hhmm(x.at) + '</div>' : '') + (x.u > 0 ? '<span class="dot">' + x.u + '</span>' : '') + '</div>';
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
    if (!arr.length) { inn.innerHTML = '<div class="card" style="text-align:center">Henüz gönderi yok.<br><span class="sub">Arşivde bir sorunun yanındaki gönder butonuna bas, bir arkadaşa veya gruba yolla.</span></div>'; return; }
    inn.innerHTML = arr.map(function (s) {
      var u = unreadOf(s), d = s.data || {};
      return '<div class="card" data-s="' + s.id + '" style="cursor:pointer"><div style="display:flex;gap:8px;align-items:center"><span>' + (s.kind === 'question' ? '❓' : '📝') + '</span><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px">' + (s.group_id ? '👥 ' + esc(s.peer) + ' · ' : '') + (s.incoming ? esc(s.sender) + ' gönderdi' : 'Sen gönderdin' + (s.group_id ? '' : ' → ' + esc(s.peer))) + '</div><div class="sub">' + esc(d.course) + ' › ' + esc(d.topic) + '</div></div>' + (u > 0 && s.incoming || u > 0 && (s.msgs || []).length ? '<span class="dot">' + u + '</span>' : '') + '</div><div style="font-size:12px;margin-top:6px;opacity:.8">' + sharePreview(s) + '</div>' + (s.incoming && !s.added ? '<div class="sub" style="margin-top:4px;color:#0d9488">Henüz arşivine eklenmedi</div>' : '') + '</div>';
    }).join('');
    inn.querySelectorAll('[data-s]').forEach(function (c) { c.onclick = function () { S.back = null; S.view = { t: 'share', id: c.dataset.s }; render(); }; });
  }
  function lastAt(s) { var m = s.msgs && s.msgs.length ? s.msgs[s.msgs.length - 1].at : s.created_at; return new Date(m).getTime(); }

  function tabArk(inn) {
    inn.innerHTML = '<div class="card"><div class="sub">Görünen adın</div><div style="display:flex;gap:8px;margin-top:6px"><input id="nkf-name" maxlength="20" value="' + esc(S.me.name) + '"><button class="b" id="nkf-namebtn">Kaydet</button></div>' +
      '<label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;font-weight:700"><input type="checkbox" id="nkf-nt" style="width:auto"' + (S.me.notify === false ? '' : ' checked') + '> Yeni mesaj bildirimi (Ayarlar\'dan bildirimi de açık olmalı)</label><div class="sub" style="margin-top:12px">Arkadaş kodun (arkadaşlarına bunu ver, kurtarma kodunu kimseye verme)</div><div style="display:flex;gap:8px;align-items:center;margin-top:6px"><div style="font-size:24px;font-weight:900;letter-spacing:4px;flex:1">' + esc(S.me.fcode) + '</div><button class="g" id="nkf-copy">Kopyala</button></div></div>' +
      '<div class="card"><div class="sub">Arkadaş ekle</div><div style="display:flex;gap:8px;margin-top:6px"><input id="nkf-add" placeholder="Arkadaş kodu" maxlength="8" style="text-transform:uppercase"><button class="b" id="nkf-addbtn">Ekle</button></div></div>' +
      '<div style="font-weight:800;font-size:13px;margin:14px 2px 8px">Arkadaşların (' + S.friends.length + ')</div>' +
      (S.friends.length ? S.friends.map(function (f) { return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><b>' + esc(f.name) + '</b><span class="sub">' + esc(f.fcode) + '</span></div>'; }).join('') : '<div class="card sub">Henüz arkadaş yok.</div>');
    document.getElementById('nkf-nt').onchange = async function (e) { try { await rpc('nk_notify_set', { p_code: code(), p_on: e.target.checked }); S.me.notify = e.target.checked; toast(e.target.checked ? 'Mesaj bildirimi açık' : 'Mesaj bildirimi kapalı'); } catch (x) { toast('Olmadı', true); } };
    document.getElementById('nkf-copy').onclick = function () { try { navigator.clipboard.writeText(S.me.fcode); toast('Kod kopyalandı'); } catch (e) { toast('Kopyalanamadı', true); } };
    document.getElementById('nkf-namebtn').onclick = async function () {
      var n = document.getElementById('nkf-name').value.trim(); if (!n) return;
      try { S.me = await rpc('nk_me', { p_code: code(), p_name: n }); toast('Ad güncellendi'); } catch (e) { toast('Olmadı', true); }
    };
    document.getElementById('nkf-addbtn').onclick = async function () {
      var f = document.getElementById('nkf-add').value.trim(); if (!f) return;
      try { var r = await rpc('nk_friend_add', { p_code: code(), p_fcode: f }); if (r.ok) { toast(r.name + ' eklendi'); await refreshLists(); render(); } else toast(r.err || 'Olmadı', true); } catch (e) { toast('Bağlantı hatası', true); }
    };
  }
  function tabGrup(inn) {
    S.sel = S.sel || []; if (S.gname == null) S.gname = '';
    var h = '<div class="card"><div class="sub">Yeni grup</div><input id="nkf-gn" maxlength="30" placeholder="Grup adı" value="' + esc(S.gname) + '" style="margin:6px 0 10px">';
    h += '<div class="sub" style="margin-bottom:6px">Üyeleri seç (dokun)</div>';
    h += S.friends.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap">' + S.friends.map(function (f) { var on = S.sel.indexOf(f.fcode) >= 0; return '<button class="nkf-gc" data-f="' + esc(f.fcode) + '" style="padding:8px 14px;border-radius:20px;font-weight:700;font-size:13px;border:2px solid #0d9488;' + (on ? 'background:#0d9488;color:#fff' : 'background:transparent;color:inherit') + '">' + (on ? '✓ ' : '') + esc(f.name) + '</button>'; }).join('') + '</div>' : '<div class="sub">Önce Arkadaşlar sekmesinden arkadaş ekle.</div>';
    h += '<button class="b" id="nkf-gmk" style="margin-top:12px">Grubu oluştur' + (S.sel.length ? ' (' + (S.sel.length + 1) + ' kişi)' : '') + '</button></div>';
    h += S.groups.map(function (g) { var u = unreadGroup(g.id); return '<div class="card" data-g="' + g.id + '" style="cursor:pointer"><div style="display:flex;justify-content:space-between"><b>👥 ' + esc(g.name) + '</b>' + (u > 0 ? '<span class="dot">' + u + '</span>' : '') + '</div><div class="sub">' + (g.members || []).map(function (m) { return esc(m.name); }).join(', ') + '</div></div>'; }).join('');
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
  function chatHTML(list) {
    return list.map(function (m) {
      if (m.share) {
        var x = m.share, d = x.data || {};
        return '<div class="card" data-s="' + x.id + '" style="cursor:pointer;border-color:#0d9488;margin:8px 0"><div style="font-weight:800;font-size:12px">' + (x.kind === 'question' ? '❓ Soru' : '📝 Not') + ' · ' + (x.incoming ? esc(x.sender) : 'Sen') + '</div><div class="sub">' + esc(d.course) + ' › ' + esc(d.topic) + '</div>' + (d.img ? '<img class="chim" src="' + d.img + '" style="max-height:120px;margin-top:6px">' : '') + '<div style="font-size:12px;opacity:.85;margin-top:4px">' + sharePreview(x) + '</div><div class="sub" style="color:#0d9488;margin-top:4px">Aç · ' + ((x.msgs || []).length) + ' yanıt</div></div>';
      }
      return '<div style="display:flex;flex-direction:column;align-items:' + (m.mine ? 'flex-end' : 'flex-start') + '">' + (m.mine || !m.who ? '' : '<span class="sub" style="margin-left:6px">' + esc(m.who) + '</span>') + '<div class="bub ' + (m.mine ? 'me' : 'ot') + '">' + (m.img ? '<img class="chim" src="' + m.img + '">' : '') + (m.body ? esc(m.body) : '') + '<span style="font-size:9px;opacity:.6;margin-left:8px;float:right;margin-top:6px">' + hhmm(m.at) + (m.mine && m.dm ? '<span style="font-size:11px;margin-left:3px;' + (m.read ? 'color:#7dd3fc' : '') + '">' + (m.read ? '✓✓' : '✓') + '</span>' : '') + '</span></div>' + (m.seenBy ? '<div class="sub" style="font-size:10px;margin:0 4px 4px">Görenler: ' + esc(m.seenBy) + '</div>' : '') + '</div>';
    }).join('');
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
    foot.innerHTML = '<div id="nkf-pend" style="display:' + (S.pend ? 'flex' : 'none') + ';gap:8px;align-items:center;margin-bottom:6px">' + (S.pend ? '<img src="' + S.pend + '" style="height:56px;border-radius:10px"><button class="g" id="nkf-pendx">Kaldır</button>' : '') + '</div>' +
      '<div id="nkf-emo" class="emo" style="display:none">' + EMO.map(function (e) { return '<button type="button" data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' +
      '<div style="display:flex;gap:6px;align-items:center"><button class="g" id="nkf-eb" style="padding:8px 10px;font-size:16px">😊</button><button class="g" id="nkf-pb" style="padding:8px 10px;font-size:16px">📷</button>' + (opts.pick ? '<button class="g" id="nkf-qb" style="padding:8px 10px;font-size:16px">❓</button>' : '') +
      '<input id="nkf-msg" placeholder="Mesaj yaz..." maxlength="1000" style="flex:1;min-width:0"><button class="b" id="nkf-send">Gönder</button></div><input type="file" id="nkf-file" accept="image/*" style="display:none">';
    var inp = document.getElementById('nkf-msg');
    document.getElementById('nkf-eb').onclick = function () { var e = document.getElementById('nkf-emo'); e.style.display = e.style.display === 'none' ? 'flex' : 'none'; };
    document.querySelectorAll('#nkf-emo button').forEach(function (b) { b.onclick = function () { var p = inp.selectionStart == null ? inp.value.length : inp.selectionStart; inp.value = inp.value.slice(0, p) + b.dataset.e + inp.value.slice(p); inp.focus(); try { inp.setSelectionRange(p + b.dataset.e.length, p + b.dataset.e.length); } catch (x) {} }; });
    var fi = document.getElementById('nkf-file');
    document.getElementById('nkf-pb').onclick = function () { fi.click(); };
    fi.onchange = async function () { var f = fi.files && fi.files[0]; if (!f) return; try { S.pend = await compress(f); footInput(foot, onSend, opts); document.getElementById('nkf-msg').value = inp.value; } catch (e) { toast('Fotoğraf okunamadı', true); } };
    var px = document.getElementById('nkf-pendx'); if (px) px.onclick = function () { S.pend = null; var v = inp.value; footInput(foot, onSend, opts); document.getElementById('nkf-msg').value = v; };
    var qb = document.getElementById('nkf-qb'); if (qb) qb.onclick = function () { pickItem(opts.pick); };
    var busy = false;
    var go = async function () {
      var v = inp.value.trim(); if ((!v && !S.pend) || busy) return; busy = true;
      var im = S.pend; inp.value = ''; S.pend = null;
      try { await onSend(v, im); await pullInbox(); S.fresh = true; render(); } catch (e) { toast('Gönderilemedi', true); S.pend = im; inp.value = v; footInput(foot, onSend, opts); document.getElementById('nkf-msg').value = v; }
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
    if (d.text_question) h += '<div style="margin-top:6px;font-size:14px">' + esc(d.text_question) + '</div>';
    if (d.note) h += '<div style="margin-top:6px;font-size:14px">' + esc(d.note) + '</div>';
    if (d.img) h += '<img class="qi" src="' + d.img + '">';
    if (s.kind === 'question' && d.answer) h += '<details style="margin-top:8px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Doğru cevap</summary><div style="margin-top:4px">' + esc(d.answer) + '</div></details>';
    if (d.note_text) h += '<details style="margin-top:6px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Çözüm notu</summary><div style="margin-top:4px">' + esc(d.note_text) + '</div></details>';
    if (d.note_img) h += '<img class="qi" src="' + d.note_img + '">';
    if (d.note_back) h += '<details style="margin-top:6px"><summary style="font-weight:700;font-size:13px;cursor:pointer">Arka yüz</summary><div style="margin-top:4px">' + esc(d.note_back) + '</div></details>';
    if (d.note_back_img) h += '<img class="qi" src="' + d.note_back_img + '">';
    if (s.incoming) h += '<div style="margin-top:10px">' + (s.added ? '<span class="sub" style="color:#0d9488">✓ Arşivine eklendi</span>' : '<button class="b" id="nkf-addarch">Arşivime ekle</button>') + '</div>';
    h += '</div><div>' + chatHTML(s.msgs || []) + '</div>';
    inn.innerHTML = h;
    wireInn(inn); inn.querySelectorAll('[data-s]').forEach(function (c) { c.onclick = null; });
    var ab = document.getElementById('nkf-addarch'); if (ab) ab.onclick = function () { addToArchive(s); };
    footInput(foot, function (v, im) { return rpc('nk_msg_send', { p_code: code(), p_share: s.id, p_body: v, p_img: im || null }); });
  }
  function timeline(msgs, shares) {
    var arr = msgs.map(function (m) { return { at: new Date(m.at).getTime(), m: m }; });
    shares.forEach(function (x) { arr.push({ at: new Date(x.created_at).getTime(), m: { share: x } }); });
    arr.sort(function (a, b) { return a.at - b.at; });
    return arr.map(function (x) { return x.m; });
  }
  function viewDm(inn, foot, title) {
    var f = S.friends.filter(function (x) { return x.fcode === S.view.f; })[0]; if (!f) { S.view = null; return render(); }
    title.textContent = '👤 ' + f.name;
    var l = dmList(f.fcode); S.seen['d' + f.fcode] = l.filter(function (m) { return !m.mine; }).length; saveSeen(); badge();
    var incoming = l.filter(function (m) { return !m.mine; }).length;
    if (incoming && S.dmRead[f.fcode] !== incoming) { S.dmRead[f.fcode] = incoming; rpc('nk_dm_read', { p_code: code(), p_fcode: f.fcode }).catch(function () {}); }
    l = l.map(function (m) { var c = {}; for (var k in m) c[k] = m[k]; c.dm = true; return c; });
    var ss = Object.keys(S.shares).map(function (k) { return S.shares[k]; }).filter(function (x) { return !x.group_id && x.peer_fcode === f.fcode; });
    var tl = timeline(l, ss);
    inn.innerHTML = tl.length ? chatHTML(tl) : '<div class="sub" style="text-align:center;margin-top:30px">Henüz mesaj yok. İlk mesajı sen yaz 👋</div>';
    wireInn(inn); scrollEnd();
    footInput(foot, function (v, im) { return rpc('nk_dm_msg', { p_code: code(), p_fcode: f.fcode, p_body: v, p_img: im || null }); }, { pick: { f: f.fcode } });
  }
  function viewGroup(inn, foot, title) {
    var g = S.groups.filter(function (x) { return x.id === S.view.id; })[0]; if (!g) { S.view = null; return render(); }
    title.textContent = '👥 ' + g.name;
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
    footInput(foot, function (v, im) { return rpc('nk_group_msg', { p_code: code(), p_group: g.id, p_body: v, p_img: im || null }); }, { pick: { g: g.id } });
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
    if (!S.friends.length && !S.groups.length) { p.innerHTML = '<div><b>Önce arkadaş ekle</b><p class="sub" style="margin:8px 0">Arkadaşlar ekranından arkadaş kodunla birini ekle.</p><button class="b" id="nkf-go">Arkadaşlar\'ı aç</button></div>'; p.classList.add('on'); document.getElementById('nkf-go').onclick = function () { p.classList.remove('on'); open(); }; return; }
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
    try { if (/[?&]nkf=1/.test(location.search)) setTimeout(open, 2500); if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'nk-open') open(); }); } catch (e) {}
    setInterval(async function () { if (document.hidden || !code() || !appState || !appState.field) return; try { await ensureMe(); await pullInbox(); } catch (e) {} }, 45000);
    setTimeout(async function () { try { if (appState && appState.field && code()) { await ensureMe(); await pullInbox(); } } catch (e) {} }, 4000);
  }
  window.__nkFr = { open: open, sendItem: sendItem };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
