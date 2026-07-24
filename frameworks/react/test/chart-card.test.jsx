import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ChartCard } from '../components/charts/ChartCard.jsx';

test('ChartCard renders the title and its children', () => {
  const html = renderToStaticMarkup(
    <ChartCard title="Latency"><svg /></ChartCard>
  );
  assert.match(html, /Latency/);
  assert.match(html, /<svg/);
});

test('ChartCard renders the head row when only actions is passed', () => {
  const html = renderToStaticMarkup(
    <ChartCard actions={<button>Export</button>}><svg /></ChartCard>
  );
  assert.match(html, /Export/);
});
