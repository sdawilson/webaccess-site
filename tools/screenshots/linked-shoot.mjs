// The linked tables pictures, from a local copy of the app (not demo mode: linked tables aren't in
// the demo) with LINK_ALLOW_PRIVATE=1, and a local PostgreSQL holding a small "warehouse" database:
// bins, stock_levels (one row for each sample product) and deliveries. See README.md.
//   APP_URL=http://localhost:3300 PG_PASSWORD=... OUT=shots DSF=2 node linked-shoot.mjs
// Makes link-connection, link-tables, linked-query, linked-manager and write-conflict.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const BASE = process.env.APP_URL || 'http://localhost:3300';
const ADMIN = { user: process.env.WA_USER || 'admin', password: process.env.WA_PW || 'Shot-Capture-2026!' };
// PG_HOST is the name shown in the connection form: add it to /etc/hosts (127.0.0.1 warehouse-db)
const PG = { host: process.env.PG_HOST || 'warehouse-db', port: process.env.PG_PORT || '5432', db: process.env.PG_DB || 'warehouse', user: process.env.PG_USER || 'warehouse', password: process.env.PG_PASSWORD };
const OUT = process.env.OUT || 'shots';
fs.mkdirSync(OUT, { recursive: true });
const psql = (sql) => execFileSync('psql', ['-h', '127.0.0.1', '-p', PG.port, '-U', PG.user, '-d', PG.db, '-qtAc', sql], { env: { ...process.env, PGPASSWORD: PG.password } }).toString().trim();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.env.DSF || 2), locale: 'en-GB', timezoneId: 'Europe/London' });
const p = await ctx.newPage();
p.on('dialog', (d) => (d.type() === 'beforeunload' ? d.accept() : d.dismiss()));
const pause = (ms) => p.waitForTimeout(ms);
const shot = async (name) => { await p.mouse.move(1430, 890); await pause(300); await p.screenshot({ path: `${OUT}/${name}.png` }); console.log('  ' + name); };
const api = (method, url, body, db) => p.evaluate(async ([m, u, b, d]) => {
  const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess', ...(d ? { 'X-Database': d } : {}) }, body: b === undefined ? undefined : JSON.stringify(b) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  return { ok: r.ok, status: r.status, body: j };
}, [method, url, body, db]);
const must = (r, what) => { if (!r.ok && r.status !== 409) throw new Error(`${what}: ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`); return r; };
const rail = async (label) => { await p.locator('button.rail-btn', { hasText: new RegExp(`^${label}$`) }).click(); await pause(600); };
const dataMenu = async (label) => { await rail('Data'); await p.locator('.ribbon-menu button', { hasText: new RegExp(`^${label}$`) }).click(); };
const dlg = (title) => p.locator('dialog.dlg[open]', { has: p.locator('h2', { hasText: title }) });
const item = (kind, name) => p.locator(`.nav-item[data-kind=${kind}][data-name="${name}"]`).first();

// sign in
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.fill('input[type=text], input[name=username]', ADMIN.user);
await p.fill('input[type=password]', ADMIN.password);
await p.keyboard.press('Enter');
await p.waitForSelector('.doc-tab, .start-list, .nav-item', { timeout: 20000 });

// the Fieldfare Traders sample as a database of the admin's account, opened
const list = must(await api('GET', '/api/databases'), 'databases').body;
const account = list.accounts[0];
let db = (list.databases || []).find((d) => d.name === 'Fieldfare Traders');
if (!db) db = must(await api('POST', '/api/databases', { name: 'Fieldfare Traders', accountId: account.id, from: 'sample' }), 'sample').body.database;
console.log(`account ${account.id} (${account.plan}), database ${db.id}`);
await p.goto(`${BASE}/db/${db.id}/`, { waitUntil: 'load' });
await p.waitForSelector('.nav-item');
await pause(2000);
await p.locator('.doc-tab .tab-close, .doc-tab button[aria-label^=Close]').first().click().catch(() => {});
await pause(500);

