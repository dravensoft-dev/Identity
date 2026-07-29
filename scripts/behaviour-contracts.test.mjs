import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePattern, loadPatterns, validateBinding, reactComponents, angularPrimitives,
  angularBindingPath, crossLayerAgrees, loadBinding, bindingCases,
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
  assert.match(validateBinding('Dialog', 'react', b, patterns)[0], /excepts "focus.restore", which pattern "dialog-modal" does not require/);
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

/* The literal count is deliberate here and is not the derived-figure smell
 * CLAUDE.md warns about: an assertion that fails loudly the moment the tree
 * moves is the point of it, unlike a number written into prose that goes stale
 * in silence. It moves by one whenever a component is added -- 43 -> 44 when
 * `CalendarEvent` became a component of its own rather than a predefined
 * object, 44 -> 46 when `Table` became a compound component and grew
 * `TableRow` and `TableCell` in one change, 46 -> 47 when `SideNav` became
 * one and grew `SideNavItem`, 47 -> 48 when `SideNavSection` gave it its
 * first named group, 48 -> 49 when `SideNavCollapsible` gave it its first
 * `disclosure`, and 49 -> 50 when `Tabs` became a compound component and grew
 * `Tab`. Update it with the change that moves it. */
test('the React inventory finds every component and no demo entry', () => {
  const found = reactComponents('.');
  assert.equal(found.length, 50);
  assert.ok(found.includes('Dialog'));
  assert.ok(found.includes('CalendarEvent'));
  assert.ok(found.includes('TableRow'));
  assert.ok(found.includes('TableCell'));
  assert.ok(found.includes('SideNavItem'));
  assert.ok(found.includes('SideNavSection'));
  assert.ok(found.includes('SideNavCollapsible'));
  /* A kebab-case sibling is a helper module, not a component. `side-nav-inject`
   * is the first one spelled `.jsx` (it must be, to stay inside
   * check:dimensions' EXTENSIONS), and without the case filter it was reported
   * as a component and check:behaviour demanded a binding for it. */
  assert.ok(!found.includes('side-nav-inject'));
  assert.ok(!found.some((c) => c.endsWith('.card.entry')));
});

/* The layer is components/<category>/<kebab>/ as of the structure refactor's
 * batch 2, so this walk is two levels deep and has two ways to go wrong that a
 * flat one did not: it can return the CATEGORY names, and it can return a
 * shared internal that now sits one level in. Both are pinned below.
 * `ChartDataTable.test.ts` is the live instance of the second -- a bare `.ts`
 * beside the four chart directories -- today. `ChartInternals.ts` was the
 * PRIOR live instance of that same shape; it has since moved to the layer
 * root and been renamed `DataVisuals.ts`, so `chart-internals` (its pre-move
 * spelling, from before the structure refactor) is kept below purely as
 * history, guarding against a walk that reached back into an old tree and
 * found that name rather than the current one. */
test('the Angular inventory finds every component, no category and no bare module', () => {
  const found = angularPrimitives('.');
  assert.equal(found.length, 20);
  assert.ok(found.includes('tag'));
  assert.ok(found.includes('bar-chart'));
  for (const category of ['brand', 'charts', 'display', 'feedback', 'navigation'])
    assert.ok(!found.includes(category), `${category} is a category, not a component`);
  assert.ok(!found.includes('ChartDataTable'));
  assert.ok(!found.includes('chart-internals'));
});

