/* `figure-with-data-table`'s `alternative.table` requirement -- "a real <table> of
 * the plotted numbers, visually hidden" -- is the one the spec doubts is
 * verifiable at all. Most of it is, and it is already implemented: all three
 * charts in both layers render a real <table>, so a suite can assert that it
 * exists, that it is hidden by the visually-hidden idiom rather than absent from
 * the tree, and that its cell text is the data that was passed in. Fired against
 * a real render, all three of those can fail.
 *
 * What stays unverifiable is half of `roles.label`: whether the aria-label is a
 * GOOD name for the chart. `Bar chart` satisfies "aria-label naming the chart"
 * mechanically and tells a screen-reader user almost nothing, and no assertion
 * can tell those two apart -- it is human judgement. That is recorded as debt
 * rather than faked into a passing assertion here.
 *
 * Inputs are driven by overwriting the instance field before the first
 * `detectChanges()`, for the reason alert-role-tones.test.ts's header gives at
 * length: this harness runs Angular's JIT and never `ngtsc`, so a signal input
 * never reaches `ɵcmp.inputs` -- but a template binding and `setInput()` fail
 * differently, and that difference is why neither is used here. A template
 * binding throws NG0303. `setInput()` does not throw at all: it silently
 * no-ops and the render keeps the field's default, which would make a suite
 * built on it pass vacuously against default data with nothing announcing the
 * mistake. Overwriting the instance field renders the REAL component against
 * REAL data instead. */
import { useTestEnvironment } from './testbed-env';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { BarChart } from '../primitives/bar-chart/bar-chart';
import { assertPattern, ANGULAR_PRIMITIVES } from './compliance';
const BINDING = join(ANGULAR_PRIMITIVES, 'bar-chart/bar-chart.behaviour.json');

/** `bar-chart.ts` takes two parallel arrays, `labels` and `values` -- not the
 *  single array of objects a reader might assume. */
const LABELS = ['Alpha', 'Beta', 'Gamma'];
const VALUES = [12, 30, 7];
const SERIES = 'Deliveries';

function renderBarChart() {
  const fixture = TestBed.createComponent(BarChart);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  instance['labels'] = () => LABELS;
  instance['values'] = () => VALUES;
  instance['seriesLabel'] = () => SERIES;
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

    // Each row pairs its category with its value, in order. Asserting the pairing
    // rather than a flat set of cell text is what makes a transposed or truncated
    // table fail -- a bag of the right strings in the wrong rows would pass the
    // looser check.
    const pairs = rows.map((row) => [...row.querySelectorAll('th, td')].map((c) => (c.textContent ?? '').trim()));
    assert.deepEqual(pairs, LABELS.map((label, i) => [label, String(VALUES[i])]));

    // And the table names what it is a table OF.
    assert.equal((table!.querySelector('caption')?.textContent ?? '').trim(), `${SERIES} — bar chart`);
    const headers = [...table!.querySelectorAll('thead th')].map((c) => (c.textContent ?? '').trim());
    assert.deepEqual(headers, ['Category', SERIES]);
  } finally {
    fixture.destroy();
  }
});

/* Hidden, not absent, and the distinction is the requirement. A table removed
 * with `display:none` or `hidden` is removed from the accessibility tree too, so
 * it would satisfy "there is a table in the source" while providing exactly the
 * alternative a sighted-only chart already provides: none. The idiom this layer
 * uses is `SR_ONLY` (chart-internals.ts) -- a 1px clipped box, which is also one
 * of the entries in check-dimension-literals.mjs's EXEMPT map, since the number
 * is a constraint of the accessibility idiom rather than a design dimension. */
test('arena-bar-chart hides its data table visually without removing it from the accessibility tree', () => {
  const fixture = renderBarChart();
  try {
    const table = (fixture.nativeElement as Element).querySelector('table') as HTMLTableElement;

    assert.equal(table.hasAttribute('hidden'), false, 'a hidden table is not an alternative -- it is no table at all');
    assert.equal(table.getAttribute('aria-hidden'), null, 'the table must stay in the accessibility tree');
    assert.notEqual(table.style.display, 'none', 'display:none would remove it from the accessibility tree');

    // The visually-hidden idiom itself: clipped to a 1px box, out of flow.
    assert.equal(table.style.position, 'absolute');
    assert.equal(table.style.width, '1px');
    assert.equal(table.style.height, '1px');
    assert.equal(table.style.overflow, 'hidden');
  } finally {
    fixture.destroy();
  }
});

/* The binding declares `"exceptions": []` -- every requirement of
 * figure-with-data-table is claimed met, with nothing excused. This is what holds
 * it to that, in both directions.
 *
 * The subject is the `<svg role="img">`, not the host. `roles.graphic` and
 * `roles.label` are both about the graphic itself, and `<arena-bar-chart>` is an
 * unknown element carrying neither -- naming the subject is the difference
 * between proving the claim and reporting two false OVERCLAIMs against a
 * component that is correct. It is the same reason React's Menu suite names the
 * focusable trigger.
 *
 * `alternative.table` is undecidable from one element by construction -- it is a
 * claim about a sibling subtree -- so it is declared here with the verdict the
 * two tests above established. */
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

/* The unnamed case, which is the one worth pinning. `seriesLabel` is optional, so
 * a chart can render with no caller-supplied name at all -- and the component
 * still emits an aria-label, the constant `Bar chart`. That satisfies
 * `roles.label` mechanically and the binding excepts nothing, so the comparison
 * passes. It is also, plainly, a name that identifies the chart TYPE and not the
 * chart, and a page with two bar charts on it announces both identically.
 *
 * No assertion can separate a mechanically-present name from a useful one, so
 * this test does not pretend to. It pins the fallback so the gap is visible in
 * the suite rather than only in prose, and the gap itself is debt. */
test('arena-bar-chart with no seriesLabel still names itself, though only by type -- the label\'s quality is not machine-checkable', () => {
  const fixture = TestBed.createComponent(BarChart);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  instance['labels'] = () => LABELS;
  instance['values'] = () => VALUES;
  fixture.detectChanges();
  try {
    const host = fixture.nativeElement as Element;

    const graphic = host.querySelector('[role="img"]') as Element;
    assert.equal(graphic.getAttribute('aria-label'), 'Bar chart');
    assertPattern({
      root: host,
      bindingPath: BINDING,
      subjects: { default: graphic },
      behavioural: { 'alternative.table': true },
    });
  } finally {
    fixture.destroy();
  }
});

