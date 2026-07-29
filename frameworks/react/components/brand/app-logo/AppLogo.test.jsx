/* AppLogo ships with no defaults for `mark` and `name`, and that is a
 * licensing decision rather than a style one: Arena is MIT and a consumer
 * copies this tree into their own product, so a component that rendered
 * Dravensoft's mark when passed nothing would ship someone else's trademark
 * by omission. The argument is only true if the absence is enforced, which is
 * what these first three tests are for -- a comment claiming it would not be.
 * Per api/README.md's "Required-ness governs the implementation and the
 * runtime" clause, enforcement is now a throw (fail-hard), matching
 * Angular's `input.required`, rather than the earlier fail-soft empty render. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { AppLogo } from '../components/brand/AppLogo.jsx';

const MARK = <img src="../../../../assets/rotor-crimson.svg" alt="" />;

test('throws without a mark', () => {
  assert.throws(() => renderToStaticMarkup(<AppLogo name="Draven" />), /mark.*required/);
});

test('throws without a name', () => {
  assert.throws(() => renderToStaticMarkup(<AppLogo mark={MARK} />), /required/);
});

test('throws when given neither', () => {
  assert.throws(() => renderToStaticMarkup(<AppLogo />), /required/);
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
    // The regex below is what makes "none writes a number" true rather than
    // asserted-but-untested: it fails on a numeric width the way a stray
    // `width: 30` would fail it. The negative lookahead excludes `%` --
    // the cloned mark's fill style legitimately writes `width:100%`, and a
    // percentage is not the dimension literal this test is guarding
    // against (the token layer's own gate tolerates `%` for the same
    // reason: DTCG has no percentage dimension to hold it as a token).
    // Checked once against a scratch string carrying a hardcoded numeric
    // px width, which the regex did catch, and against `width:100%`,
    // which it correctly left alone.
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
