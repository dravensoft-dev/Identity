/* The badge is drawn from a number rather than a string so Arena can hold the two rules the
 * contract states: zero draws nothing, and above 99 reads "99+". A caller who formats the
 * value first has taken both away, which is what this suite pins. */

import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ArenaSideNav } from '../arena-side-nav/ArenaSideNav';
import { assertNoNode } from '../../../test/NodeAssert';
import { ArenaSideNavItem } from './ArenaSideNavItem';

@Component({
  standalone: true,
  imports: [ArenaSideNav, ArenaSideNavItem],
  template: `
    <arena-side-nav ariaLabel="Workspace navigation" active="orders">
      <arena-side-nav-item id="orders" label="Orders" [badge]="tally" />
    </arena-side-nav>
  `,
})
class BadgeHost { tally: number | undefined = undefined; }

function drawn(tally: number | undefined): string | null {
  const fixture = TestBed.createComponent(BadgeHost);
  try {
    fixture.componentInstance.tally = tally;
    fixture.detectChanges();
    const row = (fixture.nativeElement as Element).querySelector('[aria-current="page"]');
    const badge = row?.querySelector('span');
    return badge ? (badge.textContent ?? '') : null;
  } finally { fixture.destroy(); }
}

test('a count draws, and reads exactly what it was given up to 99', () => {
  assert.equal(drawn(1), '1');
  assert.equal(drawn(12), '12');
  assert.equal(drawn(99), '99');
});

test('zero draws no badge at all, because a mark reading 0 says there is nothing to mark', () => {
  assert.equal(drawn(0), null);
  assert.equal(drawn(undefined), null, 'and an absent count is not a zero one');
});

test('above 99 the badge reads 99+, so a four-digit count cannot widen the column', () => {
  assert.equal(drawn(100), '99+');
  assert.equal(drawn(4821), '99+');
});

test('the count is not hidden from assistive technology -- the row announces it', () => {
  const fixture = TestBed.createComponent(BadgeHost);
  try {
    fixture.componentInstance.tally = 12;
    fixture.detectChanges();
    const row = (fixture.nativeElement as Element).querySelector('[aria-current="page"]');
    assert.match(row?.textContent ?? '', /Orders/);
    assert.match(
      row?.textContent ?? '',
      /12/,
      'a count a screen-reader user cannot hear is a count that is not there',
    );
    assertNoNode(row?.querySelector('[aria-hidden="true"]:not(i)'),
      'the count must not be hidden from a screen reader');
  } finally { fixture.destroy(); }
});
