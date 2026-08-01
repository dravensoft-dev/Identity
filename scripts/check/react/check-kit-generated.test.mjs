/* The kit is the only build product this repository tracks, so both directions of drift
 * matter: a file the layer no longer produces would keep shipping, and a stale one would
 * ship a component nobody can reproduce from the source beside it. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { drift, filesUnder, zeroKitProblems, skipExitCode } from './check-kit-generated.mjs';

function tree(files) {
  const dir = mkdtempSync(join(tmpdir(), 'arena-kit-test-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  }
  return dir;
}

test('an identical tree is no drift, and filesUnder walks into directories', () => {
  const a = tree({ 'A.generated.js': 'x', 'c/B.generated.js': 'y' });
  const b = tree({ 'A.generated.js': 'x', 'c/B.generated.js': 'y' });
  assert.deepEqual(drift(a, b), []);
  assert.deepEqual(filesUnder(a).sort(), ['A.generated.js', 'c/B.generated.js']);
  rmSync(a, { recursive: true }); rmSync(b, { recursive: true });
});

test('a stale file, a missing one and an orphan are each named', () => {
  const committed = tree({ 'A.generated.js': 'old', 'Gone.generated.js': 'z' });
  const fresh = tree({ 'A.generated.js': 'new', 'B.generated.js': 'y' });
  const problems = drift(committed, fresh);
  assert.ok(problems.some((p) => p.startsWith('A.generated.js: stale')), problems.join('\n'));
  assert.ok(problems.some((p) => p.startsWith('B.generated.js: missing')), problems.join('\n'));
  assert.ok(problems.some((p) => p.startsWith('Gone.generated.js: orphaned')), problems.join('\n'));
  rmSync(committed, { recursive: true }); rmSync(fresh, { recursive: true });
});

test('a build that wrote nothing is a failure, not an empty kit', () => {
  assert.equal(zeroKitProblems(0).length, 1);
  assert.match(zeroKitProblems(0)[0], /nothing in it/);
  assert.deepEqual(zeroKitProblems(1), []);
});

test('the skip is a skip only where a skip is honest, and never under CI', () => {
  assert.equal(skipExitCode({}), 2);
  assert.equal(skipExitCode({ CI: 'true' }), 1);
  assert.equal(skipExitCode({ ARENA_CHECK_STRICT: '1' }), 1);
});
