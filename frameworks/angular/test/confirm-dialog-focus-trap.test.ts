/* ConfirmDialog's accessibility fix wave (plan 5a, Task 8 review) added a
 * real focus trap: focus moves into the panel on open, Tab/Shift+Tab cycle
 * within it, and focus is restored to whatever held it beforehand on close.
 * Plan 5a's Task 14 review generalized that trap's mechanics out of
 * `confirm-dialog.ts` into `frameworks/angular/primitives/focus-trap.ts`, so
 * `arena-command-palette` could reuse it instead of writing a second
 * implementation -- `confirm-dialog.ts` still re-exports the same names for
 * any caller that reached them there, which is why importing from either
 * module works, but this file was pointed at the canonical module.
 *
 * This does NOT render `<arena-confirm-dialog>` through TestBed. Probed by
 * hand before writing this file: `[open]="true"` on the component and
 * `fixture.componentRef.setInput('open', true)` both throw NG0303 ("Can't
 * bind to 'open' since it isn't a known property") under this repo's test
 * toolchain -- confirmed with a throwaway host component and deleted after.
 * host-class-binding.test.ts's own header comment documents the same root
 * cause for Skeleton's `variant="text"`: this harness runs `bun`'s TypeScript
 * stripping plus `@angular/compiler`'s runtime JIT, never `ngtsc`, and only
 * `ngtsc` discovers a class's `input()` fields into `ɵcmp.inputs` -- without
 * that transform, neither a template binding nor `setInput()` can drive a
 * signal input at all. Since `open` can never become `true` here, the `@if
 * (open())` block can never render the panel, so no TestBed-based test of
 * this component can exercise an actually-open dialog.
 *
 * `confirm-dialog.ts` was written to route around exactly this: the trap's
 * mechanics (`focusableElements`, `focusFirstFocusable`, `trapTabKey`,
 * `handleOpenTransition`) are exported as plain functions of a real
 * `HTMLElement`, with no Angular dependency, so they are testable against a
 * hand-built DOM tree -- real elements, real `.focus()`, real
 * `document.activeElement` -- independent of whether Angular's own input
 * binding works in this harness. This is what the component's constructor
 * actually calls, not a reimplementation that could drift from it.
 *
 * No TestBed here, so nothing to initialise -- only a DOM, taken from the
 * directory's shared one (`ensureDom()`, testbed-env.ts) rather than
 * registered and unregistered per file. See that file for why the document
 * has to be shared. */
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
import { isConfirmLocked } from '../primitives/confirm-dialog/confirm-dialog';

/** Builds a panel with the same focusable shape ConfirmDialog's template
 *  renders when `requireText` is set: an input, then two buttons (cancel,
 *  confirm) -- plus one disabled button to prove the trap skips it, and one
 *  plain non-interactive div to prove it is not treated as a stop. */
function buildPanel(): { panel: HTMLElement; input: HTMLElement; cancel: HTMLElement; confirm: HTMLElement } {
  const panel = document.createElement('div');
  panel.setAttribute('tabindex', '-1');
  const decoy = document.createElement('div');
  decoy.textContent = 'not focusable';
  const disabledButton = document.createElement('button');
  disabledButton.textContent = 'disabled, must be skipped';
  disabledButton.disabled = true;
  const input = document.createElement('input');
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  const confirm = document.createElement('button');
  confirm.textContent = 'Confirm';
  panel.append(decoy, disabledButton, input, cancel, confirm);
  document.body.appendChild(panel);
  return { panel, input, cancel, confirm };
}

function keydownTab(shiftKey: boolean): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true, bubbles: true });
}

beforeEach(() => {
  document.body.innerHTML = '';
});

test('focusableElements finds only real, enabled, tabbable elements, in DOM order, skipping a disabled button and a plain div', () => {
  const { panel, input, cancel, confirm } = buildPanel();
  assert.deepEqual(focusableElements(panel), [input, cancel, confirm]);
});

test('focusFirstFocusable moves DOM focus to the panel\'s first focusable descendant', () => {
  const { panel, input } = buildPanel();
  assert.notEqual(document.activeElement, input, 'sanity: nothing is focused yet');
  focusFirstFocusable(panel);
  assert.equal(document.activeElement, input);
});

test('focusFirstFocusable falls back to the panel itself when it has no focusable descendant', () => {
  const panel = document.createElement('div');
  panel.setAttribute('tabindex', '-1');
  document.body.appendChild(panel);
  focusFirstFocusable(panel);
  assert.equal(document.activeElement, panel);
});

