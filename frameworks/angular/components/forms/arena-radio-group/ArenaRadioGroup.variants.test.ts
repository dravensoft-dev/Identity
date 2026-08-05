/* No DOM and no TestBed. The group reads the same `ArenaRadio.manifest.json` its options do, which is
 * why there is no ArenaRadioGroup manifest to look for -- the family shares one recipe, and the group
 * uses exactly one slot of it. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaRadioGroupStyles } from './ArenaRadioGroup.variants';
import { arenaRadioStyles } from '../arena-radio/ArenaRadio.variants';

