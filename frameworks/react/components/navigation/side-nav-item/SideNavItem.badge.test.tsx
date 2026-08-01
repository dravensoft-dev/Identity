/* The badge is drawn from a number rather than a string so Arena can hold the two rules the
 * contract states: zero draws nothing, and above 99 reads "99+". A caller who formats the
 * value first has taken both away, which is what this suite pins. */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SideNav } from '../side-nav/SideNav.tsx';
import { SideNavItem } from './SideNavItem.tsx';

function drawn(badge: number | undefined): string {
  return renderToStaticMarkup(
    <SideNav ariaLabel="Workspace navigation" active="orders">
      <SideNavItem id="orders" label="Orders" badge={badge} />
    </SideNav>,
  );
}

const counts = (html: string) => [...html.matchAll(/>([\d+]+)<\/span>/g)].map((m) => m[1]);

test('a count draws, and reads exactly what it was given up to 99', () => {
  assert.deepEqual(counts(drawn(1)), ['1']);
  assert.deepEqual(counts(drawn(12)), ['12']);
  assert.deepEqual(counts(drawn(99)), ['99']);
});

test('zero draws no badge at all, because a mark reading 0 says there is nothing to mark', () => {
  assert.deepEqual(counts(drawn(0)), []);
  assert.deepEqual(counts(drawn(undefined)), [], 'and an absent count is not a zero one');
});

test('above 99 the badge reads 99+, so a four-digit count cannot widen the column', () => {
  assert.deepEqual(counts(drawn(100)), ['99+']);
  assert.deepEqual(counts(drawn(4821)), ['99+']);
});

test('the count is not hidden from assistive technology -- the row announces it', () => {
  const html = drawn(12);
  assert.match(html, /Orders/);
  assert.match(html, /12/, 'a count a screen-reader user cannot hear is a count that is not there');
  assert.doesNotMatch(html, /aria-hidden="true"[^>]*>12/);
});
