import test from 'node:test';
import assert from 'node:assert/strict';
import { menuStyles } from './Menu.variants';
import { MENU_POSITIONS, isActivatable, rowState } from './Menu';
import { sp1 } from '../../../Tokens.generated';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('anchored=true drops every in-flow positioning class, because the CDK positions the pane', () => {
  const panel = tokens(menuStyles({ anchored: true }).panel());
  for (const cls of ['absolute', 'top-full', 'left-0', 'mt-1.5']) {
    assert.ok(!panel.includes(cls), `anchored panel must not carry "${cls}": "${panel.join(' ')}"`);
  }
  assert.ok(!tokens(menuStyles({ anchored: true }).root()).includes('relative'),
    'nothing is positioned against the host once the panel has left it');
});

test('anchored=false keeps them, which is the shape the Tailwind specimen renders', () => {
  const panel = tokens(menuStyles({ anchored: false }).panel());
  for (const cls of ['absolute', 'top-full', 'left-0', 'mt-1.5']) {
    assert.ok(panel.includes(cls), `un-anchored panel must carry "${cls}"`);
  }
  assert.ok(tokens(menuStyles({ anchored: false }).root()).includes('relative'));
});

test('the un-anchored default is what a manifest reader gets, matching Tooltip\'s own polarity', () => {
  assert.equal(menuStyles().panel(), menuStyles({ anchored: false }).panel());
});

test('the surface, the ink and the row metrics do not vary with anchoring -- only the position does', () => {
  const anchored = menuStyles({ anchored: true });
  const inFlow = menuStyles({ anchored: false });
  for (const slot of ['item', 'itemDefault', 'itemDestructive', 'itemDisabled', 'icon', 'label', 'shortcut', 'divider', 'header'] as const) {
    assert.equal(anchored[slot](), inFlow[slot](), `${slot} must not vary with anchored`);
  }
});

test('a destructive row is outline -- danger ink and a soft hover, never a filled surface', () => {
  const destructive = tokens(menuStyles().itemDestructive());
  assert.ok(destructive.includes('text-error'));
  assert.ok(!destructive.some((cls) => cls.startsWith('bg-error') && !cls.includes('/')),
    'a menu row is never a filled danger surface');
});

test('a disabled row takes no pointer and no hover of its own', () => {
  const disabled = tokens(menuStyles().itemDisabled());
  assert.ok(disabled.includes('cursor-not-allowed'));
  assert.ok(!disabled.some((cls) => cls.startsWith('hover:')), 'a disabled row must not light up under the pointer');
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  assert.match(menuStyles().root(), /\binline-flex\b/);
});

test('rowState picks the modifier the row draws with, and disabled outranks destructive', () => {
  assert.equal(rowState({ label: 'Promote' }), 'default');
  assert.equal(rowState({ label: 'Delete', destructive: true }), 'destructive');
  assert.equal(rowState({ label: 'Delete', destructive: true, disabled: true }), 'disabled');
});

test('a divider and a header are not activatable; everything else is', () => {
  assert.equal(isActivatable({ divider: true }), false);
  assert.equal(isActivatable({ header: 'Build 482' }), false);
  assert.equal(isActivatable({ header: '' }), false, 'an empty header is still a header');
  assert.equal(isActivatable({ label: 'Promote' }), true);
  assert.equal(isActivatable({ label: 'Download logs', disabled: true }), true,
    'a disabled row is still a row -- it renders as a menuitem and reports nothing');
});

test('both alignments offer a flip below the trigger, and the gap is derived from the token rather than written', () => {
  for (const align of ['start', 'end'] as const) {
    const positions = MENU_POSITIONS[align];
    assert.equal(positions.length, 2, `${align} must offer a fallback above the trigger`);
    assert.equal(positions[0].offsetY, sp1 * 1.5);
    assert.equal(positions[1].offsetY, -sp1 * 1.5);
    assert.equal(positions[0].originY, 'bottom');
    assert.equal(positions[1].originY, 'top');
  }
  assert.equal(MENU_POSITIONS.start[0].originX, 'start');
  assert.equal(MENU_POSITIONS.end[0].originX, 'end');
});
