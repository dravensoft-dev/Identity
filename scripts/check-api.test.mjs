/* One test per assertion the gate makes, driven through the gate's exported
 * pure helpers rather than through main(). main() reads the filesystem and
 * exits the process; the helpers are what actually decide, so they are what is
 * worth pinning -- the idiom check-script-tokens.test.mjs and
 * check-dimension-literals.test.mjs already use.
 *
 * The five assertions, and where each is covered:
 *   1 coverage         -> kebab(), plus the path-shape test below
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
import { kebab, bindingName, validateTypes, validateContract, compareSurface } from './check-api.mjs';
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

/* 1 — coverage */

test('kebab turns a component name into the Angular directory name', () => {
  assert.equal(kebab('AppLogo'), 'app-logo');
  assert.equal(kebab('StatCard'), 'stat-card');
  assert.equal(kebab('Breadcrumbs'), 'breadcrumbs');
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

/* 3b — required-ness. The contract governs a member's required-ness too, for
 * the four inbound non-slot forms; `slot` and `event` are carved out below. */

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
 * api/types/ type, resolved OUTSIDE compareSurface (main() reads the
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
 * ./api.generated and tsconfig.check.json pulls it in, which is luck, not
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

test('a contract member with a form outside the six encoded values fails', () => {
  const problems = validateContract(
    { component: 'X', api: { thing: { form: 'callback' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /callback/.test(p)));
});

test('an enum member must name a declared enum, not a declared object', () => {
  const problems = validateContract(
    { component: 'X', api: { tone: { form: 'enum', type: 'Crumb' } } }, TYPES,
  );
  assert.ok(problems.some((p) => /Crumb/.test(p)));
});

/* 5 — generated drift */

test('the committed generated modules are what api/types/ generates', () => {
  for (const [path, expected] of buildApiModules()) {
    assert.equal(readFileSync(join(root, path), 'utf8'), expected, `${path} is stale — run bun run build:api`);
  }
});

/* the loud failure */

test('a member shape the reader cannot read throws rather than reporting no members', () => {
  const src = 'export interface XProps { weird: { [k: string]: unknown }; }';
  assert.throws(() => reactSurface(src, 'XProps'), UnrecognisedShape);
});
