import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaGridStyles } from './ArenaGrid.variants';

const GAPS = ['none', 'sm', 'md', 'lg'] as const;

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the gap is the only thing the recipe decides -- the track list is the component\'s', () => {
  for (const gap of GAPS) {
    const root = tokens(arenaGridStyles({ gap }).root());
    assert.ok(!root.some((cls) => cls.startsWith('grid-cols-')),
      `${gap}: a fixed column count is exactly the breakpoint this component exists to avoid`);
  }
});
