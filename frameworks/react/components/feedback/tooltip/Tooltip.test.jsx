import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tooltip } from './Tooltip.jsx';

test('the trigger renders -- children are the projected element, not the bubble', () => {
  const html = renderToStaticMarkup(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  assert.match(html, /<button type="button">Hover<\/button>/, 'the trigger did not render');

  assert.doesNotMatch(html, /role="tooltip"/, 'the bubble rendered without pointer intent');
  assert.doesNotMatch(html, /Details/, 'the label rendered into the static markup with no pointer to reveal it');
});

test('a missing label throws rather than drawing an unnamed bubble', () => {
  assert.throws(
    () => renderToStaticMarkup(<Tooltip><button type="button">Hover</button></Tooltip>),
    /Tooltip: `label` is required/,
    'a Tooltip with no label rendered instead of failing hard',
  );
});

test('Tooltip drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <Tooltip label="Details" style={{ color: '#ff00ff' }}><button type="button">Hover</button></Tooltip>,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Tooltip drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <Tooltip label="Details" data-stray="x"><button type="button">Hover</button></Tooltip>,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});
