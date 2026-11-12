// The admin page: sign in with the admin password, then read test-instance requests and
// feature suggestions from storage (through the edge script), tick off the ones replied to,
// add a note, reply by email, or delete. The sign-in token is kept in this browser for 30 days.

const KEY = 'wab-admin';
const $ = (id) => document.getElementById(id);

function loadToken() {
  try {
    const t = JSON.parse(localStorage.getItem(KEY) || 'null');
    return t && t.token && t.expires > Date.now() ? t : null;
  } catch { return null; }
}
function saveToken(t) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* private window: lasts this page */ } }
function clearToken() { try { localStorage.removeItem(KEY); } catch { /* nothing kept */ } }

let session = loadToken();
const state = { kind: 'requests', show: 'todo', search: '', items: { requests: null, features: null } };

async function api(action, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (session) headers.Authorization = `Bearer ${session.token}`;
  const res = await fetch(`/api/admin/${action}`, { method: 'POST', headers, body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && action !== 'login') { signOut('Your sign-in has expired. Please sign in again.'); throw new Error('signed out'); }
  if (!res.ok) throw new Error(data.error || `Something went wrong (${res.status}).`);
  return data;
}

// ---------- signing in and out ----------

function show(signedIn) {
  $('signin').hidden = signedIn;
  $('inbox').hidden = !signedIn;
  $('signout').hidden = !signedIn;
  if (!signedIn) setTimeout(() => $('a-password').focus(), 0);
}

function signOut(message) {
  session = null;
  clearToken();
  state.items = { requests: null, features: null };
  show(false);
  const s = $('signin-status');
  s.textContent = message || '';
  s.className = `form-status ${message ? 'err' : ''}`;
}

$('signin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = $('signin-status');
  const pw = $('a-password').value;
  if (!pw) { status.textContent = 'Enter the admin password.'; status.className = 'form-status err'; return; }
  status.textContent = 'Signing in…';
  status.className = 'form-status';
  try {
    session = await api('login', { password: pw });
    saveToken(session);
    $('a-password').value = '';
    status.textContent = '';
    show(true);
    loadAll();
  } catch (err) {
    status.textContent = err.message;
    status.className = 'form-status err';
  }
});
$('signout').addEventListener('click', () => signOut());

// ---------- loading ----------

async function load(kind) {
  const { items } = await api('list', { kind });
  state.items[kind] = items;
}

