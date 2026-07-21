/* See tag-variants.test.ts for why this suite lives here rather than under
 * scripts/: node cannot resolve the extensionless imports this layer's
 * recipes use. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { alertStyles } from '../primitives/alert/alert.variants';

test('the default tone is info', () => {
  assert.equal(alertStyles().root(), alertStyles({ tone: 'info' }).root());
});

test('danger is outline -- border and content in --error, at a soft tint rather than the filled danger surface', () => {
  const root = alertStyles({ tone: 'danger' }).root();
  assert.match(root, /border-error/);
  assert.match(root, /bg-error\/14/);
  assert.doesNotMatch(root, /\bbg-error\b(?!\/)/);
  assert.match(alertStyles({ tone: 'danger' }).icon(), /text-error/);
  assert.match(alertStyles({ tone: 'danger' }).action(), /text-error/);
});

test('every tone colors its root, icon and action from the same status family, never the danger family', () => {
  const expect = {
    info: 'info', success: 'success', warning: 'warning', danger: 'error', neutral: 'neutral',
  } as const;
  for (const [tone, family] of Object.entries(expect) as [keyof typeof expect, string][]) {
    const styles = alertStyles({ tone });
    assert.match(styles.root(), new RegExp(`border-${family}\\b`));
    assert.match(styles.icon(), new RegExp(`text-${family}\\b`));
    assert.match(styles.action(), new RegExp(`text-${family}\\b`));
  }
});

test('the root slot carries a display utility, unaffected by tone', () => {
  for (const tone of ['info', 'success', 'warning', 'danger', 'neutral'] as const) {
    assert.match(alertStyles({ tone }).root(), /\bflex\b/);
  }
});

test('the close and action controls carry no border or fill of their own -- they are text-only chrome', () => {
  const styles = alertStyles();
  assert.match(styles.action(), /bg-transparent/);
  assert.match(styles.action(), /border-none/);
  assert.match(styles.close(), /bg-transparent/);
  assert.match(styles.close(), /border-none/);
});

test('the message slot carries the title-separating margin when a title is present', () => {
  assert.match(alertStyles({ titled: true }).message(), /\bmt-1\b/);
});

test('the message slot carries no margin when there is no title -- the default, matching React\'s unset marginTop', () => {
  assert.doesNotMatch(alertStyles({ titled: false }).message(), /\bmt-1\b/);
  assert.doesNotMatch(alertStyles().message(), /\bmt-1\b/);
});
