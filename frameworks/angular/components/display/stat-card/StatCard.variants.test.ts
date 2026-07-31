import test from 'node:test';
import assert from 'node:assert/strict';
import { statCardStyles } from './StatCard.variants';

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

test('tone and deltaTone are independent: a danger value can carry a positive delta, which is why StatCard.json declares them separately', () => {
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
