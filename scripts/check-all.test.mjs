import test from 'node:test';
import assert from 'node:assert/strict';
import { testStep, summarize, stepStatus, GATES } from './check-all.mjs';

test('GATES lists the twenty-four check gates', () => {
  assert.equal(GATES.length, 24);
  assert.deepEqual(
    GATES.map((g) => g.name),
    ['check:docs', 'check:dtcg', 'check:tokens', 'check:script-tokens', 'check:duplicate-constants', 'check:ramp', 'check:tailwind', 'check:tailwind-generated', 'check:coverage', 'check:radius', 'check:arbitrary', 'check:dimensions', 'check:states', 'check:structure', 'check:behaviour', 'check:compliance', 'check:api', 'check:fonts', 'check:vendor', 'check:demos', 'check:cards', 'check:angular', 'check:material', 'check:cdk'],
  );
});

test('the three Angular-layer gates run last -- the compile gate, then the two dependency bridges', () => {
  assert.deepEqual(GATES.slice(-3).map((g) => g.name), ['check:angular', 'check:material', 'check:cdk']);
});

test('testStep runs every suite under bun, with the DOM harness isolated in its own process', () => {

  const steps = testStep({ isBun: true, testFiles: ['a.test.mjs', 'b.test.mjs'] });
  assert.deepEqual(steps.map((s) => s.args), [
    ['run', 'build:angular-tests'],
    ['test', 'scripts', 'frameworks/react', 'build/angular-test/angular',
     '--path-ignore-patterns=**/*.dom.test.jsx'],
    ['test', '--preload', './frameworks/react/test/Preload.js', '.dom.test.jsx'],
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
