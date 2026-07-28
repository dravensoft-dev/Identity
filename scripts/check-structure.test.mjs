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
import { validateStructure, zeroLayerProblems, kebab, pascal, MIGRATED } from './check-structure.mjs';

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

test('a declared component missing from every layer is a problem once every layer is in', () => {
  const layers = { tailwind: { display: ['badge', 'tag'] } };
  const problems = validateStructure({ categories, layers, complete: true });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Button/);
});

test('the same tree is clean while layers are still unmigrated', () => {
  const layers = { tailwind: { display: ['badge', 'tag'] } };
  assert.deepEqual(validateStructure({ categories, layers }), [],
    'a component absent from the migrated layers may simply live in one this gate does not yet reach');
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

test('MIGRATED names the layers this gate currently reaches', () => {
  assert.deepEqual(MIGRATED, ['tailwind', 'angular']);
});

test('pascal is kebab run backwards, for every directory name the tree carries', () => {
  assert.equal(pascal('activity-feed'), 'ActivityFeed');
  assert.equal(pascal('tag'), 'Tag');
  assert.equal(pascal('unauth-card'), 'UnauthCard');
  for (const name of ['ActivityFeed', 'Tag', 'UnauthCard', 'BarChart', 'PageHead', 'AppLogo'])
    assert.equal(pascal(kebab(name)), name);
});

test('a MIGRATED layer with zero component directories is a failure, not a clean pass', () => {
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

test('zeroLayerProblems is silent about a layer with no entry at all -- MIGRATED, not this function, decides which layers are in scope', () => {
  assert.deepEqual(zeroLayerProblems({}), []);
});
