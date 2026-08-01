/* No DOM and no TestBed: assertions about the recipe alone. The showLabel axis is where this
 * recipe differs from Button's -- the manifest's variant keys are the strings "true"/"false"
 * while its defaultVariants are real booleans, so tv() is what reconciles the two. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { iconButtonStyles } from './IconButton.variants';

test('the default is a ghost md control with no visible label', () => {
  assert.equal(
    iconButtonStyles().root(),
    iconButtonStyles({ variant: 'ghost', size: 'md', showLabel: false }).root(),
  );
});

test('ghost is transparent with a hairline; solid is the one filled variant, and it fills with the brand', () => {
  const ghost = iconButtonStyles({ variant: 'ghost' }).root();
  assert.match(ghost, /bg-transparent/);
  assert.match(ghost, /border-base-300/);

  const solid = iconButtonStyles({ variant: 'solid' }).root();
  assert.match(solid, /bg-primary/);
  assert.match(solid, /text-primary-content/);
});

test('every variant keeps the shared control geometry through the merge', () => {
  for (const variant of ['ghost', 'solid'] as const) {
    const root = iconButtonStyles({ variant }).root();
    assert.match(root, /rounded-sm/, `${variant} lost its radius`);
    assert.match(root, /inline-flex/, `${variant} lost its display utility`);
    assert.match(root, /h-ctl-h\b/, `${variant} lost the md density height`);
  }
});

test('each size keeps its own density height and a matching minimum width, so the box stays square', () => {
  const seen = (['sm', 'md', 'lg'] as const).map((size) => {
    const root = iconButtonStyles({ size }).root();
    return [/h-ctl-h(?:-sm|-lg)?/.exec(root)?.[0], /min-w-ctl-h(?:-sm|-lg)?/.exec(root)?.[0]];
  });
  assert.deepEqual(seen, [
    ['h-ctl-h-sm', 'min-w-ctl-h-sm'],
    ['h-ctl-h', 'min-w-ctl-h'],
    ['h-ctl-h-lg', 'min-w-ctl-h-lg'],
  ]);
});

test('showLabel opens the box out and gives the glyph a gap; without it the control has neither', () => {
  const shown = iconButtonStyles({ showLabel: true }).root();
  assert.match(shown, /\bw-auto\b/);
  assert.match(shown, /\bgap-2\b/);

  const hidden = iconButtonStyles({ showLabel: false }).root();
  assert.match(hidden, /\bp-0\b/);
  assert.match(hidden, /\bgap-0\b/);
});

test('the disabled treatment is a :disabled variant, which only a real disabled control matches', () => {
  const root = iconButtonStyles().root();
  assert.match(root, /disabled:opacity-45/);
  assert.match(root, /disabled:cursor-not-allowed/);
});

test('the pressed treatment is the accent tint a current SideNav item takes, not a second convention', () => {
  const on = iconButtonStyles({ pressed: true }).root();
  assert.match(on, /bg-primary\/14/);
  assert.match(on, /text-primary\b/);
  assert.doesNotMatch(iconButtonStyles({ pressed: false }).root(), /bg-primary\/14/);
});
