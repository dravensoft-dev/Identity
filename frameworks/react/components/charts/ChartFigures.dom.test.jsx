/* One suite for the three charts, because `figure-with-data-table` is Arena's own
 * pattern and all three answer it identically: a role="img" graphic with a name,
 * and a real <table> of the same numbers that is HIDDEN VISUALLY rather than
 * removed. `alternative.table` is BEHAVIOURAL -- no single element decides it --
 * so each verdict below is earned by reading the table against the input data.
 * What no suite can check is whether the name is a GOOD one; that limit is the
 * charts' own entry in DOUBTS.md. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup } from '../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../test/AssertPattern.jsx';
import { BarChart } from './bar-chart/BarChart.jsx';
import { DoughnutChart } from './doughnut-chart/DoughnutChart.jsx';
import { LineChart } from './line-chart/LineChart.jsx';

afterEach(cleanup);

const LABELS = ['Alpha', 'Beta', 'Gamma'];
const VALUES = [12, 30, 7];
const SERIES = 'Deliveries';

const CHARTS = [
  ['BarChart', BarChart, 'charts/bar-chart/BarChart.behaviour.json'],
  ['DoughnutChart', DoughnutChart, 'charts/doughnut-chart/DoughnutChart.behaviour.json'],
  ['LineChart', LineChart, 'charts/line-chart/LineChart.behaviour.json'],
];

for (const [name, Chart, tail] of CHARTS) {
  test(`${name} pairs a named graphic with a real table of the same numbers`, () => {
    const root = mount(<Chart labels={LABELS} values={VALUES} seriesLabel={SERIES} />);

    const graphic = root.querySelector('[role="img"]');
    assert.ok(graphic, 'a chart with no role="img" is a decoration, not a figure');
    assert.match(graphic.getAttribute('aria-label') ?? '', /\S/, 'the graphic must carry a name');

    const table = root.querySelector('table');
    assert.ok(table, 'a chart with no data table is a picture nobody can read');

    const pairs = [...table.querySelectorAll('tbody tr')]
      .map((row) => [...row.querySelectorAll('th, td')].map((c) => (c.textContent ?? '').trim()));
    assert.deepEqual(pairs, LABELS.map((label, i) => [label, String(VALUES[i])]),
      'the table and the picture must not be able to disagree');

    assert.equal(table.hasAttribute('hidden'), false,
      'a hidden table is not an alternative -- it is no table at all');
    assert.equal(table.getAttribute('aria-hidden'), null, 'the table must stay in the accessibility tree');
    assert.notEqual(table.style.display, 'none', 'display:none removes it from the accessibility tree');
    assert.equal(table.style.position, 'absolute', 'the table is hidden by being taken out of flow, not by being removed');

    assertPattern({
      root,
      bindingPath: join(REACT_COMPONENTS, tail),
      subjects: { default: graphic },
      behavioural: { 'alternative.table': true },
    });
  });

  test(`${name} refuses to render without a seriesLabel rather than naming itself by type`, () => {
    assert.throws(
      () => mount(<Chart labels={LABELS} values={VALUES} />),
      /`seriesLabel` is required/,
      'a name that is only the chart TYPE satisfies roles.label mechanically while telling a reader nothing, '
      + 'and two charts on one page then announce identically -- which is why this is guarded rather than defaulted',
    );
  });
}
