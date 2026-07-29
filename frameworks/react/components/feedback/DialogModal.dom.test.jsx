/* dialog-modal, asserted in both directions.
 *
 * For each of the pattern's seven requirements this suite states one thing: the
 * requirement is met in the rendered DOM and the binding declares no exception,
 * or it is not met and the binding declares one. That single statement is the
 * stale-exception rule — the property check-dimension-literals.mjs's EXEMPT has
 * and the contract layer did not. It has now been paid out twice: plan 8C4 gave
 * Dialog an aria-labelledby, a focus trap, focus restore and Escape, and this
 * suite went red on all five exceptions until Dialog.behaviour.json followed;
 * one task later ConfirmDialog got the same four through the same hook, and this
 * suite went red on roles.label until its binding followed too. An exception
 * really can expire, and this is the file where it does.
 *
 * The four requirements no DOM snapshot can decide (focus.onOpen, focus.onClose,
 * focus.trap, keyboard.Escape) are declared `behavioural` here, and the verdict
 * declared is the one a behavioural test establishes by acting on the tree.
 * assertPattern refuses to skip one that is not declared. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { mount, cleanup } from '../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../test/AssertPattern.jsx';
import { Dialog } from './dialog/Dialog.jsx';
import { ConfirmDialog } from './confirm-dialog/ConfirmDialog.jsx';

afterEach(cleanup);

/* THE MAP USED TO BE ONE, SHARED BY BOTH COMPONENTS. It is now two, one per
 * component, because plan 8C4 made Dialog meet all four of these while
 * ConfirmDialog still met none. A single map that had to be true of both is what
 * would have forced those into one commit; splitting it is what let each
 * component's verdicts move on the day its own defects were fixed, one task
 * apart.
 *
 * `true` means "this requirement IS met", `false` means it is not, and every
 * verdict in both maps is established by acting on a real tree in
 * behavioural.test.jsx, which sits beside this file.
 *
 * -------------------------------------------------------------------------
 * WHAT A SUITE CAN AND CANNOT PROVE ABOUT focus.trap. An earlier version of
 * this comment said focus.trap could not be promoted to a proof here at all.
 * THAT IS HALF WRONG, and the correction matters more than any code in this
 * file. The requirement has two halves and only one of them is ours:
 *
 *   THE BOUNDARY IS OURS AND IS PROVABLE. Shift+Tab on the first focusable
 *     landing on the last, and Tab on the last landing on the first, are
 *     `last.focus()` and `first.focus()` calls made by our own keydown handler
 *     in frameworks/react/use-dialog-modal.js. happy-dom honours .focus(), so
 *     these are real assertions about real behaviour, and behavioural.test.jsx
 *     makes both of them — "Dialog wraps Shift+Tab from the first focusable to
 *     the last" and its Tab twin — and then makes both again for ConfirmDialog.
 *     That is why both verdicts below are true, and neither was flipped without
 *     its own pair.
 *
 *   THE INTERIOR IS THE BROWSER'S AND IS NOT PROVABLE. That Tab from a MIDDLE
 *     element reaches the next one is native sequential focus navigation. We do
 *     not implement it — the trap deliberately leaves a middle element alone —
 *     and happy-dom does not implement it either, so pressing Tab there does not
 *     move document.activeElement and a test asserting anything about where it
 *     landed would pass identically against a perfect trap and against none.
 *
 * So `focus.trap: true` below rests on a proof for the half we wrote and on a
 * Chromium check by hand for the half we did not. A BROWSER-DRIVEN GATE IS
 * STILL REFUSED: it would be this repo's fourth non-portable gate, and the
 * hand check is a written checklist in the component's prompt, exactly the way
 * the grid rule works.
 *
 * DO NOT CITE THE ANGULAR FOCUS-TRAP SUITES AS EVIDENCE FOR EITHER VERDICT. An
 * earlier version of this comment did. They test a DIFFERENT LAYER — they import
 * frameworks/angular/FocusTrap.ts and that layer's own ConfirmDialog.ts,
 * Angular's own implementation, which React does not share. React's trap is
 * proven by React's own suite or it is not proven.
 *
 * Change a verdict here and the matching assertion in behavioural.test.jsx must
 * change with it — that file's header explains why the still-false ones pin a
 * defect on purpose. */
const DIALOG_BEHAVIOURAL = {
  'focus.onOpen': true, 'focus.onClose': true, 'focus.trap': true, 'keyboard.Escape': true,
};

/* ConfirmDialog's four are now true as well, and each verdict is established the
 * same way Dialog's is: by acting on a real tree in behavioural.test.jsx. Plan
 * 8C4's Task 4 moved them, one task after Dialog, through the same shared hook --
 * which is exactly what splitting this map made possible.
 *
 * focus.trap included, and it did not get a free ride: the two boundary wraps are
 * asserted for ConfirmDialog specifically ("wraps Shift+Tab from the first
 * focusable to the last" and its Tab twin), because flipping a verdict with
 * nothing under it pins a claim no suite checks.
 *
 * The two maps stay separate even though their values are identical again today.
 * They were split precisely because a shared one forces two components into one
 * commit, and re-merging them would re-impose that the day either regresses. */
const CONFIRM_DIALOG_BEHAVIOURAL = {
  'focus.onOpen': true, 'focus.onClose': true, 'focus.trap': true, 'keyboard.Escape': true,
};

