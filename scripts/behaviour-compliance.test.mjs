/* Unit tests for the DOM-generic requirement evaluator. This suite runs under
 * plain node as well as bun (check-all.mjs runs scripts/ both ways), and plain
 * node has no DOM — so every element here is a hand-built stub implementing the
 * three methods the evaluator is allowed to touch. That constraint is the reason
 * the evaluator takes an element rather than a selector. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { roleOf, hasAccessibleName, isFocusable, evaluate, DECIDABLE, comparePattern } from './lib/behaviour-compliance.mjs';

/** A minimal stand-in for a DOM element. */
function el(tagName, attrs = {}) {
  return {
    tagName: tagName.toUpperCase(),
    getAttribute: (n) => (n in attrs ? String(attrs[n]) : null),
    hasAttribute: (n) => n in attrs,
  };
}

test('roleOf prefers an explicit role', () => {
  assert.equal(roleOf(el('div', { role: 'dialog' })), 'dialog');
});

test('roleOf resolves the implicit role of a native button', () => {
  assert.equal(roleOf(el('button')), 'button');
});

test('roleOf resolves input types to their distinct implicit roles', () => {
  assert.equal(roleOf(el('input', { type: 'checkbox' })), 'checkbox');
  assert.equal(roleOf(el('input', { type: 'radio' })), 'radio');
  assert.equal(roleOf(el('input', {})), 'textbox');
});

test('roleOf gives a section a role only when it is named', () => {
  assert.equal(roleOf(el('section')), null);
  assert.equal(roleOf(el('section', { 'aria-label': 'Schedule' })), 'region');
});

test('roleOf returns null for an element with no role of any kind', () => {
  assert.equal(roleOf(el('div')), null);
  assert.equal(roleOf(el('span')), null);
});

test('hasAccessibleName accepts either ARIA naming attribute', () => {
  assert.equal(hasAccessibleName(el('div', { 'aria-label': 'Loading' })), true);
  assert.equal(hasAccessibleName(el('div', { 'aria-labelledby': 'x1' })), true);
  assert.equal(hasAccessibleName(el('div')), false);
});

test('isFocusable accepts natively focusable elements and explicit tabindex', () => {
  assert.equal(isFocusable(el('button')), true);
  assert.equal(isFocusable(el('span', { tabindex: '0' })), true);
  assert.equal(isFocusable(el('span')), false);
});

test('isFocusable rejects a disabled native control and a negative tabindex', () => {
  assert.equal(isFocusable(el('button', { disabled: '' })), false);
  assert.equal(isFocusable(el('span', { tabindex: '-1' })), false);
});

test('evaluate decides roles.element against the required role value', () => {
  assert.equal(evaluate(el('div', { role: 'dialog' }), 'roles.element', 'dialog'), true);
  assert.equal(evaluate(el('div', { role: 'alertdialog' }), 'roles.element', 'dialog'), false);
});

test('evaluate credits an implicit role for roles.element', () => {
  assert.equal(evaluate(el('button'), 'roles.element', 'button'), true);
});

test('evaluate decides the aria-state requirements by attribute presence', () => {
  assert.equal(evaluate(el('div', { 'aria-modal': 'true' }), 'roles.aria-modal', 'true'), true);
  assert.equal(evaluate(el('div'), 'roles.aria-modal', 'true'), false);
  assert.equal(evaluate(el('button', { 'aria-expanded': 'false' }), 'roles.expanded', ''), true);
});

test('evaluate returns null for a requirement no single element can decide', () => {
  assert.equal(evaluate(el('div'), 'focus.trap', true), null);
  assert.equal(evaluate(el('div'), 'keyboard.Escape', 'close'), null);
  assert.equal(evaluate(el('div'), 'content.noAutoDismiss', true), null);
  assert.equal(evaluate(el('div'), 'alternative.table', 'a real <table>'), null);
});

test('DECIDABLE and evaluate agree: a decidable key never returns null', () => {
  const cases = [
    ['roles.element', el('button'), 'button'],
    ['roles.label', el('div', { 'aria-label': 'x' }), ''],
    ['roles.expanded', el('div'), ''],
    ['states.checked', el('div'), ''],
    ['live.politeness', el('div'), ''],
  ];
  for (const [key, node, value] of cases) {
    assert.ok(DECIDABLE.has(key), `${key} should be listed decidable`);
    assert.notEqual(evaluate(node, key, value), null, `${key} returned null`);
  }
});

