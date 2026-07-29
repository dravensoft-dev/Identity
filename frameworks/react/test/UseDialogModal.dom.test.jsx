/* The React half of Arena's modal focus contract, under test.
 *
 * WHAT A SUITE CAN PROVE HERE, AND WHAT IT CANNOT. happy-dom implements no
 * sequential focus navigation: a Tab keydown does not move
 * document.activeElement on its own. So a test asserting that focus did not
 * escape a panel would pass identically against a component with a perfect trap
 * and one with none -- which is why dialog-modal.test.jsx's header refuses that
 * shape. The boundary wrap is different in kind: it is an explicit .focus()
 * call made by OUR handler, and happy-dom honours .focus(). So the wrap tests
 * below discriminate, and the interior of the trap -- Tab from a middle element
 * reaching the next one -- is the browser's own and is verified in Chromium by
 * hand.
 *
 * This is the technique the Angular layer's own
 * components/feedback/onboarding/Onboarding.focusTrap.test.ts
 * uses against the module this one mirrors, and it is why the helpers are
 * exported as pure functions of a container rather than living inside the hook. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { focusableElements, focusFirstFocusable, trapTabKey } from '../UseDialogModal.js';

/* Hand-built trees, no render. This is the technique Angular's
 * Onboarding.focusTrap.test.ts uses, and it is why the helpers are exported as
 * pure functions of a container rather than living inside the hook. */
function panelWith(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

test('focusableElements skips a native control marked tabindex="-1"', () => {
  const p = panelWith('<button>a</button><button tabindex="-1">b</button><button>c</button>');
  assert.deepEqual(focusableElements(p).map((e) => e.textContent), ['a', 'c']);
});

test('focusableElements skips a disabled control', () => {
  const p = panelWith('<button>a</button><button disabled>b</button>');
  assert.deepEqual(focusableElements(p).map((e) => e.textContent), ['a']);
});

test('focusFirstFocusable falls back to the panel itself when it has none', () => {
  const p = panelWith('<p>text only</p>');
  p.setAttribute('tabindex', '-1');
  focusFirstFocusable(p);
  assert.equal(document.activeElement, p, 'a panel with no focusable child must take focus itself');
});

test('trapTabKey wraps Shift+Tab from the first focusable to the last', () => {
  const p = panelWith('<button>a</button><button>b</button><button>c</button>');
  const [first, , last] = focusableElements(p);
  first.focus();
  let prevented = false;
  trapTabKey(p, { key: 'Tab', shiftKey: true, preventDefault: () => { prevented = true; } }, first);
  assert.equal(prevented, true, 'the key at a boundary must be consumed');
  assert.equal(document.activeElement, last, 'Shift+Tab from the first did not wrap to the last');
});

test('trapTabKey wraps Tab from the last focusable to the first', () => {
  const p = panelWith('<button>a</button><button>b</button><button>c</button>');
  const [first, , last] = focusableElements(p);
  last.focus();
  trapTabKey(p, { key: 'Tab', shiftKey: false, preventDefault: () => {} }, last);
  assert.equal(document.activeElement, first, 'Tab from the last did not wrap to the first');
});

test('trapTabKey leaves a middle element alone -- the browser does that part', () => {
  const p = panelWith('<button>a</button><button>b</button><button>c</button>');
  const [, middle] = focusableElements(p);
  middle.focus();
  trapTabKey(p, { key: 'Tab', shiftKey: false, preventDefault: () => {} }, middle);
  assert.equal(document.activeElement, middle,
    'the trap must not move focus off a middle element -- native sequential navigation owns that');
});
