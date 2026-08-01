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
  assert.match(html, /var\(--logo-mark-sm\)/);
  assert.match(html, /var\(--logo-text-sm\)/);
});

test('every step in the repertoire resolves, and none writes a number', () => {
  for (const size of ['sm', 'md', 'lg', 'xl']) {
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    const html = renderToStaticMarkup(<AppLogo size={size} mark={MARK} name="Draven" />);
    assert.match(html, new RegExp(`var\\(--logo-mark-${size}\\)`));
    assert.match(html, new RegExp(`var\\(--logo-text-${size}\\)`));

    assert.doesNotMatch(html, /width:\s*\d+(?:\.\d+)?(?!\d*%)/);
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

test('vertical orientation stacks the mark above the name and widens the gap', () => {
  const vertical = renderToStaticMarkup(<AppLogo orientation="vertical" mark={MARK} name="Draven" />);
  assert.match(vertical, /flex-direction:column/);
  assert.match(vertical, /gap:calc\(var\(--sp-1\) \* 3\)/);

  const horizontal = renderToStaticMarkup(<AppLogo mark={MARK} name="Draven" />);
  assert.match(horizontal, /flex-direction:row/);
  assert.match(horizontal, /gap:calc\(var\(--sp-1\) \* 2\.5\)/);
});

test('an element mark is cloned to fill the sized slot', () => {
  const html = renderToStaticMarkup(<AppLogo mark={MARK} name="Draven" />);
  assert.match(html, /<img src="[^"]*" alt="" style="display:block;width:100%;height:100%"\/>/);
});

test('a non-element mark passes through untouched, with no fill style', () => {
  const html = renderToStaticMarkup(<AppLogo mark="M" name="Draven" />);
  assert.doesNotMatch(html, /display:block;width:100%;height:100%/);
  assert.match(html, />M</);
});
