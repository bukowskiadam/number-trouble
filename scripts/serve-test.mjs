import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/number-trouble/')) {
      res.writeHead(302, { Location: '/number-trouble/' });
      res.end();
      return;
    }
    let path = resolve(root, pathname.slice('/number-trouble/'.length) || 'index.html');
    if (!path.startsWith(root + '/')) {
      res.writeHead(403);
      res.end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    res.writeHead(200, {
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(4175, '127.0.0.1', () =>
  console.log('Production build: http://127.0.0.1:4175/number-trouble/'),
);
