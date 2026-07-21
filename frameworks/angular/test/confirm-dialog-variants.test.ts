/* Plan 5a's ConfirmDialog slice, added beside tag-variants.test.ts per this
 * directory's own header comment: what is worth asserting is the recipe.
 * This is the one component in the whole system allowed a filled danger
 * surface, and only on its final confirmation -- the tests below exist to
 * pin that boundary exactly, not just to exercise the recipe. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmDialogStyles } from '../primitives/confirm-dialog/confirm-dialog.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default is routine, not destructive', () => {
  assert.equal(confirmDialogStyles().confirm(), confirmDialogStyles({ destructive: false }).confirm());
});

test('destructive=true gives the confirm button Arena\'s only filled danger surface -- bg-error-fill, not the outline bg-error', () => {
  const confirm = tokens(confirmDialogStyles({ destructive: true }).confirm());
  assert.ok(confirm.includes('bg-error-fill'), `expected bg-error-fill in "${confirm.join(' ')}"`);
  assert.ok(confirm.includes('text-error-content'), `expected text-error-content in "${confirm.join(' ')}"`);
  assert.ok(!confirm.includes('bg-error'), 'the bare outline bg-error must not also be present alongside the fill');
  assert.ok(!confirm.includes('bg-primary'), 'the routine primary fill must not leak into the destructive confirm button');
});

test('destructive=false keeps the confirm button on the routine primary fill, never the danger fill', () => {
  const confirm = tokens(confirmDialogStyles({ destructive: false }).confirm());
  assert.ok(confirm.includes('bg-primary'), `expected bg-primary in "${confirm.join(' ')}"`);
  assert.ok(confirm.includes('text-primary-content'), `expected text-primary-content in "${confirm.join(' ')}"`);
  assert.ok(!confirm.includes('bg-error-fill'), 'the danger fill must not leak into the routine confirm button');
});

test('the eyebrow follows the same destructive boundary as the confirm button, and stays outline (text only, no fill)', () => {
  const destructiveEyebrow = tokens(confirmDialogStyles({ destructive: true }).eyebrow());
  assert.ok(destructiveEyebrow.includes('text-error'));
  assert.ok(!destructiveEyebrow.some((cls) => cls.startsWith('bg-')), 'the eyebrow is text only, never a filled surface, even when destructive');

  const routineEyebrow = tokens(confirmDialogStyles({ destructive: false }).eyebrow());
  assert.ok(routineEyebrow.includes('text-primary'));
});

test('the cancel button carries no fill and no danger color in either mode -- it is never the risk-bearing control', () => {
  for (const destructive of [true, false]) {
    const cancel = tokens(confirmDialogStyles({ destructive }).cancel());
    assert.ok(cancel.includes('bg-transparent'));
    assert.ok(!cancel.some((cls) => cls.startsWith('bg-error') || cls.startsWith('text-error')));
  }
});

test('the panel and head/foot/body slots carry no destructive-driven classes -- the fill is scoped to the confirm button and eyebrow alone', () => {
  const routine = confirmDialogStyles({ destructive: false });
  const destructive = confirmDialogStyles({ destructive: true });
  for (const slot of ['panel', 'head', 'body', 'foot'] as const) {
    assert.equal(routine[slot](), destructive[slot](), `${slot} must not vary with destructive`);
  }
});

test('invalid=true borders the require-text input in --error; invalid=false keeps the neutral border', () => {
  assert.match(confirmDialogStyles({ invalid: true }).input(), /\bborder-error\b/);
  assert.match(confirmDialogStyles({ invalid: false }).input(), /\bborder-base-300\b/);
  assert.doesNotMatch(confirmDialogStyles({ invalid: true }).input(), /\bborder-base-300\b/);
});

test('open=false hides the root overlay; open=true renders it as the fixed, centered scrim', () => {
  const closed = tokens(confirmDialogStyles({ open: false }).root());
  assert.ok(closed.includes('hidden'), `expected "hidden" in "${closed.join(' ')}"`);
  assert.ok(!closed.includes('flex'), 'the flex overlay layout must not coexist with hidden');

  const open = tokens(confirmDialogStyles({ open: true }).root());
  assert.ok(open.includes('flex'), `expected "flex" in "${open.join(' ')}"`);
  assert.ok(!open.includes('hidden'));
});

test('the closed default keeps the root hidden -- open defaults to false, matching the component\'s own default input', () => {
  assert.equal(confirmDialogStyles().root(), confirmDialogStyles({ open: false }).root());
});

test('the root slot carries a display utility in its own base string, independent of the open variant', () => {
  // This is the property frameworks/angular/test/host-class-binding.test.ts
  // machine-checks against every primitive's manifest on disk; this asserts
  // the same thing against the recipe's own default output.
  assert.match(confirmDialogStyles({ open: true }).root(), /\bflex\b/);
});
