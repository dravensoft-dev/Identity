import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mount, cleanup } from './Harness.jsx';
import React from 'react';

afterEach(cleanup);

test('mount renders a React tree into a real document', () => {
  const el = mount(<div role="dialog" aria-modal="true">hello</div>);
  assert.ok(el.querySelector('[role="dialog"]') !== null);
  assert.equal(el.querySelector('[role="dialog"]').getAttribute('aria-modal'), 'true');
});

test('mount resolves an implicit role through a real element, not a string', () => {
  const el = mount(<button type="button">Go</button>);
  assert.equal(el.querySelector('button').tagName, 'BUTTON');
});

test('cleanup empties the document body', () => {
  mount(<div id="leftover" />);
  cleanup();
  assert.equal(document.body.innerHTML, '');
});
