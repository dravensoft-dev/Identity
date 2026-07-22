import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePattern, loadPatterns, validateBinding, reactComponents, angularPrimitives,
  validateUnboundPrimitives, crossLayerAgrees,
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

test('the none pattern is one of the two allowed to have no requirements', () => {
  const none = { name: 'none', source: 'n/a', requires: {} };
  assert.deepEqual(validatePattern('none', none), []);
});

test('the absent pattern is the other one allowed to have no requirements', () => {
  const absent = { name: 'absent', source: 'n/a', requires: {} };
  assert.deepEqual(validatePattern('absent', absent), []);
});

test('every pattern on disk is valid', () => {
  const patterns = loadPatterns('.');
  const problems = [...patterns].flatMap(([stem, p]) => validatePattern(stem, p));
  assert.deepEqual(problems, []);
});

test('every pattern but none and absent cites a w3.org source', () => {
  for (const [stem, p] of loadPatterns('.')) {
    if (stem === 'none' || stem === 'absent') continue;
    assert.match(p.source, /^https:\/\/www\.w3\.org\//, `${stem} must cite a w3.org source`);
  }
});

/* Confirmed against the live APG pattern index (https://www.w3.org/WAI/ARIA/apg/patterns/),
 * not assumed: APG has no pattern page for textbox or status, so both cite the ARIA 1.2
 * role reference instead. figure-with-data-table is Arena's own, cited from WCAG because
 * APG has no chart pattern at all. tooltip DOES have an APG pattern page -- despite an
 * earlier draft of this plan assuming otherwise -- and cites it, so it is not in this list.
 * absent cites nothing, the same as none, and for the same reason -- there is nothing to
 * adopt when there is no component. */
test('none aside, exactly the patterns with no APG pattern page cite something else', () => {
  const nonApg = [...loadPatterns('.')]
    .filter(([stem, p]) => stem !== 'none' && !p.source.includes('/ARIA/apg/'))
    .map(([stem]) => stem)
    .sort();
  assert.deepEqual(nonApg, ['absent', 'figure-with-data-table', 'status', 'textbox']);
});

const patterns = new Map([
  ['dialog-modal', { name: 'dialog-modal', source: 'x', requires: { 'focus.trap': true, 'keyboard.Escape': 'close' } }],
  ['none', { name: 'none', source: 'n/a', requires: {} }],
  ['absent', { name: 'absent', source: 'n/a', requires: {} }],
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

test('binding absent without a reason is a problem', () => {
  assert.match(
    validateBinding('Calendar', 'angular-delegated', { pattern: 'absent' }, patterns)[0],
    /binding absent requires a reason/,
  );
});

test('binding absent with a reason is valid', () => {
  assert.deepEqual(
    validateBinding('Calendar', 'angular-delegated', { pattern: 'absent', reason: 'no such component' }, patterns),
    [],
  );
});

/* This is the finding IMPORTANT-2 fixed: "renders but does nothing" (none) and
 * "there is no such component here" (absent) used to collapse onto the same
 * "none" value, distinguishable only by prose in the reason field. They are
 * now different pattern names, so a tool -- not just a reader -- can tell a
 * Card (renders, inert) from a Calendar (Angular has none) apart. */
test('none and absent are distinct patterns, not the same fact spelled two ways', () => {
  const renders = { pattern: 'none', reason: 'a presentational surface that renders' };
  const doesNotExist = { pattern: 'absent', reason: 'no such component exists in this layer' };
  assert.notEqual(renders.pattern, doesNotExist.pattern);
  assert.deepEqual(validateBinding('Card', 'angular-delegated', renders, patterns), []);
  assert.deepEqual(validateBinding('Calendar', 'angular-delegated', doesNotExist, patterns), []);
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

/* hasUnboundPrimitive and its five named entries (Breadcrumbs, BulkActionBar,
 * CommandPalette, PageHead, ThemeToggle) existed only for the transitional
 * state where those five Angular directories had no <name>.behaviour.json
 * yet. All 21 Angular primitives are bound now (behaviour Task 6), which
 * makes UNBOUND_PRIMITIVES permanently empty by design and hasUnboundPrimitive
 * itself dead code -- both were removed from lib/behaviour-contracts.mjs, and
 * the tests that asserted their transitional content went with them. What
 * remains is the one test below that still means something with an empty
 * map: the self-check stays clean. */
test('validateUnboundPrimitives is clean against the real repo state', () => {
  assert.deepEqual(validateUnboundPrimitives('.'), []);
});

/* crossLayerAgrees carries check-behaviour.mjs's step 6 -- "the two layers agree,
 * or the difference is declared" -- so it can be tested without a filesystem walk.
 * The absent clauses are the point: Calendar is the one binding in the repo that
 * needs them, and they must fire on absent specifically, not paper over every
 * mismatch. */
test('two bindings naming the same pattern agree', () => {
  assert.equal(crossLayerAgrees({ pattern: 'grid' }, { pattern: 'grid' }), true);
});

test('a declared divergesFrom on either side is accepted', () => {
  assert.equal(crossLayerAgrees({ pattern: 'grid' }, { pattern: 'none', divergesFrom: 'grid' }), true);
  assert.equal(crossLayerAgrees({ pattern: 'grid', divergesFrom: 'none' }, { pattern: 'none' }), true);
});

test('a real mismatch with no divergesFrom on either side disagrees', () => {
  assert.equal(crossLayerAgrees({ pattern: 'grid' }, { pattern: 'none' }), false);
});

test('absent on either side is skipped even with no divergesFrom declared', () => {
  assert.equal(crossLayerAgrees({ pattern: 'grid' }, { pattern: 'absent' }), true);
  assert.equal(crossLayerAgrees({ pattern: 'absent' }, { pattern: 'grid' }), true);
});

test('the real Calendar binding needs no divergesFrom to agree with React', () => {
  const reactBinding = { pattern: 'grid' };
  const angularCalendar = { pattern: 'absent', reason: 'Angular has no such component at all.' };
  assert.equal(crossLayerAgrees(reactBinding, angularCalendar), true);
});
