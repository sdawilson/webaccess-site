// A saved macro for the Macro Design screenshot: a comment, an If block and two actions.
// Run after seed.mjs and seed2.mjs.
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
await call('DELETE', '/api/macros/' + encodeURIComponent('Open Schemes On Site')).catch(() => {});
const { macro } = await call('POST', '/api/macros', { macro: {
  name: 'Open Schemes On Site',
  description: 'The schemes on site now, or a message when there are none',
  actions: [
    { type: 'comment', text: 'Open the scheme list for the schemes on site now. If there are none, say so.' },
    { type: 'if',
      branches: [{ condition: 'DCount("*", "Schemes", "[Status] = \'On Site\'") > 0', actions: [
        { type: 'action', action: 'OpenForm', args: { FormName: 'Scheme List', View: 'Form', WhereCondition: "[Status] = 'On Site'" } },
        { type: 'action', action: 'SetTempVar', args: { Name: 'LastOpened', Expression: 'Now()' } },
      ] }],
      otherwise: [
        { type: 'action', action: 'MessageBox', args: { Message: 'No schemes are on site today.', Beep: 'No', Type: 'Information', Title: 'Schemes' } },
      ] },
  ],
} });
console.log(`macro "${macro.name}" saved with ${macro.actions.length} statements`);
