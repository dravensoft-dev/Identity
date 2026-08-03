/* No DOM and no TestBed: assertions about the recipe alone, plus the two key builders beside it.
 * `footprint` and `thumb` exist because the track's box depends on BOTH orientation and size, and
 * the knob's travel on BOTH state and orientation -- genuine compound variants, flattened into
 * enumerated ones because ManifestClasses.js (the Tailwind specimen harness) supports no
 * compoundVariants. The component computes the crossed key; these tests pin how. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { footprintFor, thumbFor } from './Switch';
import { switchStyles } from './Switch.variants';

const SIZES = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

test('the default is a horizontal md switch that is off and enabled', () => {
  assert.equal(
    switchStyles().track(),
    switchStyles({
      size: 'md', orientation: 'horizontal', checked: false, disabled: false,
      footprint: 'horizontal-md', thumb: 'off-horizontal',
    }).track(),
  );
});

