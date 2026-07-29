import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Menu } from './Menu.jsx';

test('a closed Menu draws its trigger and no panel', () => {
  const html = renderToStaticMarkup(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} />,
  );
  assert.match(html, /<button type="button">Open<\/button>/);
  assert.doesNotMatch(html, /role="menu"/, 'the panel rendered before anything opened it');

  assert.equal((html.match(/Rename/g) || []).length, 0, 'an entry was drawn while the menu was closed');
});

test('Menu drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <Menu trigger={<button type="button">Open</button>} items={[]} style={{ color: '#ff00ff' }} />,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Menu drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <Menu trigger={<button type="button">Open</button>} items={[]} data-stray="x" />,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});

test('items is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<Menu trigger={<button type="button">Open</button>} />),
    /Menu: `items` is required/,
  );
});

test('an empty items array renders rather than throwing', () => {
  assert.doesNotThrow(
    () => renderToStaticMarkup(<Menu trigger={<button type="button">Open</button>} items={[]} />),
  );
});
