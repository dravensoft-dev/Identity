/* The card case is the whole reason this binding has cases, and reaching it needs
 * two levers. happy-dom ships a ResizeObserver that never fires, so width stays
 * null and every render is wide -- `narrowWidths` stubs it to report one width
 * and restores it in a finally. And readBreakpoint reads --bp-md through
 * getComputedStyle, which the preload bridges from the token file; without that
 * it is NaN and `width < NaN` is false whatever the observer says.
 * The wide case walks the grid cell by cell, for the reason Calendar's own grid
 * suite gives: the bill is the number of presses, so the fixture stays small. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.tsx';
import { assertPattern, assertPatternCases, REACT_COMPONENTS } from '../../../test/AssertPattern.tsx';
import { Table } from './Table.tsx';
import { TableRow } from '../table-row/TableRow.tsx';
import { TableCell } from '../table-cell/TableCell.tsx';

afterEach(cleanup);

const BINDING = join(REACT_COMPONENTS, 'display/table/Table.behaviour.json');

const LABEL = 'Recent deployments';
const COLUMNS = [{ header: 'Service' }, { header: 'Status' }];
const ROWS = 2;

function rows() {
  return [
    <TableRow key="a"><TableCell>checkout-api</TableCell><TableCell>Healthy</TableCell></TableRow>,
    <TableRow key="b"><TableCell>billing-worker</TableCell><TableCell>Degraded</TableCell></TableRow>,
  ];
}

function narrowWidths<T>(width: number, body: () => T): T {
  const saved = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) { this.callback = callback; }
    observe(target: Element) {
      this.callback([{ target, contentRect: { width } }] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  try {
    return body();
  } finally {
    globalThis.ResizeObserver = saved;
  }
}

function press(key: string) {
  const el = document.activeElement;
  act(() => { el!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });
}

test('Table meets both of its declared shapes', () => {
  assertPatternCases({
    bindingPath: BINDING,
    cases: {

      wide: () => {
        const root = mount(<Table label={LABEL} columns={COLUMNS} responsive={false}>{rows()}</Table>);
        const grid = root.querySelector<HTMLElement>('[role="grid"]');
        assert.ok(grid, 'the wide shape must render a real grid');
        assert.equal(grid.getAttribute('aria-label'), LABEL, 'the grid name is not the `label` member');

        const gridRows = [...grid.querySelectorAll<HTMLElement>('[role="row"]')];
        assert.equal(gridRows.length, ROWS + 1, 'one header row plus one row per record');
        const cellsOf = (row: ParentNode) => [...row.querySelectorAll<HTMLElement>('[role="gridcell"], [role="columnheader"]')];
        const cells = gridRows.map(cellsOf);

        const start = cells[0]![0]!;
        act(() => { start.focus(); });
        assert.equal(root.querySelectorAll<HTMLElement>('[tabindex="0"]').length, 1, 'a grid is ONE tab stop');

        press('ArrowLeft');
        assert.equal(document.activeElement, start, 'ArrowLeft did not clamp on the first column');
        press('ArrowUp');
        assert.equal(document.activeElement, start, 'ArrowUp did not clamp on the header row');

        let visited = 1;
        for (let r = 0; r < cells.length; r += 1) {
          const rightward = r % 2 === 0;
          const step = rightward ? 'ArrowRight' : 'ArrowLeft';
          for (let i = 1; i < COLUMNS.length; i += 1) {
            const c = rightward ? i : COLUMNS.length - 1 - i;
            press(step);
            assert.equal(document.activeElement, cells[r]![c]!, `${step} did not land on row ${r} column ${c}`);
            const stops = root.querySelectorAll<HTMLElement>('[tabindex="0"]');
            assert.equal(stops.length, 1, 'the roving stop did not rove -- two cells are in the Tab sequence');
            assert.equal(stops[0], document.activeElement, 'the tab stop is not the focused cell');
            visited += 1;
          }
          if (r === cells.length - 1) break;
          const col = rightward ? COLUMNS.length - 1 : 0;
          press('ArrowDown');
          assert.equal(document.activeElement, cells[r + 1]![col]!, `ArrowDown did not reach row ${r + 1}`);
          visited += 1;
        }
        assert.equal(visited, cells.length * COLUMNS.length, 'the walk did not visit every cell exactly once');

        press('Home');
        assert.equal(document.activeElement, cells[cells.length - 1]![0]!, 'Home did not reach the first cell of the row');
        press('End');
        assert.equal(document.activeElement, cells[cells.length - 1]![COLUMNS.length - 1]!,
          'End did not reach the last cell of the row');
        press('ArrowDown');
        assert.equal(document.activeElement, cells[cells.length - 1]![COLUMNS.length - 1]!,
          'ArrowDown did not clamp on the last row');

        return {
          root,
          subjects: {
            default: grid,
            'roles.row': gridRows[0],
            'roles.cell': grid.querySelector<HTMLElement>('[role="gridcell"]')!,
          },
          behavioural: {
            'focus.roving': true,
            'keyboard.ArrowKeys': true,
            'keyboard.Home': true,
            'keyboard.End': true,
          },
        };
      },

      card: () => narrowWidths(400, () => {
        const root = mount(<Table label={LABEL} columns={COLUMNS}>{rows()}</Table>);
        assert.equal(root.querySelector<HTMLElement>('[role="grid"]')!, null,
          'below --bp-md there is no grid at all, which is why this case binds `none`');
        assert.equal(root.querySelector<HTMLElement>('table')!, null, 'the card shape renders no table element');
        assert.equal(root.querySelectorAll<HTMLElement>('[role="gridcell"]').length, 0,
          'no cells means no roving tab stop to claim -- the requirement does not apply rather than going unmet');
        return { root, subjects: { default: root.firstElementChild } };
      }),

      empty: () => {
        const root = mount(<Table label={LABEL} columns={COLUMNS} responsive={false} empty="Nothing shipped." />);
        assert.equal(root.querySelector<HTMLElement>('[role="grid"]')!, null,
          'with no rows there is no grid at all, which is why this case binds `none`');
        assert.equal(root.querySelector<HTMLElement>('[role="columnheader"]')!, null,
          'and no orphan header standing over the sentence that says there is nothing');
        assert.equal(root.querySelectorAll<HTMLElement>('[tabindex]').length, 0,
          'nothing to rove over means no tab stop to claim');
        assert.match(root.textContent, /Nothing shipped\./, 'the empty slot did not render');
        return { root, subjects: { default: root.firstElementChild } };
      },
    },
  });
});

test('TableCell binds "none" because Table owns the grid, and it adds no affordance of its own', () => {
  const root = mount(<Table label={LABEL} columns={COLUMNS} responsive={false}>{rows()}</Table>);
  const cell = root.querySelector<HTMLElement>('[role="gridcell"]');

  assert.ok(cell, 'the wide shape must render cells, or this assertion checked nothing');
  assert.equal(cell.getAttribute('role'), 'gridcell',
    'the role a cell carries is a clause of the `grid` pattern Table binds -- the cell does not choose it');
  assert.equal(cell.hasAttribute('aria-haspopup'), false,
    'a cell that grew an affordance of its own would need a pattern of its own, and its binding says it has none');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'display/table-cell/TableCell.behaviour.json'),
    subjects: { default: cell },
  });
});
