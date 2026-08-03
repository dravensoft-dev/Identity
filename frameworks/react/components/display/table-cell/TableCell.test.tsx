import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { TableCell } from './TableCell.tsx';

test('the roving ring is a focus modifier on the cell, not a flag pushed down the family', () => {
  const html = renderToStaticMarkup(
    <TableCell column={{ header: 'Service' }} tabIndex={0}>api</TableCell>,
  );
  assert.match(html, /(?:arena-table__th|arena-table__td|arena-table__td-mono)/);
  assert.match(html, /\b(?:arena-table__th|arena-table__td|arena-table__td-mono)\b/, 'the ring replaces an outline rather than adding to one');
  assert.doesNotMatch(html, /style="/, 'nothing is recomputed to draw it');
});

test('a mono column takes its own branch of the recipe', () => {
  const plain = renderToStaticMarkup(<TableCell column={{ header: 'Service' }}>api</TableCell>);
  assert.match(plain, /\b(?:arena-table__root|arena-table__table|arena-table__td|arena-table__card-value)\b/);

  const mono = renderToStaticMarkup(<TableCell column={{ header: 'Build', mono: true }}>4821</TableCell>);
  assert.match(mono, /\b(?:arena-table__th|arena-table__td-mono|arena-table__card-label|arena-table__card-value-mono)\b/);
  assert.match(mono, /\b(?:arena-table__td-mono|arena-table__card-value-mono)\b/);
});
