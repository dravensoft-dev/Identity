/* Onboarding against dialog-modal, in both directions — and the whole of this
 * component's DOM coverage, which was nothing at all before plan 8C4's Task 5.
 *
 * The shape is dialog-modal.test.jsx's and behavioural.test.jsx's, merged into
 * one file because Onboarding arrives with no suite: the assertPattern call that
 * compares the rendered tree against the binding, and, beside it, the behavioural
 * tests that establish every verdict that call declares. Splitting them across
 * two files buys nothing here — there is no second component sharing either half.
 *
 * For each of the pattern's seven requirements this suite states one thing: the
 * requirement is met in the rendered DOM and the binding declares no exception,
 * or it is not met and the binding declares one. That single statement is the
 * stale-exception rule, and this file is what retires all five of Onboarding's
 * exceptions at once: roles.label, focus.onOpen, focus.onClose, focus.trap and
 * keyboard.Escape were every exception the binding carried, and it now carries
 * none.
 *
 * WHAT A SUITE CAN AND CANNOT PROVE ABOUT focus.trap, unchanged from the other
 * two components and repeated because it governs the verdict below:
 *
 *   THE BOUNDARY IS OURS AND IS PROVED HERE. Shift+Tab on the first focusable
 *     landing on the last, and Tab on the last landing on the first, are
 *     `.focus()` calls made by our own handler in
 *     frameworks/react/use-dialog-modal.js. happy-dom honours .focus(), so both
 *     are real assertions about real behaviour, and both are below.
 *
 *   THE INTERIOR IS THE BROWSER'S AND IS NOT PROVABLE. That Tab from a MIDDLE
 *     element reaches the next one is native sequential focus navigation. We do
 *     not implement it — the trap leaves a middle element alone on purpose — and
 *     happy-dom does not implement it either, so an assertion about where focus
 *     landed there would pass identically against a perfect trap and against
 *     none. That half is checked in Chromium by hand, as a written checklist in
 *     the component's prompt. A BROWSER-DRIVEN GATE IS STILL REFUSED: it would be
 *     this repo's fourth non-portable gate.
 *
 * DO NOT CITE THE ANGULAR SUITES AS EVIDENCE FOR ANY VERDICT HERE, including
 * Angular's own arena-onboarding, which shares this component's name and shares
 * none of its code. React's contract is proved by React's own assertions or it is
 * not proved.
 *
 * THE ACCESSIBLE NAME IS A FALLBACK CHAIN, NOT A REQUIRED TITLE, and the last two
 * tests are what stand behind roles.label retiring. `OnboardingStep.title` is
 * optional in a shipped two-layer contract, so Dialog's and ConfirmDialog's
 * answer — guard the title and throw — was not available without breaking that
 * contract and moving Angular too. React adopts the chain Angular already
 * computes instead (Onboarding.ts's `label`), so the two layers agree by
 * construction. assertPattern only ever sees the titled case; the two fallback
 * arms need their own assertions or they are a claim nothing checks. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Onboarding } from '../components/feedback/Onboarding.jsx';

afterEach(cleanup);

/* `true` means "this requirement IS met". Every verdict here is established by a
 * test in this same file, named beside it — a verdict flipped with nothing under
 * it pins a claim the suite does not check, which is the exact rot this layer
 * exists to end.
 *
 * The map is Onboarding's alone and is deliberately not shared with
 * dialog-modal.test.jsx's two. Those were split from a single shared map for a
 * reason that applies here with more force: a map that has to be true of three
 * components forces three components into one commit, and Onboarding moved a task
 * after the other two. */
const ONBOARDING_BEHAVIOURAL = {
  // 'Onboarding moves focus into the coachmark on open'
  'focus.onOpen': true,
  // 'Onboarding restores focus to the invoker on close'
  'focus.onClose': true,
  // the two boundary-wrap tests below
  'focus.trap': true,
  // 'Onboarding dismisses on Escape'
  'keyboard.Escape': true,
};

/** Dispatch a real keydown on an element and let React flush. Dispatched on the
 *  panel itself and allowed to bubble, so a handler bound anywhere from the panel
 *  up to document would still be caught.
 *
 *  `init` carries the modifier flags: the trap reads `shiftKey` off the event, and
 *  a bare `{ key, bubbles }` would leave it false and make a wrap test pass in the
 *  wrong direction. Same shape as behavioural.test.jsx's. */
function press(el, key, init = {}) {
  act(() => {
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, ...init }));
  });
}

