import { test } from 'node:test';
import assert from 'node:assert/strict';
import { missingEmitProblems } from './build-angular-tests.mjs';

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
