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
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': { source: "assertPattern for join(R, 'feedback/dialog/Dialog.behaviour.json')", layer: 'react' } },
  });
  assert.deepEqual(problems, []);
});

test('validateCoverage fails a COVERED entry naming a binding that no longer exists', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx', 'Ghost:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': { source: 'feedback/dialog/Dialog.behaviour.json', layer: 'react' } },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Ghost/);
  assert.match(problems[0], /no binding/i);
});

test('validateCoverage fails a COVERED entry whose suite never mentions the component', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': { source: 'assertPattern for Menu.behaviour.json', layer: 'react' } },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /never names/i);
});

test('validateCoverage fails a COVERED entry naming a suite file that does not exist', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
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
      { name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' },
      { name: 'Table', patterns: ['grid'], layer: 'react', tail: 'display/table/Table.behaviour.json' },
    ],
    covered: { 'Dialog:react': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': { source: 'feedback/dialog/Dialog.behaviour.json', layer: 'react' } },
  });
  assert.deepEqual(problems, []);
});

test('suiteMentions matches a binding path tail in a suite body', () => {
  assert.equal(suiteMentions("join(X, 'feedback/dialog/Dialog.behaviour.json')", 'feedback/dialog/Dialog.behaviour.json'), true);
  assert.equal(suiteMentions("join(X, 'feedback/dialog/Dialog.behaviour.json')", 'navigation/menu/Menu.behaviour.json'), false);
  // A bare basename is NOT a tail and must not satisfy a tail. This is the whole
  // discrimination: `Dialog.behaviour.json` alone names no layer.
  assert.equal(suiteMentions("join(X, 'Dialog.behaviour.json')", 'feedback/dialog/Dialog.behaviour.json'), false);
});

/* A suite may spell its binding path either as one string or as join() arguments,
 * and both shapes are live in the React layer today -- read by grepping for
 * `behaviour.json'` under frameworks/react/, which is how this list was
 * re-derived rather than recalled: `components/navigation/tabs/Tabs.dom.test.jsx`,
 * `components/navigation/side-nav/SideNav.disclosure.dom.test.jsx` and
 * `components/feedback/tooltip/Tooltip.keyboard.dom.test.jsx` write the second,
 * every other one the first. The matcher accepts both, so the gate is not
 * quietly legislating a code style. */
test('suiteMentions accepts a tail spelled as join() arguments', () => {
  assert.equal(suiteMentions("join(R, 'navigation', 'tabs', 'Tabs.behaviour.json')", 'navigation/tabs/Tabs.behaviour.json'), true);
  assert.equal(suiteMentions('join(R, "navigation", "tabs", "Tabs.behaviour.json")', 'navigation/tabs/Tabs.behaviour.json'), true);
  // The separator is a join() boundary, not "anything at all": a different
  // directory between the two segments is still a different path.
  assert.equal(suiteMentions("join(R, 'navigation', 'sub', 'tabs', 'Tabs.behaviour.json')", 'navigation/tabs/Tabs.behaviour.json'), false);
});

/* THE LAYER DISCRIMINATION. A suite belongs to the layer of the tree
 * collectSuites() found it under -- a tag attached at collection time from
 * SUITE_DIRS, never derived from the suite's own text -- and validateCoverage
 * checks that tag against the COVERED key's layer before it ever looks at the
 * suite's source. The path TAIL search (suiteMentions) runs only once that
 * agrees, and proves the suite reads the right BINDING within that layer; it
 * is no longer what tells the layers apart, and after the history below could
 * not reliably be.
 *
 * That history is why the split exists. Before the structure refactor's batch 2
 * the Angular layer's binding file was named for its kebab directory
 * (`bar-chart.behaviour.json`) while React's was Pascal (`BarChart.behaviour.json`),
 * so a bare STEM search discriminated between the layers by accident and nobody
 * had to say so. Batch 2 spelled both stems Pascal and that accident ended: with
 * both files named `Alert.behaviour.json`, `'Alert:angular': 'alert-tones.test.jsx'`
 * (that suite's name at the time -- batch 3 renamed it `AlertTones.dom.test.jsx`,
 * and this line quotes the map as it then read, so do not update it)
 * -- React's own suite, naming React's own binding -- validated CLEAN, which was
 * the defect commit `663b2e4` closed by moving the check to the path TAIL instead
 * of the bare stem. That tail match then discriminated correctly only because
 * the Angular tail carried its kebab directory and the React one did not -- true
 * of that moment's two layouts only, and it expired when the structure
 * refactor's batch 3 gave React the same `<category>/<kebab>/<Component>` shape
 * Angular had already gained. A dual-bound component's tails collide now, so a
 * tail-only check would have reverted silently to the same defect commit
 * `663b2e4` had already closed once. Prefixing each
 * layer's root onto its own tail before comparing was considered for that
 * moment and rejected: no suite spells its layer root in its source (both roots
 * are derived constants), so a root-prefixed tail would have matched no suite
 * at all and every coverage claim would have failed. Tagging each suite with
 * the layer of the directory it was found in was taken instead, and this test
 * proves THAT check rather than suiteMentions.
 *
 * The fixture below spells the tails the tree really spells, which since batch 3
 * means React's and Angular's `Alert` tails are byte-identical -- so the layer
 * tag is not merely what decides the outcome, it is the only thing that CAN.
 * This test earns its place beside the `Tag` one below by also asserting the two
 * POSITIVE directions: each layer's own suite does satisfy its own key. Neither
 * is a fixture invented to make a point any more; both are what the tree holds.
 *
 * DELETION-SIMULATED, re-measured after batch 3 rather than carried over:
 * replacing `suite.layer !== layer` with `false` in validateCoverage makes the
 * middle assertion fail `Expected values to be strictly equal: 0 !== 1` -- the
 * React suite is accepted for the Angular claim, because the tail check cannot
 * tell them apart at all. Before batch 3 this same simulation produced a stale-
 * TAIL message instead, since the tails still differed; that is the property
 * that expired. */
