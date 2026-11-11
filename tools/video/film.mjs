// Films the demo: drives a local demo-mode copy of the app and records each scene's keyframes.
//   node film.mjs <take-folder> [scene]      (see README.md)
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { Camera, signIn, BASE, ADMIN } from './filmlib.mjs';

const [, , dir = 'take', only] = process.argv;
const USER = { user: 'mreid', name: 'Maya Reid', password: 'Viewer-Pass-2026!' };

// A fresh demo-mode copy of the app for every take, so nothing is left over from the last one.
const APP = path.resolve(process.env.WEBACCESS_DIR || '../../../webaccess');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-film-'));
const server = spawn('node', ['server/index.js'], { cwd: APP, stdio: 'ignore',
  env: { ...process.env, DATA_DIR: data, PORT: new URL(BASE).port, DEMO_MODE: 'true', PUBLIC_URL: 'https://app.webaccessbuilder.com', ADMIN_USER: ADMIN.user, ADMIN_PASSWORD: ADMIN.password, TZ: 'Europe/London' } });
process.on('exit', () => { server.kill(); fs.rmSync(data, { recursive: true, force: true }); });
for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE + '/')).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 500)); }

const cam = new Camera(dir);
await cam.open();
let p = cam.page;
await signIn(p);
const want = (name) => !only || only === name;
const menu = async () => { await p.locator('.doc-tabs, [role=tablist]').getByText('Main Menu', { exact: true }).first().click(); await p.waitForTimeout(600); };
const closeOthers = async () => {
  // close every tab but the Main Menu, without saving, so each scene starts clean
  for (let i = 0; i < 12; i++) {
    const x = p.locator('.doc-tab:not(:has-text("Main Menu")) button.close').first();
    if (!(await x.count())) break;
    await x.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(300);
    const no = p.locator('dialog[open] button', { hasText: /^Don.t save$/i }).first();
    if (await no.count()) { await no.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(300); }
  }
};

// A person for the runtime scene (ignored if they're already there).
await p.evaluate(async (u) => {
  await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess' },
    body: JSON.stringify({ username: u.user, displayName: u.name, password: u.password, role: 'user' }) });
}, USER);

