import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup } from '../../../test/Harness.tsx';
import { assertPattern, REACT_COMPONENTS } from '../../../test/AssertPattern.tsx';
import { Spinner } from './Spinner.tsx';

afterEach(cleanup);

const BINDING = join(REACT_COMPONENTS, 'feedback/spinner/Spinner.behaviour.json');

test('Spinner meets the progressbar pattern, reporting work with no value', () => {
  const root = mount(<Spinner label="Loading projects" />);
  const el = root.querySelector<HTMLElement>('[role="progressbar"]');
  assert.ok(el, 'sanity: nothing rendered the progressbar element');

  assert.equal(el.getAttribute('aria-live'), 'polite',
    'role="progressbar" carries no implicit live region, so an explicit aria-live is the only '
    + 'thing announcing that work is under way');
  for (const attr of ['aria-valuenow', 'aria-valuemin', 'aria-valuemax']) {
    assert.equal(el.hasAttribute(attr), false,
      `a spinner has no range at all, so ${attr} would report a value it does not have`);
  }

  assertPattern({
    root,
    bindingPath: BINDING,
    subjects: { default: el },
    behavioural: { 'states.valuenow': true, 'states.valuemin': true, 'states.valuemax': true },
  });
});
