import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cssCounterpart, importedNames } from './check-script-tokens.mjs';
import { buildScriptModules } from './build-tokens.mjs';

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
  const src = "import { chartHeight, chartPadLeft } from '../../tokens.generated.js';";
  assert.deepEqual([...importedNames(src)].sort(), ['chartHeight', 'chartPadLeft']);
});

test('importedNames spans a multi-line import', () => {
  const src = [
    'import {',
    '  chartHeight,',
    '  chartBarRadius,',
    "} from '../../tokens.generated.js';",
  ].join('\n');
  assert.deepEqual([...importedNames(src)].sort(), ['chartBarRadius', 'chartHeight']);
});

test('importedNames ignores an import from anything else', () => {
  const src = "import { catColor } from './chart-internals.js';";
  assert.deepEqual([...importedNames(src)], []);
});

test('catSlots is derived from the ramp and equals its slot count', async () => {
  const modules = await buildScriptModules();
  const body = modules.get('frameworks/react/tokens.generated.js');
  assert.match(body, /^export const catSlots = 8;$/m);
});
