/* `arena-onboarding` renders `role="dialog" aria-modal="true"`, and until the
 * final whole-branch review it asserted that with no focus management at all:
 * no trap, no focus moved into the panel on open, no restore on close, no
 * Escape. `aria-modal="true"` tells assistive technology the rest of the page
 * is unavailable, so leaving Tab free to walk into it is a contradiction the
 * user experiences directly -- and with focus never moved in, a keyboard user
 * had to tab the entire page behind the scrim to reach "Next".
 *
 * This is the third occurrence of the same defect on this branch
 * (`arena-confirm-dialog` first, `arena-command-palette` second). Onboarding
 * was written before the shared helper existed, which is why it was missed.
 * The fix reuses `frameworks/angular/primitives/focus-trap.ts` unchanged
 * rather than adding a fourth implementation, so this suite exercises the same
 * functions the component's own constructor and `onKeydown` call, against a
 * hand-built DOM tree shaped like Onboarding's panel.
 *
 * This does NOT render `<arena-onboarding>` through TestBed, for the reason
 * `confirm-dialog-focus-trap.test.ts` and `host-class-binding.test.ts` both
 * document at length: this harness runs bun's TypeScript stripping plus
 * `@angular/compiler`'s runtime JIT and never `ngtsc`, so a signal `input()`
 * is never discovered into `ɵcmp.inputs` and neither a template binding nor
 * `componentRef.setInput()` can drive `open` -- NG0303 on the former, a silent
 * no-op on the latter. `open` can never become `true` here, so `@if
 * (visible())` can never render the panel, and no TestBed-based test of this
 * component can exercise an actually-open tour. What that leaves unproven is
 * stated in `components-divergences.md`: that the component's own
 * `afterRenderEffect` and `onKeydown` call these functions at the right
 * moment. `ngc --strictTemplates` (`bun run check:angular`) is what proves
 * that wiring compiles against the component's real `viewChild` and
 * `inject(DOCUMENT)` types.
 *
 * No TestBed here, so nothing to initialise -- only a DOM, taken from the
 * directory's shared one (`ensureDom()`, testbed-env.ts) rather than
 * registered and unregistered per file, matching the two sibling focus-trap
 * suites. See that file for why the document has to be shared. */
import { ensureDom } from './testbed-env';
ensureDom();

import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  type FocusTrapState,
  focusFirstFocusable,
  focusableElements,
  handleOpenTransition,
  trapTabKey,
} from '../primitives/focus-trap';

/** A page behind the scrim, with a real focusable control on it. Every trap
 *  assertion below is ultimately about this button: an `aria-modal` overlay
 *  must never hand it focus while it is open. */
function buildPageBehind(): HTMLElement {
  const behind = document.createElement('button');
  behind.textContent = 'a control on the page behind the scrim';
  document.body.appendChild(behind);
  return behind;
}

/** Onboarding's panel as its template renders it on a middle step: the dots
 *  (a non-focusable div), then Back, Skip and Next. The panel itself carries
 *  `tabindex="-1"`, as the component now does. */
function buildPanel(): { panel: HTMLElement; back: HTMLElement; skip: HTMLElement; next: HTMLElement } {
  const panel = document.createElement('div');
  panel.setAttribute('tabindex', '-1');
  const dots = document.createElement('div');
  dots.textContent = '···';
  const back = document.createElement('button');
  back.textContent = 'Back';
  const skip = document.createElement('button');
  skip.textContent = 'Skip';
  const next = document.createElement('button');
  next.textContent = 'Next';
  panel.append(dots, back, skip, next);
  document.body.appendChild(panel);
  return { panel, back, skip, next };
}

/** The first step's panel: `@if (index() > 0)` omits Back, so the first
 *  focusable is Skip rather than Back. */
function buildFirstStepPanel(): { panel: HTMLElement; skip: HTMLElement; next: HTMLElement } {
  const panel = document.createElement('div');
  panel.setAttribute('tabindex', '-1');
  const skip = document.createElement('button');
  skip.textContent = 'Skip';
  const next = document.createElement('button');
  next.textContent = 'Next';
  panel.append(skip, next);
  document.body.appendChild(panel);
  return { panel, skip, next };
}