// The sample's note beside the Stock Workbook's buttons is two lines in a one-line label: give it the room.
await p.evaluate(async () => {
  const H = { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess' };
  const url = '/api/forms/' + encodeURIComponent('Stock Workbook');
  const got = await (await fetch(url)).json(); const def = got.form || got;
  const note = def.controls?.find((c) => c.name === 'lblNote');
  if (note && note.height < 36) { note.y = 6; note.height = 38; await fetch(url, { method: 'PUT', headers: H, body: JSON.stringify({ form: def }) }); }
});

const PANE = '.doc-body > .doc-pane:not([hidden])';
if (want('sheet')) {
  cam.scene('sheet', 'A workbook on a form: change a cell, and its record is saved');
  await menu(); await cam.hold(1.0);
  await cam.click('[data-name=cmdWorkbook]', { settle: 800, after: 0 });
  await p.waitForFunction(() => document.querySelector('.doc-body > .doc-pane:not([hidden]) .fv-sheet')?.sheetControl?.bound, null, { timeout: 30000 });
  await p.waitForTimeout(2500); await cam.hold(2.6);
  // where the cells are: the sheet's canvas, and the first data row's Units In Stock (D) and Stock value (F)
  const cell = async (a1) => p.evaluate((ref) => {
    const el = document.querySelector('.doc-body > .doc-pane:not([hidden]) .fv-sheet'); const s = el.sheetControl; const ws = s.workbook.getActiveSheet();
    const r = ws.getRange(ref); const rect = r.getCellRect ? r.getCellRect() : null;
    if (!rect) return null;
    // the rect is measured from the sheet's canvas (the largest one), not the window
    const cv = [...el.querySelectorAll('canvas')].map((c) => c.getBoundingClientRect()).sort((a, b) => b.width * b.height - a.width * a.height)[0];
    return { x: cv.left + rect.x + rect.width / 2, y: cv.top + rect.y + rect.height / 2 };
  }, a1);
  let d5 = await cell('D5'), f5 = await cell('F5');
  if (!d5) { d5 = { x: 905, y: 503 }; f5 = { x: 1105, y: 503 }; }
  console.log('  D5 at', JSON.stringify(d5), 'F5 at', JSON.stringify(f5));
  await cam.click(f5, { after: 1.6 });                 // a formula cell: the formula bar shows =C5*D5
  await cam.click(d5, { after: 0.6 });                 // Blue Stilton's stock, shaded because it is low
  await cam.type('40', 0.25);
  await cam.press('Enter', { settle: 1500, after: 2.4 });   // saved: the shading goes and Stock value follows
  await menu(); await cam.hold(0.4);
  await cam.click('[data-name=cmdProducts]', { settle: 2200, after: 0.6 });
  // point at Blue Stilton's stock, now 40 here too
  const at = await p.evaluate(() => {
    const pane = document.querySelector('.doc-body > .doc-pane:not([hidden])');
    const name = [...pane.querySelectorAll('input')].find((i) => i.value === 'Blue Stilton'); if (!name) return null;
    const y = name.getBoundingClientRect().top;
    const box = [...pane.querySelectorAll('input')].find((i) => i.value === '40' && Math.abs(i.getBoundingClientRect().top - y) < 6); if (!box) return null;
    const r = box.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (at) await cam.moveTo(at); else console.log('  Blue Stilton at 40 not found in the Products form');
  await cam.hold(2.6);
  await closeOthers();
}

if (want('forms')) {
  cam.scene('forms', 'Forms run their VBA: this one builds a filter and applies it to the subform');
  await menu(); await cam.hold(0.8);
  await cam.click('[data-name=cmdSearch]', { settle: 1800, after: 1.0 });
  await cam.click('[data-name=txtName]', { after: 0.2 });
  await cam.type('tea');
  await cam.click('[data-name=cmdSearch] >> nth=-1', { settle: 1200, after: 2.2 });
  await cam.click('[data-name=chkInStock]', { after: 0.3 });
  await cam.click('[data-name=cmdSearch] >> nth=-1', { settle: 1200, after: 2.0 });
  await closeOthers();
}

if (want('pivottable')) {
  cam.scene('pivottable', 'PivotTable view: drag fields to rows, columns and totals');
  await menu();
  await cam.click('[data-name=cmdAnalysis]', { settle: 2500, after: 1.6 });
  await cam.drag(p.locator('.pv-field', { hasText: 'Salesperson' }).first(), '.pv-zone-columns', { settle: 1500, after: 2.4 });
  await cam.click('.pv-toggle >> nth=0', { settle: 800, after: 1.6 });
  await closeOthers();
}

if (want('pivotchart')) {
  cam.scene('pivotchart', 'PivotChart view: the same layout, drawn as a chart');
  await menu();
  await cam.click('[data-name=cmdDashboard]', { settle: 3000, after: 2.0 });
  await cam.click("button[title^='Column, bar, line, area']", { after: 0.8 });
  await cam.click(p.getByText('Line', { exact: true }).first(), { settle: 1500, after: 0 });
  await cam.hold(2.4);
  await closeOthers();
}

if (want('treeview')) {
  cam.scene('treeview', 'TreeView controls, with drag and drop handled by the form’s code');
  await menu();
  await cam.click('[data-name=cmdTeam]', { settle: 2500, after: 1.4 });
  await cam.drag(p.locator('.tv-text', { hasText: 'Tom Ellison' }).first(), p.locator('.tv-text', { hasText: 'Priya Shah' }).first(), { settle: 1500, after: 2.6 });
  await closeOthers();
}

if (want('vba')) {
  cam.scene('vba', 'VBA runs in the browser, with breakpoints, stepping and Locals');
  await menu();
  await p.locator('[data-name=cmdSearch]').click(); await p.waitForTimeout(1500);
  await cam.hold(0.5);
  await cam.click("button.rail-btn[title^='Open the code window']", { settle: 1500, after: 0.6 });
  await cam.click(p.getByText('Form_Product Search', { exact: true }).first(), { settle: 1200, after: 1.0 });
  const line = await p.evaluate(() => document.querySelector('.ce-input').value.split('\n').findIndex((l) => l.includes('If Nz(Me.txtName')));
  // by position, not by scrolling the gutter to it (the gutter and the text scroll together only by the wheel)
  const b0 = await p.locator('.ce-ln').nth(0).boundingBox(), b1 = await p.locator('.ce-ln').nth(1).boundingBox();
  const gutter = { x: b0.x + b0.width / 2, y: b0.y + b0.height / 2 + (b1.y - b0.y) * line };
  await cam.click(gutter, { after: 1.0 });
  await cam.click(p.locator('.doc-tab', { hasText: 'Product Search' }).first(), { settle: 900, after: 0.3 });
  await cam.click('[data-name=txtName]', { after: 0.1 });
  await cam.type('oat');
  await cam.click('[data-name=cmdSearch] >> nth=-1', { settle: 1800, after: 2.6 });
  await cam.press('F8', { after: 1.1 });
  await cam.press('F8', { after: 1.1 });
  await cam.press('F5', { settle: 1200, after: 0.8 });
  await cam.click(p.locator('.doc-tab', { hasText: 'Product Search' }).first(), { settle: 900, after: 1.6 });
  // leave no breakpoint behind
  await p.locator('.doc-tab', { hasText: 'Visual Basic' }).first().click(); await p.waitForTimeout(500);
  await p.mouse.click(gutter.x, gutter.y); await p.waitForTimeout(300);
  await closeOthers();
}

if (want('share')) {
  cam.scene('share', 'Share a database: Users work with the data, Guests only read it');
  await menu(); await cam.hold(0.6);
  await cam.click("button.rail-btn[title^='File']", { settle: 1000, after: 0.2 });   // straight on to Share: the Info page isn't the point
  await cam.click(p.getByText('Share', { exact: true }).first(), { settle: 1200, after: 1.2 });
  await cam.click(p.locator('input[placeholder*="email"]').first(), { after: 0.1 });
  await cam.type('sam.carter@example.com', 0.05);
  const as = p.locator('select').filter({ hasText: 'Guest' }).first();
  await cam.moveTo(as); await cam.beat(0.3, null, { click: true });
  await as.selectOption({ index: 1 }); await p.waitForTimeout(300); await cam.hold(1.0);
  await cam.click(p.locator('button.primary', { hasText: /^Share$/ }).first(), { settle: 1800, after: 0 });
  // the page shows the link on the address it was opened at; show the real one, not this local copy's
  await p.evaluate(() => { for (const i of document.querySelectorAll('input')) if (/\/invite\//.test(i.value)) i.value = i.value.replace(location.origin, 'https://app.webaccessbuilder.com'); });
  await cam.hold(3.0);
}

if (want('runtime')) {
  p = await cam.newPage();
  await signIn(p, USER.user, USER.password);
  cam.scene('runtime', 'What a User sees: the runtime, with no design tools');
  await cam.hold(2.2);
  await cam.click('[data-name=cmdOrders]', { settle: 2500, after: 2.4 });
  await cam.click(p.locator('.fv-nav button, button').filter({ hasText: /^▶$/ }).last(), { after: 0.8 });
  await cam.moveTo(p.getByText('Report a problem').first());
  await cam.hold(1.8);
}

await cam.close();
server.kill();
console.log(`Filmed ${cam.scenes.map((s) => `${s.name} (${s.beats.reduce((t, b) => t + b.dur, 0).toFixed(1)}s)`).join(', ')}`);
