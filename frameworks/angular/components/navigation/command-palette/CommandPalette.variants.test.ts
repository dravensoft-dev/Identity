import test from 'node:test';
import assert from 'node:assert/strict';
import { commandPaletteStyles } from './CommandPalette.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('a resting row carries no danger classes -- an active command row is a selection state, not a risk indicator', () => {
  const row = tokens(commandPaletteStyles().row());
  assert.ok(!row.some((cls) => cls.includes('error') || cls.includes('danger')));
});
