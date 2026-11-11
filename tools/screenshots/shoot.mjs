// Takes every screenshot the site uses, from a local copy of the app running in demo mode
// with the Fieldfare Traders sample (see README.md):
//   node shoot.mjs            every group
//   node shoot.mjs forms code only those groups
// One browser, one screen at a time, each waited for: nothing is photographed before it has drawn.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.APP_URL || 'http://localhost:3200';
const ADMIN = { user: process.env.WA_USER || 'admin', password: process.env.WA_PW || 'Shot-Capture-2026!' };
const USER = { user: 'dokafor', name: 'Daniel Okafor', password: 'Viewer-Pass-2026!' };
const OUT = process.env.OUT || 'shots';
const APP = path.resolve(process.env.WEBACCESS_DIR || '../../../webaccess');
const only = process.argv.slice(2);
const want = (g) => !only.length || only.includes(g);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const newPage = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.env.DSF || 2), locale: 'en-GB', timezoneId: 'Europe/London' });
  const page = await ctx.newPage();
  page.on('dialog', (d) => (d.type() === 'beforeunload' ? d.accept() : d.dismiss()));
  return page;
};
const signIn = async (page, who = ADMIN) => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.fill('input[type=text], input[name=username]', who.user);
  await page.fill('input[type=password]', who.password);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.doc-tab, .start-list', { timeout: 20000 });
  await page.waitForTimeout(1500);
};
let p = await newPage();
await signIn(p);
const api = (method, url, body) => p.evaluate(async ([m, u, b]) => {
  const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess' }, body: b === undefined ? undefined : JSON.stringify(b) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { ok: r.ok, status: r.status, body: j };
}, [method, url, body]);

const fresh = async () => { await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForSelector('.nav-item'); await pause(2000); };
const PANE = '.doc-body > .doc-pane:not([hidden])';
const pause = (ms) => p.waitForTimeout(ms);
const shot = async (name) => { await p.mouse.move(1430, 890); await pause(250); await p.screenshot({ path: `${OUT}/${name}.png` }); console.log('  ' + name); };
const item = (kind, name) => p.locator(`.nav-item[data-kind=${kind}][data-name="${name}"]`).first();
// one click opens an object (the Navigation Pane is drawn again on it, so never double-click)
const open = async (kind, name, wait = 1800) => { const it = item(kind, name); await it.scrollIntoViewIfNeeded(); await it.click(); await p.locator('.doc-tab.active', { hasText: kind === 'module' ? 'Visual Basic' : name }).waitFor(); await pause(wait); };
const design = async (kind, name, wait = 1800) => {
  const it = item(kind, name); await it.scrollIntoViewIfNeeded(); await it.click({ button: 'right' });
  await p.locator('[role=menuitem]', { hasText: /^Design View/ }).first().click(); await pause(wait);
};
const view = async (label, wait = 1800) => { await p.locator(`${PANE} .view-switch button, .cmdbar button, button`).filter({ hasText: new RegExp(`^${label}$`) }).first().click(); await pause(wait); };
const rail = async (label) => { await p.locator('button.rail-btn', { hasText: new RegExp(`^${label}$`) }).click(); await pause(600); };
const menu = async (label, wait = 1500) => { await p.locator('[role=menuitem]', { hasText: label }).first().click(); await pause(wait); };
// close every tab but the Main Menu, without saving
const closeAll = async () => {
  for (let i = 0; i < 20; i++) {
    const dlg = p.locator('dialog[open]');
    if (await dlg.count()) { let no = dlg.locator('button', { hasText: /Don.t save|^No$|Discard/i }).first();
      if (!(await no.count())) no = dlg.locator('button', { hasText: /^(Cancel|Close|OK)$/i }).first();
      if (await no.count()) await no.click().catch(() => {}); else await p.keyboard.press('Escape'); await pause(300); continue; }
    const x = p.locator('.doc-tab:not(:has-text("Main Menu")) button.close').first();
    if (!(await x.count())) break;
    await x.click({ timeout: 3000 }).catch(() => {}); await pause(300);
  }
};
// on the Orders form: move on to an order with a few lines, which reads better than a single line
const fullOrder = async () => {
  for (let i = 0; i < 25; i++) {
    const m = /of (\d+)/.exec(await p.locator(`${PANE} .fv-subform`).first().innerText().catch(() => ''));
    if (m && Number(m[1]) >= 3 && Number(m[1]) <= 4) break;   // the subform shows four whole lines
    await p.locator(`${PANE} button`).filter({ hasText: /^▶$/ }).last().click(); await pause(700);
  }
};
const group = async (name, fn) => { if (!want(name)) return; console.log(name); await closeAll(); try { await fn(); } catch (e) { console.log(`  ${name} FAILED: ${e.message.split('\n')[0]}`); process.exitCode = 1; } };

