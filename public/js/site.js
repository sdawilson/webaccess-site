// Web Access Builder site: the screen gallery (driven by an Access-style record navigator),
// the view switchers on each feature, the request form, and the optional Bunny Stream video.

// ---------- settings ----------
// To show the "Watch it in use" section, set these to a Bunny Stream library ID and video ID.
const STREAM_LIBRARY_ID = '803383';
const STREAM_VIDEO_ID = '38da4a3b-0be8-4681-8ae2-d9f2c5a57dc5'; // the 100-second narrated demo
// The demo: set this to the demo instance's address (e.g. 'https://demo.webaccessbuilder.com')
// to show the "Open the demo" buttons; until then the page offers a test instance instead.
const DEMO_URL = 'https://demo.webaccessbuilder.com';
// The "Buy me a coffee" button under the note from Simon appears once this is set,
// e.g. 'https://buymeacoffee.com/yourname'.
const COFFEE_URL = 'https://buymeacoffee.com/simonwilson_wab';

// ---------- screen gallery ----------
const SCREENS = [
  ['continuous-form', 'Continuous form with conditional formatting and data bars', 'A continuous form listing highway schemes, with status colours and data bars on the estimates'],
  ['form-view', 'Single form with a subform on a tab control', 'A single form for one scheme, with a datasheet subform of defects on a tab control'],
  ['form-design', 'Form Design view: controls, field list and property sheet', 'Form Design view with the controls gallery, field list and property sheet'],
  ['datasheet', 'A table in Datasheet view', 'A table of highway schemes in Datasheet view'],
  ['table-design', 'Table Design view with Access field types', 'Table Design view listing each field and its data type'],
  ['query-criteria', 'Query criteria in Access syntax, with an Or row', 'Query Design grid with criteria on Status and StartDate'],
  ['query-totals', 'A totals query joining two tables', 'Query Design with two joined tables and Group By, Count, Sum and Max'],
  ['sql-view', 'SQL view, in Access SQL', 'SQL view of a query in Access SQL'],
  ['report-preview', 'A report in Print Preview, grouped by type with subtotals', 'Print Preview of a report of schemes grouped by type, on an A4 page'],
  ['report-design', 'Report Design view with the Group, Sort, and Total pane', 'Report Design view with sections and the Group, Sort, and Total pane'],
  ['chart-dashboard', 'Chart controls on a dashboard form', 'A dashboard form with two Chart controls: estimate and actual by scheme type, and schemes by status'],
  ['treeview-listview', 'TreeView and ListView controls, filled by VBA', 'A form with a TreeView of scheme types and schemes, and a ListView of the chosen type\u2019s schemes'],
  ['pivottable', 'PivotTable view, grouped by year and quarter', 'A PivotTable of estimates by scheme type and quarter'],
  ['pivotchart', 'PivotChart view of the same layout', 'A stacked column PivotChart of estimates by scheme type'],
  ['conditional-formatting', 'The Conditional Formatting Rules Manager', 'The Conditional Formatting Rules Manager with three rules'],
  ['form-code', 'The module behind a form', 'The VBA module behind a form, with Form_Current and a Click event'],
  ['intellisense', 'IntelliSense as you type', 'IntelliSense listing a recordset’s members'],
  ['debugger', 'Paused at a breakpoint, with Locals', 'VBA paused at a breakpoint with the Locals window showing variables'],
  ['import-access', 'Importing tables from an Access database', 'The Import from Access dialog listing tables to import'],
  ['users', 'Users and their roles', 'The Users screen listing admins and users'],
  ['user-view', 'What a user sees: the same form, no design tools', 'A user’s view of a form, with no design tools in the ribbon'],
  ['demo-menu', 'The demo: Fieldfare Traders, a sample database to explore', 'The Main Menu of the Fieldfare Traders sample database, open in the demo'],
];

const viewer = {
  i: 0,
  img: document.getElementById('viewer-img'),
  link: document.getElementById('viewer-link'),
  pos: document.getElementById('viewer-pos'),
  caption: document.getElementById('viewer-caption'),
  buttons: document.querySelectorAll('.navbar [data-go]'),
};

