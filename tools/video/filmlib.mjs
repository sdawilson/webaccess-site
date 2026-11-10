// A Playwright "camera" for the demo film. It drives the app and records keyframes: a JPEG of each
// state, how long it is held, and where the cursor travels meanwhile. render.mjs turns the plan into video.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const BASE = process.env.FILM_URL || 'http://localhost:3200';
export const ADMIN = { user: 'admin', password: process.env.FILM_PW || 'Film-Demo-2026!' };
// 1440x762 CSS px at 4/3 = 1920x1016 frames; render.mjs adds a 64 px caption band below.
export const W = 1440, H = 762, SCALE = 4 / 3;

export class Camera {
  constructor(dir) {
    this.dir = dir; this.scenes = []; this.n = 0; this.cur = { x: 720, y: 400 };
    fs.mkdirSync(path.join(dir, 'keys'), { recursive: true });
  }
  async open() {
    this.browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
    await this.newPage();
  }
  // A fresh browser session (another person signing in).
  async newPage() {
    if (this.context) await this.context.close();
    this.context = await this.browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, locale: 'en-GB', timezoneId: 'Europe/London' });
    this.page = await this.context.newPage();
    this.page.on('dialog', (d) => d.dismiss());
    return this.page;
  }
  scene(name, caption) { this.cur_scene = { name, caption, beats: [] }; this.scenes.push(this.cur_scene); }
  async snap() {
    const file = `keys/${String(++this.n).padStart(4, '0')}.jpg`;
    await this.page.screenshot({ path: path.join(this.dir, file), type: 'jpeg', quality: 92 });
    return file;
  }
  async beat(dur, to, extra = {}) {
    const img = await this.snap();
    const from = { ...this.cur };
    if (to) this.cur = { ...to };
    this.cur_scene.beats.push({ img, dur, from, to: { ...this.cur }, ...extra });
  }
  // Hold what is on screen.
  async hold(sec) { await this.beat(sec); }
  async point(target) {
    if (target.x !== undefined) return target;
    const loc = typeof target === 'string' ? this.page.locator(target).first() : target;
    await loc.waitFor({ state: 'visible', timeout: 8000 });
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }
  // Glide the cursor to something; the real mouse follows so hover styles show in the next shot.
  async moveTo(target, sec) {
    const p = await this.point(target);
    const d = Math.hypot(p.x - this.cur.x, p.y - this.cur.y);
    await this.beat(sec ?? Math.min(1.0, 0.35 + d / 1500), p);
    await this.page.mouse.move(p.x, p.y);
    await this.page.waitForTimeout(120);
    return p;
  }
  async click(target, { settle = 700, after = 0.5, dbl = false } = {}) {
    const p = await this.moveTo(target);
    await this.beat(0.3, null, { click: true });
    if (dbl) await this.page.mouse.dblclick(p.x, p.y); else await this.page.mouse.click(p.x, p.y);
    await this.page.waitForTimeout(settle);
    if (after) await this.hold(after);
  }
  async type(text, per = 0.07) {
    for (const ch of text) { await this.page.keyboard.type(ch); await this.page.waitForTimeout(30); await this.beat(per); }
  }
  async press(key, { settle = 500, after = 0.6 } = {}) {
    await this.page.keyboard.press(key); await this.page.waitForTimeout(settle);
    if (after) await this.hold(after);
  }
  async drag(from, to, { settle = 900, after = 0.8, steps = 12 } = {}) {
    const a = await this.moveTo(from);
    await this.beat(0.25, null, { click: true });
    await this.page.mouse.down();
    const b = await this.point(to);
    // a few real intermediate positions, each photographed, so the drag shows what the app shows
    for (let i = 1; i <= steps; i++) {
      const p = { x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps };
      await this.page.mouse.move(p.x, p.y); await this.page.waitForTimeout(40);
      await this.beat(0.09, p, { linear: true });
    }
    await this.beat(0.3);
    await this.page.mouse.up();
    await this.page.waitForTimeout(settle);
    if (after) await this.hold(after);
  }
  async close() {
    fs.writeFileSync(path.join(this.dir, 'plan.json'), JSON.stringify({ W, H, SCALE, scenes: this.scenes }, null, 1));
    await this.browser.close();
  }
}

export async function signIn(page, user = ADMIN.user, password = ADMIN.password) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.fill('input[type=text], input[name=username]', user);
  await page.fill('input[type=password]', password);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
}
