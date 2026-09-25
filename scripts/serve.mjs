import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 4173);
const routes = {
  '/': ['../demo/index.html', 'text/html; charset=utf-8'],
  '/index.html': ['../demo/index.html', 'text/html; charset=utf-8'],
  '/optics.html': ['../demo/optics.html', 'text/html; charset=utf-8'],
  '/assets/flower.mp4': ['../demo/assets/flower.mp4', 'video/mp4'],
};
createServer(async (req, res) => {
  const route = routes[new URL(req.url, 'http://localhost').pathname];
  if (!route || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); res.end(); return; }
  try {
    const content = await readFile(new URL(route[0], import.meta.url));
    res.setHeader('Content-Type', route[1]); res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Accept-Ranges', 'bytes');
    let start = 0, end = content.length - 1;
    if (req.headers.range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if (!match || Number(match[1]) >= content.length || (match[2] && Number(match[2]) < Number(match[1]))) {
        res.writeHead(416, { 'Content-Range': `bytes */${content.length}` }); res.end(); return;
      }
      start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end;
      res.statusCode = 206; res.setHeader('Content-Range', `bytes ${start}-${end}/${content.length}`);
    }
    res.setHeader('Content-Length', end - start + 1);
    res.end(req.method === 'HEAD' ? undefined : content.subarray(start, end + 1));
  } catch { res.writeHead(500); res.end('Build the demo first: npm run build'); }
}).listen(port, '127.0.0.1', () => console.log(`Prism Glass: http://127.0.0.1:${port}`));
