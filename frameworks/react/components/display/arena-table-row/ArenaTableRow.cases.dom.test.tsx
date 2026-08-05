/* `layout` is injected by ArenaTable, so the cases are driven by passing it directly
 * rather than by mounting an ArenaTable and forcing a container width -- the row is the
 * subject here, not the responsive branch that chooses it. The wide row binds
 * `none` because every requirement that applies to it is a clause of ArenaTable's own
 * `grid` binding; what this suite proves about that case is that the row claims
 * no interactive route of its own, which is what `none` asserts. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.tsx';
import { assertPatternCases, REACT_COMPONENTS } from '../../../test/AssertPattern.tsx';
import { ArenaTableRow } from './ArenaTableRow.tsx';
import { ArenaTableCell } from '../arena-table-cell/ArenaTableCell.tsx';

afterEach(cleanup);

const BINDING = join(REACT_COMPONENTS, 'display/arena-table-row/ArenaTableRow.behaviour.json');

const COLUMNS = [{ header: 'Service' }, { header: 'Status' }];

function card(extra: Record<string, unknown> = {}) {
  return mount(
    <ArenaTableRow layout="card" columns={COLUMNS} {...extra}>
      <ArenaTableCell>checkout-api</ArenaTableCell>
      <ArenaTableCell>Healthy</ArenaTableCell>
    </ArenaTableRow>,
  );
}

function press(el: Element, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => { el.dispatchEvent(event); });
  return event;
}

test('ArenaTableRow meets all three of its declared shapes', () => {
  assertPatternCases({
    bindingPath: BINDING,
    cases: {

      row: () => {
        const root = mount(
          <table><tbody>
            <ArenaTableRow interactive layout="table" columns={COLUMNS} rowIndex={1} onClick={() => {}}>
              <ArenaTableCell>checkout-api</ArenaTableCell>
              <ArenaTableCell>Healthy</ArenaTableCell>
            </ArenaTableRow>
          </tbody></table>,
        );
        const tr = root.querySelector<HTMLElement>('tr');
        assert.equal(tr!.getAttribute('role'), 'row', 'the wide row is a row, and ArenaTable\'s grid owns it');
        assert.equal(tr!.hasAttribute('tabindex'), false,
          'the roving stop lives on the CELLS, injected by ArenaTable -- a stop on the row would be a second one');
        return { root, subjects: { default: tr } };
      },

      'card-interactive': () => {
        let clicked = 0;
        const root = card({ interactive: true, onClick: () => { clicked += 1; } });
        const el = root.firstElementChild;

        assert.equal(el!.tagName, 'DIV', 'the card shape is a div, which is why it CAN take role="button"');
        assert.equal(el!.getAttribute('tabindex'), '0', 'a card row is reached by ArenaTab, unlike the wide row');
        assert.match(el!.textContent, /checkout-api/,
          'the button pattern accepts text content as its name, and the cells are that text');

        const enter = press(el!, 'Enter');
        assert.equal(clicked, 1, 'Enter did not activate the card row');
        assert.equal(enter.defaultPrevented, true, 'Enter was not claimed by the row');

        const space = press(el!, ' ');
        assert.equal(clicked, 2, 'Space did not activate the card row');
        assert.equal(space.defaultPrevented, true,
          'Space must be prevented, or the page scrolls under the row the user just pressed');

        let blocked = 0;
        const off = card({ interactive: true, disabled: true, onClick: () => { blocked += 1; } });
        const offEl = off.firstElementChild;
        assert.equal(offEl!.getAttribute('aria-disabled'), 'true',
          'a disabled row must announce itself rather than leave the tab order');
        assert.equal(offEl!.getAttribute('role'), 'button',
          'it is still a button -- a disabled control that stops being one cannot be found at all');
        press(offEl!, 'Enter');
        act(() => { (offEl as HTMLElement).click(); });
        assert.equal(blocked, 0, 'a disabled row activated anyway');

        return {
          root,
          subjects: { default: el },
          behavioural: { 'keyboard.Enter': true, 'keyboard.Space': true, 'states.disabled': true },
        };
      },

      'card-inert': () => {
        const root = card();
        const el = root.firstElementChild;
        assert.equal(el!.hasAttribute('role'), false, 'with no onClick there is nothing to press');
        assert.equal(el!.hasAttribute('tabindex'), false, 'an inert card must not be in the tab order');
        return { root, subjects: { default: el } };
      },
    },
  });
});
