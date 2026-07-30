/* No DOM and no TestBed: these are assertions about the recipe alone. The tone tests exist
 * because tailwind-merge drops an unregistered suffix, so a size utility can lose silently
 * to a variant's own padding -- see Tv.ts's ARENA_SPACING_SUFFIXES. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buttonStyles } from './Button.variants';

test('the default is a primary md button that does not stretch', () => {
  assert.equal(buttonStyles().root(), buttonStyles({ variant: 'primary', size: 'md', full: false }).root());
});

test('danger is outline -- border and text in --error, and its only error fill is a hover wash', () => {
  const root = buttonStyles({ variant: 'danger' });
  assert.match(root.root(), /border-error/);
  assert.match(root.root(), /text-error/);
  assert.match(root.root(), /bg-transparent/);

  const errorFills = root.root().split(/\s+/).filter((c) => c.startsWith('bg-error'));
  assert.deepEqual(errorFills, [],
    'an unprefixed bg-error would be a filled danger surface; the hover: wash is state, not the resting surface');
});

test('primary is the one filled variant, and it fills with the brand rather than a status colour', () => {
  const root = buttonStyles({ variant: 'primary' }).root();
  assert.match(root, /bg-primary/);
  assert.match(root, /text-primary-content/);
});

test('every variant keeps the shared control geometry through the merge', () => {
  for (const variant of ['primary', 'secondary', 'ghost', 'danger'] as const) {
    const root = buttonStyles({ variant }).root();
    assert.match(root, /rounded-sm/, `${variant} lost its radius`);
    assert.match(root, /inline-flex/, `${variant} lost its display utility`);
    assert.match(root, /h-ctl-h\b/, `${variant} lost the md density height`);
  }
});

test('each size keeps its own density height rather than merging into one', () => {
  const heights = (['sm', 'md', 'lg'] as const).map((size) => {
    const match = /h-ctl-h(?:-sm|-lg)?/.exec(buttonStyles({ size }).root());
    return match?.[0];
  });
  assert.deepEqual(heights, ['h-ctl-h-sm', 'h-ctl-h', 'h-ctl-h-lg']);
});

test('full stretches to the container and its absence pins the width to the content', () => {
  assert.match(buttonStyles({ full: true }).root(), /\bw-full\b/);
  assert.match(buttonStyles({ full: false }).root(), /\bw-auto\b/);
});

test('the spinner slot carries the reduced-motion-aware utility, which is where that answer lives', () => {
  assert.match(buttonStyles().spinner(), /arena-btn-spin/);
});
