/* No DOM and no TestBed. The manifest carries no `variants` at all -- the current page and
 * the rest are two sibling SLOTS the component picks between -- so what is worth asserting
 * is that the pair stays disjoint from the shared `page` slot. The moment one of them
 * declares a border width or a display, the concatenation in pageClass() has two winners
 * and tailwind-merge decides which, silently. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { paginationStyles } from './Pagination.variants';

test('the root is an inline row, so it sits under a table without claiming the line', () => {
  const root = paginationStyles().root();
  assert.match(root, /\binline-flex\b/);
  assert.match(root, /\bitems-center\b/);
});

test('the arrows carry their disabled treatment in the recipe, because disabled is a real attribute here', () => {
  const nav = paginationStyles().nav();
  assert.match(nav, /disabled:text-base-content\/40/);
  assert.match(nav, /disabled:cursor-not-allowed/);
});

test('the current page is the only filled surface, and it is the primary accent', () => {
  const current = paginationStyles().pageCurrent();
  assert.match(current, /\bbg-primary\b/);
  assert.match(current, /\btext-primary-content\b/);

  const other = paginationStyles().pageOther();
  assert.match(other, /\bbg-transparent\b/);
  assert.doesNotMatch(other, /\bbg-primary\b/);
});

test('the shared page slot owns the box and neither state slot touches it', () => {
  const page = paginationStyles().page();
  assert.match(page, /\bh-8\.5\b/);
  assert.match(page, /\bmin-w-8\.5\b/);
  assert.match(page, /border-\[length:var\(--bw\)\]/);

  for (const state of [paginationStyles().pageCurrent(), paginationStyles().pageOther()]) {
    assert.doesNotMatch(state, /\bh-\d/, 'a state slot that sets a height fights the shared box');
    assert.doesNotMatch(state, /border-\[length:/, 'a state slot that sets a border WIDTH fights the shared box');
    assert.doesNotMatch(state, /\binline-flex\b/, 'a state slot that sets a display fights the shared box');
  }
});

test('the arrows and the numbers are the same size, so the strip has one baseline', () => {
  for (const size of [/\bh-8\.5\b/, /\bmin-w-8\.5\b/]) {
    assert.match(paginationStyles().nav(), size);
    assert.match(paginationStyles().page(), size);
  }
});

test('the ellipsis is typeset with the numbers but reads as the quietest thing in the row', () => {
  const ellipsis = paginationStyles().ellipsis();
  assert.match(ellipsis, /\bfont-mono\b/);
  assert.match(ellipsis, /text-base-content\/62/);
  assert.doesNotMatch(ellipsis, /\bcursor-pointer\b/, 'the ellipsis is not a control and must not offer itself as one');
});
