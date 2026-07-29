/* The requirements evaluate() returns null for: they are behaviours, not
 * attributes, and a DOM snapshot cannot decide them. Each verdict
 * dialog-modal.test.jsx declares in its `behavioural` map is settled here by
 * acting on a real tree, so that map no longer rests on the author's reading of
 * the source.
 *
 * focus.trap used to be absent from this file, with a note saying nothing else
 * proved it either. HALF OF THAT IS NOW WRONG, and the half matters:
 *
 *   THE BOUNDARY IS OURS AND IS PROVED HERE. Shift+Tab on the first focusable
 *     landing on the last, and Tab on the last landing on the first, are
 *     `.focus()` calls made by our own handler in
 *     frameworks/react/UseDialogModal.js. happy-dom honours .focus(), so both
 *     are real assertions about real behaviour, and both are below.
 *
 *   THE INTERIOR IS THE BROWSER'S AND IS STILL NOT PROVABLE. That Tab from a
 *     MIDDLE element reaches the next one is native sequential focus
 *     navigation. We do not implement it -- the trap leaves a middle element
 *     alone on purpose -- and happy-dom does not implement it either, so a test
 *     asserting where focus landed there would pass identically against a
 *     perfect trap and against none. That half is checked in Chromium by hand
 *     and recorded as a written checklist. A BROWSER-DRIVEN GATE IS STILL
 *     REFUSED: it would be this repo's fourth non-portable gate.
 *
 * DO NOT CITE the Angular layer's ConfirmDialog.focusTrap.test.ts or
 * CommandPalette.focusTrap.test.ts as evidence for the React verdict. An
 * earlier version of this comment did. Those suites test the ANGULAR layer --
 * they import frameworks/angular/FocusTrap.ts, which React does not use. React's trap
 * is proved by React's own assertions or it is not proved. Do not re-add the
 * citation.
 *
 * ---------------------------------------------------------------------------
 * READ THIS BEFORE "FIXING" ANY TEST IN THIS FILE.
 *
 * An assertion below may assert that a DEFECT IS STILL PRESENT. That is not a
 * test of a bug, and it is not an endorsement of one. It is the stale-exception
 * rule in its behavioural form.
 *
 * NO ASSERTION IN THIS FILE HAS THAT SHAPE ANY MORE, and the way it stopped is
 * the whole mechanism: plan 8C4 fixed Dialog's four defects and inverted its four
 * assertions in one change, then did the identical thing to ConfirmDialog in the
 * next, and every inverted test carries a comment naming what it used to pin.
 * Each exception expired because an assertion that used to say the opposite went
 * red first. THIS IS NOT A LICENCE TO STOP WRITING THEM: the next component that
 * arrives with a live defect gets an assertion pinning it, in this shape, for
 * exactly the same reason.
 *
 * One ConfirmDialog assertion still asserts an ABSENCE and is NOT of that kind:
 * the scrim click stays inert. That is a deliberate product decision -- a
 * destructive confirmation must not be dismissable by a stray click -- not an
 * unmet requirement, and no exception rests on it.
 *
 * The contract layer's whole premise is that a *.behaviour.json exception is a
 * claim about the code, and a claim nothing checks rots silently. The
 * check-dimension-literals.mjs EXEMPT map has this property already: an
 * exemption that no longer matches a real violation fails the gate that owns
 * it. Attribute-shaped requirements got the same property in
 * dialog-modal.test.jsx, where a stale exception throws STALE EXCEPTION.
 * Behaviour-shaped requirements could not, because no snapshot decides them --
 * so they are pinned here instead, and this file is the only thing standing
 * between a behavioural exception and silent rot.
 *
 * The value of these tests is realised on the day the defect is fixed, and that
 * day has now happened twice. Someone gave Dialog an Escape handler; this suite
 * went red; they read this comment, deleted the keyboard.Escape exception from
 * Dialog.behaviour.json, and inverted the assertion to
 * assert.equal(closed, true). ConfirmDialog followed one task later, through the
 * same shared hook and the same five retirements. The record stays true, and the
 * contract layer never claims a defect that has been fixed.
 *
 * So: if a test here fails, the correct response is to update the binding and
 * the assertion together. Deleting the test "because it asserts something
 * broken" removes the only mechanism that keeps the exception honest, and puts
 * the layer back in the state this plan exists to end. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from '../../test/Harness.jsx';
import { Dialog } from './dialog/Dialog.jsx';
import { ConfirmDialog } from './confirm-dialog/ConfirmDialog.jsx';

afterEach(cleanup);

/** Dispatch a real keydown on an element and let React flush. Dispatched on the
 *  dialog element itself and allowed to bubble, so it reaches a handler bound
 *  anywhere from the dialog up to document -- a component that listened on
 *  document rather than on its own node would still be caught.
 *
 *  `init` carries the modifier flags: the trap distinguishes Tab from Shift+Tab
 *  and reads `shiftKey` off the event, which a bare `{ key, bubbles }` would
 *  leave `false` and make the wrap test pass in the wrong direction. It defaults
 *  to `{}` so every call site written before it keeps its exact behaviour. */
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

