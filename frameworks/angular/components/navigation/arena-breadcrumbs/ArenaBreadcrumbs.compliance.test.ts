/* Both requirements of `navigation` are decidable from one element, so there is
 * no behavioural map. The landmark is a real <nav> INSIDE the fixture, taking the
 * carve-out the host rule provides for a root that must be a specific semantic
 * element -- so the subject is that element and not the fixture's own. */
import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { ArenaBreadcrumbs } from './ArenaBreadcrumbs';
import { assertPattern, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'navigation/arena-breadcrumbs/ArenaBreadcrumbs.behaviour.json');

const CRUMBS = [{ label: 'Clients', href: '/clients' }, { label: 'Overview' }];

function render(ariaLabel: string) {
  const fixture = TestBed.createComponent(ArenaBreadcrumbs);
  fixture.componentRef.setInput('ariaLabel', ariaLabel);
  fixture.componentRef.setInput('items', CRUMBS);
  fixture.detectChanges();
  return fixture;
}

function landmark(fixture: ReturnType<typeof render>): Element {
  const nav = (fixture.nativeElement as Element).querySelector('nav');
  assert.ok(nav, 'the trail must render a real <nav>, which is what the pattern asks for when one can be used');
  return nav;
}

test('arena-breadcrumbs is a named nav landmark, and two of them are told apart', () => {
  const fixture = render('Project navigation');
  const other = render('Client navigation');
  try {
    const nav = landmark(fixture);
    assert.equal(nav.getAttribute('aria-label'), 'Project navigation',
      'the name must come from the ariaLabel input, not a constant the component owns');
    assert.equal(nav.getAttribute('role'), null,
      'a real <nav> carries the landmark natively, so role="navigation" on top of it is noise');
    assert.notEqual(landmark(other).getAttribute('aria-label'), nav.getAttribute('aria-label'),
      'two trails on one page must be distinguishable, which the retired hardcoded label made impossible');

    assertPattern({ root: fixture.nativeElement as Element, bindingPath: BINDING, subjects: { default: nav } });
  } finally {
    fixture.destroy();
    other.destroy();
  }
});

test('the host is out of layout, so the <nav> is the box a parent row lays out', () => {
  const fixture = render('Project navigation');
  try {
    assert.match((fixture.nativeElement as Element).getAttribute('style') ?? '', /display:\s*contents/,
      'a bare host that is not display:contents lays out as an inline box between the parent and the nav');
  } finally {
    fixture.destroy();
  }
});

test('an ariaLabel bound to nothing throws, because input.required only proves it was bound', () => {
  const fixture = TestBed.createComponent(ArenaBreadcrumbs);
  fixture.componentRef.setInput('ariaLabel', '   ');
  fixture.componentRef.setInput('items', CRUMBS);
  try {
    assert.throws(() => fixture.detectChanges(), /ArenaBreadcrumbs: .ariaLabel. is required/,
      'a whitespace name satisfies roles.label mechanically while leaving the landmark unnamed');
  } finally {
    try {
      fixture.destroy();
    } catch {
      return;
    }
  }
});
