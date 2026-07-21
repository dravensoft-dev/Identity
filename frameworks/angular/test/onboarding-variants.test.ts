/* Plan 5a's Onboarding slice, added beside confirm-dialog-variants.test.ts per
 * this directory's own header comment: what is worth asserting is the recipe.
 * Onboarding shares ConfirmDialog's overlay resolution (root IS the recipe's
 * fixed scrim, host-bound, `open` driving it between the overlay and
 * `hidden`) but not its centering: the panel positions itself, so `root`
 * carries no `flex` -- these tests pin that shape rather than assuming it. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingStyles } from '../primitives/onboarding/onboarding.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default placement is floating', () => {
  assert.equal(onboardingStyles().panel(), onboardingStyles({ placement: 'floating' }).panel());
});

test('floating pins the panel to the bottom-right corner', () => {
  const panel = tokens(onboardingStyles({ placement: 'floating' }).panel());
  assert.ok(panel.includes('right-6'), `expected right-6 in "${panel.join(' ')}"`);
  assert.ok(panel.includes('bottom-6'), `expected bottom-6 in "${panel.join(' ')}"`);
});

test('anchored contributes no corner classes, so the clamp\'s inline top/left is never fought', () => {
  const floating = tokens(onboardingStyles({ placement: 'floating' }).panel());
  const anchored = tokens(onboardingStyles({ placement: 'anchored' }).panel());
  assert.ok(!anchored.includes('right-6'));
  assert.ok(!anchored.includes('bottom-6'));
  // Anchored keeps every base class floating also has; only the corner is removed.
  for (const cls of floating) {
    if (cls === 'right-6' || cls === 'bottom-6') continue;
    assert.ok(anchored.includes(cls), `anchored is missing base class "${cls}"`);
  }
});

test('open=false hides the root overlay; open=true renders it as the fixed scrim', () => {
  const closed = tokens(onboardingStyles({ open: false }).root());
  assert.ok(closed.includes('hidden'), `expected "hidden" in "${closed.join(' ')}"`);

  const open = tokens(onboardingStyles({ open: true }).root());
  assert.ok(!open.includes('hidden'));
  assert.ok(open.includes('fixed'), `expected "fixed" in "${open.join(' ')}"`);
  assert.ok(open.includes('bg-scrim'), `expected "bg-scrim" in "${open.join(' ')}"`);
});

test('the closed default keeps the root hidden -- open defaults to false, matching the component\'s own default input', () => {
  assert.equal(onboardingStyles().root(), onboardingStyles({ open: false }).root());
});

test('the root slot carries a display utility in its own base string, independent of the open variant', () => {
  // This is the property frameworks/angular/test/host-class-binding.test.ts
  // machine-checks against every primitive's manifest on disk; this asserts
  // the same thing against the recipe's own default output.
  assert.match(onboardingStyles({ open: true }).root(), /\bblock\b/);
});

test('the root carries no centering layout -- the panel positions itself, unlike ConfirmDialog\'s centered overlay', () => {
  const root = tokens(onboardingStyles({ open: true }).root());
  assert.ok(!root.includes('flex'), 'onboarding\'s root must not center its panel; the panel is independently positioned');
});

test('the active dot is wider and on the primary color; an inactive dot is narrower and on neutral', () => {
  const dotOn = tokens(onboardingStyles().dotOn());
  const dotOff = tokens(onboardingStyles().dotOff());
  assert.ok(dotOn.includes('w-4.5'), `expected w-4.5 in "${dotOn.join(' ')}"`);
  assert.ok(dotOn.includes('bg-primary'), `expected bg-primary in "${dotOn.join(' ')}"`);
  assert.ok(dotOff.includes('w-2'), `expected w-2 in "${dotOff.join(' ')}"`);
  assert.ok(dotOff.includes('bg-neutral'), `expected bg-neutral in "${dotOff.join(' ')}"`);
});

test('the dot\'s width transition rides the token duration scale, not a literal', () => {
  const dot = onboardingStyles().dot();
  assert.match(dot, /duration-\[var\(--dur-mid\)\]/);
});
