/* One test per assertion the gate makes, driven through the gate's exported
 * pure helpers rather than through main(). main() reads the filesystem and
 * exits the process; the helpers are what actually decide, so they are what is
 * worth pinning -- the idiom check-script-tokens.test.mjs and
 * check-dimension-literals.test.mjs already use.
 *
 * The five assertions, and where each is covered:
 *   1 coverage         -> resolveReactImplementations and
 *                         resolveAngularImplementations, plus the path-shape
 *                         test below. pascal() lives in check-structure.mjs
 *                         and is pinned by its own suite -- alongside kebab(),
 *                         its inverse -- and is imported here only to build the
 *                         fixtures.
 *   2 form             -> compareSurface on a platform/union member
 *   3 agreement        -> compareSurface, both directions, plus the optional rule
 *   4 derived rules    -> validateTypes (R1) and compareSurface (R4, R5)
 *   5 generated drift  -> buildApiModules against the committed files
 * plus the loud failure on a member shape the reader cannot read at all. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  bindingName, validateTypes, validateContract, compareSurface,
  resolveAngularImplementations, resolveReactImplementations, zeroContractProblems,
} from './check-api.mjs';
import { pascal } from './check-structure.mjs';
import { buildApiModules } from './build-api-types.mjs';
import { reactSurface, UnrecognisedShape } from './lib/api-surface.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = new Map([['Tone', 'enum'], ['Crumb', 'object']]);

const CONTRACT = {
  component: 'Breadcrumbs',
  api: {
    items: { form: 'array', of: 'Crumb', required: true },
    separator: { form: 'primitive', type: 'string' },
    navigate: { form: 'event', payload: 'Crumb' },
  },
};

/* 1 — coverage.
 *
 * Coverage is decided by resolveAngularImplementations: which Angular
 * components this gate can read is what "the contract holds across N layer
 * implementations" is a claim about. Its two problem rules are guards against
 * a SILENT failure -- this gate once printed
 * "50 contract(s) hold across 50 layer implementation(s)" and exited 0 while
 * every one of twenty real Angular implementations went unread, because
 * absence and unfindability were the same value (null). A guard with no test
 * behind it would survive its own deletion, which is the one thing a guard
 * against silence must not do, so both messages are pinned below and each is
 * pinned firing ALONE. */

/** The layer tree this gate really walks, in miniature. */
const TREE = { charts: ['bar-chart'], display: ['tag', 'unauth-card'] };

/** An `exists` predicate over a fixture: every directory in `tree` holds its
 *  own <Pascal>.<ext> under `frameworks/<layer>/components/`, minus the ones
 *  named in `missing`. Built from the same pascal() the gate's own path shape
 *  is derived from, so a fixture cannot drift from the rule.
 *
 *  Layer and extension are parameters because the two resolvers differ in
 *  exactly those two things and in nothing else -- Angular reads a component's
 *  `<Pascal>.ts`, React its `<Pascal>.d.ts` -- so one fixture rule serves both
 *  and neither half can be corrected without the other. */
const layerExists = (layer, ext) => (tree, missing = []) => {
  const gone = new Set(missing);
  const present = new Set();
  for (const [category, dirs] of Object.entries(tree))
    for (const dir of dirs)
      if (!gone.has(dir)) present.add(`frameworks/${layer}/components/${category}/${dir}/${pascal(dir)}.${ext}`);
  return (path) => present.has(path);
};
const treeExists = layerExists('angular', 'ts');
const reactTreeExists = layerExists('react', 'd.ts');

test('a complete layer resolves every component to its own PascalCase file and reports nothing', () => {
  const { implementations, problems } = resolveAngularImplementations(TREE, treeExists(TREE));
  assert.deepEqual(problems, []);
  assert.equal(implementations.size, 3);
  assert.equal(implementations.get('BarChart'), 'frameworks/angular/components/charts/bar-chart/BarChart.ts');
  assert.equal(implementations.get('UnauthCard'), 'frameworks/angular/components/display/unauth-card/UnauthCard.ts');
});

test('a component directory whose PascalCase file is missing is a problem, not a skip -- and the rest of the layer still resolves', () => {
  // The per-directory guard, firing ALONE: the walk is non-empty, so the
  // zero-total rule below has nothing to say. This is what one renamed or
  // moved component directory looks like, and it is exactly the case a
  // zero-total guard by itself cannot see.
  const { implementations, problems } = resolveAngularImplementations(TREE, treeExists(TREE, ['tag']));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /frameworks\/angular\/components\/display\/tag\/: is a component directory with no Tag\.ts/);
  assert.match(problems[0], /clean pass over an unchecked layer/);
  assert.equal(implementations.size, 2);
  assert.ok(!implementations.has('Tag'));
});

