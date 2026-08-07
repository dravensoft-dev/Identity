/* No DOM and no TestBed: assertions about the recipe alone. ArenaRadio and ArenaRadioGroup read ONE
 * manifest -- `ArenaRadio.manifest.json` carries the group's slot as well as the option's -- so this
 * file covers the option and ArenaRadioGroup.variants.test.ts covers the group. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaRadioStyles } from './ArenaRadio.variants';