test('Tab from the last focusable wraps to the first, and the key is consumed', () => {
  const { panel, input, confirm } = buildPanel();
  confirm.focus();
  assert.equal(document.activeElement, confirm);
  const event = keydownTab(false);
  trapTabKey(panel, event, document.activeElement);
  assert.equal(document.activeElement, input, 'Tab from the last element must wrap to the first');
  assert.ok(event.defaultPrevented, 'the boundary Tab must be prevented, or the browser would also move focus');
});

test('Shift+Tab from the first focusable wraps to the last, and the key is consumed', () => {
  const { panel, input, confirm } = buildPanel();
  input.focus();
  assert.equal(document.activeElement, input);
  const event = keydownTab(true);
  trapTabKey(panel, event, document.activeElement);
  assert.equal(document.activeElement, confirm, 'Shift+Tab from the first element must wrap to the last');
  assert.ok(event.defaultPrevented);
});

test('Tab away from a middle element is left alone -- the trap only intervenes at a boundary', () => {
  const { panel, cancel } = buildPanel();
  cancel.focus();
  const event = keydownTab(false);
  trapTabKey(panel, event, document.activeElement);
  assert.equal(document.activeElement, cancel, 'the trap must not move focus away from a non-boundary element');
  assert.ok(!event.defaultPrevented, 'a non-boundary Tab must be left to the browser\'s own default handling');
});

test('a panel with no focusable descendant traps the key outright, since there is nowhere legal for focus to go', () => {
  const panel = document.createElement('div');
  document.body.appendChild(panel);
  const event = keydownTab(false);
  trapTabKey(panel, event, document.activeElement);
  assert.ok(event.defaultPrevented);
});

test('handleOpenTransition: opening captures the previously-focused element and moves focus into the panel', () => {
  const trigger = document.createElement('button');
  trigger.textContent = 'Delete project';
  document.body.appendChild(trigger);
  trigger.focus();
  assert.equal(document.activeElement, trigger);

  const { panel, input } = buildPanel();
  const state: FocusTrapState = { wasOpen: false, restoreTo: null };
  handleOpenTransition(state, true, panel, document.activeElement);

  assert.equal(document.activeElement, input, 'opening must move focus into the panel\'s first focusable element');
  assert.equal(state.restoreTo, trigger, 'the element that had focus before opening must be remembered');
  assert.equal(state.wasOpen, true);
});

test('handleOpenTransition: closing restores focus to the element remembered at open time', () => {
  const trigger = document.createElement('button');
  document.body.appendChild(trigger);
  trigger.focus();

  const { panel, confirm } = buildPanel();
  const state: FocusTrapState = { wasOpen: false, restoreTo: null };
  handleOpenTransition(state, true, panel, document.activeElement);

  // Simulate the user tabbing to a different control while the dialog is open.
  confirm.focus();
  assert.equal(document.activeElement, confirm);

  handleOpenTransition(state, false, panel, document.activeElement);

  assert.equal(document.activeElement, trigger, 'closing must restore focus to the pre-open element, not to whatever was focused at close time');
  assert.equal(state.restoreTo, null, 'the remembered element must be cleared once restored, so a later close does not refocus it again');
  assert.equal(state.wasOpen, false);
});

test('handleOpenTransition: a re-run with isOpen unchanged does not re-steal focus -- it must not fight the user typing into the require-text field', () => {
  const trigger = document.createElement('button');
  document.body.appendChild(trigger);
  trigger.focus();

  const { panel, input, confirm } = buildPanel();
  const state: FocusTrapState = { wasOpen: false, restoreTo: null };
  handleOpenTransition(state, true, panel, document.activeElement);
  assert.equal(document.activeElement, input);

  // The user tabs on to Confirm; a later render (e.g. caused by typing)
  // re-runs the effect with the same isOpen=true it already saw.
  confirm.focus();
  handleOpenTransition(state, true, panel, document.activeElement);

  assert.equal(document.activeElement, confirm, 'a same-state re-run must leave focus exactly where the user put it');
});

test('isConfirmLocked: unset requireText never locks', () => {
  assert.equal(isConfirmLocked(undefined, ''), false);
  assert.equal(isConfirmLocked(undefined, 'anything'), false);
});

test('isConfirmLocked: an empty-string requireText never locks either -- the divergence from a bare-truthiness check', () => {
  assert.equal(isConfirmLocked('', ''), false);
  assert.equal(isConfirmLocked('', 'anything typed'), false);
});

test('isConfirmLocked: locks until the trimmed typed value matches exactly', () => {
  assert.equal(isConfirmLocked('Ardennes', ''), true);
  assert.equal(isConfirmLocked('Ardennes', 'wrong'), true);
  assert.equal(isConfirmLocked('Ardennes', 'Ardennes'), false);
  assert.equal(isConfirmLocked('Ardennes', '  Ardennes  '), false, 'surrounding whitespace in what was typed must be trimmed');
});

