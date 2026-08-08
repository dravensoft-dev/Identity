import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBuildArgs, summarize } from './run-build.ts';

test('the runner takes two flags and refuses anything else', () => {
  assert.deepEqual(parseBuildArgs([]), { force: false, obey: false });
  assert.deepEqual(parseBuildArgs(['--force']), { force: true, obey: false });
  assert.deepEqual(parseBuildArgs(['--obey']), { force: false, obey: true });
  assert.throws(() => parseBuildArgs(['--forse']), /unrecognised argument/);
});

test('the two flags ask for opposite things, so asking for both is refused rather than ranked', () => {
  assert.throws(() => parseBuildArgs(['--force', '--obey']), /opposite things/);
});

test('the tail never collapses the count, so a cheap run cannot read as a whole one', () => {
  const out = summarize(
    [{ name: 'generate:tokens', status: 'pass' }, { name: 'build:tailwind', status: 'cached' }],
    1, 1, true,
  );
  assert.match(out, /all 2 step\(s\) passed, 1 ran, 1 came from the cache/);
  assert.match(out, /^ {2}PASS {2}generate:tokens$/m);
  assert.match(out, /^ {2}CACHED {2}build:tailwind$/m);
});

test('a measured run says would have, because it kept nothing', () => {
  const out = summarize([{ name: 'a', status: 'pass' }], 1, 0, false);
  assert.match(out, /1 ran, 0 would have come from the cache/,
    'a run that kept nothing and a run that kept everything must not read the same way');
});

test('a failure is counted against the steps that were reached, not against the graph', () => {
  const out = summarize([{ name: 'a', status: 'pass' }, { name: 'b', status: 'fail' }], 2, 0, false);
  assert.match(out, /1\/2 step\(s\) failed/,
    'the run stops at the first failure, so the denominator is what it got to and the tail says so');
});
