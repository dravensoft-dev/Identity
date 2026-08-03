import test from 'node:test';
import assert from 'node:assert/strict';
import { skeletonStyles } from './Skeleton.variants';
import { skeletonRowSlot } from './Skeleton';

test('a lone text line runs full width -- "the last runs short" needs a line before it', () => {
  assert.equal(skeletonRowSlot(1, 1), 'line');
});

test('with more than one line, only the final row is the narrow closing line', () => {
  assert.equal(skeletonRowSlot(1, 3), 'line');
  assert.equal(skeletonRowSlot(2, 3), 'line');
  assert.equal(skeletonRowSlot(3, 3), 'lastLine');
});
