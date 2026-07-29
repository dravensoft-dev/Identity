import { test } from 'node:test';
import assert from 'node:assert/strict';
import { missingEmitProblems } from './build-angular-tests.mjs';

/* This is the guard fix round 2 added after DataVisuals.test.ts shipped in the
 * source tree, compiled into nothing (tsconfig.test.json's include never
 * reached a layer-root .ts), and reported "312 pass / 32 files" as if that
 * were a clean run rather than a suite silently absent from it. Exactly the
 * shape CLAUDE.md's Known debt opens with: a gate that finds nothing reports
 * zero violations either way. missingEmitProblems is the fix -- it decides
 * "compiled" by walking both trees and comparing, rather than trusting an
 * incremental, non-failing ngc run to mean every source file was reached. */

test('missingEmitProblems reports nothing when every source test has a matching emit', () => {
  const problems = missingEmitProblems(
    ['DataVisuals.test.ts', 'components/charts/bar-chart/BarChart.geometry.test.ts'],
    ['DataVisuals.test.js', 'components/charts/bar-chart/BarChart.geometry.test.js'],
  );
  assert.deepEqual(problems, []);
});

test('missingEmitProblems names a source test with no matching emit', () => {
  const problems = missingEmitProblems(
    ['DataVisuals.test.ts', 'components/charts/bar-chart/BarChart.geometry.test.ts'],
    ['components/charts/bar-chart/BarChart.geometry.test.js'],
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /DataVisuals\.test\.ts/);
  assert.match(problems[0], /never runs/);
});

test('missingEmitProblems reports one problem per missing suite, not one for the whole run', () => {
  const problems = missingEmitProblems(
    ['A.test.ts', 'B.test.ts', 'C.test.ts'],
    ['C.test.js'],
  );
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => p.includes('A.test.ts')));
  assert.ok(problems.some((p) => p.includes('B.test.ts')));
});

test('missingEmitProblems is empty for two empty lists -- no source tests is not the failure this guards', () => {
  assert.deepEqual(missingEmitProblems([], []), []);
});

test('an extra emitted file with no source is not this function\'s problem -- pruneOrphans owns that direction', () => {
  const problems = missingEmitProblems(
    ['A.test.ts'],
    ['A.test.js', 'Orphan.test.js'],
  );
  assert.deepEqual(problems, []);
});
