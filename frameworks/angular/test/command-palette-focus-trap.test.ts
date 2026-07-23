/* Task 14 review fix wave (plan 5a): `arena-command-palette` relied on a bare
 * `autofocus` attribute to reach its search input, which the HTML autofocus
 * processing model skips once the document's autofocus-processed flag is
 * set -- and opening the palette is itself a user interaction (Cmd/Ctrl+K),
 * so that flag is essentially always already set by the time `@if (open())`
 * inserts the input. In practice DOM focus never moved, every keydown
 * handler is bound to the input, and the palette was mouse-only.
 *
 * The fix reuses `arena-confirm-dialog`'s own focus contract, generalized
 * out of `confirm-dialog.ts` into `frameworks/angular/primitives/
 * focus-trap.ts` (`handleOpenTransition`, `trapTabKey`) rather than
 * reimplemented here -- see `confirm-dialog-focus-trap.test.ts`'s header for
 * why those are plain functions of a real `HTMLElement` in the first place.
 *
 * This does not render `<arena-command-palette>` through TestBed, for the
 * same confirmed reason `command-palette-keyboard.test.ts` documents: `open`
 * can never become `true` under this repo's JIT-only harness, since only
 * `ngtsc` (never run here) discovers a class's `input()` fields into
 * `ɵcmp.inputs`. What is proved here instead is that the shared helpers
 * behave correctly against the palette's own DOM shape -- one real `<input>`
 * plus several `tabindex="-1"` row buttons, which must never receive focus
 * or become a Tab stop -- built by hand and exercised with real `.focus()`
 * calls and real `document.activeElement`, independent of whether the
 * Angular template that produces this shape can be rendered here. This is
 * NOT proof that `command-palette.ts`'s own `afterRenderEffect`/`onKey`
 * wiring calls these functions correctly at the right time; that wiring
 * mirrors `confirm-dialog.ts`'s constructor and `onKeydown` line for line
 * (both call `handleOpenTransition` from an `afterRenderEffect` keyed on
 * `open()`, and `trapTabKey` from a `'Tab'` keydown branch), and
 * `ngc --strictTemplates` (`check:angular`) is the authority that it
 * compiles against the component's real `viewChild` and `inject(DOCUMENT)`
 * types. */
import { ensureDom } from './testbed-env';
ensureDom();

import test from 'node:test';
import assert from 'node:assert/strict';
import { type FocusTrapState, handleOpenTransition, trapTabKey } from '../primitives/focus-trap';

/** Builds the shape `arena-command-palette`'s panel renders: a real, enabled
 *  search `<input>` followed by `rowCount` `tabindex="-1"` row buttons --
 *  which must never receive focus or become a legal Tab stop, the same
 *  reason the real template puts `tabindex="-1"` on every row. */
function buildPalettePanel(rowCount: number): { panel: HTMLElement; input: HTMLElement; rows: HTMLElement[] } {
  const panel = document.createElement('div');
  const input = document.createElement('input');
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const row = document.createElement('button');
    row.setAttribute('tabindex', '-1');
    row.textContent = `row ${i}`;
    return row;
  });
  panel.append(input, ...rows);
  document.body.appendChild(panel);
  return { panel, input, rows };
}

function keydownTab(shiftKey: boolean): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true, bubbles: true });
}

test('opening the palette moves DOM focus into the search input, with no reliance on the autofocus attribute', () => {
  const trigger = document.createElement('button');
  trigger.textContent = 'Open palette (Cmd+K)';
  document.body.appendChild(trigger);
  trigger.focus();
  assert.equal(document.activeElement, trigger, 'sanity: focus starts on the trigger, as it would after a keyboard shortcut');

  const { panel, input } = buildPalettePanel(3);
  const state: FocusTrapState = { wasOpen: false, restoreTo: null };
  handleOpenTransition(state, true, panel, document.activeElement);

  assert.equal(document.activeElement, input, 'opening must move focus into the search input, never into a tabindex="-1" row');
});

test('closing the palette restores focus to whatever opened it -- a divergence from React, which never restores focus', () => {
  const trigger = document.createElement('button');
  document.body.appendChild(trigger);
  trigger.focus();

  const { panel } = buildPalettePanel(2);
  const state: FocusTrapState = { wasOpen: false, restoreTo: null };
  handleOpenTransition(state, true, panel, document.activeElement);
  handleOpenTransition(state, false, panel, document.activeElement);

  assert.equal(document.activeElement, trigger, 'closing must restore focus to the element that opened the palette');
});

test('Tab from the search input is trapped in place -- there is no other legal Tab stop in the panel', () => {
  const { panel, input } = buildPalettePanel(3);
  input.focus();
  const event = keydownTab(false);
  trapTabKey(panel, event, document.activeElement);
  assert.equal(document.activeElement, input, 'Tab must not move focus off the search input');
  assert.ok(event.defaultPrevented, 'the key must be consumed, or the browser would move focus to the page behind the scrim');
});

test('Shift+Tab from the search input is trapped the same way', () => {
  const { panel, input } = buildPalettePanel(3);
  input.focus();
  const event = keydownTab(true);
  trapTabKey(panel, event, document.activeElement);
  assert.equal(document.activeElement, input);
  assert.ok(event.defaultPrevented);
});

test('Tab can never reach a control behind the scrim -- the exact failure the review named', () => {
  const behind = document.createElement('button');
  behind.textContent = 'page control behind the scrim';
  document.body.appendChild(behind);

  const { panel, input } = buildPalettePanel(2);
  input.focus();
  const event = keydownTab(false);
  trapTabKey(panel, event, document.activeElement);

  assert.notEqual(document.activeElement, behind, 'focus must never escape to a control behind the scrim');
  assert.equal(document.activeElement, input);
});

