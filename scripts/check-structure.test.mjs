/* check:structure asserts that every framework layer places a component
 * directory in the category frameworks/Components.json assigns it. It does
 * NOT assert the category is the right one -- that is editorial judgement and
 * no gate has it. A green run is a consistency claim, never a taxonomy one.
 *
 * A second thing it does NOT assert: that two different PascalCase names never
 * derive the same kebab directory. kebab() is deterministic but not injective,
 * and validateStructure's `declared` map is keyed on the kebab derivation, so a
 * second colliding name silently overwrites the first entry in that map rather
 * than failing -- unlike two categories both naming the SAME PascalCase name,
 * which the duplicate-name assertion below catches explicitly. This is a
 * different property from that one, and it stays unguarded. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateStructure, zeroLayerProblems, kebab, pascal, LAYERS, repoRoot } from './check-structure.mjs';

const categories = { display: ['Badge', 'Tag'], forms: ['Button'] };

test('a tree that matches the declaration has no problems', () => {
  const layers = { tailwind: { display: ['badge', 'tag'], forms: ['button'] } };
  assert.deepEqual(validateStructure({ categories, layers }), []);
});

test('a component in the wrong category is named, with both categories', () => {
  const layers = { tailwind: { forms: ['badge'] } };
  const problems = validateStructure({ categories, layers });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Badge/);
  assert.match(problems[0], /forms/);
  assert.match(problems[0], /display/);
});

test('a directory no category declares is a problem', () => {
  const layers = { tailwind: { display: ['badge', 'sparkline'] } };
  const problems = validateStructure({ categories, layers });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /sparkline/);
});

test('a layer carrying only some categories is fine -- Angular has no forms/', () => {
  const layers = { angular: { display: ['tag'] } };
  assert.deepEqual(validateStructure({ categories, layers }), []);
});

/* Rule 4, and as of batch 3 of the structure refactor this is the rule main()
 * actually runs: MIGRATED is gone, every layer is read, and `complete` is passed
 * true unconditionally. It was held back for the whole refactor, so this pair is
 * what stands behind a rule that has only just started firing against the real
 * tree. Both directions, because the parameter is the whole difference. */
test('a declared component missing from every layer is a problem once every layer is in', () => {
  const layers = { tailwind: { display: ['badge', 'tag'] } };
  const problems = validateStructure({ categories, layers, complete: true });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Button/);
});

test('the same tree is clean when the caller passed only SOME of the layers', () => {
  const layers = { tailwind: { display: ['badge', 'tag'] } };
  assert.deepEqual(validateStructure({ categories, layers }), [],
    'a component absent from a partial set of layers may simply live in one that was not passed');
});

test('a directory that is not kebab-case is a problem, even in the right category', () => {
  const layers = { tailwind: { display: ['Badge'] } };
  const problems = validateStructure({ categories, layers });
  assert.ok(problems.some((p) => /Badge/.test(p) && /kebab/.test(p)));
});

test('a component name declared in two categories is a problem, naming both -- and no layer tree is needed to find it', () => {
  // layers: {} means the only possible source of a problem is the
  // categories file itself, so this fails if the duplicate-name rule is
  // ever deleted rather than passing vacuously through the layer-comparison
  // codepath, which produces its own (different) message for this same
  // input once a layer tree is involved.
  const dupCategories = { display: ['Badge', 'Tag'], forms: ['Button', 'Tag'] };
  const problems = validateStructure({ categories: dupCategories, layers: {} });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Tag/);
  assert.match(problems[0], /display/);
  assert.match(problems[0], /forms/);
});

/* MIGRATED is gone, and this pair replaces the assertion that pinned it by
 * value. There is nothing left to pin a partial scope to: main() passes every
 * layer and `complete: true` unconditionally, so what is worth asserting is
 * that LAYERS is exhaustive rather than what its current members happen to be.
 * The second test is the one that would catch a fourth layer being added to
 * frameworks/ and not to LAYERS -- which is the only way a layer can now fall
 * out of this gate's scope, since a layer that MOVES is caught by
 * zeroLayerProblems instead. */
test('LAYERS names every framework layer, all of them migrated', () => {
  assert.deepEqual([...LAYERS].sort(), ['angular', 'react', 'tailwind']);
});

test('LAYERS is exhaustive against frameworks/ as it stands on disk', () => {
  const onDisk = readdirSync(join(repoRoot, 'frameworks'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  assert.deepEqual([...LAYERS].sort(), onDisk,
    'a layer directory exists that LAYERS does not name -- check:structure would skip it entirely');
});

/* kebab() is asserted DIRECTLY here as well as through the round trip below,
 * because a round trip passes whenever pascal() inverts whatever kebab() did --
 * including a wrong kebab. This is the one suite that owns the pair, and
 * check-api.test.mjs's header says so, so the direct assertions belong here
 * rather than in the file that merely imports them to build fixtures. */
test('kebab turns a component name into the Angular directory name', () => {
  assert.equal(kebab('AppLogo'), 'app-logo');
  assert.equal(kebab('StatCard'), 'stat-card');
  assert.equal(kebab('Breadcrumbs'), 'breadcrumbs');
});

test('pascal is kebab run backwards, for every directory name the tree carries', () => {
  assert.equal(pascal('activity-feed'), 'ActivityFeed');
  assert.equal(pascal('tag'), 'Tag');
  assert.equal(pascal('unauth-card'), 'UnauthCard');
  for (const name of ['ActivityFeed', 'Tag', 'UnauthCard', 'BarChart', 'PageHead', 'AppLogo'])
    assert.equal(pascal(kebab(name)), name);
});

test('a layer with zero component directories is a failure, not a clean pass', () => {
  // The regression this guards: readLayer() returns {} for a missing
  // frameworks/<layer>/components, and validateStructure({categories, layers: {tailwind: {}}})
  // returns [] for that empty tree -- so main() would print OK and exit 0 over a
  // layer it never looked at, exactly the failure check-tailwind.mjs's own
  // zero-manifest guard exists to catch.
  const problems = zeroLayerProblems({ tailwind: {} });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /0 component director/);
  assert.match(problems[0], /tailwind/);
});

test('a category with no component directories still counts as zero for its layer', () => {
  const problems = zeroLayerProblems({ tailwind: { display: [] } });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /0 component director/);
});

test('a non-empty layer has no zero-directory problem', () => {
  assert.deepEqual(zeroLayerProblems({ tailwind: { display: ['tag'] } }), []);
});

test('zeroLayerProblems is silent about a layer with no entry at all -- LAYERS, not this function, decides which layers are in scope', () => {
  assert.deepEqual(zeroLayerProblems({}), []);
});
