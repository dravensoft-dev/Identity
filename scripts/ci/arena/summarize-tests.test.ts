import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  EXPECTED_ROOTS, coverageProblems, parseJunit, renderSummary, stepsWithJunit, suiteDomains, tally,
} from './summarize-tests.ts';
import { testStep } from '../../check/arena/check-all.mjs';
import { DOMAINS } from '../../lib/arena/domains.mjs';

const AUTHORITY = testStep({ isBun: true, testFiles: [] });

test('the invocation comes from testStep and gains the two junit flags, nothing else', () => {
  const steps = stepsWithJunit('out');
  assert.equal(steps.length, AUTHORITY.length);

  assert.deepEqual(steps[0].args, AUTHORITY[0].args, 'the Angular emit step is not a test run and is untouched');
  assert.equal(steps[0].outfile, undefined);

  for (const i of [1, 2]) {
    assert.deepEqual(
      steps[i].args,
      [...AUTHORITY[i].args, '--reporter=junit', `--reporter-outfile=out/suite-${i}.xml`],
      `step ${i} was rebuilt rather than extended`,
    );
    assert.equal(steps[i].outfile, `out/suite-${i}.xml`);
  }
});

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="bun test" tests="4">
  <testsuite name="scripts/lib/arena/domains.test.mjs" file="scripts/lib/arena/domains.test.mjs" tests="3">
    <testcase name="passes" classname="" file="scripts/lib/arena/domains.test.mjs" line="1" />
    <testcase name="fails" classname="" file="scripts/lib/arena/domains.test.mjs" line="2">
      <failure type="AssertionError" />
    </testcase>
    <testcase name="skipped" classname="" file="scripts/lib/arena/domains.test.mjs" line="3">
      <skipped />
    </testcase>
  </testsuite>
  <testsuite name="frameworks/react/x.test.tsx" file="frameworks/react/x.test.tsx" tests="1">
    <testcase name="passes" classname="" file="frameworks/react/x.test.tsx" line="1" />
  </testsuite>
</testsuites>`;

test('a case is read as passed, failed or skipped by what it encloses', () => {
  const cases = parseJunit(XML);
  assert.equal(cases.length, 4);
  assert.deepEqual(cases.map((c) => c.status), ['pass', 'fail', 'skip', 'pass']);
});

test('a case with no file of its own falls back to the suite that holds it', () => {
  const cases = parseJunit(
    '<testsuites><testsuite name="a" file="scripts/check/core/a.test.mjs">'
    + '<testcase name="x" classname="" /></testsuite></testsuites>',
  );
  assert.deepEqual(cases, [{ file: 'scripts/check/core/a.test.mjs', status: 'pass' }]);
});

test('a report with no case at all parses to nothing rather than throwing', () => {
  assert.deepEqual(parseJunit('<testsuites name="bun test" tests="0" />'), []);
});

test('the tally counts per domain and keeps what it could not place', () => {
  const counted = tally([
    ...parseJunit(XML),
    { file: 'intro/overview.test.js', status: 'pass' },
  ]);
  assert.equal(counted.total, 5);
  assert.deepEqual(counted.byDomain.get('arena'), { pass: 1, fail: 1, skip: 1 });
  assert.deepEqual(counted.byDomain.get('react'), { pass: 1, fail: 0, skip: 0 });
  assert.deepEqual(counted.byDomain.get('angular'), { pass: 0, fail: 0, skip: 0 });
  assert.deepEqual(counted.unclassified, ['intro/overview.test.js']);
});

test('a domain that owns suites and reported nothing is a problem, not a zero', () => {
  const counted = tally(parseJunit(XML));
  const problems = coverageProblems(counted, ['arena', 'core'], []);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /domain core owns suites and reported 0 cases/);
});

test('a tree that contributed no case is named, so a narrowed run cannot pass as a full one', () => {
  const counted = tally(parseJunit(XML));
  const problems = coverageProblems(counted, [], EXPECTED_ROOTS);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /frameworks\/angular\/build\/test\//);
});

test('a complete report raises nothing', () => {
  const counted = tally([
    { file: 'scripts/lib/arena/a.test.mjs', status: 'pass' },
    { file: 'frameworks/react/b.test.tsx', status: 'pass' },
    { file: 'frameworks/angular/build/test/c.test.js', status: 'pass' },
  ]);
  assert.deepEqual(coverageProblems(counted, ['arena', 'react', 'angular']), []);
});

test('the summary names every domain and totals them', () => {
  const summary = renderSummary(tally(parseJunit(XML)));
  for (const domain of DOMAINS) assert.match(summary, new RegExp(`\\| ${domain} \\|`), `${domain} is missing`);
  assert.match(summary, /\| \*\*total\*\* \| \*\*2\*\* \| \*\*1\*\* \| \*\*1\*\* \|/);
});

test('suiteDomains reads a domain off a suite in either extension, which is what expects its cases', () => {
  const root = mkdtempSync(join(tmpdir(), 'summarize-ext-'));
  try {
    mkdirSync(join(root, 'scripts', 'check', 'tailwind'), { recursive: true });
    mkdirSync(join(root, 'scripts', 'lib', 'core'), { recursive: true });
    writeFileSync(join(root, 'scripts', 'check', 'tailwind', 'a.test.mjs'), '// suite');
    writeFileSync(join(root, 'scripts', 'lib', 'core', 'b.test.ts'), '// suite');
    writeFileSync(join(root, 'scripts', 'lib', 'core', 'c.ts'), '// not a suite');
    assert.deepEqual(suiteDomains(join(root, 'scripts')), ['core', 'tailwind']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a domain whose suites are all .ts still expects its cases, so the reporter cannot drop them unnoticed', () => {
  const root = mkdtempSync(join(tmpdir(), 'summarize-ts-'));
  try {
    mkdirSync(join(root, 'scripts', 'check', 'react'), { recursive: true });
    writeFileSync(join(root, 'scripts', 'check', 'react', 'only.test.ts'), '// suite');
    const expected = suiteDomains(join(root, 'scripts'));
    assert.deepEqual(expected, ['react']);
    const counted = tally([]);
    assert.equal(coverageProblems(counted, expected, []).length, 1,
      'react owns a suite and reported nothing, and that has to be a problem rather than a clean run');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
