/* The wrapper's own failure paths. These write bindings that are deliberately
   wrong to a temp file and prove the diagnostic fires -- a check nobody has
   watched fail is a check nobody knows works. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertPatternCases } from './AssertPattern.jsx';

function bindingFile(binding) {
  const dir = mkdtempSync(join(tmpdir(), 'arena-cases-'));
  const p = join(dir, 'X.behaviour.json');
  writeFileSync(p, JSON.stringify(binding));
  return p;
}

const TWO_CASES = {
  cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ],
};

test('a suite that renders only one declared case is refused', () => {
  const p = bindingFile(TWO_CASES);
  assert.throws(
    () => assertPatternCases({ bindingPath: p, cases: { danger: () => { throw new Error('never'); } } }),
    /advisory/,
    'the missing case must be named',
  );
});

test('a case name the binding does not declare is refused', () => {
  const p = bindingFile(TWO_CASES);
  assert.throws(
    () => assertPatternCases({
      bindingPath: p,
      cases: { danger: () => ({ root: null }), advisory: () => ({ root: null }), typo: () => ({ root: null }) },
    }),
    /typo/,
  );
});

test('a flat binding cannot be asserted through the cases entry point', () => {
  const p = bindingFile({ pattern: 'status', exceptions: [] });
  assert.throws(
    () => assertPatternCases({ bindingPath: p, cases: { only: () => ({ root: null }) } }),
    /declares no cases/,
  );
});

/* validateBinding permits a binding to declare the same case name twice
   (Task 1's review left this open). Object.keys(cases) can never carry a
   duplicate, so comparing the declared-name list against the suite's keys
   would produce a confusing missing/unknown diff rather than naming the
   real problem -- the wrapper must catch this itself, before that
   comparison, and name the duplicate. */
test('a binding declaring the same case name twice is refused, not diffed', () => {
  const p = bindingFile({
    cases: [
      { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
      { name: 'danger', when: 'tone is still "danger"', pattern: 'status', exceptions: [] },
    ],
  });
  assert.throws(
    () => assertPatternCases({ bindingPath: p, cases: { danger: () => { throw new Error('never'); } } }),
    /danger/,
  );
});
