import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateStructure, zeroLayerProblems } from './check-structure.mjs';
import { kebab, pascal, LAYERS, NON_LAYERS } from '../../lib/arena/layers.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

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

  const dupCategories = { display: ['Badge', 'Tag'], forms: ['Button', 'Tag'] };
  const problems = validateStructure({ categories: dupCategories, layers: {} });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Tag/);
  assert.match(problems[0], /display/);
  assert.match(problems[0], /forms/);
});

test('LAYERS names every framework layer, all of them migrated', () => {
  assert.deepEqual([...LAYERS].sort(), ['angular', 'react', 'tailwind']);
});

test('every directory under frameworks/ is a declared layer or a declared non-layer', () => {
  const onDisk = readdirSync(join(repoRoot, 'frameworks'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  assert.deepEqual([...LAYERS, ...NON_LAYERS.keys()].sort(), onDisk,
    'a directory under frameworks/ is neither a layer LAYERS names nor a non-layer NON_LAYERS explains -- '
    + 'check:structure would skip it entirely, and nothing would say so');
});

test('every non-layer carries a reason, so the escape hatch cannot be used silently', () => {
  for (const [name, reason] of NON_LAYERS) {
    assert.ok(reason.length > 20, `${name} is declared a non-layer with no reason worth reading`);
    assert.ok(!LAYERS.includes(name), `${name} is declared both a layer and a non-layer`);
  }
});

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
