/* Both requirements of `navigation` are decidable from one element, so there is
 * no behavioural map. The host IS the landmark -- the root slot is bound to the
 * host rather than rendered as a wrapper -- so the subject is the fixture's own
 * element and not something inside it. */
import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { Breadcrumbs } from './Breadcrumbs';
import { assertPattern, ANGULAR_COMPONENTS } from '../../../test/Compliance';

const BINDING = join(ANGULAR_COMPONENTS, 'navigation/breadcrumbs/Breadcrumbs.behaviour.json');

const CRUMBS = [{ label: 'Clients', href: '/clients' }, { label: 'Overview' }];

function render(ariaLabel: string) {
  const fixture = TestBed.createComponent(Breadcrumbs);
  fixture.componentRef.setInput('ariaLabel', ariaLabel);
  fixture.componentRef.setInput('items', CRUMBS);
  fixture.detectChanges();
  return fixture;
}

test('arena-breadcrumbs is a named nav landmark, and two of them are told apart', () => {
  const fixture = render('Project navigation');
  const other = render('Client navigation');
  try {
    const host = fixture.nativeElement as Element;
    assert.equal(host.getAttribute('aria-label'), 'Project navigation',
      'the name must come from the ariaLabel input, not a constant the component owns');
    assert.notEqual((other.nativeElement as Element).getAttribute('aria-label'), host.getAttribute('aria-label'),
      'two trails on one page must be distinguishable, which the retired hardcoded label made impossible');

    assertPattern({ root: host, bindingPath: BINDING, subjects: { default: host } });
  } finally {
    fixture.destroy();
    other.destroy();
  }
});

test('an ariaLabel bound to nothing throws, because input.required only proves it was bound', () => {
  const fixture = TestBed.createComponent(Breadcrumbs);
  fixture.componentRef.setInput('ariaLabel', '   ');
  fixture.componentRef.setInput('items', CRUMBS);
  try {
    assert.throws(() => fixture.detectChanges(), /Breadcrumbs: .ariaLabel. is required/,
      'a whitespace name satisfies roles.label mechanically while leaving the landmark unnamed');
  } finally {
    try {
      fixture.destroy();
    } catch {
      return;
    }
  }
});
