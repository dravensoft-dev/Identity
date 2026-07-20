/* The Angular layer's test suite. Its primitives are standalone OnPush
 * components with no `styles` of their own -- every visual decision lives in
 * the tailwind-variants recipe beside them, which is plain TypeScript and
 * testable with no Angular runtime at all. That is the layer's own design
 * paying off: what is worth asserting is the recipe, not the wrapper.
 *
 * Plan 5a's primitives each add a file here beside this one. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { tagStyles } from '../primitives/tag/tag.variants';

test('the default tone is neutral', () => {
  assert.equal(tagStyles().root(), tagStyles({ tone: 'neutral' }).root());
});

test('danger is outline -- border and text in --error, never a filled background', () => {
  const root = tagStyles({ tone: 'danger' }).root();
  assert.match(root, /border-error/);
  assert.match(root, /text-error/);
  assert.doesNotMatch(root, /\bbg-error/);
});

test('every tone keeps the shared base classes', () => {
  for (const tone of ['neutral', 'primary', 'success', 'warning', 'danger'] as const) {
    assert.match(tagStyles({ tone }).root(), /rounded-pill/);
  }
});