test('Dialog closes on Escape -- keyboard.Escape is met', () => {
  /* This test asserted the opposite until plan 8C4: `assert.equal(closed, false)`,
   * pinning a real defect so it could not be fixed silently without the binding
   * following. The exception is retired in that same change, which is the whole
   * mechanism -- see this file's header. */
  let closed = false;
  const container = mount(
    <Dialog open onClose={() => { closed = true; }} title="t"><p>b</p></Dialog>,
  );
  press(container.querySelector('[role="dialog"]'), 'Escape');
  assert.equal(closed, true, 'Escape did not reach the dialog\'s own dismissal channel');
});

test('Dialog closes on a backdrop click too -- the mouse path Escape joins rather than replaces', () => {
  /* Split out of the Escape test when that one inverted. The backdrop click used
   * to be asserted there as the second half of the exception's reason ("the only
   * dismissal path is a mouse click on the backdrop"). That sentence is gone, but
   * the behaviour it described is not, and nothing else covers it. */
  let closed = false;
  const container = mount(
    <Dialog open onClose={() => { closed = true; }} title="t"><p>b</p></Dialog>,
  );
  click(container.firstElementChild);
  assert.equal(closed, true, 'the backdrop click must still dismiss');
});

test('Dialog moves focus to the first focusable inside the panel on open -- focus.onOpen is met', () => {
  /* This test asserted the opposite until plan 8C4: that activeElement was still
   * the invoker and the dialog's first focusable had NOT received focus, pinning
   * the focus.onOpen exception so it could not rot. The exception is retired in
   * that same change.
   *
   * Focus a real element first. Without this activeElement is already body and
   * "focus moved into the panel" would be indistinguishable from "focus was never
   * anywhere else", so the test would pass for a weaker reason than it claims. */
  const invoker = document.createElement('button');
  document.body.appendChild(invoker);
  invoker.focus();
  assert.equal(document.activeElement, invoker, 'precondition: the invoker holds focus');

  const container = mount(
    <Dialog open onClose={() => {}} title="t"><button type="button">Inside</button></Dialog>,
  );
  assert.notEqual(document.activeElement, invoker, 'focus stayed on the invoker, outside the modal');
  assert.equal(
    document.activeElement,
    container.querySelector('button'),
    'the dialog\'s first focusable descendant did not receive focus',
  );
  invoker.remove();
});

/* focus.onClose is "restore-invoker", and it needs a component that can
 * actually close -- mounting `open` and asserting nothing would prove nothing.
 * This wrapper holds the open state so onClose really unmounts the dialog.
 *
 * IT STARTS CLOSED, AND THAT IS THE WHOLE POINT. An earlier version of this
 * harness mounted with open=true and focused the invoker afterwards, which made
 * the test vacuous against the obvious implementation: every real
 * restore-the-invoker captures document.activeElement at the instant `open`
 * becomes true, and in that harness the instant `open` became true was the
 * initial render -- before anything had been focused. So it captured body,
 * restored body, and both assertions below still passed. Proved by mutation:
 * Dialog patched to capture-on-open/restore-on-close left this suite green.
 *
 * Starting closed and opening BY CLICKING THE ALREADY-FOCUSED INVOKER is what
 * makes the invoker genuinely the previously-focused element at capture time,
 * so an implementation has something real to restore and this test goes red the
 * day one appears. */
function DialogHarness() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button type="button" data-role="invoker" onClick={() => setOpen(true)}>Open</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="t">
        <button type="button" data-role="inside">Inside</button>
      </Dialog>
    </div>
  );
}

