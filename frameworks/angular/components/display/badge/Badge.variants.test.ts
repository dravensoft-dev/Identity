import test from 'node:test';
import assert from 'node:assert/strict';
import { badgeStyles } from './Badge.variants';

const TONES = ['neutral', 'accent', 'gold', 'success', 'warning', 'danger', 'info'] as const;

test('the default tone is neutral', () => {
  assert.equal(badgeStyles().root(), badgeStyles({ tone: 'neutral' }).root());
});

test('every tone keeps the base class, so none of them draws the chip shape alone', () => {
  for (const tone of TONES) {
    assert.ok(badgeStyles({ tone }).root().split(/\s+/).includes('arena-badge__root'),
      `tone ${tone} dropped the base class, so it would draw none of the shared chip`);
  }
});

test('the seven tones resolve to seven distinct roots, none silently collapsing onto another', () => {
  const roots = new Set(TONES.map((tone) => badgeStyles({ tone }).root()));
  assert.equal(roots.size, TONES.length, `two tones resolved to the same classes: ${[...roots].join(' | ')}`);
});

test('the dot takes no tone of its own, so it can only inherit the ink around it', () => {
  for (const tone of TONES) {
    assert.equal(badgeStyles({ tone }).dot(), 'arena-badge__dot',
      `tone ${tone}: the dot gained a class of its own instead of inheriting`);
  }
});

test('every slot resolves to a non-empty class string with no variant argument', () => {
  const styles = badgeStyles();
  for (const slot of ['root', 'dot'] as const) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});