test('a layer that yields zero implementations is a failure, not a clean pass', () => {
  // The zero-total guard, firing ALONE: readLayer() returns {} for a moved or
  // renamed frameworks/angular/components, so there is no directory for a
  // per-directory problem to be about. This is what the whole layer moving
  // looks like -- the failure this gate actually shipped -- and it is the same
  // shape as zeroLayerProblems in check-structure.mjs and the zero-manifest
  // guards in check-tailwind.mjs and check-radius-tokens.mjs.
  const { implementations, problems } = resolveAngularImplementations({}, () => false);
  assert.equal(implementations.size, 0);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /found 0 Angular component implementations/);
  assert.match(problems[0], /an empty result set is a failure, not a clean pass/);
});

test('a layer whose every component file is unreadable reports both rules, because both are true', () => {
  // Not a third rule: the two are independent, so a tree with directories and
  // no readable file in any of them trips each of them once. Pinned so nobody
  // "tidies" the zero-total check into an else-branch of the per-directory one.
  const { problems } = resolveAngularImplementations(TREE, () => false);
  assert.equal(problems.length, 4);
  assert.equal(problems.filter((p) => /is a component directory with no/.test(p)).length, 3);
  assert.equal(problems.filter((p) => /found 0 Angular component implementations/.test(p)).length, 1);
});

test('a category holding no directories contributes nothing and is not itself a component', () => {
  const { implementations, problems } = resolveAngularImplementations({ forms: [] }, () => true);
  assert.equal(implementations.size, 0);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /found 0 Angular component implementations/);
});

/* The React half of assertion 1, and it carries the same two guards for the
 * same reason. React was a hardcoded group list probed with existsSync and
 * resolved to null on a miss until the structure refactor's batch 3 -- the last
 * lookup of that shape in the repo, and the one whose own comment named that
 * batch as the one that owed it a walk. Its failure mode looked louder than
 * Angular's only because React holds the majority of the contracts, so a broken
 * lookup skipped nearly all of them at once and the printed count collapsed
 * visibly; that is a property of how the contracts happen to be distributed
 * today, not of the probe, and it would have gone quiet the moment the balance
 * moved. Both messages are pinned below, each firing ALONE. */

const REACT_TREE = { charts: ['bar-chart'], display: ['tag', 'unauth-card'] };

test('a complete React layer resolves every component to its own .d.ts and reports nothing', () => {
  const { implementations, problems } = resolveReactImplementations(REACT_TREE, reactTreeExists(REACT_TREE));
  assert.deepEqual(problems, []);
  assert.equal(implementations.size, 3);
  assert.equal(implementations.get('BarChart'), 'frameworks/react/components/charts/bar-chart/BarChart.d.ts');
  assert.equal(implementations.get('UnauthCard'), 'frameworks/react/components/display/unauth-card/UnauthCard.d.ts');
});

test('a React component directory whose .d.ts is missing is a problem, not a skip -- and the rest of the layer still resolves', () => {
  // The per-directory guard, firing ALONE: the walk is non-empty, so the
  // zero-total rule has nothing to say. One renamed or moved component
  // directory looks exactly like this, and a zero-total guard cannot see it.
  const { implementations, problems } = resolveReactImplementations(REACT_TREE, reactTreeExists(REACT_TREE, ['tag']));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /frameworks\/react\/components\/display\/tag\/: is a component directory with no Tag\.d\.ts/);
  assert.match(problems[0], /clean pass over an unchecked layer/);
  assert.equal(implementations.size, 2);
  assert.ok(!implementations.has('Tag'));
});

test('a React layer that yields zero implementations is a failure, not a clean pass', () => {
  // The zero-total guard, firing ALONE: readLayer() returns {} for a moved or
  // renamed frameworks/react/components, so there is no directory for a
  // per-directory problem to be about.
  const { implementations, problems } = resolveReactImplementations({}, () => false);
  assert.equal(implementations.size, 0);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /found 0 React component implementations/);
  assert.match(problems[0], /an empty result set is a failure, not a clean pass/);
});

