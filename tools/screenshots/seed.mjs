// Seeds the local webaccess instance with a highways sample database for screenshots.
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

// ---------- tables ----------
const tables = {
  SchemeTypes: [
    { name: 'ID', type: 'AutoNumber' },
    { name: 'TypeName', type: 'Short Text', size: 30, required: true },
    { name: 'RatePerSqM', type: 'Currency' },
    { name: 'DesignLife', type: 'Number', size: 'Integer' },
  ],
  Schemes: [
    { name: 'ID', type: 'AutoNumber' },
    { name: 'SchemeRef', type: 'Short Text', size: 12, required: true },
    { name: 'Road', type: 'Short Text', size: 40 },
    { name: 'Town', type: 'Short Text', size: 30 },
    { name: 'SchemeType', type: 'Short Text', size: 30 },
    { name: 'Status', type: 'Short Text', size: 12 },
    { name: 'StartDate', type: 'Date/Time' },
    { name: 'LengthM', type: 'Number', size: 'Long Integer' },
    { name: 'WidthM', type: 'Number', size: 'Single' },
    { name: 'Estimate', type: 'Currency' },
    { name: 'Actual', type: 'Currency' },
    { name: 'Priority', type: 'Number', size: 'Integer' },
    { name: 'Notes', type: 'Long Text' },
  ],
  Defects: [
    { name: 'ID', type: 'AutoNumber' },
    { name: 'SchemeID', type: 'Number', size: 'Long Integer', required: true },
    { name: 'DefectRef', type: 'Short Text', size: 12 },
    { name: 'Category', type: 'Short Text', size: 20 },
    { name: 'Severity', type: 'Number', size: 'Integer' },
    { name: 'Reported', type: 'Date/Time' },
    { name: 'Repaired', type: 'Yes/No' },
  ],
};
for (const [name, fields] of Object.entries(tables)) {
  await call('POST', '/api/tables', { table: { name, fields } });
}

// ---------- data ----------
const types = [['Resurfacing', 32.5, 20], ['Surface Dressing', 6.8, 10], ['Patching', 48, 5], ['Footway', 55, 25], ['Drainage', 120, 30]];
for (const [TypeName, RatePerSqM, DesignLife] of types) await call('POST', '/api/tables/SchemeTypes/rows', { values: { TypeName, RatePerSqM, DesignLife } });

const roads = [
  ['A6120 Outer Ring Road', 'Horsforth'], ['B6159 Harehills Lane', 'Harehills'], ['Church Lane', 'Adel'], ['Moor Road', 'Headingley'],
  ['High Street', 'Wetherby'], ['Station Road', 'Garforth'], ['A61 Scott Hall Road', 'Chapeltown'], ['Mill Lane', 'Otley'],
  ['Victoria Avenue', 'Yeadon'], ['Bridge Street', 'Morley'], ['A65 Kirkstall Road', 'Burley'], ['Park Avenue', 'Roundhay'],
  ['Leeds Road', 'Rothwell'], ['Main Street', 'Boston Spa'], ['B6157 Stanningley Road', 'Bramley'], ['Westgate', 'Guiseley'],
  ['Green Lane', 'Cookridge'], ['Wakefield Road', 'Pudsey'], ['A660 Otley Road', 'Headingley'], ['Chapel Hill', 'Morley'],
  ['Queen Street', 'Pudsey'], ['Harrogate Road', 'Chapel Allerton'], ['Ring Road Farsley', 'Farsley'], ['Low Lane', 'Horsforth'],
  ['A58 Easterly Road', 'Oakwood'], ['Town Street', 'Armley'], ['Ninelands Lane', 'Garforth'], ['York Road', 'Seacroft'],
  ['Spen Lane', 'Kirkstall'], ['Swinnow Road', 'Bramley'], ['B6154 Tong Road', 'Farnley'], ['The Avenue', 'Alwoodley'],
];
const statuses = ['Planned', 'Approved', 'On Site', 'Complete'];
let seed = 7;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const schemes = [];
for (let i = 0; i < roads.length; i++) {
  const [Road, Town] = roads[i];
  const t = types[i % types.length];
  const month = Math.floor(rnd() * 20); // Apr 2025 .. Nov 2026
  const d = new Date(Date.UTC(2025, 3 + month, 1 + Math.floor(rnd() * 27)));
  // every fourth scheme is still to start (early 2027), so there are always Planned and Approved ones
  if (i % 4 === 3) d.setUTCFullYear(2027, Math.floor(i / 8) % 3, 1 + (i % 27));
  const LengthM = 80 + Math.floor(rnd() * 900);
  const WidthM = t[0] === 'Footway' ? 2 : t[0] === 'Drainage' ? 1.5 : 6 + Math.round(rnd() * 3 * 2) / 2;
  const share = t[0] === 'Patching' ? 0.3 : 1; // patching covers part of the carriageway
  const Estimate = Math.round(LengthM * WidthM * t[1] * share * (0.9 + rnd() * 0.3) / 100) * 100;
  const Status = i % 4 === 3 ? (i % 8 === 7 ? 'Approved' : 'Planned')
    : d < new Date('2026-10-01') ? (rnd() < 0.85 ? 'Complete' : 'On Site') : pick(['Planned', 'Approved', 'On Site']);
  const Actual = Status === 'Complete' ? Math.round(Estimate * (0.85 + rnd() * 0.35) / 100) * 100 : null;
  const values = {
    SchemeRef: `HS-${String(d.getUTCFullYear()).slice(2)}-${String(101 + i).padStart(3, '0')}`,
    Road, Town, SchemeType: t[0], Status,
    StartDate: d.toISOString().slice(0, 10),
    LengthM, WidthM, Estimate, Actual, Priority: 1 + Math.floor(rnd() * 3),
    Notes: i % 4 === 0 ? 'Night working; bus diversion agreed with Metro.' : i % 7 === 0 ? 'Awaiting utility clearance (gas main).' : '',
  };
  const r = await call('POST', '/api/tables/Schemes/rows', { values });
  schemes.push(r.row);
}
const cats = ['Pothole', 'Crack', 'Edge deterioration', 'Gully blocked', 'Ironwork'];
let n = 1;
for (const s of schemes) {
  const count = Math.floor(rnd() * 5);
  for (let k = 0; k < count; k++) {
    const rep = new Date(s.StartDate); rep.setUTCDate(rep.getUTCDate() - Math.floor(rnd() * 120));
    await call('POST', '/api/tables/Defects/rows', { values: {
      SchemeID: s.ID, DefectRef: `D${String(n++).padStart(4, '0')}`, Category: pick(cats), Severity: 1 + Math.floor(rnd() * 3),
      Reported: rep.toISOString().slice(0, 10), Repaired: s.Status === 'Complete' || rnd() < 0.3,
    } });
  }
}
console.log('tables and data done:', schemes.length, 'schemes,', n - 1, 'defects');