test('Dialog restores focus to the invoker on close -- focus.onClose is met', () => {
  /* This test asserted the opposite until plan 8C4: that focus fell to body and
   * was NOT restored to the invoker, pinning the focus.onClose exception so it
   * could not rot. The exception is retired in that same change.
   *
   * The harness starting CLOSED is what makes the assertion mean anything, and
   * that was already true before the inversion -- see the comment above it. */
  const container = mount(<DialogHarness />);
  const invoker = container.querySelector('[data-role="invoker"]');
  invoker.focus();
  assert.equal(document.activeElement, invoker, 'precondition: the invoker holds focus');
  assert.equal(container.querySelector('[role="dialog"]'), null, 'precondition: the dialog starts closed');

  /* Open by clicking the focused invoker, not by mounting open. This is the
   * only ordering under which the invoker is what a capture-on-open
   * implementation records; see the harness comment above. */
  click(invoker);
  assert.notEqual(container.querySelector('[role="dialog"]'), null, 'precondition: the click opened the dialog');

  /* Focus is moved inside by the component itself now. It used to be moved here
   * by hand, because focus.onClose is about what happens when focus is *inside*
   * and the dialog goes away, and focus.onOpen was excepted so the precondition
   * had to be faked. It no longer does, and asserting it here is what proves the
   * two requirements compose rather than each being true in isolation. */
  const inside = container.querySelector('[data-role="inside"]');
  assert.equal(document.activeElement, inside, 'precondition: opening put focus inside the dialog');

  click(container.querySelector('[role="dialog"]').parentElement);
  assert.equal(container.querySelector('[role="dialog"]'), null, 'precondition: the dialog really closed');

  assert.equal(document.activeElement, invoker, 'focus was not restored to the invoker that opened the dialog');
});

/* The fourth Dialog requirement, and the only one with no assertion here before
 * plan 8C4 -- focus.trap rested on a reading of the source, which this file's
 * header and dialog-modal.test.jsx's both admitted at length.
 *
 * Only HALF of it is provable here, and the half is exact: a boundary wrap is
 * OUR OWN .focus() call, which happy-dom honours, so Shift+Tab landing on the
 * last focusable is a real assertion about real behaviour. The interior -- that
 * Tab from a middle element reaches the next one -- is native sequential focus
 * navigation, which happy-dom does not implement and we do not implement either.
 * That half is checked in Chromium by hand. */
test('Dialog wraps Shift+Tab from the first focusable to the last -- focus.trap is met at the boundary', () => {
  const container = mount(
    <Dialog open onClose={() => {}} title="Delete project"
      footer={<><button type="button">Cancel</button><button type="button">Delete</button></>}
    ><p>Body</p></Dialog>,
  );
  const panel = container.querySelector('[role="dialog"]');
  const buttons = panel.querySelectorAll('button');
  assert.equal(buttons.length, 2, 'precondition: the panel has exactly the two footer buttons');
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  first.focus();
  assert.equal(document.activeElement, first, 'precondition: the first focusable holds focus');
  press(first, 'Tab', { shiftKey: true });
  assert.equal(document.activeElement, last, 'Shift+Tab at the first boundary did not wrap to the last');
});

test('Dialog wraps Tab from the last focusable to the first -- the other boundary', () => {
  const container = mount(
    <Dialog open onClose={() => {}} title="Delete project"
      footer={<><button type="button">Cancel</button><button type="button">Delete</button></>}
    ><p>Body</p></Dialog>,
  );
  const panel = container.querySelector('[role="dialog"]');
  const buttons = panel.querySelectorAll('button');
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  last.focus();
  assert.equal(document.activeElement, last, 'precondition: the last focusable holds focus');
  press(last, 'Tab');
  assert.equal(document.activeElement, first, 'Tab at the last boundary did not wrap to the first');
});

test('ConfirmDialog closes on Escape -- keyboard.Escape is met', () => {
  /* This test asserted the opposite until plan 8C4, Task 4: `assert.equal(cancelled,
   * false)`, pinning a real defect so it could not be fixed silently without the
   * binding following. The exception is retired in that same change -- see this
   * file's header. Escape reaches `onCancel`, the component's OWN dismissal
   * channel, so no new member appears. */
  let cancelled = false;
  const container = mount(
    <ConfirmDialog open onCancel={() => { cancelled = true; }} onConfirm={() => {}} title="t" confirmLabel="Delete" />,
  );
  press(container.querySelector('[role="alertdialog"], [role="dialog"]'), 'Escape');
  assert.equal(cancelled, true, 'Escape did not reach the dialog\'s own dismissal channel');
});

