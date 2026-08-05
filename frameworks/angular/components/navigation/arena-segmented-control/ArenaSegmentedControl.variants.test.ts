/* No DOM and no TestBed: assertions about the recipe alone. The one that matters most is the
 * negative -- this control carries no crimson, because it is a filter and a filter never outweighs
 * the action beside it. The selected segment lifts on the neutral surface instead. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaSegmentedControlStyles } from './ArenaSegmentedControl.variants';

test('the default is an md track with nothing selected', () => {
  assert.equal(
    arenaSegmentedControlStyles().segment(),
    arenaSegmentedControlStyles({ size: 'md', selected: false }).segment(),
  );
});

