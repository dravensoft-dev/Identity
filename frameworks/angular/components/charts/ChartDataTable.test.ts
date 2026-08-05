/* The three charts answer figure-with-data-table the same way, so the shared
 * body is `assertFigure` and each test only supplies its own fixture: a loop over
 * the component classes does not typecheck, since TestBed.createComponent cannot
 * unify two unrelated component types. */
import { useTestEnvironment } from '../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { ArenaBarChart } from './arena-bar-chart/ArenaBarChart';
import { ArenaDoughnutChart } from './arena-doughnut-chart/ArenaDoughnutChart';
import { ArenaLineChart } from './arena-line-chart/ArenaLineChart';
import { assertPattern, ANGULAR_COMPONENTS } from '../../test/Compliance';
const BINDING = join(ANGULAR_COMPONENTS, 'charts/arena-bar-chart/ArenaBarChart.behaviour.json');

const LABELS = ['Alpha', 'Beta', 'Gamma'];
const VALUES = [12, 30, 7];
const SERIES = 'Deliveries';

function renderBarChart() {
  const fixture = TestBed.createComponent(ArenaBarChart);
  fixture.componentRef.setInput('labels', LABELS);
  fixture.componentRef.setInput('values', VALUES);
  fixture.componentRef.setInput('seriesLabel', SERIES);
  fixture.detectChanges();
  return fixture;
}

test('arena-bar-chart renders a real <table> carrying every plotted number', () => {
  const fixture = renderBarChart();
  try {
    const host = fixture.nativeElement as Element;

    const table = host.querySelector('table');
    assert.notEqual(table, null, 'a chart with no data table is a picture nobody can read');

    const rows = [...table!.querySelectorAll('tbody tr')];
    assert.equal(rows.length, VALUES.length, 'one row per bar, so the table and the picture cannot disagree');

    const pairs = rows.map((row) => [...row.querySelectorAll('th, td')].map((c) => (c.textContent ?? '').trim()));
    assert.deepEqual(pairs, LABELS.map((label, i) => [label, String(VALUES[i])]));

    assert.equal((table!.querySelector('caption')?.textContent ?? '').trim(), `${SERIES} — bar chart`);
    const headers = [...table!.querySelectorAll('thead th')].map((c) => (c.textContent ?? '').trim());
    assert.deepEqual(headers, ['Category', SERIES]);
  } finally {
    fixture.destroy();
  }
});

test('arena-bar-chart hides its data table visually without removing it from the accessibility tree', () => {
  const fixture = renderBarChart();
  try {
    const table = (fixture.nativeElement as Element).querySelector('table') as HTMLTableElement;

    assert.equal(table.hasAttribute('hidden'), false, 'a hidden table is not an alternative -- it is no table at all');
    assert.equal(table.getAttribute('aria-hidden'), null, 'the table must stay in the accessibility tree');
    assert.notEqual(table.style.display, 'none', 'display:none would remove it from the accessibility tree');

    assert.equal(table.style.position, 'absolute');
    assert.equal(table.style.width, '1px');
    assert.equal(table.style.height, '1px');
    assert.equal(table.style.overflow, 'hidden');
  } finally {
    fixture.destroy();
  }
});

test('arena-bar-chart matches its figure-with-data-table binding, which excepts nothing', () => {
  const fixture = renderBarChart();
  try {
    const host = fixture.nativeElement as Element;
    assertPattern({
      root: host,
      bindingPath: BINDING,
      subjects: { default: host.querySelector('[role="img"]') },
      behavioural: { 'alternative.table': true },
    });
  } finally {
    fixture.destroy();
  }
});

