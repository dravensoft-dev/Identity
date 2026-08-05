import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { componentMap, angularComponentMap, reactComponentMap, sheetOf, close, MAP_FILE } from './component-map.mjs';
import { manifestFiles } from '../tailwind/tailwind-compile.mjs';
import { kebab } from './layers.mjs';
import { repoRoot } from './repo-root.mjs';

const shipped = manifestFiles(join(repoRoot, 'frameworks', 'tailwind', 'components'))
  .map((file) => kebab(basename(file).split('.')[0]));

test('the file both packages carry the map as is named once', () => {
  assert.equal(MAP_FILE, 'components.json');
});

for (const [layer, match] of [['angular', 'selector'], ['react', 'symbol']]) {
  test(`${layer} keys every component by what a consumer of that layer writes`, () => {
    const map = componentMap(layer, repoRoot);
    assert.equal(map.match, match);
    assert.ok(Object.keys(map.draws).length >= 50, `${Object.keys(map.draws).length} key(s) is not a whole library`);
  });

  test(`${layer} names no sheet this package does not ship`, () => {
    const map = componentMap(layer, repoRoot);
    const invented = [...new Set(Object.values(map.draws).filter(Boolean))].filter((s) => !shipped.includes(s));
    assert.deepEqual(invented, [], 'a name here fails the command it is written for, which is worse than no map');
  });

  test(`${layer} claims every sheet the package ships, so no component is unreachable by auto`, () => {
    const map = componentMap(layer, repoRoot);
    const claimed = new Set(Object.values(map.draws).filter(Boolean));
    assert.deepEqual(shipped.filter((s) => !claimed.has(s)), [],
      'a sheet no key resolves to can never enter a subset, and the component wearing it renders unstyled');
  });

  test(`${layer} closes what Arena draws for the consumer, and a table is the case that proves it`, () => {
    const { needs } = componentMap(layer, repoRoot);
    assert.deepEqual(needs.table, ['pagination', 'select'],
      'a table renders both, and a subset naming table alone is a paginated table with no pagination');
    for (const [sheet, pulled] of Object.entries(needs)) {
      assert.ok(!pulled.includes(sheet), `${sheet} needs itself, so the closure did not drop the self edge`);
    }
  });
}

test('a component with no manifest of its own resolves to no sheet, which is what a chart is', () => {
  const angular = componentMap('angular', repoRoot);
  const react = componentMap('react', repoRoot);
  assert.equal(angular.draws['arena-bar-chart'], null);
  assert.equal(react.draws.BarChart, null);
  assert.ok('arena-bar-chart' in angular.draws, 'it is placed and costs nothing, which is not the same as unplaced');
});

test('a component wears its parent\'s sheet, because 43 sheets dress 55 components', () => {
  const angular = componentMap('angular', repoRoot);
  const react = componentMap('react', repoRoot);
  assert.equal(angular.draws['arena-side-nav-item'], 'side-nav');
  assert.equal(angular.draws['arena-table-row'], 'table');
  assert.equal(react.draws.SideNavItem, 'side-nav');
  assert.equal(react.draws.TableRow, 'table');
});

test('the two layers differ in fact rather than in spelling, which is why each carries its own map', () => {
  const angular = componentMap('angular', repoRoot);
  const react = componentMap('react', repoRoot);
  assert.deepEqual(react.needs['confirm-dialog'], ['button'], 'React renders a Button inside it');
  assert.equal(angular.needs['confirm-dialog'], undefined, 'Angular draws its own, out of its own manifest');
});

test('a layer nothing assembles is refused rather than answered with an empty map', () => {
  assert.throws(() => componentMap('svelte', repoRoot), /no map is derived for a layer called "svelte"/);
});

test('the manifest a source reads is followed across directories, not only beside it', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-map-'));
  mkdirSync(join(root, 'side-nav-item'));
  mkdirSync(join(root, 'side-nav'));
  writeFileSync(join(root, 'side-nav', 'SideNav.variants.ts'),
    "import manifest from './SideNav.classes.generated';\nexport const sideNavStyles = arenaStyles(manifest);\n");
  const file = join(root, 'side-nav-item', 'SideNavItem.ts');
  assert.equal(sheetOf(file, "import { sideNavStyles } from '../side-nav/SideNav.variants';"), 'side-nav');
  assert.equal(sheetOf(file, 'import { Component } from "@angular/core";'), null);
  rmSync(root, { recursive: true });
});

test('a chain of needs is walked to the end, so a sheet two hops away still ships', () => {
  assert.deepEqual(close({ a: ['b'], b: ['c'], c: [] }), { a: ['b', 'c'], b: ['c'] });
  assert.deepEqual(close({ a: ['b'], b: ['a'] }), { a: ['b'], b: ['a'] }, 'a cycle terminates rather than hanging');
});

test('both maps are derived from the layer they describe and nothing else', () => {
  assert.notDeepEqual(angularComponentMap(repoRoot).draws, reactComponentMap(repoRoot).draws);
});
