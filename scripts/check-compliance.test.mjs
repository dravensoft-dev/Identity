/* Tests check:compliance's pure half. The gate's scan is behind an
 * `import.meta.url` guard so importing it here does not run it — an unguarded
 * process.exit(1) has killed a test process in this repo twice. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { COVERED, SUITE_DIRS, suiteMentions, validateCoverage, inventoryFrom, walkSuites, collectSuites } from './check-compliance.mjs';

test('validateCoverage is clean when a composite key names the layer its suite verifies', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'assertPattern for Dialog.behaviour.json' },
  });
  assert.deepEqual(problems, []);
});

test('validateCoverage fails a COVERED entry naming a binding that no longer exists', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx', 'Ghost:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Ghost/);
  assert.match(problems[0], /no binding/i);
});

test('validateCoverage fails a COVERED entry whose suite never mentions the component', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'assertPattern for Menu.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /never mentions/i);
});

test('validateCoverage fails a COVERED entry naming a suite file that does not exist', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:react': 'gone.test.jsx' },
    suites: {},
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /gone\.test\.jsx/);
});

test('validateCoverage says nothing about an uncovered binding', () => {
  // Coverage is incomplete on purpose and grows one component at a time. The gate
  // guards the record's accuracy, never demands totality — a gate that demanded
  // 47 suites on day one would have been switched off.
  const problems = validateCoverage({
    bindings: [
      { name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', stem: 'Dialog' },
      { name: 'Table', patterns: ['grid'], layer: 'react', stem: 'Table' },
    ],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.deepEqual(problems, []);
});

test('suiteMentions matches a binding filename in a suite body', () => {
  assert.equal(suiteMentions("join(X, 'feedback/Dialog.behaviour.json')", 'Dialog'), true);
  assert.equal(suiteMentions("join(X, 'feedback/Dialog.behaviour.json')", 'Menu'), false);
});

/* A binding record carries the file STEM it was read from, and that -- never the
 * component name -- is what the suite text is searched for. The Angular layer is
 * why: until the structure refactor's batch 2 its binding file was named for its
 * kebab-case directory rather than for the Pascal-case React counterpart the
 * binding's own `component` field carries, so `bar-chart/bar-chart.behaviour.json`
 * declared component "BarChart", and a mention check keyed on the component name
 * would never have fired for an Angular suite -- a cross-layer check that silently
 * never fires looks exactly like coverage. Both layers spell the stem Pascal today,
 * so no live binding exercises the difference; the input below is synthetic on
 * purpose, because nothing HOLDS the two equal and a stem is filesystem
 * information this function must never derive. */
test('a binding whose file stem differs from its component name is matched on the stem', () => {
  const clean = validateCoverage({
    bindings: [{ name: 'BarChart', patterns: ['figure-with-data-table'], layer: 'angular', stem: 'bar-chart' }],
    covered: { 'BarChart:angular': 'chart-data-table.test.ts' },
    suites: { 'chart-data-table.test.ts': "join(P, 'bar-chart/bar-chart.behaviour.json')" },
  });
  assert.deepEqual(clean, []);

  const stale = validateCoverage({
    bindings: [{ name: 'BarChart', patterns: ['figure-with-data-table'], layer: 'angular', stem: 'bar-chart' }],
    covered: { 'BarChart:angular': 'chart-data-table.test.ts' },
    suites: { 'chart-data-table.test.ts': 'nothing relevant here' },
  });
  assert.equal(stale.length, 1);
  assert.match(stale[0], /bar-chart\.behaviour\.json/);
});

/* The fix itself: a composite key resolves ONE layer's binding, never the
 * sibling layer's -- the defect the bare-name key had, where a mention of
 * EITHER layer's stem satisfied the claim regardless of which layer the key
 * named. */
test('a composite key is verified only by its own layer, never the sibling layer', () => {
  const bindings = [
    { name: 'ConfirmDialog', patterns: ['dialog-modal'], layer: 'react', stem: 'ConfirmDialog' },
    { name: 'ConfirmDialog', patterns: ['dialog-modal'], layer: 'angular', stem: 'confirm-dialog' },
  ];
  // The React suite mentions the React stem -> the react claim holds.
  assert.deepEqual(
    validateCoverage({ bindings, covered: { 'ConfirmDialog:react': 's.test.jsx' },
      suites: { 's.test.jsx': "join(P, 'feedback/ConfirmDialog.behaviour.json')" } }),
    [],
  );
  // The SAME suite does NOT satisfy an angular claim -- it never mentions confirm-dialog.behaviour.json.
  const stale = validateCoverage({ bindings, covered: { 'ConfirmDialog:angular': 's.test.jsx' },
    suites: { 's.test.jsx': "join(P, 'feedback/ConfirmDialog.behaviour.json')" } });
  assert.equal(stale.length, 1);
  assert.match(stale[0], /confirm-dialog\.behaviour\.json/);
});

