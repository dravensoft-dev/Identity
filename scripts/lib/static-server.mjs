/* A static file server for the gates, rooted at one directory, on an
 * ephemeral port.
 *
 * scripts/serve.mjs already serves the repo for humans, but it is built on
 * Bun.serve and is "the one genuinely Bun-specific script in the repo".
 * check-card-viewports.mjs is a gate, and gates are spawned as
 * `process.execPath <script>` by check-all.mjs — so it needs a server that
 * runs under node too. This is that server, on node:http, and it is
 * deliberately smaller than serve.mjs: no directory listings, no index
 * resolution, no redirects. The gate asks for explicit .html paths and
 * nothing else.
 *
 * Port 0 lets the OS pick a free port, so two gates (or a gate and a running
 * `bun run demos`) never collide.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

/** Extension -> Content-Type, covering exactly what the demo pages load.
 *  .jsx is served as JavaScript: the pages fetch() it as text and hand it to
 *  Babel, so the type is not load-bearing, but a wrong one is a lie. */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** @param {string} path @returns {string} the Content-Type for a file path. */
export function contentType(path) {
  return TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

/** Resolve a URL pathname to a path inside root.
 *  @param {string} root @param {string} pathname
 *  @returns {string | null} null when the path escapes root. */
export function resolveInRoot(root, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return null; // malformed percent-escape
  }
  // Strip leading slash to make it relative to root, not filesystem-absolute
  const relPath = rel.replace(/^\/+/, '');
  /* A trailing slash on root would make the boundary check below test against
     `//` and reject everything. Cheaper to tolerate here than to require every
     caller to remember. */
  const base = root.replace(/\/+$/, '');
  const path = resolve(base, relPath);
  return path.startsWith(base + '/') || path === base ? path : null;
}

/** Start the server on an ephemeral port.
 *  @param {string} root @returns {Promise<{port: number, close: () => Promise<void>}>} */
export function startStaticServer(root) {
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const path = resolveInRoot(root, pathname);
    if (!path) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': contentType(path) }).end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });

  /* Named `listening` rather than `resolve`: this file imports node:path's
     `resolve`, and shadowing it here is how the next edit to this function
     silently gets the wrong one. */
  return new Promise((listening, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      listening({
        port: server.address().port,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}
