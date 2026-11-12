/* Pinchez Media 254 - Client Portal (front end). Works in demo mode or against Supabase. */
(function () {
'use strict';
const C = window.PORTAL_CONFIG, B = C.BUSINESS;
const KES = n => C.CURRENCY + ' ' + Math.round(Number(n) || 0).toLocaleString('en-US');
const $ = (s, r) => (r || document).querySelector(s);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, ''); else e.setAttribute(k, v);
  }
  for (const c of kids.flat()) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
}
const fmtDate = d => d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014';
const fmtSize = b => !b ? '' : b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
const navTo = p => window.__portalGo ? window.__portalGo(p) : location.replace(p);
const reload = () => window.__portalReload ? window.__portalReload() : location.reload();
const todayISO = () => new Date().toISOString().slice(0, 10);
function toast(msg, bad) { const t = h('div', { class: 'modal', style: 'background:none;pointer-events:none;place-items:end center' }, h('div', { class: 'badge ' + (bad ? 'b-bad' : 'b-ok'), style: 'font-size:14px;padding:10px 18px;box-shadow:0 6px 24px #0005;margin-bottom:20px' }, msg)); document.body.append(t); setTimeout(() => t.remove(), 2600); }

/* ---------------- DEMO ADAPTER (no backend) ---------------- */
function DemoAdapter() {
  const KEY = 'pm254_portal_demo_v1', SK = 'pm254_portal_demo_session';
  const day = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const ts = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString(); };
  const seed = () => ({
    users: [{ id: 'u-client', email: 'client@demo.test', password: 'demo1234' }, { id: 'u-admin', email: 'admin@demo.test', password: 'admin1234' }],
    profiles: [
      { id: 'u-client', email: 'client@demo.test', full_name: 'Amina Wanjiru', company: 'Wanjiru Hardware Ltd', phone: '+254 700 000 000', role: 'client', created_at: ts(-40) },
      { id: 'u-admin', email: 'admin@demo.test', full_name: B.owner, company: B.name, phone: B.phone, role: 'admin', created_at: ts(-90) }],
    projects: [
      { id: 'p1', client_id: 'u-client', name: 'Business website', service: 'Website Development', status: 'In progress', progress: 68, start_date: day(-24), due_date: day(12), summary: 'Five-page responsive website with a contact form, product gallery and Google Business Profile set-up.', created_at: ts(-24) },
      { id: 'p2', client_id: 'u-client', name: 'Point-of-sale system', service: 'Point-of-Sale Development', status: 'Planning', progress: 20, start_date: day(-3), due_date: day(45), summary: 'Sales, stock and daily-report system for the shop counter, with receipt printing.', created_at: ts(-3) }],
    milestones: [
      ['p1', 'Discovery and brief', 'done', -22], ['p1', 'Design approved', 'done', -14], ['p1', 'Pages built', 'done', -5], ['p1', 'Content and images', 'active', 3], ['p1', 'Testing and revisions', 'pending', 8], ['p1', 'Launch and handover', 'pending', 12],
      ['p2', 'Requirements workshop', 'done', -2], ['p2', 'Prototype for approval', 'active', 10], ['p2', 'Build and testing', 'pending', 32], ['p2', 'Training and launch', 'pending', 45]
    ].map((m, i) => ({ id: 'm' + i, project_id: m[0], title: m[1], status: m[2], due_date: day(m[3]), sort: i, created_at: ts(-30) })),
    updates: [
      { id: 'up1', project_id: 'p1', body: 'All five pages are built. Please send your product photos and shop opening hours so I can finish the content.', created_at: ts(-2) },
      { id: 'up2', project_id: 'p1', body: 'Design approved. Moving on to building the pages.', created_at: ts(-14) },
      { id: 'up3', project_id: 'p2', body: 'Requirements workshop done. I will share a clickable prototype within 10 days.', created_at: ts(-2) }],
    invoices: [
      { id: 'i1', client_id: 'u-client', project_id: 'p1', number: 'PM254-INV-2026-001', issue_date: day(-24), due_date: day(-17), items: [{ description: 'Website Development: deposit (50%)', qty: 1, unit_price: 12500 }], subtotal: 12500, discount: 0, vat: 0, total: 12500, notes: 'Thank you for choosing Pinchez Media 254.', created_at: ts(-24) },
      { id: 'i2', client_id: 'u-client', project_id: 'p1', number: 'PM254-INV-2026-002', issue_date: day(-1), due_date: day(12), items: [{ description: 'Website Development: balance (50%)', qty: 1, unit_price: 12500 }], subtotal: 12500, discount: 0, vat: 0, total: 12500, notes: 'Due on delivery. Final files are released after payment.', created_at: ts(-1) },
      { id: 'i3', client_id: 'u-client', project_id: 'p2', number: 'PM254-INV-2026-003', issue_date: day(-3), due_date: day(-1), items: [{ description: 'Point-of-Sale Development: deposit (50%)', qty: 1, unit_price: 5000 }], subtotal: 5000, discount: 0, vat: 0, total: 5000, notes: '', created_at: ts(-3) }],
    payments: [{ id: 'pay1', invoice_id: 'i1', amount: 12500, method: 'M-Pesa', reference: 'DEMO7XK2LQ', paid_on: day(-20), created_at: ts(-20) }],
    files: [
      { id: 'f1', client_id: 'u-client', project_id: 'p1', name: 'Quotation PM254-Q-2026-014.pdf', category: 'Quotation', storage_path: 'demo/f1', size: 184320, created_at: ts(-26) },
      { id: 'f2', client_id: 'u-client', project_id: 'p1', name: 'Service Agreement (signed).pdf', category: 'Agreement', storage_path: 'demo/f2', size: 256000, created_at: ts(-24) },
      { id: 'f3', client_id: 'u-client', project_id: 'p1', name: 'Receipt PM254-RCT-2026-007.pdf', category: 'Receipt', storage_path: 'demo/f3', size: 90112, created_at: ts(-20) },
      { id: 'f4', client_id: 'u-client', project_id: 'p1', name: 'Homepage design preview.png', category: 'Deliverable', storage_path: 'demo/f4', size: 1258291, created_at: ts(-12) },
      { id: 'f5', client_id: 'u-client', project_id: 'p1', name: 'How to update your website.pdf', category: 'Guide', storage_path: 'demo/f5', size: 412672, created_at: ts(-1) }]
  });
  let db = JSON.parse(sessionStorage.getItem(KEY) || 'null') || seed();
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(db));
  const uid = () => (JSON.parse(sessionStorage.getItem(SK) || 'null') || {}).id;
  const me = () => db.profiles.find(p => p.id === uid());
  const isAdmin = () => (me() || {}).role === 'admin';
  const projOf = id => db.projects.find(p => p.id === id), invOf = id => db.invoices.find(i => i.id === id);
  const visible = (t, r) => {
    if (isAdmin()) return true; const u = uid();
    if (t === 'profiles') return r.id === u; if (t === 'milestones' || t === 'updates') return (projOf(r.project_id) || {}).client_id === u;
    if (t === 'payments') return (invOf(r.invoice_id) || {}).client_id === u; return r.client_id === u;
  };
  const summ = i => {
    const paid = db.payments.filter(p => p.invoice_id === i.id).reduce((a, p) => a + Number(p.amount), 0), balance = Math.max(i.total - paid, 0);
    return { ...i, paid, balance, status: balance <= 0 ? 'Paid' : i.due_date < day(0) ? 'Overdue' : paid > 0 ? 'Part-paid' : 'Due' };
  };
  const wait = () => new Promise(r => setTimeout(r, 120));
  return {
    mode: 'demo',
    async getSession() { await wait(); const u = uid(); return u ? { user: { id: u }, profile: me() } : null; },
    async signIn(e, p) { await wait(); const u = db.users.find(x => x.email === e.trim().toLowerCase() && x.password === p); if (!u) throw new Error('Wrong email or password.'); sessionStorage.setItem(SK, JSON.stringify({ id: u.id })); },
    async signOut() { sessionStorage.removeItem(SK); },
    async sendMagicLink(e) { await wait(); if (!db.users.some(x => x.email === e.trim().toLowerCase())) throw new Error('No client account uses that email.'); },
    async resetPassword() { await wait(); },
    async changePassword(pw) { await wait(); const u = db.users.find(x => x.id === uid()); u.password = pw; save(); },
    async list(t, o) {
      o = o || {}; let rows = (t === 'invoices' ? db.invoices.map(summ) : db[t]).filter(r => visible(t, r));
      if (o.eq) rows = rows.filter(r => Object.entries(o.eq).every(([k, v]) => r[k] === v));
      const k = o.order || 'created_at', dir = o.asc ? 1 : -1; return rows.slice().sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * dir);
    },
    async upsert(t, row) { await wait(); if (!isAdmin() && !(t === 'profiles' && row.id === uid())) throw new Error('Not allowed.'); const arr = db[t]; row = { ...row };
      const i = row.id ? arr.findIndex(x => x.id === row.id) : -1; if (i >= 0) arr[i] = { ...arr[i], ...row }; else { row.id = row.id || 'd' + Math.random().toString(36).slice(2, 9); row.created_at = new Date().toISOString(); arr.push(row); }
      save(); return i >= 0 ? arr[i] : row; },
    async remove(t, id) { await wait(); if (!isAdmin()) throw new Error('Not allowed.'); db[t] = db[t].filter(x => x.id !== id);
      if (t === 'projects') { db.milestones = db.milestones.filter(m => m.project_id !== id); db.updates = db.updates.filter(m => m.project_id !== id); }
      if (t === 'invoices') db.payments = db.payments.filter(p => p.invoice_id !== id); save(); },
    async upload(file, meta) { await wait(); const row = { id: 'f' + Math.random().toString(36).slice(2, 8), client_id: meta.client_id, project_id: meta.project_id || null, name: file.name, category: meta.category, storage_path: 'demo/' + file.name, size: file.size, created_at: new Date().toISOString() }; db.files.push(row); save(); return row; },
    async fileUrl(row) { return URL.createObjectURL(new Blob(['DEMO FILE\n\nThis is a placeholder for: ' + row.name + '\nIn live mode the real file downloads here.'], { type: 'text/plain' })); },
    resetDemo() { sessionStorage.removeItem(KEY); db = seed(); }
  };
}

