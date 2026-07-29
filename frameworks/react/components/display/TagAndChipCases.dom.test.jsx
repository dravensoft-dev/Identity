import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../test/Harness.jsx';
import { assertPatternCases, REACT_COMPONENTS } from '../../test/AssertPattern.jsx';
import { Tag } from './tag/Tag.jsx';
import { CalendarEvent } from './calendar-event/CalendarEvent.jsx';

afterEach(cleanup);

function assertKeysUnintercepted(el) {
  for (const key of ['Enter', ' ']) {
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    act(() => { el.dispatchEvent(ev); });
    assert.equal(ev.defaultPrevented, false,
      `a handler of ours cancelled ${key === ' ' ? 'Space' : key}, suppressing the button's own activation`);
  }
}

test('Tag meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'display/tag/Tag.behaviour.json'),
    cases: {

      plain: () => ({ root: mount(<Tag>Backend</Tag>) }),
      removable: () => {
        let removed = false;
        const root = mount(<Tag removable onRemove={() => { removed = true; }}>Backend</Tag>);

        const button = root.querySelector('button');
        assertKeysUnintercepted(button);
        act(() => { button.click(); });
        assert.equal(removed, true, 'sanity: a real click must reach onRemove');
        return {
          root,
          subjects: { default: button },
          behavioural: { 'states.disabled': false, 'keyboard.Space': true, 'keyboard.Enter': true },
        };
      },
    },
  });
});

const CHIP = {
  box: {}, color: 'var(--color-cat-1)', timeLabel: '09:00 - 09:30',
  dateLabel: 'Monday 20 July', tabIndex: -1,
};

test('CalendarEvent meets all three of its declared shapes', () => {
  assertPatternCases({
    bindingPath: join(REACT_COMPONENTS, 'display/calendar-event/CalendarEvent.behaviour.json'),
    cases: {

      clickable: () => {
        let clicked = false;
        const root = mount(<CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z"
          end="2026-07-20T09:30:00Z" onClick={() => { clicked = true; }} {...CHIP} />);
        assertKeysUnintercepted(root.firstElementChild);
        act(() => { root.firstElementChild.click(); });
        assert.equal(clicked, true, 'sanity: a real click must reach onClick');
        return {
          root,
          behavioural: { 'states.disabled': false, 'keyboard.Space': true, 'keyboard.Enter': true },
        };
      },

      'clickable-with-actions': () => {
        let clicked = false;
        const root = mount(<CalendarEvent id="b" title="Standup" start="2026-07-20T09:00:00Z"
          end="2026-07-20T09:30:00Z" onClick={() => { clicked = true; }} actionsEnabled
          actions={<button type="button">Delete</button>} {...CHIP} />);
        const body = [...root.querySelectorAll('button')]
          .find((b) => /^Standup,/.test(b.getAttribute('aria-label') || ''));

        assertKeysUnintercepted(body);
        act(() => { body.click(); });
        assert.equal(clicked, true, 'sanity: a real click must reach onClick');
        return {
          root,
          subjects: { default: body },
          behavioural: { 'states.disabled': false, 'keyboard.Space': true, 'keyboard.Enter': true },
        };
      },

      inert: () => ({
        root: mount(<CalendarEvent id="c" title="Standup" start="2026-07-20T09:00:00Z"
          end="2026-07-20T09:30:00Z" {...CHIP} />),
      }),
    },
  });
});
