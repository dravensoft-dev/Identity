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

/* Required-ness governs runtime, not only the declaration (api/README.md).
 * `events` had a masking `= []` before the contract, which drew an empty grid
 * where a caller had made a mistake. There is no sensible default for it. */
test('a missing events list throws rather than drawing an empty schedule', () => {
  assert.throws(
    () => renderToStaticMarkup(<Calendar timeZone="UTC" anchorDate="2026-07-20" view="week" />),
    /Calendar: `events` is required/,
    'a Calendar with no events rendered instead of failing hard',
  );
});

/* `timeZone` is deliberately NOT required, and this pair is the argument.
 *
 * The default it replaced was the literal 'UTC' -- arbitrary, and wrong for
 * almost every reader. The reader's own RESOLVED zone is a different kind of
 * value: right whenever the schedule belongs to whoever is looking at it, which
 * is the common case, and every consumer was writing that same line at the call
 * site to obtain it.
 *
 * THE RESOLVED ZONE MUST BE STUBBED, and the reason is worth writing down because
 * the obvious test is vacuous and looks fine. `bun test` runs with the resolved
 * zone forced to UTC -- measured: inside the runner
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` is 'UTC' with TZ unset,
 * while the same expression in a plain `bun` process reports the machine's real
 * zone. So a test comparing "omitted" against "passed resolvedOptions()"
 * compares UTC with UTC and passes just as happily against the literal 'UTC'
 * fallback this replaced. It was written that way first and proved to pass with
 * the old fallback restored, which is the only reason this comment exists.
 *
 * Stubbing the ZERO-ARGUMENT call alone keeps it surgical: that form is used
 * only by the component's default, while calendar-internals always constructs
 * its formatters with arguments and so still gets the real ones. */
test('an omitted timeZone resolves to the reader own zone, exactly', () => {
  const Real = Intl.DateTimeFormat;
  Intl.DateTimeFormat = function (...args) {
    const inst = new Real(...args);
    if (args.length === 0) {
      return { resolvedOptions: () => ({ ...inst.resolvedOptions(), timeZone: 'Asia/Tokyo' }) };
    }
    return inst;
  };
  try {
    const implicit = renderToStaticMarkup(
      <Calendar events={EVENTS} anchorDate="2026-07-20" view="week" />,
    );
    const explicit = renderToStaticMarkup(
      <Calendar events={EVENTS} timeZone="Asia/Tokyo" anchorDate="2026-07-20" view="week" />,
    );
    assert.equal(implicit, explicit, 'the default is not the reader resolved zone');
    assert.match(implicit, /18:00/, 'the default did not shift the 09:00Z event into the stubbed zone');
  } finally {
    Intl.DateTimeFormat = Real;
  }
});

/* And the member still governs when passed, or the default would be the only
 * behaviour there is. 09:00Z is 18:00 in Tokyo, and dayStart follows the
 * earliest event, so the two renders start their grids nine hours apart. */
test('an explicit timeZone still decides the wall clock', () => {
  const utc = renderToStaticMarkup(
    <Calendar events={EVENTS} timeZone="UTC" anchorDate="2026-07-20" view="week" />,
  );
  const tokyo = renderToStaticMarkup(
    <Calendar events={EVENTS} timeZone="Asia/Tokyo" anchorDate="2026-07-20" view="week" />,
  );
  assert.match(utc, /09:00/, 'the UTC render does not start at the event hour');
  assert.match(tokyo, /18:00/, 'the Tokyo render did not shift the event by nine hours');
  assert.doesNotMatch(tokyo, /09:00/, 'the Tokyo render still shows the UTC hour -- timeZone was ignored');
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