test('a suite from the sibling layer cannot satisfy a coverage claim', () => {
  const bindings = [
    { name: 'Alert', patterns: ['status'], layer: 'react', tail: 'feedback/alert/Alert.behaviour.json' },
    { name: 'Alert', patterns: ['status'], layer: 'angular', tail: 'feedback/alert/Alert.behaviour.json' },
  ];
  // React's suite names React's binding -> the react claim holds.
  assert.deepEqual(
    validateCoverage({ bindings, covered: { 'Alert:react': 'AlertTones.dom.test.jsx' },
      suites: { 'AlertTones.dom.test.jsx': { source: "join(R, 'feedback/alert/Alert.behaviour.json')", layer: 'react' } } }),
    [],
  );
  // The SAME suite, offered for the ANGULAR key. It is tagged `react` -- the
  // tree collectSuites() found it under -- so the layer check rejects it
  // before the tail is ever compared; both stems being `Alert` never gets a
  // chance to matter.
  const stale = validateCoverage({ bindings, covered: { 'Alert:angular': 'AlertTones.dom.test.jsx' },
    suites: { 'AlertTones.dom.test.jsx': { source: "join(R, 'feedback/alert/Alert.behaviour.json')", layer: 'react' } } });
  assert.equal(stale.length, 1);
  assert.match(stale[0], /react layer/);

  // And the reverse: Angular's own suite satisfies the Angular key.
  assert.deepEqual(
    validateCoverage({ bindings, covered: { 'Alert:angular': 'Alert.roleTones.test.ts' },
      suites: { 'Alert.roleTones.test.ts': { source: "join(A, 'feedback/alert/Alert.behaviour.json')", layer: 'angular' } } }),
    [],
  );
});

/* THE POST-BATCH-3 COLLISION, and it is REAL now rather than fabricated -- this
 * comment said "fabricated" while batch 3 was still ahead of it. The React layer
 * is components/<category>/<kebab>/<Component>.behaviour.json today, so a
 * component bound in both layers has BYTE-IDENTICAL tails and a text search can
 * no longer tell the two apart however it is written. `Tag` below is the live
 * instance: both layers spell `display/tag/Tag.behaviour.json`, asserted
 * directly in scripts/behaviour-contracts.test.mjs against the real files. The
 * layer a suite belongs to is therefore decided by which tree the file was found
 * in -- a filesystem fact, fixed at collection time -- and never by what its
 * text spells.
 *
 * DELETION-SIMULATED: removing the `suite.layer !== layer` check from
 * validateCoverage makes this test fail with "Expected values to be strictly
 * equal: 0 !== 1" -- React's suite is accepted for the Angular claim again. */
test('a suite from the wrong layer cannot satisfy a claim when the tails collide', () => {
  const bindings = [
    { name: 'Tag', patterns: ['none'], layer: 'react', tail: 'display/tag/Tag.behaviour.json' },
    { name: 'Tag', patterns: ['none'], layer: 'angular', tail: 'display/tag/Tag.behaviour.json' },
  ];
  const suites = {
    'TagAndChipCases.dom.test.jsx': {
      source: "join(R, 'display/tag/Tag.behaviour.json')", layer: 'react',
    },
  };
  // The react claim is satisfied by the react suite.
  assert.deepEqual(validateCoverage({
    bindings, covered: { 'Tag:react': 'TagAndChipCases.dom.test.jsx' }, suites,
  }), []);
  // The angular claim is NOT, even though the suite names a byte-identical tail.
  const problems = validateCoverage({
    bindings, covered: { 'Tag:angular': 'TagAndChipCases.dom.test.jsx' }, suites,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /react layer/);
});

/* collectSuites carries the layer through from SUITE_DIRS rather than deriving it
 * from a path, so there is exactly one place a suite's layer is decided. */
test('collectSuites tags each suite with the layer of the directory it came from', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-suite-layer-'));
  const a = join(root, 'a'); const b = join(root, 'b');
  mkdirSync(a); mkdirSync(b);
  writeFileSync(join(a, 'One.test.jsx'), 'x');
  writeFileSync(join(b, 'Two.test.ts'), 'y');
  const out = collectSuites([{ layer: 'react', dir: a }, { layer: 'angular', dir: b }]);
  assert.equal(out['One.test.jsx'].layer, 'react');
  assert.equal(out['Two.test.ts'].layer, 'angular');
  assert.equal(out['One.test.jsx'].source, 'x');
  rmSync(root, { recursive: true, force: true });
});

test('a composite key naming a layer the component is not bound in fails', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:angular': 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': { source: 'feedback/dialog/Dialog.behaviour.json', layer: 'react' } },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /angular/);
});

test('a COVERED key without a :layer suffix is rejected -- the shape is mandatory', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { Dialog: 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': { source: 'feedback/dialog/Dialog.behaviour.json', layer: 'react' } },
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
      tail: 'feedback/alert/Alert.behaviour.json',
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
    assert.ok(suites[suiteFile].source.includes('.behaviour.json'), `${suiteFile} reads no binding`);
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
      () => collectSuites([{ layer: 'react', dir: dirA }, { layer: 'angular', dir: dirB }]),
      /two suites share the basename Dup\.facet\.test\.ts/,
    );
  } finally {
    rmSync(dirA, { recursive: true, force: true });
    rmSync(dirB, { recursive: true, force: true });
  }
});
