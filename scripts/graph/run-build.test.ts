import test from 'node:test';
import assert from 'node:assert/strict';
import { isBuildStep, parseBuildArgs, partialRunProblems, summarize } from './run-build.ts';

test('the runner takes three flags and refuses anything else', () => {
  assert.deepEqual(parseBuildArgs([]), { force: false, assertFull: false, assemble: false });
  assert.deepEqual(parseBuildArgs(['--force']), { force: true, assertFull: false, assemble: false });
  assert.deepEqual(parseBuildArgs(['--assemble', '--force', '--assert-full']),
    { force: true, assertFull: true, assemble: true });
  assert.throws(() => parseBuildArgs(['--forse']), /unrecognised argument/);
});

test('the three flags are what tells the three commands apart', () => {
  assert.deepEqual(parseBuildArgs(['--assemble']), { force: false, assertFull: false, assemble: true },
    'bun run build:packages assembles and still keeps what has not moved, for iterating on packaging');
  assert.deepEqual(parseBuildArgs([]), { force: false, assertFull: false, assemble: false },
    'bun run build is the loop, and leaves out what only a release ships');
  assert.deepEqual(parseBuildArgs(['--assemble', '--force', '--assert-full']),
    { force: true, assertFull: true, assemble: true },
    'bun run build:release is every step, run, with a kept step failing the run on its own');
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
  assert.equal(isBuildStep(declaredIn, { name: 'generate:tokens' }), true);
  assert.equal(isBuildStep(declaredIn, { name: 'build:tailwind' }), true);
  assert.equal(isBuildStep(declaredIn, { name: 'check:dtcg' }), false,
    'every node is in one graph, and the phase that declared a node is what says whether a build '
    + 'is the thing that runs it. Without this, subscribing a gate quietly adds it to bun run build');
  assert.equal(isBuildStep(declaredIn, { name: 'check:nothing' }), false);
});

test('a step that says it is release-only stays out of the development build', () => {
  const declaredIn = new Map([['build:react-package', 'scripts/build/react/build-react-package.ts']]);
  assert.equal(isBuildStep(declaredIn, { name: 'build:react-package' }), true,
    'it is under build/, so the phase alone would put it in');
  assert.equal(isBuildStep(declaredIn, { name: 'build:react-package', releaseOnly: 'a reason' }), false,
    'the phase says what a script is; only the node can say that a development loop should not pay '
    + 'for it, so the node says it and carries the why');
});

test('a blocked step is neither a pass nor a failure, and the tail counts it apart', () => {
  const out = summarize([
    { name: 'build:vendor', status: 'pass' },
    { name: 'generate:tokens', status: 'fail' },
    { name: 'build:tailwind', status: 'blocked' },
  ], 2, 0);
  assert.match(out, /^ {2}BLOCKED {2}build:tailwind$/m);
  assert.match(out, /1\/3 step\(s\) failed, 2 ran, 0 came from the cache, 1 did not run because an upstream failed/,
    'a step that never ran is not a step that passed, and a reader has to be able to tell which of '
    + 'the two the tail is reporting');
});

test('a run with nothing blocked says nothing about blocking', () => {
  assert.doesNotMatch(summarize([{ name: 'a', status: 'pass' }], 1, 0), /upstream/);
});

test('a step the suites run is out of every build invocation, assembly included', () => {
  const declaredIn = new Map([['build:angular-tests', 'scripts/build/angular/build-angular-tests.ts']]);
  const node = { name: 'build:angular-tests', runsBeforeSuites: 'a reason' };
  assert.equal(isBuildStep(declaredIn, node), false);
  assert.equal(isBuildStep(declaredIn, node, true), false,
    '--assemble includes what a release ships, and the Angular test emit is not that: bun run test '
    + 'and check-all run it immediately before the suites that read it');
  assert.equal(isBuildStep(declaredIn, { name: 'build:angular-tests' }), true,
    'without the field the phase alone would put it in, which is what it did before');
});