// ---------- people the screens need ----------
for (const [username, displayName, role] of [['rhughes', 'Rachel Hughes', 'admin'], [USER.user, USER.name, 'user'], ['lmartin', 'Laura Martin', 'user'], ['tbrennan', 'Tom Brennan', 'user'], ['warehouse', 'Warehouse (shared)', 'user']])
  await api('POST', '/api/users', { username, displayName, password: USER.password, role });   // refused if they are already there

await group('forms', async () => {
  await open('form', 'Products'); await shot('continuous-form');
  await closeAll();
  await open('form', 'Orders', 2500);
  await fullOrder();
  await shot('form-view');
  await view('Design'); await shot('form-design');
  await p.locator(`${PANE} .fd-section[data-section=detail] .fd-source`, { hasText: /^Freight$/ }).first().click(); await pause(800);
  await shot('property-sheet');
  await closeAll();
  await open('form', 'Products'); await view('Design');
  await p.locator(`${PANE} .fd-section[data-section=detail] .fd-source`, { hasText: /^Units In Stock$/ }).first().click(); await pause(500);
  await p.locator('button', { hasText: /^Format/ }).first().click(); await pause(500);
  await p.getByText('Conditional Formatting', { exact: true }).first().click(); await pause(1500);
  await shot('conditional-formatting');
  await closeAll();
  await open('form', 'Product Browser', 2500);
  await p.locator(`${PANE} .tv-text`, { hasText: 'Oat Biscuits' }).first().click(); await pause(1000);
  await shot('treeview-listview');
  await closeAll();
  await open('form', 'Order List', 3000); await shot('listview');
});

await group('pivots', async () => {
  await open('form', 'Sales Analysis', 3000); await shot('pivottable');
  await closeAll();
  await open('form', 'Sales Dashboard', 3500); await shot('pivotchart');
  await closeAll();
  await open('form', 'Sales Charts', 3500); await shot('chart-dashboard');
});

await group('queries', async () => {
  await design('query', 'Product Sales', 2200); await shot('query-totals');
  await closeAll();
  await design('query', 'Products to Reorder', 2200); await shot('query-criteria');
  await closeAll();
  await design('query', 'Order Summary', 2000); await view('SQL'); await shot('sql-view');
  await closeAll();
  await design('table', 'Order Details', 2000);   // its Line Total is a Calculated field
  await p.evaluate(() => { const i = [...document.querySelectorAll('.doc-body > .doc-pane:not([hidden]) input')].find((x) => x.value === 'Line Total'); if (i) { i.click(); i.focus(); } });
  await pause(800); await shot('table-design');
  await closeAll();
  await open('table', 'Products', 2000); await shot('datasheet');
});

const caretAt = (text, col = 0) => p.evaluate(([t, c]) => {
  const ta = document.querySelector('.doc-body > .doc-pane:not([hidden]) .ce-input'); ta.focus();
  const at = ta.value.indexOf(t); const lineStart = ta.value.lastIndexOf('\n', at) + 1; const lineEnd = ta.value.indexOf('\n', at);
  const pos = c === 'end' ? lineEnd : lineStart + c; ta.setSelectionRange(pos, pos); return ta.value.slice(0, pos).split('\n').length;
}, [text, col]);
await group('code', async () => {
  await open('form', 'Product Search'); await view('Design');
  await p.locator("button[title^='Open the code behind this form']").first().click(); await pause(2000);
  await shot('form-code');
  await closeAll();
  await open('module', 'Utilities', 2000);
  await caretAt('msg = msg & rs!', 12); await p.keyboard.press('F9'); await pause(400);
  await p.locator(`${PANE} .vbe-imm-text`).click(); await p.keyboard.type('StockCheck', { delay: 20 }); await p.keyboard.press('Enter'); await pause(2500);
  await p.keyboard.press('F8'); await pause(700); await p.keyboard.press('F8'); await pause(900);
  await shot('debugger');
  await caretAt('msg = msg & rs!', 12); await p.keyboard.press('F9'); await pause(300);   // take the breakpoint off again
  await p.keyboard.press('F5'); await pause(1500);
  await closeAll();
  // last, as it types into the module (closed without saving)
  await open('module', 'Utilities', 2000);
  await caretAt('rs.MoveNext', 'end'); await pause(300);
  await p.keyboard.press('Enter'); await p.keyboard.type('rs.', { delay: 40 }); await pause(1200);
  await shot('intellisense');
  await p.keyboard.press('Escape');
});

