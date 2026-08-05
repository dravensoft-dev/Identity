/* Every verdict in the `behavioural` map below is earned by a named assertion in
 * this file, in the order the dialog lives: focus.onOpen, focus.trap in both
 * directions, keyboard.Escape, then focus.onClose last because it dismantles the
 * panel the others need. The four are undecidable from one element, so a wrong
 * verdict here would pin a false claim exactly as a text scan would. The invoker
 * button is appended to the shared document and removed in the finally, because
 * one document is shared by the whole run and outlives the file that wrote it. */
import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoNode, assertSameNode } from '../../../test/NodeAssert';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { ArenaConfirmDialog } from './ArenaConfirmDialog';
import { assertPattern, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'feedback/arena-confirm-dialog/ArenaConfirmDialog.behaviour.json');

function press(el: Element, key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

test('arena-confirm-dialog meets the alertdialog pattern it binds', () => {
  const invoker = document.createElement('button');
  invoker.textContent = 'Delete project';
  document.body.appendChild(invoker);
  invoker.focus();
  assertSameNode(document.activeElement, invoker, 'sanity: the invoker must hold focus before the dialog opens');

  const fixture = TestBed.createComponent(ArenaConfirmDialog);
  try {
    fixture.componentRef.setInput('title', 'Delete project');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as Element;
    const panel = host.querySelector('[role="alertdialog"]') as HTMLElement;
    assert.ok(panel, 'an open confirm dialog must render its panel');

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled])'));
    assert.equal(focusables.length, 2, 'the fixture must offer cancel and confirm, and nothing else focusable');
    const [cancel, confirm] = focusables;

    assertSameNode(document.activeElement, cancel,
      'focus.onOpen: opening did not move focus to the first focusable control inside the panel');

    confirm.focus();
    const forward = press(confirm, 'Tab');
    assert.equal(forward.defaultPrevented, true, 'focus.trap: ArenaTab off the last control was not intercepted');
    assertSameNode(document.activeElement, cancel, 'focus.trap: ArenaTab off the last control did not wrap to the first');

    const backward = press(cancel, 'Tab', true);
    assert.equal(backward.defaultPrevented, true, 'focus.trap: Shift+ArenaTab off the first control was not intercepted');
    assertSameNode(document.activeElement, confirm, 'focus.trap: Shift+ArenaTab off the first control did not wrap to the last');

    let cancelled = 0;
    fixture.componentInstance.cancel.subscribe(() => { cancelled += 1; });
    const escape = press(document.activeElement as Element, 'Escape');
    assert.equal(escape.defaultPrevented, true, 'keyboard.Escape: Escape was not intercepted');
    assert.equal(cancelled, 1, 'keyboard.Escape: Escape did not report through the dialog\'s own cancel output');

    assertPattern({
      root: host,
      bindingPath: BINDING,
      subjects: { default: panel },
      behavioural: {
        'focus.onOpen': true,
        'focus.trap': true,
        'keyboard.Escape': true,
        'focus.onClose': true,
      },
    });

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    assertNoNode(host.querySelector('[role="alertdialog"]'), 'closing did not remove the panel');
    assertSameNode(document.activeElement, invoker, 'focus.onClose: closing did not restore focus to the invoker');
  } finally {
    fixture.destroy();
    invoker.remove();
  }
});
