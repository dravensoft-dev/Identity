import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { CommandPalette } from './CommandPalette.tsx';

test('a closed palette renders nothing', () => {
  assert.equal(renderToStaticMarkup(<CommandPalette open={false} commands={[]} />), '');
});

test('an open palette draws each command with its icon class, label and shortcut', () => {
  const html = renderToStaticMarkup(
    <CommandPalette open commands={[{ id: 'new', label: 'New project', icon: 'ph-bold ph-plus', shortcut: 'N' }]} />,
  );
  assert.ok(html.includes('class="ph-bold ph-plus"'), 'the icon is drawn from the class name');
  assert.ok(html.includes('New project'), 'the label is rendered');
  assert.ok(html.includes('>N<'), 'the shortcut is rendered at the row\'s trailing edge');
  assert.ok(html.includes('role="dialog"'), 'the combobox binding\'s dialog element is intact');
});

test('an absent required member throws rather than rendering', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<CommandPalette commands={[]} />), /`open` is required/);
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<CommandPalette open commands={undefined} />), /`commands` is required/);
});

test('the active row is the one the arrow keys point at, and it takes the accent branch of the recipe', () => {
  const html = renderToStaticMarkup(
    <CommandPalette open commands={[{ id: 'a', label: 'Deploy' }, { id: 'b', label: 'Roll back' }]} />,
  );
  assert.match(html, /class="[^"]*\bbg-primary\/14\b[^"]*"[^>]*aria-selected="true"|aria-selected="true"[^>]*class="[^"]*\bbg-primary\/14\b/,
    'the first row is active on open and wears the accent tint');
  assert.equal((html.match(/\bbg-primary\/14\b/g) || []).length, 1, 'more than one row was drawn as active');
  assert.match(html, /\bbg-transparent\b/, 'and the other row takes the quiet branch');
});
