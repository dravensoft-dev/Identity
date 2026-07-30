/* No DOM and no TestBed: assertions about the recipe alone. The one that matters most is the
 * negative -- this control carries no crimson, because it is a filter and a filter never outweighs
 * the action beside it. The selected segment lifts on the neutral surface instead. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { segmentedControlStyles } from './SegmentedControl.variants';

test('the default is an md track with nothing selected', () => {
  assert.equal(
    segmentedControlStyles().segment(),
    segmentedControlStyles({ size: 'md', selected: false }).segment(),
  );
});

test('the selected segment lifts on the neutral surface and carries no crimson at all', () => {
  const on = segmentedControlStyles({ selected: true }).segment();
  assert.match(on, /bg-neutral/);
  assert.match(on, /font-semibold/);
  assert.match(on, /shadow-1/);

  for (const selected of [true, false]) {
    const segment = segmentedControlStyles({ selected }).segment();
    assert.doesNotMatch(segment, /primary/,
      `selected=${selected} reached for the brand; a filter never outweighs the action beside it`);
  }
  assert.doesNotMatch(segmentedControlStyles().track(), /primary/);
});

test('the unselected segment is transparent and only warms on hover', () => {
  const off = segmentedControlStyles({ selected: false }).segment();
  assert.match(off, /bg-transparent/);
  assert.match(off, /text-base-content\/62/);
  assert.match(off, /hover:text-base-content\/82/);
});

test('the track rings on focus-within, because the focusable element is the hidden input', () => {
  const track = segmentedControlStyles().track();
  assert.match(track, /focus-within:border-secondary/);
  assert.match(track, /focus-within:ring-secondary/,
    'the ring has to be on the track: the input it belongs to is opacity-0 and size-0');
});

test('both sizes sit below Button on purpose, and each keeps its own height and type step', () => {
  const seen = (['sm', 'md'] as const).map((size) => {
    const segment = segmentedControlStyles({ size }).segment();
    return [/\bh-\d(?:\.\d)?\b/.exec(segment)?.[0], /text-ctl-(?:sm|md)\b/.exec(segment)?.[0]];
  });
  assert.deepEqual(seen, [['h-7', 'text-ctl-sm'], ['h-8.5', 'text-ctl-md']]);
});

test('the track is a display utility, because the host binds it', () => {
  assert.match(segmentedControlStyles().track(), /inline-flex/);
});

test('the native input is hidden by the recipe rather than by display:none, so it stays focusable', () => {
  const input = segmentedControlStyles().input();
  assert.match(input, /opacity-0/);
  assert.match(input, /size-0/);
  assert.doesNotMatch(input, /\bhidden\b/);
});

test('the segments and the track keep separate radii, so the inner one nests', () => {
  assert.match(segmentedControlStyles().track(), /rounded-sm/);
  assert.match(segmentedControlStyles().segment(), /rounded-xs/);
});
