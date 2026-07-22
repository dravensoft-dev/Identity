import test from 'node:test';
import assert from 'node:assert/strict';
import { unauthCardStyles } from '../primitives/unauth-card/unauth-card.variants';

test('the width is the derivation, never a literal', () => {
  const root = unauthCardStyles().root();
  assert.match(root, /max-w-\[calc\(var\(--sp-1\)\*95\+var\(--sp-1\)\*18\+var\(--bw\)\*2\)\]/);
  assert.doesNotMatch(root, /454px/);
});

test('the root carries a display utility, so the host is not a zero-area inline box', () => {
  assert.match(unauthCardStyles().root(), /\bblock\b/);
});

test('the panel is a surface with a shadow, and the padding is the full 36px split across panel and body', () => {
  const panel = unauthCardStyles().panel();
  assert.match(panel, /bg-base-200/);
  assert.match(panel, /shadow-3/);
  assert.match(panel, /\bp-5\b/);
  assert.match(unauthCardStyles().body(), /\bp-4\b/);
});

test('brand is flex, never the default block, so an inline-flex child opens no line box', () => {
  assert.match(unauthCardStyles().brand(), /\bflex\b/);
  assert.doesNotMatch(unauthCardStyles().brand(), /\bblock\b/);
});
