/* See tag-variants.test.ts for why this suite lives here rather than under
 * scripts/: node cannot resolve the extensionless imports this layer's
 * recipes use. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { breadcrumbsStyles } from '../primitives/breadcrumbs/breadcrumbs.variants';

test('the root slot carries a display utility -- a host-bound arena-breadcrumbs has no other way to lay out', () => {
  assert.match(breadcrumbsStyles().root(), /\bflex\b/);
});

test('a non-final crumb and the current crumb are two distinct slots, not one slot toggled by a variant', () => {
  const crumb = breadcrumbsStyles().crumb();
  const current = breadcrumbsStyles().current();
  assert.notEqual(crumb, current);
});

test('only the current crumb is bold and full-strength -- a linked crumb stays muted', () => {
  const current = breadcrumbsStyles().current();
  const crumb = breadcrumbsStyles().crumb();
  assert.match(current, /font-bold/);
  assert.match(current, /\btext-base-content\b/);
  assert.doesNotMatch(current, /text-base-content\//);
  assert.match(crumb, /text-base-content\/62/);
  assert.doesNotMatch(crumb, /font-bold/);
});

test('a linked crumb carries the hover state as a Tailwind state modifier, not a manifest variant', () => {
  assert.match(breadcrumbsStyles().crumb(), /hover:text-base-content\/82/);
});

test('a linked crumb carries no underline and reads as a pointer target', () => {
  const crumb = breadcrumbsStyles().crumb();
  assert.match(crumb, /no-underline/);
  assert.match(crumb, /cursor-pointer/);
});

test('the separator is muted, distinct from both crumb slots', () => {
  const separator = breadcrumbsStyles().separator();
  assert.match(separator, /text-neutral/);
});

test('every slot shares the mono, wide-tracked control type', () => {
  for (const slot of [breadcrumbsStyles().crumb(), breadcrumbsStyles().current(), breadcrumbsStyles().separator()]) {
    assert.match(slot, /font-mono/);
    assert.match(slot, /text-ctl-sm/);
  }
  assert.match(breadcrumbsStyles().crumb(), /tracking-mono-nav/);
  assert.match(breadcrumbsStyles().current(), /tracking-mono-nav/);
});
