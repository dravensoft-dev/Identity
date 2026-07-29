import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Table } from './Table.jsx';
import { TableRow } from '../table-row/TableRow.jsx';
import { TableCell } from '../table-cell/TableCell.jsx';
import { Badge } from '../badge/Badge.jsx';

/* WHAT THIS SUITE OWNS, AND WHAT NOTHING OWNS.
 *
 * This suite renders with renderToStaticMarkup and has no DOM, by design. So it
 * owns what a static render settles: the roles, the accessible name, the
 * required-ness guard, the tab-stop count, and -- since Table became a compound
 * component -- that the removed members reach nothing and that a real Arena
 * component inside a cell renders. It asserts nothing about focus, keys or the
 * roving cursor's movement.
 *
 * NOTHING ELSE DOES EITHER. `Table` binds the `grid` pattern, and a component
 * whose binding names `grid` is DOM-tested BY HAND under Arena's standing rule --
 * the deleted `grid-keyboard.test.jsx` alone peaked at 164 MiB while
 * the six other suites in the React DOM directory of the day peaked at 109
 * together, so that directory was restored
 * without it (and batch 3 later removed the directory itself, by colocating the
 * suites that had come back with the components they cover). `Table` therefore has no render suite, cannot appear in
 * `COVERED` in `scripts/check-compliance.mjs`, and its binding claims seven of the
 * eight `grid` requirements with only a person behind the claim. The checklist that
 * person follows is in `Table.prompt.md`, under "Verifying the grid by hand".
 *
 * ONE DEFECT THIS SUITE SPECIFICALLY CANNOT SEE, named so a green run is not read
 * as a working keyboard. React's onFocus is `focusin` and BUBBLES, so a control the
 * consumer drew inside a <td> fired that cell's focus handler, moved the roving
 * cursor, and the focus effect then took focus off the control and put it on the
 * cell -- every actions-column button cost TWO Tab presses instead of one. It was
 * found by driving real Chromium through CDP and is fixed with a guard on each side
 * (Table.jsx's cursor bail-out, TableCell.jsx's currentTarget test). Nothing here
 * could have caught it: renderToStaticMarkup runs no effects and dispatches no
 * focus, and `Table` may not have a render suite. The standing guard is step 2 of
 * "Verifying the grid by hand" in Table.prompt.md, and no weak assertion was
 * invented here to look covered. The compound shape makes that step MORE load-
 * bearing, not less: a control in a cell is now the expected way to build a status
 * or actions column.
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
  { header: 'Build', mono: true },
  { header: 'Project' },
];
const ROWS = [
  { build: '#4821', project: 'Client Portal' },
  { build: '#4820', project: 'Payment Gateway' },
];
const LABEL = 'Recent deployments';

/* The consumer writes the rows now, which is the whole redesign: one TableRow per
   row, one TableCell per cell, `key` from React rather than from a member. */
const body = (rows = ROWS) => rows.map((r) => (
  <TableRow key={r.build}>
    <TableCell>{r.build}</TableCell>
    <TableCell>{r.project}</TableCell>
  </TableRow>
));

const render = (extra, children = body()) => renderToStaticMarkup(
  <Table columns={COLUMNS} label={LABEL} responsive={false} {...extra}>{children}</Table>,
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
    () => renderToStaticMarkup(<Table columns={COLUMNS} responsive={false}>{body()}</Table>),
    /Table: `label` is required/,
  );
});

/* `columns` is declared required too, and until now it defaulted to `[]` and drew
 * an empty header row -- rendering with a missing value, which is exactly what
 * api/README.md's required-ness rule forbids. It guards absence only; an empty
 * array is a caller saying "no columns right now", the same reading every other
 * required-array guard in the layer takes. */
test('Table throws when `columns` is absent', () => {
  assert.throws(
    () => renderToStaticMarkup(<Table label="Recent builds" responsive={false}>{body()}</Table>),
    /Table: `columns` is required/,
  );
});

test('an empty columns array renders rather than throwing', () => {
  assert.doesNotThrow(
    () => renderToStaticMarkup(<Table columns={[]} label="Recent builds" responsive={false}>{body()}</Table>),
  );
});

/* THIS IS WHAT MAKES THE SURVIVING focus.roving EXCEPTION VERIFIABLE rather than
 * merely asserted in prose. A cell whose content the consumer draws -- an actions
 * column's Button, which both in-tree call sites draw today -- is a page-level tab
 * stop Arena cannot silence, the same wall CalendarEvent's open panel hit. The
 * grid is one stop; a consumer's control inside it is another, and the binding
 * says so. */
