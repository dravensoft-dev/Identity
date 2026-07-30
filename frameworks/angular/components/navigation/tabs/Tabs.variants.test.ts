/* No DOM and no TestBed. Tabs and Tab read ONE manifest -- the panel's slot lives beside the
 * tab's, because a tabpanel may not sit inside a tablist and so the two are drawn by different
 * components from the same recipe. The panel's display is the load-bearing part: it must resolve
 * to `hidden` when unselected, or every inactive panel stays on screen. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { tabsStyles } from './Tabs.variants';
import { tabStyles } from '../tab/Tab.variants';

test('the tablist is a row on a hairline rule, which is the shape that says "changes the view"', () => {
  const root = tabsStyles().root();
  assert.match(root, /\bflex\b/);
  assert.match(root, /border-b-\[length:var\(--bw\)\]/);
  assert.match(root, /border-base-300/);
});

test('the selected tab is marked by the crimson underline and by weight, not by a fill', () => {
  const on = tabsStyles({ selected: true }).tab();
  assert.match(on, /font-semibold/);
  assert.match(on, /text-base-content\b/);
  assert.match(on, /shadow-\[inset_0_calc\(var\(--bw-strong\)\*-1\)_0_var\(--crimson\)\]/);
  assert.doesNotMatch(on, /\bbg-(?!transparent)/,
    'a filled tab would spend the view\'s primary accent on navigation');
});

test('the unselected tab keeps its box and loses only weight and ink', () => {
  const off = tabsStyles({ selected: false }).tab();
  assert.match(off, /font-medium/);
  assert.match(off, /text-base-content\/62/);
  assert.match(off, /shadow-none/);
  for (const selected of [true, false]) {
    assert.match(tabsStyles({ selected }).tab(), /px-4/, `selected=${selected} moved the tab's padding`);
  }
});

test('the tab carries its own focus ring, because it is the element that takes focus', () => {
  assert.match(tabsStyles().tab(), /focus-visible:shadow-\[0_0_0_var\(--focus-width\)_var\(--gold-soft\)\]/);
});

test('the panel resolves to block when selected and hidden when not', () => {
  const on = tabsStyles({ selected: true }).panel();
  assert.match(on, /\bblock\b/);
  assert.doesNotMatch(on, /\bhidden\b/);

  const off = tabsStyles({ selected: false }).panel();
  assert.match(off, /\bhidden\b/);
  assert.doesNotMatch(off, /\bblock\b/,
    'tailwind-merge must drop the base display when the variant supplies one, or both land and block wins');
});

test('the panel keeps its top gap in both states, so switching tabs does not shift the layout', () => {
  for (const selected of [true, false]) {
    assert.match(tabsStyles({ selected }).panel(), /pt-\[calc\(var\(--sp-1\)\*5\.5\)\]/);
  }
});

test('Tab reads the same recipe Tabs does, so the panel cannot drift from the tablist', () => {
  assert.equal(tabStyles({ selected: true }).panel(), tabsStyles({ selected: true }).panel());
  assert.equal(tabStyles({ selected: false }).panel(), tabsStyles({ selected: false }).panel());
});
