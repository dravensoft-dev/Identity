/* Calendar binds `grid` and excepted all eight of its requirements. This suite is
 * the bidirectional half of paying that down: assertPattern fails a requirement
 * met with NO exception declared AND an exception that has stopped being true, so
 * the implementation and the binding cannot drift apart in either direction. That
 * is why it is written BEFORE the implementation — it goes red for the right
 * reason (no role="grid" at all), and it goes red again later if someone deletes
 * the keyboard handling and leaves the binding claiming it works.
 *
 * Four of the eight are requirements no single element can decide — focus.roving
 * and the three keyboard.* — so comparePattern returns null for them and this
 * suite must prove each by ACTING on the tree and recording the verdict in
 * `behavioural`. assertPattern throws if one is silently skipped. A wrong verdict
 * here pins a false claim exactly as the rejected text scan would have, so every
 * verdict in that map is earned by a named test above it in this same file:
 *
 *   focus.roving        -> 'one tab stop into the grid, and ArrowRight roves it'
 *   keyboard.ArrowKeys  -> that test, plus the two hour tests and the two clamp tests
 *   keyboard.Home       -> 'Home lands on the first cell of the focused row'
 *   keyboard.End        -> 'End lands on the last cell of the focused row'
 *
 * THE GRID IS TRANSPOSED, and every assertion below depends on knowing it: a
 * `role="row"` is a DAY COLUMN and its cells are that day's hour slots. See the
 * comment on the grid container in Calendar.jsx for why the DOM cannot be
 * re-laid-out row-major without moving the absolutely positioned layout. So
 * ArrowLeft/ArrowRight cross rows (visual left/right = day -1/+1) while
 * ArrowUp/ArrowDown and Home/End move within one row (hour, first hour, last
 * hour). grid.json prescribes no orientation and both mappings satisfy it.
 *
 * `view="week"` is passed explicitly rather than relying on the default. The
 * default reads a container width through ResizeObserver, and a fixture whose
 * column count depends on what happy-dom reports for an unstyled div is a fixture
 * that can flip the meaning of every ArrowLeft assertion without a line changing. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Calendar } from '../components/display/Calendar.jsx';

afterEach(cleanup);

/* Monday 2026-07-20 anchors the week; UTC keeps the wall clock the same as the
 * ISO strings. Sunday 26 carries no event, so hideEmptyWeekend drops it and the
 * week is SIX columns: Mon 20 .. Sat 25. */
const EVENTS = [
  { id: 'a', title: 'Standup', start: '2026-07-20T09:00:00Z', end: '2026-07-20T09:30:00Z', colorId: 1 },
  { id: 'b', title: 'Review', start: '2026-07-21T14:00:00Z', end: '2026-07-21T15:00:00Z', colorId: 2 },
];

const DAYS = 6;

/* dayStart falls back to the earliest event floored to the hour (09:00) and
 * dayEnd defaults to 23:00, so the hour lines are 09:00..23:00 — fifteen lines,
 * and fourteen slots, because the last line has nothing below it. */
const SLOTS = 14;

function render(extra) {
  return mount(
    <Calendar events={EVENTS} timeZone="UTC" anchorDate="2026-07-20" view="week" {...extra} />,
  );
}

/** Dispatch a keydown on whatever currently holds focus, inside act() so the
 *  cursor state and its focus effect have both flushed before the assertion. */
function press(key) {
  const el = document.activeElement;
  act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });
}

const cellsOf = (row) => [...row.querySelectorAll('[role="gridcell"]')];

test('Calendar renders a named grid whose rows are days and whose cells are hour slots', () => {
  const root = render();
  const grid = root.querySelector('[role="grid"]');
  assert.ok(grid, 'no role="grid" — the grid pattern has nothing to attach to');
  assert.match(grid.getAttribute('aria-label') ?? '', /^Schedule grid, /,
    'the grid element carries no name of its own; roles.label has nothing to describe');

  // The <section> keeps its own label: removing it would demote a named region
  // landmark to a generic element.
  const section = root.querySelector('section');
  assert.match(section.getAttribute('aria-label') ?? '', /^Schedule, /);

  const rows = [...grid.querySelectorAll('[role="row"]')];
  assert.equal(rows.length, DAYS, 'one row per day column');
  for (const row of rows) {
    assert.equal(cellsOf(row).length, SLOTS, 'one gridcell per hour slot of that day');
  }
});

test('one tab stop into the grid, and ArrowRight roves it', () => {
  const root = render();
  const grid = root.querySelector('[role="grid"]');

  const stops = root.querySelectorAll('[tabindex="0"]');
  assert.equal(stops.length, 1, 'a grid is ONE tab stop; found ' + stops.length);

  const first = stops[0];
  assert.equal(first.getAttribute('role'), 'gridcell', 'the tab stop is not a cell');
  const rows = [...grid.querySelectorAll('[role="row"]')];
  assert.equal(cellsOf(rows[0])[0], first, 'the initial cursor is not the first cell of the first row');

  act(() => { first.focus(); });
  press('ArrowRight');

  assert.notEqual(document.activeElement, first, 'ArrowRight did not move focus');
  assert.equal(document.activeElement, cellsOf(rows[1])[0],
    'ArrowRight moved focus somewhere other than the same hour of the next day');
  const after = root.querySelectorAll('[tabindex="0"]');
  assert.equal(after.length, 1, 'the roving stop did not rove — two cells are in the Tab sequence');
  assert.equal(after[0], document.activeElement, 'the tab stop is not the focused cell');
});

