/* The index carried is the index in `values`, and the fixture is built so the two lists cannot
 * be confused: a zero-valued slice paints no path, so the third VALUE is the second PATH. A
 * consumer indexing the SVG has to reproduce that omission from outside to translate one into
 * the other, which is reverse engineering of a component's own DOM.
 * The legend layout is asserted through the ResizeObserver stub, because happy-dom's never
 * fires on its own and the measured width is what `auto` decides on. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.tsx';
import { DoughnutChart } from './DoughnutChart.tsx';
import type { ChartLegendLayout } from '../../../Api.generated';

afterEach(cleanup);

const LABELS = ['Retail', 'Wholesale', 'Consignment', 'Export'];
const VALUES = [40, 25, 0, 35];

function widths<T>(width: number, body: () => T): T {
  const saved = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) { this.callback = callback; }
    observe(target: Element) {
      this.callback([{ target, contentRect: { width } }] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  try {
    return body();
  } finally {
    globalThis.ResizeObserver = saved;
  }
}

function render(options: { seen?: number[]; legendLayout?: ChartLegendLayout } = {}) {
  return mount(
    <DoughnutChart labels={LABELS} values={VALUES} seriesLabel="Revenue by channel"
      legendLayout={options.legendLayout}
      onSliceActivate={(index) => options.seen?.push(index)} />,
  );
}

function click(el: Element) {
  act(() => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
}

test('a zero-valued slice paints no path, so the drawn shapes are not the values', () => {
  const root = render();
  assert.equal(root.querySelectorAll('path').length, 3,
    'four values, one of them zero, and three arcs: the two lists differ by construction');
});

test('the index carried is the index in values, not the index among the drawn paths', () => {
  const seen: number[] = [];
  const root = render({ seen });
  const paths = [...root.querySelectorAll('path')];

  click(paths[2]!);
  assert.deepEqual(seen, [3],
    'the third drawn arc is the FOURTH value, and reporting 2 here is the defect this member exists to end');

  click(paths[0]!);
  assert.deepEqual(seen, [3, 0]);
});

test('a legend row reports the same index the arc does, including for the slice with no arc', () => {
  const seen: number[] = [];
  const root = render({ seen });
  const rows = [...root.querySelectorAll('[role="group"] > div')];
  assert.equal(rows.length, 4, 'the legend lists every value, arc or no arc');

  click(rows[2]!);
  assert.deepEqual(seen, [2],
    'the zero-valued entry is unreachable through the SVG, and reachable here');
});

test('a narrow legend stacks the concept over the figure, and a wide one keeps one line', () => {
  const narrow = widths(390, () => render());
  const wideRow = () => narrow.querySelector('[role="group"] > div > span:nth-child(2)') as HTMLElement;
  assert.equal(wideRow().style.flexDirection, 'column',
    'on one line the figure does not yield, so the concept is what gets truncated');

  cleanup();
  const wide = widths(1200, () => render());
  const row = wide.querySelector('[role="group"] > div > span:nth-child(2)') as HTMLElement;
  assert.notEqual(row.style.flexDirection, 'column');
});

test('the layout can be pinned either way, whatever the container measures', () => {
  const forced = widths(1200, () => render({ legendLayout: 'stacked' }));
  assert.equal(
    (forced.querySelector('[role="group"] > div > span:nth-child(2)') as HTMLElement).style.flexDirection,
    'column',
  );

  cleanup();
  const inline = widths(390, () => render({ legendLayout: 'inline' }));
  assert.notEqual(
    (inline.querySelector('[role="group"] > div > span:nth-child(2)') as HTMLElement).style.flexDirection,
    'column',
  );
});
