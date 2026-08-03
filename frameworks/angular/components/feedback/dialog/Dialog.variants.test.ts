import test from 'node:test';
import assert from 'node:assert/strict';
import { dialogStyles } from './Dialog.variants';

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('only the scrim varies with open -- the panel and its interior slots are constant', () => {
  const closed = dialogStyles({ open: false });
  const open = dialogStyles({ open: true });
  for (const slot of ['panel', 'head', 'eyebrow', 'title', 'body', 'foot'] as const) {
    assert.equal(closed[slot](), open[slot](), `${slot} must not vary with open`);
  }
});