test('a composite key naming a layer the component is not bound in fails', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:angular': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /angular/);
});

test('a COVERED key without a :layer suffix is rejected -- the shape is mandatory', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', stem: 'Dialog' }],
    covered: { Dialog: 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /:layer|composite|<component>:<layer>/i);
});

/* The inventory is one row per BINDING, never one per case. COVERED is keyed
   <component>:<layer>, and a component is covered only when every one of its
   cases is, which the wrapper enforces -- there is deliberately no way to
   record half a component. */
test('a cased binding contributes exactly one inventory row', () => {
  const rows = inventoryFrom({
    'Alert:react': {
      cases: [
        { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
        { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
      ],
    },
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].patterns, ['alert', 'status']);
});

test('every COVERED entry names a real suite file and a real binding', () => {
  // The live record, checked against the live tree. This is the test that turns
  // COVERED from documentation into an invariant. SUITE_DIRS is walked rather than
  // flat-joined -- the Angular half is a component tree, and a suite named by
  // COVERED can sit several directories deep.
  assert.ok(Object.keys(COVERED).length > 0, 'COVERED should not be empty');
  const here = dirname(fileURLToPath(import.meta.url));
  const suites = collectSuites();
  for (const [key, suiteFile] of Object.entries(COVERED)) {
    assert.ok(suiteFile in suites, `COVERED["${key}"] names ${suiteFile}, which is in no suite directory`);
    assert.ok(suites[suiteFile].includes('.behaviour.json'), `${suiteFile} reads no binding`);
  }
  assert.ok(here.endsWith('scripts'));
});

/* walkSuites() must recurse -- the Angular half of SUITE_DIRS is now a component
 * tree (components/<category>/<component>/<Name>.<facet>.test.ts), not a flat
 * directory, so a suite two or three levels deep must still be found. */
test('walkSuites finds a suite nested several directories deep', () => {
  const root = mkdtempSync(join(tmpdir(), 'walk-suites-'));
  try {
    mkdirSync(join(root, 'a', 'b'), { recursive: true });
    writeFileSync(join(root, 'a', 'b', 'Thing.facet.test.ts'), '// suite');
    writeFileSync(join(root, 'not-a-suite.ts'), '// not collected');
    const found = walkSuites(root);
    assert.deepEqual(found, [join(root, 'a', 'b', 'Thing.facet.test.ts')]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* The assertion Step 6 adds: in a nested tree two suites CAN share a basename,
 * where a flat directory never could, and the old code had no assertion because
 * it never needed one -- it would have let the second file silently overwrite
 * the first in the basename-keyed map, which is exactly the shape COVERED's own
 * `suiteMentions` lookup depends on being unambiguous. This test fails if that
 * assertion is ever deleted: deletion-simulated by hand (removing the `if
 * (seen.has(name)) throw ...` block from collectSuites() and re-running this
 * file) turns this test from a pass -- it caught the thrown error and asserted
 * on its message -- into a failure, because `assert.throws` then finds nothing
 * thrown and reports "Missing expected exception". */
test('collectSuites throws on a basename collision across two suite directories', () => {
  const dirA = mkdtempSync(join(tmpdir(), 'suites-a-'));
  const dirB = mkdtempSync(join(tmpdir(), 'suites-b-'));
  try {
    mkdirSync(join(dirA, 'nested'), { recursive: true });
    mkdirSync(join(dirB, 'nested'), { recursive: true });
    writeFileSync(join(dirA, 'nested', 'Dup.facet.test.ts'), '// first');
    writeFileSync(join(dirB, 'nested', 'Dup.facet.test.ts'), '// second');
    assert.throws(
      () => collectSuites([dirA, dirB]),
      /two suites share the basename Dup\.facet\.test\.ts/,
    );
  } finally {
    rmSync(dirA, { recursive: true, force: true });
    rmSync(dirB, { recursive: true, force: true });
  }
});
