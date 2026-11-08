// Local preview: serves public/ and answers POST /api/request like the edge script.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = new URL('./public/', import.meta.url).pathname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/request') { let b = ''; req.on('data', (c) => b += c); req.on('end', () => { console.log('request', b); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}'); }); return; }
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); res.end('Not found'); return; } res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(data); });
}).listen(4100, () => console.log('preview on 4100'));
