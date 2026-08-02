import test from 'node:test';
import assert from 'node:assert/strict';
import { toastHostStyles } from './ToastHost.variants';

const PLACEMENTS = ['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const;

function tokens(classString: string): string[] {
  return classString.split(/\s+/).filter(Boolean);
}

test('the default placement is bottom-end, matching the component\'s own default input', () => {
  assert.equal(toastHostStyles().root(), toastHostStyles({ placement: 'bottom-end' }).root());
});

test('the root slot carries a display utility, so the host is never the UA-default inline box', () => {
  for (const placement of PLACEMENTS) {
    assert.match(toastHostStyles({ placement }).root(), /\bflex\b/, `${placement} lost its display utility`);
  }
});

test('every placement is fixed, a column, and on --z-toast', () => {
  for (const placement of PLACEMENTS) {
    const root = tokens(toastHostStyles({ placement }).root());
    assert.ok(root.includes('fixed'), `${placement}: a static box ignores z-index entirely`);
    assert.ok(root.includes('flex-col'), `${placement}: the stack is a column`);
    assert.ok(root.includes('z-toast'), `${placement}: the stack sits above every other overlay`);
    assert.ok(root.includes('gap-3'), `${placement}: the air between two notices is the same everywhere`);
  }
});

test('every placement pins one block edge and one inline edge, and never both ends of either axis', () => {
  const expected = {
    'top-start': ['top-', 'start-'],
    'top-end': ['top-', 'end-'],
    'bottom-start': ['bottom-', 'start-'],
    'bottom-end': ['bottom-', 'end-'],
  } as const;
  for (const placement of PLACEMENTS) {
    const root = tokens(toastHostStyles({ placement }).root());
    for (const prefix of expected[placement]) {
      assert.ok(root.some((cls) => cls.startsWith(prefix)),
        `${placement} did not pin ${prefix} in "${root.join(' ')}"`);
    }
    const opposite = placement.startsWith('top') ? 'bottom-' : 'top-';
    assert.ok(!root.some((cls) => cls.startsWith(opposite)),
      `${placement} pinned both block edges, which stretches the stack across the viewport`);
  }
});

test('a bottom placement clears the device inset and a top one clears its own -- neither retypes a number', () => {
  for (const placement of ['bottom-start', 'bottom-end'] as const) {
    assert.match(toastHostStyles({ placement }).root(), /max\(var\(--sp-6\),var\(--pad-safe-bottom\)\)/,
      `${placement} would land under the home indicator`);
  }
  for (const placement of ['top-start', 'top-end'] as const) {
    assert.match(toastHostStyles({ placement }).root(), /max\(var\(--sp-6\),var\(--pad-safe-top\)\)/,
      `${placement} would land under the notch`);
  }
});

test('the inline standoff is the same step at every corner, and it is a scale step rather than a literal', () => {
  for (const placement of PLACEMENTS) {
    const root = tokens(toastHostStyles({ placement }).root());
    assert.ok(root.includes('start-6') || root.includes('end-6'),
      `${placement} standing off by something other than --sp-6: "${root.join(' ')}"`);
  }
});
