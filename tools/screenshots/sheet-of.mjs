// Contact sheet of screenshots, to look them over: node sheet-of.mjs <folder> <out.jpg> name1 name2 ...
import sharp from 'sharp';
const [, , dir, out, ...names] = process.argv;
const W = 930, H = 581, C = 2;
const comps = [];
for (let i = 0; i < names.length; i++) comps.push({ input: await sharp(`${dir}/${names[i]}.png`).resize(W, H, { fit: 'contain', background: '#888' }).png().toBuffer(), left: (i % C) * (W + 4), top: Math.floor(i / C) * (H + 4) });
await sharp({ create: { width: (W + 4) * C, height: (H + 4) * Math.ceil(names.length / C), channels: 3, background: '#c00' } }).composite(comps).jpeg({ quality: 88 }).toFile(out);
