// Renders a take (film.mjs's keyframes and plan.json) into the finished video:
//   node render.mjs <take-folder>
// One MP4 per scene (cursor, click rings and a caption band drawn on 30 fps frames), title and end
// cards, joined without re-encoding; then the narration in vo/ is laid under it and captions written.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { chromium } from 'playwright';

const [, , dir = 'take'] = process.argv;
const here = import.meta.dirname;
const plan = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
const narration = JSON.parse(fs.readFileSync(path.join(here, 'narration.json'), 'utf8'));
const FPS = 30, W = 1920, H = 1080, SH = 1016, BAND = H - SH;
const LEAD = 0.35, TAIL = 0.7;               // the voice starts this long after a cut and ends this long before the next
const GREEN = '#1f4e3d', GOLD = '#d9a514';
const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
const APP = path.resolve(process.env.WEBACCESS_DIR || path.join(here, '../../../webaccess'));
const font = (w) => `data:font/woff2;base64,${fs.readFileSync(path.join(APP, `public/fonts/atkinson-hyperlegible-next-latin-${w}-normal.woff2`)).toString('base64')}`;
const logo = fs.readFileSync(path.join(here, '../../public/img/brand/logo-white.svg'), 'utf8');
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const ffmpeg = (args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
const ENC = ['-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS)];

// ---------- the voice: how long each scene must be ----------
const voice = narration.map((n, i) => {
  const file = path.join(here, 'vo', `${String(i + 1).padStart(2, '0')}-${n.scene}.mp3`);
  return { ...n, file, len: fs.existsSync(file) ? dur(file) : 0 };
});
const need = (name) => { const v = voice.find((x) => x.scene === name); return v && v.len ? LEAD + v.len + TAIL : 0; };

// ---------- cards and caption bands, drawn by the browser so the type matches the app ----------
const css = `@font-face{font-family:A;src:url(${font(400)});font-weight:400}@font-face{font-family:A;src:url(${font(700)});font-weight:700}
*{margin:0;box-sizing:border-box}body{font-family:A,sans-serif;background:${GREEN};color:#fff;width:${W}px}`;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
async function shoot(html, file, height) {
  await page.setViewportSize({ width: W, height });
  await page.setContent(`<style>${css}</style>${html}`); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height } });
}
const card = (big, small) => `<div style="height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:54px;text-align:center">
  <div style="width:880px">${logo.replace('<svg ', '<svg style="width:100%;height:auto" ')}</div>
  <div style="font-size:60px;font-weight:700;line-height:1.2">${big}</div>
  <div style="font-size:36px;color:#cfe0d8;line-height:1.4">${small}</div></div>`;
await shoot(card('Build a database app. Hand it out free.', 'Tables, queries, forms, reports and VBA, in your browser'), path.join(out, 'card-title.png'), H);
await shoot(card(`Try the demo at <span style="color:${GOLD}">webaccessbuilder.com</span>`, 'In active development, and not yet for production use'), path.join(out, 'card-end.png'), H);
for (const s of plan.scenes) {
  await shoot(`<div style="height:${BAND}px;display:flex;align-items:center;justify-content:center;font-size:30px;border-top:3px solid ${GOLD}">${s.caption}</div>`, path.join(out, `band-${s.name}.png`), BAND);
}
await browser.close();

