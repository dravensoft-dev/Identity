/* A script nothing imports has its specifiers proven by nothing. scripts/serve.ts kept
 * importing ./lib/repo-root.mjs for three commits after that module moved into lib/arena/,
 * because `bun test scripts` loads *.test.mjs and whatever those reach, and no suite reaches
 * serve.ts -- it calls Bun.serve() at module top level, so importing it starts a server.
 * A *.test.mjs is excluded on the opposite reasoning: running it proves its imports, and its
 * fixtures are import statements inside STRING literals, which a text scan cannot tell apart.
 * A generator writing an import into its OUTPUT is that same class, and a static one there is
 * indistinguishable by text alone. What tells them apart is where the KEYWORD sits, never the
 * specifier: a specifier is a string in both cases, so blanking strings would blank the very
 * thing being resolved and leave the scan reporting nothing about every file. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import { literalRanges, insideLiteral } from '../../lib/arena/comments.ts';
import { isScript, isSuite } from '../../lib/arena/domains.ts';

const SPECIFIER = /(?:from|import)\s*\(?\s*['"](\.[^'"]*)['"]/g;

const EXTENSION_COUPLED_GUARD = /process\.argv\[1\]\s*(?:&&\s*process\.argv\[1\]\s*)?\.endsWith\(/;

export const VENDORED_VERBATIM = new Set([
  'scripts/lib/core/validate-palette.mjs',
  'scripts/generate/core/arena-to-prod/validate-palette.mjs',
]);

export function guardProblems(paths, root = repoRoot) {
  return paths
    .map((p) => relative(root, p).split(sep).join('/'))
    .filter((rel) => !VENDORED_VERBATIM.has(rel))
    .filter((rel) => EXTENSION_COUPLED_GUARD.test(readFileSync(join(root, rel), 'utf8')))
    .map((rel) => `${rel} decides whether it is the program by matching its own filename`);
}

export function scriptsUnder(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { found.push(...scriptsUnder(full)); continue; }
    if (!isScript(entry.name)) continue;
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

test('serve.ts is in scope, and it is the reason this suite exists', () => {
  const scripts = scriptsUnder(join(repoRoot, 'scripts')).map((p) => relative(repoRoot, p));
  assert.ok(scripts.includes('scripts/serve.ts'));
});

test('a suite is out of scope, because its fixtures are imports inside strings', () => {
  const scripts = scriptsUnder(join(repoRoot, 'scripts')).map((p) => relative(repoRoot, p));
  assert.equal(scripts.some((p) => isSuite(p)), false);
  assert.deepEqual(unresolvedSpecifiers(join(repoRoot, 'scripts/check/arena/script-imports.test.ts')), [],
    'and this suite is its own witness: scanned directly it is clean, so exclusion is not hiding a break');
});

test('no script decides it is the program by matching its own filename, which a rename silently falsifies', () => {
  const problems = guardProblems(scriptsUnder(join(repoRoot, 'scripts')));
  assert.deepEqual(problems, [],
    'compare process.argv[1] to fileURLToPath(import.meta.url) instead: a gate whose main() stops '
    + 'running exits 0 having read nothing, and check-all reports that as PASS');
});

test('the two vendored copies are exempt on the record, because re-vendoring is the only edit they take', () => {
  for (const rel of VENDORED_VERBATIM) {
    const source = readFileSync(join(repoRoot, rel), 'utf8');
    assert.match(source, EXTENSION_COUPLED_GUARD,
      `${rel} no longer carries the guard this exemption exists for, so the exemption is stale`);
    assert.match(source, /Vendored verbatim/,
      `${rel} is exempt only for as long as it says it is vendored`);
  }
});

test('a .ts script is in scope and a .ts suite is not, so a renamed file keeps its coverage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-imports-ext-'));
  try {
    for (const name of ['a.mjs', 'b.ts', 'a.test.mjs', 'b.test.ts', 'notes.md'])
      writeFileSync(join(dir, name), '// fixture\n');
    assert.deepEqual(scriptsUnder(dir).map((p) => relative(dir, p)).sort(), ['a.mjs', 'b.ts']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