test('a React layer whose every .d.ts is unreadable reports both rules, because both are true', () => {
  // Not a third rule: the two are independent, so a tree with directories and
  // no readable file in any of them trips each of them once.
  const { problems } = resolveReactImplementations(REACT_TREE, () => false);
  assert.equal(problems.length, 4);
  assert.equal(problems.filter((p) => /is a component directory with no/.test(p)).length, 3);
  assert.equal(problems.filter((p) => /found 0 React component implementations/.test(p)).length, 1);
});

/* the binding table */

test('the binding table is mechanical: content is children, an event x is onX', () => {
  assert.equal(bindingName('content', 'slot', 'react'), 'children');
  assert.equal(bindingName('mark', 'slot', 'react'), 'mark');
  assert.equal(bindingName('navigate', 'event', 'react'), 'onNavigate');
  assert.equal(bindingName('items', 'array', 'react'), 'items');
  for (const [n, f] of [['content', 'slot'], ['navigate', 'event'], ['items', 'array']]) {
    assert.equal(bindingName(n, f, 'angular'), n);
  }
});

/* 2 — form, and 4 — R4/R5 */

test('a platform type is reported as an R4 violation, naming the rule', () => {
  const problems = compareSurface(
    { component: 'X', api: {} },
    [{ name: 'style', form: 'platform', type: 'React.CSSProperties', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /R4/);
  assert.match(problems[0], /React\.CSSProperties/);
});

test('a union between forms is reported as an R5 violation', () => {
  const problems = compareSurface(
    { component: 'X', api: {} },
    [{ name: 'tabs', form: 'union', parts: ['string', 'TabItem'], required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /R5/);
});

test('an event payload that is a platform type is an R4 violation of its own', () => {
  const problems = compareSurface(
    { component: 'X', api: { navigate: { form: 'event', payload: 'Crumb' } } },
    [{ name: 'navigate', form: 'event', payload: 'MouseEvent', platformPayload: true, required: false }],
    'angular',
  );
  assert.ok(problems.some((p) => /R4/.test(p) && /MouseEvent/.test(p)));
});

/* 3 — agreement */

test('a layer declaring exactly the contract agrees, in both idioms', () => {
  const angular = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'separator', form: 'primitive', type: 'string', required: false },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
  ];
  assert.deepEqual(compareSurface(CONTRACT, angular, 'angular'), []);

  const react = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'separator', form: 'primitive', type: 'string', required: false },
    { name: 'onNavigate', form: 'event', payload: 'Crumb', required: false },
  ];
  assert.deepEqual(compareSurface(CONTRACT, react, 'react'), []);
});

test('a member the contract does not name fails, even when it looks harmless', () => {
  const members = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'separator', form: 'primitive', type: 'string', required: false },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
    { name: 'compact', form: 'primitive', type: 'boolean', required: false },
  ];
  const problems = compareSurface(CONTRACT, members, 'angular');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /compact/);
  assert.match(problems[0], /does not name/);
});

test('an OPTIONAL member a layer omits still fails -- required governs the consumer, never the layer', () => {
  const members = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
  ];
  const problems = compareSurface(CONTRACT, members, 'angular');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /separator/);
  assert.match(problems[0], /does not declare/);
});

test('the same name in the wrong form fails', () => {
  const members = [
    { name: 'items', form: 'array', of: 'Crumb', required: true },
    { name: 'separator', form: 'slot', required: false },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
  ];
  const problems = compareSurface(CONTRACT, members, 'angular');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /separator/);
  assert.match(problems[0], /slot/);
  assert.match(problems[0], /primitive/);
});

test('an array of the wrong element type fails', () => {
  const members = [
    { name: 'items', form: 'array', of: 'string', required: true },
    { name: 'separator', form: 'primitive', type: 'string', required: false },
    { name: 'navigate', form: 'event', payload: 'Crumb', required: false },
  ];
  assert.ok(compareSurface(CONTRACT, members, 'angular').some((p) => /items/.test(p)));
});

/* A primitive member's TYPE was the last unguarded type position in the whole
 * contract layer: the gate compared name, form, required-ness and an event's
 * payload, validated that a contract's primitive type IS a primitive, and never
 * compared the two. `Dialog.width` (a .d.ts saying number against a contract
 * saying string) and `SideNav.indentStep` (whose contract argues at length for
 * why a string is wrong) are the two live examples the debt record names; both
 * agree today, and both would have gone unnoticed if they had not. */
