import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { TableCell } from './TableCell.tsx';

test('the roving ring is a focus modifier on the cell, not a flag pushed down the family', () => {
  const html = renderToStaticMarkup(
    <TableCell column={{ header: 'Service' }} tabIndex={0}>api</TableCell>,
  );
  assert.match(html, /focus:shadow-\[inset_0_0_0_var\(--focus-width\)_var\(--focus-ring\)\]/);
  assert.match(html, /\boutline-none\b/, 'the ring replaces an outline rather than adding to one');
  assert.doesNotMatch(html, /style="/, 'nothing is recomputed to draw it');
});

test('a mono column takes its own branch of the recipe', () => {
  const plain = renderToStaticMarkup(<TableCell column={{ header: 'Service' }}>api</TableCell>);
  assert.match(plain, /\bfont-body\b/);

  const mono = renderToStaticMarkup(<TableCell column={{ header: 'Build', mono: true }}>4821</TableCell>);
  assert.match(mono, /\bfont-mono\b/);
  assert.match(mono, /\btabular-nums\b/);
});
