import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Calendar } from '../components/display/Calendar.jsx';
import { CalendarEvent } from '../components/display/CalendarEvent.jsx';

/* WHAT THIS DIRECTORY CAN SHOW, AND WHAT NOW GOES UNSHOWN.
 *
 * This suite renders with renderToStaticMarkup and has no DOM, by design. So it
 * owns what a static render settles: the chip body, the required-ness guards on
 * both components, and the R4 escapes on both roots. It asserts nothing about
 * focus, keys or the roving tab stop.
 *
 * NOTHING ELSE DOES EITHER, AND THAT IS THE SHARPEST GAP THIS REPO CARRIES.
 * `frameworks/react/test-dom/grid-keyboard.test.jsx` owned the roving tab stop, the
 * four-edge clamp, Home/End and Enter/Escape into an event chip. That directory was
 * deleted for its RAM cost and restored; this one suite was not, and stays out under
 * a standing rule -- a component whose behaviour binding names the `grid` pattern is
 * DOM-tested by hand, because this suite alone cost more RAM than the other six
 * combined. Calendar.behaviour.json retired all
 * eight of its `grid` exceptions when the navigation shipped, so the binding now
 * claims FULL compliance with the pattern and no test anywhere checks the claim.
 * Keyboard navigation is verified by hand: serve the tree with `bun run demos`, open
 * calendar.card.html and drive the grid from the keyboard. See CLAUDE.md's Known debt.
 *
 * `view="week"` is passed everywhere below. Without a DOM the container measures
 * null, which is already the wide branch, but pinning it keeps these assertions
 * about the API rather than about what an unmeasured container happens to do. */

const EVENTS = [
  { id: 'a', title: 'Standup', start: '2026-07-20T09:00:00Z', end: '2026-07-20T09:30:00Z', colorId: 1 },
  { id: 'b', title: 'Review', start: '2026-07-21T14:00:00Z', end: '2026-07-21T15:00:00Z', colorId: 2 },
];

/* The events are the CONTENT slot now: one <CalendarEvent> per event, whose
 * props are what Calendar reads. `eventExtra` goes on every chip, `calendarExtra`
 * on the Calendar itself -- the two are separate because the R4 tests below
 * assert about the CALENDAR's root and must not be able to reach it through a
 * chip by accident. */
