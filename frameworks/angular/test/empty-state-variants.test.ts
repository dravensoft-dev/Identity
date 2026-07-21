/* See tag-variants.test.ts for why this suite lives here rather than under
 * scripts/: node cannot resolve the extensionless imports this layer's
 * recipes use. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyStateStyles } from '../primitives/empty-state/empty-state.variants';

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(emptyStateStyles().root(), /\bflex\b/);
});

test('the border is dashed -- the visual distinction from arena-error-state, whose border is solid', () => {
  assert.match(emptyStateStyles().root(), /\bborder-dashed\b/);
});

test('the root has no danger coloring -- an empty state is neutral, never an error surface', () => {
  assert.doesNotMatch(emptyStateStyles().root(), /error/);
});

test('the action slot carries the spacing React\'s marginTop applies above a present action', () => {
  assert.match(emptyStateStyles().action(), /\bmt-1\.5\b/);
});

test('every slot resolves with no variant argument -- icon, title and message are free text, never enumerable classes', () => {
  const styles = emptyStateStyles();
  for (const slot of ['root', 'icon', 'title', 'message', 'action'] as const) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});