// Data > SQL Database: link, a new connection to the warehouse
await dataMenu('SQL Database');
await dlg(/^SQL Database$/).waitFor();
await dlg(/^SQL Database$/).locator('button', { hasText: /^Next$/ }).click();
const conn = p.locator('dialog.dlg[open]');
await conn.locator('h2', { hasText: 'New connection' }).waitFor();
await conn.locator('input[name=name]').fill('Warehouse');
await conn.locator('select[name=engine]').selectOption('postgresql');
await conn.locator('input[name=host]').fill(PG.host);
await conn.locator('input[name=port]').fill(PG.port);
await conn.locator('input[name=database]').fill(PG.db);
await conn.locator('input[name=user]').fill(PG.user);
await conn.locator('input[name=password]').fill(PG.password);
await conn.locator('input[name=name]').click(); // nothing focused in the form
await conn.locator('input[name=name]').blur();
await pause(400);
await shot('link-connection'); // as it starts: Encrypt the connection ticked
await conn.locator('label.check', { hasText: 'Encrypt' }).locator('input').uncheck(); // the local server has no certificate
await conn.locator('button', { hasText: /^Test$/ }).click();
await conn.locator('p', { hasText: /^Connected: PostgreSQL/ }).waitFor();
await conn.locator('button', { hasText: /^Save$/ }).click();

// the server's tables, ticked: the first picture
const pick = dlg('Link tables: Warehouse');
await pick.waitFor();
for (const t of ['bins', 'deliveries', 'stock_levels']) await pick.locator('label.pick-item', { hasText: new RegExp(`^public\\.${t}$`) }).locator('input').check();
await p.locator('.toast').first().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
await p.waitForFunction(() => !document.querySelector('.toast'), null, { timeout: 15000 }).catch(() => {});
await pause(400);
await shot('link-tables');
await pick.locator('button', { hasText: /^Link$/ }).click();
const done = dlg(/^Linked$/);
await done.waitFor();
await done.locator('button', { hasText: /^OK$/ }).click();
await item('table', 'stock_levels').waitFor();

// a query joining the sample's Products to the warehouse's stock: the second picture
const sql = 'SELECT Products.[Product Name], stock_levels.bin AS Bin, bins.storage AS Storage, stock_levels.on_hand AS [On Hand], stock_levels.allocated AS Allocated, '
  + 'stock_levels.on_hand - stock_levels.allocated AS [Free Stock], Products.[Reorder Level], '
  + "IIf(stock_levels.on_hand - stock_levels.allocated <= Products.[Reorder Level], 'Reorder', '') AS [Action] "
  + 'FROM (Products INNER JOIN stock_levels ON Products.[Product ID] = stock_levels.product_id) INNER JOIN bins ON stock_levels.bin = bins.bin '
  + 'WHERE Products.Discontinued = False ORDER BY stock_levels.bin, Products.[Product Name];';
must(await api('POST', '/api/queries', { query: { name: 'Stock on Hand', sql } }, db.id), 'query');
await p.goto(`${BASE}/db/${db.id}/`, { waitUntil: 'load' });
await p.waitForSelector('.nav-item');
await pause(1500);
await item('query', 'Stock on Hand').scrollIntoViewIfNeeded();
await item('query', 'Stock on Hand').click();
await p.locator('.doc-tab.active', { hasText: 'Stock on Hand' }).waitFor();
await p.locator('.doc-pane:not([hidden]) td', { hasText: 'Reorder' }).first().waitFor();
await item('table', 'stock_levels').scrollIntoViewIfNeeded();
await pause(1200);
await shot('linked-query');

// the Linked Table Manager: the third
await dataMenu('Linked Table Manager');
const mgr = dlg('Linked Table Manager');
await mgr.waitFor();
await mgr.locator('tbody tr', { hasText: 'stock_levels' }).waitFor();
await pause(800);
await shot('linked-manager');
await mgr.locator('button', { hasText: /^Close$/ }).click();
await pause(600);

// Write Conflict: the warehouse changes a count while it's being edited here: the fourth
await item('table', 'stock_levels').click();
await p.locator('.doc-tab.active', { hasText: 'stock_levels' }).waitFor();
const PANE = '.doc-body > .doc-pane:not([hidden])';
const cell = (r, c) => p.locator(`${PANE} .sheet td[data-r="${r}"][data-c="${c}"]`);
await cell(0, 0).waitFor();
await pause(800);
const col = 3; // product_id, sku, bin, on_hand
const id = (await cell(0, 0).innerText()).trim();
psql(`UPDATE stock_levels SET on_hand = on_hand + 24, last_counted = now() WHERE product_id = ${id}`);
await cell(0, col).click();
await p.keyboard.press('F2');
await p.locator(`${PANE} .sheet td.editing input`).waitFor();
await p.keyboard.press('Control+A');
await p.keyboard.type('15');
await p.keyboard.press('Enter');
await cell(1, 1).click();
const wc = dlg(/^Write Conflict$/);
await wc.waitFor();
await pause(600);
await shot('write-conflict');
await wc.locator('button', { hasText: /^Drop Changes$/ }).click();
await pause(800);

await browser.close();
