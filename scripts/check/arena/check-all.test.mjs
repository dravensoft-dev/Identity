import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import { testStep, summarize, stepStatus, GATES, DOMAINS, testFilesUnder } from './check-all.mjs';

test('GATES lists every check gate', () => {
  assert.equal(GATES.length, 34);
  assert.deepEqual(
    GATES.map((g) => g.name),
    ['check:docs', 'check:generated', 'check:dtcg', 'check:tokens', 'check:script-tokens', 'check:duplicate-constants', 'check:ramp', 'check:text-contrast', 'check:tailwind', 'check:tailwind-generated', 'check:coverage', 'check:surface-parity', 'check:radius', 'check:arbitrary', 'check:dimensions', 'check:states', 'check:layer-independence', 'check:structure', 'check:contracts', 'check:behaviour', 'check:compliance', 'check:api', 'check:fonts', 'check:vendor', 'check:demos', 'check:react-barrel', 'check:react-types', 'check:cards', 'check:focus-trap', 'check:packages', 'check:angular', 'check:angular-demos', 'check:assertions', 'check:cdk'],
  );
});

test('every gate in the array is also an npm script -- a gate a reader cannot invoke by name is the shape check:text-contrast shipped in', () => {
  const scripts = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).scripts;
  for (const { name } of GATES) {
    assert.ok(name in scripts, `${name} is in the gate array and not in package.json, so \`bun run ${name}\` answers "Script not found"`);
  }
});

test('every gate sits in one of the five domains, so a new one cannot land outside the grid', () => {
  assert.deepEqual(DOMAINS, ['core', 'react', 'angular', 'tailwind', 'arena']);
  for (const { name, file } of GATES) {
    const [domain, ...tail] = file.split('/');
    assert.ok(DOMAINS.includes(domain), `${name} names the domain ${domain}, which is not one of the five`);
    assert.equal(tail.length, 1, `${name} points at ${file}, which is not <domain>/<gate>.mjs`);
  }
});

test('testFilesUnder finds a suite nested several directories deep, which a flat read would miss', () => {
  const root = mkdtempSync(join(tmpdir(), 'check-all-'));
  try {
    mkdirSync(join(root, 'check', 'angular'), { recursive: true });
    writeFileSync(join(root, 'check', 'angular', 'a.test.mjs'), '// suite');
    writeFileSync(join(root, 'check', 'angular', 'a.mjs'), '// not a suite');
    writeFileSync(join(root, 'serve.mjs'), '// not a suite');
    assert.deepEqual(testFilesUnder(root), [join(root, 'check', 'angular', 'a.test.mjs')]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the four Angular-layer gates run last -- the compile gate, the demo pages, the assertion shape, then the one dependency bridge left', () => {
  assert.deepEqual(
    GATES.slice(-4).map((g) => g.name),
    ['check:angular', 'check:angular-demos', 'check:assertions', 'check:cdk'],
  );
});

test('testStep runs every suite under bun, with the DOM harness isolated in its own process', () => {

  const steps = testStep({ isBun: true, testFiles: ['a.test.mjs', 'b.test.mjs'] });
  assert.deepEqual(steps.map((s) => s.args), [
    ['run', 'build:angular-tests'],
    ['test', 'scripts', 'frameworks/react', 'build/angular-test/angular',
     '--path-ignore-patterns=**/*.dom.test.*'],
    ['test', '--preload', './frameworks/react/test/Preload.js', '.dom.test.'],
  ]);
});

test('testStep runs `node --test` over the discovered files under node', () => {
  const steps = testStep({ isBun: false, testFiles: ['/repo/scripts/a.test.mjs', '/repo/scripts/b.test.mjs'] });
  assert.deepEqual(steps.map((s) => s.args), [['--test', '/repo/scripts/a.test.mjs', '/repo/scripts/b.test.mjs']]);
});

test('stepStatus maps exit 2 to a skip, and everything else to pass or fail', () => {
  assert.equal(stepStatus(0), 'pass');
  assert.equal(stepStatus(1), 'fail');
  assert.equal(stepStatus(2), 'skip');
  assert.equal(stepStatus(null), 'fail');
});

test('summarize lists every step and reports overall success', () => {
  const out = summarize([{ name: 'a', status: 'pass' }, { name: 'b', status: 'pass' }]);
  assert.match(out, /PASS {2}a/);
  assert.match(out, /PASS {2}b/);
  assert.match(out, /all 2 step\(s\) passed/);
});

test('summarize reports which steps failed', () => {
  const out = summarize([{ name: 'a', status: 'pass' }, { name: 'b', status: 'fail' }]);
  assert.match(out, /FAIL {2}b/);
  assert.match(out, /1\/2 step\(s\) failed/);
});

test('a skipped step is never a green run — the summary says INCOMPLETE', () => {
  const out = summarize([{ name: 'a', status: 'pass' }, { name: 'check:cards', status: 'skip' }]);
  assert.match(out, /SKIP {2}check:cards/);
  assert.match(out, /INCOMPLETE/);
  assert.doesNotMatch(out, /all 2 step\(s\) passed/);
});

test('a failure outranks a skip in the tail', () => {
  const out = summarize([{ name: 'a', status: 'fail' }, { name: 'b', status: 'skip' }]);
  assert.match(out, /1\/2 step\(s\) failed/);
});
