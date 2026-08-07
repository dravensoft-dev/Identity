import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ArenaChartCard } from './ArenaChartCard.tsx';

test('ArenaChartCard renders the title and its children', () => {
  const html = renderToStaticMarkup(
    <ArenaChartCard title="Latency"><svg /></ArenaChartCard>
  );
  assert.match(html, /Latency/);
  assert.match(html, /<svg/);
});

test('ArenaChartCard renders the head row when only actions is passed', () => {
  const html = renderToStaticMarkup(
    <ArenaChartCard actions={<button>Export</button>}><svg /></ArenaChartCard>
  );
  assert.match(html, /Export/);
});
