import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetStyles } from './Sheet.variants';

const PLACEMENTS = ['bottom', 'start', 'end'] as const;

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('only the root varies with placement -- the head, controls, body and foot are constant', () => {
  const bottom = sheetStyles({ placement: 'bottom', open: true });
  const end = sheetStyles({ placement: 'end', open: true });
  for (const slot of ['head', 'trigger', 'caret', 'close', 'body', 'foot'] as const) {
    assert.equal(bottom[slot](), end[slot](), `${slot} must not vary with placement`);
  }
});
