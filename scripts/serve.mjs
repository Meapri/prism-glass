import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 4173);
createServer(async (req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') { res.writeHead(404); res.end(); return; }
  try { res.setHeader('Content-Type','text/html; charset=utf-8'); res.end(await readFile(new URL('../demo/index.html', import.meta.url))); }
  catch { res.writeHead(500); res.end('Build the demo first: npm run build'); }
}).listen(port, '127.0.0.1', () => console.log(`Prism Glass: http://127.0.0.1:${port}`));
