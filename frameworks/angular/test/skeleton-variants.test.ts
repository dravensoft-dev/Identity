/* Plan 5a's Skeleton slice, added beside tag-variants.test.ts per this
 * directory's own header comment: what is worth asserting is the recipe. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { skeletonStyles } from '../primitives/skeleton/skeleton.variants';
import { skeletonRowSlot } from '../primitives/skeleton/skeleton';

test('the default variant is block', () => {
  assert.equal(skeletonStyles().root(), skeletonStyles({ variant: 'block' }).root());
});

test('every single-shape variant keeps the shimmer base class', () => {
  for (const variant of ['line', 'block', 'circle'] as const) {
    assert.match(skeletonStyles({ variant }).root(), /\barena-shimmer\b/);
  }
});

test('variant="text" carries no root override -- the host never reads root() for that variant, only stack()', () => {
  const text = skeletonStyles({ variant: 'text' }).root();
  assert.doesNotMatch(text, /\bhidden\b/);
  assert.match(text, /\barena-shimmer\b/);
  // No shape-specific class from any of the other variants leaked in.
  for (const cls of ['h-24', 'rounded-sm', 'size-10', 'rounded-pill', 'h-3', 'rounded-xs'])
    assert.doesNotMatch(text, new RegExp(`\\b${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
});

test('the stack slot lays out its lines in a column and is unaffected by variant', () => {
  for (const variant of ['text', 'line', 'block', 'circle'] as const) {
    const stack = skeletonStyles({ variant }).stack();
    assert.match(stack, /\bflex-col\b/);
    assert.match(stack, /\bgap-2\.5\b/);
  }
});

test('the last line is narrower than the rest, the way a paragraph ends', () => {
  const line = skeletonStyles().line();
  const lastLine = skeletonStyles().lastLine();
  assert.match(line, /\bw-full\b/);
  assert.doesNotMatch(line, /w-\[62%\]/);
  assert.match(lastLine, /w-\[62%\]/);
});

test('a lone text line runs full width, matching React -- it is not treated as "last"', () => {
  assert.equal(skeletonRowSlot(1, 1), 'line');
});

test('with more than one line, only the final row is the narrow closing line', () => {
  assert.equal(skeletonRowSlot(1, 3), 'line');
  assert.equal(skeletonRowSlot(2, 3), 'line');
  assert.equal(skeletonRowSlot(3, 3), 'lastLine');
});
