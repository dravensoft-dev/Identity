/* Proves the DOM harness itself works before any compliance suite depends on it:
 * a React tree reaches a real document, and cleanup() leaves nothing behind.
 *
 * This directory is separate from frameworks/react/test/ on purpose.
 * @happy-dom/global-registrator installs globals process-wide and `bun test <dir>`
 * is one process per directory; the six suites next door assert on
 * renderToStaticMarkup precisely to prove those components render with no DOM
 * present, and giving them one would quietly change what they prove.
 *
 * node:test + node:assert/strict, not bun:test — every other suite in this repo
 * (frameworks/react/test/, frameworks/angular/test/, scripts/) uses that pair,
 * and bun test runs a node:test file exactly as it runs its own, so there is no
 * reason for this one directory to speak a second test idiom. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mount, cleanup } from './harness.jsx';
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
