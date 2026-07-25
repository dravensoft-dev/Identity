import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Table } from '../components/display/Table.jsx';

/* WHAT THIS SUITE OWNS, AND WHAT NOTHING OWNS.
 *
 * This suite renders with renderToStaticMarkup and has no DOM, by design. So it
 * owns what a static render settles: the roles, the accessible name, the
 * required-ness guard, and the tab-stop count. It asserts nothing about focus,
 * keys or the roving cursor's movement.
 *
 * NOTHING ELSE DOES EITHER. `Table` binds the `grid` pattern, and a component
 * whose binding names `grid` is DOM-tested BY HAND under Arena's standing rule --
 * `frameworks/react/test-dom/grid-keyboard.test.jsx` alone peaked at 164 MiB while
 * the other six suites together peaked at 109, so the directory was restored
 * without it. `Table` therefore has no render suite, cannot appear in
 * `COVERED` in `scripts/check-compliance.mjs`, and its binding claims seven of the
 * eight `grid` requirements with only a person behind the claim. The checklist that
 * person follows is in `Table.prompt.md`, under "Verifying the grid by hand".
 *
 * THE NARROW LAYOUT IS UNREACHABLE FROM ANY SUITE IN THIS REPO, so the surviving
 * `focus.roving` exception is checked by reading the source and by that checklist,
 * never by an assertion here. `Table` chooses its layout from a measured CONTAINER
 * width: `useContainerWidth()` starts at `null` and only writes from a
 * `ResizeObserver` inside `useEffect`, which `renderToStaticMarkup` never runs --
 * and happy-dom's `ResizeObserver` is an empty stub, so a DOM suite would measure
 * `null` too. Only a real browser reaches card mode.
 *
 * `responsive={false}` is passed everywhere below. A bare static mount is already
 * the wide branch for the reason above, but pinning it keeps these assertions about
 * the API rather than about what an unmeasured container happens to do -- the same
 * reason calendar.test.jsx pins `view="week"`. */

const COLUMNS = [
  { key: 'build', header: 'Build', mono: true },
  { key: 'project', header: 'Project' },
];
const ROWS = [
  { build: '#4821', project: 'Client Portal' },
  { build: '#4820', project: 'Payment Gateway' },
];
const LABEL = 'Recent deployments';

const render = (extra) => renderToStaticMarkup(
  <Table columns={COLUMNS} rows={ROWS} label={LABEL} responsive={false} {...extra} />,
);

/* A TAB STOP IS NOT THE SAME THING AS tabindex="0", and conflating the two cost
 * two Critical defects in Calendar. A native control is focusable with NO
 * tabindex at all, so counting the attribute alone would report a table with a
 * consumer's <button> in a cell as one stop -- and removing a tabindex would make
 * that count MORE correct while making the control unreachable. This counts both:
 * the explicit stops, plus every native control that is not silenced with
 * tabindex="-1". */
const NATIVE = /<(button|a|input|select|textarea)\b[^>]*>/g;
function tabStops(html) {
  const explicit = (html.match(/tabindex="0"/g) || []).length;
  let native = 0;
  for (const m of html.matchAll(NATIVE)) {
    const tag = m[0];
    if (/tabindex="/.test(tag)) continue; // explicit, and already counted or silenced
    if (tag.startsWith('<a') && !/\shref=/.test(tag)) continue; // an anchor without href is not focusable
    native += 1;
  }
  return explicit + native;
}

/* A grid is ONE tab stop, and that count needs no DOM: the cursor initialises to
 * the first cell of the header row, so a static render carries exactly one
 * tabindex="0". It is a property of the markup, not of behaviour.
 *
 * This is the assertion recovered from the deleted grid-keyboard suite, and for
 * Table as for Calendar it is the ONLY automatic guard behind a binding that
 * claims the grid pattern. A control leaking into the Tab sequence falsifies
 * `focus.roving` silently, and this is what would notice. */
test('a Table renders exactly one tab stop', () => {
  assert.equal(tabStops(render()), 1, 'a Table is not one tab stop');
});

test('the wide layout is a role="grid" carrying a non-empty name', () => {
  const html = render();
  assert.match(html, /role="grid"/, 'no role="grid" on the wide layout');
  const name = html.match(/aria-label="([^"]*)"/);
  assert.ok(name, 'the grid has no aria-label');
  assert.ok(name[1].length > 0, 'the grid aria-label is empty');
  assert.equal(name[1], LABEL, 'the grid name is not the `label` member');
});

test('every row, header cell and data cell carries its grid role', () => {
  const html = render();
  const count = (re) => (html.match(re) || []).length;
  // 1 header row + 2 body rows; 2 columns.
  assert.equal(count(/<tr[^>]*role="row"/g), 3, 'not every <tr> is a row');
  assert.equal(count(/<tr\b/g), 3, 'the fixture no longer renders three rows');
  assert.equal(count(/<th[^>]*role="columnheader"/g), 2, 'not every <th> is a columnheader');
  assert.equal(count(/<th\b/g), 2, 'the fixture no longer renders two header cells');
  assert.equal(count(/<td[^>]*role="gridcell"/g), 4, 'not every <td> is a gridcell');
  assert.equal(count(/<td\b/g), 4, 'the fixture no longer renders four data cells');
});

/* `label` is required and guarded at runtime, the shape SegmentedControl uses for
 * `ariaLabel`. A constant fallback was rejected: an unnamed role="grid" is worse
 * than an unnamed progressbar, and a fallback is the "present but never checked for
 * usefulness" debt the charts already carry. */
test('Table throws when `label` is absent', () => {
  assert.throws(
    () => renderToStaticMarkup(<Table columns={COLUMNS} rows={ROWS} responsive={false} />),
    /Table: `label` is required/,
  );
});

/* THIS IS WHAT MAKES THE SURVIVING focus.roving EXCEPTION VERIFIABLE rather than
 * merely asserted in prose. A cell whose content the consumer draws -- an actions
 * column's Button, which both in-tree call sites draw today -- is a page-level tab
 * stop Arena cannot silence, the same wall CalendarEvent's open panel hit. The
 * grid is one stop; a consumer's control inside it is another, and the binding
 * says so. */
test('a consumer-drawn control in a cell IS a second tab stop', () => {
  const html = render({
    columns: [...COLUMNS, { key: 'actions', header: 'Actions', render: () => <button type="button">Open</button> }],
  });
  assert.ok(tabStops(html) > 1, 'a consumer button in a cell did not add a tab stop');
  // Assert the element itself rather than trusting the count: it is a <button>,
  // and it carries no tabindex, which is exactly why it is reachable.
  const btn = html.match(/<button[^>]*>Open<\/button>/);
  assert.ok(btn, 'the consumer control did not render');
  assert.doesNotMatch(btn[0], /tabindex=/, 'Arena silenced a control it does not own');
});