test('arena-bar-chart REFUSES to render without a seriesLabel, where it used to name itself by type', () => {
  const fixture = TestBed.createComponent(ArenaBarChart);
  fixture.componentRef.setInput('labels', LABELS);
  fixture.componentRef.setInput('values', VALUES);
  try {
    assert.throws(
      () => fixture.detectChanges(),
      /NG0950/,
      'a name that is only the chart TYPE satisfies roles.label mechanically and tells a reader nothing; '
      + 'seriesLabel is input.required now, so Angular refuses the render rather than inventing one',
    );
  } finally {
    fixture.destroy();
  }
});
test('arena-bar-chart appends valueSuffix to the axis arenaTicks and to the accessible table alike', () => {
  const fixture = TestBed.createComponent(ArenaBarChart);
  fixture.componentRef.setInput('labels', LABELS);
  fixture.componentRef.setInput('values', VALUES);
  fixture.componentRef.setInput('seriesLabel', SERIES);
  fixture.componentRef.setInput('valueSuffix', ' ms');
  fixture.detectChanges();
  try {
    const host = fixture.nativeElement as Element;

    const svgText = [...host.querySelectorAll('svg text')].map((t) => (t.textContent ?? '').trim());
    assert.ok(svgText.includes('12.5 ms'), `the axis tick lost the suffix: ${JSON.stringify(svgText)}`);
    assert.ok(svgText.includes('37.5 ms'), `the axis tick lost the suffix: ${JSON.stringify(svgText)}`);

    const table = host.querySelector('table') as HTMLTableElement;
    const pairs = [...table.querySelectorAll('tbody tr')]
      .map((row) => [...row.querySelectorAll('th, td')].map((c) => (c.textContent ?? '').trim()));
    assert.deepEqual(pairs, LABELS.map((label, i) => [label, `${VALUES[i]} ms`]));
  } finally {
    fixture.destroy();
  }
});

test('arena-doughnut-chart takes its accessible name, caption and value column from seriesLabel', () => {
  const fixture = TestBed.createComponent(ArenaDoughnutChart);
  fixture.componentRef.setInput('labels', LABELS);
  fixture.componentRef.setInput('values', VALUES);
  fixture.componentRef.setInput('seriesLabel', SERIES);
  fixture.detectChanges();
  try {
    const host = fixture.nativeElement as Element;

    const graphic = host.querySelector('[role="img"]') as Element;
    assert.equal(graphic.getAttribute('aria-label'), `${SERIES} — doughnut chart`);

    const table = host.querySelector('table') as HTMLTableElement;
    assert.equal((table.querySelector('caption')?.textContent ?? '').trim(), `${SERIES} — doughnut chart`);

    const headers = [...table.querySelectorAll('thead th')].map((c) => (c.textContent ?? '').trim());
    assert.deepEqual(headers, ['Category', SERIES]);
  } finally {
    fixture.destroy();
  }
});

function assertFigure(host: Element, tail: string): void {
  const graphic = host.querySelector('[role="img"]') as Element;
  assert.match(graphic.getAttribute('aria-label') ?? '', /\S/, 'the graphic must carry a name');

  const table = host.querySelector('table') as HTMLTableElement;
  assert.notEqual(table, null, 'a chart with no data table is a picture nobody can read');
  const pairs = [...table.querySelectorAll('tbody tr')]
    .map((row) => [...row.querySelectorAll('th, td')].map((c) => (c.textContent ?? '').trim()));
  assert.deepEqual(pairs, LABELS.map((label, i) => [label, String(VALUES[i])]),
    'the table and the picture must not be able to disagree');
  assert.equal(table.getAttribute('aria-hidden'), null, 'the table must stay in the accessibility tree');
  assert.equal(table.style.position, 'absolute', 'it is hidden by being taken out of flow, not by being removed');

  assertPattern({
    root: host,
    bindingPath: join(ANGULAR_COMPONENTS, tail),
    subjects: { default: graphic },
    behavioural: { 'alternative.table': true },
  });
}

test('arena-doughnut-chart matches its figure-with-data-table binding, which excepts nothing', () => {
  const fixture = TestBed.createComponent(ArenaDoughnutChart);
  fixture.componentRef.setInput('labels', LABELS);
  fixture.componentRef.setInput('values', VALUES);
  fixture.componentRef.setInput('seriesLabel', SERIES);
  fixture.detectChanges();
  try {
    assertFigure(fixture.nativeElement as Element, 'charts/arena-doughnut-chart/ArenaDoughnutChart.behaviour.json');
  } finally {
    fixture.destroy();
  }
});

test('arena-line-chart matches its figure-with-data-table binding, which excepts nothing', () => {
  const fixture = TestBed.createComponent(ArenaLineChart);
  fixture.componentRef.setInput('labels', LABELS);
  fixture.componentRef.setInput('values', VALUES);
  fixture.componentRef.setInput('seriesLabel', SERIES);
  fixture.detectChanges();
  try {
    assertFigure(fixture.nativeElement as Element, 'charts/arena-line-chart/ArenaLineChart.behaviour.json');
  } finally {
    fixture.destroy();
  }
});
