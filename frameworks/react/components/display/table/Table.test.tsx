import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Table } from './Table.tsx';
import { TableRow } from '../table-row/TableRow.tsx';
import { TableCell } from '../table-cell/TableCell.tsx';
import { Badge } from '../badge/Badge.tsx';

const COLUMNS = [
  { header: 'Build', mono: true },
  { header: 'Project' },
];
const ROWS = [
  { build: '#4821', project: 'Client Portal' },
  { build: '#4820', project: 'Payment Gateway' },
];
const LABEL = 'Recent deployments';

const body = (rows = ROWS) => rows.map((r) => (
  <TableRow key={r.build}>
    <TableCell>{r.build}</TableCell>
    <TableCell>{r.project}</TableCell>
  </TableRow>
));

const render = (extra: Record<string, unknown> = {}, children = body()) => renderToStaticMarkup(
  <Table columns={COLUMNS} label={LABEL} responsive={false} {...extra}>{children}</Table>,
);

const NATIVE = /<(button|a|input|select|textarea)\b[^>]*>/g;
function tabStops(html: string) {
  const explicit = (html.match(/tabindex="0"/g) || []).length;
  let native = 0;
  for (const m of html.matchAll(NATIVE)) {
    const tag = m[0];
    if (/tabindex="/.test(tag)) continue;
    if (tag.startsWith('<a') && !/\shref=/.test(tag)) continue;
    native += 1;
  }
  return explicit + native;
}

test('a Table renders exactly one tab stop', () => {
  assert.equal(tabStops(render()), 1, 'a Table is not one tab stop');
});

test('the wide layout is a role="grid" carrying a non-empty name', () => {
  const html = render();
  assert.match(html, /role="grid"/, 'no role="grid" on the wide layout');
  const name = html.match(/aria-label="([^"]*)"/);
  assert.ok(name, 'the grid has no aria-label');
  assert.ok(name[1]!.length > 0, 'the grid aria-label is empty');
  assert.equal(name[1], LABEL, 'the grid name is not the `label` member');
});

test('every row, header cell and data cell carries its grid role', () => {
  const html = render();
  const count = (re: RegExp) => (html.match(re) || []).length;

  assert.equal(count(/<tr[^>]*role="row"/g), 3, 'not every <tr> is a row');
  assert.equal(count(/<tr\b/g), 3, 'the fixture no longer renders three rows');
  assert.equal(count(/<th[^>]*role="columnheader"/g), 2, 'not every <th> is a columnheader');
  assert.equal(count(/<th\b/g), 2, 'the fixture no longer renders two header cells');
  assert.equal(count(/<td[^>]*role="gridcell"/g), 4, 'not every <td> is a gridcell');
  assert.equal(count(/<td\b/g), 4, 'the fixture no longer renders four data cells');
});

test('Table throws when `label` is absent', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<Table columns={COLUMNS} responsive={false}>{body()}</Table>),
    /Table: `label` is required/,
  );
});

test('Table throws when `columns` is absent', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<Table label="Recent builds" responsive={false}>{body()}</Table>),
    /Table: `columns` is required/,
  );
});

test('an empty columns array renders rather than throwing', () => {
  assert.doesNotThrow(
    () => renderToStaticMarkup(<Table columns={[]} label="Recent builds" responsive={false}>{body()}</Table>),
  );
});

test('a consumer-drawn control in a cell IS a second tab stop', () => {
  const html = render({ columns: [...COLUMNS, { header: 'Actions' }] }, ROWS.map((r) => (
    <TableRow key={r.build}>
      <TableCell>{r.build}</TableCell>
      <TableCell>{r.project}</TableCell>
      <TableCell><button type="button">Open</button></TableCell>
    </TableRow>
  )));
  assert.ok(tabStops(html) > 1, 'a consumer button in a cell did not add a tab stop');

  const btn = html.match(/<button[^>]*>Open<\/button>/);
  assert.ok(btn, 'the consumer control did not render');
  assert.doesNotMatch(btn[0], /tabindex=/, 'Arena silenced a control it does not own');
});

test('an Arena component inside a TableCell renders', () => {
  const html = render({ columns: [...COLUMNS, { header: 'Status' }] }, ROWS.map((r) => (
    <TableRow key={r.build}>
      <TableCell>{r.build}</TableCell>
      <TableCell>{r.project}</TableCell>
      <TableCell><Badge tone="success" dot>Deployed</Badge></TableCell>
    </TableRow>
  )));
  assert.match(html, /Deployed/, 'a Badge inside a TableCell did not render');

  assert.match(html, /<td[^>]*role="gridcell"[^>]*>(?:(?!<\/td>).)*Deployed/s,
    'the Badge rendered outside the gridcell it was written in');
});

test('a column carrying a `render` function reaches nothing', () => {
  const baseline = render();
  const withRender = render({
    columns: COLUMNS.map((c) => ({ ...c, render: () => <b>NOPE</b> })),
  });
  assert.doesNotMatch(withRender, /NOPE/, 'ArenaTableColumn.render is being called again');
  assert.equal(withRender, baseline, 'a column-level render function changed the output');
});

test('`rows` and `getRowKey` passed as props change nothing', () => {
  const baseline = render();
  const withDead = render({ rows: ROWS, getRowKey: (r: { build: string }) => r.build });
  assert.equal(withDead, baseline, 'a removed member is still being honoured');
});

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
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
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
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
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
