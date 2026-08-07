import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaMenuStyles } from './ArenaMenu.variants';
import { ARENA_MENU_POSITIONS, isArenaActivatable, arenaRowState } from './ArenaMenu';
import { sp1 } from '../../../Tokens.generated';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the surface, the ink and the row metrics do not vary with anchoring -- only the position does', () => {
  const anchored = arenaMenuStyles({ anchored: true });
  const inFlow = arenaMenuStyles({ anchored: false });
  for (const slot of ['item', 'itemDefault', 'itemDestructive', 'itemDisabled', 'icon', 'label', 'shortcut', 'divider', 'header'] as const) {
    assert.equal(anchored[slot](), inFlow[slot](), `${slot} must not vary with anchored`);
  }
});

test('arenaRowState picks the modifier the row draws with, and disabled outranks destructive', () => {
  assert.equal(arenaRowState({ label: 'Promote' }), 'default');
  assert.equal(arenaRowState({ label: 'Delete', destructive: true }), 'destructive');
  assert.equal(arenaRowState({ label: 'Delete', destructive: true, disabled: true }), 'disabled');
});

test('a divider and a header are not activatable; everything else is', () => {
  assert.equal(isArenaActivatable({ divider: true }), false);
  assert.equal(isArenaActivatable({ header: 'Build 482' }), false);
  assert.equal(isArenaActivatable({ header: '' }), false, 'an empty header is still a header');
  assert.equal(isArenaActivatable({ label: 'Promote' }), true);
  assert.equal(isArenaActivatable({ label: 'Download logs', disabled: true }), true,
    'a disabled row is still a row -- it renders as a menuitem and reports nothing');
});

test('both alignments offer a flip below the trigger, and the gap is derived from the token rather than written', () => {
  for (const align of ['start', 'end'] as const) {
    const positions = ARENA_MENU_POSITIONS[align];
    assert.equal(positions.length, 2, `${align} must offer a fallback above the trigger`);
    assert.equal(positions[0].offsetY, sp1 * 1.5);
    assert.equal(positions[1].offsetY, -sp1 * 1.5);
    assert.equal(positions[0].originY, 'bottom');
    assert.equal(positions[1].originY, 'top');
  }
  assert.equal(ARENA_MENU_POSITIONS.start[0].originX, 'start');
  assert.equal(ARENA_MENU_POSITIONS.end[0].originX, 'end');
});
