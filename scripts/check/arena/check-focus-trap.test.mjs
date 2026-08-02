/* The gate drives a real browser; these drive its verdict function with the walks a real trap and
 * a real defect produce. The CommandPalette case is the one that shipped: a modal panel with no
 * Tab handling at all, which every DOM-free suite passed because happy-dom has no sequential
 * focus navigation to leave the panel with. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRAPS, FOCUSABLE, walkProblems } from './check-focus-trap.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

const inside = (n) => Array.from({ length: n }, (_, i) => ({ press: i + 1, inside: true }));

test('every natively-focusable clause carries its own :not([tabindex="-1"])', () => {
  for (const clause of FOCUSABLE.split(', ')) {
    assert.match(clause, /:not\(\[tabindex="-1"\]\)$/,
      `${clause} would pull a <button tabindex="-1"> back into the tab order, because a selector list is OR'd`);
  }
});

test('the trap table names both layers, or the walk proves half of what it claims', () => {
  assert.ok(TRAPS.length > 0);
  assert.ok(TRAPS.some((t) => t.name.endsWith(':react')));
  assert.ok(TRAPS.some((t) => t.name.endsWith(':angular')));
});

test('every declared page is there, since a walk of a page that 404s reports no trap and no defect', () => {
  for (const trap of TRAPS) {
    assert.ok(existsSync(join(repoRoot, trap.page)), `${trap.name} names ${trap.page}, and nothing is there`);
  }
});

test('a trap opens from its own fixture, so no walk depends on finding a button by its copy', () => {
  for (const trap of TRAPS) {
    assert.equal(trap.open, undefined,
      `${trap.name} still clicks something open: a page whose copy moved would walk with nothing open `
      + 'and report a trap that holds');
    const fixture = JSON.parse(readFileSync(join(repoRoot, 'frameworks/demos', `${trap.name.split(':')[0]}.demo.json`), 'utf8'));
    assert.equal(fixture.seed.open, true, `${trap.name}'s fixture does not open it`);
  }
});

test('a walk that stayed inside, reached everything and wrapped both ways is clean', () => {
  assert.deepEqual(walkProblems('X', {
    panel: true, focusables: 3, startsInside: true, forward: inside(4), visited: 3,
    wrapsForward: true, wrapsBackward: true,
  }), []);
});

test('focus leaving the panel is reported with the presses it left on', () => {
  const problems = walkProblems('CommandPalette:react', {
    panel: true, focusables: 1, startsInside: true,
    forward: [{ press: 1, inside: false }, { press: 2, inside: false }],
    visited: 0, wrapsForward: false, wrapsBackward: false,
  });
  assert.match(problems[0], /focus left the panel on Tab 1, 2 -- the interior is not trapped/);
});

test('a single-stop trap is valid and is not asked to wrap between elements', () => {
  assert.deepEqual(walkProblems('Palette', {
    panel: true, focusables: 1, startsInside: true, forward: inside(2), visited: 1,
    wrapsForward: false, wrapsBackward: false,
  }), []);
});

test('a panel with no Tab stop at all fails, and a missing panel fails before anything is walked', () => {
  assert.match(walkProblems('X', { panel: true, focusables: 0 })[0], /no Tab stop at all/);
  assert.match(walkProblems('X', { panel: false })[0], /nothing was walked/);
});

test('a trap that never claimed focus on open is reported even when containment holds', () => {
  const problems = walkProblems('X', {
    panel: true, focusables: 2, startsInside: false, forward: inside(3), visited: 2,
    wrapsForward: true, wrapsBackward: true,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /did not start inside the panel/);
});
