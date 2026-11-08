// Newer features for the screenshots: calculated fields, and a dashboard form with Chart
// controls and a label with Text Orientation. Run after seed.mjs, seed2.mjs and seed3.mjs.
const BASE = 'http://localhost:3100';
let cookie = '';
async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess', Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}
await call('POST', '/api/auth/login', { username: 'admin', password: process.env.SEED_PW });

// ---------- calculated fields on Schemes ----------
const { table } = await call('GET', '/api/tables/Schemes');
if (!table.fields.some((f) => f.name === 'AreaM2')) {
  table.fields.push(
    { name: 'AreaM2', type: 'Calculated', expression: '[LengthM]*[WidthM]', resultType: 'Number', size: 'Double', format: 'Standard', caption: 'Area (m²)' },
    { name: 'Variance', type: 'Calculated', expression: 'IIf([Actual] Is Null,Null,[Actual]-[Estimate])', resultType: 'Currency', format: 'Currency' },
  );
  await call('PUT', '/api/tables/Schemes', { table, force: true });
}

// ---------- a dashboard form with Chart controls ----------
const GREEN = '#1f4e3d';
await call('DELETE', '/api/forms/Programme Dashboard').catch(() => {});
await call('POST', '/api/forms', { form: {
  name: 'Programme Dashboard', caption: 'Programme Dashboard', recordSource: '', defaultView: 'single', width: 1060,
  sections: { header: { height: 64, backColor: GREEN }, detail: { height: 470 }, footer: { height: 0 } },
  controls: [
    { section: 'header', type: 'label', name: 'lblTitle', caption: 'Highway programme 2025–27', x: 16, y: 12, width: 520, height: 36, fontSize: 22, bold: true, foreColor: '#ffffff' },
    { type: 'label', name: 'lblSide', caption: 'Estimates and outturn', x: 8, y: 20, width: 30, height: 420, fontSize: 13, bold: true, foreColor: '#4c5e55', textOrientation: 'up', textAlign: 'center' },
    { type: 'chart', name: 'chtSpend', x: 48, y: 16, width: 600, height: 430, chart: {
      chartType: 'column', chartTitle: 'Estimate and actual by scheme type', legendPosition: 'bottom',
      rowSource: 'Schemes', axisField: 'SchemeType', valueFields: ['Estimate', 'Actual'], aggregate: 'sum',
      primaryAxis: { format: '"£"#,##0' },
    } },
    { type: 'chart', name: 'chtStatus', x: 668, y: 16, width: 376, height: 430, chart: {
      chartType: 'doughnut', chartTitle: 'Schemes by status', legendPosition: 'bottom',
      rowSource: 'Schemes', axisField: 'Status', valueFields: ['ID'], aggregate: 'count', dataLabels: true,
    } },
  ],
} });
console.log('calculated fields and dashboard done');
