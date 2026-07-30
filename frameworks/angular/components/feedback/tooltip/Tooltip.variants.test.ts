/* The anchored axis is why this manifest has variants at all: the same bubble is positioned by
 * the wrapper in the Tailwind specimen and by a CDK overlay pane in the Angular component, and
 * only the second one must not carry the wrapper-relative classes. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { tooltipStyles } from './Tooltip.variants';

const POSITIONING = ['absolute', 'bottom-full', 'left-1/2', '-translate-x-1/2', '-translate-y-2'];

test('the default is the in-flow bubble, which is what the Tailwind specimen renders', () => {
  assert.equal(tooltipStyles().bubble(), tooltipStyles({ anchored: false }).bubble());
  assert.equal(tooltipStyles().root(), tooltipStyles({ anchored: false }).root());
});

test('in flow, the bubble is positioned against a relative root', () => {
  const styles = tooltipStyles({ anchored: false });
  assert.match(styles.root(), /\brelative\b/);
  for (const utility of POSITIONING) {
    assert.ok(styles.bubble().split(/\s+/).includes(utility), `the in-flow bubble lost ${utility}`);
  }
});

test('anchored, every wrapper-relative utility is gone -- the overlay pane owns the position', () => {
  const styles = tooltipStyles({ anchored: true });
  assert.doesNotMatch(styles.root(), /\brelative\b/);
  for (const utility of POSITIONING) {
    assert.ok(!styles.bubble().split(/\s+/).includes(utility),
      `${utility} survived into the anchored bubble, where it fights the overlay's own positioning`);
  }
});

test('the appearance is identical in both models -- only the position moves', () => {
  const shared = ['arena-fade', 'z-tooltip', 'whitespace-nowrap', 'rounded-sm', 'shadow-2',
    'bg-base-content', 'text-base-100', 'font-mono', 'text-ctl-xs'];
  for (const anchored of [true, false]) {
    const classes = tooltipStyles({ anchored }).bubble().split(/\s+/);
    for (const utility of shared) {
      assert.ok(classes.includes(utility), `anchored=${anchored} lost ${utility}`);
    }
  }
});

test('the root keeps a display utility in both models, so host-binding it never collapses', () => {
  for (const anchored of [true, false]) {
    assert.match(tooltipStyles({ anchored }).root(), /\binline-flex\b/);
  }
});
