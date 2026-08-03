/* Every array input takes a `readonly T[]`, which is what an app that declares its data
 * `as const`, freezes it, or exposes it from a store actually holds. A mutable `T[]` input
 * rejects all three with TS4104 in the consumer's template, and this file is where that
 * fails: ngc compiles it under strictTemplates, so the binding below is the assertion. */

import '@angular/compiler';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { useTestEnvironment } from './TestbedEnv';
import { ActivityFeed } from '../components/display/activity-feed/ActivityFeed';
import { BarChart } from '../components/charts/bar-chart/BarChart';
import { Breadcrumbs } from '../components/navigation/breadcrumbs/Breadcrumbs';
import { BulkActionBar } from '../components/navigation/bulk-action-bar/BulkActionBar';
import { CommandPalette } from '../components/navigation/command-palette/CommandPalette';
import { DoughnutChart } from '../components/charts/doughnut-chart/DoughnutChart';
import { LineChart } from '../components/charts/line-chart/LineChart';
import { Menu } from '../components/navigation/menu/Menu';
import { Onboarding } from '../components/feedback/onboarding/Onboarding';
import { SegmentedControl } from '../components/navigation/segmented-control/SegmentedControl';
import { Select } from '../components/forms/select/Select';
import { Table } from '../components/display/table/Table';
import type {
  ActivityItem, BulkAction, Command, Crumb, MenuItem, OnboardingStep, SegmentOption, SelectOption,
  TableColumn,
} from '../Api.generated';

useTestEnvironment();

const LABELS: readonly string[] = Object.freeze(['Mon', 'Tue']);
const VALUES: readonly number[] = Object.freeze([1, 2]);
const SLOTS: readonly number[] = Object.freeze([1, 2]);

@Component({
  standalone: true,
  imports: [
    ActivityFeed, BarChart, Breadcrumbs, BulkActionBar, CommandPalette, DoughnutChart, LineChart,
    Menu, Onboarding, SegmentedControl, Select, Table,
  ],
  template: `
    <arena-activity-feed label="Activity" [items]="items" />
    <arena-breadcrumbs ariaLabel="Trail" [items]="crumbs" />
    <arena-bulk-action-bar [count]="0" [actions]="actions" />
    <arena-command-palette [open]="false" [commands]="commands" />
    <arena-menu [items]="menuItems" />
    <arena-onboarding [open]="false" [steps]="steps" />
    <arena-segmented-control ariaLabel="View" [options]="segments" />
    <arena-select [options]="selectOptions" />
    <arena-table label="Deployments" [columns]="columns" />
    <arena-bar-chart seriesLabel="Deploys" [labels]="labels" [values]="values" [slots]="slots" />
    <arena-doughnut-chart seriesLabel="Traffic" [labels]="labels" [values]="values" [slots]="slots" />
    <arena-line-chart seriesLabel="Latency" [labels]="labels" [values]="values" />
  `,
})
class FrozenDataHost {
  readonly items: readonly ActivityItem[] = Object.freeze([{ id: '1', actor: 'Marta', action: 'deployed' }]);
  readonly crumbs: readonly Crumb[] = Object.freeze([{ label: 'Clients', href: '/clients' }]);
  readonly actions: readonly BulkAction[] = Object.freeze([{ id: 'archive', label: 'Archive' }]);
  readonly commands: readonly Command[] = Object.freeze([{ id: 'open', label: 'Open project' }]);
  readonly menuItems: readonly MenuItem[] = Object.freeze([{ id: 'rename', label: 'Rename' }]);
  readonly steps: readonly OnboardingStep[] = Object.freeze([{ title: 'Welcome', body: 'Start here' }]);
  readonly segments: readonly SegmentOption[] = Object.freeze([{ value: 'grid', label: 'Grid' }]);
  readonly selectOptions: readonly SelectOption[] = Object.freeze([{ value: 'a', label: 'A' }]);
  readonly columns: readonly TableColumn[] = Object.freeze([{ header: 'Build' }]);
  readonly labels = LABELS;
  readonly values = VALUES;
  readonly slots = SLOTS;
}

test('every array input binds data the consumer holds as readonly, and nothing writes to it', () => {
  const fixture = TestBed.createComponent(FrozenDataHost);
  fixture.detectChanges();

  const host = fixture.nativeElement as HTMLElement;
  for (const selector of [
    'arena-activity-feed', 'arena-breadcrumbs', 'arena-bulk-action-bar', 'arena-command-palette',
    'arena-menu', 'arena-onboarding', 'arena-segmented-control', 'arena-select', 'arena-table',
    'arena-bar-chart', 'arena-doughnut-chart', 'arena-line-chart',
  ]) {
    assert.ok(host.querySelector(selector), `${selector} did not render, so its binding proves nothing`);
  }

  assert.deepEqual([...LABELS], ['Mon', 'Tue'], 'a frozen array reached a component that wrote to it');
  assert.deepEqual([...VALUES], [1, 2], 'a frozen array reached a component that wrote to it');
  fixture.destroy();
});
