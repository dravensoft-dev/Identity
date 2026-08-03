/* The anchored axis is why this manifest has variants at all: the same bubble is positioned by
 * the wrapper in the Tailwind specimen and by a CDK overlay pane in the Angular component, and
 * only the second one must not carry the wrapper-relative classes. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { tooltipStyles } from './Tooltip.variants';

const POSITIONING = ['absolute', 'bottom-full', 'left-1/2', '-translate-x-1/2', '-translate-y-2'];