test('an Angular binding path resolves the category by looking and the stem as Pascal', () => {
  assert.deepEqual(angularBindingPath('.', 'bar-chart'), {
    path: 'frameworks/angular/components/charts/bar-chart/BarChart.behaviour.json',
    stem: 'BarChart',
    tail: 'charts/bar-chart/BarChart.behaviour.json',
  });
  assert.equal(angularBindingPath('.', 'no-such-component'), null);
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

/* Against the real file rather than a fixture, because the thing worth proving is
 * that the compliance suites and check:behaviour read the same bytes off disk.
 * Path is relative to the repo root, as every other on-disk assertion in this
 * suite is -- loadPatterns('.') above sets that convention. */
test('loadBinding reads a real binding from disk', () => {
  const b = loadBinding('./frameworks/react/components/feedback/Dialog.behaviour.json');
  assert.equal(b.pattern, 'dialog-modal');
  assert.ok(Array.isArray(b.exceptions));
});

test('the real Calendar binding needs no divergesFrom to agree with React', () => {
  const reactBinding = { pattern: 'grid' };
  const angularCalendar = { pattern: 'absent', reason: 'Angular has no such component at all.' };
  assert.equal(crossLayerAgrees(reactBinding, angularCalendar), true);
});

test('a flat binding is one anonymous case', () => {
  const cases = bindingCases({ pattern: 'status', exceptions: [{ requirement: 'roles.label' }] });
  assert.equal(cases.length, 1);
  assert.equal(cases[0].name, null);
  assert.equal(cases[0].pattern, 'status');
  assert.equal(cases[0].exceptions.length, 1);
});

test('a flat binding with no exceptions still yields an exceptions array', () => {
  // comparePattern does `binding.exceptions ?? []` itself, but every OTHER
  // consumer would have to repeat that guard. Normalising once is the point.
  assert.deepEqual(bindingCases({ pattern: 'none' })[0].exceptions, []);
});

test('a cased binding yields one entry per case, in order', () => {
  const cases = bindingCases({
    cases: [
      { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
      { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
    ],
  });
  assert.deepEqual(cases.map((c) => c.name), ['danger', 'advisory']);
  assert.deepEqual(cases.map((c) => c.pattern), ['alert', 'status']);
});

/* `none` and `absent` REQUIRE a reason, so a case binding one must carry it or
   inherit the binding's -- otherwise a case binding either could not be written
   at all, and every existing flat `none` binding would need rewriting. The case
   this comment used to name as the one that "cannot be written at all" was
   Skeleton's circle, and 8C10 retired it by fixing the defect it scoped: the
   rule outlived its motivating case. Kept as HISTORY rather than re-pointed at
   whichever case binds `none` today, because a component name written into
   another file's prose is a claim no gate reads -- see CLAUDE.md's Known debt.
   The bindings below are synthetic, so this test depends on no real component. */
test('a case inherits the binding reason and may override it', () => {
  const [inherited] = bindingCases({ reason: 'from the binding',
    cases: [{ name: 'a', when: 'x', pattern: 'none', exceptions: [] }] });
  assert.equal(inherited.reason, 'from the binding');
  const [own] = bindingCases({ reason: 'from the binding',
    cases: [{ name: 'a', when: 'x', pattern: 'none', reason: 'its own', exceptions: [] }] });
  assert.equal(own.reason, 'its own');
  assert.equal(bindingCases({ pattern: 'status' })[0].reason, null);
});

/* The two shapes are alternatives. Carrying both is two places for one fact,
   which is the defect deriving IDREF from IDREF_ATTRIBUTES already fixed once. */
test('a binding declaring both pattern and cases is rejected by validateBinding', () => {
  const problems = validateBinding('Alert', 'react',
    { pattern: 'alert', cases: [{ name: 'x', when: 'y', pattern: 'alert', exceptions: [] }] },
    new Map([['alert', { name: 'alert', requires: {} }]]));
  assert.ok(problems.some((p) => /both .*pattern.* and .*cases/i.test(p)), problems.join('\n'));
});

/* Fix round 1: matching case NAMES is not enough -- two cased bindings whose
 * `danger` case binds different patterns must disagree. crossLayerAgrees'
 * fallback (`a.pattern === b.pattern`) is `undefined === undefined` for two
 * cased bindings, since the both-fields rejection means neither has a
 * top-level `pattern` -- trivially true unless each case's pattern is also
 * compared, by name, not by position. */
test('two cased bindings whose case names match but a case pattern disagrees do not agree', () => {
  const react = { cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ] };
  const angular = { cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'status', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ] };
  assert.equal(crossLayerAgrees(react, angular), false);
});

test('two cased bindings whose case names and per-case patterns all match agree', () => {
  const react = { cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ] };
  const angular = { cases: [
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
  ] };
  assert.equal(crossLayerAgrees(react, angular), true);
});

/* Fix round 2 (8C9 task 5): the cased branch above returns before either escape
 * below it ever runs -- not just divergesFrom, but ABSENT too, which is the
 * clause Calendar's own binding depends on. A cased binding could until now
 * neither declare a divergence nor be compared against a layer that has no such
 * component at all. These three pin the fix; the third is the one that must NOT
 * change -- it is the counterexample two tests above, repeated here as a guard
 * against the exact way a naive fix breaks it: `a.divergesFrom === b.pattern`
 * with neither side declaring one is `undefined === undefined`, true by
 * accident, for any two ordinary cased bindings with no divergesFrom at all. */
test('a cased binding against an absent binding agrees, both directions', () => {
  const cased = { cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ] };
  const absent = { pattern: 'absent', reason: 'Angular has no such component at all.' };
  assert.equal(crossLayerAgrees(cased, absent), true);
  assert.equal(crossLayerAgrees(absent, cased), true);
});

test('a cased binding whose divergesFrom names the other, flat side agrees', () => {
  const cased = { divergesFrom: 'alert', cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ] };
  const flat = { pattern: 'alert', delegatedTo: 'Angular Material MatSnackBar' };
  assert.equal(crossLayerAgrees(cased, flat), true);
  assert.equal(crossLayerAgrees(flat, cased), true);
});

test('two cased bindings with mismatched case patterns and no divergesFrom still disagree', () => {
  const react = { cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ] };
  const angular = { cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'status', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ] };
  assert.equal(crossLayerAgrees(react, angular), false);
});
