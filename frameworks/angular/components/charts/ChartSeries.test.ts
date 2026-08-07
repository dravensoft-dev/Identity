import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaChartTable } from './ChartSeries';

const write = (value: number) => `${value} ms`;

test('the table names the category column and then the series, in that order', () => {
  const table = arenaChartTable('Category', 'Revenue', ['Jan', 'Feb'], [1, 2], write);
  assert.deepEqual(table.columns, ['Category', 'Revenue']);
});

test('one row per value, its label as the row header and the written number beside it', () => {
  const table = arenaChartTable('Point', 'Latency', ['Jan', 'Feb'], [12, 47], write);
  assert.deepEqual(table.rows, [
    { header: 'Jan', cells: ['12 ms'] },
    { header: 'Feb', cells: ['47 ms'] },
  ]);
});

test('the table writes its numbers through the same writer the chart draws with', () => {

  const table = arenaChartTable('Category', 'Share', ['a'], [1234.5], (value) => `$${value.toFixed(2)}`);
  assert.equal(table.rows[0]?.cells[0], '$1234.50');
});

test('a value with no label at its index still gets a row, headed by an empty cell', () => {

  const table = arenaChartTable('Category', 'Share', ['only'], [1, 2], write);
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[1]?.header, '');
});

test('a label with no value at its index is dropped, because the rows follow the data', () => {
  const table = arenaChartTable('Category', 'Share', ['a', 'b', 'c'], [1], write);
  assert.deepEqual(table.rows.map((row) => row.header), ['a']);
});

test('no values produce a header row and nothing under it, rather than no table', () => {
  const table = arenaChartTable('Category', 'Share', [], [], write);
  assert.deepEqual(table.columns, ['Category', 'Share']);
  assert.deepEqual(table.rows, []);
});

test('every row carries one cell per series column, so the widths agree', () => {
  const table = arenaChartTable('Category', 'Share', ['a', 'b'], [1, 2], write);
  for (const row of table.rows)
    assert.equal(row.cells.length + 1, table.columns.length, 'a row must fill every column it declares');
});
