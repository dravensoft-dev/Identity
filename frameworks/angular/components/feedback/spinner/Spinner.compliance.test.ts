/* A spinner is indeterminate by definition, so it reports no value at all, and the pattern's
 * own clause says omission is how ARIA expresses that. live.politeness is the exception
 * MatProgressSpinner carried and this clears. The three states.* requirements are BEHAVIOURAL
 * rather than decidable, because each is conditional on the widget reporting a value and one
 * element cannot say whether it does; the verdicts are earned by the assertions above them. */
import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { assertPattern, ANGULAR_COMPONENTS, isFocusable } from '../../../test/Compliance';
import { Spinner } from './Spinner';

const BINDING = join(ANGULAR_COMPONENTS, 'feedback/spinner/Spinner.behaviour.json');

function renderSpinner(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(Spinner);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return fixture;
}

test('arena-spinner meets the progressbar pattern it binds', () => {
  const fixture = renderSpinner();
  try {
    const host = fixture.nativeElement as Element;
    assert.equal(host.getAttribute('role'), 'progressbar');
    assert.equal(host.getAttribute('aria-live'), 'polite',
      'the exception MatProgressSpinner carried: the role has no implicit politeness');
    assert.equal(host.getAttribute('aria-valuenow'), null,
      'a spinner is indeterminate by definition, so it reports no value');

    assert.equal(host.getAttribute('aria-valuemin'), null);
    assert.equal(host.getAttribute('aria-valuemax'), null);

    assertPattern({
      root: host,
      bindingPath: BINDING,
      behavioural: {
        'states.valuenow': true,
        'states.valuemin': true,
        'states.valuemax': true,
      },
    });
  } finally {
    fixture.destroy();
  }
});

test('label names it, and the default is a name rather than an absence', () => {
  const fallback = renderSpinner();
  try {
    assert.equal((fallback.nativeElement as Element).getAttribute('aria-label'), 'Loading');
  } finally {
    fallback.destroy();
  }

  const named = renderSpinner({ label: 'Fetching deployments' });
  try {
    assert.equal((named.nativeElement as Element).getAttribute('aria-label'), 'Fetching deployments');
  } finally {
    named.destroy();
  }
});

test('the circle is decorative and the host is not focusable -- a wait indicator takes no tab stop', () => {
  const fixture = renderSpinner();
  try {
    const host = fixture.nativeElement as Element;
    const circle = host.querySelector('span') as HTMLElement;
    assert.equal(circle.getAttribute('aria-hidden'), 'true',
      'the ring carries no information the role does not already carry');
    assert.equal(host.getAttribute('tabindex'), null);
    assert.equal(isFocusable(host), false);
  } finally {
    fixture.destroy();
  }
});
