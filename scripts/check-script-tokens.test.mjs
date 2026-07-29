import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cssCounterpart, importedNames, catSlotEnumProblems } from './check-script-tokens.mjs';
import { buildScriptModules } from './build-tokens.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('cssCounterpart strips the unit from a px declaration', () => {
  assert.equal(cssCounterpart('280px'), 280);
});

test('cssCounterpart strips the unit from an ms declaration', () => {
  assert.equal(cssCounterpart('4200ms'), 4200);
});

test('cssCounterpart reads a bare zero, which is how a dimension renders at 0', () => {
  assert.equal(cssCounterpart('0'), 0);
});

test('cssCounterpart reads a unitless number', () => {
  assert.equal(cssCounterpart('1300'), 1300);
});

test('cssCounterpart returns null for a value that is not a bare number', () => {
  assert.equal(cssCounterpart('rgb(1,2,3)'), null);
  assert.equal(cssCounterpart('cubic-bezier(.2,.7,.3,1)'), null);
});

test('importedNames finds names in a braced import from the generated module', () => {
  const src = "import { chartHeight, chartPadLeft } from '../../Tokens.generated.js';";
  assert.deepEqual([...importedNames(src)].sort(), ['chartHeight', 'chartPadLeft']);
});

test('importedNames spans a multi-line import', () => {
  const src = [
    'import {',
    '  chartHeight,',
    '  chartBarRadius,',
    "} from '../../Tokens.generated.js';",
  ].join('\n');
  assert.deepEqual([...importedNames(src)].sort(), ['chartBarRadius', 'chartHeight']);
});

test('importedNames ignores an import from anything else', () => {
  const src = "import { catColor } from './chart-internals.js';";
  assert.deepEqual([...importedNames(src)], []);
});

test('catSlots is derived from the ramp and equals its slot count', async () => {
  const modules = await buildScriptModules();
  const body = modules.get('frameworks/react/Tokens.generated.js');
  assert.match(body, /^export const catSlots = 8;$/m);
});

/* CatSlot is the only contract type restating a token-derived bound, and this
 * assertion is the tie back to the palette that api/README.md's "A closed set of
 * values is not always an enum" passage requires of it. */
test('catSlotEnumProblems accepts 1..N in order', () => {
  assert.deepEqual(catSlotEnumProblems(8, [1, 2, 3, 4, 5, 6, 7, 8]), []);
});

test('catSlotEnumProblems rejects a set the ramp has outgrown', () => {
  const [problem] = catSlotEnumProblems(9, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(problem, /has 9 slot\(s\)/);
});

test('catSlotEnumProblems rejects a set longer than the ramp', () => {
  assert.equal(catSlotEnumProblems(8, [1, 2, 3, 4, 5, 6, 7, 8, 9]).length, 1);
});

test('catSlotEnumProblems rejects the right values out of order', () => {
  assert.equal(catSlotEnumProblems(3, [1, 3, 2]).length, 1);
});

test('catSlotEnumProblems rejects a non-array', () => {
  assert.equal(catSlotEnumProblems(8, undefined).length, 1);
});

test('the committed CatSlot matches the ramp the tokens are built from', async () => {
  const modules = await buildScriptModules();
  const body = modules.get('frameworks/react/Tokens.generated.js');
  const catSlots = Number(/^export const catSlots = (\d+);$/m.exec(body)[1]);
  const catSlot = JSON.parse(readFileSync(join(root, 'contracts/api/types/cat-slot.json'), 'utf8'));
  assert.deepEqual(catSlotEnumProblems(catSlots, catSlot.values), []);
});