test('ArrowDown and ArrowUp move by one hour inside the focused day', () => {
  const root = render();
  const rows = [...root.querySelectorAll('[role="row"]')];
  const cells = cellsOf(rows[0]);

  act(() => { cells[0].focus(); });
  press('ArrowDown');
  assert.equal(document.activeElement, cells[1], 'ArrowDown did not move to the next hour');
  press('ArrowDown');
  assert.equal(document.activeElement, cells[2]);
  press('ArrowUp');
  assert.equal(document.activeElement, cells[1], 'ArrowUp did not move to the previous hour');
});

test('focus is clamped at the grid edges in both axes', () => {
  const root = render();
  const grid = root.querySelector('[role="grid"]');
  const rows = [...root.querySelectorAll('[role="row"]')];

  act(() => { cellsOf(rows[0])[0].focus(); });
  for (let i = 0; i < 40; i += 1) press('ArrowLeft');
  assert.ok(grid.contains(document.activeElement), 'focus escaped the grid at its left edge');
  assert.equal(document.activeElement, cellsOf(rows[0])[0], 'ArrowLeft did not clamp on the first day');

  for (let i = 0; i < 40; i += 1) press('ArrowUp');
  assert.equal(document.activeElement, cellsOf(rows[0])[0], 'ArrowUp did not clamp on the first hour');

  for (let i = 0; i < 40; i += 1) press('ArrowRight');
  assert.ok(grid.contains(document.activeElement), 'focus escaped the grid at its right edge');
  assert.equal(document.activeElement, cellsOf(rows[DAYS - 1])[0], 'ArrowRight did not clamp on the last day');

  for (let i = 0; i < 40; i += 1) press('ArrowDown');
  assert.ok(grid.contains(document.activeElement), 'focus escaped the grid at its bottom edge');
  assert.equal(document.activeElement, cellsOf(rows[DAYS - 1])[SLOTS - 1],
    'ArrowDown did not clamp on the last hour');
});

test('Home lands on the first cell of the focused row', () => {
  const root = render();
  const rows = [...root.querySelectorAll('[role="row"]')];
  const cells = cellsOf(rows[2]);

  act(() => { cells[5].focus(); });
  assert.equal(document.activeElement, cells[5], 'the fixture did not start where it says it does');
  press('Home');
  // Asserted against the actual first cell NODE of that row, not merely "focus
  // moved": a handler that reset the day as well as the hour would also move
  // focus, and would also be wrong.
  assert.equal(document.activeElement, cells[0], 'Home did not land on the first cell of the current row');
});

test('End lands on the last cell of the focused row', () => {
  const root = render();
  const rows = [...root.querySelectorAll('[role="row"]')];
  const cells = cellsOf(rows[2]);

  act(() => { cells[5].focus(); });
  press('End');
  assert.equal(document.activeElement, cells[SLOTS - 1],
    'End did not land on the last cell of the current row');
});

/* The event blocks were page-level tab stops before this change: with
 * onEventClick set each one is a native <button>, so a keyboard user could reach
 * and activate an event. A roving grid takes them OUT of the page Tab sequence,
 * and doing only that would be a net loss. APG's answer is that they stay
 * reachable from inside the cell, which is what Enter and Escape implement here.
 * keyboard.Enter is not one of grid.json's eight requirements, so this adds no
 * exception either way; it exists so the trade is not a regression. */
test('event blocks leave the page Tab sequence but stay reachable with Enter and Escape', () => {
  const seen = [];
  const root = render({ onEventClick: (ev) => seen.push(ev.id) });
  const rows = [...root.querySelectorAll('[role="row"]')];

  const buttons = [...root.querySelectorAll('button')].filter((b) => /Standup|Review/.test(b.textContent));
  assert.equal(buttons.length, 2, 'the fixture did not render both events as buttons');
  for (const b of buttons) {
    assert.equal(b.getAttribute('tabindex'), '-1', 'an event block is still a page-level tab stop');
  }
  assert.equal(root.querySelectorAll('[tabindex="0"]').length, 1,
    'adding events added a second tab stop');

  // Slot 0 of row 0 is 09:00-10:00, which the 09:00-09:30 Standup intersects.
  const cell = cellsOf(rows[0])[0];
  act(() => { cell.focus(); });
  press('Enter');
  assert.equal(document.activeElement, buttons[0], 'Enter did not move focus into the intersecting event');

  press('Escape');
  assert.equal(document.activeElement, cell, 'Escape did not return focus to the cursor cell');

  // A slot with no event in it keeps focus where it is rather than jumping.
  const empty = cellsOf(rows[0])[7];
  act(() => { empty.focus(); });
  press('Enter');
  assert.equal(document.activeElement, empty, 'Enter moved focus out of a cell with no event in it');
});

test('Calendar agrees with its own behaviour binding, in both directions', () => {
  const root = render({ onEventClick: () => {} });
  const grid = root.querySelector('[role="grid"]');

  /* Each role requirement is judged against the element it is ABOUT. A single
   * `default` cannot serve all four: ROLE_NAMED_BY_KEY asks the subject itself
   * to expose `row` and `gridcell`, and the grid element exposes neither. */
  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'display', 'Calendar.behaviour.json'),
    subjects: {
      default: grid,
      'roles.row': grid.querySelector('[role="row"]'),
      'roles.cell': grid.querySelector('[role="gridcell"]'),
    },
    behavioural: {
      'focus.roving': true,
      'keyboard.ArrowKeys': true,
      'keyboard.Home': true,
      'keyboard.End': true,
    },
  });
});
