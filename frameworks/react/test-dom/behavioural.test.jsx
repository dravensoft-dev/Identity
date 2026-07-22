/* The requirements evaluate() returns null for: they are behaviours, not
 * attributes, and a DOM snapshot cannot decide them. Each verdict
 * dialog-modal.test.jsx declares in its `behavioural` map is settled here by
 * acting on a real tree, so that map no longer rests on the author's reading of
 * the source.
 *
 * focus.trap is deliberately absent from this file. happy-dom does not
 * implement sequential focus navigation -- pressing Tab does not move
 * document.activeElement -- so "Tab cycles inside the trap and cannot escape"
 * is unreachable by render, and a test that dispatched a Tab keydown and
 * asserted focus had not moved would pass against a component with a perfect
 * trap and against one with none. It is asserted instead as a pure function
 * over frameworks/angular/primitives/focus-trap.ts, in
 * frameworks/angular/test/confirm-dialog-focus-trap.test.ts and
 * command-palette-focus-trap.test.ts, which already cover the wrap-at-both-
 * boundaries and cannot-reach-a-control-behind-the-scrim properties. A
 * browser-driven gate would be this repo's fourth non-portable gate and is
 * refused.
 *
 * ---------------------------------------------------------------------------
 * READ THIS BEFORE "FIXING" ANY TEST IN THIS FILE.
 *
 * Every assertion below asserts that a DEFECT IS STILL PRESENT. `Dialog` does
 * not close on Escape, and this file asserts exactly that: assert.equal(closed,
 * false). That is not a test of a bug, and it is not an endorsement of one. It
 * is the stale-exception rule in its behavioural form.
 *
 * The contract layer's whole premise is that a *.behaviour.json exception is a
 * claim about the code, and a claim nothing checks rots silently. The
 * check-dimension-literals.mjs EXEMPT map has this property already: an
 * exemption that no longer matches a real violation fails the gate that owns
 * it. Attribute-shaped requirements got the same property in
 * dialog-modal.test.jsx, where a stale exception throws STALE EXCEPTION.
 * Behaviour-shaped requirements could not, because no snapshot decides them --
 * so they are pinned here instead, and this file is the only thing standing
 * between those four exceptions and silent rot.
 *
 * The value of these tests is realised on the day the defect is fixed. Someone
 * gives Dialog an Escape handler; this suite goes red; they read this comment,
 * delete the keyboard.Escape exception from Dialog.behaviour.json, and invert
 * the assertion to assert.equal(closed, true). The record stays true, and the
 * contract layer never claims a defect that has been fixed.
 *
 * So: if a test here fails, the correct response is to update the binding and
 * the assertion together. Deleting the test "because it asserts something
 * broken" removes the only mechanism that keeps the exception honest, and puts
 * the layer back in the state this plan exists to end. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from './harness.jsx';
import { Dialog } from '../components/feedback/Dialog.jsx';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog.jsx';

afterEach(cleanup);

/** Dispatch a real keydown on an element and let React flush. Dispatched on the
 *  dialog element itself and allowed to bubble, so it reaches a handler bound
 *  anywhere from the dialog up to document -- a component that listened on
 *  document rather than on its own node would still be caught. */
