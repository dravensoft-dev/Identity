/* AppLogo ships with no defaults for `mark` and `name`, and that is a
 * licensing decision rather than a style one: Arena is MIT and a consumer
 * copies this tree into their own product, so a component that rendered
 * Dravensoft's mark when passed nothing would ship someone else's trademark
 * by omission. The argument is only true if the absence is enforced, which is
 * what these first two tests are for -- a comment claiming it would not be. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { AppLogo } from '../components/brand/AppLogo.jsx';

const MARK = <img src="../../../../assets/rotor-crimson.svg" alt="" />;

test('renders nothing without a mark', () => {
  assert.equal(renderToStaticMarkup(<AppLogo name="Draven" />), '');
});

test('renders nothing without a name', () => {
  assert.equal(renderToStaticMarkup(<AppLogo mark={MARK} />), '');
});

test('renders nothing when given neither', () => {
  assert.equal(renderToStaticMarkup(<AppLogo />), '');
});

test('a size picks both halves of the lock-up from the logo scale', () => {
  const html = renderToStaticMarkup(<AppLogo size="sm" mark={MARK} name="Draven" />);
  assert.match(html, /var\(--logo-mark-sm\)/);
  assert.match(html, /var\(--logo-text-sm\)/);
});

test('every step in the repertoire resolves, and none writes a number', () => {
  for (const size of ['sm', 'md', 'lg', 'xl']) {
    const html = renderToStaticMarkup(<AppLogo size={size} mark={MARK} name="Draven" />);
    assert.match(html, new RegExp(`var\\(--logo-mark-${size}\\)`));
    assert.match(html, new RegExp(`var\\(--logo-text-${size}\\)`));
  }
});

test('dim renders the second half of the wordmark in --mute', () => {
  const html = renderToStaticMarkup(<AppLogo mark={MARK} name="Draven" dim="soft" />);
  assert.match(html, /soft/);
  assert.match(html, /var\(--mute\)/);
});

test('without dim the wordmark is one ink', () => {
  const html = renderToStaticMarkup(<AppLogo mark={MARK} name="Dravensoft" />);
  assert.doesNotMatch(html, /var\(--mute\)/);
});
