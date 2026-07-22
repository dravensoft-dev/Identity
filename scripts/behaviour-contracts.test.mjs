import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validatePattern, loadPatterns, validateBinding, reactComponents, angularPrimitives,
  UNBOUND_PRIMITIVES, hasUnboundPrimitive, validateUnboundPrimitives,
} from './lib/behaviour-contracts.mjs';

const ok = {
  name: 'dialog-modal',
  source: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
  requires: { 'roles.element': 'dialog', 'focus.trap': true },
};

test('a well-formed pattern has no problems', () => {
  assert.deepEqual(validatePattern('dialog-modal', ok), []);
});

test('a pattern whose name disagrees with its filename is a problem', () => {
  assert.match(validatePattern('modal', ok)[0], /name "dialog-modal" does not match/);
});

test('a pattern with no source is a problem', () => {
  const { source, ...noSource } = ok;
  assert.match(validatePattern('dialog-modal', noSource)[0], /source/);
});

test('a pattern with an empty requires map is a problem', () => {
  assert.match(validatePattern('dialog-modal', { ...ok, requires: {} })[0], /at least one requirement/);
});

test('a requirement key must be dotted, so an exception can name exactly one leaf', () => {
  const flat = { ...ok, requires: { trap: true } };
  assert.match(validatePattern('dialog-modal', flat)[0], /"trap" must be dotted/);
});

test('the none pattern is the one allowed to have no requirements', () => {
  const none = { name: 'none', source: 'n/a', requires: {} };
  assert.deepEqual(validatePattern('none', none), []);
});

test('every pattern on disk is valid', () => {
  const patterns = loadPatterns('.');
  const problems = [...patterns].flatMap(([stem, p]) => validatePattern(stem, p));
  assert.deepEqual(problems, []);
});

