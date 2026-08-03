import test from 'node:test';
import assert from 'node:assert/strict';
import { toastStyles } from './Toast.variants';
import { TOAST_DISMISS } from './Toast';
import { dismissDefault, dismissActionable } from '../../../Tokens.generated';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('only root and action vary with tone -- the body, title, pinned marker, message and close are constant', () => {
  const neutral = toastStyles({ tone: 'neutral' });
  const danger = toastStyles({ tone: 'danger' });
  for (const slot of ['body', 'title', 'pinned', 'message', 'close'] as const) {
    assert.equal(neutral[slot](), danger[slot](), `${slot} must not vary with tone`);
  }
});

test('TOAST_DISMISS carries the two token intervals, and the actionable one is the longer', () => {
  assert.deepEqual({ ...TOAST_DISMISS }, { default: dismissDefault, actionable: dismissActionable });
  assert.ok(TOAST_DISMISS.actionable > TOAST_DISMISS.default,
    'a notice carrying a button asks the reader to decide rather than only to read, so it lives longer');
});