/* ---------------- SUPABASE ADAPTER ---------------- */
function SupabaseAdapter() {
  if (!window.supabase || /YOUR-/.test(C.SUPABASE_URL + C.SUPABASE_ANON_KEY)) throw new Error('Portal is not connected yet. Set SUPABASE_URL and SUPABASE_ANON_KEY in portal/config.js.');
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const ck = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  return {
    mode: 'supabase', sb,
    async getSession() { const { data: { session } } = await sb.auth.getSession(); if (!session) return null; const profile = ck(await sb.from('profiles').select('*').eq('id', session.user.id).single()); return { user: session.user, profile }; },
    async signIn(email, password) { ck(await sb.auth.signInWithPassword({ email: email.trim(), password })); },
    async signOut() { await sb.auth.signOut(); },
    async sendMagicLink(email) { ck(await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: location.origin + '/portal/app.html' } })); },
    async resetPassword(email) { ck(await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + '/portal/app.html?reset=1' })); },
    async changePassword(password) { ck(await sb.auth.updateUser({ password })); },
    async list(t, o) { o = o || {}; let q = sb.from(t === 'invoices' ? 'invoice_summary' : t).select('*').order(o.order || 'created_at', { ascending: !!o.asc });
      if (o.eq) for (const [k, v] of Object.entries(o.eq)) q = q.eq(k, v); return ck(await q); },
    async upsert(t, row) { return ck(await sb.from(t).upsert(row).select().single()); },
    async remove(t, id) { ck(await sb.from(t).delete().eq('id', id)); },
    async upload(file, meta) { const path = meta.client_id + '/' + Date.now() + '-' + file.name.replace(/[^\w.\-]+/g, '_');
      ck(await sb.storage.from('client-files').upload(path, file)); return ck(await sb.from('files').insert({ client_id: meta.client_id, project_id: meta.project_id || null, name: file.name, category: meta.category, storage_path: path, size: file.size }).select().single()); },
    async fileUrl(row) { return ck(await sb.storage.from('client-files').createSignedUrl(row.storage_path, 60, { download: row.name })).signedUrl; }
  };
}
let api;
try { api = C.MODE === 'demo' ? DemoAdapter() : SupabaseAdapter(); } catch (e) { api = null; window.__portalError = e.message; }

