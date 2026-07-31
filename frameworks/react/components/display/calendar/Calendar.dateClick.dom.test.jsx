/* The head strip is indexed STRUCTURALLY -- it is the section's second child and
 * carries no role of its own -- because a day head is a <div> when the days are
 * inert and a <button> when they are not, and no one selector spans both. A guard
 * asserts that shape before every read, so a moved strip fails here rather than
 * selecting nothing and passing. Native Enter/Space activation of the header
 * button is the BROWSER's and is not asserted: happy-dom does not have it, and a
 * test for it would pass against a <div> just as well. Calendar.prompt.md carries
 * it as a by-hand check instead. */
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.jsx';
import { Calendar } from './Calendar.jsx';
import { formatDate } from './CalendarInternals.js';

after(cleanup);

const DAYS = ['2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25'];

const cal = (extra) => (
  <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week" dayStart="09:00" dayEnd="11:00" {...extra} />
);

function headStrip(root) {
  const section = root.querySelector('section');
  const strip = section && section.children[1];
  assert.ok(
    strip && !strip.querySelector('[role="grid"]') && strip.children.length === DAYS.length,
    'the head strip is no longer the section\'s second child holding one element per day -- this suite indexes it structurally',
  );
  return strip;
}

const dayHeads = (root) => [...headStrip(root).children];
const columns = (root) => [...root.querySelectorAll('[role="row"]')];
const click = (el) => { act(() => { el.click(); }); };

test('with dayInteractive, a day header is a button that reports its own date', () => {
  const seen = [];
  const root = mount(cal({ dayInteractive: true, onDateClick: (iso) => seen.push(iso) }));

  dayHeads(root).forEach((head, i) => {
    assert.equal(head.tagName, 'BUTTON', `day head ${i} is not a button -- the keyboard has no route to the date`);
    assert.equal(head.getAttribute('type'), 'button', `day head ${i} would submit a surrounding form`);
    assert.equal(
      head.getAttribute('aria-label'),
      formatDate(DAYS[i], { weekday: 'long', day: 'numeric', month: 'long' }),
      `day head ${i} announces its two text nodes rather than the date it stands for`,
    );
  });

  const heads = dayHeads(root);
  click(heads[0]);
  click(heads[3]);
  assert.deepEqual(seen, [DAYS[0], DAYS[3]], 'a day header did not report its own ISO date');
});

test('with dayInteractive, the column background reports its day as well', () => {
  const seen = [];
  const root = mount(cal({ dayInteractive: true, onDateClick: (iso) => seen.push(iso) }));

  const cols = columns(root);
  assert.equal(cols.length, DAYS.length, 'the fixture is not the six-day week this suite indexes');
  click(cols[1]);
  assert.deepEqual(seen, [DAYS[1]], 'the column background did not report its day');
});

test('dateClick bound with dayInteractive off activates nothing -- R6', () => {
  const seen = [];
  const root = mount(cal({ onDateClick: (iso) => seen.push(iso) }));

  for (const [i, head] of dayHeads(root).entries()) {
    assert.equal(head.tagName, 'DIV', `inert day head ${i} is a button -- the strip took a tab stop nobody declared`);
  }

  click(dayHeads(root)[0]);
  click(columns(root)[0]);
  assert.deepEqual(
    seen, [],
    'binding the listener alone activated the days -- the render is derived from the listener again',
  );
});

test('dayInteractive with no listener draws the affordance and activates without throwing', () => {
  const root = mount(cal({ dayInteractive: true }));
  click(dayHeads(root)[0]);
  click(columns(root)[0]);
});
