/* No DOM and no TestBed: assertions about the recipe alone, plus the two key builders beside it.
 * `footprint` and `thumb` exist because the track's box depends on BOTH orientation and size, and
 * the knob's travel on BOTH state and orientation -- genuine compound variants, flattened into
 * enumerated ones because ManifestClasses.js (the Tailwind specimen harness) supports no
 * compoundVariants. The component computes the crossed key; these tests pin how. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { footprintFor, thumbFor } from './Switch';
import { switchStyles } from './Switch.variants';

const SIZES = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

test('the default is a horizontal md switch that is off and enabled', () => {
  assert.equal(
    switchStyles().track(),
    switchStyles({
      size: 'md', orientation: 'horizontal', checked: false, disabled: false,
      footprint: 'horizontal-md', thumb: 'off-horizontal',
    }).track(),
  );
});

test('footprintFor crosses orientation with size, and every key it can build exists in the recipe', () => {
  assert.equal(footprintFor('horizontal', 'md'), 'horizontal-md');
  assert.equal(footprintFor('vertical', '2xl'), 'vertical-2xl');

  for (const orientation of ['horizontal', 'vertical'] as const) {
    for (const size of SIZES) {
      const track = switchStyles({ footprint: footprintFor(orientation, size) }).track();
      assert.match(track, /\bw-\d/, `${orientation}-${size} produced no track width`);
      assert.match(track, /\bh-\d/, `${orientation}-${size} produced no track height`);
    }
  }
});

test('a horizontal track is wider than it is tall and a vertical one is the transpose', () => {
  const horizontal = switchStyles({ footprint: 'horizontal-md' }).track();
  assert.match(horizontal, /\bw-10\b/);
  assert.match(horizontal, /\bh-5\.5\b/);

  const vertical = switchStyles({ footprint: 'vertical-md' }).track();
  assert.match(vertical, /\bw-5\.5\b/);
  assert.match(vertical, /\bh-10\b/);
});

test('thumbFor crosses state with orientation, and the knob travels on the matching axis', () => {
  assert.equal(thumbFor(false, 'horizontal'), 'off-horizontal');
  assert.equal(thumbFor(true, 'horizontal'), 'on-horizontal');
  assert.equal(thumbFor(true, 'vertical'), 'on-vertical');

  assert.match(switchStyles({ thumb: 'on-horizontal' }).knob(), /translate-x-full/);
  assert.match(switchStyles({ thumb: 'off-horizontal' }).knob(), /translate-x-0/);
  assert.match(switchStyles({ thumb: 'on-vertical' }).knob(), /translate-y-full/);
  assert.match(switchStyles({ thumb: 'off-vertical' }).knob(), /translate-y-0/);
});

test('checked fills the track with the brand; off is the neutral surface', () => {
  assert.match(switchStyles({ checked: true }).track(), /bg-primary/);
  assert.match(switchStyles({ checked: false }).track(), /bg-neutral/);
});

test('each size gives the knob its own square and the glyph its own type size', () => {
  const knobs = SIZES.map((size) => /\bsize-\d(?:\.\d)?\b/.exec(switchStyles({ size }).knob())?.[0]);
  assert.deepEqual(knobs, ['size-3.5', 'size-4.5', 'size-5.5', 'size-6.5', 'size-7.5']);

  for (const size of SIZES) {
    assert.match(switchStyles({ size }).icon(), /text-\[length:calc\(var\(--sp-1\)/,
      `${size}'s glyph size is not a token expression`);
  }
});

test('the glyph is inked against the knob it sits on, not against the page it inherits from', () => {
  assert.match(switchStyles().icon(), /\btext-primary\b/,
    'the knob is bg-primary-content, so an uncoloured glyph inherits the page ink and vanishes on it; '
    + 'this is the same pair check:text-contrast already gates at 4.5, read the other way round');
  assert.match(switchStyles().knob(), /bg-primary-content/);
});

test('disabled dims the whole control, and the track carries the :disabled cursor itself', () => {
  assert.match(switchStyles({ disabled: true }).root(), /opacity-50/);
  assert.match(switchStyles().track(), /disabled:cursor-not-allowed/);
});

test('the track and knob keep the pill radius, which is what makes it read as a switch', () => {
  assert.match(switchStyles().track(), /rounded-pill/);
  assert.match(switchStyles().knob(), /rounded-pill/);
});

test('the root carries a display utility, because the host binds it', () => {
  assert.match(switchStyles().root(), /inline-flex/);
});
