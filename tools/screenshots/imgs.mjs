import sharp from 'sharp';
// [name, crop in 1x px (x,y,w,h) or null for full]
const DOC = [240, 180, 1200, 720];
const list = [
  ['continuous-form', null], ['form-view', null], ['form-design', null], ['pivottable', null], ['pivotchart', null],
  ['query-totals', null], ['query-criteria', null], ['sql-view', null], ['table-design', null], ['datasheet', null],
  ['form-code', null], ['debugger', null], ['intellisense', null], ['conditional-formatting', null], ['import-access', null],
  ['users', null], ['user-view', null], ['property-sheet', null],
];
const crops = {
  'continuous-form': DOC, 'form-view': DOC, 'form-design': DOC, 'pivottable': DOC, 'pivotchart': DOC, 'query-totals': DOC,
  'query-criteria': DOC, 'sql-view': [240, 180, 1200, 420], 'table-design': DOC, 'datasheet': DOC, 'form-code': DOC, 'debugger': DOC,
  'intellisense': DOC, 'conditional-formatting': [240, 180, 1200, 560], 'import-access': [220, 255, 1000, 390], 'users': [240, 180, 1200, 420],
  'user-view': DOC, 'property-sheet': [240, 180, 1200, 720],
};
const out = new URL('../../public/img/', import.meta.url).pathname;
for (const [n] of list) {
  const src = `shots/${n}.png`;
  await sharp(src).resize(2880).webp({ quality: 78 }).toFile(`${out}${n}-full@2x.webp`);
  await sharp(src).resize(1440).webp({ quality: 80 }).toFile(`${out}${n}-full.webp`);
  const [x, y, w, h] = crops[n];
  const c = sharp(src).extract({ left: x * 2, top: y * 2, width: w * 2, height: h * 2 });
  await c.clone().webp({ quality: 78 }).toFile(`${out}${n}@2x.webp`);
  await c.clone().resize(w).webp({ quality: 80 }).toFile(`${out}${n}.webp`);
}
// social card
await sharp('shots/continuous-form.png').resize(1200, 630, { fit: 'cover', position: 'top' }).png().toFile(out + 'og.png');
console.log('done');
