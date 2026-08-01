/* THE GRID IS TRANSPOSED and every assertion depends on it: a role="row" is a DAY
 * COLUMN and its cells are that day's hour slots, so ArrowLeft/Right cross rows
 * (day -1/+1) while ArrowUp/Down, Home and End move within one row (hour).
 * grid.json prescribes no orientation and both mappings satisfy it.
 * ONE mount serves the file and the walk visits every cell with one press each.
 * The fixture is deliberately SMALL: peak RSS scales with the number of presses,
 * not with what is asserted, and every invariant here holds at any size >= 2x2 --
 * so the day window is narrowed rather than taking the default. `view="week"`,
 * `dayStart` and `dayEnd` are all explicit: a fixture whose shape comes from a
 * container width can flip the meaning of every assertion below. */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.tsx';
import { assertPattern, REACT_COMPONENTS } from '../../../test/AssertPattern.tsx';
import { Calendar } from './Calendar.tsx';
import { CalendarEvent } from '../calendar-event/CalendarEvent.tsx';

after(cleanup);

const BINDING = join(REACT_COMPONENTS, 'display/calendar/Calendar.behaviour.json');

const DAYS = 6;
const SLOTS = 5;

let root: HTMLElement | null = null;
function grid() {
  root ??= mount(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week" dayStart="09:00" dayEnd="14:00">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z" colorId={1} />
      <CalendarEvent id="b" title="Review" start="2026-07-21T14:00:00Z" end="2026-07-21T15:00:00Z" colorId={2} />
    </Calendar>,
  );
  return root.querySelector('[role="grid"]');
}

const rowsOf = (g: ParentNode) => [...g.querySelectorAll('[role="row"]')];
const cellsOf = (row: ParentNode) => [...row.querySelectorAll<HTMLElement>('[role="gridcell"]')];

function press(key: string) {
  const el = document.activeElement;
  act(() => { el!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });
}

function soleTabStop(g: ParentNode) {
  const stops = g.querySelectorAll('[tabindex="0"]');
  assert.equal(stops.length, 1, `a grid is ONE tab stop; found ${stops.length}`);
  assert.equal(stops[0], document.activeElement, 'the tab stop did not follow focus');
}

test('the grid is a named role="grid" of day rows and hour cells', () => {
  const g = grid();
  assert.ok(g, 'no role="grid" -- the grid pattern has nothing to attach to');
  assert.match(g.getAttribute('aria-label') ?? '', /^Schedule grid, /,
    'the grid element carries no name of its own');

  const rows = rowsOf(g);
  assert.equal(rows.length, DAYS, 'one row per day column');
  for (const row of rows) assert.equal(cellsOf(row).length, SLOTS, 'one gridcell per hour slot');
});

test('every cell in the grid is reachable by arrow keys, and the tab stop roves to each', () => {
  const g = grid();
  const rows = rowsOf(g!).map(cellsOf);

  act(() => { rows[0]![0]!.focus(); });
  assert.equal(document.activeElement, rows[0]![0]!, 'the cursor does not start on the first cell');
  soleTabStop(g!);

  press('ArrowLeft');
  assert.equal(document.activeElement, rows[0]![0]!, 'ArrowLeft did not clamp on the first day');
  press('ArrowUp');
  assert.equal(document.activeElement, rows[0]![0]!, 'ArrowUp did not clamp on the first hour');

  let visited = 1;
  for (let r = 0; r < DAYS; r += 1) {
    const downward = r % 2 === 0;
    const step = downward ? 'ArrowDown' : 'ArrowUp';
    for (let i = 1; i < SLOTS; i += 1) {
      const h = downward ? i : SLOTS - 1 - i;
      press(step);
      assert.equal(document.activeElement, rows[r]![h]!,
        `${step} from day ${r} did not land on hour ${h}`);
      soleTabStop(g!);
      visited += 1;
    }
    if (r === DAYS - 1) break;
    const hour = downward ? SLOTS - 1 : 0;
    press('ArrowRight');
    assert.equal(document.activeElement, rows[r + 1]![hour]!,
      `ArrowRight did not cross to day ${r + 1} at the same hour`);
    soleTabStop(g!);
    visited += 1;
  }
  assert.equal(visited, DAYS * SLOTS, 'the walk did not visit every cell exactly once');

  press('End');
  assert.equal(document.activeElement, rows[DAYS - 1]![SLOTS - 1]!,
    'End did not land on the last hour of the focused day');
  press('ArrowRight');
  assert.equal(document.activeElement, rows[DAYS - 1]![SLOTS - 1]!, 'ArrowRight did not clamp on the last day');
  press('ArrowDown');
  assert.equal(document.activeElement, rows[DAYS - 1]![SLOTS - 1]!, 'ArrowDown did not clamp on the last hour');
  assert.ok(g!.contains(document.activeElement), 'focus escaped the grid at a corner');

  press('Home');
  assert.equal(document.activeElement, rows[DAYS - 1]![0]!,
    'Home did not land on the first hour of the focused day, or moved the day as well');
});

test('Calendar agrees with its own behaviour binding, in both directions', () => {
  const g = grid();
  assertPattern({
    root: root!,
    bindingPath: BINDING,
    subjects: {
      default: g,
      'roles.row': g!.querySelector('[role="row"]')!,
      'roles.cell': g!.querySelector('[role="gridcell"]')!,
    },
    behavioural: {
      'focus.roving': true,
      'keyboard.ArrowKeys': true,
      'keyboard.Home': true,
      'keyboard.End': true,
    },
  });
});
