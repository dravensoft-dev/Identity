/* Grouping must not disturb the flat index the roving cursor and aria-activedescendant are
 * keyed by, so the order is settled once, in orderCommands, and everything else reads it.
 * Ungrouped first is the caller's escape hatch: a palette of four concatenated collections
 * has one list that belongs to none of them. */

import { useTestEnvironment } from '../../../test/TestbedEnv';
useTestEnvironment();

import test from 'node:test';
import assert from 'node:assert/strict';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Command } from '../../../Api.generated';
import { CommandPalette, capCommands, orderCommands, commandGroups } from './CommandPalette';

const COMMANDS: Command[] = [
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
  const flat: Command[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
  const groups = commandGroups(orderCommands(flat));
  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.name, null);
});

@Component({
  standalone: true,
  imports: [CommandPalette],
  template: '<arena-command-palette open [commands]="commands" />',
})
class PaletteHost { commands = COMMANDS; }

function render(): { host: Element; destroy: () => void } {
  const fixture = TestBed.createComponent(PaletteHost);
  fixture.detectChanges();
  return { host: fixture.nativeElement as Element, destroy: () => fixture.destroy() };
}

test('a named group is a role=group with that name, and the heading itself is not announced twice', () => {
  const { host, destroy } = render();
  try {
    const named = [...host.querySelectorAll('[role="group"]')].map((g) => g.getAttribute('aria-label'));
    assert.deepEqual(named, ['Actions', 'Customers']);
    const heading = host.querySelector('[role="group"] > span[aria-hidden="true"]');
    assert.equal(heading?.textContent?.trim(), 'Actions',
      'the visible heading duplicates the group name, so it is hidden rather than read again');
  } finally { destroy(); }
});

test('a command with a route renders an anchor and keeps role=option', () => {
  const { host, destroy } = render();
  try {
    const routed = host.querySelector('a[role="option"]');
    assert.equal(routed?.getAttribute('href'), '/customers/acme',
      'the anchor is what makes ctrl-click and open-in-new-tab work; the option role is what '
      + 'keeps the row inside the listbox the arrows walk');
  } finally { destroy(); }
});

test('a command with no route is still a button, so nothing navigates by accident', () => {
  const { host, destroy } = render();
  try {
    assert.equal(host.querySelectorAll('button[role="option"]').length, 4);
    assert.equal(host.querySelectorAll('a[role="option"]').length, 1);
  } finally { destroy(); }
});

test('maxResults caps the matches, and the cap runs after the search rather than before it', () => {
  const capped = capCommands(COMMANDS, 2);
  assert.deepEqual([...capped].map((c) => c.id), ['sale', 'help'],
    'the cap takes the first N of what the query matched, in the order the caller passed');

  assert.equal(capCommands(COMMANDS, undefined).length, COMMANDS.length, 'absent means no ceiling');
  assert.equal(capCommands(COMMANDS, 0).length, 0, 'zero is a ceiling of zero, not an absent one');
});

@Component({
  standalone: true,
  imports: [CommandPalette],
  template: '<arena-command-palette open [commands]="commands" [maxResults]="2" />',
})
class CappedHost { commands = COMMANDS; }

test('a capped palette renders the cap, and still groups what is left', () => {
  const fixture = TestBed.createComponent(CappedHost);
  try {
    fixture.detectChanges();
    const host = fixture.nativeElement as Element;
    assert.equal(host.querySelectorAll('[role="option"]').length, 2);
    assert.deepEqual(
      [...host.querySelectorAll('[role="option"]')].map((row) => row.textContent?.trim()),
      ['Help', 'New sale'],
      'ungrouped first, then each group as it first appears: the cap does not reorder anything',
    );
  } finally { fixture.destroy(); }
});
