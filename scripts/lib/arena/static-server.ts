import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.tsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export function contentType(path: string) {
  return TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

export function resolveInRoot(root, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relPath = rel.replace(/^\/+/, '');

  const base = root.replace(/\/+$/, '');
  const path = resolve(base, relPath);
  return path.startsWith(base + '/') || path === base ? path : null;
}

export function startStaticServer(root): Promise<{ port: number; close: () => Promise<void> }> {
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

  return new Promise((listening, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      listening({
        port: (server.address() as { port: number }).port,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}
