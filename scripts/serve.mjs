/* Serves the repo root over HTTP so the demo pages work.
 *
 * The pages load styles.css, assets/ and tokens/src/*.json by relative path,
 * and the Overview fetches its token source — none of which works under
 * file://. This is the one genuinely Bun-specific script in the repo; every
 * gate stays runtime-portable.
 *
 *   bun run demos            -> serves on 8000
 *   PORT=9000 bun run demos  -> serves on 9000
 */
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8000;

const PAGES = [
  ['Overview  ', '/Arena%20-%20Overview.html'],
  ['Identity  ', '/Dravensoft%20Identity.dc.html'],
  ['Guidelines', '/guidelines/'],
];

/** Resolves a URL path to a path inside root, or null if it escapes root. */
function resolve(pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const path = join(root, rel);
  return path.startsWith(root) ? path : null;
}

const isDir = (path) => { try { return statSync(path).isDirectory(); } catch { return false; } };

/* guidelines/ holds 15 specimen cards and no index.html. The python3 -m
 * http.server this replaces listed directories, so dropping that would be a
 * regression for anyone browsing them. */
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
