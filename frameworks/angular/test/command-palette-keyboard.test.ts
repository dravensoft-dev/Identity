/* CommandPalette's behaviour IS the component: filter as you type, arrow to
 * move the active row, Enter to run it, Escape to close, hover to select.
 * `command-palette.ts` was written the way `confirm-dialog.ts` was -- the
 * behaviour that does not need Angular's own component instance lives in
 * plain exported functions, so it is testable with no `TestBed` at all.
 *
 * This does NOT render `<arena-command-palette>` through TestBed, for the
 * same confirmed reason `confirm-dialog-focus-trap.test.ts` documents -- and
 * the two ways `open` cannot be set fail DIFFERENTLY, which is the part that
 * bites: `[open]="true"` THROWS NG0303, while `componentRef.setInput('open',
 * true)` logs NG0303 and then silently NO-OPS. `open` became
 * `input.required<boolean>()` under the API contract
 * (`api/components/CommandPalette.json`), so a silent no-op now leaves it
 * genuinely unset rather than sitting on a default value -- the next read of
 * `open()` during change detection throws NG0950 instead of quietly passing
 * against a stale default. A throw announces itself either way; the point
 * that matters here is unchanged: no binding path reliably renders an
 * actually-open palette under this harness. Both failure modes stem from the
 * same cause -- only `ngtsc` (never run here) discovers a class's `input()`
 * fields into `ɵcmp.inputs`. Since `open` can never become `true` here, no
 * TestBed-based test can render an actually-open palette; `filterCommands`,
 * `nextActiveIndex` and `scrollRowIntoView` are exported precisely so they
 * stay testable despite that.
 *
 * `scrollRowIntoView` needs `document.createElement`, so this file asks for
 * the directory's shared happy-dom global (`ensureDom()`, testbed-env.ts).
 * There is exactly one document for the whole process and it is never torn
 * down -- that file's header explains why a per-file register/unregister pair,
 * which is what this suite used to carry, is not merely wasteful but breaks
 * the TestBed suites outright. happy-dom's own `Element.scrollIntoView`
 * is a documented no-op (see `node_modules/happy-dom/lib/nodes/element/
 * Element.js`), so what is asserted below is that the right element is
 * asked to scroll, not that a real browser's scroll position changes --
 * `bun run check:cards` is the one path in this repo that renders a real
 * browser at all. */
import { ensureDom } from './testbed-env';
ensureDom();

import test from 'node:test';
import assert from 'node:assert/strict';
import type { Command } from '../api.generated';
import {
  activeOptionId,
  filterCommands,
  nextActiveIndex,
  optionRowId,
  scrollRowIntoView,
} from '../primitives/command-palette/command-palette';

const COMMANDS: Command[] = [
  { id: 'deploy', label: 'Deploy to production', hint: 'client portal', shortcut: '⌘D' },
  { id: 'logs', label: 'View build logs', hint: 'build 4821' },
  { id: 'invite', label: 'Invite teammate', hint: 'members settings' },
  { id: 'theme', label: 'Toggle theme' },
];

test('an empty query keeps every command, in its original order', () => {
  assert.deepEqual(filterCommands(COMMANDS, ''), COMMANDS);
});

test('the query matches against the label, case-insensitively', () => {
  const result = filterCommands(COMMANDS, 'DEPLOY');
  assert.deepEqual(result.map((c) => c.id), ['deploy']);
});

test('the query also matches against hint, even though hint is never shown -- a command is findable by a synonym not in its label', () => {
  const result = filterCommands(COMMANDS, 'members');
  assert.deepEqual(result.map((c) => c.id), ['invite']);
});

test('a command with no hint is still matched by its label alone', () => {
  const result = filterCommands(COMMANDS, 'toggle');
  assert.deepEqual(result.map((c) => c.id), ['theme']);
});

test('a query matching nothing answers an empty list, not the full one', () => {
  assert.deepEqual(filterCommands(COMMANDS, 'zzz'), []);
});

test('ArrowDown moves the active index forward by one', () => {
  assert.equal(nextActiveIndex(0, 'ArrowDown', 4), 1);
});

test('ArrowDown at the last row stays put -- it does not wrap', () => {
  assert.equal(nextActiveIndex(3, 'ArrowDown', 4), 3);
});

test('ArrowUp moves the active index back by one', () => {
  assert.equal(nextActiveIndex(2, 'ArrowUp', 4), 1);
});

test('ArrowUp at the first row stays put -- it does not wrap', () => {
  assert.equal(nextActiveIndex(0, 'ArrowUp', 4), 0);
});

test('an empty result list always answers index 0, in either direction', () => {
  assert.equal(nextActiveIndex(0, 'ArrowDown', 0), 0);
  assert.equal(nextActiveIndex(0, 'ArrowUp', 0), 0);
});

test('scrollRowIntoView asks the row at the given index to scroll itself into view', () => {
  const list = document.createElement('div');
  const rows = [0, 1, 2].map(() => document.createElement('button'));
  list.append(...rows);
  document.body.appendChild(list);

  let calledWith: ScrollIntoViewOptions | undefined;
  rows[1].scrollIntoView = (options?: boolean | ScrollIntoViewOptions) => {
    calledWith = options as ScrollIntoViewOptions;
  };

  scrollRowIntoView(list, 1);

  assert.deepEqual(calledWith, { block: 'nearest' });
});

test('scrollRowIntoView does nothing when no row exists at the given index', () => {
  const list = document.createElement('div');
  document.body.appendChild(list);
  assert.doesNotThrow(() => scrollRowIntoView(list, 0));
});

test('optionRowId formats a row id from the instance prefix and the row index', () => {
  assert.equal(optionRowId('arena-command-palette-0', 2), 'arena-command-palette-0-option-2');
});

test('activeOptionId points at the active row\'s real id when a row exists there -- the property aria-activedescendant depends on', () => {
  assert.equal(activeOptionId('arena-command-palette-0', 1, 4), optionRowId('arena-command-palette-0', 1));
});

test('activeOptionId is undefined, not dangling, when the filtered list is empty', () => {
  assert.equal(activeOptionId('arena-command-palette-0', 0, 0), undefined);
});

test('activeOptionId is undefined when the active index is out of range for a non-empty list', () => {
  assert.equal(activeOptionId('arena-command-palette-0', 5, 3), undefined);
});

