// Films the code video: modern VBA, the libraries in References, Python and JavaScript modules,
// an event written in Python and one in JavaScript, and a Matplotlib chart on a form.
//   node film-code.mjs <take-folder> [scene]     then: node render.mjs <take-folder> code
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { Camera, signIn, BASE, ADMIN } from './filmlib.mjs';
import { setupCode } from './code-setup.mjs';
import { setupEvents } from '../screenshots/features-setup.mjs';

const [, , dir = 'take-code', only] = process.argv;
const APP = path.resolve(process.env.WEBACCESS_DIR || '../../../webaccess');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-film-'));
const server = spawn('node', ['server/index.js'], { cwd: APP, stdio: 'ignore',
  env: { ...process.env, DATA_DIR: data, PORT: new URL(BASE).port, DEMO_MODE: 'true', PUBLIC_URL: 'https://app.webaccessbuilder.com', ADMIN_USER: ADMIN.user, ADMIN_PASSWORD: ADMIN.password, TZ: 'Europe/London' } });
process.on('exit', () => { server.kill(); fs.rmSync(data, { recursive: true, force: true }); });
for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE + '/')).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 500)); }

const cam = new Camera(dir);
await cam.open();
const p = cam.page;
await signIn(p);
await setupCode(p);
await setupEvents(p);   // the Restock form, with an event in each language
// Python, pandas and Matplotlib load in the background on opening (Load Python on startup)
await p.waitForTimeout(12000);
const want = (name) => !only || only === name;
const tab = (name) => p.locator('.doc-tab', { hasText: name }).first();
const module = (name) => p.locator('.vbe').getByText(name, { exact: true }).first();
const imm = '.vbe-imm-text';
// typing a few letters to a frame: long lines would otherwise take too long to watch
const typeQuick = async (text, chunk = 3, per = 0.09) => {
  for (let i = 0; i < text.length; i += chunk) { await p.keyboard.type(text.slice(i, i + chunk)); await p.waitForTimeout(25); await cam.beat(per); }
};
const clearImm = async () => { await p.locator('.vbe').getByRole('button', { name: 'Clear' }).first().click().catch(() => {}); await p.waitForTimeout(200); };
const code = async () => {
  if (await tab('Visual Basic').count()) await cam.click(tab('Visual Basic'), { settle: 800, after: 0.4 });
  else await cam.click("button.rail-btn[title^='Open the code window']", { settle: 1500, after: 0.4 });
};

if (want('vba')) {
  cam.scene('vba', 'Modern VBA: constructors, Try and Catch, $"…" strings, inline functions');
  await cam.hold(0.6);
  await code();
  await cam.click(module('Customer'), { settle: 800, after: 3.4 });
  await cam.click(module('ModernVBA'), { settle: 800, after: 2.6 });
  // the module is longer than the window: bring Try … End Try into view before it runs
  await p.locator('.ce-input').evaluate((t) => { const line = t.value.slice(0, t.value.indexOf('SortArray')).split('\n').length; t.scrollTop = Math.max(0, (line - 2) * 20); t.dispatchEvent(new Event('scroll')); });
  await p.waitForTimeout(500); await cam.hold(3.0);
  await clearImm();
  await cam.click(imm, { after: 0.3 });
  await cam.type('OrdersSoFar', 0.06);
  await cam.press('Enter', { settle: 1200, after: 2.6 });
}

if (want('refs')) {
  cam.scene('refs', 'Libraries in References: JavaScript and Python');
  await code();
  await cam.click('button[title^="The libraries the code uses"]', { settle: 1000, after: 1.8 });
  const list = p.locator('dialog[open] .refs-list').first();
  const box = await list.boundingBox();
  if (box) {
    await cam.moveTo({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 90); await p.waitForTimeout(250); await cam.beat(0.35); }
  }
  await cam.hold(2.4);
  await cam.click(p.locator('dialog[open]').getByRole('button', { name: 'Cancel' }), { settle: 500, after: 0.4 });
}

if (want('python')) {
  cam.scene('python', 'A Python module, called from VBA');
  await code();
  await cam.click(module('Summary'), { settle: 800, after: 2.0 });
  await clearImm();
  await cam.click(imm, { after: 0.3 });
  await typeQuick('? Summary.describe(Array(14, 18, 21, 30, 96))');
  await cam.press('Enter', { settle: 4000, after: 1.6 });
  await cam.click(module('OrderMaths'), { settle: 800, after: 3.2 });
}

if (want('events')) {
  cam.scene('events', 'Any event in Python or JavaScript, working on the live form');
  await code();
  await cam.click(module('Form_Restock.py'), { settle: 1000, after: 3.6 });
  await cam.click(module('Form_Restock.js'), { settle: 1000, after: 2.6 });
  await cam.click(p.locator('.nav-item').filter({ hasText: /^Restock$/ }).first(), { settle: 5000, after: 1.4 });
  const pane = '.doc-body > .doc-pane:not([hidden])';
  await cam.click(p.locator(`${pane} button`, { hasText: /^Reorder$/ }), { settle: 2500, after: 2.6 });   // Python's MsgBox
  await cam.click(p.locator('dialog[open] button', { hasText: /^Yes$/ }), { settle: 1500, after: 2.0 });
  await cam.click(p.locator(`${pane} button`, { hasText: /Who supplies it/ }), { settle: 6000, after: 2.6 }); // JavaScript's await
}

if (want('chart')) {
  cam.scene('chart', 'A Matplotlib chart on a form, through an Image control');
  await code();
  await cam.click(module('Charts'), { settle: 800, after: 2.4 });
  await cam.click(p.locator('.nav-item').filter({ hasText: /^Python Chart$/ }).first(), { settle: 6000, after: 3.0 });
}

if (want('js')) {
  cam.scene('js', 'JavaScript modules and libraries, called from VBA');
  await code();
  await cam.click(module('Text'), { settle: 800, after: 1.8 });
  await clearImm();
  await cam.click(imm, { after: 0.3 });
  await typeQuick('? Text.initials("abbey mill delicatessen")');
  await cam.press('Enter', { settle: 800, after: 1.0 });
  await typeQuick('? Fuzzy.BestMatch("abey mil", Array("Abbey Mill", "Fen Mill"))');
  await cam.press('Enter', { settle: 1000, after: 2.6 });
}

await cam.close();
server.kill();
console.log('Filmed ' + cam.scenes.map((s) => `${s.name} (${s.beats.reduce((a, b) => a + b.dur, 0).toFixed(1)}s)`).join(', '));
process.exit(0);
