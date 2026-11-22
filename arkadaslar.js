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
  var S = { me: null, friends: [], groups: [], shares: {}, gmsgs: {}, since: null, tab: 'kutu', view: null, seen: {} };
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
    S.since = r.now;
    badge();
  }
  function unreadOf(s) { var n = (s.msgs || []).length + (s.incoming ? 1 : 0); return n - (S.seen[s.id] || 0); }
  function unreadGroup(gid) { var a = S.gmsgs[gid] ? Object.keys(S.gmsgs[gid]).length : 0; return a - (S.seen['g' + gid] || 0); }
  function totalUnread() {
    var n = 0;
    Object.keys(S.shares).forEach(function (id) { var s = S.shares[id]; if (s.incoming || (s.msgs || []).length) { var u = unreadOf(s); if (u > 0) n += u; } });
    Object.keys(S.gmsgs).forEach(function (g) { var u = unreadGroup(g); if (u > 0) n += u; });
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
    '#nkf-pick{position:fixed;inset:0;z-index:160;background:rgba(0,0,0,.6);display:none;align-items:flex-end;justify-content:center}#nkf-pick.on{display:flex}' +
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
    d.querySelector('#nkf-back').onclick = function () { S.view = null; render(); };
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
    S.view = null; S.tab = 'kutu';
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
    try { await pullInbox(); if (!typing) render(); } catch (e) {}
  }

  function render(loading) {
    var tabs = document.getElementById('nkf-tabs'), inn = document.getElementById('nkf-in'), foot = document.getElementById('nkf-foot'), back = document.getElementById('nkf-back'), title = document.getElementById('nkf-title');
    foot.style.display = 'none'; back.style.display = S.view ? '' : 'none';
    if (loading) { inn.innerHTML = '<div class="card">' + loading + '</div>'; return; }
    if (S.view) { tabs.style.display = 'none'; return S.view.t === 'share' ? viewShare(inn, foot, title) : viewGroup(inn, foot, title); }
    tabs.style.display = 'flex'; title.textContent = 'Arkadaşlar';
    var un = totalUnread();
    tabs.innerHTML = [['kutu', 'Kutu' + (un > 0 ? ' <span class="dot">' + (un > 9 ? '9+' : un) + '</span>' : '')], ['arkadas', 'Arkadaşlar'], ['grup', 'Gruplar']].map(function (t) { return '<button class="tab ' + (S.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    tabs.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { S.tab = b.dataset.t; render(); }; });
    if (S.tab === 'kutu') tabKutu(inn); else if (S.tab === 'arkadas') tabArk(inn); else tabGrup(inn);
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
    inn.querySelectorAll('[data-s]').forEach(function (c) { c.onclick = function () { S.view = { t: 'share', id: c.dataset.s }; render(); }; });
  }
  function lastAt(s) { var m = s.msgs && s.msgs.length ? s.msgs[s.msgs.length - 1].at : s.created_at; return new Date(m).getTime(); }

  function tabArk(inn) {
    inn.innerHTML = '<div class="card"><div class="sub">Görünen adın</div><div style="display:flex;gap:8px;margin-top:6px"><input id="nkf-name" maxlength="20" value="' + esc(S.me.name) + '"><button class="b" id="nkf-namebtn">Kaydet</button></div>' +
      '<div class="sub" style="margin-top:12px">Arkadaş kodun (arkadaşlarına bunu ver, kurtarma kodunu kimseye verme)</div><div style="display:flex;gap:8px;align-items:center;margin-top:6px"><div style="font-size:24px;font-weight:900;letter-spacing:4px;flex:1">' + esc(S.me.fcode) + '</div><button class="g" id="nkf-copy">Kopyala</button></div></div>' +
      '<div class="card"><div class="sub">Arkadaş ekle</div><div style="display:flex;gap:8px;margin-top:6px"><input id="nkf-add" placeholder="Arkadaş kodu" maxlength="8" style="text-transform:uppercase"><button class="b" id="nkf-addbtn">Ekle</button></div></div>' +
      '<div style="font-weight:800;font-size:13px;margin:14px 2px 8px">Arkadaşların (' + S.friends.length + ')</div>' +
      (S.friends.length ? S.friends.map(function (f) { return '<div class="card" style="display:flex;justify-content:space-between;align-items:center"><b>' + esc(f.name) + '</b><span class="sub">' + esc(f.fcode) + '</span></div>'; }).join('') : '<div class="card sub">Henüz arkadaş yok.</div>');
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
    var h = '<div class="card"><div class="sub">Yeni grup</div><input id="nkf-gn" maxlength="30" placeholder="Grup adı" style="margin:6px 0">';
    h += S.friends.length ? S.friends.map(function (f) { return '<label style="display:flex;gap:8px;align-items:center;padding:4px 0;font-size:13px"><input type="checkbox" class="nkf-gc" value="' + esc(f.fcode) + '" style="width:auto"> ' + esc(f.name) + '</label>'; }).join('') : '<div class="sub">Önce Arkadaşlar sekmesinden arkadaş ekle.</div>';
    h += '<button class="b" id="nkf-gmk" style="margin-top:8px">Grubu oluştur</button></div>';
    h += S.groups.map(function (g) { var u = unreadGroup(g.id); return '<div class="card" data-g="' + g.id + '" style="cursor:pointer"><div style="display:flex;justify-content:space-between"><b>👥 ' + esc(g.name) + '</b>' + (u > 0 ? '<span class="dot">' + u + '</span>' : '') + '</div><div class="sub">' + (g.members || []).map(function (m) { return esc(m.name); }).join(', ') + '</div></div>'; }).join('');
    inn.innerHTML = h;
    var mk = document.getElementById('nkf-gmk');
    mk.onclick = async function () {
      var n = document.getElementById('nkf-gn').value.trim(); var fc = [].map.call(inn.querySelectorAll('.nkf-gc:checked'), function (c) { return c.value; });
      if (!n) return toast('Grup adı yaz', true);
      try { await rpc('nk_group_create', { p_code: code(), p_name: n, p_fcodes: fc }); await refreshLists(); toast('Grup kuruldu'); render(); } catch (e) { toast('Olmadı', true); }
    };
    inn.querySelectorAll('[data-g]').forEach(function (c) { c.onclick = function () { S.view = { t: 'group', id: c.dataset.g }; render(); }; });
  }
  function chatHTML(list) {
    return list.map(function (m) { return '<div style="display:flex;flex-direction:column;align-items:' + (m.mine ? 'flex-end' : 'flex-start') + '">' + (m.mine ? '' : '<span class="sub" style="margin-left:6px">' + esc(m.who) + '</span>') + '<div class="bub ' + (m.mine ? 'me' : 'ot') + '">' + esc(m.body) + '</div></div>'; }).join('');
  }
  function footInput(foot, onSend) {
    foot.style.display = 'block';
    foot.innerHTML = '<div style="display:flex;gap:8px"><input id="nkf-msg" placeholder="Mesaj yaz..." maxlength="1000"><button class="b" id="nkf-send">Gönder</button></div>';
    var go = async function () { var i = document.getElementById('nkf-msg'), v = i.value.trim(); if (!v) return; i.value = ''; try { await onSend(v); await pullInbox(); render(); var b = document.getElementById('nkf-body'); b.scrollTop = b.scrollHeight; } catch (e) { toast('Gönderilemedi', true); i.value = v; } };
    document.getElementById('nkf-send').onclick = go;
    document.getElementById('nkf-msg').onkeydown = function (e) { if (e.key === 'Enter') go(); };
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
    var ab = document.getElementById('nkf-addarch'); if (ab) ab.onclick = function () { addToArchive(s); };
    footInput(foot, function (v) { return rpc('nk_msg_send', { p_code: code(), p_share: s.id, p_body: v }); });
  }
  function viewGroup(inn, foot, title) {
    var g = S.groups.filter(function (x) { return x.id === S.view.id; })[0]; if (!g) { S.view = null; return render(); }
    title.textContent = '👥 ' + g.name;
    var msgs = S.gmsgs[g.id] ? Object.keys(S.gmsgs[g.id]).map(function (k) { return S.gmsgs[g.id][k]; }).sort(function (a, b) { return new Date(a.at) - new Date(b.at); }) : [];
    S.seen['g' + g.id] = msgs.length; saveSeen(); badge();
    var addable = S.friends.filter(function (f) { return !(g.members || []).some(function (m) { return m.fcode === f.fcode; }); });
    var gs = Object.keys(S.shares).map(function (k) { return S.shares[k]; }).filter(function (s) { return s.group_id === g.id; });
    var h = '<div class="card"><div class="sub">Üyeler: ' + (g.members || []).map(function (m) { return esc(m.name); }).join(', ') + '</div>' +
      (addable.length ? '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' + addable.map(function (f) { return '<button class="g nkf-ga" data-f="' + esc(f.fcode) + '">+ ' + esc(f.name) + '</button>'; }).join('') + '</div>' : '') +
      '<button class="g" id="nkf-leave" style="margin-top:8px;color:#e11d48">Gruptan ayrıl</button></div>';
    if (gs.length) h += '<div class="sub" style="margin:8px 2px">Gruba gönderilenler</div>' + gs.map(function (s) { return '<div class="card" data-s="' + s.id + '" style="cursor:pointer"><b style="font-size:13px">' + (s.kind === 'question' ? '❓' : '📝') + ' ' + esc(s.sender) + '</b> <span class="sub">' + esc((s.data || {}).course) + ' › ' + esc((s.data || {}).topic) + '</span><div style="font-size:12px;opacity:.8">' + sharePreview(s) + '</div></div>'; }).join('');
    h += '<div class="sub" style="margin:8px 2px">Sohbet</div>' + (msgs.length ? chatHTML(msgs) : '<div class="sub">Henüz mesaj yok.</div>');
    inn.innerHTML = h;
    inn.querySelectorAll('.nkf-ga').forEach(function (b) { b.onclick = async function () { try { await rpc('nk_group_add', { p_code: code(), p_group: g.id, p_fcodes: [b.dataset.f] }); await refreshLists(); render(); } catch (e) { toast('Olmadı', true); } }; });
    inn.querySelectorAll('[data-s]').forEach(function (c) { c.onclick = function () { S.view = { t: 'share', id: c.dataset.s }; render(); }; });
    document.getElementById('nkf-leave').onclick = async function () { if (!confirm('Gruptan ayrılmak istiyor musun?')) return; try { await rpc('nk_group_leave', { p_code: code(), p_group: g.id }); await refreshLists(); S.view = null; render(); } catch (e) { toast('Olmadı', true); } };
    footInput(foot, function (v) { return rpc('nk_group_msg', { p_code: code(), p_group: g.id, p_body: v }); });
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
  async function sendItem(type, id) {
    build();
    try { await ensureMe(); await refreshLists(); } catch (e) { return toast('İnternet gerekli', true); }
    var p = document.getElementById('nkf-pick');
    if (!S.friends.length && !S.groups.length) { p.innerHTML = '<div><b>Önce arkadaş ekle</b><p class="sub" style="margin:8px 0">Arkadaşlar ekranından arkadaş kodunla birini ekle.</p><button class="b" id="nkf-go">Arkadaşlar\'ı aç</button></div>'; p.classList.add('on'); document.getElementById('nkf-go').onclick = function () { p.classList.remove('on'); open(); }; return; }
    p.innerHTML = '<div><b style="font-size:15px">Kime gönderelim?</b>' + S.groups.map(function (g) { return '<button class="card nkf-t" data-g="' + g.id + '" style="width:100%;text-align:left;margin-top:8px;font-weight:700">👥 ' + esc(g.name) + '</button>'; }).join('') + S.friends.map(function (f) { return '<button class="card nkf-t" data-f="' + esc(f.fcode) + '" style="width:100%;text-align:left;margin-top:8px;font-weight:700">👤 ' + esc(f.name) + '</button>'; }).join('') + '</div>';
    p.classList.add('on');
    p.querySelectorAll('.nkf-t').forEach(function (b) {
      b.onclick = async function () {
        p.classList.remove('on'); toast('Gönderiliyor...');
        try {
          var pl = await payloadOf(type, id); if (!pl) return toast('Bulunamadı', true);
          var r = b.dataset.g ? await rpc('nk_share_send_group', { p_code: code(), p_group: b.dataset.g, p_kind: type, p_data: pl }) : await rpc('nk_share_send', { p_code: code(), p_fcode: b.dataset.f, p_kind: type, p_data: pl });
          if (r.ok) toast('Gönderildi ✓'); else toast(r.err || 'Olmadı', true);
        } catch (e) { toast('Gönderilemedi', true); }
      };
    });
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
    setInterval(async function () { if (document.hidden || !code() || !appState || !appState.field) return; try { await ensureMe(); await pullInbox(); } catch (e) {} }, 45000);
    setTimeout(async function () { try { if (appState && appState.field && code()) { await ensureMe(); await pullInbox(); } } catch (e) {} }, 4000);
  }
  window.__nkFr = { open: open, sendItem: sendItem };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
