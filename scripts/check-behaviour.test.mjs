/* Tests check:behaviour's pure half. main() itself is not imported --
 * running it would walk the real tree and call process.exit(1) on any
 * problem, which has killed a test process in this repo before. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { describeBinding } from './check-behaviour.mjs';

/* describeBinding() is what the cross-layer disagreement message renders
 * each side through. Its three shape combinations -- flat/flat, cased/cased
 * and mixed -- are the one behaviour this task changed with no other
 * machine-checked coverage; a reviewer traced them by hand once already,
 * and this pins the result so the next reader does not have to. */

const flatAlert = { pattern: 'alert', exceptions: [] };
const flatStatus = { pattern: 'status', exceptions: [] };
const casedAlert = {
  cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ],
};
const casedOther = {
  cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'status', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'alert', exceptions: [] },
  ],
};

test('describeBinding renders a flat/flat disagreement as a bare pattern name on each side', () => {
  assert.equal(describeBinding(flatAlert), 'alert');
  assert.equal(describeBinding(flatStatus), 'status');
});

test('describeBinding renders a cased/cased disagreement as "name:pattern" pairs joined by " + " on each side', () => {
  assert.equal(describeBinding(casedAlert), 'danger:alert + advisory:status');
  assert.equal(describeBinding(casedOther), 'danger:status + advisory:alert');
});

test('describeBinding renders a mixed flat/cased disagreement correctly on each side', () => {
  assert.equal(describeBinding(flatAlert), 'alert');
  assert.equal(describeBinding(casedAlert), 'danger:alert + advisory:status');
});
