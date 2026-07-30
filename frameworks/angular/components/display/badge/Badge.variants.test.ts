import test from 'node:test';
import assert from 'node:assert/strict';
import { badgeStyles } from './Badge.variants';

const TONES = ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'] as const;

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(badgeStyles().root(), /(?:^|\s)inline-flex(?=\s|$)/);
});

test('the default tone is neutral', () => {
  assert.equal(badgeStyles().root(), badgeStyles({ tone: 'neutral' }).root());
});

test('every tone keeps the shared chip base -- the pill radius and the mono uppercase micro-label', () => {
  for (const tone of TONES) {
    const root = badgeStyles({ tone }).root().split(/\s+/);
    for (const shared of ['rounded-pill', 'font-mono', 'uppercase', 'text-ctl-xs', 'tracking-badge']) {
      assert.ok(root.includes(shared), `tone ${tone}: ${shared} missing from "${root.join(' ')}"`);
    }
  }
});

test('the seven tones resolve to seven distinct roots -- none silently collapses onto another', () => {
  const roots = new Set(TONES.map((tone) => badgeStyles({ tone }).root()));
  assert.equal(roots.size, TONES.length, `two tones resolved to the same classes: ${[...roots].join(' | ')}`);
});

test('danger carries the error ink, on the soft tint React paints rather than a full-strength surface', () => {
  const root = badgeStyles({ tone: 'danger' }).root();
  assert.match(root, /\btext-error\b/);
  assert.match(root, /\bbg-error\/\d+\b/, 'the danger surface is a tint of --error, never the token at full strength');
  assert.doesNotMatch(root, /\bbg-error\b(?!\/)/);
});

test('the dot inherits the tone ink rather than declaring a colour of its own', () => {
  for (const tone of TONES) {
    assert.match(badgeStyles({ tone }).dot(), /\bbg-current\b/, `tone ${tone}: the dot paints its own colour`);
  }
});

test('every slot resolves to a non-empty class string with no variant argument', () => {
  const styles = badgeStyles();
  for (const slot of ['root', 'dot'] as const) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});
