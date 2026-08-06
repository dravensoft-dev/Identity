import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXTERNAL_PROPERTIES, MANIFEST_FETCH, THEME_NAMESPACES, collect, preludeProblems, propertiesIn,
  selectorsIn, themeLeaks,
} from './check-component-css.ts';
import { sheetPath } from '../../build/tailwind/build-tailwind.ts';

test('the gate runs green over the tree as it stands', () => {
  const { manifests, problems } = collect();
  assert.ok(manifests.size > 0, 'no manifest was read, so a green run would prove nothing');
  assert.deepEqual(problems, []);
});

test('a specimen\'s fetches are read whatever path they take, since the sheet it needs is the component\'s', () => {
  const html = "await fetch('./ArenaUnauthCard.manifest.json'); await fetch( \"../../brand/arena-app-logo/ArenaAppLogo.manifest.json\" )";
  assert.deepEqual([...html.matchAll(MANIFEST_FETCH)].map((m) => m[2]), ['ArenaUnauthCard', 'ArenaAppLogo']);
});

test('a stylesheet lands under consume/, at the manifest\'s own category and directory', () => {
  assert.equal(
    sheetPath('frameworks/tailwind/components/display/arena-badge/ArenaBadge.manifest.json'),
    'frameworks/tailwind/consume/components/display/arena-badge/ArenaBadge.styles.generated.css',
  );
});

test('only arena- selectors are collected, so a stray utility cannot be counted as a component rule', () => {
  assert.deepEqual([...selectorsIn('.arena-badge__root:hover { } .px-4 { }')], ['arena-badge__root']);
});

test('a property is collected wherever it is read, including inside calc and a fallback', () => {
  const found = propertiesIn('gap: calc(var(--sp-1) * 2); color: var(--tw-x, var(--y))');
  assert.deepEqual([...found].sort(), ['sp-1', 'tw-x', 'y']);
});

test('a Tailwind theme property is a leak, and an Arena token that merely looks like one is not', () => {
  assert.deepEqual(themeLeaks('gap: var(--spacing-3)'), ['spacing-3']);
  assert.deepEqual(themeLeaks('border-radius: var(--radius-pill)'), ['radius-pill']);
  assert.deepEqual(themeLeaks('gap: var(--sp-3)'), [], 'the Arena token is the stripped form and is what should be there');
  assert.deepEqual(themeLeaks('transition-timing-function: var(--ease-out)'), [],
    'ease is a Tailwind namespace AND an Arena token name, so it is deliberately not on the list');
  assert.ok(!THEME_NAMESPACES.includes('ease'));
  assert.ok(!THEME_NAMESPACES.includes('color'), 'so is color, for the same reason');
  assert.ok(!THEME_NAMESPACES.includes('shadow'), 'and shadow');
  assert.ok(!THEME_NAMESPACES.includes('font'), 'and font');
});

test('the prelude is held to the three things whose absence is silent', () => {
  const missing = preludeProblems('/nowhere');
  assert.equal(missing.length, 1);
  assert.match(missing[0], /every border and every focus ring is invalid/);
  assert.deepEqual(preludeProblems(), []);
});

test('every external property carries a reason, because an entry with none cannot be judged stale', () => {
  assert.ok(EXTERNAL_PROPERTIES.size > 0);
  for (const [name, reason] of EXTERNAL_PROPERTIES) {
    assert.ok(reason && reason.length > 10, `--${name} has no usable reason`);
  }
});
