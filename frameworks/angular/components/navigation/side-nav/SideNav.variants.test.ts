import test from 'node:test';
import assert from 'node:assert/strict';
import { sideNavStyles } from './SideNav.variants';
import { indentFor } from './SideNavState';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default is inactive, matching a row that is not the current destination', () => {
  assert.equal(sideNavStyles().item(), sideNavStyles({ active: false }).item());
});

test('active inks the row and weights it; inactive is muted and medium, and neither is a border', () => {
  const on = tokens(sideNavStyles({ active: true }).item());
  assert.ok(on.includes('text-primary'));
  assert.ok(on.includes('font-semibold'));
  assert.ok(on.some((cls) => cls.startsWith('bg-primary/')), 'the active surface is a soft wash, not the full brand fill');

  const off = tokens(sideNavStyles({ active: false }).item());
  assert.ok(off.includes('bg-transparent'));
  assert.ok(off.includes('font-medium'));
  assert.ok(!off.includes('text-primary'));
});

test('only the item varies with active -- the section, its heading, the trigger and the region are constant', () => {
  const on = sideNavStyles({ active: true });
  const off = sideNavStyles({ active: false });
  for (const slot of ['root', 'icon', 'section', 'sectionLabel', 'trigger', 'triggerLabel', 'caret', 'region'] as const) {
    assert.equal(on[slot](), off[slot](), `${slot} must not vary with active`);
  }
});

test('the row is a real row in either shape -- no underline, left-aligned, no border', () => {
  const item = tokens(sideNavStyles().item());
  assert.ok(item.includes('no-underline'), 'an <a> row must not read as body-copy link');
  assert.ok(item.includes('text-left'));
  assert.ok(item.includes('border-none'));
});

test('the trigger matches the item metrics, so a collapsible header lines up with its siblings', () => {
  const item = tokens(sideNavStyles().item());
  const trigger = tokens(sideNavStyles().trigger());
  for (const cls of ['flex', 'items-center', 'gap-3', 'py-2.5', 'rounded-sm']) {
    assert.ok(item.includes(cls), `item must carry ${cls}`);
    assert.ok(trigger.includes(cls), `trigger must carry ${cls} too, or the two rows will not align`);
  }
});

test('the root, the section and the region are the same column, so nesting adds no new rhythm', () => {
  assert.equal(sideNavStyles().root(), sideNavStyles().section());
  assert.equal(sideNavStyles().root(), sideNavStyles().region());
  assert.match(sideNavStyles().root(), /\bflex\b/);
  assert.match(sideNavStyles().root(), /\bflex-col\b/);
});

test('no slot carries the indent, because a static utility cannot hold a runtime multiplier', () => {
  const styles = sideNavStyles();
  for (const slot of ['item', 'trigger', 'sectionLabel'] as const) {
    assert.doesNotMatch(styles[slot](), /\bps-\[/, `${slot} must not hard-code an indent bracket`);
  }
  assert.match(indentFor(3, 2), /^calc\(var\(--sp-1\)/,
    'the indent is composed at render time from the token, and every slot carries only the depth-0 inline start');
});
