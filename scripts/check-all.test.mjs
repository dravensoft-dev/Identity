import test from 'node:test';
import assert from 'node:assert/strict';
import { testStep, summarize, GATES } from './check-all.mjs';

test('GATES lists the six check gates', () => {
  assert.equal(GATES.length, 6);
  assert.deepEqual(
    GATES.map((g) => g.name),
    ['check:dtcg', 'check:tokens', 'check:ramp', 'check:tailwind', 'check:coverage', 'check:arbitrary'],
  );
});

test('testStep runs `bun test` under bun', () => {
  const step = testStep({ isBun: true, testFiles: ['a.test.mjs', 'b.test.mjs'] });
  assert.deepEqual(step.args, ['test', 'scripts']);
});

test('testStep runs `node --test` over the discovered files under node', () => {
  const step = testStep({ isBun: false, testFiles: ['/repo/scripts/a.test.mjs', '/repo/scripts/b.test.mjs'] });
  assert.deepEqual(step.args, ['--test', '/repo/scripts/a.test.mjs', '/repo/scripts/b.test.mjs']);
});

test('summarize lists every step and reports overall success', () => {
  const out = summarize([{ name: 'a', passed: true }, { name: 'b', passed: true }]);
  assert.match(out, /PASS {2}a/);
  assert.match(out, /PASS {2}b/);
  assert.match(out, /all 2 step\(s\) passed/);
});

test('summarize reports which steps failed', () => {
  const out = summarize([{ name: 'a', passed: true }, { name: 'b', passed: false }]);
  assert.match(out, /PASS {2}a/);
  assert.match(out, /FAIL {2}b/);
  assert.match(out, /1\/2 step\(s\) failed/);
});