/* ---------------- shared UI ---------------- */
if (api) {
  api.updateProfile = api.updateProfile || (async (patch, id) => { const s = await api.getSession(); id = id || s.user.id;
    if (api.mode === 'demo') return api.upsert('profiles', { id, ...patch });
    const { data, error } = await api.sb.from('profiles').update(patch).eq('id', id).select().single(); if (error) throw new Error(error.message); return data; });
  api.removeFile = api.removeFile || (async row => { if (api.mode === 'supabase') await api.sb.storage.from('client-files').remove([row.storage_path]); return api.remove('files', row.id); });
}
function modal(content, wide) {
  const m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'dlg' }, content));
  const close = () => { m.remove(); document.removeEventListener('keydown', esc); }; const esc = e => { if (e.key === 'Escape') close(); };
  m.addEventListener('mousedown', e => { if (e.target === m) close(); }); document.addEventListener('keydown', esc); document.body.append(m);
  if (wide) m.firstChild.style.width = 'min(860px,100%)'; const f = m.querySelector('input,select,textarea'); if (f) f.focus(); return close;
}
function openForm(o) {
  const v = o.values || {}, err = h('div', { class: 'err', role: 'alert' }), inputs = {}; let close;
  const fields = o.fields.map(f => {
    let el;
    if (f.type === 'select') el = h('select', { name: f.name }, (f.options || []).map(x => { const val = typeof x === 'object' ? x.value : x, lab = typeof x === 'object' ? x.label : x; return h('option', { value: val, selected: String(v[f.name] == null ? '' : v[f.name]) === String(val) }, lab); }));
    else if (f.type === 'textarea') { el = h('textarea', { name: f.name, rows: 4 }); el.value = v[f.name] || ''; }
    else if (f.type === 'checkbox') { el = h('input', { name: f.name, type: 'checkbox', checked: !!v[f.name], style: 'width:auto' }); }
    else { el = h('input', { name: f.name, type: f.type || 'text', min: f.min, max: f.max, step: f.step, accept: f.accept, autocomplete: 'off' }); if (f.type !== 'file') el.value = v[f.name] == null ? '' : v[f.name]; }
    inputs[f.name] = el; return h('label', f.type === 'checkbox' ? { style: 'display:flex;gap:10px;align-items:center' } : {}, f.type === 'checkbox' ? [el, f.label] : [f.label, el], f.help ? h('span', { class: 'small muted', text: f.help }) : null);
  });
  const submit = h('button', { class: 'btn pri', type: 'submit' }, o.submit || 'Save');
  const form = h('form', { class: 'form', novalidate: true }, fields, err, h('div', { class: 'acts' }, h('button', { class: 'btn', type: 'button', onclick: () => close() }, 'Cancel'), submit));
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = ''; const out = {};
    for (const f of o.fields) { const el = inputs[f.name]; let val = f.type === 'file' ? el.files[0] : f.type === 'checkbox' ? el.checked : el.value.trim();
      if (f.type === 'number' && val !== '') val = Number(val); if (f.required && (val === '' || val == null)) { err.textContent = f.label + ' is required.'; el.focus(); return; } out[f.name] = val; }
    submit.disabled = true; submit.textContent = 'Saving\u2026';
    try { await o.onSubmit(out); close(); } catch (x) { err.textContent = x.message; submit.disabled = false; submit.textContent = o.submit || 'Save'; }
  });
  close = modal([h('h2', { text: o.title }), form]); return { inputs, close };
}
async function guard(role) {
  if (!api) { document.body.append(h('div', { class: 'login' }, h('div', { class: 'card box' }, h('h1', { text: 'Portal not connected' }), h('p', { class: 'muted', text: window.__portalError || 'Check portal/config.js.' })))); return null; }
  let s = null; try { s = await api.getSession(); } catch (e) { s = null; }
  if (!s) { navTo('/portal/'); return null; }
  if (role === 'admin' && s.profile.role !== 'admin') { navTo('/portal/app.html'); return null; }
  if (role === 'client' && s.profile.role === 'admin') { navTo('/portal/admin.html'); return null; }
  return s;
}
function chrome(s, label, switchTo) {
  const out = [];
  if (api.mode === 'demo') out.push(h('div', { class: 'demo' }, 'Demo mode: sample data only. ', h('button', { class: 'btn sm', style: 'margin-left:8px;border-color:#0B1033;color:#0B1033', onclick: () => { api.resetDemo(); reload(); } }, 'Reset demo data')));
  out.push(h('header', { class: 'top' }, h('div', { class: 'wrap' }, h('a', { class: 'brand', href: '/portal/' }, h('img', { src: '/logo.png', alt: '' }), h('span', {}, B.name, h('span', { class: 'small', style: 'display:block;font-weight:500;opacity:.85' }, label))),
    h('span', { class: 'sp' }), h('span', { class: 'who', text: s.profile.full_name || s.profile.email || '' }),
    h('a', { class: 'btn sm', href: '/' }, 'Website'),
    h('button', { class: 'btn sm', onclick: async () => { await api.signOut(); navTo('/portal/'); } }, 'Sign out'))));
  return out;
}
function tabsUI(defs, root) {
  const bar = h('div', { class: 'tabs', role: 'tablist' }), panels = {};
  defs.forEach((d, i) => { const p = h('section', { role: 'tabpanel', hidden: i !== 0 }, d.node); panels[d.id] = p; root.append(p);
    bar.append(h('button', { class: 'tab', role: 'tab', 'aria-selected': i === 0 ? 'true' : 'false', 'data-tab': d.id, onclick: () => show(d.id) }, d.label, d.badge ? h('span', { class: 'n', text: d.badge }) : null)); });
  function show(id) { for (const k in panels) panels[k].hidden = k !== id; bar.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === id ? 'true' : 'false')); window.scrollTo({ top: 0 }); }
  return { bar, show };
}
const statusClass = s => ({ Paid: 'b-ok', Delivered: 'b-ok', Overdue: 'b-bad', 'Part-paid': 'b-warn', Due: 'b-warn', 'In progress': 'b-info', 'In review': 'b-info', Planning: '', 'On hold': 'b-warn' }[s] || '');
const badge = s => h('span', { class: 'badge ' + statusClass(s), text: s });
function bar(pct) { const i = h('i'); requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = Math.max(0, Math.min(100, pct)) + '%'; })); return h('div', { class: 'bar', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, i); }
async function copy(text) { try { await navigator.clipboard.writeText(text); toast('Copied'); } catch (e) { toast('Copy failed', true); } }
function table(cols, rows, empty) {
  if (!rows.length) return h('div', { class: 'card empty', text: empty || 'Nothing here yet.' });
  return h('div', { class: 'tw' }, h('table', {}, h('thead', {}, h('tr', {}, cols.map(c => h('th', { class: c.r ? 'r' : '', text: c.t })))), h('tbody', {}, rows.map(r => h('tr', {}, cols.map((c, i) => h('td', { class: (c.r ? 'r ' : '') + (c.nw ? 'nw' : '') }, r[i])))))));
}
function invoiceNode(inv, client, payments, cls) {
  const lines = inv.items || [];
  return h('div', { class: cls },
    h('div', { class: 'row' }, h('div', {}, h('h2', { text: B.name, style: 'margin:0' }), h('div', { class: 'small muted', text: B.owner + ' \u00b7 ' + B.location + ' \u00b7 ' + B.email + ' \u00b7 ' + B.phone })), h('span', { class: 'sp2' }), h('div', { style: 'text-align:right' }, h('h2', { text: 'INVOICE', style: 'margin:0;color:var(--tang)' }), h('b', { text: inv.number }))),
    h('div', { class: 'row', style: 'margin:14px 0' }, h('div', {}, h('div', { class: 'small muted', text: 'BILL TO' }), h('b', { text: (client && (client.company || client.full_name)) || '' }), h('div', { class: 'small', text: (client && client.full_name && client.company ? client.full_name : '') })),
      h('span', { class: 'sp2' }), h('div', { class: 'small', style: 'text-align:right' }, h('div', {}, 'Issued: ', fmtDate(inv.issue_date)), h('div', {}, 'Due: ', h('b', { text: fmtDate(inv.due_date) })), badge(inv.status || ''))),
    table([{ t: 'Description' }, { t: 'Qty', r: 1 }, { t: 'Unit price', r: 1 }, { t: 'Amount', r: 1 }], lines.map(l => [l.description, String(l.qty), KES(l.unit_price), KES(l.qty * l.unit_price)]), 'No items'),
    h('div', { style: 'margin:12px 0 0 auto;max-width:300px;display:grid;gap:4px' },
      [['Subtotal', inv.subtotal], inv.discount > 0 ? ['Discount', -inv.discount] : null, inv.vat > 0 ? ['VAT', inv.vat] : null, ['Total', inv.total], ['Paid', inv.paid || 0]].filter(Boolean).map(r => h('div', { class: 'row' }, r[0], h('span', { class: 'sp2' }), KES(r[1]))),
      h('div', { class: 'row', style: 'font-weight:800;font-size:17px;border-top:2px solid var(--tang);padding-top:6px' }, 'Balance due', h('span', { class: 'sp2' }), KES(inv.balance == null ? inv.total : inv.balance))),
    payments && payments.length ? h('div', { class: 'small', style: 'margin-top:12px' }, h('b', { text: 'Payments received: ' }), payments.map(p => fmtDate(p.paid_on) + ' ' + KES(p.amount) + (p.method ? ' (' + p.method + ')' : '') + (p.reference ? ' ref ' + p.reference : '')).join('; ')) : null,
    h('div', { class: 'small', style: 'margin-top:12px' }, h('b', { text: 'How to pay: ' }), 'M-Pesa ' + C.PAYMENT.mpesa + ' \u00b7 Bank ' + C.PAYMENT.bank + ' \u00b7 PayPal ' + C.PAYMENT.paypal + '. Use ', h('b', { text: inv.number }), ' as the reference.'),
    inv.notes ? h('p', { class: 'small muted', text: inv.notes }) : null);
}
function showInvoice(inv, client, payments) {
  const printBtn = h('button', { class: 'btn pri', onclick: () => { const p = invoiceNode(inv, client, payments, 'inv'); document.body.append(p); window.print(); setTimeout(() => p.remove(), 500); } }, 'Print / save as PDF');
  const close = modal([invoiceNode(inv, client, payments, 'invview'), h('div', { class: 'acts', style: 'margin-top:16px' }, h('button', { class: 'btn', onclick: () => close() }, 'Close'), printBtn)], true);
}

