/* A script nothing imports has its specifiers proven by nothing. scripts/serve.mjs kept
 * importing ./lib/repo-root.mjs for three commits after that module moved into lib/arena/,
 * because `bun test scripts` loads *.test.mjs and whatever those reach, and no suite reaches
 * serve.mjs -- it calls Bun.serve() at module top level, so importing it starts a server.
 * A *.test.mjs is excluded on the opposite reasoning: running it proves its imports, and its
 * fixtures are import statements inside STRING literals, which a text scan cannot tell apart.
 * A generator writing an import into its OUTPUT is that same class, and a static one there is
 * indistinguishable by text alone. What tells them apart is where the KEYWORD sits, never the
 * specifier: a specifier is a string in both cases, so blanking strings would blank the very
 * thing being resolved and leave the scan reporting nothing about every file. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import { literalRanges, insideLiteral } from '../../lib/arena/comments.mjs';

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

export const isInterpolated = (specifier) => specifier.includes('${');

export function unresolvedSpecifiers(path) {
  const source = readFileSync(path, 'utf8');
  const literals = literalRanges(source);
  const bad = [];
  for (const m of source.matchAll(SPECIFIER)) {
    if (isInterpolated(m[1])) continue;
    if (insideLiteral(literals, m.index)) continue;
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

test('a specifier a generator is writing into its output is not one this script imports', () => {
  assert.equal(isInterpolated('./${helper}.js'), true);
  assert.equal(isInterpolated('./lib/arena/repo-root.mjs'), false);
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

test('a real import that resolves to nothing is still caught, which is what the blanking must not cost', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-imports-'));
  try {
    const path = join(dir, 'Broken.mjs');
    writeFileSync(path, "import { x } from './gone.mjs';\nconst t = `import { y } from './alsoGone.mjs';`;\n");
    assert.deepEqual(unresolvedSpecifiers(path), ['./gone.mjs'],
      'the real import must be reported and the one inside the template must not');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
