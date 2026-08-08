import test from 'node:test';
import assert from 'node:assert/strict';
import { theme, THEMES, PALETTE } from './check-ramp.ts';

const SLOTS = ['#884da9', '#00a3c0', '#6a59bc', '#c0392b', '#27ae60', '#d35400', '#2980b9', '#8e44ad'];

const sheet = (extra = '') => `:root {\n${
  SLOTS.map((hex, i) => `  --color-cat-${i + 1}: ${hex};`).join('\n')
}\n  --color-base-200: #1d1715;\n${extra}}\n`;

test('a theme is its eight slots and the surface they are measured against', () => {
  assert.deepEqual(theme(sheet(), ':root'), { ramp: SLOTS, surface: '#1d1715' });
});

test('a selector that is not in the sheet is named, never treated as an empty theme', () => {
  assert.throws(() => theme(sheet(), '\\.arena-light'), /no \\.arena-light block found/,
    'an absent theme resolving to no slots would clear every gate by measuring nothing');
});

test('a slot that is not a #rrggbb literal is named by its own custom property', () => {
  const unresolved = sheet().replace('--color-cat-3: #6a59bc;', '--color-cat-3: var(--brand);');
  assert.throws(() => theme(unresolved, ':root'), /--color-cat-3 missing or not a #rrggbb literal/);
});

test('both themes are measured, and the palette they are read from is named once', () => {
  assert.deepEqual(THEMES.map((t) => t.name), ['dark', 'light']);
  assert.deepEqual(THEMES.map((t) => t.mode), ['dark', 'light']);
  assert.match(PALETTE, /^contracts\/design-generated\//,
    'the gate reads the generated palette and never contracts/design/, because the ramp it holds '
    + 'is the one a browser is served');
});
