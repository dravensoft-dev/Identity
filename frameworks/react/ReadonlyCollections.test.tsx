/* Every collection prop takes a `readonly T[]`, which is what an app that declares its data
 * `as const`, freezes it, or reads it from a store actually holds. A mutable `T[]` prop rejects
 * all three with TS4104 at the call site, and this file is where that fails: check:react-types
 * compiles the layer under strict, so the elements below are the assertion. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ActivityFeed } from './components/display/activity-feed/ActivityFeed.tsx';
import { BarChart } from './components/charts/bar-chart/BarChart.tsx';
import { Breadcrumbs } from './components/navigation/breadcrumbs/Breadcrumbs.tsx';
import { BulkActionBar } from './components/navigation/bulk-action-bar/BulkActionBar.tsx';
import { DoughnutChart } from './components/charts/doughnut-chart/DoughnutChart.tsx';
import { LineChart } from './components/charts/line-chart/LineChart.tsx';
import { SegmentedControl } from './components/navigation/segmented-control/SegmentedControl.tsx';
import { Select } from './components/forms/select/Select.tsx';
import { Table } from './components/display/table/Table.tsx';
import type {
  ActivityItem, BulkAction, Crumb, SegmentOption, SelectOption, TableColumn,
} from './Api.generated.ts';

const LABELS: readonly string[] = Object.freeze(['Mon', 'Tue']);
const VALUES: readonly number[] = Object.freeze([1, 2]);
const SLOTS: readonly number[] = Object.freeze([1, 2]);
const ITEMS: readonly ActivityItem[] = Object.freeze([{ id: '1', actor: 'Marta', action: 'deployed' }]);
const CRUMBS: readonly Crumb[] = Object.freeze([{ label: 'Clients', href: '/clients' }]);
const ACTIONS: readonly BulkAction[] = Object.freeze([{ id: 'archive', label: 'Archive' }]);
const SEGMENTS: readonly SegmentOption[] = Object.freeze([{ value: 'grid', label: 'Grid' }]);
const OPTIONS: readonly SelectOption[] = Object.freeze([{ value: 'a', label: 'A' }]);
const COLUMNS: readonly TableColumn[] = Object.freeze([{ header: 'Build' }]);

test('every collection prop takes data the consumer holds as readonly, and nothing writes to it', () => {
  const markup = [
    renderToStaticMarkup(<ActivityFeed label="Activity" items={ITEMS} />),
    renderToStaticMarkup(<Breadcrumbs ariaLabel="Trail" items={CRUMBS} />),
    renderToStaticMarkup(<BulkActionBar count={1} actions={ACTIONS} />),
    renderToStaticMarkup(<SegmentedControl ariaLabel="View" options={SEGMENTS} value="grid" onChange={() => {}} />),
    renderToStaticMarkup(<Select options={OPTIONS} />),
    renderToStaticMarkup(<Table label="Deployments" columns={COLUMNS} />),
    renderToStaticMarkup(<BarChart seriesLabel="Deploys" labels={LABELS} values={VALUES} slots={SLOTS} />),
    renderToStaticMarkup(<DoughnutChart seriesLabel="Traffic" labels={LABELS} values={VALUES} slots={SLOTS} />),
    renderToStaticMarkup(<LineChart seriesLabel="Latency" labels={LABELS} values={VALUES} />),
  ];

  for (const html of markup) assert.ok(html.length > 0, 'a component rendered nothing, so its prop proves nothing');
  assert.deepEqual([...LABELS], ['Mon', 'Tue'], 'a frozen array reached a component that wrote to it');
  assert.deepEqual([...VALUES], [1, 2], 'a frozen array reached a component that wrote to it');
});
