import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE, problemsFrom } from './check-style-parity.ts';

test('a pass that mounted nothing is a failure rather than a silent pass', () => {
  assert.deepEqual(problemsFrom({ compared: 0, mismatches: [] }, 'at rest'),
    ['at rest: the page mounted no case at all, so this run proves nothing']);
  assert.deepEqual(problemsFrom({ compared: 4, mismatches: [] }, 'at rest'), []);
});

test('a mismatch names the case and the properties that differ', () => {
  const problems = problemsFrom(
    { compared: 4, mismatches: [{ id: 'ArenaSwitch|icon|size=md', differing: ['line-height: 16.5px vs 11px'] }] },
    'under reduced motion',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0] ?? '', /ArenaSwitch\|icon\|size=md/);
  assert.match(problems[0] ?? '', /line-height: 16\.5px vs 11px/);
});

test('the gate reads the page and does not write it', () => {
  assert.match(PAGE, /\.generated\.html$/,
    'the page is an artifact, so build:style-parity-page emits it and this gate measures it. A gate '
    + 'that wrote its own subject would be an artifact another gate reads, and one gate could then '
    + 'stop another from reporting');
});
