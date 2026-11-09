// Screens from the demo: a second local copy of the app started with DEMO_MODE=true
// (see README.md). Usage: DEMO_URL=http://localhost:3200 OUT=shots node demo.mjs
import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.env.DSF || 1) });
const p = await ctx.newPage();
p.on('dialog', (d) => d.dismiss());
const out = process.env.OUT || 'shots';
await p.goto((process.env.DEMO_URL || 'http://localhost:3200') + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
await p.screenshot({ path: `${out}/demo-signin.png` });
await p.getByText('Try the demo').first().click(); await p.waitForTimeout(3500);
await p.screenshot({ path: `${out}/demo-menu.png` });
await p.locator('button.fv-button', { hasText: 'Sales Dashboard' }).click(); await p.waitForTimeout(3500);
await p.screenshot({ path: `${out}/demo-dashboard.png` });
await p.getByText('Main Menu', { exact: true }).first().click(); await p.waitForTimeout(800);
await p.locator('button.fv-button', { hasText: /^Orders$/ }).click(); await p.waitForTimeout(3000);
await p.screenshot({ path: `${out}/demo-orders.png` });
// The same form with the ribbon and Navigation Pane hidden (the account menu's own options),
// for the website's runtime section.
for (const item of ['Hide the ribbon', 'Hide the Navigation Pane']) {
  await p.getByRole('button', { name: /Demo visitor/ }).click(); await p.waitForTimeout(300);
  await p.getByRole('menuitem', { name: item }).click(); await p.waitForTimeout(500);
}
await p.screenshot({ path: `${out}/runtime-orders.png` });
await b.close();
