import test from 'node:test';
import assert from 'node:assert/strict';
import { tagStyles } from './Tag.variants';

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

test('every tone keeps text-ctl-xs, which an unregistered font-size suffix would lose to the tone color', () => {
  for (const tone of ['neutral', 'primary', 'success', 'warning', 'danger'] as const) {
    const root = tagStyles({ tone }).root().split(/\s+/);
    assert.ok(root.includes('text-ctl-xs'), `tone ${tone}: text-ctl-xs missing from "${root.join(' ')}"`);
  }
});
