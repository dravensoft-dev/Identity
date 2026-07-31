import test from 'node:test';
import assert from 'node:assert/strict';
import { toastStyles } from './Toast.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default tone is neutral, matching the component\'s own default input', () => {
  assert.equal(toastStyles().root(), toastStyles({ tone: 'neutral' }).root());
});

test('every tone colours the left border and nothing else on the surface', () => {
  const expected = {
    neutral: 'border-l-neutral',
    success: 'border-l-success',
    danger: 'border-l-error',
    gold: 'border-l-secondary',
  } as const;
  for (const [tone, cls] of Object.entries(expected)) {
    const root = tokens(toastStyles({ tone: tone as keyof typeof expected }).root());
    assert.ok(root.includes(cls), `${tone}: expected ${cls} in "${root.join(' ')}"`);
    assert.ok(root.includes('bg-base-200'), `${tone}: the surface must stay the card surface whatever the tone`);
  }
});

test('danger is the one tone whose action flips to the secondary ink, so it never sits crimson on crimson', () => {
  assert.match(toastStyles({ tone: 'danger' }).action(), /\btext-secondary\b/);
  for (const tone of ['neutral', 'success', 'gold'] as const) {
    assert.match(toastStyles({ tone }).action(), /\btext-primary\b/);
  }
});

test('danger is OUTLINE -- the left border carries the tone and no slot is filled with it', () => {
  const root = tokens(toastStyles({ tone: 'danger' }).root());
  assert.ok(!root.some((cls) => cls.startsWith('bg-error')), 'a toast is never a filled danger surface');
});

test('only root and action vary with tone -- the body, title, pinned marker, message and close are constant', () => {
  const neutral = toastStyles({ tone: 'neutral' });
  const danger = toastStyles({ tone: 'danger' });
  for (const slot of ['body', 'title', 'pinned', 'message', 'close'] as const) {
    assert.equal(neutral[slot](), danger[slot](), `${slot} must not vary with tone`);
  }
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  assert.match(toastStyles().root(), /\bflex\b/);
});

test('the root sits on --z-toast, the one slot above every other overlay', () => {
  assert.match(toastStyles().root(), /\bz-toast\b/);
});
