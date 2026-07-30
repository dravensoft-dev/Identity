import test from 'node:test';
import assert from 'node:assert/strict';
import { cardStyles } from './Card.variants';

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(cardStyles().root(), /(?:^|\s)block(?=\s|$)/);
});

test('the default card is neither accented nor floating', () => {
  assert.equal(cardStyles().root(), cardStyles({ accent: false, floating: false }).root());
});

test('the two boolean variants are read as booleans, not as the strings "true"/"false"', () => {
  assert.equal(cardStyles({ accent: true }).root(), cardStyles({ accent: true, floating: false }).root());
  assert.notEqual(cardStyles({ accent: true }).root(), cardStyles({ accent: false }).root());
  assert.notEqual(cardStyles({ floating: true }).root(), cardStyles({ floating: false }).root());
});

test('accent swaps the hairline for the accent border and touches nothing else', () => {
  const accented = cardStyles({ accent: true }).root();
  const plain = cardStyles({ accent: false }).root();
  assert.match(accented, /\bborder-primary\b/);
  assert.doesNotMatch(accented, /\bborder-base-300\b/);
  assert.match(plain, /\bborder-base-300\b/);
  assert.doesNotMatch(plain, /\bborder-primary\b/);
});

test('depth is the shadow and the surface scale -- floating adds shadow-2 and no gradient appears anywhere', () => {
  assert.match(cardStyles({ floating: true }).root(), /\bshadow-2\b/);
  assert.match(cardStyles({ floating: false }).root(), /\bshadow-none\b/);
  for (const slot of ['root', 'head', 'eyebrow', 'title', 'body'] as const) {
    assert.doesNotMatch(cardStyles({ floating: true })[slot](), /gradient/, `${slot} paints a gradient`);
  }
});

test('the card sits on --color-base-200, the middle step of the surface scale', () => {
  assert.match(cardStyles().root(), /\bbg-base-200\b/);
});

test('the eyebrow is the accent-coloured mono micro-label above the display-weight title', () => {
  assert.match(cardStyles().eyebrow(), /\bfont-mono\b/);
  assert.match(cardStyles().eyebrow(), /\buppercase\b/);
  assert.match(cardStyles().eyebrow(), /\btext-primary\b/);
  assert.match(cardStyles().title(), /\bfont-display\b/);
  assert.match(cardStyles().title(), /\btext-h4\b/);
});

test('every slot resolves to a non-empty class string with no variant argument', () => {
  const styles = cardStyles();
  for (const slot of ['root', 'head', 'eyebrow', 'title', 'body'] as const) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});
