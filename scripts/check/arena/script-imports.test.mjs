/* A script nothing imports has its specifiers proven by nothing. scripts/serve.mjs kept
 * importing ./lib/repo-root.mjs for three commits after that module moved into lib/arena/,
 * because `bun test scripts` loads *.test.mjs and whatever those reach, and no suite reaches
 * serve.mjs -- it calls Bun.serve() at module top level, so importing it starts a server.
 * A *.test.mjs is excluded on the opposite reasoning: running it proves its imports, and its
 * fixtures are import statements inside STRING literals, which a text scan cannot tell apart. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

const SPECIFIER = /(?:from|import)\s*\(?\s*['"](\.[^'"]*)['"]/g;

export function scriptsUnder(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { found.push(...scriptsUnder(full)); continue; }
    if (!entry.name.endsWith('.mjs') || entry.name.endsWith('.test.mjs')) continue;
    found.push(full);
  }
  return found;
}

export function unresolvedSpecifiers(path) {
  const bad = [];
  for (const m of readFileSync(path, 'utf8').matchAll(SPECIFIER)) {
    if (!existsSync(join(dirname(path), m[1]))) bad.push(m[1]);
  }
  return bad;
}

test('every relative import in a non-suite script resolves to a file that is there', () => {
  const scripts = scriptsUnder(join(repoRoot, 'scripts'));
  assert.ok(scripts.length > 30, 'this suite found almost no scripts, so it proves almost nothing');

  const broken = scripts.flatMap((p) =>
    unresolvedSpecifiers(p).map((s) => `${relative(repoRoot, p)} imports ${s}`));
  assert.deepEqual(broken, []);
});

test('serve.mjs is in scope, and it is the reason this suite exists', () => {
  const scripts = scriptsUnder(join(repoRoot, 'scripts')).map((p) => relative(repoRoot, p));
  assert.ok(scripts.includes('scripts/serve.mjs'));
});

test('a suite is out of scope, because its fixtures are imports inside strings', () => {
  const scripts = scriptsUnder(join(repoRoot, 'scripts')).map((p) => relative(repoRoot, p));
  assert.equal(scripts.some((p) => p.endsWith('.test.mjs')), false);
  assert.deepEqual(unresolvedSpecifiers(join(repoRoot, 'scripts/check/arena/script-imports.test.mjs')), [],
    'and this suite is its own witness: scanned directly it is clean, so exclusion is not hiding a break');
});
