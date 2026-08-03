import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { mount, cleanup } from '../../test/Harness.tsx';
import { assertPattern, REACT_COMPONENTS } from '../../test/AssertPattern.tsx';
import { Dialog } from './dialog/Dialog.tsx';
import { ConfirmDialog } from './confirm-dialog/ConfirmDialog.tsx';

afterEach(cleanup);

const DIALOG_BEHAVIOURAL = {
  'focus.onOpen': true, 'focus.onClose': true, 'focus.trap': true, 'keyboard.Escape': true,
};

const CONFIRM_DIALOG_BEHAVIOURAL = {
  'focus.onOpen': true, 'focus.onClose': true, 'focus.trap': true, 'keyboard.Escape': true,
};

const ALL_UNMET = {
  'focus.onOpen': false, 'focus.onClose': false, 'focus.trap': false, 'keyboard.Escape': false,
};

let tempCounter = 0;
function tempBindingPath(label: string) {
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
    subjects: { default: container.querySelector<HTMLElement>('[role="dialog"], dialog') },
    behavioural: DIALOG_BEHAVIOURAL,
  });
});

test('ConfirmDialog matches its alertdialog binding, in both directions', () => {
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

    subjects: { default: container.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]') },
    behavioural: CONFIRM_DIALOG_BEHAVIOURAL,
  });
});

test('assertPattern reports a stale exception', () => {
  const p = tempBindingPath('stale');

  writeFileSync(p, JSON.stringify({
    pattern: 'dialog-modal',
    exceptions: [{ requirement: 'roles.aria-modal', reason: 'synthetic' }],
  }));
  try {
    const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
    assert.throws(() => assertPattern({
      root: container,
      bindingPath: p,
      subjects: { default: container.querySelector<HTMLElement>('[role="dialog"]') },
      behavioural: ALL_UNMET,
    }), /STALE EXCEPTION/);
  } finally {
    unlinkSync(p);
  }
});

test('assertPattern reports an overclaim', () => {
  const p = tempBindingPath('overclaim');

  writeFileSync(p, JSON.stringify({ pattern: 'dialog-modal', exceptions: [] }));
  try {
    const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
    assert.throws(() => assertPattern({
      root: container,
      bindingPath: p,
      subjects: { default: container.querySelector<HTMLElement>('[role="dialog"]') },
      behavioural: ALL_UNMET,
    }), /OVERCLAIM/);
  } finally {
    unlinkSync(p);
  }
});

test('assertPattern reports a missed selector as "no subject element", not as an OVERCLAIM', () => {

  const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
  assert.throws(() => assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'feedback/dialog/Dialog.behaviour.json'),
    subjects: { default: container.querySelector<HTMLElement>('[role="nonexistent"]') },
    behavioural: ALL_UNMET,
  }), (err) => {
    assert.match((err as Error).message, /no subject element/);
    assert.doesNotMatch((err as Error).message, /OVERCLAIM/);
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
      subjects: { default: container.querySelector<HTMLElement>('[role="dialog"]') },
      behavioural: {},
    }), /not declared behavioural/);
  } finally {
    unlinkSync(p);
  }
});

test('the require-text input substitutes a focus ring for the outline it removes', () => {
  const container = mount(
    <ConfirmDialog open onCancel={() => {}} onConfirm={() => {}} title="Delete project"
      confirmLabel="Delete" requireText="DELETE" />,
  );
  const input = container.querySelector<HTMLInputElement>('input');
  assert.ok(input, 'the requireText branch must render its input');
  const drawn = input.className;
  assert.ok(drawn.includes('outline-none'),
    'the outline is still removed -- what changed is that something takes its place');
  assert.ok(drawn.includes('focus-visible:ring-[length:var(--focus-width)]'),
    'the ring width must be the token');
  assert.ok(drawn.includes('focus-visible:ring-error'),
    'the ring is keyed to :focus-visible in the danger colour; for a TEXT input :focus-visible also '
    + 'matches a mouse click, so this is not about hiding a ring');

  assert.equal(document.head.querySelectorAll('style[data-arena-confirm-dialog]').length, 0,
    'the rule lives in the manifest now, so nothing injects a stylesheet for it');
  assert.equal(container.querySelectorAll<HTMLElement>('style').length, 0,
    'and nothing renders one inline either, which would ship one tag per instance');
});
