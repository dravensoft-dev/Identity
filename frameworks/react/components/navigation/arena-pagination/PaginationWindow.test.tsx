import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arenaPageWindow } from './PaginationWindow.ts';
import { limitPaginationSiblings } from '../../../Tokens.generated.js';

test('the pinned windows are written for a sibling count of one', () => {
  assert.equal(limitPaginationSiblings, 1);
});

test('seven pages fit whole, and eight do not', () => {
  assert.deepEqual(arenaPageWindow(1, 7), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(arenaPageWindow(1, 8).includes('…'));
});

test('a window in the middle elides on both sides', () => {
  assert.deepEqual(arenaPageWindow(10, 20), [1, '…', 9, 10, 11, '…', 20]);
});

test('a window at the start elides on the right only', () => {
  assert.deepEqual(arenaPageWindow(1, 20), [1, 2, '…', 20]);
});

test('a window at the end elides on the left only', () => {
  assert.deepEqual(arenaPageWindow(20, 20), [1, '…', 19, 20]);
});
