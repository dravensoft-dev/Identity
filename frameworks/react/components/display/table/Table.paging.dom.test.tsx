/* Table does not slice. It does not hold the rows, so `page.total` is what tells it how many
 * pages there are; the projected children are one page and nothing about the whole list can be
 * derived from them. The out-of-range reset is the one thing Table emits on its own, and it is
 * bounded on purpose: only when the page has actually gone past the end, so a filter that
 * leaves it valid stays silent and no consumer gets a loop. */

import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup } from '../../../test/Harness.tsx';
import { Table } from './Table.tsx';
import { TableRow } from '../table-row/TableRow.tsx';
import { TableCell } from '../table-cell/TableCell.tsx';
import type { ArenaTableColumn } from '../../../Api.generated';

afterEach(cleanup);

const LABEL = 'Recent deployments';
const COLUMNS: ArenaTableColumn[] = [{ header: 'Service' }, { header: 'Status' }];

const rows = (n: number) => Array.from({ length: n }, (_, i) => (
  <TableRow key={i}><TableCell>svc-{i}</TableCell><TableCell>Healthy</TableCell></TableRow>
));

test('with no `page` no pager is drawn, which is every table that fits', () => {
  const root = mount(<Table label={LABEL} columns={COLUMNS} responsive={false}>{rows(2)}</Table>);
  assert.equal(root.querySelector('nav'), null);
});

test('a pager is drawn, and it is named from the table rather than from a constant', () => {
  const root = mount(
    <Table label={LABEL} columns={COLUMNS} responsive={false} page={{ index: 1, size: 20, total: 96 }}>
      {rows(2)}
    </Table>,
  );
  const nav = root.querySelector('nav');
  assert.ok(nav, 'a table with a page must draw its own Pagination');
  assert.equal(nav.getAttribute('aria-label'), LABEL,
    'two paged tables on one dashboard must be tellable apart, which a shared constant name '
    + 'satisfies mechanically and never actually does');
});

test('the page count is derived from the total, not from the rows on screen', () => {
  const root = mount(
    <Table label={LABEL} columns={COLUMNS} responsive={false} page={{ index: 1, size: 20, total: 96 }}>
      {rows(2)}
    </Table>,
  );
  const labels = [...root.querySelectorAll('nav button')].map((b) => b.textContent);
  assert.ok(labels.includes('5'), `96 rows at 20 a page is 5 pages; got ${labels.join(', ')}`);
});

test('a page past the end asks for page 1, which is the reset written by hand beside every filter', () => {
  const asked: number[] = [];
  mount(
    <Table label={LABEL} columns={COLUMNS} responsive={false}
      page={{ index: 7, size: 20, total: 30 }} onPageChange={(next) => asked.push(next)}>
      {rows(2)}
    </Table>,
  );
  assert.deepEqual(asked, [1], '30 rows at 20 a page is 2 pages, so page 7 does not exist');
});

test('a page still in range asks for nothing, so a filter that leaves it valid is silent', () => {
  const asked: number[] = [];
  mount(
    <Table label={LABEL} columns={COLUMNS} responsive={false}
      page={{ index: 2, size: 20, total: 96 }} onPageChange={(next) => asked.push(next)}>
      {rows(2)}
    </Table>,
  );
  assert.deepEqual(asked, []);
});

test('an empty table draws no pager, because there is no grid for it to sit under', () => {
  const root = mount(
    <Table label={LABEL} columns={COLUMNS} responsive={false} page={{ index: 1, size: 20, total: 0 }} />,
  );
  assert.equal(root.querySelector('nav'), null);
  assert.equal(root.querySelector('[role="grid"]'), null);
});
