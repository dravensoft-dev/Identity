/* frameworks/Components.json is the one place a component's category is
 * declared. Every framework layer places its component directory in the
 * category this file names, and check:structure (scripts/check-structure.mjs)
 * is what holds them to it. This suite guards the file's own shape -- that it
 * is well-formed and internally consistent -- which check:structure assumes
 * rather than re-derives. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const categories = JSON.parse(readFileSync(join(repoRoot, 'frameworks/Components.json'), 'utf8'));

test('the six categories are exactly the React component group directories', () => {
  assert.deepEqual(Object.keys(categories).sort(), ['brand', 'charts', 'display', 'feedback', 'forms', 'navigation']);
});

test('every category name is a legal directory name under the new convention', () => {
  for (const name of Object.keys(categories)) assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test('every component name is PascalCase', () => {
  for (const names of Object.values(categories))
    for (const name of names) assert.match(name, /^[A-Z][A-Za-z0-9]*$/, `${name} is not PascalCase`);
});

test('no component is declared in two categories', () => {
  const seen = new Map();
  for (const [category, names] of Object.entries(categories))
    for (const name of names) {
      assert.equal(seen.has(name), false, `${name} is in both ${seen.get(name)} and ${category}`);
      seen.set(name, category);
    }
});

test('each category lists its components sorted, so a diff shows only what moved', () => {
  for (const [category, names] of Object.entries(categories))
    assert.deepEqual(names, [...names].sort(), `${category} is not sorted`);
});

test('the file declares all fifty components', () => {
  const total = Object.values(categories).reduce((n, names) => n + names.length, 0);
  assert.equal(total, 50);
});
