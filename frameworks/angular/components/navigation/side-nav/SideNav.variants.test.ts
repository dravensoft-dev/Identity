import test from 'node:test';
import assert from 'node:assert/strict';
import { sideNavStyles } from './SideNav.variants';
import { indentFor } from './SideNavState';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('only the item varies with active -- the section, its heading, the trigger and the region are constant', () => {
  const on = sideNavStyles({ active: true });
  const off = sideNavStyles({ active: false });
  for (const slot of ['root', 'icon', 'section', 'sectionLabel', 'trigger', 'triggerLabel', 'caret', 'region'] as const) {
    assert.equal(on[slot](), off[slot](), `${slot} must not vary with active`);
  }
});

test('the indent is composed at render time from the token, never held by a static utility', () => {
  assert.match(indentFor(3, 2), /^calc\(var\(--sp-1\)/,
    'a static utility cannot hold a runtime multiplier, so every slot carries only the depth-0 inline start');
});