test('a consumer-drawn control in a cell IS a second tab stop', () => {
  const html = render({ columns: [...COLUMNS, { header: 'Actions' }] }, ROWS.map((r) => (
    <TableRow key={r.build}>
      <TableCell>{r.build}</TableCell>
      <TableCell>{r.project}</TableCell>
      <TableCell><button type="button">Open</button></TableCell>
    </TableRow>
  )));
  assert.ok(tabStops(html) > 1, 'a consumer button in a cell did not add a tab stop');
  // Assert the element itself rather than trusting the count: it is a <button>,
  // and it carries no tabindex, which is exactly why it is reachable.
  const btn = html.match(/<button[^>]*>Open<\/button>/);
  assert.ok(btn, 'the consumer control did not render');
  assert.doesNotMatch(btn[0], /tabindex=/, 'Arena silenced a control it does not own');
});

/* THE CAPABILITY THE REDESIGN EXISTS FOR. `TableColumn.render` was removed under
 * the per-item convention, and removing it alone would have deleted the badge from
 * every status cell and the button from every actions cell. A cell the CONSUMER
 * instantiates keeps both, with no new form in the API vocabulary -- so this
 * asserts the thing that was nearly lost, not merely that the loss happened. */
test('an Arena component inside a TableCell renders', () => {
  const html = render({ columns: [...COLUMNS, { header: 'Status' }] }, ROWS.map((r) => (
    <TableRow key={r.build}>
      <TableCell>{r.build}</TableCell>
      <TableCell>{r.project}</TableCell>
      <TableCell><Badge tone="success" dot>Deployed</Badge></TableCell>
    </TableRow>
  )));
  assert.match(html, /Deployed/, 'a Badge inside a TableCell did not render');
  // Inside the cell, not beside it: the badge's text is within a <td>.
  assert.match(html, /<td[^>]*role="gridcell"[^>]*>(?:(?!<\/td>).)*Deployed/s,
    'the Badge rendered outside the gridcell it was written in');
});

/* THE REMOVALS ARE PROVED, exactly as calendar.test.jsx proves `renderEvent`'s.
 * A removal nothing asserts is a removal that can come back: `check:api` reads
 * `Table.d.ts` and never opens `Table.jsx`, so a `render` call quietly restored to
 * the implementation would leave that gate green. Asserted as byte-equality
 * against the baseline render rather than as "the string NOPE is absent", because
 * equality also catches a member that reaches something OTHER than the cell. */
test('a column carrying a `render` function reaches nothing', () => {
  const baseline = render();
  const withRender = render({
    columns: COLUMNS.map((c) => ({ ...c, render: () => <b>NOPE</b> })),
  });
  assert.doesNotMatch(withRender, /NOPE/, 'TableColumn.render is being called again');
  assert.equal(withRender, baseline, 'a column-level render function changed the output');
});

test('`rows` and `getRowKey` passed as props change nothing', () => {
  const baseline = render();
  const withDead = render({ rows: ROWS, getRowKey: (r) => r.build });
  assert.equal(withDead, baseline, 'a removed member is still being honoured');
});

/* R4: `style` and the {...rest} spread never existed on TableRow/TableCell and left
 * Table with the contract. Asserted in separate tests per root -- node:assert aborts
 * on the first failure, so one combined assertion would let a component that stopped
 * spreading ...rest but still merged ...style pass. */
test('Table drops a consumer style object -- the ...style escape is gone', () => {
  const html = render({ style: { color: '#ff00ff' } });
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Table drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = render({ 'data-stray': 'x' });
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

test('TableRow drops a consumer style object -- the ...style escape is gone', () => {
  const html = render({}, [
    <TableRow key="a" style={{ color: '#ff00ff' }}><TableCell>x</TableCell></TableRow>,
  ]);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered <tr> -- the R4 escape is back');
});

test('TableRow drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = render({}, [
    <TableRow key="a" data-stray="x"><TableCell>x</TableCell></TableRow>,
  ]);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered <tr> -- the {...rest} escape is back');
});

test('TableCell drops a consumer style object -- the ...style escape is gone', () => {
  const html = render({}, [
    <TableRow key="a"><TableCell style={{ color: '#ff00ff' }}>x</TableCell></TableRow>,
  ]);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered <td> -- the R4 escape is back');
});

test('TableCell drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = render({}, [
    <TableRow key="a"><TableCell data-stray="x">x</TableCell></TableRow>,
  ]);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered <td> -- the {...rest} escape is back');
});
