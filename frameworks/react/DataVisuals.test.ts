import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAT_SLOTS, catColor, catSlotFor, catSurface, areaFill, toneColor,
} from './DataVisuals.ts';
import type { ArenaSeriesTone, ArenaTone } from './Api.generated';

test('every tone in the union resolves to a token reference', () => {
  const tones: ArenaTone[] = ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'];
  for (const tone of tones) assert.match(toneColor(tone), /^var\(--[a-z-]+\)$/);
  assert.equal(new Set(tones.map(toneColor)).size, tones.length, 'tones must not share a colour');
});

test('every ArenaSeriesTone is an ArenaTone, so a chart keeps reaching the same colour it always did', () => {
  const series: ArenaSeriesTone[] = ['success', 'warning', 'danger', 'info'];
  for (const tone of series) assert.equal(toneColor(tone), toneColor(tone as ArenaTone));
});

test('catSlotFor lands inside the ramp for every key, including an empty one', () => {
  for (const key of ['', 'a', 'arena', 'SKU-1042', 'ñ', '日本', 'x'.repeat(500)]) {
    const slot = catSlotFor(key);
    assert.ok(Number.isInteger(slot) && slot >= 1 && slot <= CAT_SLOTS, `catSlotFor(${key}) = ${slot}`);
  }
});

test('catSlotFor gives the same key the same slot every time', () => {
  assert.equal(catSlotFor('SKU-1042'), catSlotFor('SKU-1042'));
});

test('catSlotFor spreads over the ramp by these pinned vectors', () => {
  assert.deepEqual(
    ['a', 'arena', 'SKU-1042', 'SKU-1043', 'cliente-7'].map(catSlotFor),
    [2, 8, 6, 7, 5],
    'the numbers are pinned rather than derived because the point of the function is that one key '
    + 'always draws the same colour: a ninth slot in the --color-cat-* ramp moves every one of them, '
    + 'and re-deriving them here would assert nothing at all',
  );
});

test('catSurface tints from the slot colour, and the edge is the stronger of the two', () => {
  const surface = catSurface(3);
  assert.equal(surface.fill, `color-mix(in oklab, ${catColor(3)} 12%, var(--color-base-100))`);
  assert.equal(surface.border, `color-mix(in oklab, ${catColor(3)} 26%, transparent)`);
});

test('areaFill is the tint LineChart draws under its series', () => {
  assert.equal(areaFill('var(--success)'), 'color-mix(in oklab, var(--success) 18%, transparent)');
});
