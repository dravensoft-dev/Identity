/* Tests check:compliance's pure half. The gate's scan is behind an
 * `import.meta.url` guard so importing it here does not run it — an unguarded
 * process.exit(1) has killed a test process in this repo twice. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { COVERED, SUITE_DIRS, suiteMentions, validateCoverage } from './check-compliance.mjs';

test('validateCoverage is clean when a composite key names the layer its suite verifies', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal', layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'assertPattern for Dialog.behaviour.json' },
  });
  assert.deepEqual(problems, []);
});

test('validateCoverage fails a COVERED entry naming a binding that no longer exists', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal', layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx', 'Ghost:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Ghost/);
  assert.match(problems[0], /no binding/i);
});

test('validateCoverage fails a COVERED entry whose suite never mentions the component', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal', layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'assertPattern for Menu.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /never mentions/i);
});

test('validateCoverage fails a COVERED entry naming a suite file that does not exist', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal', layer: 'react', stem: 'Dialog' }],
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
      { name: 'Dialog', pattern: 'dialog-modal', layer: 'react', stem: 'Dialog' },
      { name: 'Table', pattern: 'grid', layer: 'react', stem: 'Table' },
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

/* The Angular layer's binding file is named for its kebab-case directory, not for
 * the Pascal-case React counterpart the binding's own `component` field carries --
 * `bar-chart/bar-chart.behaviour.json` declares component "BarChart". A mention
 * check keyed on the component name alone would therefore never fire for an
 * Angular suite, and a cross-layer check that silently never fires looks exactly
 * like coverage. So a binding record carries the file STEM it is read from, and
 * that is what the suite text is searched for. */
test('a binding whose file stem differs from its component name is matched on the stem', () => {
  const clean = validateCoverage({
    bindings: [{ name: 'BarChart', pattern: 'figure-with-data-table', layer: 'angular', stem: 'bar-chart' }],
    covered: { 'BarChart:angular': 'chart-data-table.test.ts' },
    suites: { 'chart-data-table.test.ts': "join(P, 'bar-chart/bar-chart.behaviour.json')" },
  });
  assert.deepEqual(clean, []);

  const stale = validateCoverage({
    bindings: [{ name: 'BarChart', pattern: 'figure-with-data-table', layer: 'angular', stem: 'bar-chart' }],
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
    { name: 'ConfirmDialog', pattern: 'dialog-modal', layer: 'react', stem: 'ConfirmDialog' },
    { name: 'ConfirmDialog', pattern: 'dialog-modal', layer: 'angular', stem: 'confirm-dialog' },
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
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal', layer: 'react', stem: 'Dialog' }],
    covered: { 'Dialog:angular': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /angular/);
});

test('a COVERED key without a :layer suffix is rejected -- the shape is mandatory', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal', layer: 'react', stem: 'Dialog' }],
    covered: { Dialog: 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /:layer|composite|<component>:<layer>/i);
});

test('every COVERED entry names a real suite file and a real binding', () => {
  // The live record, checked against the live tree. This is the test that turns
  // COVERED from documentation into an invariant.
  assert.ok(Object.keys(COVERED).length > 0, 'COVERED should not be empty');
  const here = dirname(fileURLToPath(import.meta.url));
  for (const [key, suiteFile] of Object.entries(COVERED)) {
    const found = SUITE_DIRS.map((d) => join(d, suiteFile)).find((p) => existsSync(p));
    assert.ok(found, `COVERED["${key}"] names ${suiteFile}, which is in neither suite directory`);
    assert.ok(readFileSync(found, 'utf8').includes('.behaviour.json'), `${suiteFile} reads no binding`);
  }
  assert.ok(here.endsWith('scripts'));
});
