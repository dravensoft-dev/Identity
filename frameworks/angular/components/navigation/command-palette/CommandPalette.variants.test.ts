import test from 'node:test';
import assert from 'node:assert/strict';
import { commandPaletteStyles } from './CommandPalette.variants';

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

test('the recipe\'s own unset-argument default resolves the same classes as an explicit open: false', () => {
  assert.equal(commandPaletteStyles().root(), commandPaletteStyles({ open: false }).root());
});

test('the root slot carries a display utility in its own base string, independent of the open variant', () => {

  assert.match(commandPaletteStyles({ open: true }).root(), /\bflex\b/);
});

test('a resting row carries no danger classes -- an active command row is a selection state, not a risk indicator', () => {
  const row = tokens(commandPaletteStyles().row());
  assert.ok(!row.some((cls) => cls.includes('error') || cls.includes('danger')));
});