const chips = (eventExtra) => EVENTS.map((e) => <CalendarEvent key={e.id} {...e} {...eventExtra} />);
const render = (calendarExtra, eventExtra) => renderToStaticMarkup(
  <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week" {...calendarExtra}>{chips(eventExtra)}</Calendar>,
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

/* The throw is GONE, and its absence is the assertion. `events` was a required
 * array member and failed hard when omitted, which was right while omitting it
 * meant a caller had forgotten their data. As the content slot it means
 * something else entirely: a week with nothing booked in it. There is no member
 * left to be missing, so an empty Calendar renders an empty grid -- with its
 * hours, its day columns and its cells all present, which is what makes it an
 * empty SCHEDULE rather than an empty box. */
test('a Calendar with no children renders an empty schedule rather than throwing', () => {
  const html = renderToStaticMarkup(<Calendar timeZone="UTC" anchorDate="2026-07-20" view="week" />);
  assert.match(html, /role="grid"/, 'an eventless Calendar drew no grid at all');
  assert.match(html, /role="gridcell"/, 'an eventless Calendar drew no hour cells');
  assert.doesNotMatch(html, /Standup/, 'the fixture leaked an event into a Calendar with no children');
});

/* Required-ness governs runtime, and it moved down a layer with the members:
 * CalendarEvent owns id/title/start/end now, and each is required. Asserted
 * against the WHOLE quartet in one test rather than four, because they are one
 * guard idiom; the message names which one, so a failure still says. */
test('a CalendarEvent missing a required member throws', () => {
  const full = { id: 'a', title: 'Standup', start: '2026-07-20T09:00:00Z', end: '2026-07-20T09:30:00Z' };
  for (const missing of ['id', 'title', 'start', 'end']) {
    const props = { ...full, [missing]: undefined };
    assert.throws(
      () => renderToStaticMarkup(<CalendarEvent {...props} />),
      new RegExp(`CalendarEvent: \\\`${missing}\\\` is required`),
      `a CalendarEvent with no ${missing} rendered instead of failing hard`,
    );
  }
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
      <Calendar anchorDate="2026-07-20" view="week">{chips()}</Calendar>,
    );
    const explicit = renderToStaticMarkup(
      <Calendar timeZone="Asia/Tokyo" anchorDate="2026-07-20" view="week">{chips()}</Calendar>,
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
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">{chips()}</Calendar>,
  );
  const tokyo = renderToStaticMarkup(
    <Calendar timeZone="Asia/Tokyo" anchorDate="2026-07-20" view="week">{chips()}</Calendar>,
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

/* CalendarEvent is a NEW root a consumer writes directly, so it is a new place
 * for both escapes to appear. It has never carried either; these two exist so
 * that stays true, since check:api reads the .d.ts and a spread restored to the
 * .jsx alone would leave the gate green. The chips are the escape's carrier
 * here, not the Calendar, so `render`'s second argument is what they use. */
test('CalendarEvent drops a consumer style object -- no ...style escape on the chip', () => {
  const html = render({}, { style: { color: '#ff00ff' } });
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the chip -- an R4 escape opened');
});

test('CalendarEvent drops a consumer attribute -- no {...rest} spread on the chip', () => {
  const html = render({}, { 'data-stray': 'x' });
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the chip -- a {...rest} escape opened');
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
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="c" title="Stale" start="2026-07-20T09:00:00Z" end="2026-07-20T10:00:00Z" slot={2} />
    </Calendar>,
  );
  assert.ok(!stale.includes(two), 'the old `slot` field still picks a ramp colour -- the rename did not land');
});

/* A grid is ONE tab stop. This assertion opened the deleted grid-keyboard suite
 * and it needs no DOM: the cursor initialises to {day: 0, hour: 0}, so a static
 * render carries exactly one cell with tabindex="0". It is a property of the
 * markup, not of behaviour.
 *
 * It matters more than it looks. Calendar's binding claims "exceptions": []
 * with no render suite behind it, by the grid rule, and a control that leaked
 * into the Tab sequence would falsify that claim silently. This is the guard. */
test('a Calendar renders exactly one tab stop, kebab or no kebab', () => {
  const plain = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z" />
    </Calendar>,
  );
  assert.equal((plain.match(/tabindex="0"/g) || []).length, 1, 'a Calendar is not one tab stop');

  const withKebab = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
        actionsEnabled actions={<button type="button">Delete</button>} />
    </Calendar>,
  );
  assert.equal((withKebab.match(/tabindex="0"/g) || []).length, 1,
    'the kebab added a second tab stop inside the grid -- focus.roving is now false');
});

test('the kebab renders only when actionsEnabled, and never as a tab stop', () => {
  const off = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z" />
    </Calendar>,
  );
  assert.doesNotMatch(off, /ph-dots-three/, 'a chip that did not ask for actions drew a kebab');

  const on = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
        actionsEnabled actions={<button type="button">Delete</button>} />
    </Calendar>,
  );
  assert.match(on, /ph-dots-three/, 'actionsEnabled drew no kebab');
  assert.match(on, /aria-label="Actions"[^>]*tabindex="-1"|tabindex="-1"[^>]*aria-label="Actions"/,
    'the kebab is not out of the Tab sequence');
});

/* The slot is closed by default, so the consumer's markup is not in the tree at
 * all. That is what keeps their buttons -- which Arena cannot reach to silence,
 * because it is their markup -- from being permanent tab stops in the grid. */
test('the action panel content is absent while the panel is closed', () => {
  const html = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
        actionsEnabled actions={<button type="button">Delete</button>} />
    </Calendar>,
  );
  assert.doesNotMatch(html, /Delete/, 'the panel rendered its content while closed');
});

/* Nested <button> is invalid HTML and browsers restructure it silently, which
 * is the kind of defect that only shows up as "the click handler stopped
 * firing" months later. */
test('a chip carrying a kebab is not a button inside a button', () => {
  const html = renderToStaticMarkup(
    <Calendar timeZone="UTC" anchorDate="2026-07-20" view="week">
      <CalendarEvent id="a" title="Standup" start="2026-07-20T09:00:00Z" end="2026-07-20T09:30:00Z"
        onClick={() => {}} actionsEnabled actions={<button type="button">Delete</button>} />
    </Calendar>,
  );
  assert.doesNotMatch(html, /<button[^>]*>(?:(?!<\/button>)[\s\S])*<button/,
    'a kebab was nested inside the chip button -- invalid HTML');
});
