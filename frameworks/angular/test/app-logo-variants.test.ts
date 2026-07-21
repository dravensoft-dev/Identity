/* The Angular layer's test suite. See tag-variants.test.ts for why this
 * asserts the recipe directly rather than through a rendered component. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { appLogoStyles } from '../primitives/app-logo/app-logo.variants';

test('every size pairs a mark step with its wordmark step, and the four steps are distinct', () => {
  const seen = new Set<string>();
  for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
    const s = appLogoStyles({ size });
    assert.match(s.mark(), new RegExp(`size-logo-mark-${size}\\b`));
    assert.match(s.name(), new RegExp(`text-logo-${size}\\b`));
    const pair = `${s.mark()}|${s.name()}`;
    assert.ok(!seen.has(pair), `size="${size}" produced the same mark+name pair as an earlier step`);
    seen.add(pair);
  }
});

test('size moves the mark box and the wordmark together -- they are one decision, not two independent knobs', () => {
  const sm = appLogoStyles({ size: 'sm' });
  const xl = appLogoStyles({ size: 'xl' });
  assert.notEqual(sm.mark(), xl.mark(), 'the mark box did not change between sm and xl');
  assert.notEqual(sm.name(), xl.name(), 'the wordmark size did not change between sm and xl');
  // Changing only size must never move root or dim -- those are orientation's and the
  // static slot's job respectively, not size's.
  assert.equal(sm.root(), xl.root(), 'size must not change the root slot');
  assert.equal(sm.dim(), xl.dim(), 'size must not change the dim slot');
});

test('the default size is md', () => {
  assert.equal(appLogoStyles().mark(), appLogoStyles({ size: 'md' }).mark());
  assert.equal(appLogoStyles().name(), appLogoStyles({ size: 'md' }).name());
});

test('orientation changes the axis and the gap, nothing else', () => {
  const horizontal = appLogoStyles({ orientation: 'horizontal' });
  const vertical = appLogoStyles({ orientation: 'vertical' });
  assert.match(horizontal.root(), /flex-row/);
  assert.match(horizontal.root(), /gap-2\.5/);
  assert.match(vertical.root(), /flex-col/);
  assert.match(vertical.root(), /gap-3\b/);
  // Orientation must not reach into the mark or the wordmark sizing.
  assert.equal(horizontal.mark(), vertical.mark());
  assert.equal(horizontal.name(), vertical.name());
});

test('the default orientation is horizontal', () => {
  assert.equal(appLogoStyles().root(), appLogoStyles({ orientation: 'horizontal' }).root());
});

test('the mark slot stretches its projected child rather than sizing it', () => {
  assert.match(appLogoStyles().mark(), /\*:w-full/);
  assert.match(appLogoStyles().mark(), /\*:h-full/);
  assert.match(appLogoStyles().mark(), /\*:block/);
});

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(appLogoStyles().root(), /(?:^|\s)inline-flex(?=\s|$)/);
});

test('the wordmark is not danger-outline styling -- this is a brand mark, not a status surface', () => {
  const name = appLogoStyles().name();
  assert.doesNotMatch(name, /border-error/);
  assert.doesNotMatch(name, /\btext-error\b/);
});
