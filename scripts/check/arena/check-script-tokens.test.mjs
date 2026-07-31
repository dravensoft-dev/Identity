import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cssCounterpart, importedNames, catSlotEnumProblems, zeroGeneratedCssProblems, cssDiscoveryProblems } from './check-script-tokens.mjs';
import { buildScriptModules } from '../../generate/arena/generate-tokens.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

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

test('zero generated CSS files is one named failure, not a 21-line cascade', () => {
  const problems = zeroGeneratedCssProblems(0);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /0 /);
  assert.match(problems[0], /design-generated/);
});

test('a populated design-generated directory has no zero problem', () => {
  assert.deepEqual(zeroGeneratedCssProblems(5), []);
});

test('cssDiscoveryProblems: no prior problems, populated directory -- continue', () => {
  assert.deepEqual(cssDiscoveryProblems([], 5), []);
});

test('cssDiscoveryProblems: a prior drift problem, populated directory -- still continue, not gated by an unrelated finding', () => {
  assert.deepEqual(cssDiscoveryProblems(['frameworks/react/Tokens.generated.js: stale — run bun run build:tokens'], 5), []);
});

test('cssDiscoveryProblems: no prior problems, empty directory -- the CSS-discovery line alone', () => {
  assert.deepEqual(
    cssDiscoveryProblems([], 0),
    ['found 0 .css files in contracts/design-generated — an empty result set is a failure, not a clean pass; check the discovery path'],
  );
});

test('cssDiscoveryProblems: a prior drift problem AND an empty directory -- both are reported, not just the CSS-discovery line', () => {
  const drift = 'frameworks/react/Tokens.generated.js: stale — run bun run build:tokens';
  const result = cssDiscoveryProblems([drift], 0);
  assert.equal(result.length, 2);
  assert.equal(result[0], drift);
  assert.match(result[1], /found 0 .css files/);
});
