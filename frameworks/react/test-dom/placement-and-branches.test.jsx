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
import { mount, cleanup, act } from './harness.jsx';
import { assertPattern, assertPatternCases, REACT_COMPONENTS } from './assert-pattern.jsx';
import { isFocusable } from '../../../scripts/lib/behaviour-compliance.mjs';
import { Menu } from '../components/navigation/Menu.jsx';
import { Skeleton } from '../components/display/Skeleton.jsx';
import { CalendarEvent } from '../components/display/CalendarEvent.jsx';

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

test('Skeleton meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'display/Skeleton.behaviour.json'),
    cases: {
      // status requires focus.unaffected, which is undecidable from the DOM
      // alone: the div carries no tabIndex and nothing auto-focuses it, so a
      // status update never receives or moves keyboard focus.
      placeholder: () => ({
        root: mount(<Skeleton variant="block" />),
        behavioural: { 'focus.unaffected': true },
      }),
      circle: () => ({ root: mount(<Skeleton variant="circle" />) }),
    },
  });
});

/* A THIRD PLACEMENT DEFECT, and the one this directory was restored just in time
 * to catch. `Calendar` keeps a map of event id -> the chip's forwarded ref and
 * calls node.focus() on it when Enter steps in from an hour cell. A chip
 * carrying an action panel is a <div> — the chip cannot be a <button> with a
 * kebab inside it — so the interactive attributes move down to a body <button>,
 * and the ref has to move with them. It did not: the ref stayed on the root, the
 * root carried no tabindex, and Enter focused a <div> that cannot take focus.
 * Measured in Chromium; the chip looked and behaved correctly to a mouse.
 *
 * Every other guard is blind to it. The static one-tab-stop count in
 * calendar.test.jsx PASSED BECAUSE OF the bug. And happy-dom's focus() focuses
 * non-focusable elements, so asserting that focus moves would pass here whether
 * the ref were right or wrong — which is why this asserts the IDENTITY of the
 * element the ref landed on instead, and why `Calendar`'s own Enter route stays
 * on the by-hand checklist in CalendarEvent.prompt.md under the grid rule. */
test('CalendarEvent hands its ref to the element that takes focus, panel or no panel', () => {
  const injected = {
    box: {}, color: 'var(--color-cat-1)', timeLabel: '09:00 – 09:30',
    dateLabel: 'Monday 20 July', tabIndex: -1,
  };
  const plain = React.createRef();
  mount(<CalendarEvent ref={plain} id="a" title="Standup" start="2026-07-20T09:00:00Z"
    end="2026-07-20T09:30:00Z" onClick={() => {}} {...injected} />);
  assert.equal(plain.current.tagName, 'BUTTON', 'the plain chip is not its own button any more');
  assert.equal(plain.current.getAttribute('tabindex'), '-1',
    'the plain chip cannot be focused programmatically');

  const paneled = React.createRef();
  mount(<CalendarEvent ref={paneled} id="b" title="Standup" start="2026-07-20T09:00:00Z"
    end="2026-07-20T09:30:00Z" onClick={() => {}} actionsEnabled
    actions={<button type="button">Delete</button>} {...injected} />);
  assert.equal(paneled.current.tagName, 'BUTTON',
    'a paneled chip forwarded its ref to an element Calendar cannot focus');
  assert.equal(paneled.current.getAttribute('tabindex'), '-1',
    'the paneled chip body cannot be focused programmatically');
  /* The body, not the kebab: the kebab is focusable too, and a ref pointing at
     it would land focus on the wrong control while passing every check above. */
  assert.match(paneled.current.getAttribute('aria-label'), /^Standup,/,
    'the ref landed on the kebab rather than on the chip body');
});

/* THE KEYBOARD ROUTE TO THE KEBAB, pinned here rather than by hand.
 *
 * Calendar binds `grid` and is therefore hand-tested under this repo's grid
 * rule, but CalendarEvent binds `button` and is not -- so a chip mounted on its
 * own costs none of the RAM the rule exists to avoid, and the whole route lives
 * inside the chip. What still belongs on the by-hand checklist is the part that
 * needs Calendar around it: that Enter from an hour cell arrives here at all.
 *
 * Arrows and not Tab, because Tab must LEAVE a composite -- making the kebab
 * tabbable is exactly what would falsify Calendar's `focus.roving`. Calendar's
 * own handler ignores anything whose target is not a gridcell, so arrows inside
 * a chip cannot collide with arrows inside a cell. */
const CHIP = {
  box: {}, color: 'var(--color-cat-1)', timeLabel: '09:00 – 09:30',
  dateLabel: 'Monday 20 July', tabIndex: -1,
};
const mountChip = (extra) => mount(
  <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
    onClick={() => {}} actionsEnabled actions={<button type="button">Delete</button>}
    {...CHIP} {...extra} />,
);
const kebabOf = (c) => [...c.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Actions');
const bodyOf = (c) => [...c.querySelectorAll('button')].find((b) => /^Standup,/.test(b.getAttribute('aria-label') || ''));
const press = (el, key) => act(() => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
});

test('ArrowRight steps from the chip body to its kebab, and ArrowLeft steps back', () => {
  const c = mountChip();
  const body = bodyOf(c);
  const kebab = kebabOf(c);
  assert.ok(body && kebab, 'the fixture did not render both a body and a kebab');
  assert.equal(kebab.getAttribute('tabindex'), '-1',
    'the kebab is in the page Tab sequence -- focus.roving would be false');

  act(() => { body.focus(); });
  press(body, 'ArrowRight');
  assert.equal(document.activeElement, kebab, 'ArrowRight did not reach the kebab');

  press(kebab, 'ArrowLeft');
  assert.equal(document.activeElement, body, 'ArrowLeft did not step back to the chip body');
});

test('opening the panel moves focus into it, and Escape closes it and returns to the kebab', () => {
  const c = mountChip();
  const kebab = kebabOf(c);

  act(() => { kebab.focus(); kebab.click(); });
  const del = [...c.querySelectorAll('button')].find((b) => b.textContent === 'Delete');
  assert.ok(del, 'activating the kebab did not open the panel');
  /* Landing ON the opener is the defect CLAUDE.md records of Menu; a keyboard
     user left there has no way in, because Tab leaves the grid. */
  assert.equal(document.activeElement, del, 'the panel opened without taking focus');

  press(del, 'Escape');
  assert.equal([...c.querySelectorAll('button')].some((b) => b.textContent === 'Delete'), false,
    'Escape did not close the panel');
  /* Not <body>: the focused control was just unmounted, and letting focus fall
     to the document would throw the user out of the grid entirely. */
  assert.equal(document.activeElement, kebab, 'Escape dropped focus instead of returning it to the kebab');
});

test('a chip opened by defaultPanelOpen does not steal focus on mount', () => {
  const before = document.activeElement;
  const c = mountChip({ defaultPanelOpen: true });
  assert.ok([...c.querySelectorAll('button')].some((b) => b.textContent === 'Delete'),
    'defaultPanelOpen did not render the panel');
  assert.equal(document.activeElement, before,
    'a chip mounted with its panel open pulled focus out of whatever had it');
});
