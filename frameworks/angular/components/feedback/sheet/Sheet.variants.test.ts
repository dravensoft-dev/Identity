import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetStyles } from './Sheet.variants';

const PLACEMENTS = ['bottom', 'start', 'end'] as const;

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the defaults are bottom and closed, matching the component\'s own default inputs', () => {
  assert.equal(sheetStyles().root(), sheetStyles({ placement: 'bottom', open: false }).root());
});

test('a closed sheet is hidden, and an open one is not', () => {
  for (const placement of PLACEMENTS) {
    assert.ok(tokens(sheetStyles({ placement, open: false }).root()).includes('hidden'),
      `${placement}: a closed panel must not paint`);
    assert.ok(!tokens(sheetStyles({ placement, open: true }).root()).includes('hidden'),
      `${placement}: an open panel must paint`);
  }
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  for (const placement of PLACEMENTS) {
    assert.match(sheetStyles({ placement, open: true }).root(), /\bflex\b/, `${placement} lost its display utility`);
  }
});

test('every placement is fixed and sits on --z-sheet, above a fixed bar and below a menu', () => {
  for (const placement of PLACEMENTS) {
    const root = tokens(sheetStyles({ placement, open: true }).root());
    assert.ok(root.includes('fixed'), `${placement}: a static box ignores z-index entirely`);
    assert.ok(root.includes('z-sheet'), `${placement}: a sheet belongs in its own slot, not in the dropdown's`);
    assert.ok(!root.some((cls) => cls.startsWith('z-') && cls !== 'z-sheet'),
      `${placement}: exactly one stacking slot, and it is the sheet's`);
  }
});

test('a sheet is never a scrim -- no backdrop, no fixed inset-0, nothing darkened behind it', () => {
  for (const placement of PLACEMENTS) {
    const root = tokens(sheetStyles({ placement, open: true }).root());
    assert.ok(!root.includes('inset-0'), `${placement}: covering the page is what a Dialog does`);
    assert.ok(!root.some((cls) => cls.startsWith('bg-scrim') || cls.startsWith('backdrop-blur')),
      `${placement}: a sheet leaves the page usable behind it, which is its whole difference from a dialog`);
  }
});

test('each placement spans the edge it names and clears the device inset on the block axis', () => {
  const bottom = tokens(sheetStyles({ placement: 'bottom', open: true }).root());
  assert.ok(bottom.includes('start-0') && bottom.includes('end-0') && bottom.includes('bottom-0'),
    'a bottom sheet spans the inline axis and sits on the bottom edge');
  assert.ok(bottom.includes('pb-[var(--pad-safe-bottom)]'), 'a bottom sheet must clear the home indicator');

  for (const [placement, edge] of [['start', 'start-0'], ['end', 'end-0']] as const) {
    const root = tokens(sheetStyles({ placement, open: true }).root());
    assert.ok(root.includes('inset-y-0'), `${placement}: a side sheet spans the block axis`);
    assert.ok(root.includes(edge), `${placement}: and sits on its own inline edge`);
    assert.ok(root.includes('pt-[var(--pad-safe-top)]') && root.includes('pb-[var(--pad-safe-bottom)]'),
      `${placement}: a full-height panel clears both device insets`);
  }
});

test('the fold control and the close control both answer hover and focus, which is what the contract declares', () => {
  for (const slot of ['trigger', 'close'] as const) {
    const cls = sheetStyles({ open: true })[slot]();
    assert.match(cls, /\bhover:/, `${slot} declares no hover state`);
    assert.match(cls, /\bfocus-visible:/, `${slot} declares no focus state`);
  }
});

test('only the root varies with placement -- the head, controls, body and foot are constant', () => {
  const bottom = sheetStyles({ placement: 'bottom', open: true });
  const end = sheetStyles({ placement: 'end', open: true });
  for (const slot of ['head', 'trigger', 'caret', 'close', 'body', 'foot'] as const) {
    assert.equal(bottom[slot](), end[slot](), `${slot} must not vary with placement`);
  }
});
