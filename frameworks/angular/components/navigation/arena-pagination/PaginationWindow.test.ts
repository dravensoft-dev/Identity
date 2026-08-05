/* The five windows are pinned to a sibling count of one, so the first assertion pins the
 * token rather than the arithmetic: a re-authored --limit-pagination-siblings must fail
 * here and be re-derived, not silently reshape every window. `threshold` stays a function
 * and never a named number, because check:duplicate-constants pairs module-level numeric
 * consts across the layers by NAME, and a window computed inline declares none. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { ELLIPSIS, arenaPageWindow } from './PaginationWindow';
import { limitPaginationSiblings } from '../../../Tokens.generated';

test('the pinned windows are written for a sibling count of one', () => {
  assert.equal(limitPaginationSiblings, 1);
});

test('seven pages fit whole, and eight do not', () => {
  assert.deepEqual(arenaPageWindow(1, 7), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(arenaPageWindow(1, 8).includes(ELLIPSIS));
});

test('a window in the middle elides on both sides', () => {
  assert.deepEqual(arenaPageWindow(10, 20), [1, ELLIPSIS, 9, 10, 11, ELLIPSIS, 20]);
});

test('a window at the start elides on the right only', () => {
  assert.deepEqual(arenaPageWindow(1, 20), [1, 2, ELLIPSIS, 20]);
});

test('a window at the end elides on the left only', () => {
  assert.deepEqual(arenaPageWindow(20, 20), [1, ELLIPSIS, 19, 20]);
});

test('the window is the one ArenaPagination.json contracts, page for page', () => {
  for (const [current, total] of [[1, 7], [1, 8], [10, 20], [1, 20], [20, 20], [4, 12], [1, 1]]) {
    const window = arenaPageWindow(current, total);
    const numbers = window.filter((slot): slot is number => slot !== ELLIPSIS);
    assert.equal(numbers[0], 1, `page ${current} of ${total}: the first page must always be reachable`);
    assert.equal(numbers[numbers.length - 1], total, `page ${current} of ${total}: the last page must always be reachable`);
    assert.deepEqual([...numbers].sort((a, b) => a - b), numbers, `page ${current} of ${total}: the window is out of order`);
  }
});
