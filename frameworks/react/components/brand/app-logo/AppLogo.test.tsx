import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { AppLogo } from './AppLogo.tsx';

const MARK = <img src="../../../../../assets/rotor-crimson.svg" alt="" />;

test('throws without a mark', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<AppLogo name="Draven" />), /mark.*required/);
});

test('throws without a name', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<AppLogo mark={MARK} />), /required/);
});

test('throws when given neither', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<AppLogo />), /required/);
});

test('a size picks both halves of the lock-up from the logo scale', () => {
  const html = renderToStaticMarkup(<AppLogo size="sm" mark={MARK} name="Draven" />);
  assert.match(html, /\bsize-logo-mark-sm\b/);
  assert.match(html, /\btext-logo-sm\b/);
});

test('every step in the repertoire resolves, and none writes a number', () => {
  for (const size of ['sm', 'md', 'lg', 'xl']) {
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    const html = renderToStaticMarkup(<AppLogo size={size} mark={MARK} name="Draven" />);
    assert.match(html, new RegExp(`\\bsize-logo-mark-${size}\\b`));
    assert.match(html, new RegExp(`\\btext-logo-${size}\\b`));

    assert.doesNotMatch(html, /style="/, 'the lock-up writes no inline style at all');
  }
});

test('dim renders the second half of the wordmark in --mute', () => {
  const html = renderToStaticMarkup(<AppLogo mark={MARK} name="Draven" dim="soft" />);
  assert.match(html, /soft/);
  assert.match(html, /\btext-base-content\/62\b/);
});

test('without dim the wordmark is one ink', () => {
  const html = renderToStaticMarkup(<AppLogo mark={MARK} name="Dravensoft" />);
  assert.doesNotMatch(html, /\btext-base-content\/62\b/);
});

test('vertical orientation stacks the mark above the name and widens the gap', () => {
  const vertical = renderToStaticMarkup(<AppLogo orientation="vertical" mark={MARK} name="Draven" />);
  assert.match(vertical, /\bflex-col\b/);
  assert.match(vertical, /\bgap-3\b/);

  const horizontal = renderToStaticMarkup(<AppLogo mark={MARK} name="Draven" />);
  assert.match(horizontal, /\bflex-row\b/);
  assert.match(horizontal, /\bgap-2\.5\b/);
});

test('the mark fills its sized slot through the slot, so nothing is cloned to make it', () => {
  const html = renderToStaticMarkup(<AppLogo mark={MARK} name="Draven" />);
  assert.match(html, /\*:w-full/, 'the slot sizes whatever child it is given');
  assert.match(html, /<img src="[^"]*" alt=""\/>/,
    'and the element the consumer passed reaches the page untouched');
});

test('a non-element mark passes through untouched too', () => {
  const html = renderToStaticMarkup(<AppLogo mark="M" name="Draven" />);
  assert.match(html, />M</);
});