test('ConfirmDialog still does NOT close on a scrim click -- the inertness is deliberate and stays', () => {
  /* Split out of the Escape test when that one inverted, and it must keep its own
   * mount: the Escape assertion now fires onCancel, so a shared `cancelled` flag
   * would already be true here and the inertness would be unfalsifiable.
   *
   * This is the one ConfirmDialog assertion in this file that still asserts an
   * ABSENCE, and it is not a defect: a destructive confirmation must not be
   * dismissable by a stray click. Escape joins the Cancel button as a dismissal
   * path; the scrim does not, and never should. */
  let cancelled = false;
  const container = mount(
    <ConfirmDialog open onCancel={() => { cancelled = true; }} onConfirm={() => {}} title="t" confirmLabel="Delete" />,
  );
  click(container.firstElementChild);
  assert.equal(cancelled, false, 'the scrim click is deliberately inert -- ConfirmDialog does not close on click-outside');
});

test('ConfirmDialog moves focus to the first focusable inside the panel on open -- focus.onOpen is met', () => {
  /* This test asserted the opposite until plan 8C4, Task 4: that focus stayed on
   * the invoker, because "without requireText -- the common case -- nothing moves
   * focus at all" was the exception's own reason. The exception is retired in that
   * same change, and the conditional carve-out goes with it: focus now moves in on
   * every open, requireText or not.
   *
   * Focus a real element first, so "focus moved into the panel" is distinguishable
   * from "focus was never anywhere else". */
  const invoker = document.createElement('button');
  document.body.appendChild(invoker);
  invoker.focus();
  assert.equal(document.activeElement, invoker, 'precondition: the invoker holds focus');

  const container = mount(<ConfirmDialog open onCancel={() => {}} onConfirm={() => {}} title="t" confirmLabel="Delete" />);
  assert.notEqual(document.activeElement, invoker, 'focus stayed on the invoker, outside the modal');
  assert.equal(
    document.activeElement,
    container.querySelector('button'),
    'the dialog\'s first focusable descendant did not receive focus',
  );
  invoker.remove();
});

test('ConfirmDialog DOES focus the confirmation input when requireText is set -- the branch its exception used to carve out', () => {
  /* THE ONLY ConfirmDialog TEST IN THIS FILE PLAN 8C4 DID NOT INVERT: it already
   * asserted a working behaviour, and the point of keeping it is that the fix
   * must not break it. It used to pin the conditional half of the focus.onOpen
   * exception -- "Only met when `requireText` is set" -- and that condition is
   * gone: focus now moves in on every open. What survives is the branch, because
   * WHICH element gets focus differs. requireText puts the confirmation <input>
   * ahead of both buttons in DOM order, so focusFirstFocusable lands there rather
   * than on Cancel.
   *
   * THE `autoFocus` ATTRIBUTE IS GONE, and this test is what proves the hook
   * replaced it rather than joining it: it passed before the hook because of
   * autoFocus, and it passes now because of focusFirstFocusable. Two mechanisms
   * aiming at one element is one too many -- the HTML autofocus processing model
   * skips the attribute once the document's autofocus-processed flag is set. */
  const invoker = document.createElement('button');
  document.body.appendChild(invoker);
  invoker.focus();

  const container = mount(
    <ConfirmDialog open onCancel={() => {}} onConfirm={() => {}} title="t" confirmLabel="Delete" requireText="DELETE" />,
  );
  const input = container.querySelector('input');
  assert.notEqual(input, null, 'precondition: requireText renders the confirmation input');
  assert.equal(document.activeElement, input, 'the confirmation input did not take focus on open');
  invoker.remove();
});

/* ConfirmDialog's focus.trap, the requirement the plan retires without asking for
 * an assertion. Flipping a `behavioural` verdict with nothing under it pins a
 * claim the suite does not check, which is the exact rot this layer exists to
 * end -- so the two boundary wraps are asserted here, the same pair Dialog got.
 *
 * Only HALF of focus.trap is provable and the half is exact: a boundary wrap is
 * OUR OWN .focus() call, which happy-dom honours. The interior -- Tab from a
 * MIDDLE element reaching the next one -- is native sequential focus navigation,
 * which neither we nor happy-dom implement, and it is checked in Chromium by
 * hand. See this file's header. */
test('ConfirmDialog wraps Shift+Tab from the first focusable to the last -- focus.trap is met at the boundary', () => {
  const container = mount(
    <ConfirmDialog open onCancel={() => {}} onConfirm={() => {}} title="Delete project" confirmLabel="Delete" />,
  );
  const panel = container.querySelector('[role="alertdialog"]');
  const buttons = panel.querySelectorAll('button');
  assert.equal(buttons.length, 2, 'precondition: the panel has exactly the Cancel and Delete buttons');
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  first.focus();
  assert.equal(document.activeElement, first, 'precondition: the first focusable holds focus');
  press(first, 'Tab', { shiftKey: true });
  assert.equal(document.activeElement, last, 'Shift+Tab at the first boundary did not wrap to the last');
});

