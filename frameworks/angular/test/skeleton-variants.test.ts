/* Plan 5a's Skeleton slice, added beside tag-variants.test.ts per this
 * directory's own header comment: what is worth asserting is the recipe. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { skeletonStyles } from '../primitives/skeleton/skeleton.variants';

test('the default variant is block', () => {
  assert.equal(skeletonStyles().root(), skeletonStyles({ variant: 'block' }).root());
});

test('every single-shape variant keeps the shimmer base class', () => {
  for (const variant of ['line', 'block', 'circle'] as const) {
    assert.match(skeletonStyles({ variant }).root(), /\barena-shimmer\b/);
  }
});

test('variant="text" hides root -- that variant renders the stack slot instead', () => {
  assert.match(skeletonStyles({ variant: 'text' }).root(), /\bhidden\b/);
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
