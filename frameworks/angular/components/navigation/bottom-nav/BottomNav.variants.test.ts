import test from 'node:test';
import assert from 'node:assert/strict';
import { bottomNavStyles } from './BottomNav.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default is inactive, matching the item\'s own computed default', () => {
  assert.equal(bottomNavStyles().item(), bottomNavStyles({ active: false }).item());
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  assert.match(bottomNavStyles().root(), /\bflex\b/);
});

test('the bar reads its geometry from tokens, and every one of the three is a token', () => {
  const root = tokens(bottomNavStyles().root());
  assert.ok(root.includes('fixed'), 'a static bar ignores z-index entirely');
  assert.ok(root.includes('h-bar'), 'the height is --layout-bar, not a number somebody picked');
  assert.ok(root.includes('z-nav'), 'the stacking slot is the one the token layer declared for this');
  assert.ok(root.includes('pb-[var(--pad-safe-bottom)]'),
    'without the device inset the labels sit under the home indicator');
  assert.ok(root.includes('start-0') && root.includes('end-0') && root.includes('bottom-0'),
    'the bar spans the inline axis and sits on the bottom edge');
});

test('the bar sits below a dropdown and a sheet, which is what its own slot means', () => {
  const root = tokens(bottomNavStyles().root());
  assert.ok(!root.some((cls) => cls.startsWith('z-') && cls !== 'z-nav'),
    'exactly one stacking slot, and it is the bar\'s');
});

test('a column takes an equal share and a zero floor, so a long label cannot push its neighbours', () => {
  const item = tokens(bottomNavStyles().item());
  for (const cls of ['flex-1', 'basis-0', 'min-w-0', 'flex-col', 'items-center']) {
    assert.ok(item.includes(cls), `a column without ${cls} makes the bar lurch as its labels change`);
  }
});

test('the column answers hover and focus, which is what the item contract declares', () => {
  const item = bottomNavStyles().item();
  assert.match(item, /\bhover:/, 'the column declares no hover state');
  assert.match(item, /\bfocus-visible:/, 'the column declares no focus state');
});

test('active is the only thing that varies, and it varies the ink rather than the surface', () => {
  const on = tokens(bottomNavStyles({ active: true }).item());
  const off = tokens(bottomNavStyles({ active: false }).item());
  assert.ok(on.includes('text-primary'), 'the current destination takes the primary ink');
  assert.ok(!off.includes('text-primary'));
  assert.ok(!on.some((cls) => cls.startsWith('bg-') && cls !== 'bg-transparent'),
    'a filled current destination would read as a control rather than as a place');

  const bar = bottomNavStyles({ active: true });
  const plain = bottomNavStyles({ active: false });
  for (const slot of ['root', 'glyph', 'label', 'badge'] as const) {
    assert.equal(bar[slot](), plain[slot](), `${slot} must not vary with the active destination`);
  }
});
