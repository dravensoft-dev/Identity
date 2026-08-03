import test from 'node:test';
import assert from 'node:assert/strict';
import { unauthCardStyles } from './UnauthCard.variants';

test('the width is the derivation, never a literal', () => {
  const root = unauthCardStyles().root();
  assert.match(root, /max-w-\[calc\(var\(--sp-1\)\*95\+var\(--sp-1\)\*18\+var\(--bw\)\*2\)\]/);
  assert.doesNotMatch(root, /454px/);
});

test('the root carries a display utility, so the host is not a zero-area inline box', () => {
  assert.match(unauthCardStyles().root(), /\bblock\b/);
});

test('the panel is the surface and the elevation is the box around it, split so both layers can reach it', () => {
  const panel = unauthCardStyles().panel();
  assert.match(panel, /bg-base-200/);
  assert.doesNotMatch(panel, /shadow-3/,
    'the elevation sits on the root, because a layer that composes Card for this surface cannot '
    + 'put a shadow-3 on it and the card as a whole is what floats');
  assert.match(unauthCardStyles().root(), /shadow-3/);
  assert.match(unauthCardStyles().root(), /\brounded-lg\b/, 'so the shadow is cast with the panel\'s own corners');
});

test('the padding is the full 36px split across panel and body', () => {
  assert.match(unauthCardStyles().panel(), /\bp-5\b/);
  assert.match(unauthCardStyles().body(), /\bp-4\b/);
});

test('brand is flex, never the default block, so an inline-flex child opens no line box', () => {
  assert.match(unauthCardStyles().brand(), /\bflex\b/);
  assert.doesNotMatch(unauthCardStyles().brand(), /\bblock\b/);
});
