import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaBreadcrumbsStyles } from './ArenaBreadcrumbs.variants';

test('a non-final crumb and the current crumb are two distinct slots, not one slot toggled by a variant', () => {
  const crumb = arenaBreadcrumbsStyles().crumb();
  const current = arenaBreadcrumbsStyles().current();
  assert.notEqual(crumb, current);
});

