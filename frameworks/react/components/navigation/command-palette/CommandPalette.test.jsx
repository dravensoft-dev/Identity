import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { CommandPalette } from '../components/navigation/CommandPalette.jsx';

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
  assert.throws(() => renderToStaticMarkup(<CommandPalette commands={[]} />), /`open` is required/);
  assert.throws(() => renderToStaticMarkup(<CommandPalette open commands={undefined} />), /`commands` is required/);
});