function full(name) {
  return { src: `/img/${name}-full.webp`, srcset: `/img/${name}-full.webp 1440w, /img/${name}-full@2x.webp 2880w`, big: `/img/${name}-full@2x.webp` };
}

function preload(i) {
  if (i < 0 || i >= SCREENS.length) return;
  const im = new Image();
  im.sizes = viewer.img.sizes;
  im.srcset = full(SCREENS[i][0]).srcset;
}

function show(i) {
  i = Math.max(0, Math.min(SCREENS.length - 1, i));
  viewer.i = i;
  const [name, caption, alt] = SCREENS[i];
  const f = full(name);
  viewer.img.classList.add('loading');
  viewer.img.onload = () => viewer.img.classList.remove('loading');
  viewer.img.srcset = f.srcset;
  viewer.img.src = f.src;
  viewer.img.alt = alt;
  viewer.link.href = f.big;
  viewer.pos.value = String(i + 1);
  viewer.caption.textContent = caption;
  viewer.buttons.forEach((b) => {
    const go = b.dataset.go;
    b.disabled = (go === 'first' || go === 'prev') ? i === 0 : i === SCREENS.length - 1;
  });
  preload(i + 1);
  preload(i - 1);
}

if (viewer.img) {
  document.getElementById('viewer-count').textContent = String(SCREENS.length);
  viewer.buttons.forEach((b) => b.addEventListener('click', () => {
    const go = b.dataset.go;
    show(go === 'first' ? 0 : go === 'last' ? SCREENS.length - 1 : viewer.i + (go === 'next' ? 1 : -1));
  }));
  // Type a number and press Enter, as in Access's record box.
  viewer.pos.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const n = parseInt(viewer.pos.value, 10);
      show(Number.isFinite(n) ? n - 1 : viewer.i);
    } else if (e.key === 'Escape') {
      viewer.pos.value = String(viewer.i + 1);
    }
  });
  viewer.pos.addEventListener('blur', () => { viewer.pos.value = String(viewer.i + 1); });
  // Arrow keys and PageUp/PageDown while the gallery has the focus.
  document.querySelector('.viewer').addEventListener('keydown', (e) => {
    if (e.target === viewer.pos) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); show(viewer.i + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(viewer.i - 1); }
  });
  // Swipe on touch screens.
  let x0 = null;
  viewer.link.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  viewer.link.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) show(viewer.i + (dx < 0 ? 1 : -1));
  });
  show(0);
}

// ---------- view switchers on the feature sections ----------
document.querySelectorAll('[data-views]').forEach((fig) => {
  const tabs = [...fig.querySelectorAll('[role="tab"]')];
  const img = fig.querySelector('.frame img');
  const panel = fig.querySelector('[role="tabpanel"]');
  const id = Math.random().toString(36).slice(2, 8);
  panel.id = `panel-${id}`;
  // Each screenshot opens full size in a new tab.
  const a = document.createElement('a');
  a.target = '_blank';
  a.rel = 'noopener';
  img.replaceWith(a);
  a.append(img);
  const sel = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    const name = tab.dataset.img;
    const w = Number(tab.dataset.w || 1200);
    const h = Number(tab.dataset.h || 720);
    img.classList.add('loading');
    img.onload = () => img.classList.remove('loading');
    img.width = w;
    img.height = h;
    img.srcset = `/img/${name}.webp ${w}w, /img/${name}@2x.webp ${w * 2}w`;
    img.src = `/img/${name}.webp`;
    img.alt = tab.dataset.alt || '';
    a.href = `/img/${name}@2x.webp`;
    a.setAttribute('aria-label', `${tab.textContent}: open full size`);
  };
  tabs.forEach((t, k) => {
    t.id = `tab-${id}-${k}`;
    t.setAttribute('aria-controls', panel.id);
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
    t.addEventListener('click', () => sel(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = tabs[(k + d + tabs.length) % tabs.length];
      next.focus();
      sel(next);
    });
  });
  // Warm the cache for the other views once the page is idle.
  const warm = () => tabs.slice(1).forEach((t) => { const im = new Image(); im.src = `/img/${t.dataset.img}.webp`; });
  ('requestIdleCallback' in window) ? requestIdleCallback(warm) : setTimeout(warm, 1500);
  sel(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]);
});

