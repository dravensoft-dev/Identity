import test from 'node:test';
import assert from 'node:assert/strict';
import { isBuildStep, parseBuildArgs, partialRunProblems, summarize } from './run-build.ts';

test('the runner takes two flags and refuses anything else', () => {
  assert.deepEqual(parseBuildArgs([]), { force: false, assertFull: false });
  assert.deepEqual(parseBuildArgs(['--force']), { force: true, assertFull: false });
  assert.deepEqual(parseBuildArgs(['--force', '--assert-full']), { force: true, assertFull: true });
  assert.throws(() => parseBuildArgs(['--forse']), /unrecognised argument/);
});

test('the tail never collapses the count, so a cheap run cannot read as a whole one', () => {
  const out = summarize(
    [{ name: 'generate:tokens', status: 'pass' }, { name: 'build:tailwind', status: 'cached' }],
    1, 1,
  );
  assert.match(out, /all 2 step\(s\) passed, 1 ran, 1 came from the cache/);
  assert.match(out, /^ {2}PASS {2}generate:tokens$/m);
  assert.match(out, /^ {2}CACHED {2}build:tailwind$/m);
});

test('a failure is counted against the steps that were reached, not against the graph', () => {
  const out = summarize([{ name: 'a', status: 'pass' }, { name: 'b', status: 'fail' }], 2, 0);
  assert.match(out, /1\/2 step\(s\) failed/,
    'the run stops at the first failure, so the denominator is what it got to and the tail says so');
});

test('a run asked to be a full one fails if it kept anything, and names what it kept', () => {
  assert.deepEqual(partialRunProblems([{ name: 'a', status: 'pass' }]), []);
  assert.deepEqual(partialRunProblems([{ name: 'a', status: 'pass' }, { name: 'b', status: 'cached' }]), [
    '1 step(s) came from the cache and this run was asked to be a full one: b. A build that skipped '
    + 'is a build whose idempotence nobody proved.',
  ]);
});

test('the guard is what keeps a workflow from proving idempotence over a build that did nothing', () => {
  const kept = [{ name: 'generate:tokens', status: 'cached' }, { name: 'build:tailwind', status: 'cached' }];
  assert.equal(partialRunProblems(kept).length, 1,
    'CI restores no graph state today, so this passes trivially; it is the guard for the day '
    + 'somebody adds .cache to the paths actions/cache restores, which would turn the whole gate '
    + 'from a full run into an incremental one in silence');
});

test('a build runs what build/ and generate/ declared, and never a gate', () => {
  const declaredIn = new Map([
    ['generate:tokens', 'scripts/generate/arena/generate-tokens.ts'],
    ['build:tailwind', 'scripts/build/tailwind/build-tailwind.ts'],
    ['check:dtcg', 'scripts/check/core/check-dtcg.ts'],
  ]);
  assert.equal(isBuildStep(declaredIn, 'generate:tokens'), true);
  assert.equal(isBuildStep(declaredIn, 'build:tailwind'), true);
  assert.equal(isBuildStep(declaredIn, 'check:dtcg'), false,
    'every node is in one graph, and the phase that declared a node is what says whether a build '
    + 'is the thing that runs it. Without this, subscribing a gate quietly adds it to bun run build');
  assert.equal(isBuildStep(declaredIn, 'check:nothing'), false);
});
