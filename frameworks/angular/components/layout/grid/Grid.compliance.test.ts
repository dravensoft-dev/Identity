/* `none` requires nothing, so assertPattern alone would pass over a grid that had grown a
 * role or a tab stop. The claim the binding makes is that this is layout and not the `grid`
 * pattern, and that is what the hand assertions below check: no role="grid", no gridcell,
 * and nothing focusable that the content slot did not put there. */

import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { GridGap } from '../../../Api.generated';
import { Grid } from './Grid';
import { assertPattern, isFocusable, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'layout/grid/Grid.behaviour.json');

@Component({
  standalone: true,
  imports: [Grid],
  template: `
    <arena-grid [min]="min" [gap]="gap" [maxWidth]="maxWidth">
      <span>One</span>
      <span>Two</span>
      <span>Three</span>
    </arena-grid>
  `,
})
class GridHost {
  min = 'calc(var(--sp-1) * 50)';
  gap: GridGap = 'md';
  maxWidth: string | undefined = undefined;
}

function render(patch: Partial<GridHost> = {}) {
  const fixture = TestBed.createComponent(GridHost);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return fixture;
}

const gridOf = (fixture: ReturnType<typeof render>) =>
  fixture.nativeElement.querySelector('arena-grid') as HTMLElement;

test('arena-grid is layout and never the grid PATTERN -- no role, no cells, nothing to act on', () => {
  const fixture = render();
  try {
    const grid = gridOf(fixture);
    assert.equal(grid.getAttribute('role'), null,
      'a role="grid" here would announce a table where there are only boxes');
    assert.equal(grid.querySelectorAll('[role="gridcell"]').length, 0);
    assert.equal(grid.querySelectorAll('[tabindex]').length, 0, 'layout costs no tab stop');
    for (const el of [grid, ...Array.from(grid.querySelectorAll('*'))]) {
      assert.equal(isFocusable(el as Element), false,
        `<${el.tagName.toLowerCase()}> inside a grid is reachable by keyboard, so a user tabs to something inert`);
    }

    assertPattern({ root: grid, bindingPath: BINDING, subjects: { default: grid } });
  } finally {
    fixture.destroy();
  }
});

test('every child is one cell exactly as written -- nothing is wrapped and nothing is measured', () => {
  const fixture = render();
  try {
    const grid = gridOf(fixture);
    const cells = Array.from(grid.children);
    assert.equal(cells.length, 3, 'a wrapper per cell would break every selector a consumer writes');
    assert.deepEqual(cells.map((c) => c.tagName), ['SPAN', 'SPAN', 'SPAN']);
  } finally {
    fixture.destroy();
  }
});

test('the track list is auto-fit over the min, clamped against the container', () => {
  const fixture = render();
  try {
    const tracks = gridOf(fixture).style.gridTemplateColumns;
    assert.match(tracks, /^repeat\(auto-fit, minmax\(min\(.+, 100%\), 1fr\)\)$/,
      'the count must come from the room, and the min must be clamped or it overflows');
    assert.ok(!/\d+px/.test(tracks.replace(/var\([^)]*\)/g, '')),
      'the default min must reach the track list as a token derivation, never as a literal');
  } finally {
    fixture.destroy();
  }
});

test('a min wider than any card still yields one clamped column rather than an overflow', () => {
  const fixture = render({ min: 'calc(var(--sp-1) * 400)' });
  try {
    assert.match(gridOf(fixture).style.gridTemplateColumns, /min\(calc\(var\(--sp-1\) \* 400\), 100%\)/);
  } finally {
    fixture.destroy();
  }
});

test('maxWidth caps and centres, and its absence leaves the grid filling its container', () => {
  const bare = render();
  try {
    const style = gridOf(bare).getAttribute('style') ?? '';
    assert.ok(!/max-width/.test(style), 'a grid with no ceiling must declare none and fill what contains it');
    assert.ok(!/margin-inline/.test(style), 'and must not centre itself against nothing');
  } finally {
    bare.destroy();
  }

  const capped = render({ maxWidth: 'var(--container-max)' });
  try {
    const style = capped.nativeElement.querySelector('arena-grid')!.getAttribute('style') ?? '';
    assert.match(style, /max-width:\s*var\(--container-max\)/);
    assert.match(style, /margin-inline:\s*auto/,
      'a capped grid centres, or the ceiling reads as a left margin');
  } finally {
    capped.destroy();
  }
});
