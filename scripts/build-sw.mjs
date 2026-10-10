import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? walk(join(dir, entry.name)) : join(dir, entry.name),
      ),
    )
  ).flat();
}
const files = (await walk('dist')).filter((file) => !file.endsWith('/sw.js')).sort();
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(file));
const version = hash.digest('hex').slice(0, 16);
const assets = files.map((file) => file.slice(5));
await writeFile(
  'dist/sw.js',
  `
const PREFIX = 'number-trouble-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + '${version}';
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new URL(path,self.registration.scope).href))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {if(event.data === 'ACTIVATE') self.skipWaiting();});
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if(event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const key=event.request.mode==='navigate' ? new URL('index.html',self.registration.scope).href : event.request;
    return (await cache.match(key)) || fetch(event.request);
  }));
});
`,
);
console.log(`Precached ${assets.length} assets; version ${version}`);
