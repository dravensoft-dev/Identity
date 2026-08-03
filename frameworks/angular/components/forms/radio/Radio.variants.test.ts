/* No DOM and no TestBed: assertions about the recipe alone. Radio and RadioGroup read ONE
 * manifest -- `Radio.manifest.json` carries the group's slot as well as the option's -- so this
 * file covers the option and RadioGroup.variants.test.ts covers the group. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { radioStyles } from './Radio.variants';

