import test from 'node:test';
import assert from 'node:assert/strict';
import { testStep, summarize, stepStatus, GATES } from './check-all.mjs';

test('GATES lists the twenty check gates', () => {
  assert.equal(GATES.length, 20);
  assert.deepEqual(
    GATES.map((g) => g.name),
    ['check:dtcg', 'check:tokens', 'check:script-tokens', 'check:duplicate-constants', 'check:ramp', 'check:tailwind', 'check:tailwind-generated', 'check:coverage', 'check:radius', 'check:arbitrary', 'check:dimensions', 'check:states', 'check:behaviour', 'check:compliance', 'check:fonts', 'check:vendor', 'check:demos', 'check:cards', 'check:angular', 'check:material'],
  );
});

test('check:material runs last, after check:angular, the other Angular-layer gate', () => {
  assert.equal(GATES.at(-1).name, 'check:material');
});

test('testStep runs every suite under bun, with the DOM harness isolated in its own process', () => {
  // Not one merged invocation: `bun test` shares a process (and a globalThis)
  // across every file a single call matches, and frameworks/react/test-dom's
  // harness registers happy-dom without ever unregistering it -- fine alone,
  // fatal combined with frameworks/angular/test, whose own files register it
  // too. Two steps is what keeps that combination from ever happening.
  const steps = testStep({ isBun: true, testFiles: ['a.test.mjs', 'b.test.mjs'] });
  assert.deepEqual(steps.map((s) => s.args), [
    ['test', 'scripts', 'frameworks/react/test/', 'frameworks/angular/test'],
    ['test', 'frameworks/react/test-dom'],
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
  assert.equal(stepStatus(null), 'fail'); // spawn failure
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
