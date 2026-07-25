/* The two mistakes a text scan cannot catch, pinned against a real tree.
 *
 * A static scan over these sources was built and measured before this layer
 * existed, and it got both of these components backwards. The reason is the same
 * in each case: the text a scan matches is identical whether the code is right or
 * wrong, and only a rendered tree tells the two apart.
 *
 *   Placement. Menu.jsx:41 renders
 *     <span onClick={…} aria-haspopup="menu" aria-expanded={open}>{trigger}</span>
 *   The attributes ARE in the source, spelled exactly as a correct implementation
 *   would spell them — so a scan reports roles.haspopup and roles.expanded met and
 *   retires two true exceptions. What is wrong is not the attribute but the element
 *   under it: a <span> takes no focus, and ARIA state on an ancestor is not
 *   inherited by the focused descendant. A screen reader sitting on the real
 *   trigger <button> is told nothing. The DOM settles it in one line — the carrier
 *   is a SPAN and isFocusable() says false, while the button focus actually reaches
 *   carries neither attribute.
 *
 *   Branches. Skeleton.jsx renders role="status" aria-label="Loading" for the
 *   block, line and multi-line text variants, and aria-hidden="true" with no role
 *   at all for circle. A scan sees role="status" present in the file and retires
 *   both of Skeleton's exceptions — which are about the one branch that lacks it.
 *   Rendering all four variants is what separates "the file contains this" from
 *   "this component produces this".
 *
 * These are not hypothetical failure modes. They are the two mistakes 7b's review
 * found by hand, and the reason a scan was measured and then cut in favour of a
 * DOM. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { isFocusable } from '../../../scripts/lib/behaviour-compliance.mjs';
import { Menu } from '../components/navigation/Menu.jsx';
import { Skeleton } from '../components/display/Skeleton.jsx';

afterEach(cleanup);

test('Menu carries aria-haspopup on an element that cannot take focus — the exception stands', () => {
  const container = mount(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} />,
  );
  const carrier = container.querySelector('[aria-haspopup]');
  assert.notEqual(carrier, null);
  // This is the assertion a text scan cannot make: the attribute exists, and the
  // element holding it is not the one a screen reader lands on.
  assert.equal(carrier.tagName, 'SPAN');
  assert.equal(isFocusable(carrier), false);
  // ...while the real trigger, which focus does reach, carries neither state.
  const trigger = container.querySelector('button');
  assert.equal(isFocusable(trigger), true);
  assert.equal(trigger.getAttribute('aria-haspopup'), null);
  assert.equal(trigger.getAttribute('aria-expanded'), null);
});

test('Menu matches its menu-button binding when the subject is the focusable trigger', () => {
  const container = mount(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} />,
  );
  const trigger = container.querySelector('button');
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'navigation/Menu.behaviour.json'),
    // Every role/state requirement is about the element focus reaches. Naming it
    // is what makes the haspopup and expanded exceptions verifiably true rather
    // than verifiably false.
    subjects: { default: trigger },
    behavioural: { 'focus.onOpen': false, 'keyboard.Enter': false, 'keyboard.Space': false, 'keyboard.Escape': false },
  });
});

const VARIANTS = ['block', 'line', 'text', 'circle'];

test('Skeleton renders role=status in three variants and not in circle', () => {
  const seen = {};
  for (const variant of VARIANTS) {
    const container = mount(<Skeleton variant={variant} />);
    seen[variant] = Boolean(container.querySelector('[role="status"]'));
    cleanup();
  }
  assert.deepEqual(seen, { block: true, line: true, text: true, circle: false });
});

test('Skeleton circle is aria-hidden with no live region — both exceptions stand', () => {
  const container = mount(<Skeleton variant="circle" />);
  const el = container.firstElementChild;
  assert.equal(el.getAttribute('aria-hidden'), 'true');
  assert.equal(el.getAttribute('role'), null);
  assert.equal(el.getAttribute('aria-live'), null);
});

/* Asserted against `circle`, and the variant is the whole point.
 *
 * This test was first written against `block`, and it failed with exactly two
 * problems: roles.element and live.politeness reported STALE EXCEPTION. That
 * failure was correct. Of the block variant those two exceptions ARE false —
 * block renders role="status", which carries an implicit polite live region — and
 * a binding that excepted them for block would be excusing a defect that variant
 * does not have.
 *
 * The honest resolution is not to delete the exceptions: they are true, of the
 * circle variant, which renders aria-hidden="true" and no role at all, and the
 * reason strings on file say so in as many words. It is to assert against the
 * variant the exceptions describe. So this renders `circle`.
 *
 * What that leaves behind is a real gap, and it is worth naming rather than
 * quietly stepping over: a binding is per component, so it has no way to say
 * "true in one variant, false in the other three", and nothing stops a reader of
 * Skeleton.behaviour.json alone from concluding no variant ever announces itself.
 * The reason strings carry that scoping in prose only. It is the same gap the
 * spec already records for Tag, whose `button` pattern applies only when
 * `onRemove` is passed, and calls unresolved. Widening the schema to fix it is
 * out of scope here; it is recorded as debt. */
test('Skeleton matches its status binding on the circle variant, which is what its exceptions describe', () => {
  const container = mount(<Skeleton variant="circle" />);
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'display/Skeleton.behaviour.json'),
    subjects: { default: container.firstElementChild },
    behavioural: { 'focus.unaffected': true },
  });
});