await group('reports', async () => {
  await open('report', 'Sales by Category', 3000); await shot('report-view');
  await view('Print Preview', 3000); await shot('report-preview');
  await view('Design', 2500);
  await p.locator(`${PANE} .fd-source`, { hasText: /^=Sum\(/ }).first().click().catch(() => {}); await pause(800);
  await shot('report-design');
});

await group('misc', async () => {
  // a saved macro, for Macro Design: a comment, an If block and two actions
  const NAME = 'Open Products To Reorder';
  await api('DELETE', '/api/macros/' + encodeURIComponent(NAME));
  const made = await api('POST', '/api/macros', { macro: { name: NAME, description: 'The products at or below their reorder level, or a message when there are none',
    actions: [
      { type: 'comment', text: 'Open the list of products to reorder. If every product is above its reorder level, say so.' },
      { type: 'if', branches: [{ condition: 'DCount("*", "Products to Reorder") > 0', actions: [
        { type: 'action', action: 'OpenReport', args: { ReportName: 'Products to Reorder', View: 'Report' } },
        { type: 'action', action: 'SetTempVar', args: { Name: 'LastStockCheck', Expression: 'Now()' } },
      ] }], otherwise: [
        { type: 'action', action: 'MessageBox', args: { Message: 'Every product is above its reorder level.', Beep: 'No', Type: 'Information', Title: 'Stock' } },
      ] },
    ] } });
  if (!made.ok) console.log('    macro not saved:', JSON.stringify(made.body).slice(0, 200));
  await fresh();
  await design('macro', NAME, 2000); await shot('macro-design');
  await closeAll();
  await rail('Tools'); await menu(/^Relationships/, 2500); await shot('relationships');
  await closeAll();
  await rail('Tools'); await menu(/^Options/, 2000); await shot('appearance');
  await closeAll(); await p.keyboard.press('Escape');
  await p.locator('.nav-item', { hasText: /^Users$/ }).first().click(); await pause(2000); await shot('users');
  await closeAll();
  await rail('File'); await p.getByText('Share', { exact: true }).first().click(); await pause(1500); await shot('share');
  await p.keyboard.press('Escape'); await fresh();
  await p.getByText('Help', { exact: true }).first().click(); await pause(2500);
  await p.locator('input.help-search').click(); await p.keyboard.type('subform', { delay: 30 }); await pause(1800);
  await shot('help-guides');
  await closeAll();
  await rail('Data');
  const chooser = p.waitForEvent('filechooser');
  await p.locator("[role=menuitem]:text-is('Access')").first().click();
  await (await chooser).setFiles(path.join(APP, 'test/fixtures/sample.accdb'));
  await p.waitForSelector('dialog.dlg.wide', { timeout: 20000 }); await pause(1500);
  await shot('import-access');
  await p.locator('dialog[open] button', { hasText: /^Cancel$/ }).first().click();
});

const sheetReady = async () => { await p.waitForFunction(() => document.querySelector('.doc-body > .doc-pane:not([hidden]) .fv-sheet')?.sheetControl?.bound, null, { timeout: 30000 }); await pause(2500); };
await group('sheet', async () => {
  // The sample's note beside the buttons is two lines in a one-line label (cut off top and bottom): give it the room.
  const got = await api('GET', '/api/forms/' + encodeURIComponent('Stock Workbook'));
  const def = got.body.form || got.body;
  const note = def.controls?.find((c) => c.name === 'lblNote');
  if (note && note.height < 36) { note.y = 6; note.height = 38; const put = await api('PUT', '/api/forms/' + encodeURIComponent('Stock Workbook'), { form: def }); if (!put.ok) console.log('    note not changed:', JSON.stringify(put.body).slice(0, 200)); }
  await open('form', 'Stock Workbook', 1000); await sheetReady();
  const keep = p.locator(`${PANE} .fv-sheet-keep`);
  if (await keep.isVisible().catch(() => false)) { await keep.click(); await pause(1500); await closeAll(); await open('form', 'Stock Workbook', 1000); await sheetReady(); }
  // a formula cell on a shaded row, so the formula bar shows a worksheet formula beside the records
  await p.evaluate(() => { const s = document.querySelector('.doc-body > .doc-pane:not([hidden]) .fv-sheet').sheetControl; s.workbook.getActiveSheet().getRange('F5').activate(); });
  await pause(800); await shot('spreadsheet');
  await view('Design', 2000);
  await p.locator(`${PANE} .fd-ctl, ${PANE} [data-type=spreadsheet]`).filter({ hasText: /Spreadsheet/ }).first().click().catch(() => {}); await pause(500);
  await p.evaluate(() => { for (const e of document.querySelectorAll('.doc-body > .doc-pane:not([hidden]) *')) if (e.scrollLeft) e.scrollLeft = 0; }); await pause(500);
  await shot('spreadsheet-design');
  await p.locator("button[title^='Open the code behind this form']").first().click(); await pause(2000);
  await shot('spreadsheet-code');
});

await group('assistant', async () => {
  // a stand-in for the AI service that follows a script (the app is started with AI_API_URL pointing at it)
  const script = [];
  const use = (name, input) => ({ type: 'tool_use', id: `tu_${Math.random().toString(36).slice(2, 10)}`, name, input });
  const mock = http.createServer((req, res) => { let body = ''; req.on('data', (c) => { body += c; }); req.on('end', () => {
    const content = script.shift() || [{ type: 'text', text: 'Nothing more to do.' }];
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ content, stop_reason: content.some((b) => b.type === 'tool_use') ? 'tool_use' : 'end_turn', usage: { input_tokens: 200, output_tokens: 100 } }));
  }); });
  await new Promise((r) => mock.listen(Number(process.env.AI_MOCK_PORT || 3220), r));
  try {
    await p.locator('.rail-btn[data-rail="assistant"]').click();
    const box = p.locator(`${PANE} .as-box`); await box.waitFor(); await pause(800);
    await shot('assistant-start');
    script.push([{ type: 'text', text: 'Let me look at what is in the database first.' }, use('list_objects', {})],
      [{ type: 'text', text: 'You already have Suppliers and Products, so I would add to those rather than start again. Here is what I would make.' },
        use('propose_plan', { summary: 'A log of supplier deliveries, a form to enter them from the Suppliers you already have, and a report of what arrived late.',
          steps: ['A table, Deliveries: supplier, product, date due, date received, quantity and a note', 'A relationship from Deliveries to Suppliers and to Products',
            'A query, Late Deliveries: received after the date due, with the days late', 'A form, Deliveries: one delivery at a time, with combo boxes for the supplier and product',
            'A report, Late Deliveries by Supplier: grouped by supplier, with a count and the average days late', 'A button on the Main Menu to open the form'] })]);
    await box.fill('We need to keep track of deliveries from suppliers, and see which ones turn up late.');
    await box.press('Enter');
    await p.locator(`${PANE} .as-plan`).waitFor({ timeout: 20000 }); await pause(800);
    await shot('assistant');
    await p.locator(`${PANE} button`, { hasText: /^New conversation/ }).first().click().catch(() => {});
  } finally { mock.close(); }
});

