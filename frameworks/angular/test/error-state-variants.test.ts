/* See tag-variants.test.ts for why this suite lives here rather than under
 * scripts/: node cannot resolve the extensionless imports this layer's
 * recipes use. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { errorStateStyles } from '../primitives/error-state/error-state.variants';

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(errorStateStyles().root(), /\bflex\b/);
});

test('the border is solid danger, at the soft tint -- the visual distinction from arena-empty-state, whose border is dashed neutral', () => {
  const root = errorStateStyles().root();
  assert.match(root, /border-error\b/);
  assert.doesNotMatch(root, /border-dashed/);
  assert.match(root, /bg-error\/14/);
});

test('danger stays a soft resting tint, never the full-strength fill -- this is a non-interactive status surface at rest, not a risk trigger', () => {
  assert.doesNotMatch(errorStateStyles().root(), /\bbg-error\b(?!\/)/);
  assert.doesNotMatch(errorStateStyles().root(), /bg-error-fill/);
});

test('the actions slot carries the spacing React\'s marginTop applies above the actions row', () => {
  assert.match(errorStateStyles().actions(), /\bmt-1\.5\b/);
});

test('every slot resolves with no variant argument -- icon, title, message and code are free text, never enumerable classes', () => {
  const styles = errorStateStyles();
  for (const slot of ['root', 'icon', 'title', 'message', 'code', 'actions'] as const) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});