test('every pattern but none cites a w3.org source', () => {
  for (const [stem, p] of loadPatterns('.')) {
    if (stem === 'none') continue;
    assert.match(p.source, /^https:\/\/www\.w3\.org\//, `${stem} must cite a w3.org source`);
  }
});

/* Confirmed against the live APG pattern index (https://www.w3.org/WAI/ARIA/apg/patterns/),
 * not assumed: APG has no pattern page for textbox or status, so both cite the ARIA 1.2
 * role reference instead. figure-with-data-table is Arena's own, cited from WCAG because
 * APG has no chart pattern at all. tooltip DOES have an APG pattern page -- despite an
 * earlier draft of this plan assuming otherwise -- and cites it, so it is not in this list. */
test('none aside, exactly the patterns with no APG pattern page cite something else', () => {
  const nonApg = [...loadPatterns('.')]
    .filter(([stem, p]) => stem !== 'none' && !p.source.includes('/ARIA/apg/'))
    .map(([stem]) => stem)
    .sort();
  assert.deepEqual(nonApg, ['figure-with-data-table', 'status', 'textbox']);
});

const patterns = new Map([
  ['dialog-modal', { name: 'dialog-modal', source: 'x', requires: { 'focus.trap': true, 'keyboard.Escape': 'close' } }],
  ['none', { name: 'none', source: 'n/a', requires: {} }],
]);

test('a binding naming a real pattern with no exceptions is valid', () => {
  assert.deepEqual(validateBinding('Dialog', 'react', { pattern: 'dialog-modal' }, patterns), []);
});

test('a binding naming a pattern that does not exist is a problem', () => {
  assert.match(validateBinding('Dialog', 'react', { pattern: 'modal' }, patterns)[0], /unknown pattern "modal"/);
});

test('binding none without a reason is a problem', () => {
  assert.match(validateBinding('Card', 'react', { pattern: 'none' }, patterns)[0], /requires a reason/);
});

test('binding none with a reason is valid', () => {
  assert.deepEqual(validateBinding('Card', 'react', { pattern: 'none', reason: 'a surface' }, patterns), []);
});

test('an exception naming a requirement the pattern does not have is a problem', () => {
  const b = { pattern: 'dialog-modal', exceptions: [{ requirement: 'focus.restore', reason: 'x' }] };
  assert.match(validateBinding('Dialog', 'react', b, patterns)[0], /no requirement "focus.restore"/);
});

test('an exception without a reason is a problem', () => {
  const b = { pattern: 'dialog-modal', exceptions: [{ requirement: 'focus.trap' }] };
  assert.match(validateBinding('Dialog', 'react', b, patterns)[0], /reason/);
});

test('a delegated binding must name what provides the behaviour', () => {
  const b = { pattern: 'dialog-modal', delegatedTo: '' };
  assert.match(validateBinding('Dialog', 'angular', b, patterns)[0], /delegatedTo/);
});

/* An Angular primitive's directory is kebab-case (stat-card) and its React
 * counterpart is Pascal (StatCard). Deriving one from the other is the same
 * unsafe round-trip that bit the script-readable gate -- so the binding CARRIES
 * the counterpart's name instead. Without it the cross-layer assertion silently
 * never fires, which would quietly disable the one check this plan exists for. */
test('an angular binding must name its React counterpart', () => {
  const b = { pattern: 'dialog-modal' };
  assert.match(validateBinding('stat-card', 'angular', b, patterns)[0], /must declare "component"/);
});

test('an angular binding that names its counterpart is valid', () => {
  const b = { pattern: 'dialog-modal', component: 'StatCard' };
  assert.deepEqual(validateBinding('stat-card', 'angular', b, patterns), []);
});

test('the React inventory finds every component and no demo entry', () => {
  const found = reactComponents('.');
  assert.equal(found.length, 43);
  assert.ok(found.includes('Dialog'));
  assert.ok(!found.some((c) => c.endsWith('.card.entry')));
});

test('the Angular inventory finds every primitive and no bare module', () => {
  const found = angularPrimitives('.');
  assert.equal(found.length, 21);
  assert.ok(found.includes('tag'));
  assert.ok(!found.includes('chart-internals'));
});

/* A primitive directory existing and its binding having parsed are different
 * facts -- check-behaviour.mjs used to conflate them and reported "no
 * primitive" for every unbound one. hasUnboundPrimitive is what closes that
 * gap; these are the five components whose Angular directory currently has
 * no <name>.behaviour.json yet exists on disk (verified with
 * `ls frameworks/angular/primitives/`). */
test('hasUnboundPrimitive is true for a component with an unbound Angular directory', () => {
  assert.ok(hasUnboundPrimitive('Breadcrumbs'));
  assert.ok(hasUnboundPrimitive('BulkActionBar'));
  assert.ok(hasUnboundPrimitive('CommandPalette'));
  assert.ok(hasUnboundPrimitive('PageHead'));
  assert.ok(hasUnboundPrimitive('ThemeToggle'));
});

test('hasUnboundPrimitive is false for a component with no Angular primitive at all', () => {
  assert.equal(hasUnboundPrimitive('Button'), false);
  assert.equal(hasUnboundPrimitive('SideNav'), false);
});

test('UNBOUND_PRIMITIVES names exactly the primitive directories that currently have no behaviour.json', () => {
  const base = 'frameworks/angular/primitives';
  for (const [dir, component] of Object.entries(UNBOUND_PRIMITIVES)) {
    assert.ok(angularPrimitives('.').includes(dir), `${dir}: not a real primitive directory`);
    assert.ok(!existsSync(`${base}/${dir}/${dir}.behaviour.json`), `${dir}: is bound now -- entry is stale`);
    assert.ok(reactComponents('.').includes(component), `${component}: not a real React component`);
  }
});

test('validateUnboundPrimitives is clean against the real repo state', () => {
  assert.deepEqual(validateUnboundPrimitives('.'), []);
});

test('validateUnboundPrimitives flags a directory that no longer exists on disk', () => {
  // A fresh empty root has none of UNBOUND_PRIMITIVES' directories at all.
  const root = mkdtempSync(join(tmpdir(), 'behaviour-contracts-'));
  try {
    const problems = validateUnboundPrimitives(root);
    assert.equal(problems.length, Object.keys(UNBOUND_PRIMITIVES).length);
    for (const p of problems) assert.match(p, /no longer exists/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('validateUnboundPrimitives flags an entry whose primitive has since been bound', () => {
  const root = mkdtempSync(join(tmpdir(), 'behaviour-contracts-'));
  try {
    const dir = join(root, 'frameworks/angular/primitives/breadcrumbs');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'breadcrumbs.behaviour.json'), '{"pattern":"navigation","component":"Breadcrumbs"}');
    const problems = validateUnboundPrimitives(root);
    const breadcrumbsProblem = problems.find((p) => p.startsWith('UNBOUND_PRIMITIVES: "breadcrumbs"'));
    assert.match(breadcrumbsProblem, /is bound, so this override is stale/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