await group('runtime', async () => {
  const admin = p;
  p = await newPage(); await signIn(p, USER);
  await shot('user-view');
  await p.locator('button.fv-button', { hasText: /^Orders$/ }).click(); await pause(3000); await fullOrder();
  await shot('runtime-view');
  await p.locator('.doc-tab', { hasText: 'Main Menu' }).first().click(); await pause(600);
  await p.locator('button.fv-button', { hasText: /^Stock Workbook$/ }).click();
  await sheetReady();
  await p.evaluate(() => { const s = document.querySelector('.doc-body > .doc-pane:not([hidden]) .fv-sheet').sheetControl; s.workbook.getActiveSheet().getRange('F5').activate(); });
  await pause(800); await shot('spreadsheet-runtime');
  await p.context().close(); p = admin;
});

await group('demo', async () => {
  const admin = p;
  p = await newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await pause(800);
  await shot('demo-signin');
  await p.getByText('Try the demo').first().click(); await p.waitForSelector('.doc-tab', { timeout: 30000 }); await pause(3000);
  await shot('demo-menu');
  await p.locator('button.fv-button', { hasText: 'Sales Dashboard' }).click(); await pause(3500);
  await shot('demo-dashboard');
  await p.locator('.doc-tab', { hasText: 'Main Menu' }).first().click(); await pause(800);
  await p.locator('button.fv-button', { hasText: /^Orders$/ }).click(); await pause(3000); await fullOrder();
  await shot('demo-orders');
  await p.context().close(); p = admin;
});

await browser.close();
