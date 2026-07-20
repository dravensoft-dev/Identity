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

/* Moved here from scripts/tv-merge.test.mjs, which proves the same property
 * against synthetic class strings but cannot import this recipe: scripts/ is
 * the suite that must also run under plain node, and node cannot resolve the
 * extensionless `from '../../../tailwind/tv'` that this layer's files use.
 *
 * What it guards: `text-ctl-xs` is an Arena font-size suffix, and
 * tailwind-merge classifies a bare `text-*` suffix it does not recognise as a
 * text COLOR. Unregistered, `text-ctl-xs` and the tone's own `text-*` color
 * land in one conflict group and whichever is concatenated later deletes the
 * other outright — silently, in the rendered class string. This is the
 * assertion against a real manifest-driven recipe rather than a bench. */
test('every tone keeps text-ctl-xs, which an unregistered font-size suffix would lose to the tone color', () => {
  for (const tone of ['neutral', 'primary', 'success', 'warning', 'danger'] as const) {
    const root = tagStyles({ tone }).root().split(/\s+/);
    assert.ok(root.includes('text-ctl-xs'), `tone ${tone}: text-ctl-xs missing from "${root.join(' ')}"`);
  }
});
