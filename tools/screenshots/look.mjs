// Interactive-ish helper: sign in, run a list of steps from a JSON file, screenshot.
// usage: node look.mjs steps.json out.png
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, stepsFile, out] = process.argv;
// Signs in to a local webaccess on port 3100 (WA_USER / WA_PW; defaults match seed.mjs's throwaway admin).
const steps = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.env.DSF || 1) });
const page = await ctx.newPage();
page.on('dialog', (d) => d.dismiss());
await page.goto('http://localhost:3100/');
await page.fill('input[type=text], input[name=username]', process.env.WA_USER || 'admin');
await page.fill('input[type=password]', process.env.WA_PW || 'Shot-Capture-2026!');
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
for (const s of steps) {
  try {
    if (s.upload) page.once('filechooser', (fc) => fc.setFiles(s.upload.replace('$WEBACCESS', process.env.WEBACCESS_DIR || '../webaccess')));
    if (s.click) await page.locator(s.click).first().click({ timeout: 4000 });
    if (s.dblclick) await page.locator(s.dblclick).first().dblclick({ timeout: 4000 });
    if (s.rclick) await page.locator(s.rclick).first().click({ button: 'right', timeout: 4000 });
    if (s.text) await page.getByText(s.text, { exact: !!s.exact }).first().click({ timeout: 4000 });
    if (s.dbltext) await page.getByText(s.dbltext, { exact: true }).first().dblclick({ timeout: 4000 });
    if (s.righttext) await page.getByText(s.righttext, { exact: true }).first().click({ button: 'right', timeout: 4000 });
    if (s.type) await page.keyboard.type(s.type, { delay: 20 });
    if (s.press) await page.keyboard.press(s.press);
    if (s.mouse) await page.mouse.click(s.mouse[0], s.mouse[1]);
    if (s.hover) await page.locator(s.hover).first().hover();
    if (s.eval) await page.evaluate(s.eval);
  } catch (e) { console.log('step failed', JSON.stringify(s), e.message.split('\n')[0]); }
  await page.waitForTimeout(s.wait ?? 500);
}
await page.screenshot({ path: out });
if (process.env.DUMP) fs.writeFileSync(out + '.html', await page.content());
await browser.close();
