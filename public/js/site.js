// Web Access Builder site: the screen gallery (driven by an Access-style record navigator),
// the view switchers on each feature, the request form, and the optional Bunny Stream video.

// ---------- settings ----------
// The video section is off the home page for now (11 Nov 2026: to be re-filmed). To bring it back, put a
// <section id="tour"> with a .tour-frame on the page; these are the Bunny Stream library ID and video ID.
const STREAM_LIBRARY_ID = '803383';
const STREAM_VIDEO_ID = '00788605-e180-400b-bb28-7eeb615d5dd3'; // the narrated demo (v2, new layout, 1:45)
// The demo: set this to the demo instance's address (e.g. 'https://demo.webaccessbuilder.com')
// to show the "Open the demo" buttons; until then the page offers a test instance instead.
const DEMO_URL = 'https://demo.webaccessbuilder.com';
// The "Buy me a coffee" button under the note from Simon appears once this is set,
// e.g. 'https://buymeacoffee.com/yourname'.
const COFFEE_URL = 'https://buymeacoffee.com/simonwilson_wab';

// ---------- screen gallery ----------
const SCREENS = [
  ['spreadsheet', 'A workbook on a form, with a query’s records in its rows', 'A workbook on a form: a stock list with a title and a note above, the products of a query from row 4, low stock shaded, and a Stock value column worked out by a formula'],
  ['spreadsheet-runtime', 'The same workbook as a User sees it, in the runtime', 'The stock workbook in a User’s window, with no rail, command bar or Navigation Pane'],
  ['spreadsheet-code', 'Excel’s objects in VBA: Worksheet, Range and ListObject', 'The module behind the workbook form, with a Click event that reads the records as a ListObject and loops through its rows'],
  ['assistant', 'The assistant: a plan, waiting for Go ahead', 'The Assistant: a request in plain words, and its plan of a table, a relationship, a query, a form and a report, waiting for Go ahead'],
  ['continuous-form', 'Continuous form with combo boxes and conditional formatting', 'A continuous form of products, with low stock shaded by conditional formatting'],
  ['form-view', 'Single form with a subform of order lines', 'A single form for one order, with its order lines in a subform and the total worked out underneath'],
  ['form-design', 'Form Design view: controls on the command bar, field list and property sheet', 'Form Design view with the controls gallery, field list and property sheet'],
  ['datasheet', 'A table in Datasheet view', 'The Products table in Datasheet view'],
  ['table-design', 'Table Design view, with a Calculated field', 'Table Design view with a Calculated field selected, showing its expression, result type and format'],
  ['relationships', 'The Relationships window, with referential integrity', 'The Relationships window on the sample database, with lines between related tables and the relationships listed underneath'],
  ['query-criteria', 'Query criteria in Access syntax, on two joined tables', 'Query Design on two joined tables, with criteria on Units In Stock and Discontinued'],
  ['query-totals', 'A totals query: Group By and Sum', 'Query Design with Group By on category and product, and Sum on units and sales'],
  ['sql-view', 'SQL view, in Access SQL', 'SQL view of a query with inner and left joins, in Access SQL'],
  ['report-preview', 'A report in Print Preview, grouped by category with subtotals', 'Print Preview of a report of sales grouped by category, on an A4 page'],
  ['report-design', 'Report Design view with the Group, Sort, and Total pane', 'Report Design view with sections and the Group, Sort, and Total pane'],
  ['chart-dashboard', 'Chart controls, with a palette chosen from code', 'A form with two Chart controls: a doughnut of sales by customer city and columns of sales by salesperson'],
  ['treeview-listview', 'A Tree View control, filled by VBA', 'A form with a Tree View of categories and their products, and the chosen product’s details beside it'],
  ['listview', 'A List View control, with icons and tick boxes', 'A form with a List View of orders, with an icon for each status and buttons for its four views'],
  ['pivottable', 'PivotTable view: sales by category and product, for each year', 'A PivotTable of sales by category and product, with a column for each year'],
  ['pivotchart', 'PivotChart view: sales by year and category', 'A stacked column PivotChart of sales by year and category'],
  ['conditional-formatting', 'The Conditional Formatting Rules Manager', 'The Conditional Formatting Rules Manager, with a rule written as an expression'],
  ['appearance', 'A look for each database: Classic or Modern, colours and a default font', 'Options, with a database’s Appearance settings: control style, focus highlight, corner radius, record selector, colours and default font'],
  ['form-code', 'The module behind a form', 'The VBA module behind a form, with a Click event that builds a filter'],
  ['intellisense', 'IntelliSense as you type', 'IntelliSense listing a recordset’s members'],
  ['debugger', 'Paused at a breakpoint, with Locals', 'VBA paused at a breakpoint with the Locals window showing variables'],
  ['macro-design', 'Macro Design: actions, If blocks and comments', 'Macro Design showing a comment, an If block with two actions, and an Else with a MessageBox'],
  ['help-guides', 'Help: the guides inside the app, with search', 'The Help tab, searching all three guides, with the matched words marked'],
  ['import-access', 'Importing tables from an Access database', 'The Import from Access dialog listing tables to import'],
  ['users', 'Users and their roles', 'The Users screen listing the account’s people and their roles'],
  ['share', 'Share a database: invite people as a User or a Guest', 'The Share page, listing the account’s Admins and the people the database is shared with'],
  ['runtime-view', 'What a User sees: the runtime, with no design tools', 'A User’s view of a form filling the window, with no rail, command bar or Navigation Pane'],
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
    const w = Number(tab.dataset.w || 1136);
    const h = Number(tab.dataset.h || 682);
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
  if (tour) {
  const iframe = document.createElement('iframe');
  iframe.src = `https://iframe.mediadelivery.net/embed/${encodeURIComponent(STREAM_LIBRARY_ID)}/${encodeURIComponent(STREAM_VIDEO_ID)}?autoplay=false&preload=false&responsive=true`;
  iframe.title = 'Web Access Builder in use';
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; gyroscope; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  tour.querySelector('.tour-frame').append(iframe);
  tour.hidden = false;
  }
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
