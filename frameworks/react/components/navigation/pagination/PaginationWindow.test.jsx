import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageWindow } from '../components/navigation/pagination-window.js';
import { limitPaginationSiblings } from '../tokens.generated.js';

/* The pins below are written for one sibling either side. If this fails, the token
 * moved and the expected windows must be re-derived BY HAND, not by importing the
 * implementation's formula -- which would make every assertion below tautological. */
test('the pinned windows are written for a sibling count of one', () => {
  assert.equal(limitPaginationSiblings, 1);
});

test('seven pages fit whole, and eight do not', () => {
  assert.deepEqual(pageWindow(1, 7), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(pageWindow(1, 8).includes('…'));
});

test('a window in the middle elides on both sides', () => {
  assert.deepEqual(pageWindow(10, 20), [1, '…', 9, 10, 11, '…', 20]);
});

test('a window at the start elides on the right only', () => {
  assert.deepEqual(pageWindow(1, 20), [1, 2, '…', 20]);
});

test('a window at the end elides on the left only', () => {
  assert.deepEqual(pageWindow(20, 20), [1, '…', 19, 20]);
});
