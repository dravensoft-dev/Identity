/* One number, written three times by every chart: the axis tick, the tooltip and the accessible
 * table. They have to agree, because the table is what a screen-reader user is given INSTEAD of
 * the picture, and a chart whose alternative reads differently from its own axis is worse than
 * one with no alternative at all. es-BO is the case that made the members necessary: a currency
 * that precedes its amount, a comma for the decimal and a stop for the thousands. */

import { useTestEnvironment } from '../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ArenaNumberFormat } from '../../Api.generated';
import { ArenaLineChart } from './arena-line-chart/ArenaLineChart';
import { ArenaBarChart } from './arena-bar-chart/ArenaBarChart';
import { ArenaDoughnutChart } from './arena-doughnut-chart/ArenaDoughnutChart';

const FORMAT: ArenaNumberFormat = { locale: 'es-BO', fractionDigits: 2 };
const WRITTEN = 'Bs. 1.234,50';

@Component({
  standalone: true,
  imports: [ArenaLineChart, ArenaBarChart, ArenaDoughnutChart],
  template: `
    <arena-line-chart [labels]="labels" [values]="values" seriesLabel="Revenue"
                      [valuePrefix]="prefix" [valueSuffix]="suffix" [valueFormat]="format" />
    <arena-bar-chart [labels]="labels" [values]="values" seriesLabel="Revenue"
                     [valuePrefix]="prefix" [valueSuffix]="suffix" [valueFormat]="format" />
    <arena-doughnut-chart [labels]="labels" [values]="values" seriesLabel="Revenue"
                          [valuePrefix]="prefix" [valueSuffix]="suffix" [valueFormat]="format" />
  `,
})
class NumbersHost {
  labels = ['Mon'];
  values = [1234.5];
  prefix: string | undefined = 'Bs. ';
  suffix: string | undefined = undefined;
  format: ArenaNumberFormat | undefined = FORMAT;
}

function render(patch: Partial<NumbersHost> = {}): { html: string; text: string; destroy: () => void } {
  const fixture = TestBed.createComponent(NumbersHost);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  return { html: host.innerHTML, text: host.textContent ?? '', destroy: () => fixture.destroy() };
}

test('every chart writes the same number, and the raw one survives nowhere', () => {
  const { text, destroy } = render();
  try {
    assert.ok(text.includes(WRITTEN), `expected ${WRITTEN} in the render, got:\n${text}`);
    assert.doesNotMatch(text, /1234\.5(?!0)/, 'the raw JavaScript number must not survive anywhere');
  } finally { destroy(); }
});

test('each of the three writes it, so no chart is the odd one out', () => {
  const fixture = TestBed.createComponent(NumbersHost);
  try {
    fixture.detectChanges();
    for (const tag of ['arena-line-chart', 'arena-bar-chart', 'arena-doughnut-chart']) {
      const chart = (fixture.nativeElement as Element).querySelector(tag);
      assert.ok(
        (chart?.textContent ?? '').includes(WRITTEN),
        `${tag} did not write ${WRITTEN}; a chart whose accessible table disagrees with the `
        + 'table beside it on the page is showing a different number for the same datum',
      );
    }
  } finally { fixture.destroy(); }
});

test('the prefix goes before the number and the suffix after it, in that order', () => {
  const { text, destroy } = render({ suffix: ' net' });
  try {
    assert.ok(text.includes('Bs. 1.234,50 net'), `got:\n${text}`);
  } finally { destroy(); }
});

test('with no valueFormat a chart writes the raw number, which is what it always did', () => {
  const { text, destroy } = render({ format: undefined, prefix: undefined, suffix: ' Bs.' });
  try {
    assert.ok(text.includes('1234.5 Bs.'), `got:\n${text}`);
  } finally { destroy(); }
});

test('grouping is off on request, for digits that are not a quantity', () => {
  const { text, destroy } = render({
    values: [2026], prefix: undefined, format: { locale: 'es-BO', grouping: false },
  });
  try {
    assert.ok(text.includes('2026'), `got:\n${text}`);
    assert.ok(!text.includes('2.026'), 'a year is not a quantity and takes no thousands separator');
  } finally { destroy(); }
});
