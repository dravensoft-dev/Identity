/* No DOM and no TestBed. The group reads the same `Radio.manifest.json` its options do, which is
 * why there is no RadioGroup manifest to look for -- the family shares one recipe, and the group
 * uses exactly one slot of it. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { radioGroupStyles } from './RadioGroup.variants';
import { radioStyles } from '../radio/Radio.variants';

