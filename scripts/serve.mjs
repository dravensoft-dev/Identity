import { readdirSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { repoRoot as root } from './lib/arena/repo-root.mjs';

const port = Number(process.env.PORT) || 8000;

const PAGES = [
  ['Overview  ', '/intro/Arena%20-%20Overview.html'],
  ['Identity  ', '/intro/Dravensoft%20Identity.dc.html'],
  ['Guidelines', '/intro/guidelines/'],
];

function resolve(pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const path = join(root, rel);
  return path.startsWith(root) ? path : null;
}

const isDir = (path) => { try { return statSync(path).isDirectory(); } catch { return false; } };

function listing(path, pathname) {
  const entries = readdirSync(path).sort();
  const items = entries
    .map((name) => {
      const href = `${pathname.replace(/\/?$/, '/')}${encodeURIComponent(name)}`;
      return `<li><a href="${href}">${name}${isDir(join(path, name)) ? '/' : ''}</a></li>`;
    })
    .join('\n');
  return new Response(
    `<!DOCTYPE html><meta charset="utf-8"><title>${pathname}</title>`
    + `<h1>${pathname}</h1><ul>\n${items}\n</ul>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

Bun.serve({
  port,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    const path = resolve(pathname);
    if (!path) return new Response('Forbidden', { status: 403 });
    if (isDir(path)) {

      if (!pathname.endsWith('/'))
        return Response.redirect(`${pathname}/`, 301);
      const index = Bun.file(join(path, 'index.html'));
      if (await index.exists()) return new Response(index);
      return listing(path, pathname);
    }
    const file = Bun.file(path);
    if (await file.exists()) return new Response(file);
    return new Response('Not found', { status: 404 });
  },
});

console.log(`Arena demos on http://localhost:${port}`);
for (const [label, path] of PAGES) console.log(`  ${label} -> ${path}`);
