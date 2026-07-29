/* Proves the DOM harness itself works before any compliance suite depends on it:
 * a React tree reaches a real document, and cleanup() leaves nothing behind.
 *
 * This file runs in a `bun test` invocation of its own, and the `.dom.test.jsx` infix
 * in its name is what puts it there. @happy-dom/global-registrator installs globals
 * process-wide and a single `bun test` invocation is one process, so a DOM registered
 * alongside the suites WITHOUT that infix would quietly change what they prove: they
 * assert on renderToStaticMarkup precisely to show those components render with no DOM
 * present. (That split used to be a directory boundary -- this file was
 * frameworks/react/test-dom/smoke.test.jsx -- until the structure refactor's batch 3
 * colocated the suites with their components and left the infix carrying it. The reason
 * is unchanged; only what expresses it moved.)
 *
 * node:test + node:assert/strict, not bun:test — every other suite in this repo
 * (frameworks/react/, frameworks/angular/, scripts/) uses that pair,
 * and bun test runs a node:test file exactly as it runs its own, so there is no
 * reason for the DOM suites to speak a second test idiom. */
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
