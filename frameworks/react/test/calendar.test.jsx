import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Calendar } from '../components/display/Calendar.jsx';

/* WHAT THIS DIRECTORY CAN SHOW, AND WHY CALENDAR IS SPLIT ACROSS TWO OF THEM.
 *
 * This suite renders with renderToStaticMarkup and has no DOM, by design. So it
 * owns what a static render settles: the chip body, the two required-ness guards,
 * and the two R4 escapes. It asserts nothing about focus, keys or the roving tab
 * stop -- `frameworks/react/test-dom/grid-keyboard.test.jsx` owns those against a
 * real DOM and keeps owning them.
 *
 * `view="week"` is passed everywhere below. Without a DOM the container measures
 * null, which is already the wide branch, but pinning it keeps these assertions
 * about the API rather than about what an unmeasured container happens to do. */

const EVENTS = [
  { id: 'a', title: 'Standup', start: '2026-07-20T09:00:00Z', end: '2026-07-20T09:30:00Z', colorId: 1 },
  { id: 'b', title: 'Review', start: '2026-07-21T14:00:00Z', end: '2026-07-21T15:00:00Z', colorId: 2 },
];

const render = (extra) => renderToStaticMarkup(
  <Calendar events={EVENTS} timeZone="UTC" anchorDate="2026-07-20" view="week" {...extra} />,
);

/* renderEvent is gone, removed by the per-item convention that had already
 * removed ActivityFeed.renderItem -- not because it broke R3 (it filled the chip
 * rather than replacing it, which R3 permits) but because per-item projection has
 * no Angular answer short of a structural directive and ngTemplateOutlet. The chip
 * body is Arena's alone now, so the assertion is that the default body renders and
 * a stray renderEvent reaches nothing. A removal nothing asserts is a removal that
 * can come back: check:api reads the .d.ts and would stay green if the .jsx kept
 * honouring it. */
test('the chip body is Arena own, and a consumer renderer reaches nothing', () => {
  const html = render({ renderEvent: (e) => <em>{e.title.toUpperCase()}</em> });
  assert.match(html, /Standup/, 'the default chip body did not render');
  assert.doesNotMatch(html, /<em>/, 'a consumer renderer still reaches the chip -- renderEvent is not gone');
  assert.doesNotMatch(html, /STANDUP/, 'the consumer renderer ran');
});

/* Required-ness governs runtime, not only the declaration (api/README.md). Both
 * of these had a masking default before the contract: `events = []` drew an empty
 * grid, and `timeZone || 'UTC'` produced the exact defect that member's own
 * description names -- a schedule read in the wrong zone, wrong by hours, and
 * announcing nothing. */
test('a missing events list throws rather than drawing an empty schedule', () => {
  assert.throws(
    () => renderToStaticMarkup(<Calendar timeZone="UTC" anchorDate="2026-07-20" view="week" />),
    /Calendar: `events` is required/,
    'a Calendar with no events rendered instead of failing hard',
  );
});

test('a missing timeZone throws rather than silently falling back to UTC', () => {
  assert.throws(
    () => renderToStaticMarkup(<Calendar events={EVENTS} anchorDate="2026-07-20" view="week" />),
    /Calendar: `timeZone` is required/,
    'a Calendar with no timeZone rendered instead of failing hard -- the UTC fallback is back',
  );
});

/* R4: asserted in two separate tests -- node:assert aborts on the first failure, so
 * one body asserting both escapes cannot say which of them came back. `color` is
 * used rather than a dimension because check:dimensions walks the test directories
 * too, and a bare px here would fail that gate instead of this one. */
test('Calendar drops a consumer style object -- the ...style escape is gone', () => {
  const html = render({ style: { color: '#ff00ff' } });
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Calendar drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = render({ 'data-stray': 'x' });
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});

/* The one CalendarEvent field this migration renamed. `slot` became `colorId`
 * when the type moved to api/types/, and a component still reading the old name
 * would draw every chip in ramp slot 1 -- silently, since catColor clamps. Slot 2
 * is the marker: it appears in the markup only if the field was read. */
test('an event colours its chip from colorId, not from the old slot field', () => {
  const html = render({});
  const two = 'var(--color-cat-2)';
  assert.ok(html.includes(two), 'the second event did not take its ramp colour from colorId');
  const stale = renderToStaticMarkup(
    <Calendar events={[{ id: 'c', title: 'Stale', start: '2026-07-20T09:00:00Z', end: '2026-07-20T10:00:00Z', slot: 2 }]}
      timeZone="UTC" anchorDate="2026-07-20" view="week" />,
  );
  assert.ok(!stale.includes(two), 'the old `slot` field still picks a ramp colour -- the rename did not land');
});