/** Click an element and let React flush. */
function click(el) {
  act(() => {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
}

/* Three steps at index 1 on purpose, wherever the number of focusables matters:
 * that is the only configuration in which the coachmark renders all three of its
 * buttons. Back appears when index > 0, Skip when the step is not the last, and
 * the primary button is always there — so the first and last focusables are
 * genuinely different elements and a boundary wrap has somewhere to land. */
const THREE_STEPS = [
  { title: 'Welcome', body: 'One' },
  { title: 'Command palette', body: 'Two' },
  { title: 'All set', body: 'Three' },
];

test('Onboarding matches its dialog-modal binding, in both directions', () => {
  const container = mount(
    <Onboarding open steps={[{ title: 'Welcome', body: 'Body' }]} index={0} onSkip={() => {}} />,
  );
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'feedback/Onboarding.behaviour.json'),
    // The coachmark renders a fragment — scrim first, panel second — so the
    // container's first element child is the scrim, which carries neither role
    // nor aria-modal. The subject has to be named by selector.
    subjects: { default: container.querySelector('[role="dialog"]') },
    behavioural: ONBOARDING_BEHAVIOURAL,
  });
});

test('Onboarding dismisses on Escape -- keyboard.Escape is met', () => {
  /* Escape reports through `onSkip`, the component's OWN dismissal channel and
   * the one Angular's arena-onboarding already routes its Escape to, so no new
   * member appears in either layer. The exception this retires read "No keydown
   * listener anywhere." */
  let skipped = false;
  const container = mount(
    <Onboarding open steps={THREE_STEPS} index={1} onSkip={() => { skipped = true; }} />,
  );
  press(container.querySelector('[role="dialog"]'), 'Escape');
  assert.equal(skipped, true, 'Escape did not reach the coachmark\'s own dismissal channel');
});

test('Onboarding still dismisses on a scrim click -- the mouse path Escape joins rather than replaces', () => {
  /* The scrim's onClick={onSkip} predates all of this and stays. The exception
   * Escape retires named it explicitly ("The scrim has onClick={onSkip}, so a
   * mouse click outside dismisses it, but there is no keyboard equivalent"), so
   * the keyboard path arriving must not cost the mouse one. Nothing else covers
   * it. */
  let skipped = false;
  const container = mount(
    <Onboarding open steps={THREE_STEPS} index={1} onSkip={() => { skipped = true; }} />,
  );
  const scrim = container.querySelector('[role="dialog"]').previousElementSibling;
  assert.notEqual(scrim, null, 'precondition: the panel has a scrim sibling before it');
  click(scrim);
  assert.equal(skipped, true, 'the scrim click must still dismiss');
});

test('Onboarding moves focus to the first focusable inside the panel on open -- focus.onOpen is met', () => {
  /* Focus a real element first. Without this activeElement is already body and
   * "focus moved into the panel" would be indistinguishable from "focus was never
   * anywhere else", so the test would pass for a weaker reason than it claims. */
  const invoker = document.createElement('button');
  document.body.appendChild(invoker);
  invoker.focus();
  assert.equal(document.activeElement, invoker, 'precondition: the invoker holds focus');

  const container = mount(
    <Onboarding open steps={THREE_STEPS} index={1} onSkip={() => {}} />,
  );
  const panel = container.querySelector('[role="dialog"]');
  assert.notEqual(document.activeElement, invoker, 'focus stayed on the invoker, outside the coachmark');
  assert.equal(
    document.activeElement,
    panel.querySelector('button'),
    'the coachmark\'s first focusable descendant did not receive focus',
  );
  invoker.remove();
});

/* focus.onClose is "restore-invoker", and it needs a component that can actually
 * close — mounting `open` and asserting nothing would prove nothing. This wrapper
 * holds the open state so onSkip really unmounts the coachmark.
 *
 * IT STARTS CLOSED, AND THAT IS THE WHOLE POINT, for the reason DialogHarness in
 * behavioural.test.jsx records: every real restore-the-invoker captures
 * document.activeElement at the instant `open` becomes true. A harness that
 * mounts open and focuses the invoker afterwards captures body, restores body,
 * and passes against an implementation that does nothing useful. Opening BY
 * CLICKING THE ALREADY-FOCUSED INVOKER is what makes the invoker genuinely the
 * previously-focused element at capture time. */
function OnboardingHarness() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button type="button" data-role="invoker" onClick={() => setOpen(true)}>Open</button>
      <Onboarding open={open} steps={THREE_STEPS} index={1} onSkip={() => setOpen(false)} />
    </div>
  );
}

