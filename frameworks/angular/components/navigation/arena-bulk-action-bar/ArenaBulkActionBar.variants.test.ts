import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaBulkActionBarStyles } from './ArenaBulkActionBar.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the count, number, divider and clear slots do not vary with destructive or open', () => {
  const a = arenaBulkActionBarStyles({ destructive: true, open: true });
  const b = arenaBulkActionBarStyles({ destructive: false, open: false });
  for (const slot of ['count', 'number', 'divider', 'clear'] as const) {
    assert.equal(a[slot](), b[slot](), `${slot} must not vary with destructive or open`);
  }
});

