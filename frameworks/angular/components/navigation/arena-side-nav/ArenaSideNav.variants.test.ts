import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaSideNavStyles } from './ArenaSideNav.variants';
import { arenaIndentFor } from './ArenaSideNavState';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('only the item varies with active -- the section, its heading, the trigger and the region are constant', () => {
  const on = arenaSideNavStyles({ active: true });
  const off = arenaSideNavStyles({ active: false });
  for (const slot of ['root', 'icon', 'section', 'sectionLabel', 'trigger', 'triggerLabel', 'caret', 'region'] as const) {
    assert.equal(on[slot](), off[slot](), `${slot} must not vary with active`);
  }
});

test('the indent is composed at render time from the token, never held by a static utility', () => {
  assert.match(arenaIndentFor(3, 2), /^calc\(var\(--sp-1\)/,
    'a static utility cannot hold a runtime multiplier, so every slot carries only the depth-0 inline start');
});