function press(el, key) {
  act(() => {
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

/** Click an element and let React flush. */
function click(el) {
  act(() => {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  });
}

test('Dialog does not close on Escape -- its keyboard.Escape exception is still true', () => {
  let closed = false;
  const container = mount(
    <Dialog open onClose={() => { closed = true; }} title="t"><p>b</p></Dialog>,
  );
  press(container.querySelector('[role="dialog"]'), 'Escape');
  /* The exception reads: "No keydown listener anywhere. The only dismissal path
   * is a mouse click on the backdrop." The second half is asserted too, because
   * a test proving only that Escape does nothing would also pass against a
   * component with no dismissal path at all -- and the reason claims one
   * exists. */
  assert.equal(closed, false);
  click(container.firstElementChild);
  assert.equal(closed, true, 'the backdrop click the exception names as the only dismissal path must still work');
});

test('Dialog moves focus nowhere on open -- its focus.onOpen exception is still true', () => {
  /* Focus a real element first. Without this activeElement is already body and
   * "focus did not move" would be indistinguishable from "focus moved to body",
   * so the test would pass for the wrong reason. */
  const invoker = document.createElement('button');
  document.body.appendChild(invoker);
  invoker.focus();
  assert.equal(document.activeElement, invoker, 'precondition: the invoker holds focus');

  const container = mount(
    <Dialog open onClose={() => {}} title="t"><button type="button">Inside</button></Dialog>,
  );
  assert.equal(document.activeElement, invoker, 'focus stayed on the invoker, outside the modal');
  assert.notEqual(
    container.querySelector('button'),
    document.activeElement,
    'the dialog\'s first focusable descendant did not receive focus',
  );
  invoker.remove();
});

/* focus.onClose is "restore-invoker", and it needs a component that can
 * actually close -- mounting `open` and asserting nothing would prove nothing.
 * This wrapper holds the open state so onClose really unmounts the dialog. */
function DialogHarness() {
  const [open, setOpen] = React.useState(true);
  return (
    <div>
      <button type="button" data-role="invoker">Open</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="t">
        <button type="button" data-role="inside">Inside</button>
      </Dialog>
    </div>
  );
}

test('Dialog does not restore focus to the invoker on close -- its focus.onClose exception is still true', () => {
  const container = mount(<DialogHarness />);
  const invoker = container.querySelector('[data-role="invoker"]');
  invoker.focus();
  assert.equal(document.activeElement, invoker, 'precondition: the invoker holds focus');

  /* Move focus inside the dialog by hand. The component never does this itself
   * (that is the focus.onOpen exception, asserted above), but focus.onClose is
   * about what happens when focus is *inside* and the dialog goes away -- so
   * the precondition has to be established manually to reach the requirement
   * this test is about at all. */
  const inside = container.querySelector('[data-role="inside"]');
  act(() => { inside.focus(); });
  assert.equal(document.activeElement, inside, 'precondition: focus is inside the dialog');

  click(container.querySelector('[role="dialog"]').parentElement);
  assert.equal(container.querySelector('[role="dialog"]'), null, 'precondition: the dialog really closed');

  /* Nothing stored the invoker and nothing restores it. The focused element was
   * removed from the document, so focus falls to body -- the browser default,
   * which is precisely the absence of a restore. */
  assert.notEqual(document.activeElement, invoker, 'focus was NOT restored to the invoker');
  assert.equal(document.activeElement, document.body, 'focus fell to body, the no-restore default');
});

test('ConfirmDialog does not close on Escape either -- its exception is still true', () => {
  let cancelled = false;
  const container = mount(
    <ConfirmDialog open onCancel={() => { cancelled = true; }} onConfirm={() => {}} title="t" confirmLabel="Delete" />,
  );
  press(container.querySelector('[role="alertdialog"], [role="dialog"]'), 'Escape');
  assert.equal(cancelled, false);
  /* The exception's second sentence is the sharper claim: unlike Dialog there is
   * no click-outside path either, so a keyboard user has no dismissal at all
   * short of tabbing to Cancel. Asserted, because that is the part a future
   * reader is most likely to assume was fixed alongside Escape. */
  click(container.firstElementChild);
  assert.equal(cancelled, false, 'the scrim click is deliberately inert -- ConfirmDialog does not close on click-outside');
});

test('ConfirmDialog moves focus nowhere on open without requireText -- the common case its exception names', () => {
  const invoker = document.createElement('button');
  document.body.appendChild(invoker);
  invoker.focus();

  mount(<ConfirmDialog open onCancel={() => {}} onConfirm={() => {}} title="t" confirmLabel="Delete" />);
  assert.equal(document.activeElement, invoker, 'without requireText nothing moves focus at all');
  invoker.remove();
});

test('ConfirmDialog DOES focus the confirmation input when requireText is set -- the branch its exception carves out', () => {
  /* ConfirmDialog's focus.onOpen exception is the one in this pair that is
   * conditional: "Only met when `requireText` is set". The exception is not
   * stale, because the requirement is unmet in the common case -- but the
   * carve-out is a claim about the source too (the input carries autoFocus and
   * is the first focusable element in DOM order), and it deserves to be pinned
   * rather than read. If autoFocus is ever dropped, the exception's reason
   * becomes false in a way no other test would notice. */
  const invoker = document.createElement('button');
  document.body.appendChild(invoker);
  invoker.focus();

  const container = mount(
    <ConfirmDialog open onCancel={() => {}} onConfirm={() => {}} title="t" confirmLabel="Delete" requireText="DELETE" />,
  );
  const input = container.querySelector('input');
  assert.notEqual(input, null, 'precondition: requireText renders the confirmation input');
  assert.equal(document.activeElement, input, 'the autoFocus input took focus on open');
  invoker.remove();
});
