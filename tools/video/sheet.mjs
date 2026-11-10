// Contact sheet of a take's keyframes, to check a scene before rendering: node sheet.mjs <take> <scene> <out.jpg> [every]
import sharp from 'sharp'; import fs from 'node:fs';
const [,, dir, scene, out, every = 1] = process.argv;
const plan = JSON.parse(fs.readFileSync(`${dir}/plan.json`));
let beats = plan.scenes.find((s) => s.name === scene).beats.filter((b) => b.dur >= 0.4);
beats = beats.filter((_, i) => i % every === 0).slice(0, 12);
const W = 640, H = 339, cols = 3, rows = Math.ceil(beats.length / cols);
const comps = await Promise.all(beats.map(async (b, i) => ({ input: await sharp(`${dir}/${b.img}`).resize(W, H).toBuffer(), left: (i % cols) * W, top: Math.floor(i / cols) * H })));
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: '#fff' } }).composite(comps).jpeg({ quality: 82 }).toFile(out);
console.log(beats.length, 'frames');