test('a primitive member typed differently in the layer is a problem', () => {
  const problems = compareSurface(
    { component: 'Breadcrumbs', api: { separator: { form: 'primitive', type: 'string' } } },
    [{ name: 'separator', required: false, form: 'primitive', type: 'number' }],
    'react',
  );
  assert.deepEqual(problems, [
    'react/Breadcrumbs.separator: typed number, contract says string',
  ]);
});

test('a primitive member typed the same in both is not a problem', () => {
  const problems = compareSurface(
    { component: 'Breadcrumbs', api: { separator: { form: 'primitive', type: 'string' } } },
    [{ name: 'separator', required: false, form: 'primitive', type: 'string' }],
    'react',
  );
  assert.deepEqual(problems, []);
});

/* 3b — required-ness. The contract governs a member's required-ness too, for
 * the five inbound non-slot forms; `slot` and `event` are carved out below. */

test('a contract member required: true implemented as optional by a layer is reported', () => {
  const problems = compareSurface(
    { component: 'X', api: { items: { form: 'array', of: 'Crumb', required: true } } },
    [{ name: 'items', form: 'array', of: 'Crumb', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /items/);
  assert.match(problems[0], /required/);
  assert.match(problems[0], /optional/);
});

test('a contract member left optional (no `required` key) implemented as required by a layer is reported -- the contract is the authority in both directions', () => {
  const problems = compareSurface(
    { component: 'X', api: { separator: { form: 'primitive', type: 'string' } } },
    [{ name: 'separator', form: 'primitive', type: 'string', required: true }],
    'angular',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /separator/);
  assert.match(problems[0], /required/);
});

test('matching required-ness on a primitive and an array member reports nothing', () => {
  const problems = compareSurface(
    {
      component: 'X',
      api: {
        items: { form: 'array', of: 'Crumb', required: true },
        separator: { form: 'primitive', type: 'string' },
      },
    },
    [
      { name: 'items', form: 'array', of: 'Crumb', required: true },
      { name: 'separator', form: 'primitive', type: 'string', required: false },
    ],
    'react',
  );
  assert.deepEqual(problems, []);
});

test('a required slot mismatched against an optional layer member reports nothing -- Angular\'s <ng-content> cannot declare projected content mandatory', () => {
  const problems = compareSurface(
    { component: 'X', api: { mark: { form: 'slot', required: true } } },
    [{ name: 'mark', form: 'slot', required: false }],
    'angular',
  );
  assert.deepEqual(problems, []);
});

test('an event with mismatched required-ness reports nothing -- an outbound member is never "required", a consumer is always free not to listen', () => {
  const problems = compareSurface(
    { component: 'X', api: { navigate: { form: 'event', payload: 'Crumb', required: true } } },
    [{ name: 'navigate', form: 'event', payload: 'Crumb', required: false }],
    'angular',
  );
  assert.deepEqual(problems, []);
});

/* Corollary of the CRITICAL fix to templateSlots(): compareSurface must
 * detect a member name declared TWICE in one layer's own surface. Before
 * this, the AGREEMENT loop re-`seen.add()`d the same bound name silently --
 * a duplicate matching the contract passed with zero problems, which is
 * exactly how the stale duplicate `icon` slot (doc comment + real template)
 * slipped through StatCard's real contract check. */
test('a member name declared twice in one layer\'s surface is reported as a duplicate', () => {
  const contract = { component: 'X', api: { icon: { form: 'slot' } } };
  const members = [
    { name: 'icon', form: 'slot', required: false },
    { name: 'icon', form: 'slot', required: false },
  ];
  const problems = compareSurface(contract, members, 'angular');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /icon/);
  assert.match(problems[0], /twice/);
});

/* IMPORTANT: an inline literal union (`'sm' | 'md'`) classifies as
 * {form:'enum', values:[...]} with no `type` -- compareSurface's own type
 * comparison guarded on `m.type &&`, so it never ran for this shape, and an
 * inline union matched a contract enum member on form alone regardless of
 * its actual values. `types` is the fourth parameter carrying every declared
 * contracts/api/types/ type, resolved OUTSIDE compareSurface (main() reads the
 * filesystem, compareSurface stays string-in/data-out). */
const LOGO_SIZE_TYPES = new Map([
  ['LogoSize', { name: 'LogoSize', kind: 'enum', values: ['sm', 'md', 'lg', 'xl'] }],
]);

test('an inline literal union whose values match the contract enum reports nothing', () => {
  const contract = { component: 'X', api: { size: { form: 'enum', type: 'LogoSize' } } };
  const members = [{ name: 'size', form: 'enum', values: ['sm', 'md', 'lg', 'xl'], required: false }];
  assert.deepEqual(compareSurface(contract, members, 'react', LOGO_SIZE_TYPES), []);
});

test('an inline literal union whose values differ from the contract enum is reported, naming both sets', () => {
  const contract = { component: 'X', api: { size: { form: 'enum', type: 'LogoSize' } } };
  const members = [{ name: 'size', form: 'enum', values: ['sm', 'md'], required: false }];
  const problems = compareSurface(contract, members, 'react', LOGO_SIZE_TYPES);
  assert.equal(problems.length, 1);
  for (const value of ['sm', 'md', 'lg', 'xl']) assert.match(problems[0], new RegExp(value));
});

test('an inline literal union naming an enum absent from the types map reports nothing -- resolution is not this function\'s job', () => {
  const contract = { component: 'X', api: { size: { form: 'enum', type: 'LogoSize' } } };
  const members = [{ name: 'size', form: 'enum', values: ['sm', 'md'], required: false }];
  assert.deepEqual(compareSurface(contract, members, 'react'), []);
});

/* the `named` form: an identifier the reader could not resolve on its own --
 * it resolves ONLY against a contract `enum` or `object` member. */

test('a named member resolves against an enum contract member, and a type mismatch still fails', () => {
  const contract = { component: 'X', api: { tone: { form: 'enum', type: 'Tone' } } };
  assert.deepEqual(
    compareSurface(contract, [{ name: 'tone', form: 'named', type: 'Tone', required: false }], 'react'),
    [],
  );
  const problems = compareSurface(
    contract,
    [{ name: 'tone', form: 'named', type: 'Status', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Status/);
  assert.match(problems[0], /Tone/);
});

test('a named member resolves against an object contract member, and a type mismatch still fails', () => {
  const contract = { component: 'X', api: { crumb: { form: 'object', type: 'Crumb' } } };
  assert.deepEqual(
    compareSurface(contract, [{ name: 'crumb', form: 'named', type: 'Crumb', required: false }], 'react'),
    [],
  );
  const problems = compareSurface(
    contract,
    [{ name: 'crumb', form: 'named', type: 'Widget', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Widget/);
  assert.match(problems[0], /Crumb/);
});

test('a named member against a primitive contract member is reported, not coerced into matching', () => {
  const problems = compareSurface(
    { component: 'X', api: { separator: { form: 'primitive', type: 'string' } } },
    [{ name: 'separator', form: 'named', type: 'Direction', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Direction/);
  assert.match(problems[0], /primitive/);
});

test('a named member against an event contract member is reported, not coerced into matching', () => {
  const problems = compareSurface(
    { component: 'X', api: { navigate: { form: 'event', payload: null } } },
    [{ name: 'onNavigate', form: 'named', type: 'ClickHandler', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /ClickHandler/);
  assert.match(problems[0], /event/);
});

/* bindingName collisions: two distinct contract members that bind to the
 * same name in one layer must not silently overwrite each other. */

test('two contract members binding to the same name in one layer is reported as a collision', () => {
  const contract = {
    component: 'X',
    api: {
      content: { form: 'slot' },
      children: { form: 'primitive', type: 'string' },
    },
  };
  const problems = compareSurface(contract, [{ name: 'children', form: 'slot', required: false }], 'react');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /content/);
  assert.match(problems[0], /children/);
  assert.match(problems[0], /collide/);
});

/* Regression: the collision skip must not swallow a member's OWN form
 * validity. R4 and R5 judge a member on its own, with no reference to any
 * contract spec, so they must still fire even when the member's bound name
 * is also the site of a contract-authoring collision. */

test('a collided bound name still reports the member\'s own R4 violation (platform type)', () => {
  const contract = {
    component: 'X',
    api: {
      content: { form: 'slot' },
      children: { form: 'primitive', type: 'string' },
    },
  };
  const problems = compareSurface(
    contract,
    [{ name: 'children', form: 'platform', type: 'React.CSSProperties', required: false }],
    'react',
  );
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => /collide/.test(p) && /content/.test(p) && /children/.test(p)));
  assert.ok(problems.some((p) => /R4/.test(p) && /React\.CSSProperties/.test(p)));
});

test('a collided bound name still reports the member\'s own R5 violation (union)', () => {
  const contract = {
    component: 'X',
    api: {
      content: { form: 'slot' },
      children: { form: 'primitive', type: 'string' },
    },
  };
  const problems = compareSurface(
    contract,
    [{ name: 'children', form: 'union', parts: ['string', 'TabItem'], required: false }],
    'react',
  );
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => /collide/.test(p) && /content/.test(p) && /children/.test(p)));
  assert.ok(problems.some((p) => /R5/.test(p)));
});

/* The second collision shape the previous fix left untested: an event
 * contract member binds in React by prefixing "on" + capitalised name, which
 * can collide with a contract member that is literally named that way. */

test('an event member colliding with a literally-named onX member is reported, naming both', () => {
  const contract = {
    component: 'X',
    api: {
      x: { form: 'event', payload: null },
      onX: { form: 'primitive', type: 'string' },
    },
  };
  const problems = compareSurface(
    contract,
    [{ name: 'onX', form: 'primitive', type: 'string', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /collide/);
  assert.match(problems[0], /"x"/);
  assert.match(problems[0], /"onX"/);
});

/* 4 — the derived rules, on the type side */

test('R1: a predefined object may not carry a slot or an event field', () => {
  const problems = validateTypes([{
    name: 'Crumb', kind: 'object',
    fields: { label: { form: 'primitive', type: 'string' }, onClick: { form: 'event' } },
  }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /R1/);
  assert.match(problems[0], /onClick/);
});

/* MINOR: an object field's enum type name was never checked against the
 * declared type list. {form:'enum', type:'Nonexistent'} would emit an
 * unresolvable TypeScript reference into BOTH generated modules -- caught
 * downstream by ngc only because frameworks/angular/index.ts re-exports
 * ./Api.generated and tsconfig.check.json pulls it in, which is luck, not
 * design (React's own .d.ts has nothing that would catch it at all). */
test('an object field naming an enum type nobody declared fails', () => {
  const problems = validateTypes([{
    name: 'Widget', kind: 'object',
    fields: { tone: { form: 'enum', type: 'Nonexistent' } },
  }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Nonexistent/);
});

test('an object field naming a real type that is an object, not an enum, fails', () => {
  const problems = validateTypes([
    { name: 'Crumb', kind: 'object', fields: { label: { form: 'primitive', type: 'string' } } },
    { name: 'Widget', kind: 'object', fields: { thing: { form: 'enum', type: 'Crumb' } } },
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Crumb/);
});

test('an object field naming a declared enum passes', () => {
  const problems = validateTypes([
    { name: 'Tone', kind: 'enum', values: ['neutral', 'accent'] },
    { name: 'Widget', kind: 'object', fields: { tone: { form: 'enum', type: 'Tone' } } },
  ]);
  assert.deepEqual(problems, []);
});

test('a contract naming a type nobody declared fails', () => {
  const problems = validateContract(
    { component: 'X', api: { items: { form: 'array', of: 'Widget' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /Widget/.test(p)));
});

test('a contract member with a form outside the eight encoded values fails', () => {
  const problems = validateContract(
    { component: 'X', api: { thing: { form: 'callback' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /callback/.test(p)));
});

/* An event payload resolves like an array's `of`: primitive, consumerData, or
 * a declared object. The first of those three was refused until the form
 * controls needed it -- their `change` carries the VALUE, which is a primitive.
 * The reader had always produced that shape; only the contract could not say it. */

test('validateContract accepts an event payload that is a primitive type name', () => {
  const problems = validateContract(
    { component: 'X', api: { change: { form: 'event', payload: 'string' } } }, TYPES,
  );
  assert.deepEqual(problems, []);
});

test('an event payload naming an undeclared, non-primitive type still fails', () => {
  const problems = validateContract(
    { component: 'X', api: { change: { form: 'event', payload: 'Widget' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /Widget/.test(p)));
});

test('an enum member must name a declared enum, not a declared object', () => {
  const problems = validateContract(
    { component: 'X', api: { tone: { form: 'enum', type: 'Crumb' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /Crumb/.test(p)));
});

/* 5 — generated drift */

test('the committed generated modules are what contracts/api/types/ generates', () => {
  for (const [path, expected] of buildApiModules()) {
    assert.equal(readFileSync(join(root, path), 'utf8'), expected, `${path} is stale — run bun run build:api`);
  }
});

/* the loud failure */

test('a member shape the reader cannot read throws rather than reporting no members', () => {
  const src = 'export interface XProps { weird: { [k: string]: unknown }; }';
  assert.throws(() => reactSurface(src, 'XProps'), UnrecognisedShape);
});

/* the eighth form — consumer data */

/* R1 extended. An object is pure data with known fields, so consumer data --
 * whose fields are by construction unknown -- cannot be one of them. This is
 * what deletes Calendar's `meta`: it is a field of the CalendarEvent object,
 * and after this rule it cannot live there at all. */
test('validateTypes rejects consumer data inside a predefined object', () => {
  const problems = validateTypes([
    { name: 'Row', kind: 'object', fields: { meta: { form: 'consumerData' } } },
  ]);
  assert.ok(problems.some((p) => /Row\.meta/.test(p) && /consumer data/i.test(p)));
});

/* A consumer-data member Arena can never surface is dead API: Arena holds data
 * with no route back out. The route is a slot parameter or an event payload. */
test('validateContract rejects a consumer-data member with no consumer', () => {
  const problems = validateContract(
    { component: 'X', api: { rows: { form: 'array', of: 'consumerData' } } },
    new Map(),
  );
  assert.ok(problems.some((p) => /rows/.test(p) && /no.*consumer/i.test(p)));
});

test('validateContract accepts consumer data routed back out through a slot parameter', () => {
  const problems = validateContract(
    { component: 'X', api: {
      rows: { form: 'array', of: 'consumerData' },
      cell: { form: 'slot', params: { row: 'consumerData' } },
    } },
    new Map(),
  );
  assert.deepEqual(problems, []);
});

test('validateContract accepts consumer data routed back out through an event payload', () => {
  const problems = validateContract(
    { component: 'X', api: {
      rows: { form: 'array', of: 'consumerData' },
      select: { form: 'event', payload: 'consumerData' },
    } },
    new Map(),
  );
  assert.deepEqual(problems, []);
});

/* the ninth form — functionInput */

/* functionInput is legal only in a contract that declares itself an input
 * control. The mark is checkable, so "input controls only" is enforced rather
 * than merely written down -- the maintainer's decision, made mechanical. */
test('validateContract accepts a functionInput in a kind:input contract', () => {
  const problems = validateContract(
    { component: 'Input', kind: 'input',
      api: { validate: { form: 'functionInput', params: { value: 'string' }, returns: 'string' } } },
    new Map(),
  );
  assert.deepEqual(problems, []);
});

test('validateContract rejects a functionInput outside a kind:input contract', () => {
  const problems = validateContract(
    { component: 'X',
      api: { fmt: { form: 'functionInput', params: { value: 'number' }, returns: 'string' } } },
    new Map(),
  );
  assert.ok(problems.some((p) => /fmt/.test(p) && /kind.*input/i.test(p)));
});

/* R4 inside the signature: a param or return naming a type contracts/api/types/ does not
 * declare is reported, exactly as an object member's enum type is. BOTH halves
 * are pinned -- the parameter loop was already there (it runs for any member
 * carrying `params`), the return check was not, so a test on the parameter
 * alone would have shipped the return check unproven. */
test('validateContract checks a functionInput signature type against contracts/api/types', () => {
  const problems = validateContract(
    { component: 'Input', kind: 'input',
      api: { validate: { form: 'functionInput', params: { value: 'Nope' }, returns: 'string' } } },
    new Map(),
  );
  assert.ok(problems.some((p) => /Nope/.test(p)));
  assert.ok(problems.some((p) => /functionInput parameter/.test(p)));
});

test('validateContract checks a functionInput RETURN type against contracts/api/types too', () => {
  const problems = validateContract(
    { component: 'Input', kind: 'input',
      api: { validate: { form: 'functionInput', params: { value: 'string' }, returns: 'Nope' } } },
    new Map(),
  );
  assert.ok(problems.some((p) => /Nope/.test(p) && /return/i.test(p)));

  const missing = validateContract(
    { component: 'Input', kind: 'input', api: { validate: { form: 'functionInput', params: {} } } },
    new Map(),
  );
  assert.ok(missing.some((p) => /validate/.test(p) && /returns/.test(p)));
});

/* The signature is COMPARED, not only declared. A layer whose validator takes a
 * number where the contract says string implements a different member; without
 * this, a functionInput matched on form alone and the modelled signature was
 * documented and read by nothing -- the hole `default` still has. */
test('a functionInput whose layer parameter type differs from the contract is reported', () => {
  const contract = {
    component: 'Input', kind: 'input',
    api: { validate: { form: 'functionInput', params: { value: 'string' }, returns: 'string' } },
  };
  const problems = compareSurface(
    contract,
    [{ name: 'validate', form: 'functionInput', params: { value: 'number' }, returns: 'string', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /validate/);
  assert.match(problems[0], /value/);
  assert.match(problems[0], /number/);
  assert.match(problems[0], /string/);
});

test('a functionInput whose layer return differs from the contract is reported', () => {
  const contract = {
    component: 'Input', kind: 'input',
    api: { validate: { form: 'functionInput', params: { value: 'string' }, returns: 'string' } },
  };
  const problems = compareSurface(
    contract,
    [{ name: 'validate', form: 'functionInput', params: { value: 'string' }, returns: 'boolean', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /validate/);
  assert.match(problems[0], /boolean/);
  assert.match(problems[0], /string/);
});

test('a functionInput matching the contract exactly reports nothing, and binds to a prop of the same name', () => {
  const contract = {
    component: 'Input', kind: 'input',
    api: { validate: { form: 'functionInput', params: { value: 'string' }, returns: 'string' } },
  };
  assert.deepEqual(
    compareSurface(
      contract,
      [{ name: 'validate', form: 'functionInput', params: { value: 'string' }, returns: 'string', required: false }],
      'react',
    ),
    [],
  );
  /* No binding-table row changes: a functionInput is neither a slot nor an
   * event, so bindingName returns the member's own name in both layers. */
  assert.equal(bindingName('validate', 'functionInput', 'react'), 'validate');
  assert.equal(bindingName('validate', 'functionInput', 'angular'), 'validate');
});

/* Required-ness is contracted for the SIX inbound non-slot forms now: a
 * functionInput is inbound data-shaped API like the other five, and both
 * platforms can express whether a consumer must supply it. */
test('a functionInput required by the contract and optional in the layer is reported', () => {
  const contract = {
    component: 'Input', kind: 'input',
    api: { validate: { form: 'functionInput', params: { value: 'string' }, returns: 'string', required: true } },
  };
  const problems = compareSurface(
    contract,
    [{ name: 'validate', form: 'functionInput', params: { value: 'string' }, returns: 'string', required: false }],
    'react',
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /required/);
  assert.match(problems[0], /optional/);
});

/* An event payload resolves as a primitive, consumerData, a declared object OR a
 * declared enum. The enum arm is the last of the four: plan 8C2 admitted the
 * first three and stopped one type-kind short, so a contract declaring an enum
 * payload read as "an enum, used where an object belongs" while classify() read
 * the arrow without complaint. */
test('validateContract accepts an event payload naming a declared enum', () => {
  const problems = validateContract(
    { component: 'X', api: { pick: { form: 'event', payload: 'LogoSize' } } },
    new Map([['LogoSize', 'enum']]),
  );
  assert.deepEqual(problems, []);
});

test('validateContract still rejects an event payload naming no declared type', () => {
  const problems = validateContract(
    { component: 'X', api: { pick: { form: 'event', payload: 'Nope' } } },
    new Map([['LogoSize', 'enum']]),
  );
  assert.ok(problems.some((p) => /Nope/.test(p)));
});

/* The one measured false green in this repository: with api/components/ moved
 * aside, main() used to print "0 contract(s) hold across 0 layer
 * implementation(s)" and exit 0, because its readdirSync was wrapped in an
 * existsSync ternary that cannot tell "absent" from "not found". That is the
 * same shape behind check:tailwind's zero-manifest run and check:api's own
 * silent skip of every Angular comparison. */
test('zero contracts is a failure, not a clean pass', () => {
  const problems = zeroContractProblems({ contracts: 0, types: 40 });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /0 contract/);
  assert.match(problems[0], /contracts\/api\/components/);
});

test('zero types is a failure too, named separately', () => {
  const problems = zeroContractProblems({ contracts: 50, types: 0 });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /0 type/);
  assert.match(problems[0], /contracts\/api\/types/);
});

test('both empty are reported as two problems, not one', () => {
  assert.equal(zeroContractProblems({ contracts: 0, types: 0 }).length, 2);
});

test('a populated tree has no zero problems', () => {
  assert.deepEqual(zeroContractProblems({ contracts: 50, types: 40 }), []);
});