test('Onboarding restores focus to the invoker on close -- focus.onClose is met', () => {
  const container = mount(<OnboardingHarness />);
  const invoker = container.querySelector('[data-role="invoker"]');
  invoker.focus();
  assert.equal(document.activeElement, invoker, 'precondition: the invoker holds focus');
  assert.equal(container.querySelector('[role="dialog"]'), null, 'precondition: the coachmark starts closed');

  click(invoker);
  const panel = container.querySelector('[role="dialog"]');
  assert.notEqual(panel, null, 'precondition: the click opened the coachmark');

  /* Asserting this here is what proves focus.onOpen and focus.onClose compose
   * rather than each being true in isolation: focus really is inside the panel
   * when the panel goes away. */
  assert.equal(document.activeElement, panel.querySelector('button'), 'precondition: opening put focus inside the coachmark');

  click(panel.previousElementSibling);
  assert.equal(container.querySelector('[role="dialog"]'), null, 'precondition: the scrim click really closed the coachmark');

  assert.equal(document.activeElement, invoker, 'focus was not restored to the invoker that opened the coachmark');
});

test('Onboarding wraps Shift+Tab from the first focusable to the last -- focus.trap is met at the boundary', () => {
  const container = mount(
    <Onboarding open steps={THREE_STEPS} index={1} onSkip={() => {}} onBack={() => {}} onNext={() => {}} />,
  );
  const panel = container.querySelector('[role="dialog"]');
  const buttons = panel.querySelectorAll('button');
  assert.equal(buttons.length, 3, 'precondition: a middle step renders Back, Skip and Next');
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  act(() => { first.focus(); });
  assert.equal(document.activeElement, first, 'precondition: the first focusable holds focus');
  press(first, 'Tab', { shiftKey: true });
  assert.equal(document.activeElement, last, 'Shift+Tab at the first boundary did not wrap to the last');
});

test('Onboarding wraps Tab from the last focusable to the first -- the other boundary', () => {
  const container = mount(
    <Onboarding open steps={THREE_STEPS} index={1} onSkip={() => {}} onBack={() => {}} onNext={() => {}} />,
  );
  const panel = container.querySelector('[role="dialog"]');
  const buttons = panel.querySelectorAll('button');
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  act(() => { last.focus(); });
  assert.equal(document.activeElement, last, 'precondition: the last focusable holds focus');
  press(last, 'Tab');
  assert.equal(document.activeElement, first, 'Tab at the last boundary did not wrap to the first');
});

/* The two arms of the name chain assertPattern never sees. It renders one titled
 * step and reads the aria-label off it, so it proves the first arm and nothing
 * else — and the exception roles.label retires was about the OTHER arms: "a step
 * that omits title renders the dialog with no aria-label at all". */

test('Onboarding falls back to the step eyebrow when the step has no title -- roles.label is met on an untitled step', () => {
  const container = mount(
    <Onboarding open steps={[{ eyebrow: 'Welcome', body: 'Body' }]} index={0} onSkip={() => {}} />,
  );
  const panel = container.querySelector('[role="dialog"]');
  assert.equal(panel.getAttribute('aria-label'), 'Welcome', 'an untitled step must borrow the eyebrow as its name');
});

test('Onboarding falls back to a positional name when the step has neither title nor eyebrow', () => {
  /* THE LAST ARM, AND THE ONE THAT COSTS SOMETHING. "Step 2 of 3" is a name that
   * is present and mechanically satisfying while telling a screen-reader user
   * nothing about the subject, and it is byte-for-byte the aria-label the progress
   * dots inside this same panel already carry — so a step with no editorial text
   * announces the dialog and its dots identically. That collision is real, it is
   * shipped in Angular today (Onboarding.ts's dots -- grep -n "dots()"
   * frameworks/angular/components/feedback/onboarding/Onboarding.ts -- and its
   * `label` computed), and it is mirrored here rather than dodged: a different third arm
   * would break the property that the two layers agree by construction, which is
   * the entire ground on which OnboardingStep.title was allowed to stay optional.
   * A caller who wants a useful name supplies a step title. */
  const container = mount(
    <Onboarding open steps={[{ body: 'One' }, { body: 'Two' }, { body: 'Three' }]} index={1} onSkip={() => {}} />,
  );
  const panel = container.querySelector('[role="dialog"]');
  assert.equal(panel.getAttribute('aria-label'), 'Step 2 of 3', 'a step with no editorial text must still name the dialog positionally');
  const dots = panel.querySelector('[aria-label="Step 2 of 3"]:not([role="dialog"])');
  assert.notEqual(dots, null, 'the collision this fallback carries is with the dots label, and it is recorded rather than dodged');
});
