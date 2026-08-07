/* One claim, and it is about intent rather than about this platform: the conversion is a
 * no-op wherever the separator is already a forward slash, which is why nineteen sites could
 * spell it three ways and never disagree. The test that would prove the Windows half needs
 * Windows, so what is asserted here is that a posix path survives untouched and that the
 * separator is the one thing replaced. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { join, sep } from 'node:path';
import { toPosix } from './posix-path.ts';

test('a path already spelled with forward slashes comes back unchanged', () => {
  assert.equal(toPosix('css/components/arena-badge.css'), 'css/components/arena-badge.css');
  assert.equal(toPosix(''), '');
});

test('a path built by join comes back with forward slashes whatever built it', () => {
  assert.equal(toPosix(join('css', 'components', 'arena-badge.css')), 'css/components/arena-badge.css');
});

test('every separator is replaced and not merely the first', () => {
  assert.equal(toPosix(['a', 'b', 'c'].join(sep)), 'a/b/c');
});
