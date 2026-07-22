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
  const p = join(tmpdir(), 'arena-stale.behaviour.json');
  // Dialog does render role="dialog" and aria-modal="true"; excepting them is a lie.
  writeFileSync(p, JSON.stringify({
    pattern: 'dialog-modal',
    exceptions: [{ requirement: 'roles.aria-modal', reason: 'synthetic' }],
  }));
  const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
  assert.throws(() => assertPattern({
    root: container,
    bindingPath: p,
    subjects: { default: container.querySelector('[role="dialog"]') },
    behavioural: BEHAVIOURAL,
  }), /STALE EXCEPTION/);
  unlinkSync(p);
});

test('assertPattern reports an overclaim', () => {
  const p = join(tmpdir(), 'arena-overclaim.behaviour.json');
  // Dialog has no aria-label; a binding with no exceptions at all overclaims it.
  writeFileSync(p, JSON.stringify({ pattern: 'dialog-modal', exceptions: [] }));
  const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
  assert.throws(() => assertPattern({
    root: container,
    bindingPath: p,
    subjects: { default: container.querySelector('[role="dialog"]') },
    behavioural: BEHAVIOURAL,
  }), /OVERCLAIM/);
  unlinkSync(p);
});

test('assertPattern refuses an undeclared undecidable requirement', () => {
  const p = join(tmpdir(), 'arena-undeclared.behaviour.json');
  writeFileSync(p, JSON.stringify({ pattern: 'dialog-modal', exceptions: [] }));
  const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
  assert.throws(() => assertPattern({
    root: container,
    bindingPath: p,
    subjects: { default: container.querySelector('[role="dialog"]') },
    behavioural: {},           // nothing declared
  }), /not declared behavioural/);
  unlinkSync(p);
});
