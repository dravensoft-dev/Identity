import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contentType, resolveInRoot, startStaticServer } from './static-server.mjs';

test('contentType maps the extensions the demo pages actually load', () => {
  assert.equal(contentType('/a/b.html'), 'text/html; charset=utf-8');
  assert.equal(contentType('/a/b.css'), 'text/css; charset=utf-8');
  assert.equal(contentType('/a/b.js'), 'text/javascript; charset=utf-8');
  assert.equal(contentType('/a/Button.jsx'), 'text/javascript; charset=utf-8');
  assert.equal(contentType('/a/tokens.json'), 'application/json; charset=utf-8');
  assert.equal(contentType('/a/mark.svg'), 'image/svg+xml');
  assert.equal(contentType('/a/face.woff2'), 'font/woff2');
});

test('contentType falls back to octet-stream for anything unlisted', () => {
  assert.equal(contentType('/a/b.bin'), 'application/octet-stream');
  assert.equal(contentType('/a/LICENSE'), 'application/octet-stream');
});

test('resolveInRoot resolves a normal path inside the root', () => {
  assert.equal(resolveInRoot('/repo', '/guidelines/icons.html'), '/repo/guidelines/icons.html');
});

test('resolveInRoot decodes percent-escapes, as the page URLs carry them', () => {
  assert.equal(resolveInRoot('/repo', '/Arena%20-%20Overview.html'), '/repo/Arena - Overview.html');
});

test('resolveInRoot refuses a path that escapes the root', () => {
  assert.equal(resolveInRoot('/repo', '/../../etc/passwd'), null);
});

test('the server serves a file, 404s a missing one, and stops cleanly', async () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-static-'));
  mkdirSync(join(root, 'sub'));
  writeFileSync(join(root, 'sub', 'page.html'), '<!doctype html><p>hi</p>');

  const server = await startStaticServer(root);
  assert.ok(server.port > 0);

  const ok = await fetch(`http://127.0.0.1:${server.port}/sub/page.html`);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.match(await ok.text(), /<p>hi<\/p>/);

  const missing = await fetch(`http://127.0.0.1:${server.port}/sub/nope.html`);
  assert.equal(missing.status, 404);
  await missing.text();

  await server.close();
});
