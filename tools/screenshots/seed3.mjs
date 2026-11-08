// A report for the screenshot database: schemes grouped by type, with totals.
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
await call('DELETE', '/api/reports/Schemes by Type').catch(() => {}); // start afresh when re-run

const GREEN = '#1f4e3d';
const col = (name, caption, x, w, align = 'left') => ({ section: 'pageHeader', type: 'label', name, caption, x, y: 6, width: w, height: 20, bold: true, fontSize: 11, foreColor: GREEN, textAlign: align });
const cell = (name, src, x, w, extra = {}) => ({ section: 'detail', type: 'textbox', name, controlSource: src, x, y: 3, width: w, height: 20, fontSize: 11, ...extra });

await call('POST', '/api/reports', { report: {
  name: 'Schemes by Type', caption: 'Schemes by Type', recordSource: 'Schemes', width: 680,
  page: { size: 'A4', orientation: 'portrait', margins: { top: 15, bottom: 15, left: 15, right: 15 } },
  groups: [
    { id: 'grptype', field: 'SchemeType', header: true, footer: true, groupOn: 'value', interval: 1, keepTogether: 'first' },
    { id: 'srtstart', field: 'StartDate', desc: false },
  ],
  sections: {
    reportHeader: { height: 70 },
    pageHeader: { height: 32 },
    gh_grptype: { height: 36 },
    detail: { height: 26, alternateBackColor: '#f2f6f3' },
    gf_grptype: { height: 40 },
    pageFooter: { height: 30 },
    reportFooter: { height: 46 },
  },
  controls: [
    { section: 'reportHeader', type: 'label', name: 'lblTitle', caption: 'Highway schemes by type', x: 0, y: 8, width: 460, height: 34, fontSize: 22, bold: true, foreColor: GREEN },
    { section: 'reportHeader', type: 'textbox', name: 'txtNow', controlSource: '="Printed " & Format(Date(),"dd mmmm yyyy")', x: 0, y: 44, width: 300, height: 20, fontSize: 11, foreColor: '#4c5e55' },
    { section: 'reportHeader', type: 'line', name: 'lnTop', x: 0, y: 66, width: 680, height: 1, borderWidth: 2, foreColor: GREEN },
    col('hRef', 'Ref', 0, 80), col('hRoad', 'Road', 84, 200), col('hTown', 'Town', 288, 110), col('hStatus', 'Status', 402, 80),
    col('hStart', 'Start', 486, 80), col('hEst', 'Estimate', 570, 110, 'right'),
    { section: 'gh_grptype', type: 'textbox', name: 'SchemeType', controlSource: 'SchemeType', x: 0, y: 8, width: 300, height: 24, fontSize: 14, bold: true, foreColor: GREEN },
    cell('SchemeRef', 'SchemeRef', 0, 80), cell('Road', 'Road', 84, 200), cell('Town', 'Town', 288, 110), cell('Status', 'Status', 402, 80),
    cell('StartDate', 'StartDate', 486, 80, { format: 'Short Date' }),
    cell('Estimate', 'Estimate', 570, 110, { textAlign: 'right', format: 'Currency' }),
    { section: 'gf_grptype', type: 'line', name: 'lnSub', x: 540, y: 4, width: 140, height: 1, foreColor: '#9fb0a5' },
    { section: 'gf_grptype', type: 'textbox', name: 'txtCount', controlSource: '=Count(*) & " schemes"', x: 84, y: 10, width: 200, height: 20, fontSize: 11, italic: true, foreColor: '#4c5e55' },
    { section: 'gf_grptype', type: 'textbox', name: 'SumOfEstimate', controlSource: '=Sum([Estimate])', x: 500, y: 10, width: 180, height: 20, fontSize: 11, bold: true, textAlign: 'right', format: 'Currency' },
    { section: 'pageFooter', type: 'textbox', name: 'txtPage', controlSource: '="Page " & [Page] & " of " & [Pages]', x: 480, y: 6, width: 200, height: 20, fontSize: 10, textAlign: 'right', foreColor: '#4c5e55' },
    { section: 'reportFooter', type: 'line', name: 'lnEnd', x: 0, y: 6, width: 680, height: 1, borderWidth: 2, foreColor: GREEN },
    { section: 'reportFooter', type: 'label', name: 'lblGrand', caption: 'All schemes', x: 0, y: 16, width: 200, height: 24, fontSize: 13, bold: true },
    { section: 'reportFooter', type: 'textbox', name: 'GrandTotal', controlSource: '=Sum([Estimate])', x: 480, y: 16, width: 200, height: 24, fontSize: 13, bold: true, textAlign: 'right', format: 'Currency' },
  ],
} });
console.log('report done');
