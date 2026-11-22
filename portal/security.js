/* Pinchez Media 254 - Portal security layer.
   Sign-in throttling and lockout, bot honeypot, optional CAPTCHA, generic error messages (no account guessing),
   idle and absolute session limits, sign out of all devices, two-step verification (authenticator app), password policy.
   Note: passwords are hashed (bcrypt) by Supabase on the server and never reach this code in readable form. */
(function () {
'use strict';
const C = window.PORTAL_CONFIG, S = C.SESSION || {}, L = C.LOGIN || {};
const PM = () => window.PM, H = (...a) => PM().h(...a);
const LS = window.localStorage;
const K = { guard: 'pm254_login_guard', start: 'pm254_session_start', act: 'pm254_last_activity', msg: 'pm254_notice', link: 'pm254_link_ts' };
const jget = k => { try { return JSON.parse(LS.getItem(k) || 'null'); } catch (e) { return null; } };
const jset = (k, v) => { try { LS.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
const del = k => { try { LS.removeItem(k); } catch (e) { /* ignore */ } };
const validEmail = e => e.length > 5 && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

function passwordProblem(pw, email) {
  if (pw.length < 10) return 'Use at least 10 characters.'; if (pw.length > 128) return 'Use 128 characters at most.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  const local = String(email || '').split('@')[0].toLowerCase(); if (local.length >= 4 && pw.toLowerCase().includes(local)) return 'Do not use your email name inside the password.';
  if (/^(password|12345678|qwerty|letmein|admin|welcome)/i.test(pw) || /^(.)\1+$/.test(pw)) return 'That password is too easy to guess.'; return '';
}
/* ---- sign-in throttling: after N failures the form locks for longer and longer ---- */
const lockLeft = () => { const g = jget(K.guard); return g && g.until > Date.now() ? Math.ceil((g.until - Date.now()) / 1000) : 0; };
function recordFail() { const g = jget(K.guard) || { fails: 0, until: 0 }; g.fails++; const over = g.fails - (L.maxFreeAttempts || 5);
  if (over >= 0) g.until = Date.now() + Math.min(L.maxLockSeconds || 3600, (L.baseLockSeconds || 30) * Math.pow(2, over)) * 1000; jset(K.guard, g); }

async function initLogin() {
  const P = PM(), api = P.api, root = document.getElementById('app'), B = P.B;
  const shell = kids => root.replaceChildren(H('div', { class: 'login' }, H('div', { class: 'box' }, kids, H('p', { class: 'small muted', style: 'text-align:center;margin-top:16px' }, 'Need access? Contact ', H('a', { href: 'mailto:' + B.email, text: B.email }), ' \u00b7 ', H('a', { href: '/', text: 'Back to website' })))));
  const head = (t, sub) => H('div', { class: 'lg' }, H('img', { src: '/logo.png', alt: '' }), H('div', {}, H('h1', { text: t }), H('div', { class: 'muted small', text: sub || B.name })));
  if (!api) { shell(H('div', { class: 'card' }, head('Client portal'), H('p', { class: 'muted', text: window.__portalError || 'The client portal is not open yet.' }))); return; }
  const notice = LS.getItem(K.msg); del(K.msg);
  const done = async () => { const s = await api.getSession(); P.navTo(s && s.profile.role === 'admin' ? '/portal/admin.html' : '/portal/app.html'); };
  async function needsMfa() { try { const m = await api.mfaStatus(); return m.next === 'aal2' && m.current !== 'aal2'; } catch (e) { return false; } }
  function showMfa() {
    const code = H('input', { inputmode: 'numeric', pattern: '[0-9]*', maxlength: 6, autocomplete: 'one-time-code', 'aria-label': '6-digit code' }), msg = H('div', { class: 'err', role: 'alert' }), go = H('button', { class: 'btn pri', type: 'submit' }, 'Verify'); let tries = 0;
    const form = H('form', { class: 'form', novalidate: true }, H('label', {}, '6-digit code from your authenticator app', code), msg, go, H('div', { class: 'links' }, H('button', { type: 'button', onclick: async () => { await api.signOut('local'); location.reload(); } }, 'Cancel and sign out')));
    form.addEventListener('submit', async e => { e.preventDefault(); msg.textContent = ''; if (!/^\d{6}$/.test(code.value.trim())) return void (msg.textContent = 'Enter the 6 digits.'); go.disabled = true;
      try { const f = (await api.mfaFactors()).verified[0]; await api.mfaVerify(f.id, code.value.trim()); await done(); } catch (x) { tries++; msg.textContent = 'That code is not correct.'; go.disabled = false; code.value = ''; code.focus();
        if (tries >= 5) { LS.setItem(K.msg, 'Too many wrong codes. Please sign in again.'); await api.signOut('local'); location.reload(); } } });
    shell(H('div', { class: 'card' }, head('Two-step check', 'Enter your authenticator code'), form)); code.focus();
  }
  function showLogin() {
    const email = H('input', { type: 'email', name: 'email', autocomplete: 'username', maxlength: 254, inputmode: 'email', required: true }), pw = H('input', { type: 'password', name: 'password', autocomplete: 'current-password', maxlength: 128 });
    const hp = H('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true', class: 'hp' }), msg = H('div', { class: 'err', role: 'alert', 'aria-live': 'polite' }), go = H('button', { class: 'btn pri', type: 'submit' }, 'Sign in');
    const say = (t, good) => { msg.className = good ? 'ok' : 'err'; msg.textContent = t; }; let capToken = '', capId = null, timer = null;
    const cap = C.TURNSTILE_SITE_KEY ? H('div', { class: 'cap' }) : null;
    if (cap) { const sc = H('script', { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, onload: () => { capId = window.turnstile.render(cap, { sitekey: C.TURNSTILE_SITE_KEY, callback: t => { capToken = t; }, 'expired-callback': () => { capToken = ''; } }); } }); document.head.append(sc); }
    function lockUI() { clearInterval(timer); const tick = () => { const n = lockLeft(); if (n > 0) { go.disabled = true; say('Too many attempts. Try again in ' + mmss(n) + '.'); } else { go.disabled = false; clearInterval(timer); if (msg.textContent.startsWith('Too many attempts. Try again')) say(''); } }; tick(); if (lockLeft() > 0) timer = setInterval(tick, 1000); }
    async function emailLink(kind) { const e = email.value.trim().toLowerCase(); if (!validEmail(e)) return say('Enter your email first.'); const last = +LS.getItem(K.link) || 0; if (Date.now() - last < 60000) return say('Please wait a minute before asking for another email.');
      LS.setItem(K.link, String(Date.now())); try { await (kind === 'link' ? api.sendMagicLink(e) : api.resetPassword(e)); } catch (x) { /* never reveal whether the account exists */ } say('If that email has a portal account, a message is on its way. Check your inbox and spam folder.', true); }
    const form = H('form', { class: 'form', novalidate: true }, H('label', {}, 'Email', email), H('label', {}, 'Password', pw), hp, cap, msg, go,
      H('div', { class: 'links' }, H('button', { type: 'button', onclick: () => emailLink('link') }, 'Email me a sign-in link'), H('button', { type: 'button', onclick: () => emailLink('reset') }, 'Forgot password?')));
    form.addEventListener('submit', async e => { e.preventDefault(); say(''); if (lockLeft() > 0) return lockUI(); const em = email.value.trim().toLowerCase(), pass = pw.value;
      if (hp.value) { go.disabled = true; await new Promise(r => setTimeout(r, 1500)); go.disabled = false; return say('Wrong email or password.'); }
      if (!validEmail(em) || !pass || pass.length > 128) return say('Enter your email and password.'); if (C.TURNSTILE_SITE_KEY && !capToken) return say('Please complete the security check.');
      go.disabled = true; go.textContent = 'Signing in\u2026'; const t0 = Date.now();
      try { await api.signIn(em, pass, capToken); del(K.guard); jset(K.start, Date.now()); LS.setItem(K.act, String(Date.now())); if (await needsMfa()) showMfa(); else await done(); }
      catch (x) { const wait = 700 - (Date.now() - t0); if (wait > 0) await new Promise(r => setTimeout(r, wait)); recordFail(); capToken = ''; if (capId !== null && window.turnstile) window.turnstile.reset(capId);
        go.textContent = 'Sign in'; go.disabled = false; if (/rate|too many|429|captcha/i.test(x.message || '')) say('Too many attempts. Please wait a few minutes and try again.'); else say('Wrong email or password.'); lockUI(); } });
    shell(H('div', { class: 'card' }, head('Client portal'), notice ? H('div', { class: 'badge b-warn', style: 'display:block;margin-bottom:10px;white-space:normal', text: notice }) : null, H('p', { class: 'muted', style: 'margin-top:0', text: 'Sign in to see your projects, progress, bills and documents.' }), form)); lockUI();
  }
  let s = null; try { s = await api.getSession(); } catch (e) { s = null; }
  if (s) { if (await needsMfa()) return showMfa(); return done(); } showLogin();
}

/* ---- sessions: idle timeout, absolute lifetime, cross-tab sign-out ---- */
function clear() { del(K.start); del(K.act); }
async function endSession(msg) { try { LS.setItem(K.msg, msg); } catch (e) { /* ignore */ } clear(); try { await PM().api.signOut('local'); } catch (e) { /* ignore */ } PM().navTo('/portal/'); }
function startSession(role) {
  const idleMs = (role === 'admin' ? S.adminIdleMin || 15 : S.clientIdleMin || 30) * 60000, maxMs = (role === 'admin' ? S.adminMaxHours || 8 : S.clientMaxHours || 12) * 3600000, warnMs = (S.warnSeconds || 60) * 1000;
  if (!jget(K.start)) jset(K.start, Date.now()); LS.setItem(K.act, String(Date.now())); let closeWarn = null, last = 0, count = null;
  const touch = () => { const n = Date.now(); if (!closeWarn && n - last > 4000) { last = n; try { LS.setItem(K.act, String(n)); } catch (e) { /* ignore */ } } };
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(ev => window.addEventListener(ev, touch, { passive: true }));
  window.addEventListener('storage', e => { if (e.key === K.start && !e.newValue) PM().navTo('/portal/'); });
  const warn = left => { if (!closeWarn) { count = H('b', { text: String(left) }); closeWarn = PM().modal([H('h2', { text: 'Still there?' }), H('p', {}, 'For your security you will be signed out in ', count, ' seconds because there has been no activity.'), H('div', { class: 'acts' }, H('button', { class: 'btn', onclick: () => endSession('You signed out.') }, 'Sign out now'), H('button', { class: 'btn pri', onclick: () => { LS.setItem(K.act, String(Date.now())); closeWarn(); closeWarn = null; } }, 'Stay signed in'))]); } else count.textContent = String(left); };
  setInterval(() => { const now = Date.now(), act = +LS.getItem(K.act) || now, st = +jget(K.start) || now;
    if (now - st > maxMs) return endSession('Your session expired. Please sign in again.'); const left = idleMs - (now - act);
    if (left <= 0) return endSession('You were signed out because of inactivity.');
    if (left <= warnMs) warn(Math.ceil(left / 1000)); else if (closeWarn) { closeWarn(); closeWarn = null; } }, 1000);
  setInterval(async () => { try { if (!(await PM().api.getSession())) endSession('You were signed out. Please sign in again.'); } catch (e) { /* offline: ignore */ } }, 60000);
}

/* ---- password form and security card (two-step verification, sign out everywhere) ---- */
function passwordForm(email) {
  const P = PM(), p1 = H('input', { type: 'password', autocomplete: 'new-password', maxlength: 128 }), p2 = H('input', { type: 'password', autocomplete: 'new-password', maxlength: 128 }), m = H('div', { class: 'err', role: 'alert' });
  const f = H('form', { class: 'form', novalidate: true }, H('label', {}, 'New password (10+ characters, letters and a number)', p1), H('label', {}, 'Repeat new password', p2), m, H('button', { class: 'btn pri', type: 'submit' }, 'Update password'));
  f.addEventListener('submit', async e => { e.preventDefault(); m.className = 'err'; const pr = passwordProblem(p1.value, email); if (pr) return void (m.textContent = pr); if (p1.value !== p2.value) return void (m.textContent = 'The two passwords do not match.');
    try { await P.api.changePassword(p1.value); m.className = 'ok'; m.textContent = 'Password updated.'; p1.value = p2.value = ''; } catch (x) { m.textContent = x.message; } }); return f;
}
function card(isAdmin, email) {
  const P = PM(), api = P.api, box = H('div', { class: 'card' });
  async function draw() {
    box.replaceChildren(H('h2', { text: 'Security' })); let f = { verified: [] }; try { f = await api.mfaFactors(); } catch (e) { /* ignore */ }
    const on = f.verified[0];
    box.append(H('div', { class: 'row', style: 'padding:6px 0' }, H('b', { text: 'Two-step verification' }), H('span', { class: 'badge ' + (on ? 'b-ok' : 'b-warn'), text: on ? 'On' : 'Off' })),
      H('p', { class: 'small muted', style: 'margin:0 0 8px', text: on ? 'Your sign-in also needs a 6-digit code from your authenticator app, so a stolen password alone is not enough.' : 'Adds a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy) on top of your password.' + (isAdmin ? ' Strongly recommended for the admin account.' : '') }),
      on ? H('button', { class: 'btn sm danger', onclick: async () => { if (!window.confirm('Turn off two-step verification?')) return; try { await api.mfaRemove(on.id); P.toast('Two-step verification is off'); draw(); } catch (x) { P.toast(x.message, true); } } }, 'Turn off')
         : H('button', { class: 'btn sm pri', onclick: enroll }, 'Set up two-step verification'));
    box.append(H('div', { style: 'border-top:1px solid var(--line);margin-top:14px;padding-top:12px' }, H('b', { text: 'Sessions' }), H('p', { class: 'small muted', style: 'margin:4px 0 8px', text: 'You are signed out automatically after ' + (isAdmin ? S.adminIdleMin || 15 : S.clientIdleMin || 30) + ' minutes without activity, and after ' + (isAdmin ? S.adminMaxHours || 8 : S.clientMaxHours || 12) + ' hours at most.' }),
      H('button', { class: 'btn sm', onclick: async () => { try { await api.signOut('global'); } catch (x) { /* ignore */ } clear(); P.navTo('/portal/'); } }, 'Sign out of all devices')));
    if (isAdmin) box.append(H('div', { style: 'border-top:1px solid var(--line);margin-top:14px;padding-top:12px' }, H('b', { text: 'Change password' }), passwordForm(email)));
  }
  async function enroll() {
    try { const en = await api.mfaEnroll(), code = H('input', { inputmode: 'numeric', maxlength: 6, autocomplete: 'one-time-code', 'aria-label': '6-digit code' }), m = H('div', { class: 'err', role: 'alert' }); let close;
      close = P.modal([H('h2', { text: 'Set up two-step verification' }), H('ol', { class: 'small' }, H('li', {}, 'Open your authenticator app and scan this code.'), H('li', {}, 'Type the 6-digit code it shows, then press Verify.')),
        H('div', { style: 'text-align:center;margin:10px 0' }, H('img', { src: en.qr, alt: 'Scan this QR code with your authenticator app', width: '190', height: '190', style: 'background:#fff;padding:8px;border-radius:10px' })),
        H('p', { class: 'small muted', style: 'word-break:break-all' }, 'Cannot scan? Enter this key instead: ', H('b', { text: en.secret })), H('label', {}, 'Code', code), m,
        H('div', { class: 'acts' }, H('button', { class: 'btn', onclick: () => close() }, 'Cancel'), H('button', { class: 'btn pri', onclick: async () => { try { await api.mfaVerify(en.id, code.value.trim()); close(); P.toast('Two-step verification is on'); draw(); } catch (x) { m.textContent = 'That code is not correct. Try the newest one.'; } } }, 'Verify'))]);
    } catch (x) { P.toast(x.message, true); }
  }
  draw(); return box;
}
window.PMSecurity = { initLogin, startSession, clear, card, passwordForm, passwordProblem };
})();
