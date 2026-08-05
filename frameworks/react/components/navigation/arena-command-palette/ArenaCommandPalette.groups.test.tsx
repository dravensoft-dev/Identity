/* Grouping must not disturb the flat index the roving cursor and aria-activedescendant are
 * keyed by, so the order is settled once, in orderCommands, and everything else reads it.
 * Ungrouped first is the caller's escape hatch: a palette of four concatenated collections
 * has one list that belongs to none of them. */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArenaCommandPalette, capCommands, orderCommands, commandGroups } from './ArenaCommandPalette.tsx';
import type { ArenaCommand } from '../../../Api.generated';

const COMMANDS: ArenaCommand[] = [
  { id: 'sale', label: 'New sale', group: 'Actions' },
  { id: 'help', label: 'Help' },
  { id: 'acme', label: 'Acme Corp', group: 'Customers', route: '/customers/acme' },
  { id: 'pay', label: 'Take payment', group: 'Actions' },
  { id: 'about', label: 'About' },
];

test('ungrouped commands come first, then each group in the order it first appears', () => {
  assert.deepEqual(
    orderCommands(COMMANDS).map((c) => c.id),
    ['help', 'about', 'sale', 'pay', 'acme'],
  );
});

test('a group is one contiguous run, and every row keeps its index in the ordered list', () => {
  const groups = commandGroups(orderCommands(COMMANDS));
  assert.deepEqual(groups.map((g) => g.name), [null, 'Actions', 'Customers']);
  assert.deepEqual(groups.flatMap((g) => g.rows.map((r) => r.index)), [0, 1, 2, 3, 4],
    'the index is what the roving cursor and aria-activedescendant are keyed by, so it must '
    + 'stay the position in the ordered list rather than the position within a group');
});

test('a list with no groups at all is one unnamed run, which is the shape it always had', () => {
  const flat: ArenaCommand[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
  const groups = commandGroups(orderCommands(flat));
  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.name, null);
});

test('a named group is a role=group with that name, and the heading itself is not announced twice', () => {
  const html = renderToStaticMarkup(<ArenaCommandPalette open commands={COMMANDS} />);
  assert.match(html, /role="group" aria-label="Actions"/);
  assert.match(html, /role="group" aria-label="Customers"/);
  assert.match(html, /aria-hidden="true"[^>]*>Actions</,
    'the visible heading duplicates the group name, so it is hidden rather than read again');
});

test('a command with a route renders an anchor and keeps role=option', () => {
  const html = renderToStaticMarkup(<ArenaCommandPalette open commands={COMMANDS} />);
  assert.match(html, /<a href="\/customers\/acme"[^>]*role="option"/,
    'the anchor is what makes ctrl-click and open-in-new-tab work; the option role is what '
    + 'keeps the row inside the listbox the arrows walk');
});

test('a command with no route is still a button, so nothing navigates by accident', () => {
  const html = renderToStaticMarkup(<ArenaCommandPalette open commands={COMMANDS} />);
  assert.match(html, /<button type="button"[^>]*role="option"/);
});

test('maxResults caps the matches, and the cap runs after the search rather than before it', () => {
  assert.deepEqual([...capCommands(COMMANDS, 2)].map((c) => c.id), ['sale', 'help'],
    'the cap takes the first N of what the query matched, in the order the caller passed');
  assert.equal(capCommands(COMMANDS, undefined).length, COMMANDS.length, 'absent means no ceiling');
  assert.equal(capCommands(COMMANDS, 0).length, 0, 'zero is a ceiling of zero, not an absent one');
});

test('a capped palette renders the cap, and still groups what is left', () => {
  const html = renderToStaticMarkup(
    <ArenaCommandPalette open commands={COMMANDS} maxResults={2} onClose={() => {}} />,
  );
  assert.equal(html.match(/role="option"/g)?.length, 2);
  assert.ok(html.indexOf('Help') < html.indexOf('New sale'),
    'ungrouped first, then each group as it first appears: the cap does not reorder anything');
});