/* ---------------- LOGIN PAGE ---------------- */
async function initLogin() {
  const root = $('#app');
  if (!api) { root.append(h('div', { class: 'login' }, h('div', { class: 'card box' }, h('h1', { text: 'Portal not connected' }), h('p', { class: 'muted', text: window.__portalError })))); return; }
  try { const s = await api.getSession(); if (s) { navTo(s.profile.role === 'admin' ? '/portal/admin.html' : '/portal/app.html'); return; } } catch (e) { /* not signed in */ }
  const email = h('input', { type: 'email', name: 'email', autocomplete: 'username', required: true, inputmode: 'email' }), pw = h('input', { type: 'password', name: 'password', autocomplete: 'current-password' });
  const msg = h('div', { class: 'err', role: 'alert', 'aria-live': 'polite' }), go = h('button', { class: 'btn pri', type: 'submit' }, 'Sign in');
  const say = (t, good) => { msg.className = good ? 'ok' : 'err'; msg.textContent = t; };
  const form = h('form', { class: 'form', novalidate: true }, h('label', {}, 'Email', email), h('label', {}, 'Password', pw), msg, go,
    h('div', { class: 'links' },
      h('button', { type: 'button', onclick: async () => { if (!email.value) return say('Enter your email first.'); try { await api.sendMagicLink(email.value); say('Check your inbox for a sign-in link.', true); } catch (e) { say(e.message); } } }, 'Email me a sign-in link'),
      h('button', { type: 'button', onclick: async () => { if (!email.value) return say('Enter your email first.'); try { await api.resetPassword(email.value); say('If that email has an account, a reset link is on its way.', true); } catch (e) { say(e.message); } } }, 'Forgot password?')));
  form.addEventListener('submit', async e => { e.preventDefault(); say(''); if (!email.value || !pw.value) return say('Enter your email and password.'); go.disabled = true; go.textContent = 'Signing in\u2026';
    try { await api.signIn(email.value, pw.value); const s = await api.getSession(); navTo(s.profile.role === 'admin' ? '/portal/admin.html' : '/portal/app.html'); } catch (x) { say(x.message === 'Invalid login credentials' ? 'Wrong email or password.' : x.message); go.disabled = false; go.textContent = 'Sign in'; } });
  const demo = api.mode === 'demo' ? h('div', { class: 'card', style: 'margin-top:14px;background:var(--warnbg);border-color:var(--tang)' }, h('b', { text: 'Demo mode' }), h('p', { class: 'small', style: 'margin:4px 0 8px', text: 'Sample data only. Try a client or the admin console:' }),
    h('div', { class: 'row' }, h('button', { class: 'btn sm', type: 'button', onclick: () => { email.value = 'client@demo.test'; pw.value = 'demo1234'; } }, 'Fill client login'), h('button', { class: 'btn sm', type: 'button', onclick: () => { email.value = 'admin@demo.test'; pw.value = 'admin1234'; } }, 'Fill admin login'))) : null;
  root.append(h('div', { class: 'login' }, h('div', { class: 'box' }, h('div', { class: 'card' }, h('div', { class: 'lg' }, h('img', { src: '/logo.png', alt: '' }), h('div', {}, h('h1', { text: 'Client portal' }), h('div', { class: 'muted small', text: B.name }))),
    h('p', { class: 'muted', style: 'margin-top:0', text: 'Sign in to see your projects, progress, bills and files.' }), form), demo, h('p', { class: 'small muted', style: 'text-align:center;margin-top:16px' }, 'Need access? Contact ', h('a', { href: 'mailto:' + B.email, text: B.email }), ' \u00b7 ', h('a', { href: '/', text: 'Back to website' })))));
}

