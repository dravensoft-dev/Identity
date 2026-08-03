import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmDialogStyles } from './ConfirmDialog.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the panel and head/foot/body slots carry no destructive-driven classes -- the fill is scoped to the confirm button and eyebrow alone', () => {
  const routine = confirmDialogStyles({ destructive: false });
  const destructive = confirmDialogStyles({ destructive: true });
  for (const slot of ['panel', 'head', 'body', 'foot'] as const) {
    assert.equal(routine[slot](), destructive[slot](), `${slot} must not vary with destructive`);
  }
});

