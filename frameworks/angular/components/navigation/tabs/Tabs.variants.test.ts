/* No DOM and no TestBed. Tabs and Tab read ONE manifest -- the panel's slot lives beside the
 * tab's, because a tabpanel may not sit inside a tablist and so the two are drawn by different
 * components from the same recipe. The panel's display is the load-bearing part: it must resolve
 * to `hidden` when unselected, or every inactive panel stays on screen. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { tabsStyles } from './Tabs.variants';
import { tabStyles } from '../tab/Tab.variants';

