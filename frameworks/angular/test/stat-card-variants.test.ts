/* Plan 5a's StatCard slice, added beside tag-variants.test.ts per this
 * directory's own header comment: what is worth asserting is the recipe.
 *
 * StatCard is the first slice where a tone carries MEANING rather than
 * identity: `deltaTone` says whether the change is good, and `deltaDirection`
 * (a separate, untested-here template concern -- it only picks an icon
 * glyph, not a class) says which way it points. Both signs render as an
 * outline pill, so this suite pins that the negative tone never reaches for
 * a filled background, the same property tag-variants.test.ts pins for
 * `tone="danger"`. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { statCardStyles } from '../primitives/stat-card/stat-card.variants';

test('the default delta tone is neutral', () => {
  assert.equal(statCardStyles().delta(), statCardStyles({ deltaTone: 'neutral' }).delta());
});

test('a negative delta is outline -- border and text in --error, never a filled background', () => {
  const delta = statCardStyles({ deltaTone: 'negative' }).delta();
  assert.match(delta, /border-error/);
  assert.match(delta, /text-error/);
  assert.doesNotMatch(delta, /\bbg-error/);
  assert.match(delta, /bg-transparent/);
});

test('a positive delta reads success, not the danger family', () => {
  const delta = statCardStyles({ deltaTone: 'positive' }).delta();
  assert.match(delta, /border-success/);
  assert.match(delta, /text-success/);
});

test('every delta tone keeps the shared pill base classes', () => {
  for (const deltaTone of ['neutral', 'positive', 'negative'] as const) {
    const delta = statCardStyles({ deltaTone }).delta();
    assert.match(delta, /rounded-pill/);
    assert.match(delta, /bg-transparent/);
  }
});

test('the root slot carries a display utility and the token-derived min-height, unaffected by deltaTone', () => {
  for (const deltaTone of ['neutral', 'positive', 'negative'] as const) {
    const root = statCardStyles({ deltaTone }).root();
    assert.match(root, /\bflex\b/);
    assert.match(root, /min-h-30/);
  }
});