// ---------- visits ----------
async function loadVisits() {
  const rows = $('visits-rows');
  try {
    const { days } = await api('stats', { days: 30 });
    const sum = (k, n) => days.slice(0, n).reduce((t, d) => t + (d[k] || 0), 0);
    $('visits-totals').textContent = `Last 7 days: ${sum('view', 7)} page views, ${sum('demo', 7)} demo clicks, ${sum('signup', 7)} Start free clicks. Last 30 days: ${sum('view', 30)}, ${sum('demo', 30)} and ${sum('signup', 30)}.`;
    rows.replaceChildren(...days.slice(0, 14).map((d) => {
      const tr = document.createElement('tr');
      const pages = Object.entries(d.pages || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([p, n]) => `${p} ${n}`).join(', ');
      for (const v of [new Date(`${d.day}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), d.view, d.demo, d.signup, pages]) {
        const td = document.createElement('td'); td.textContent = String(v); tr.append(td);
      }
      return tr;
    }));
  } catch (err) {
    if (err.message !== 'signed out') $('visits-totals').textContent = `The visit counts couldn't be read: ${err.message}`;
  }
}

async function loadAll() {
  loadVisits();
  $('inbox-status').textContent = 'Loading…';
  try {
    await Promise.all([load('requests'), load('features')]);
    $('inbox-status').textContent = '';
  } catch (err) {
    if (err.message !== 'signed out') $('inbox-status').textContent = err.message;
  }
  render();
}

// ---------- showing ----------

const fmtDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== '') e.append(kid);
  return e;
}

function matches(item) {
  if (state.show === 'todo' && item.replied) return false;
  if (state.show === 'done' && !item.replied) return false;
  if (!state.search) return true;
  const text = Object.values(item).filter((v) => typeof v === 'string').join(' ').toLowerCase();
  return state.search.toLowerCase().split(/\s+/).every((w) => text.includes(w));
}

function counts() {
  for (const kind of ['requests', 'features']) {
    const list = state.items[kind];
    const todo = list ? list.filter((i) => !i.replied).length : null;
    const span = document.querySelector(`[data-count="${kind}"]`);
    span.textContent = todo === null ? '' : String(todo);
    span.title = todo === null ? '' : `${todo} to reply`;
    span.hidden = !todo;
  }
}

function detailRows(item, kind) {
  const rows = kind === 'requests'
    ? [['Organisation', item.organisation], ['Users', item.users], ['Starting from', item.existing], ['Country', item.country]]
    : [['Part of the app', item.area], ['Country', item.country]];
  return rows.filter(([, v]) => v).map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)));
}

function card(item, kind) {
  const who = item.name || (kind === 'features' ? 'Anonymous' : '');
  const subject = kind === 'requests' ? 'Your Web Access Builder test instance' : 'Your Web Access Builder feature suggestion';
  const replied = el('input', { type: 'checkbox', checked: !!item.replied, 'aria-label': `Replied to ${who}` });
  const note = el('input', { type: 'text', class: 'input note', value: item.note || '', placeholder: 'Note (only you see this)', maxlength: '2000', 'aria-label': 'Note' });
  const saved = el('span', { class: 'saved', role: 'status', 'aria-live': 'polite' });
  const say = (msg, bad) => { saved.textContent = msg; saved.className = `saved ${bad ? 'err' : ''}`; if (!bad) setTimeout(() => { if (saved.textContent === msg) saved.textContent = ''; }, 2000); };

  const update = async (patch) => {
    say('Saving…');
    try {
      const { item: fresh } = await api('update', { kind, id: item.id, ...patch });
      Object.assign(item, fresh);
      say('Saved');
      counts();
      if ('replied' in patch && state.show !== 'all') setTimeout(render, 500);
      else article.classList.toggle('is-replied', !!item.replied);
    } catch (err) {
      if (err.message !== 'signed out') say(err.message, true);
      replied.checked = !!item.replied;
    }
  };
  replied.addEventListener('change', () => update({ replied: replied.checked }));
  note.addEventListener('change', () => update({ note: note.value }));

  const del = el('button', { type: 'button', class: 'btn btn-ghost btn-small danger', onclick: async () => {
    if (del.dataset.confirm !== 'yes') { del.dataset.confirm = 'yes'; del.textContent = 'Click again to delete'; setTimeout(() => { del.dataset.confirm = ''; del.textContent = 'Delete'; }, 4000); return; }
    try {
      await api('delete', { kind, id: item.id });
      state.items[kind] = state.items[kind].filter((i) => i !== item);
      render();
    } catch (err) { if (err.message !== 'signed out') say(err.message, true); }
  } }, 'Delete');

  const article = el('article', { class: `inbox-item${item.replied ? ' is-replied' : ''}` },
    el('header', { class: 'item-head' },
      el('div', { class: 'item-who' },
        el('strong', {}, who || '(no name)'),
        item.email ? el('a', { href: `mailto:${item.email}` }, item.email) : el('span', { class: 'muted' }, 'no email given'),
      ),
      el('time', { datetime: item.received }, fmtDate(item.received)),
    ),
    kind === 'features' ? el('p', { class: 'item-title' }, item.feature) : null,
    el('dl', { class: 'item-details' }, detailRows(item, kind)),
    kind === 'requests' && item.message ? el('p', { class: 'item-text' }, item.message) : null,
    kind === 'features' && item.use ? el('p', { class: 'item-text' }, el('span', { class: 'muted' }, 'How they’d use it: '), item.use) : null,
    el('footer', { class: 'item-actions' },
      el('label', { class: 'replied' }, replied, ' Replied', item.replied && item.repliedAt ? el('span', { class: 'muted' }, ` ${fmtDate(item.repliedAt)}`) : null),
      note,
      item.email ? el('a', { class: 'btn btn-primary btn-small', href: `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(subject)}` }, 'Reply') : null,
      del,
      saved,
    ),
  );
  return article;
}

function render() {
  counts();
  const box = $('items');
  box.replaceChildren();
  const list = state.items[state.kind];
  if (!list) return;
  const shown = list.filter(matches);
  if (!shown.length) {
    const what = state.kind === 'requests' ? 'requests' : 'suggestions';
    const why = state.search ? `No ${what} match “${state.search}”.`
      : state.show === 'todo' ? `Nothing to reply to. All ${what} have been dealt with.`
      : state.show === 'done' ? `No ${what} marked as replied yet.`
      : `No ${what} yet.`;
    box.append(el('p', { class: 'inbox-empty' }, why));
    return;
  }
  box.append(...shown.map((i) => card(i, state.kind)));
}

// ---------- tabs, filters, search ----------

document.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => {
  state.kind = b.dataset.kind;
  document.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  render();
}));
document.querySelectorAll('[data-show]').forEach((b) => b.addEventListener('click', () => {
  state.show = b.dataset.show;
  document.querySelectorAll('[data-show]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  render();
}));
let typing;
$('search').addEventListener('input', (e) => { clearTimeout(typing); typing = setTimeout(() => { state.search = e.target.value.trim(); render(); }, 150); });
$('refresh').addEventListener('click', loadAll);

// ---------- start ----------

show(!!session);
if (session) loadAll();