/* ---------------- CLIENT DASHBOARD ---------------- */
async function initApp() {
  const s = await guard('client'); if (!s) return;
  const root = $('#app'), me = s.profile;
  const [projects, milestones, updates, invoices, payments, files] = await Promise.all([api.list('projects', { order: 'created_at' }), api.list('milestones', { order: 'sort', asc: true }), api.list('updates'), api.list('invoices', { order: 'issue_date' }), api.list('payments', { order: 'paid_on' }), api.list('files')]);
  const pById = Object.fromEntries(projects.map(p => [p.id, p]));
  const owing = invoices.filter(i => i.balance > 0), overdue = owing.filter(i => i.status === 'Overdue'), outstanding = owing.reduce((a, i) => a + Number(i.balance), 0);
  const paidTotal = invoices.reduce((a, i) => a + Number(i.paid), 0), active = projects.filter(p => p.status !== 'Delivered');
  const avg = active.length ? Math.round(active.reduce((a, p) => a + p.progress, 0) / active.length) : (projects.length ? 100 : 0);
  let tabs;
  const wa = txt => 'https://wa.me/' + B.whatsapp + '?text=' + encodeURIComponent(txt);
  const stat = (k, v, sub, warn) => h('div', { class: 'card stat' + (warn ? ' warn' : '') }, h('div', { class: 'k', text: k }), h('div', { class: 'v', text: v }), sub ? h('div', { class: 's', text: sub }) : null);
  const feedItem = u => h('li', {}, h('time', { text: fmtDate(u.created_at) + (pById[u.project_id] ? ' \u00b7 ' + pById[u.project_id].name : '') }), h('div', { text: u.body }));

  /* overview */
  const attention = overdue.length ? h('div', { class: 'card', style: 'border-color:var(--bad);background:var(--badbg)' }, h('div', { class: 'row' }, h('b', { text: overdue.length + ' overdue invoice' + (overdue.length > 1 ? 's' : '') + ': ' + KES(overdue.reduce((a, i) => a + Number(i.balance), 0)) }), h('span', { class: 'sp2' }), h('button', { class: 'btn sm danger', onclick: () => tabs.show('billing') }, 'View and pay')))
    : owing.length ? (() => { const n = owing.slice().sort((a, b) => a.due_date > b.due_date ? 1 : -1)[0]; return h('div', { class: 'card' }, h('div', { class: 'row' }, h('span', {}, 'Next payment: ', h('b', { text: KES(n.balance) }), ' due ', h('b', { text: fmtDate(n.due_date) }), ' (' + n.number + ')'), h('span', { class: 'sp2' }), h('button', { class: 'btn sm', onclick: () => tabs.show('billing') }, 'View billing'))); })()
    : h('div', { class: 'card', style: 'border-color:var(--ok);background:var(--okbg)' }, h('b', { text: 'You are all paid up. Thank you!' }));
  const overview = h('div', { class: 'grid' },
    h('div', { class: 'hero' }, h('h1', { text: 'Welcome back, ' + ((me.full_name || '').split(' ')[0] || 'there') }), h('p', { text: (me.company ? me.company + ' \u00b7 ' : '') + 'Here is where everything stands today.' })),
    h('div', { class: 'grid g4' }, stat('Active projects', String(active.length), projects.length + ' in total'), stat('Overall progress', avg + '%', 'across active projects'), stat('Outstanding balance', KES(outstanding), owing.length + ' unpaid invoice' + (owing.length === 1 ? '' : 's'), overdue.length > 0), stat('Files ready', String(files.length), 'documents and deliverables')),
    attention,
    h('div', { class: 'grid g2' },
      h('div', { class: 'card' }, h('h2', { text: 'Project progress' }), projects.length ? h('div', { class: 'grid' }, projects.map(p => h('div', {}, h('div', { class: 'row' }, h('b', { text: p.name }), h('span', { class: 'sp2' }), badge(p.status), h('b', { text: p.progress + '%' })), bar(p.progress)))) : h('p', { class: 'muted', text: 'No projects yet.' })),
      h('div', { class: 'card' }, h('h2', { text: 'Latest updates' }), updates.length ? h('ul', { class: 'feed' }, updates.slice(0, 5).map(feedItem)) : h('p', { class: 'muted', text: 'Updates from Peter will appear here.' }))));

  /* projects */
  const projectsNode = h('div', { class: 'grid' }, h('div', { class: 'hero' }, h('h1', { text: 'Your projects' }), h('p', { text: 'Live progress, milestones and updates for each service.' })),
    projects.length ? projects.map(p => { const ms = milestones.filter(m => m.project_id === p.id), ups = updates.filter(u => u.project_id === p.id).slice(0, 3);
      return h('article', { class: 'card pj' },
        h('div', { class: 'head' }, h('div', { style: 'flex:1;min-width:180px' }, h('h3', { text: p.name }), h('div', { class: 'small muted', text: p.service || '' })), badge(p.status)),
        h('div', {}, h('div', { class: 'row small', style: 'margin-bottom:6px' }, h('b', { text: p.progress + '% complete' }), h('span', { class: 'sp2' }), 'Due ', h('b', { text: fmtDate(p.due_date) })), bar(p.progress)),
        p.summary ? h('p', { style: 'margin:0', text: p.summary }) : null,
        h('div', { class: 'meta' }, h('span', {}, 'Started ', fmtDate(p.start_date))),
        ms.length ? h('div', {}, h('h3', { text: 'Milestones' }), h('ul', { class: 'ms' }, ms.map(m => h('li', { class: m.status }, h('span', { class: 'dot', text: m.status === 'done' ? '\u2713' : m.status === 'active' ? '\u2022' : '' }), h('div', {}, h('div', { class: 't', text: m.title }), h('div', { class: 'd', text: (m.status === 'done' ? 'Completed' : m.status === 'active' ? 'In progress' : 'Upcoming') + (m.due_date ? ' \u00b7 ' + fmtDate(m.due_date) : '') })))))) : null,
        ups.length ? h('div', {}, h('h3', { text: 'Recent updates' }), h('ul', { class: 'feed' }, ups.map(feedItem))) : null,
        h('div', { class: 'row' }, h('a', { class: 'btn sm sun', target: '_blank', rel: 'noopener', href: wa('Hello Peter, a question about my project "' + p.name + '".') }, 'Message about this project'), h('button', { class: 'btn sm', onclick: () => { tabs.show('files'); setFileFilter(p.id); } }, 'Project files')));
    }) : h('div', { class: 'card empty', text: 'Your projects will appear here once work begins.' }));

  /* billing */
  const how = h('div', { class: 'card' }, h('h2', { text: 'How to pay' }), h('div', { class: 'how' },
    [['M-Pesa', C.PAYMENT.mpesa], ['Bank', C.PAYMENT.bank], ['PayPal', C.PAYMENT.paypal]].map(r => h('div', { class: 'l' }, h('b', { text: r[0] }), h('span', { text: r[1], style: 'flex:1;min-width:140px' }), h('button', { class: 'btn sm', onclick: () => copy(r[1]) }, 'Copy'))),
    h('p', { class: 'small muted', style: 'margin:4px 0 0', text: 'Use the invoice number as your payment reference, then send the M-Pesa message or bank slip to ' + B.phone + ' (WhatsApp) or ' + B.email + ' so a receipt can be issued.' })));
  const billing = h('div', { class: 'grid' }, h('div', { class: 'hero' }, h('h1', { text: 'Billing' }), h('p', { text: 'Invoices, payments received and what is still due.' })),
    h('div', { class: 'grid g4' }, stat('Outstanding', KES(outstanding), owing.length + ' unpaid', overdue.length > 0), stat('Paid to date', KES(paidTotal), payments.length + ' payment' + (payments.length === 1 ? '' : 's')), stat('Invoices', String(invoices.length), 'all time')),
    owing.length ? how : null,
    table([{ t: 'Invoice' }, { t: 'Issued', nw: 1 }, { t: 'Due', nw: 1 }, { t: 'Total', r: 1 }, { t: 'Paid', r: 1 }, { t: 'Balance', r: 1 }, { t: 'Status' }, { t: '' }],
      invoices.map(i => [h('b', { text: i.number }), fmtDate(i.issue_date), fmtDate(i.due_date), KES(i.total), KES(i.paid), h('b', { text: KES(i.balance) }), badge(i.status), h('button', { class: 'btn sm', onclick: () => showInvoice(i, me, payments.filter(p => p.invoice_id === i.id)) }, 'View')]), 'No invoices yet.'));

  /* files */
  let fileFilter = 'All', fileProject = null; const filesBox = h('div');
  const renderFiles = () => { filesBox.replaceChildren(); const cats = ['All', ...new Set(files.map(f => f.category))];
    filesBox.append(h('div', { class: 'filters' }, cats.map(c => h('button', { class: 'chip', 'aria-pressed': String(c === fileFilter), onclick: () => { fileFilter = c; renderFiles(); } }, c)), fileProject ? h('button', { class: 'chip', onclick: () => { fileProject = null; renderFiles(); } }, 'Project: ' + ((pById[fileProject] || {}).name || '') + ' \u2715') : null));
    const rows = files.filter(f => (fileFilter === 'All' || f.category === fileFilter) && (!fileProject || f.project_id === fileProject));
    filesBox.append(table([{ t: 'File' }, { t: 'Category' }, { t: 'Project' }, { t: 'Added', nw: 1 }, { t: 'Size', nw: 1 }, { t: '' }], rows.map(f => [h('b', { text: f.name }), h('span', { class: 'badge', text: f.category }), (pById[f.project_id] || {}).name || '\u2014', fmtDate(f.created_at), fmtSize(f.size),
      h('button', { class: 'btn sm pri', onclick: async e => { const b = e.currentTarget; b.disabled = true; try { const url = await api.fileUrl(f); const a = h('a', { href: url, download: f.name, rel: 'noopener' }); document.body.append(a); a.click(); a.remove(); } catch (x) { toast(x.message, true); } b.disabled = false; } }, 'Download')]), 'No files in this view.')); };
  function setFileFilter(pid) { fileProject = pid; fileFilter = 'All'; renderFiles(); } renderFiles();
  const filesNode = h('div', { class: 'grid' }, h('div', { class: 'hero' }, h('h1', { text: 'Files and downloads' }), h('p', { text: 'Quotations, agreements, receipts, guides and your finished work. Download links are private and expire after a minute.' })), filesBox);

  /* request a service */
  const cats = [...new Set(C.SERVICES.map(x => x.cat))];
  const services = h('div', { class: 'grid' }, h('div', { class: 'hero' }, h('h1', { text: 'Request another service' }), h('p', { text: 'Published rates from the Pinchez Media 254 rate card. Final quotes depend on project complexity and requirements.' })),
    h('div', { class: 'grid g2' }, cats.map(c => h('div', { class: 'card' }, h('h2', { text: c }), C.SERVICES.filter(x => x.cat === c).map(x => h('div', { class: 'row', style: 'padding:8px 0;border-top:1px solid var(--line)' }, h('span', { text: x.name }), h('span', { class: 'sp2' }), h('b', { text: KES(x.price) }), h('a', { class: 'btn sm', href: '/contact?service=' + encodeURIComponent(x.name) }, 'Request')))))));

  /* account */
  const pwForm = h('form', { class: 'form', novalidate: true }); const p1 = h('input', { type: 'password', autocomplete: 'new-password', minlength: 8 }), p2 = h('input', { type: 'password', autocomplete: 'new-password' }), pm = h('div', { class: 'err', role: 'alert' });
  pwForm.append(h('label', {}, 'New password (8+ characters)', p1), h('label', {}, 'Repeat new password', p2), pm, h('button', { class: 'btn pri', type: 'submit' }, 'Update password'));
  pwForm.addEventListener('submit', async e => { e.preventDefault(); pm.className = 'err'; if (p1.value.length < 8) return void (pm.textContent = 'Use at least 8 characters.'); if (p1.value !== p2.value) return void (pm.textContent = 'The two passwords do not match.');
    try { await api.changePassword(p1.value); pm.className = 'ok'; pm.textContent = 'Password updated.'; p1.value = p2.value = ''; } catch (x) { pm.textContent = x.message; } });
  const account = h('div', { class: 'grid' }, h('div', { class: 'hero' }, h('h1', { text: 'Your account' })),
    h('div', { class: 'grid g2' },
      h('div', { class: 'card' }, h('h2', { text: 'Your details' }), [['Name', me.full_name], ['Company', me.company], ['Email', me.email || s.user.email], ['Phone', me.phone]].map(r => h('div', { class: 'row', style: 'padding:6px 0;border-bottom:1px solid var(--line)' }, h('span', { class: 'muted', text: r[0] }), h('span', { class: 'sp2' }), h('b', { text: r[1] || '\u2014' }))),
        h('div', { style: 'margin-top:12px' }, h('button', { class: 'btn sm', onclick: () => openForm({ title: 'Edit your details', values: me, fields: [{ name: 'full_name', label: 'Full name', required: true }, { name: 'company', label: 'Company' }, { name: 'phone', label: 'Phone' }], onSubmit: async v => { await api.updateProfile(v); reload(); } }) }, 'Edit details'))),
      h('div', { class: 'card' }, h('h2', { text: 'Change password' }), pwForm),
      h('div', { class: 'card' }, h('h2', { text: 'Need help?' }), h('p', { class: 'muted', style: 'margin-top:0', text: 'Reach Peter directly. Quote your project or invoice number so it can be found quickly.' }),
        h('div', { class: 'row' }, h('a', { class: 'btn sun', target: '_blank', rel: 'noopener', href: wa('Hello Peter, I need help with my account.') }, 'WhatsApp'), h('a', { class: 'btn', href: 'mailto:' + B.email }, 'Email'), h('a', { class: 'btn', href: 'tel:' + B.phone.replace(/\s/g, '') }, 'Call')))));

  root.append(...chrome(s, 'Client portal'));
  const main = h('main', { class: 'wrap' });
  tabs = tabsUI([{ id: 'overview', label: 'Overview', node: overview }, { id: 'projects', label: 'Projects', node: projectsNode, badge: active.length || '' }, { id: 'billing', label: 'Billing', node: billing, badge: owing.length || '' }, { id: 'files', label: 'Files', node: filesNode }, { id: 'services', label: 'Services', node: services }, { id: 'account', label: 'Account', node: account }], main);
  main.prepend(tabs.bar); root.append(main);
  if (/[?&]reset=1/.test(location.search)) { tabs.show('account'); toast('Choose a new password below.'); p1.focus(); }
}

