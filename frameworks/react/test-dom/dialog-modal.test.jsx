/* dialog-modal, asserted in both directions.
 *
 * For each of the pattern's seven requirements this suite states one thing: the
 * requirement is met in the rendered DOM and the binding declares no exception,
 * or it is not met and the binding declares one. That single statement is the
 * stale-exception rule — the property check-dimension-literals.mjs's EXEMPT has
 * and the contract layer did not. The day somebody gives Dialog an aria-label
 * without deleting its roles.label exception, this fails.
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
import { mount, cleanup } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Dialog } from '../components/feedback/Dialog.jsx';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog.jsx';

afterEach(cleanup);

/* Every one of these is excepted by both bindings, and `false` means "a
 * behavioural test proved this requirement is NOT met". Neither component has a
 * keydown listener, a focus ref, or any stored invoker — read either source and
 * the four verdicts are visible in what is absent from it. The tests that
 * establish them by acting on the tree are plan 7c's task 6; until those land
 * these four verdicts rest on the same reading the exceptions' own reasons do,
 * which is exactly the state the rest of this suite exists to end. */
const BEHAVIOURAL = { 'focus.onOpen': false, 'focus.onClose': false, 'focus.trap': false, 'keyboard.Escape': false };

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
    bindingPath: join(REACT_COMPONENTS, 'feedback/Dialog.behaviour.json'),
    subjects: { default: container.querySelector('[role="dialog"], dialog') },
    behavioural: BEHAVIOURAL,
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
    bindingPath: join(REACT_COMPONENTS, 'feedback/ConfirmDialog.behaviour.json'),
    // ConfirmDialog renders role="alertdialog"; its binding excepts roles.element
    // for exactly that, so the subject is located by either role.
    subjects: { default: container.querySelector('[role="dialog"], [role="alertdialog"]') },
    behavioural: BEHAVIOURAL,
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
      behavioural: BEHAVIOURAL,
    }), /STALE EXCEPTION/);
  } finally {
    unlinkSync(p);
  }
});

test('assertPattern reports an overclaim', () => {
  const p = tempBindingPath('overclaim');
  // Dialog has no aria-label; a binding with no exceptions at all overclaims it.
  writeFileSync(p, JSON.stringify({ pattern: 'dialog-modal', exceptions: [] }));
  try {
    const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
    assert.throws(() => assertPattern({
      root: container,
      bindingPath: p,
      subjects: { default: container.querySelector('[role="dialog"]') },
      behavioural: BEHAVIOURAL,
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
    bindingPath: join(REACT_COMPONENTS, 'feedback/Dialog.behaviour.json'),
    subjects: { default: container.querySelector('[role="nonexistent"]') },
    behavioural: BEHAVIOURAL,
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
