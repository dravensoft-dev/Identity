import test from 'node:test';
import assert from 'node:assert/strict';
import { dialogStyles } from './Dialog.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('open=false hides the scrim; open=true renders it as the fixed, centered overlay', () => {
  const closed = tokens(dialogStyles({ open: false }).scrim());
  assert.ok(closed.includes('hidden'), `expected "hidden" in "${closed.join(' ')}"`);
  assert.ok(!closed.includes('flex'), 'the flex overlay layout must not coexist with hidden');

  const open = tokens(dialogStyles({ open: true }).scrim());
  assert.ok(open.includes('flex'), `expected "flex" in "${open.join(' ')}"`);
  assert.ok(!open.includes('hidden'));
});

test('the closed default keeps the scrim hidden, matching a host that has not been opened yet', () => {
  assert.equal(dialogStyles().scrim(), dialogStyles({ open: false }).scrim());
});

test('the scrim sits on --z-modal, one slot below the nested confirmation it can raise', () => {
  assert.match(dialogStyles({ open: true }).scrim(), /\bz-modal\b/);
});

test('only the scrim varies with open -- the panel and its interior slots are constant', () => {
  const closed = dialogStyles({ open: false });
  const open = dialogStyles({ open: true });
  for (const slot of ['panel', 'head', 'eyebrow', 'title', 'body', 'foot'] as const) {
    assert.equal(closed[slot](), open[slot](), `${slot} must not vary with open`);
  }
});

test('the panel carries its own default width, so the width member is an override rather than a requirement', () => {
  assert.match(dialogStyles({ open: true }).panel(), /\bw-120\b/);
});

test('the eyebrow is text only -- no filled surface, on the outline rule danger shares', () => {
  const eyebrow = tokens(dialogStyles({ open: true }).eyebrow());
  assert.ok(eyebrow.includes('text-primary'));
  assert.ok(!eyebrow.some((cls) => cls.startsWith('bg-')));
});

test('the footer wraps, because the slot projects one control per element', () => {
  assert.match(
    dialogStyles({ open: true }).foot(),
    /\bflex-wrap\b/,
    'three buttons at 390px overflow the panel without it, and the row is what has to wrap '
    + 'because the consumer projects siblings rather than a wrapper of their own; PageHead and '
    + 'ChartCard already do this, and a third action row behaving differently is worse than none',
  );
});