test('ConfirmDialog wraps Tab from the last focusable to the first -- the other boundary', () => {
  /* requireText is set here on purpose, and it is not decoration: it puts the
   * confirmation <input> ahead of both buttons in DOM order, so "the first
   * focusable" is a different element from the one the Shift+Tab test above wraps
   * to. focusableElements() is recomputed on every keypress precisely because
   * this panel's focusable set changes -- the confirm button carries `disabled`
   * until the word matches, and a disabled button is not focusable. So the last
   * focusable here is Cancel, not Delete. */
  const container = mount(
    <ConfirmDialog open onCancel={() => {}} onConfirm={() => {}} title="Delete project"
      confirmLabel="Delete" requireText="DELETE" />,
  );
  const panel = container.querySelector('[role="alertdialog"]');
  const first = panel.querySelector('input');
  assert.notEqual(first, null, 'precondition: requireText renders the confirmation input');
  const cancel = [...panel.querySelectorAll('button')].find((b) => b.textContent === 'Cancel');
  const confirm = [...panel.querySelectorAll('button')].find((b) => b.textContent === 'Delete');
  assert.equal(confirm.disabled, true, 'precondition: the confirm button is locked, so it is not focusable');
  act(() => { cancel.focus(); });
  assert.equal(document.activeElement, cancel, 'precondition: the last focusable holds focus');
  press(cancel, 'Tab');
  assert.equal(document.activeElement, first, 'Tab at the last boundary did not wrap to the first');
});

/* ConfirmDialog's focus.onClose had NO behavioural coverage before this suite:
 * the shared BEHAVIOURAL map in dialog-modal.test.jsx declared focus.onClose
 * false for both components, but only Dialog's verdict was established by acting
 * on a tree, so ConfirmDialog's rested on a reading of the source -- the exact
 * state this suite exists to end.
 *
 * Same shape as DialogHarness and for the same reason: it starts CLOSED and is
 * opened by clicking the already-focused invoker, so the invoker really is what
 * a capture-on-open implementation would record. Closing goes through Cancel
 * rather than a scrim click, because ConfirmDialog deliberately has no
 * click-outside path (asserted above) -- Cancel is the only dismissal it has. */
function ConfirmDialogHarness() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button type="button" data-role="invoker" onClick={() => setOpen(true)}>Open</button>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => {}}
        title="t"
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}

test('ConfirmDialog restores focus to the invoker on close -- focus.onClose is met', () => {
  /* This test asserted the opposite until plan 8C4, Task 4: that focus fell to
   * body and was NOT restored, pinning the focus.onClose exception so it could not
   * rot. The exception is retired in that same change.
   *
   * The harness starting CLOSED is what makes the assertion mean anything, and
   * that was already true before the inversion -- see the comment above it. */
  const container = mount(<ConfirmDialogHarness />);
  const invoker = container.querySelector('[data-role="invoker"]');
  invoker.focus();
  assert.equal(document.activeElement, invoker, 'precondition: the invoker holds focus');

  click(invoker);
  const dialog = container.querySelector('[role="alertdialog"]');
  assert.notEqual(dialog, null, 'precondition: the click opened the dialog');

  /* Focus is moved inside by the component itself now. It used to be moved here
   * by hand, because focus.onClose is about what happens when focus is *inside*
   * and the dialog goes away, and focus.onOpen was excepted so the precondition
   * had to be faked. Asserting it here is what proves the two requirements
   * compose rather than each being true in isolation. Cancel is the first
   * focusable in DOM order, and it is also the control this test then clicks --
   * ConfirmDialog has no click-outside path, so Cancel is the only dismissal a
   * mouse or a keyboard reaches without Escape. */
  const cancel = [...dialog.querySelectorAll('button')].find((b) => b.textContent === 'Cancel');
  assert.notEqual(cancel, undefined, 'precondition: the Cancel button is present');
  assert.equal(document.activeElement, cancel, 'precondition: opening put focus inside the dialog');

  click(cancel);
  assert.equal(container.querySelector('[role="alertdialog"]'), null, 'precondition: Cancel really closed the dialog');

  assert.equal(document.activeElement, invoker, 'focus was not restored to the invoker that opened the dialog');
});
