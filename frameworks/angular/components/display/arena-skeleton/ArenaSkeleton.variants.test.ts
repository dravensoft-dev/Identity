import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaSkeletonStyles } from './ArenaSkeleton.variants';
import { arenaSkeletonRowSlot } from './ArenaSkeleton';

test('a lone text line runs full width -- "the last runs short" needs a line before it', () => {
  assert.equal(arenaSkeletonRowSlot(1, 1), 'line');
});

test('with more than one line, only the final row is the narrow closing line', () => {
  assert.equal(arenaSkeletonRowSlot(1, 3), 'line');
  assert.equal(arenaSkeletonRowSlot(2, 3), 'line');
  assert.equal(arenaSkeletonRowSlot(3, 3), 'lastLine');
});
