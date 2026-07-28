/* Tests check:compliance's pure half. The gate's scan is behind an
 * `import.meta.url` guard so importing it here does not run it — an unguarded
 * process.exit(1) has killed a test process in this repo twice. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { COVERED, suiteMentions, validateCoverage, inventoryFrom, walkSuites, collectSuites } from './check-compliance.mjs';

test('validateCoverage is clean when a composite key names the layer its suite verifies', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': "assertPattern for join(R, 'feedback/Dialog.behaviour.json')" },
  });
  assert.deepEqual(problems, []);
});

test('validateCoverage fails a COVERED entry naming a binding that no longer exists', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx', 'Ghost:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'feedback/Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Ghost/);
  assert.match(problems[0], /no binding/i);
});

test('validateCoverage fails a COVERED entry whose suite never mentions the component', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'assertPattern for Menu.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /never names/i);
});

test('validateCoverage fails a COVERED entry naming a suite file that does not exist', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/Dialog.behaviour.json' }],
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
      { name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/Dialog.behaviour.json' },
      { name: 'Table', patterns: ['grid'], layer: 'react', tail: 'display/Table.behaviour.json' },
    ],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'feedback/Dialog.behaviour.json' },
  });
  assert.deepEqual(problems, []);
});

test('suiteMentions matches a binding path tail in a suite body', () => {
  assert.equal(suiteMentions("join(X, 'feedback/Dialog.behaviour.json')", 'feedback/Dialog.behaviour.json'), true);
  assert.equal(suiteMentions("join(X, 'feedback/Dialog.behaviour.json')", 'feedback/Menu.behaviour.json'), false);
  // A bare basename is NOT a tail and must not satisfy a tail. This is the whole
  // discrimination: `Dialog.behaviour.json` alone names no layer.
  assert.equal(suiteMentions("join(X, 'Dialog.behaviour.json')", 'feedback/Dialog.behaviour.json'), false);
});

/* A suite may spell its binding path either as one string or as join() arguments,
 * and both shapes are live in frameworks/react/test-dom/ today -- tabs.test.jsx,
 * side-nav-disclosure.test.jsx and tooltip-keyboard.test.jsx write the second.
 * The matcher accepts both, so the gate is not quietly legislating a code style. */
test('suiteMentions accepts a tail spelled as join() arguments', () => {
  assert.equal(suiteMentions("join(R, 'navigation', 'Tabs.behaviour.json')", 'navigation/Tabs.behaviour.json'), true);
  assert.equal(suiteMentions('join(R, "navigation", "Tabs.behaviour.json")', 'navigation/Tabs.behaviour.json'), true);
  // The separator is a join() boundary, not "anything at all": a different
  // directory between the two segments is still a different path.
  assert.equal(suiteMentions("join(R, 'navigation', 'sub', 'Tabs.behaviour.json')", 'navigation/Tabs.behaviour.json'), false);
});

/* THE LAYER DISCRIMINATION, and why the record searches for a PATH rather than a
 * file stem. Before the structure refactor's batch 2 the Angular layer's binding
 * file was named for its kebab directory (`bar-chart.behaviour.json`) while
 * React's was Pascal (`BarChart.behaviour.json`), so a stem search discriminated
 * between the layers by accident and nobody had to say so. Batch 2 spelled both
 * stems Pascal and that accident ended: with both files named `Alert.behaviour.json`,
 * `'Alert:angular': 'alert-tones.test.jsx'` -- React's own suite, naming React's
 * own binding -- validated CLEAN. The tails do not collide TODAY, because the
 * Angular one carries its kebab directory and the React one does not -- but
 * that is true of the CURRENT two layouts only. The refactor's own pending
 * batch 3 (docs/superpowers/specs/2026-07-27-frameworks-file-structure-design-
 * pending-1.md) gives React the same `<category>/<kebab>/<Component>` shape
 * Angular just gained, at which point a dual-bound component's tails collide
 * again and this test's own fixture below would need a real Angular kebab
 * segment on the React side too to keep proving anything. See the longer note
 * on this in check-compliance.mjs, beside COVERED, which names the two
 * candidate fixes -- prefixing each layer's root onto its tail, or having a
 * suite report its own directory -- neither implemented yet.
 *
 * DELETION-SIMULATED: replacing suiteMentions' body with the old
 * `source.includes(`${basename(tail)}`)` shape makes the second half of this test
 * fail with "Expected values to be strictly equal: 0 !== 1" -- the sibling layer's
 * suite is accepted again and no problem is reported. */