// ---------- the cursor ----------
const CUR = { w: 30, h: 44 };
const cursor = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CUR.w}" height="${CUR.h}" viewBox="0 0 15 22"><path d="M1 1v17l4.2-3.9 2.9 6.6 2.6-1.1-2.9-6.5H13z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>`)).raw().ensureAlpha().toBuffer();
function drawCursor(buf, cx, cy) {
  const x0 = Math.round(cx) - 2, y0 = Math.round(cy) - 2;
  for (let y = 0; y < CUR.h; y++) {
    const fy = y0 + y; if (fy < 0 || fy >= H) continue;
    for (let x = 0; x < CUR.w; x++) {
      const fx = x0 + x; if (fx < 0 || fx >= W) continue;
      const s = (y * CUR.w + x) * 4, a = cursor[s + 3] / 255; if (!a) continue;
      const d = (fy * W + fx) * 3;
      buf[d] = cursor[s] * a + buf[d] * (1 - a); buf[d + 1] = cursor[s + 1] * a + buf[d + 1] * (1 - a); buf[d + 2] = cursor[s + 2] * a + buf[d + 2] * (1 - a);
    }
  }
}
// A gold ring that grows and fades where a click lands.
function drawRing(buf, cx, cy, t) {
  const r = 10 + 26 * t, a0 = 0.85 * (1 - t), th = 4;
  for (let y = Math.max(0, Math.floor(cy - r - th)); y <= Math.min(H - 1, Math.ceil(cy + r + th)); y++) {
    for (let x = Math.max(0, Math.floor(cx - r - th)); x <= Math.min(W - 1, Math.ceil(cx + r + th)); x++) {
      const e = Math.abs(Math.hypot(x - cx, y - cy) - r); if (e > th) continue;
      const a = a0 * Math.min(1, th - e), d = (y * W + x) * 3;
      buf[d] = 217 * a + buf[d] * (1 - a); buf[d + 1] = 165 * a + buf[d + 1] * (1 - a); buf[d + 2] = 20 * a + buf[d + 2] * (1 - a);
    }
  }
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

// ---------- one scene ----------
async function renderScene(s) {
  const file = path.join(out, `scene-${s.name}.mp4`), tmp = path.join(out, `scene-${s.name}.part.mp4`);
  const beats = s.beats.map((b) => ({ ...b }));
  const filmed = beats.reduce((t, b) => t + b.dur, 0);
  if (need(s.name) > filmed) beats[beats.length - 1].dur += need(s.name) - filmed;   // hold the last picture while the voice finishes
  const band = await sharp(path.join(out, `band-${s.name}.png`)).removeAlpha().raw().toBuffer();
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', ...ENC, tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  const k = W / plan.W;   // CSS px to frame px
  let frames = 0, carry = 0;
  for (const b of beats) {
    const shot = await sharp(path.join(dir, b.img)).resize(W, SH, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    const base = Buffer.concat([shot, band]);
    if (base.length !== W * H * 3) throw new Error(`unexpected frame size for ${b.img}`);
    const exact = b.dur * FPS + carry, n = Math.max(1, Math.round(exact)); carry = exact - n;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 1 : i / (n - 1), e = b.linear ? t : ease(t);
      const x = (b.from.x + (b.to.x - b.from.x) * e) * k, y = (b.from.y + (b.to.y - b.from.y) * e) * k;
      const f = Buffer.from(base);
      if (b.click) drawRing(f, x, y, t);
      drawCursor(f, x, y);
      if (!ff.stdin.write(f)) await new Promise((r) => ff.stdin.once('drain', r));
      frames++;
    }
  }
  ff.stdin.end(); await done; fs.renameSync(tmp, file);
  return { name: s.name, file, len: frames / FPS };
}
function renderCard(name) {
  const file = path.join(out, `scene-${name}.mp4`), tmp = path.join(out, `scene-${name}.part.mp4`);
  const len = Math.ceil(Math.max(need(name), 4) * FPS) / FPS;
  ffmpeg(['-framerate', String(FPS), '-i', path.join(out, `card-${name}.png`), '-vf', `format=yuv420p,loop=-1:1,trim=duration=${len},fade=in:st=0:d=0.4,fade=out:st=${(len - 0.4).toFixed(3)}:d=0.4`, ...ENC, tmp]);
  fs.renameSync(tmp, file);
  return { name, file, len };
}

const parts = [renderCard('title')];
for (const s of plan.scenes) { parts.push(await renderScene(s)); console.log(`  ${s.name}: ${parts.at(-1).len.toFixed(1)}s`); }
parts.push(renderCard('end'));

// ---------- join, add the voice, write captions ----------
const list = path.join(out, 'list.txt');
fs.writeFileSync(list, parts.map((p) => `file '${path.resolve(p.file)}'`).join('\n'));
const silent = path.join(out, 'silent.mp4');
ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
let t = 0; const cues = [];
for (const p of parts) { const v = voice.find((x) => x.scene === p.name); if (v && v.len) cues.push({ ...v, at: t + LEAD }); t += p.len; }
const final = path.join(out, 'web-access-builder-demo.mp4');
if (cues.length) {
  const ins = cues.flatMap((c) => ['-i', c.file]);
  const filt = cues.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.at * 1000)}:all=1[a${i}]`).join(';') +
    `;${cues.map((_, i) => `[a${i}]`).join('')}amix=inputs=${cues.length}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad[a]`;
  ffmpeg(['-i', silent, ...ins, '-filter_complex', filt, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', '-movflags', '+faststart', final + '.part.mp4']);
  fs.renameSync(final + '.part.mp4', final);
  const ts = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(3).padStart(6, '0')}`;
  // captions: each line split into sentences, timed by their share of the words
  let vtt = 'WEBVTT\n';
  for (const c of cues) {
    const bits = c.text.split(/(?<=[.:])\s+/).map((x) => x.trim()).filter(Boolean);
    const words = bits.map((x) => x.split(/\s+/).length), total = words.reduce((a, b) => a + b, 0);
    let at = c.at;
    bits.forEach((bit, i) => { const d = c.len * words[i] / total; vtt += `\n00:${ts(at)} --> 00:${ts(at + d)}\n${bit}\n`; at += d; });
  }
  fs.writeFileSync(path.join(out, 'web-access-builder-demo.en.vtt'), vtt);
} else {
  fs.copyFileSync(silent, final);
}
console.log(`Rendered ${final} (${dur(final).toFixed(1)}s)`);
