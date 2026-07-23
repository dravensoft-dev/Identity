/* Plan 5a's StatCard slice, added beside tag-variants.test.ts per this
 * directory's own header comment: what is worth asserting is the recipe.
 *
 * StatCard carries two independent tone dimensions, and this suite pins that
 * they stay independent. `tone` says what state the number IS in right now
 * (colors the `value` slot); the delta's own tone says whether the number's
 * last change was good (colors the `delta` pill), and the delta's direction
 * (a separate, untested-here template concern -- it only picks an icon glyph,
 * not a class) says which way it pointed. Note the two live at different
 * levels since the API contract landed: `tone` is a component member, while
 * the delta's tone and direction are fields of the one `delta` object member
 * (`delta.tone`, `delta.direction`). The recipe below still takes them as
 * flat `tone` and `deltaTone` variants, because a tailwind-variants recipe
 * has no nesting -- `stat-card.ts` is what maps one onto the other. A service
 * at 99.98% uptime is healthy whether or not it improved this week, so a
 * `danger` value tone with a `positive` delta tone in the same tile is a
 * real, expected combination, not a contradiction -- React's own
 * display.card.html demoes exactly that ("Open incidents", tone="danger",
 * improving). Both a `danger` value tone and a `negative` delta tone
 * render outline-only: `tone` colors text on the
 * `value` slot, which carries no background at all, and `delta`'s pill is
 * `bg-transparent`, the same property tag-variants.test.ts pins for
 * `tone="danger"`. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { statCardStyles } from '../primitives/stat-card/stat-card.variants';

test('the default delta tone is neutral', () => {
  assert.equal(statCardStyles().delta(), statCardStyles({ deltaTone: 'neutral' }).delta());
});

test('the default value tone is neutral', () => {
  assert.equal(statCardStyles().value(), statCardStyles({ tone: 'neutral' }).value());
  assert.match(statCardStyles().value(), /text-base-content\b/);
});

test('every value tone maps to its own text color and no other survives beside it', () => {
  const expect = {
    neutral: 'text-base-content', accent: 'text-primary', gold: 'text-secondary',
    success: 'text-success', warning: 'text-warning', danger: 'text-error', info: 'text-info',
  } as const;
  for (const [tone, expectedColor] of Object.entries(expect) as [keyof typeof expect, string][]) {
    const value = statCardStyles({ tone }).value();
    const colorClasses = value.split(/\s+/).filter((c) => c.startsWith('text-') && c !== 'text-h2');
    assert.deepEqual(colorClasses, [expectedColor], `tone ${tone}: "${value}"`);
  }
});

test('a danger value tone colors text only -- the value slot carries no background utility', () => {
  const value = statCardStyles({ tone: 'danger' }).value();
  assert.match(value, /text-error/);
  assert.doesNotMatch(value, /\bbg-/);
});

test('tone and deltaTone are independent: a danger value can carry a positive delta, matching React\'s own demo', () => {
  const styles = statCardStyles({ tone: 'danger', deltaTone: 'positive' });
  assert.match(styles.value(), /text-error/);
  assert.match(styles.delta(), /border-success/);
  assert.match(styles.delta(), /text-success/);
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