test('a suite from the sibling layer cannot satisfy a coverage claim', () => {
  const bindings = [
    { name: 'Alert', patterns: ['status'], layer: 'react', tail: 'feedback/Alert.behaviour.json' },
    { name: 'Alert', patterns: ['status'], layer: 'angular', tail: 'feedback/alert/Alert.behaviour.json' },
  ];
  // React's suite names React's binding -> the react claim holds.
  assert.deepEqual(
    validateCoverage({ bindings, covered: { 'Alert:react': 'alert-tones.test.jsx' },
      suites: { 'alert-tones.test.jsx': "join(R, 'feedback/Alert.behaviour.json')" } }),
    [],
  );
  // The SAME suite, offered for the ANGULAR key. Both stems are `Alert`, so a
  // stem search would pass this; the Angular tail carries `alert/` and is absent.
  const stale = validateCoverage({ bindings, covered: { 'Alert:angular': 'alert-tones.test.jsx' },
    suites: { 'alert-tones.test.jsx': "join(R, 'feedback/Alert.behaviour.json')" } });
  assert.equal(stale.length, 1);
  assert.match(stale[0], /feedback\/alert\/Alert\.behaviour\.json/);

  // And the reverse: Angular's own suite satisfies the Angular key.
  assert.deepEqual(
    validateCoverage({ bindings, covered: { 'Alert:angular': 'Alert.roleTones.test.ts' },
      suites: { 'Alert.roleTones.test.ts': "join(A, 'feedback/alert/Alert.behaviour.json')" } }),
    [],
  );
});

test('a composite key naming a layer the component is not bound in fails', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/Dialog.behaviour.json' }],
    covered: { 'Dialog:angular': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'feedback/Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /angular/);
});

test('a COVERED key without a :layer suffix is rejected -- the shape is mandatory', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/Dialog.behaviour.json' }],
    covered: { Dialog: 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'feedback/Dialog.behaviour.json' },
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
      tail: 'feedback/Alert.behaviour.json',
      cases: [
        { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
        { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
      ],
    },
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].patterns, ['alert', 'status']);
});

/* A missing tail must not silently degrade to the bare `<name>.behaviour.json`
 * shape -- that bare stem is exactly the layer-blind pattern suiteMentions'
 * tail match exists to refuse (see the note beside COVERED in
 * check-compliance.mjs), so falling back to it for a caller that forgot to
 * attach one would quietly readmit the defect this whole file was written to
 * close. collectBindings() always attaches a tail today, so this is a check on
 * that invariant rather than a live path -- but the invariant must be an
 * error, not a default, or a future caller can violate it with nothing saying
 * so.
 *
 * DELETION-SIMULATED: reverting inventoryFrom's `tail: binding.tail` to
 * `binding.tail ?? \`${name}.behaviour.json\`` (and removing the throw above
 * it) makes this test fail with "Missing expected exception" -- the call
 * returns a row carrying the bare-stem fallback instead of throwing. */
test('inventoryFrom throws on a binding with no tail', () => {
  assert.throws(
    () => inventoryFrom({ 'Alert:react': { pattern: 'status', exceptions: [] } }),
    /Alert:react.*no tail/s,
  );
});

/* Same invariant, checked at validateCoverage's own entry point rather than
 * only at inventoryFrom's -- both functions are exported and independently
 * callable, and both used to carry the same silent default.
 *
 * DELETION-SIMULATED: reverting `byKey.set(...)` to
 * `byKey.set(\`${b.name}:${b.layer}\`, b.tail ?? \`${b.name}.behaviour.json\`)`
 * (and removing the throw above it) makes this test fail the same way --
 * "Missing expected exception" -- because validateCoverage then runs to
 * completion and returns `[]` instead of throwing. */
test('validateCoverage throws on a binding with no tail', () => {
  assert.throws(
    () => validateCoverage({
      bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react' }],
      covered: {},
      suites: {},
    }),
    /Dialog:react.*no tail/s,
  );
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

/* walkSuites() is exported, so its own missing-directory guard is its own --
 * inheriting collectSuites()'s would hold only until a second caller existed. */
test('walkSuites returns nothing for a directory that does not exist', () => {
  assert.deepEqual(walkSuites(join(tmpdir(), 'arena-no-such-suite-dir-2026')), []);
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