/* A FIXTURE, NOT A CLAIM ABOUT ANY COMPONENT. The failure-path tests below feed
 * assertPattern deliberately false bindings to watch each diagnostic fire, and
 * they need a verdict map that makes the diagnostic reachable — the OVERCLAIM
 * test in particular needs at least one requirement to come back unmet, and now
 * that Dialog meets all seven there is nothing left in a real Dialog render to
 * supply one. So those tests keep the all-false verdicts.
 *
 * They are NOT bound to CONFIRM_DIALOG_BEHAVIOURAL even though the values are
 * identical today, and that is the whole reason this third constant exists: the
 * moment ConfirmDialog's verdicts flip, sharing it would silently break the
 * OVERCLAIM lever these tests are built on and the failure would look like a
 * ConfirmDialog regression. A fixture that must stay false is written down as
 * one. */
const ALL_UNMET = {
  'focus.onOpen': false, 'focus.onClose': false, 'focus.trap': false, 'keyboard.Escape': false,
};

/* Finding 2: the three synthetic-binding tests below used to write a fixed
 * filename into tmpdir() and unlinkSync it only after the assertion, with no
 * try/finally — a failing assertion leaked the file, and the fixed name could
 * collide with a concurrent process running the same suite. Every call site
 * pairs write with a try/finally unlink, and this generates a name unique per
 * process and per call so two runs (or two calls in one run) never collide. */
let tempCounter = 0;
function tempBindingPath(label) {
  tempCounter += 1;
  return join(tmpdir(), `arena-${label}-${process.pid}-${tempCounter}.behaviour.json`);
}

test('Dialog matches its dialog-modal binding, in both directions', () => {
  const container = mount(
    <Dialog open onClose={() => {}} title="Delete project">
      <p>Body</p>
    </Dialog>,
  );
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'feedback/dialog/Dialog.behaviour.json'),
    subjects: { default: container.querySelector('[role="dialog"], dialog') },
    behavioural: DIALOG_BEHAVIOURAL,
  });
});

test('ConfirmDialog matches its dialog-modal binding, in both directions', () => {
  const container = mount(
    <ConfirmDialog
      open
      onCancel={() => {}}
      onConfirm={() => {}}
      title="Delete project"
      confirmLabel="Delete"
    />,
  );
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'feedback/confirm-dialog/ConfirmDialog.behaviour.json'),
    // ConfirmDialog renders role="alertdialog"; its binding excepts roles.element
    // for exactly that, so the subject is located by either role.
    subjects: { default: container.querySelector('[role="dialog"], [role="alertdialog"]') },
    behavioural: CONFIRM_DIALOG_BEHAVIOURAL,
  });
});

/* The three below are the proof the assertion fires. A gate whose failure path
 * has never been seen is a gate nobody has evidence works, and this one's whole
 * value is in the failure path: the passing runs above would look identical if
 * comparePattern returned [] unconditionally. Each writes a deliberately false
 * binding to a temp file rather than touching a real one — a synthetic binding
 * under frameworks/ would be picked up by check:behaviour as a real declaration. */

test('assertPattern reports a stale exception', () => {
  const p = tempBindingPath('stale');
  // Dialog does render role="dialog" and aria-modal="true"; excepting them is a lie.
  writeFileSync(p, JSON.stringify({
    pattern: 'dialog-modal',
    exceptions: [{ requirement: 'roles.aria-modal', reason: 'synthetic' }],
  }));
  try {
    const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
    assert.throws(() => assertPattern({
      root: container,
      bindingPath: p,
      subjects: { default: container.querySelector('[role="dialog"]') },
      behavioural: ALL_UNMET,
    }), /STALE EXCEPTION/);
  } finally {
    unlinkSync(p);
  }
});

test('assertPattern reports an overclaim', () => {
  const p = tempBindingPath('overclaim');
  /* The lever used to be roles.label: Dialog carried no accessible name, so a
     binding with no exceptions overclaimed it off the rendered DOM alone. Plan
     8C4 gave Dialog an aria-labelledby, and a real Dialog render now meets all
     seven requirements — so the unmet requirement has to come from ALL_UNMET's
     behavioural verdicts instead, which is what that fixture is for. */
  writeFileSync(p, JSON.stringify({ pattern: 'dialog-modal', exceptions: [] }));
  try {
    const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
    assert.throws(() => assertPattern({
      root: container,
      bindingPath: p,
      subjects: { default: container.querySelector('[role="dialog"]') },
      behavioural: ALL_UNMET,
    }), /OVERCLAIM/);
  } finally {
    unlinkSync(p);
  }
});

test('assertPattern reports a missed selector as "no subject element", not as an OVERCLAIM', () => {
  // subjects.default is present but null — the caller named a selector and it
  // matched nothing. That must reach comparePattern's own "no subject element"
  // diagnostic, not silently fall back to root.firstElementChild (Dialog's
  // scrim div, which carries neither role nor aria-modal and would misreport
  // every requirement as an OVERCLAIM against the wrong element).
  const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
  assert.throws(() => assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'feedback/dialog/Dialog.behaviour.json'),
    subjects: { default: container.querySelector('[role="nonexistent"]') },
    behavioural: ALL_UNMET,
  }), (err) => {
    assert.match(err.message, /no subject element/);
    assert.doesNotMatch(err.message, /OVERCLAIM/);
    return true;
  });
});

test('assertPattern refuses an undeclared undecidable requirement', () => {
  const p = tempBindingPath('undeclared');
  writeFileSync(p, JSON.stringify({ pattern: 'dialog-modal', exceptions: [] }));
  try {
    const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
    assert.throws(() => assertPattern({
      root: container,
      bindingPath: p,
      subjects: { default: container.querySelector('[role="dialog"]') },
      behavioural: {},           // nothing declared
    }), /not declared behavioural/);
  } finally {
    unlinkSync(p);
  }
});
