/* `minPointSpacing` is the member that lets a chart refuse to compress. The width it computes is
 * pure arithmetic and is asserted directly; what a suite cannot see is the scroll position, since
 * this render has no layout, so scrollWidth is zero and the anchor-to-the-right effect has
 * nothing to measure. That half is on the by-hand list in the prompt. */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { plotWidth, PAD } from '../../DataVisuals.ts';
import { ArenaLineChart } from './arena-line-chart/ArenaLineChart.tsx';

test('with no minPointSpacing the plot is exactly the width it was given', () => {
  assert.equal(plotWidth(390, 30, undefined), 390);
  assert.equal(plotWidth(390, 30, 0), 390, 'and zero is not a spacing, it is an absence');
});

test('above the floor the plot still fits, because the rule is a MINIMUM and not a step', () => {
  assert.equal(plotWidth(1200, 5, 35), 1200);
});

test('below the floor the plot outgrows its box by exactly what the gaps need', () => {
  assert.equal(plotWidth(390, 30, 35), PAD.l + PAD.r + 35 * 29);
});

test('one point cannot be too close to anything, so nothing overflows', () => {
  assert.equal(plotWidth(390, 1, 35), 390);
  assert.equal(plotWidth(390, 0, 35), 390);
});

const labels = Array.from({ length: 30 }, (_, i) => `d${i}`);
const values = Array.from({ length: 30 }, (_, i) => i + 1);

const rail = (minPointSpacing?: number) => renderToStaticMarkup(
  <ArenaLineChart labels={labels} values={values} seriesLabel="Revenue" minPointSpacing={minPointSpacing} />,
);

test('a rail that does not overflow is not a scroll region, and takes no tab stop', () => {
  const html = rail(undefined);
  assert.doesNotMatch(html, /tabindex="0"/,
    'a dead tab stop on every chart that fits is worse than the gap it would close');
  assert.doesNotMatch(html, /role="group"/);
});

test('a rail that overflows is reachable and named, because an unfocusable scroll box is a trap', () => {
  const html = rail(35);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /role="group"/);
  assert.match(html, /aria-label="Revenue[^"]*"/,
    'the region takes the chart\'s own name, so it is not announced as an unnamed group');
});
