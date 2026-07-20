import test from 'node:test';
import assert from 'node:assert/strict';
import { testStep, summarize, stepStatus, GATES } from './check-all.mjs';

test('GATES lists the eleven check gates', () => {
  assert.equal(GATES.length, 11);
  assert.deepEqual(
    GATES.map((g) => g.name),
    ['check:dtcg', 'check:tokens', 'check:ramp', 'check:tailwind', 'check:tailwind-generated', 'check:coverage', 'check:arbitrary', 'check:dimensions', 'check:fonts', 'check:cards', 'check:angular'],
  );
});

test('check:angular runs last, after check:cards, which is still the one that costs minutes', () => {
  assert.equal(GATES.at(-1).name, 'check:angular');
});

test('testStep runs every suite under bun', () => {
  const step = testStep({ isBun: true, testFiles: ['a.test.mjs', 'b.test.mjs'] });
  assert.deepEqual(step.args, ['test', 'scripts', 'frameworks/react/test', 'frameworks/angular/test']);
});

test('testStep runs `node --test` over the discovered files under node', () => {
  const step = testStep({ isBun: false, testFiles: ['/repo/scripts/a.test.mjs', '/repo/scripts/b.test.mjs'] });
  assert.deepEqual(step.args, ['--test', '/repo/scripts/a.test.mjs', '/repo/scripts/b.test.mjs']);
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