/* ---------------- ADMIN CONSOLE ---------------- */
async function initAdmin() {
  const s = await guard('admin'); if (!s) return;
  const root = $('#app'); let D, cur = 'overview';
  const load = async () => { const [profiles, projects, milestones, updates, invoices, payments, files] = await Promise.all([api.list('profiles', { order: 'created_at', asc: true }), api.list('projects'), api.list('milestones', { order: 'sort', asc: true }), api.list('updates'), api.list('invoices', { order: 'issue_date' }), api.list('payments', { order: 'paid_on' }), api.list('files')]); return { profiles, projects, milestones, updates, invoices, payments, files }; };
  const clients = () => D.profiles.filter(p => p.role === 'client');
  const prof = id => D.profiles.find(p => p.id === id) || {}, cname = id => { const c = prof(id); return c.company || c.full_name || c.email || '?'; };
  const pname = id => (D.projects.find(p => p.id === id) || {}).name || '\u2014';
  const clean = o => { const r = {}; for (const [k, v] of Object.entries(o)) { if (v === undefined) continue; r[k] = v === '' ? null : v; } return r; };
  const addDays = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const act = async (fn, okMsg) => { try { await fn(); D = await load(); render(); if (okMsg) toast(okMsg); } catch (e) { toast(e.message, true); } };
  const sure = m => window.confirm(m);
  const btn = (t, fn, cls) => h('button', { class: 'btn sm ' + (cls || ''), onclick: fn }, t);
  const clientOpts = () => clients().map(c => ({ value: c.id, label: cname(c.id) + (c.full_name && c.company ? ' (' + c.full_name + ')' : '') }));
  const nextNumber = () => { let n = D.invoices.length + 1, num; do { num = 'PM254-INV-' + new Date().getFullYear() + '-' + String(n++).padStart(3, '0'); } while (D.invoices.some(i => i.number === num)); return num; };

  const editClient = c => openForm({ title: 'Edit client: ' + (c.email || ''), values: c, fields: [{ name: 'full_name', label: 'Full name', required: true }, { name: 'company', label: 'Company' }, { name: 'phone', label: 'Phone' }], onSubmit: v => act(() => api.updateProfile(clean(v), c.id), 'Client saved') });
  const editProject = p => { if (!clients().length) return toast('Add a client first (see the Clients tab).', true); p = p || {};
    openForm({ title: p.id ? 'Edit project' : 'New project', values: { status: 'Planning', progress: 0, ...p }, fields: [
      { name: 'client_id', label: 'Client', type: 'select', options: clientOpts(), required: true }, { name: 'name', label: 'Project name', required: true },
      { name: 'service', label: 'Service', type: 'select', options: [...C.SERVICES.map(x => x.name), 'Other'] }, { name: 'status', label: 'Status', type: 'select', options: ['Planning', 'In progress', 'In review', 'Delivered', 'On hold'] },
      { name: 'progress', label: 'Progress (%)', type: 'number', min: 0, max: 100, step: 1, required: true }, { name: 'start_date', label: 'Start date', type: 'date' }, { name: 'due_date', label: 'Due date', type: 'date' }, { name: 'summary', label: 'Summary shown to the client', type: 'textarea' }],
      onSubmit: v => { v.progress = Math.max(0, Math.min(100, v.progress)); return act(() => api.upsert('projects', clean({ id: p.id, ...v })), 'Project saved'); } }); };
  function milestonesModal(p) {
    const box = h('div'); let close;
    const draw = () => { const ms = D.milestones.filter(m => m.project_id === p.id); box.replaceChildren(...[
      ms.length ? ms.map(m => h('div', { class: 'row', style: 'padding:8px 0;border-bottom:1px solid var(--line)' }, h('b', { text: m.title, style: 'flex:1;min-width:140px' }),
        (() => { const sel = h('select', { style: 'width:auto' }, ['pending', 'active', 'done'].map(x => h('option', { value: x, selected: x === m.status }, x))); sel.onchange = () => act(async () => { await api.upsert('milestones', { id: m.id, status: sel.value }); }).then(draw); return sel; })(),
        h('span', { class: 'small muted', text: fmtDate(m.due_date) }), btn('\u2715', () => { if (sure('Delete milestone?')) act(() => api.remove('milestones', m.id)).then(draw); }, 'danger'))) : h('p', { class: 'muted', text: 'No milestones yet.' })].flat()); };
    const t = h('input', { placeholder: 'New milestone title' }), d = h('input', { type: 'date', style: 'max-width:170px' });
    const add = h('form', { class: 'row', style: 'margin-top:12px' }, t, d, h('button', { class: 'btn pri sm', type: 'submit' }, 'Add'));
    add.addEventListener('submit', e => { e.preventDefault(); if (!t.value.trim()) return; const sort = Math.max(0, ...D.milestones.filter(m => m.project_id === p.id).map(m => m.sort)) + 1; act(() => api.upsert('milestones', clean({ project_id: p.id, title: t.value.trim(), due_date: d.value, status: 'pending', sort }))).then(() => { t.value = ''; draw(); }); });
    draw(); close = modal([h('h2', { text: 'Milestones: ' + p.name }), box, add, h('div', { class: 'acts', style: 'margin-top:14px' }, h('button', { class: 'btn', onclick: () => close() }, 'Done'))], true);
  }
  const postUpdate = p => openForm({ title: 'Post an update: ' + p.name, submit: 'Post', fields: [{ name: 'body', label: 'Message to the client', type: 'textarea', required: true }], onSubmit: v => act(() => api.upsert('updates', { project_id: p.id, body: v.body }), 'Update posted') });
  function invoiceBuilder(inv) {
    if (!clients().length) return toast('Add a client first (see the Clients tab).', true); inv = inv || {};
    const items = (inv.items && inv.items.length ? inv.items : [{ description: '', qty: 1, unit_price: 0 }]).map(x => ({ ...x }));
    const cSel = h('select', {}, clientOpts().map(o => h('option', { value: o.value, selected: o.value === inv.client_id }, o.label))), pSel = h('select');
    const fillP = () => pSel.replaceChildren(h('option', { value: '' }, 'No project'), ...D.projects.filter(p => p.client_id === cSel.value).map(p => h('option', { value: p.id, selected: p.id === inv.project_id }, p.name))); cSel.onchange = fillP; fillP();
    const num = h('input', { value: inv.number || nextNumber() }), issue = h('input', { type: 'date', value: inv.issue_date || todayISO() }), due = h('input', { type: 'date', value: inv.due_date || addDays(7) });
    const disc = h('input', { type: 'number', min: 0, max: 100, step: '0.5', value: inv.subtotal && inv.discount ? Math.round(inv.discount / inv.subtotal * 1000) / 10 : 0 }), vat = h('input', { type: 'checkbox', style: 'width:auto' }); vat.checked = inv.vat > 0;
    const notes = h('textarea', { rows: 2 }); notes.value = inv.notes || ''; const err = h('div', { class: 'err', role: 'alert' }), rows = h('div', { class: 'items' }), tot = h('div', { class: 'card', style: 'padding:12px;display:grid;gap:4px' });
    const calc = () => { const sub = items.reduce((a, i) => a + (+i.qty || 0) * (+i.unit_price || 0), 0), d = Math.round(sub * (+disc.value || 0) / 100), v = vat.checked ? Math.round((sub - d) * C.VAT_RATE) : 0; return { sub, d, v, total: sub - d + v }; };
    const drawT = () => { const t = calc(); tot.replaceChildren(...[['Subtotal', t.sub], ['Discount', -t.d], ['VAT (' + Math.round(C.VAT_RATE * 100) + '%)', t.v], ['Total', t.total]].map((r, i) => h('div', { class: 'row', style: i === 3 ? 'font-weight:800' : '' }, r[0], h('span', { class: 'sp2' }), KES(r[1])))); };
    const drawR = () => { rows.replaceChildren(...items.map((it, idx) => { const d = h('input', { list: 'svc', placeholder: 'Description', value: it.description }), q = h('input', { type: 'number', min: 0, step: 1, value: it.qty, 'aria-label': 'Quantity' }), pr = h('input', { type: 'number', min: 0, step: 1, value: it.unit_price, 'aria-label': 'Unit price' });
      d.oninput = () => { it.description = d.value; const sv = C.SERVICES.find(x => x.name === d.value); if (sv && !+it.unit_price) { it.unit_price = sv.price; pr.value = sv.price; } drawT(); }; q.oninput = () => { it.qty = +q.value; drawT(); }; pr.oninput = () => { it.unit_price = +pr.value; drawT(); };
      return h('div', { class: 'it' }, d, q, pr, h('button', { type: 'button', class: 'btn sm danger', 'aria-label': 'Remove line', onclick: () => { items.splice(idx, 1); if (!items.length) items.push({ description: '', qty: 1, unit_price: 0 }); drawR(); drawT(); } }, '\u2715')); })); };
    disc.oninput = drawT; vat.onchange = drawT; drawR(); drawT(); let close;
    const form = h('form', { class: 'form', novalidate: true }, h('datalist', { id: 'svc' }, C.SERVICES.map(x => h('option', { value: x.name }))),
      h('div', { class: 'grid g2' }, h('label', {}, 'Client', cSel), h('label', {}, 'Project', pSel), h('label', {}, 'Invoice number', num), h('label', {}, 'Issue date', issue), h('label', {}, 'Due date', due)),
      h('div', {}, h('b', { text: 'Line items' }), h('div', { class: 'small muted', text: 'Type a service name to pick its rate-card price, or write your own line.' })), rows, h('div', {}, h('button', { type: 'button', class: 'btn sm', onclick: () => { items.push({ description: '', qty: 1, unit_price: 0 }); drawR(); } }, '+ Add line')),
      h('div', { class: 'grid g2' }, h('label', {}, 'Discount (%)', disc, h('span', { class: 'small muted', text: 'Rate-card offer: ' + Math.round(C.OFFER_DISCOUNT * 100) + '%' })), h('label', { style: 'display:flex;gap:10px;align-items:center;margin-top:24px' }, vat, 'Add VAT (only if VAT-registered)')),
      tot, h('label', {}, 'Notes shown on the invoice', notes), err, h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn', onclick: () => close() }, 'Cancel'), h('button', { class: 'btn pri', type: 'submit' }, inv.id ? 'Save invoice' : 'Create invoice')));
    form.addEventListener('submit', async e => { e.preventDefault(); err.textContent = ''; const t = calc(), good = items.filter(i => i.description.trim() && +i.qty > 0);
      if (!cSel.value || !num.value.trim() || !due.value || !good.length) { err.textContent = 'Choose a client, add at least one line item, and set the invoice number and due date.'; return; }
      try { await api.upsert('invoices', clean({ id: inv.id, client_id: cSel.value, project_id: pSel.value, number: num.value.trim(), issue_date: issue.value, due_date: due.value, items: good.map(i => ({ description: i.description.trim(), qty: +i.qty, unit_price: +i.unit_price })), subtotal: t.sub, discount: t.d, vat: t.v, total: t.total, notes: notes.value.trim() })); close(); D = await load(); render(); toast('Invoice saved'); } catch (x) { err.textContent = x.message; } });
    close = modal([h('h2', { text: inv.id ? 'Edit invoice' : 'New invoice' }), form], true);
  }
  const paymentForm = inv => { const open = D.invoices.filter(i => i.balance > 0); if (!open.length && !inv) return toast('No unpaid invoices.', true);
    const f = openForm({ title: 'Record a payment', submit: 'Record payment', values: { invoice_id: inv ? inv.id : open[0].id, amount: inv ? inv.balance : open[0].balance, method: 'M-Pesa', paid_on: todayISO() },
      fields: [{ name: 'invoice_id', label: 'Invoice', type: 'select', options: D.invoices.map(i => ({ value: i.id, label: i.number + ' \u00b7 ' + cname(i.client_id) + ' \u00b7 balance ' + KES(i.balance) })) }, { name: 'amount', label: 'Amount (' + C.CURRENCY + ')', type: 'number', min: 1, step: 1, required: true }, { name: 'method', label: 'Method', type: 'select', options: ['M-Pesa', 'Bank transfer', 'PayPal', 'Cash', 'Other'] }, { name: 'reference', label: 'Transaction reference' }, { name: 'paid_on', label: 'Date received', type: 'date', required: true }],
      onSubmit: v => act(() => api.upsert('payments', clean(v)), 'Payment recorded') });
    f.inputs.invoice_id.onchange = () => { const i = D.invoices.find(x => x.id === f.inputs.invoice_id.value); if (i) f.inputs.amount.value = i.balance; }; };
  const uploadForm = () => { if (!clients().length) return toast('Add a client first.', true);
    const f = openForm({ title: 'Upload a file for a client', submit: 'Upload', fields: [{ name: 'client_id', label: 'Client', type: 'select', options: clientOpts(), required: true }, { name: 'project_id', label: 'Project (optional)', type: 'select', options: [{ value: '', label: 'No project' }, ...D.projects.map(p => ({ value: p.id, label: cname(p.client_id) + ': ' + p.name }))] }, { name: 'category', label: 'Category', type: 'select', options: ['Deliverable', 'Quotation', 'Agreement', 'Invoice', 'Receipt', 'Guide', 'Other'] }, { name: 'file', label: 'File', type: 'file', required: true, help: 'Any document, image or archive (keep under 50 MB).' }],
      onSubmit: v => { if (v.file.size > 50 * 1048576) throw new Error('File is larger than 50 MB.'); return act(() => api.upload(v.file, { client_id: v.client_id, project_id: v.project_id || null, category: v.category }), 'File uploaded'); } }); };

  function render() {
    const outstanding = D.invoices.reduce((a, i) => a + Number(i.balance), 0), over = D.invoices.filter(i => i.status === 'Overdue');
    const stat = (k, v, s) => h('div', { class: 'card stat' + (s === 'warn' ? ' warn' : '') }, h('div', { class: 'k', text: k }), h('div', { class: 'v', text: v }));
    const overview = h('div', { class: 'grid' }, h('div', { class: 'hero' }, h('h1', { text: 'Admin console' }), h('p', { text: 'Everything your clients see is managed here.' })),
      h('div', { class: 'grid g4' }, stat('Clients', String(clients().length)), stat('Active projects', String(D.projects.filter(p => p.status !== 'Delivered').length)), stat('Outstanding', KES(outstanding), over.length ? 'warn' : ''), stat('Overdue invoices', String(over.length), over.length ? 'warn' : '')),
      h('div', { class: 'card' }, h('h2', { text: 'Quick actions' }), h('div', { class: 'row' }, btn('New project', () => editProject(), 'pri'), btn('New invoice', () => invoiceBuilder(), 'pri'), btn('Record payment', () => paymentForm()), btn('Upload file', uploadForm))));
    const clientsNode = h('div', { class: 'grid' }, h('div', { class: 'hero' }, h('h1', { text: 'Clients' })),
      h('div', { class: 'card' }, h('b', { text: 'Adding a client: ' }), api.mode === 'demo' ? 'In live mode, create the login in Supabase (Authentication > Users > Add user). They then appear here automatically so you can fill in their details.' : 'Create the login in Supabase: Authentication > Users > Add user (tick "Auto confirm user"). The client appears here automatically; then set their name and company, and add their first project.'),
      table([{ t: 'Name' }, { t: 'Company' }, { t: 'Email' }, { t: 'Phone' }, { t: 'Projects', r: 1 }, { t: 'Owing', r: 1 }, { t: '' }], clients().map(c => [h('b', { text: c.full_name || '\u2014' }), c.company || '\u2014', c.email || '', c.phone || '\u2014', String(D.projects.filter(p => p.client_id === c.id).length), KES(D.invoices.filter(i => i.client_id === c.id).reduce((a, i) => a + Number(i.balance), 0)), btn('Edit', () => editClient(c))]), 'No clients yet.'));
    const projectsNode = h('div', { class: 'grid' }, h('div', { class: 'row' }, h('h1', { text: 'Projects', style: 'font-size:28px' }), h('span', { class: 'sp2' }), btn('+ New project', () => editProject(), 'pri')),
      D.projects.length ? D.projects.map(p => h('article', { class: 'card pj' }, h('div', { class: 'head' }, h('div', { style: 'flex:1;min-width:180px' }, h('h3', { text: p.name }), h('div', { class: 'small muted', text: cname(p.client_id) + ' \u00b7 ' + (p.service || '') + ' \u00b7 due ' + fmtDate(p.due_date) })), badge(p.status), h('b', { text: p.progress + '%' })), bar(p.progress),
        h('div', { class: 'row' }, btn('Edit', () => editProject(p)), btn('Milestones', () => milestonesModal(p)), btn('Post update', () => postUpdate(p), 'sun'), btn('Delete', () => { if (sure('Delete "' + p.name + '" and its milestones and updates?')) act(() => api.remove('projects', p.id), 'Project deleted'); }, 'danger')))) : h('div', { class: 'card empty', text: 'No projects yet.' }));
    const billing = h('div', { class: 'grid' }, h('div', { class: 'row' }, h('h1', { text: 'Billing', style: 'font-size:28px' }), h('span', { class: 'sp2' }), btn('Record payment', () => paymentForm()), btn('+ New invoice', () => invoiceBuilder(), 'pri')),
      table([{ t: 'Invoice' }, { t: 'Client' }, { t: 'Due', nw: 1 }, { t: 'Total', r: 1 }, { t: 'Paid', r: 1 }, { t: 'Balance', r: 1 }, { t: 'Status' }, { t: '' }], D.invoices.map(i => [h('b', { text: i.number }), cname(i.client_id), fmtDate(i.due_date), KES(i.total), KES(i.paid), h('b', { text: KES(i.balance) }), badge(i.status),
        h('div', { class: 'row' }, btn('View', () => showInvoice(i, prof(i.client_id), D.payments.filter(p => p.invoice_id === i.id))), btn('Edit', () => invoiceBuilder(i)), i.balance > 0 ? btn('Payment', () => paymentForm(i), 'sun') : null, btn('\u2715', () => { if (sure('Delete invoice ' + i.number + ' and its payments?')) act(() => api.remove('invoices', i.id), 'Invoice deleted'); }, 'danger'))]), 'No invoices yet.'));
    const filesNode = h('div', { class: 'grid' }, h('div', { class: 'row' }, h('h1', { text: 'Files', style: 'font-size:28px' }), h('span', { class: 'sp2' }), btn('+ Upload file', uploadForm, 'pri')),
      table([{ t: 'File' }, { t: 'Client' }, { t: 'Project' }, { t: 'Category' }, { t: 'Added', nw: 1 }, { t: 'Size', nw: 1 }, { t: '' }], D.files.map(f => [h('b', { text: f.name }), cname(f.client_id), pname(f.project_id), f.category, fmtDate(f.created_at), fmtSize(f.size),
        h('div', { class: 'row' }, btn('Download', async () => { try { const u = await api.fileUrl(f); const a = h('a', { href: u, download: f.name }); document.body.append(a); a.click(); a.remove(); } catch (x) { toast(x.message, true); } }), btn('\u2715', () => { if (sure('Delete ' + f.name + '?')) act(() => api.removeFile(f), 'File deleted'); }, 'danger'))]), 'No files yet.'));
    main.replaceChildren(); const t = tabsUI([{ id: 'overview', label: 'Overview', node: overview }, { id: 'clients', label: 'Clients', node: clientsNode, badge: clients().length || '' }, { id: 'projects', label: 'Projects', node: projectsNode }, { id: 'billing', label: 'Billing', node: billing, badge: over.length || '' }, { id: 'files', label: 'Files', node: filesNode }], main);
    main.prepend(t.bar); t.show(cur); t.bar.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) cur = b.dataset.tab; });
  }
  const main = h('main', { class: 'wrap' }); D = await load(); root.append(...chrome(s, 'Admin console'), main); render();
}

window.__portalInit = { login: () => initLogin(), app: () => initApp(), admin: () => initAdmin() };
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page, fn = { login: initLogin, app: initApp, admin: initAdmin }[page];
  if (fn) fn().catch(e => { console.error(e); const m = h('p', { class: 'wrap err', text: 'Something went wrong: ' + e.message }); ($('#app') || document.body).append(m); });
});
})();
