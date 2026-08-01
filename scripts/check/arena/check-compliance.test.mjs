import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { COVERED, suiteMentions, validateCoverage, inventoryFrom, walkSuites, collectSuites } from './check-compliance.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

test('validateCoverage is clean when a composite key names the layer its suite verifies', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.tsx' },
    suites: { 'dialog-modal.test.tsx': { source: "assertPattern for join(R, 'feedback/dialog/Dialog.behaviour.json')", layer: 'react' } },
  });
  assert.deepEqual(problems, []);
});

test('validateCoverage fails a COVERED entry naming a binding that no longer exists', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.tsx', 'Ghost:react': 'dialog-modal.test.tsx' },
    suites: { 'dialog-modal.test.tsx': { source: 'feedback/dialog/Dialog.behaviour.json', layer: 'react' } },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Ghost/);
  assert.match(problems[0], /no binding/i);
});

test('validateCoverage fails a COVERED entry whose suite never mentions the component', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'dialog-modal.test.tsx' },
    suites: { 'dialog-modal.test.tsx': { source: 'assertPattern for Menu.behaviour.json', layer: 'react' } },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /never names/i);
});

test('validateCoverage fails a COVERED entry naming a suite file that does not exist', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:react': 'gone.test.tsx' },
    suites: {},
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /gone\.test\.tsx/);
});

test('validateCoverage says nothing about an uncovered binding', () => {

  const problems = validateCoverage({
    bindings: [
      { name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' },
      { name: 'Table', patterns: ['grid'], layer: 'react', tail: 'display/table/Table.behaviour.json' },
    ],
    covered: { 'Dialog:react': 'dialog-modal.test.tsx' },
    suites: { 'dialog-modal.test.tsx': { source: 'feedback/dialog/Dialog.behaviour.json', layer: 'react' } },
  });
  assert.deepEqual(problems, []);
});

test('suiteMentions matches a binding path tail in a suite body', () => {
  assert.equal(suiteMentions("join(X, 'feedback/dialog/Dialog.behaviour.json')", 'feedback/dialog/Dialog.behaviour.json'), true);
  assert.equal(suiteMentions("join(X, 'feedback/dialog/Dialog.behaviour.json')", 'navigation/menu/Menu.behaviour.json'), false);

  assert.equal(suiteMentions("join(X, 'Dialog.behaviour.json')", 'feedback/dialog/Dialog.behaviour.json'), false);
});

test('suiteMentions accepts a tail spelled as join() arguments', () => {
  assert.equal(suiteMentions("join(R, 'navigation', 'tabs', 'Tabs.behaviour.json')", 'navigation/tabs/Tabs.behaviour.json'), true);
  assert.equal(suiteMentions('join(R, "navigation", "tabs", "Tabs.behaviour.json")', 'navigation/tabs/Tabs.behaviour.json'), true);

  assert.equal(suiteMentions("join(R, 'navigation', 'sub', 'tabs', 'Tabs.behaviour.json')", 'navigation/tabs/Tabs.behaviour.json'), false);
});

test('a suite from the sibling layer cannot satisfy a coverage claim', () => {
  const bindings = [
    { name: 'Alert', patterns: ['status'], layer: 'react', tail: 'feedback/alert/Alert.behaviour.json' },
    { name: 'Alert', patterns: ['status'], layer: 'angular', tail: 'feedback/alert/Alert.behaviour.json' },
  ];

  assert.deepEqual(
    validateCoverage({ bindings, covered: { 'Alert:react': 'AlertTones.dom.test.tsx' },
      suites: { 'AlertTones.dom.test.tsx': { source: "join(R, 'feedback/alert/Alert.behaviour.json')", layer: 'react' } } }),
    [],
  );

  const stale = validateCoverage({ bindings, covered: { 'Alert:angular': 'AlertTones.dom.test.tsx' },
    suites: { 'AlertTones.dom.test.tsx': { source: "join(R, 'feedback/alert/Alert.behaviour.json')", layer: 'react' } } });
  assert.equal(stale.length, 1);
  assert.match(stale[0], /react layer/);

  assert.deepEqual(
    validateCoverage({ bindings, covered: { 'Alert:angular': 'Alert.roleTones.test.ts' },
      suites: { 'Alert.roleTones.test.ts': { source: "join(A, 'feedback/alert/Alert.behaviour.json')", layer: 'angular' } } }),
    [],
  );
});

test('a suite from the wrong layer cannot satisfy a claim when the tails collide', () => {
  const bindings = [
    { name: 'Tag', patterns: ['none'], layer: 'react', tail: 'display/tag/Tag.behaviour.json' },
    { name: 'Tag', patterns: ['none'], layer: 'angular', tail: 'display/tag/Tag.behaviour.json' },
  ];
  const suites = {
    'TagAndChipCases.dom.test.tsx': {
      source: "join(R, 'display/tag/Tag.behaviour.json')", layer: 'react',
    },
  };

  assert.deepEqual(validateCoverage({
    bindings, covered: { 'Tag:react': 'TagAndChipCases.dom.test.tsx' }, suites,
  }), []);

  const problems = validateCoverage({
    bindings, covered: { 'Tag:angular': 'TagAndChipCases.dom.test.tsx' }, suites,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /react layer/);
});

test('collectSuites tags each suite with the layer of the directory it came from', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-suite-layer-'));
  const a = join(root, 'a'); const b = join(root, 'b');
  mkdirSync(a); mkdirSync(b);
  writeFileSync(join(a, 'One.test.tsx'), 'x');
  writeFileSync(join(b, 'Two.test.ts'), 'y');
  const out = collectSuites([{ layer: 'react', dir: a }, { layer: 'angular', dir: b }]);
  assert.equal(out['One.test.tsx'].layer, 'react');
  assert.equal(out['Two.test.ts'].layer, 'angular');
  assert.equal(out['One.test.tsx'].source, 'x');
  rmSync(root, { recursive: true, force: true });
});

test('a composite key naming a layer the component is not bound in fails', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { 'Dialog:angular': 'dialog-modal.test.tsx' },
    suites: { 'dialog-modal.test.tsx': { source: 'feedback/dialog/Dialog.behaviour.json', layer: 'react' } },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /angular/);
});

test('a COVERED key without a :layer suffix is rejected -- the shape is mandatory', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', patterns: ['dialog-modal'], layer: 'react', tail: 'feedback/dialog/Dialog.behaviour.json' }],
    covered: { Dialog: 'dialog-modal.test.tsx' },
    suites: { 'dialog-modal.test.tsx': { source: 'feedback/dialog/Dialog.behaviour.json', layer: 'react' } },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /:layer|composite|<component>:<layer>/i);
});

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

test('inventoryFrom throws on a binding with no tail', () => {
  assert.throws(
    () => inventoryFrom({ 'Alert:react': { pattern: 'status', exceptions: [] } }),
    /Alert:react.*no tail/s,
  );
});

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

  assert.ok(Object.keys(COVERED).length > 0, 'COVERED should not be empty');
  const suites = collectSuites();
  for (const [key, suiteFile] of Object.entries(COVERED)) {
    assert.ok(suiteFile in suites, `COVERED["${key}"] names ${suiteFile}, which is in no suite directory`);
    assert.ok(suites[suiteFile].source.includes('.behaviour.json'), `${suiteFile} reads no binding`);
  }
  assert.ok(existsSync(join(repoRoot, 'frameworks')), 'the suite directories are resolved from the repository root');
});

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

test('walkSuites returns nothing for a directory that does not exist', () => {
  assert.deepEqual(walkSuites(join(tmpdir(), 'arena-no-such-suite-dir-2026')), []);
});

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
