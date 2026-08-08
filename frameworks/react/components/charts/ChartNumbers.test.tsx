/* One number, written three times by every chart: the axis tick, the tooltip and the accessible
 * table. They have to agree, because the table is what a screen-reader user is given INSTEAD of
 * the picture, and a chart whose alternative reads differently from its own axis is worse than
 * one with no alternative at all. es-BO is the case that made the members necessary: a currency
 * that precedes its amount, a comma for the decimal and a stop for the thousands. */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArenaLineChart } from './arena-line-chart/ArenaLineChart.tsx';
import { ArenaBarChart } from './arena-bar-chart/ArenaBarChart.tsx';
import { ArenaDoughnutChart } from './arena-doughnut-chart/ArenaDoughnutChart.tsx';

const FORMAT = { locale: 'es-BO', fractionDigits: 2 } as const;
const WRITTEN = 'Bs. 1.234,50';

const occurrences = (html: string, needle: string) => html.split(needle).length - 1;

test('ArenaLineChart writes the same number in the tick, the tooltip source and the table', () => {
  const html = renderToStaticMarkup(
    <ArenaLineChart labels={['Mon']} series={[{ label: 'Revenue', values: [1234.5] }]} label="Revenue"
 valuePrefix="Bs. " valueFormat={FORMAT} />,
  );
  assert.ok(occurrences(html, WRITTEN) >= 1, `expected ${WRITTEN} in the render, got:\n${html}`);
  assert.doesNotMatch(html, /1234\.5/, 'the raw JavaScript number must not survive anywhere');
});

test('ArenaBarChart writes it the same way, in its ticks and in its accessible table', () => {
  const html = renderToStaticMarkup(
    <ArenaBarChart labels={['Mon']} series={[{ label: 'Revenue', values: [1234.5] }]} label="Revenue"
 valuePrefix="Bs. " valueFormat={FORMAT} />,
  );
  assert.ok(occurrences(html, WRITTEN) >= 1, `expected ${WRITTEN} in the render, got:\n${html}`);
  assert.doesNotMatch(html, /1234\.5/, 'the raw JavaScript number must not survive anywhere');
});

test('ArenaDoughnutChart writes it the same way, in its legend and in its accessible table', () => {
  const html = renderToStaticMarkup(
    <ArenaDoughnutChart labels={['Mon']} series={[{ label: 'Revenue', values: [1234.5] }]} label="Revenue"
 valuePrefix="Bs. " valueFormat={FORMAT} />,
  );
  assert.equal(occurrences(html, WRITTEN), 2, 'once in the legend and once in the table');
  assert.doesNotMatch(html, /1234\.5/, 'the raw JavaScript number must not survive anywhere');
});

test('the prefix goes before the number and the suffix after it, in that order', () => {
  const html = renderToStaticMarkup(
    <ArenaDoughnutChart labels={['Mon']} series={[{ label: 'Revenue', values: [1234.5] }]} label="Revenue"
 valuePrefix="Bs. " valueSuffix=" net" valueFormat={FORMAT} />,
  );
  assert.ok(occurrences(html, 'Bs. 1.234,50 net') >= 1, `got:\n${html}`);
});

test('with no valueFormat a chart writes the raw number, which is what it always did', () => {
  const html = renderToStaticMarkup(
    <ArenaBarChart labels={['Mon']} series={[{ label: 'Revenue', values: [1234.5] }]} label="Revenue" valueSuffix=" Bs." />,
  );
  assert.match(html, /1234\.5 Bs\./);
});

test('grouping is off on request, for digits that are not a quantity', () => {
  const html = renderToStaticMarkup(
    <ArenaBarChart labels={['Mon']} series={[{ label: 'Year', values: [2026] }]} label="Year"
 valueFormat={{ locale: 'es-BO', grouping: false }} />,
  );
  assert.match(html, /2026/);
  assert.doesNotMatch(html, /2\.026/, 'a year is not a quantity and takes no thousands separator');
});