// ---------- request form ----------
const form = document.getElementById('request-form');
if (form) {
  const status = document.getElementById('form-status');
  const say = (msg, kind) => { status.textContent = msg; status.className = `form-status ${kind || ''}`; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    const name = form.elements.name;
    const email = form.elements.email;
    if (!data.name.trim()) { name.setAttribute('aria-invalid', 'true'); name.focus(); say('Enter your name.', 'err'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) { email.setAttribute('aria-invalid', 'true'); email.focus(); say('Enter an email address we can reply to.', 'err'); return; }
    const ack = form.elements.acknowledged;
    if (!ack.checked) { ack.setAttribute('aria-invalid', 'true'); ack.focus(); say('Please tick the box to confirm you understand it isn\'t ready for production use.', 'err'); return; }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    say('Sending…');
    try {
      const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'The request could not be sent.');
      form.classList.add('sent');
      say(`Request sent. We'll reply to ${data.email.trim()}.`, 'ok');
      button.textContent = 'Sent';
    } catch (err) {
      button.disabled = false;
      say(`${err.message} Please try again in a moment.`, 'err');
    }
  });
}

// ---------- Bunny Stream video ----------
if (STREAM_LIBRARY_ID && STREAM_VIDEO_ID) {
  const tour = document.getElementById('tour');
  const iframe = document.createElement('iframe');
  iframe.src = `https://iframe.mediadelivery.net/embed/${encodeURIComponent(STREAM_LIBRARY_ID)}/${encodeURIComponent(STREAM_VIDEO_ID)}?autoplay=false&preload=false&responsive=true`;
  iframe.title = 'Web Access Builder in use';
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; gyroscope; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  tour.querySelector('.tour-frame').append(iframe);
  tour.hidden = false;
}

// ---------- Buy me a coffee ----------
if (COFFEE_URL) {
  const link = document.getElementById('coffee-link');
  if (link) {
    link.href = COFFEE_URL;
    link.closest('.why-coffee').hidden = false;
  }
}

// ---------- suggest a feature ----------
const featureForm = document.getElementById('feature-form');
if (featureForm) {
  const status = document.getElementById('feature-status');
  const say = (msg, kind) => { status.textContent = msg; status.className = `form-status ${kind || ''}`; };
  featureForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(featureForm).entries());
    featureForm.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    const feature = featureForm.elements.feature;
    const email = featureForm.elements.email;
    if (data.feature.trim().length < 5) { feature.setAttribute('aria-invalid', 'true'); feature.focus(); say('Describe the feature you\'d like.', 'err'); return; }
    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) { email.setAttribute('aria-invalid', 'true'); email.focus(); say('That email address doesn\'t look right. Leave it empty if you\'d rather not get a reply.', 'err'); return; }
    const button = featureForm.querySelector('button[type="submit"]');
    button.disabled = true;
    say('Sending…');
    try {
      const res = await fetch(featureForm.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'The suggestion could not be sent.');
      say(data.email.trim() ? `Thank you. Suggestion sent; we'll reply to ${data.email.trim()}.` : 'Thank you. Suggestion sent.', 'ok');
      featureForm.reset();
      button.disabled = false;
      button.textContent = 'Send another';
    } catch (err) {
      button.disabled = false;
      say(`${err.message} Please try again in a moment.`, 'err');
    }
  });
}

// ---------- the demo ----------
if (DEMO_URL) {
  document.querySelectorAll('[data-demo-link]').forEach((a) => { a.href = DEMO_URL; a.target = '_blank'; a.rel = 'noopener'; });
  document.querySelectorAll('[data-demo]').forEach((el) => { el.hidden = false; });
  document.querySelectorAll('[data-demo-fallback]').forEach((el) => { el.hidden = true; });
}
