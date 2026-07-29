import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Pagination } from './Pagination.jsx';

test('Pagination is a nav landmark and names itself "Pagination" by default', () => {
  const html = renderToStaticMarkup(<Pagination page={3} pageCount={12} />);
  assert.match(html, /^<nav aria-label="Pagination"/);
});

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