test('DECIDABLE omits every behavioural family', () => {
  for (const key of ['focus.trap', 'focus.onOpen', 'keyboard.Escape', 'content.noAutoDismiss', 'alternative.table']) {
    assert.equal(DECIDABLE.has(key), false, `${key} should not be listed decidable`);
  }
});

/* comparePattern — the bidirectional comparison both layers share.
 *
 * It is tested here, against stub elements, rather than through a rendered React
 * tree or an Angular fixture. That is deliberate: the comparison is pure logic
 * over a parsed pattern, a parsed binding and an element, and testing it through
 * a render would make the slowest harness in the repo responsible for proving
 * the cheapest function in it. The render suites then test what only they can —
 * that a real component's DOM says what its binding claims. */

const DIALOG_MODAL = {
  name: 'dialog-modal',
  requires: {
    'roles.element': 'dialog',
    'roles.aria-modal': 'true',
    'roles.label': 'a name',
    'focus.trap': true,
    'keyboard.Escape': 'close',
  },
};

const BEHAVIOURAL = ['focus.trap', 'keyboard.Escape'];

test('comparePattern is silent when the DOM and the binding agree', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Delete' });
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [] },
    fallback: subject,
    behavioural: BEHAVIOURAL,
  });
  assert.deepEqual(problems, []);
});

test('comparePattern reports a stale exception when the requirement is met', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Delete' });
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [{ requirement: 'roles.label', reason: 'synthetic' }] },
    fallback: subject,
    behavioural: BEHAVIOURAL,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /STALE EXCEPTION/);
  assert.match(problems[0], /roles\.label/);
});

test('comparePattern reports an overclaim when a requirement is unmet and unexcepted', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true' });   // no name
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [] },
    fallback: subject,
    behavioural: BEHAVIOURAL,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /OVERCLAIM/);
  assert.match(problems[0], /roles\.label/);
});

test('comparePattern refuses an undecidable requirement that was not declared behavioural', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Delete' });
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [] },
    fallback: subject,
    behavioural: [],
  });
  assert.equal(problems.length, 2);
  for (const p of problems) assert.match(p, /not declared behavioural/);
});

test('comparePattern reports a behavioural declaration the pattern no longer has', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Delete' });
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [] },
    fallback: subject,
    behavioural: [...BEHAVIOURAL, 'focus.roving'],
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /never reached/);
  assert.match(problems[0], /focus\.roving/);
});

test('comparePattern uses a per-requirement subject over the fallback', () => {
  // The Menu case in miniature: the attribute is present in the tree, but on an
  // element that is not the one the requirement is about. Naming the subject is
  // the whole difference between a true exception and a falsely retired one.
  const wrapper = el('span', { 'aria-haspopup': 'menu' });
  const trigger = el('button');
  const pattern = { name: 'menu-button', requires: { 'roles.haspopup': 'menu' } };
  const onTrigger = comparePattern({
    pattern,
    binding: { pattern: 'menu-button', exceptions: [{ requirement: 'roles.haspopup', reason: 'on the wrapper' }] },
    subjects: { 'roles.haspopup': trigger },
    fallback: wrapper,
    behavioural: [],
  });
  assert.deepEqual(onTrigger, [], 'the exception is true when judged against the trigger');

  const onWrapper = comparePattern({
    pattern,
    binding: { pattern: 'menu-button', exceptions: [{ requirement: 'roles.haspopup', reason: 'on the wrapper' }] },
    fallback: wrapper,
    behavioural: [],
  });
  assert.equal(onWrapper.length, 1);
  assert.match(onWrapper[0], /STALE EXCEPTION/, 'and falsely stale when judged against the wrapper');
});

test('comparePattern reports a missing subject rather than throwing', () => {
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [] },
    fallback: null,
    behavioural: BEHAVIOURAL,
  });
  assert.ok(problems.length > 0);
  assert.match(problems[0], /no subject element/);
});
