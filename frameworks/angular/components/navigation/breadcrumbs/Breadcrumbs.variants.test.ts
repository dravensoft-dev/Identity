import test from 'node:test';
import assert from 'node:assert/strict';
import { breadcrumbsStyles } from './Breadcrumbs.variants';

test('a non-final crumb and the current crumb are two distinct slots, not one slot toggled by a variant', () => {
  const crumb = breadcrumbsStyles().crumb();
  const current = breadcrumbsStyles().current();
  assert.notEqual(crumb, current);
});

