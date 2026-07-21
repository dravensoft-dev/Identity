/* Plan 5a's CommandPalette slice, added beside onboarding-variants.test.ts per
 * this directory's own header comment: what is worth asserting is the
 * recipe. CommandPalette shares ConfirmDialog's overlay resolution (root IS
 * the recipe's fixed scrim, host-bound, `open` driving it between the
 * overlay and `hidden`) and its centering (the brief's own `scrim` slot
 * already carried `flex items-start justify-center`, so renaming it to
 * `root` changed nothing about that layout) -- these tests pin that shape
 * rather than assuming it. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { commandPaletteStyles } from '../primitives/command-palette/command-palette.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('open=false hides the root overlay; open=true renders it as the fixed, top-anchored scrim', () => {
  const closed = tokens(commandPaletteStyles({ open: false }).root());
  assert.ok(closed.includes('hidden'), `expected "hidden" in "${closed.join(' ')}"`);
  assert.ok(!closed.includes('flex'), 'the flex overlay layout must not coexist with hidden');

  const open = tokens(commandPaletteStyles({ open: true }).root());
  assert.ok(open.includes('flex'), `expected "flex" in "${open.join(' ')}"`);
  assert.ok(!open.includes('hidden'));
});

test('the closed default keeps the root hidden -- open defaults to false, matching the component\'s own default input', () => {
  assert.equal(commandPaletteStyles().root(), commandPaletteStyles({ open: false }).root());
});

test('the root slot carries a display utility in its own base string, independent of the open variant', () => {
  // This is the property frameworks/angular/test/host-class-binding.test.ts
  // machine-checks against every primitive's manifest on disk; this asserts
  // the same thing against the recipe's own default output.
  assert.match(commandPaletteStyles({ open: true }).root(), /\bflex\b/);
});

test('the active row is the primary soft tint with primary text, matching the crimson accent React uses', () => {
  const active = tokens(commandPaletteStyles().rowActive());
  assert.ok(active.includes('bg-primary/14'), `expected bg-primary/14 in "${active.join(' ')}"`);
  assert.ok(active.includes('text-primary'), `expected text-primary in "${active.join(' ')}"`);
});

test('the active row label is a heavier weight than the resting label', () => {
  assert.match(commandPaletteStyles().rowLabelActive(), /font-semibold/);
  assert.match(commandPaletteStyles().rowLabel(), /font-medium/);
});

test('a resting row carries no danger classes -- an active command row is a selection state, not a risk indicator', () => {
  const row = tokens(commandPaletteStyles().row());
  assert.ok(!row.some((cls) => cls.includes('error') || cls.includes('danger')));
});
