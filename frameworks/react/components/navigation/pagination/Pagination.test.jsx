import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Pagination } from './Pagination.jsx';

/* One SSR suite is enough for this component, and that is a fact about it rather
 * than a shortcut. Menu needed two -- an SSR file and a DOM file -- because its
 * panel does not exist until its trigger is clicked, so half its markup, and with
 * it half the surface an R4 escape could be merged into, is unreachable from
 * renderToStaticMarkup. Pagination has no such half: the <nav> root and every
 * control inside it render unconditionally on the first pass, and the root is the
 * only element `style` was ever spread onto. So every assertion below, the two R4
 * ones included, is decidable from static markup.
 *
 * `pageWindow` is the elision helper and is pinned separately in
 * PaginationWindow.test.jsx, beside this file; nothing here re-derives it. */

test('Pagination is a nav landmark and names itself "Pagination" by default', () => {
  const html = renderToStaticMarkup(<Pagination page={3} pageCount={12} />);
  assert.match(html, /^<nav aria-label="Pagination"/);
});

/* `ariaLabel` is the member that narrows Pagination.behaviour.json's roles.label
 * exception. It does not retire it: the default above is still a constant, so two
 * instances that both omit it are still indistinguishable. What the member buys is
 * that a caller CAN distinguish them, which was previously impossible. */
test('ariaLabel names the landmark when the caller supplies one', () => {
  const html = renderToStaticMarkup(<Pagination page={3} pageCount={12} ariaLabel="Deployments" />);
  assert.match(html, /^<nav aria-label="Deployments"/);
  assert.doesNotMatch(html, /aria-label="Pagination"/, 'the constant survived a caller-supplied name');
});

test('the current page is marked, and only it', () => {
  const html = renderToStaticMarkup(<Pagination page={3} pageCount={12} />);
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
  assert.match(html, /aria-current="page"[^>]*>3</);
});

/* R4: `style` left the component, and there is no {...rest} to put back. Asserted
 * in two separate tests -- node:assert aborts on the first failure, so one body
 * asserting both cannot discriminate which escape came back. */
test('Pagination drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <Pagination page={3} pageCount={12} style={{ color: '#ff00ff' }} />,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Pagination drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <Pagination page={3} pageCount={12} data-stray="x" />,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});

/* `page` and `pageCount` are declared required in the contract, and contracts/api/README.md's
 * required-ness rule says the implementation fails hard rather than rendering with
 * a missing value. Both previously defaulted -- to 1 and 1 -- which drew a one-page
 * control over a set whose size nobody had stated. */
test('page is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<Pagination pageCount={12} />),
    /Pagination: `page` is required/,
  );
});

test('pageCount is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<Pagination page={3} />),
    /Pagination: `pageCount` is required/,
  );
});
