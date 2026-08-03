/* No DOM and no TestBed: these are assertions about the recipe alone. The tone tests exist
 * because tailwind-merge drops an unregistered suffix, so a size utility can lose silently
 * to a variant's own padding -- see Tv.ts's ARENA_SPACING_SUFFIXES. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buttonStyles } from './Button.variants';

