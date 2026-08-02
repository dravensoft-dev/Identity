/* The active row is drawn filled, and Arena applies its own convention rather than asking for
 * it: a consumer otherwise concatenates ph-fill against ph-bold per row, which is the icon
 * convention reimplemented once per project. The swap is idempotent, so a caller who already
 * passes ph-fill gets exactly what they passed. */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SideNav } from '../side-nav/SideNav.tsx';
import { SideNavItem } from './SideNavItem.tsx';
import { activeWeight } from '../side-nav/SideNavInject.tsx';

function markup(active: string): string {
  return renderToStaticMarkup(
    <SideNav ariaLabel="Primary" active={active}>
      <SideNavItem id="home" label="Home" icon="ph-bold ph-house" />
      <SideNavItem id="sales" label="Sales" icon="ph-bold ph-receipt" />
    </SideNav>,
  );
}

function glyphClasses(html: string): string[] {
  return [...html.matchAll(/<i class="([^"]*)"/g)].map((m) => m[1] ?? '');
}

test('activeWeight swaps the weight it finds, adds one where there is none, and repeats safely', () => {
  assert.equal(activeWeight('ph-bold ph-house'), 'ph-fill ph-house');
  assert.equal(activeWeight('ph-thin ph-house'), 'ph-fill ph-house');
  assert.equal(activeWeight('ph-house'), 'ph-fill ph-house');
  assert.equal(activeWeight('ph-fill ph-house'), 'ph-fill ph-house',
    'a caller who already asked for fill gets exactly what they passed');
  assert.equal(activeWeight(activeWeight('ph-bold ph-house')), 'ph-fill ph-house');
});

test('the active row is filled and every other row keeps the weight it was given', () => {
  const classes = glyphClasses(markup('home'));
  assert.equal(classes.length, 2);
  assert.match(classes[0]!, /\bph-fill\b/, 'the active row draws its glyph filled');
  assert.doesNotMatch(classes[0]!, /\bph-bold\b/, 'and no longer bold');
  assert.match(classes[1]!, /\bph-bold\b/, 'an inactive row is untouched');
  assert.doesNotMatch(classes[1]!, /\bph-fill\b/);
});

test('moving `active` moves the fill, so nothing is latched at first render', () => {
  const classes = glyphClasses(markup('sales'));
  assert.doesNotMatch(classes[0]!, /\bph-fill\b/);
  assert.match(classes[1]!, /\bph-fill\b/);
});