function keydownTab(shiftKey: boolean): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true, bubbles: true });
}

beforeEach(() => {
  document.body.innerHTML = '';
});

test('the panel\'s focusable set is Back, Skip, Next in DOM order -- the dots div is not a tab stop', () => {
  const { panel, back, skip, next } = buildPanel();
  assert.deepEqual(focusableElements(panel), [back, skip, next]);
});

test('opening moves focus onto Back, so a keyboard user reaches Next in two keys rather than tabbing the whole page', () => {
  const trigger = document.createElement('button');
  trigger.textContent = 'Start tour';
  document.body.appendChild(trigger);
  trigger.focus();

  const { panel, back } = buildPanel();
  const state: FocusTrapState = { wasOpen: false, restoreTo: null };
  handleOpenTransition(state, true, panel, document.activeElement);

  assert.equal(document.activeElement, back, 'opening must move focus into the panel');
  assert.equal(state.restoreTo, trigger, 'the element focused before opening must be remembered');
  assert.equal(state.wasOpen, true);
});

test('on the first step, where the template omits Back, opening focuses Skip instead', () => {
  const { panel, skip } = buildFirstStepPanel();
  focusFirstFocusable(panel);
  assert.equal(document.activeElement, skip);
});

test('closing restores focus to whatever opened the tour, not to whatever was focused at close time', () => {
  const trigger = document.createElement('button');
  trigger.textContent = 'Start tour';
  document.body.appendChild(trigger);
  trigger.focus();

  const { panel, next } = buildPanel();
  const state: FocusTrapState = { wasOpen: false, restoreTo: null };
  handleOpenTransition(state, true, panel, document.activeElement);

  next.focus();
  assert.equal(document.activeElement, next);

  handleOpenTransition(state, false, panel, document.activeElement);

  assert.equal(document.activeElement, trigger, 'closing must restore the pre-open element');
  assert.equal(state.restoreTo, null, 'the remembered element must be cleared once restored');
  assert.equal(state.wasOpen, false);
});

test('advancing a step re-runs the transition with open unchanged, and must not yank focus back to Back', () => {
  const { panel, next } = buildPanel();
  const state: FocusTrapState = { wasOpen: false, restoreTo: null };
  handleOpenTransition(state, true, panel, document.activeElement);

  // The user has tabbed to Next and pressed it; the host bumps `index`, which
  // re-renders the panel with `open` still true.
  next.focus();
  handleOpenTransition(state, true, panel, document.activeElement);

  assert.equal(document.activeElement, next, 'a same-state re-run must leave focus where the user put it');
});

test('Tab from Next wraps to Back instead of reaching the page behind the scrim -- the whole point of the trap', () => {
  const behind = buildPageBehind();
  const { panel, back, next } = buildPanel();
  next.focus();

  const event = keydownTab(false);
  trapTabKey(panel, event, document.activeElement);

  assert.equal(document.activeElement, back, 'Tab from the last control must wrap to the first');
  assert.notEqual(document.activeElement, behind, 'focus must never escape an aria-modal panel');
  assert.ok(event.defaultPrevented, 'the boundary Tab must be consumed, or the browser also moves focus');
});

test('Shift+Tab from Back wraps to Next rather than escaping backwards out of the panel', () => {
  const behind = buildPageBehind();
  const { panel, back, next } = buildPanel();
  back.focus();

  const event = keydownTab(true);
  trapTabKey(panel, event, document.activeElement);

  assert.equal(document.activeElement, next);
  assert.notEqual(document.activeElement, behind);
  assert.ok(event.defaultPrevented);
});

test('Tab from Skip, a middle control, is left to the browser -- the trap only acts at a boundary', () => {
  const { panel, skip } = buildPanel();
  skip.focus();

  const event = keydownTab(false);
  trapTabKey(panel, event, document.activeElement);

  assert.equal(document.activeElement, skip, 'the trap must not move focus away from a non-boundary control');
  assert.ok(!event.defaultPrevented);
});

