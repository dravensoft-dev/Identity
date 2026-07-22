/* Unit tests for the DOM-generic requirement evaluator. This suite runs under
 * plain node as well as bun (check-all.mjs runs scripts/ both ways), and plain
 * node has no DOM — so every element here is a hand-built stub implementing the
 * four members the evaluator is allowed to touch. That constraint is the reason
 * the evaluator takes an element rather than a selector.
 *
 * It also reads behaviour/patterns/ directly. That is allowed and deliberate:
 * behaviour/ is framework-agnostic JSON, not a framework layer, and the whole
 * class of defect this suite was rewritten to catch was the evaluator's maps
 * disagreeing with the real pattern files while every stub-based test stayed
 * green. The module under test still contains no node:fs — the reading happens
 * here, where it belongs. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, basename, extname } from 'node:path';
import {
  roleOf, hasAccessibleName, isFocusable, evaluate,
  DECIDABLE, BEHAVIOURAL, ELEMENT_ROLE, LABEL_ACCEPTS_TEXT, comparePattern,
} from './lib/behaviour-compliance.mjs';

const PATTERN_DIR = join(dirname(dirname(fileURLToPath(import.meta.url))), 'behaviour', 'patterns');

/** name -> pattern, read from the real files. */
const PATTERNS = new Map(
  readdirSync(PATTERN_DIR)
    .filter((f) => extname(f) === '.json')
    .sort()
    .map((f) => [basename(f, '.json'), JSON.parse(readFileSync(join(PATTERN_DIR, f), 'utf8'))]),
);

/** A minimal stand-in for a DOM element. `text` becomes textContent, the fourth
 *  and newest member of the surface the evaluator may touch. */
function el(tagName, attrs = {}, text = '') {
  return {
    tagName: tagName.toUpperCase(),
    getAttribute: (n) => (n in attrs ? String(attrs[n]) : null),
    hasAttribute: (n) => n in attrs,
    textContent: text,
  };
}

test('roleOf prefers an explicit role', () => {
  assert.equal(roleOf(el('div', { role: 'dialog' })), 'dialog');
});

test('roleOf takes the first token of a multi-token role', () => {
  // ARIA allows a fallback list; the first supported token wins, and Arena never
  // authors a list whose first token is not the intended one.
  assert.equal(roleOf(el('div', { role: 'doc-abstract  region' })), 'doc-abstract');
  assert.equal(roleOf(el('div', { role: '  button ' })), 'button');
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

test('roleOf does not let text content name a section', () => {
  // The section branch passes acceptsText:false on purpose — text content never
  // names a landmark, and a widened hasAccessibleName must not leak in here.
  assert.equal(roleOf(el('section', {}, 'Schedule')), null);
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

test('hasAccessibleName credits text content only when asked to', () => {
  assert.equal(hasAccessibleName(el('button', {}, 'Save'), true), true);
  assert.equal(hasAccessibleName(el('button', {}, 'Save')), false, 'strict by default');
  assert.equal(hasAccessibleName(el('button', {}, '   '), true), false, 'whitespace is not a name');
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

/* ------------------------------------------------------------------ *
 * The maps against the real pattern files.
 *
 * These are the tests that would have caught the whole class of defect
 * this file was rewritten for: the evaluator's view of what a pattern
 * requires drifting from what behaviour/patterns/ actually says, with
 * every stub-based test still green.
 * ------------------------------------------------------------------ */

test('every requirement key in every pattern is DECIDABLE or BEHAVIOURAL', () => {
  const unclassified = [];
  for (const [name, pattern] of PATTERNS) {
    for (const key of Object.keys(pattern.requires ?? {})) {
      if (!DECIDABLE.has(key) && !BEHAVIOURAL.has(key)) unclassified.push(`${name}: ${key}`);
    }
  }
  assert.deepEqual(unclassified, [], 'classify these in behaviour-compliance.mjs, or fix the typo in the pattern file');
});

test('DECIDABLE and BEHAVIOURAL name no key that no pattern uses', () => {
  // The stale-entry rule, in the direction that rots silently — the same
  // invariant check-dimension-literals.mjs's EXEMPT carries, and the reason it
  // is trusted rather than merely present.
  const used = new Set();
  for (const pattern of PATTERNS.values()) for (const key of Object.keys(pattern.requires ?? {})) used.add(key);
  const stale = [...DECIDABLE, ...BEHAVIOURAL].filter((k) => !used.has(k));
  assert.deepEqual(stale, [], 'these keys are classified but required by no pattern — remove them');
});

test('DECIDABLE and BEHAVIOURAL are disjoint', () => {
  const both = [...DECIDABLE].filter((k) => BEHAVIOURAL.has(k));
  assert.deepEqual(both, []);
});

test('every pattern requiring roles.element has an ELEMENT_ROLE entry', () => {
  const missing = [...PATTERNS]
    .filter(([, p]) => 'roles.element' in (p.requires ?? {}))
    .map(([name]) => name)
    .filter((name) => !(name in ELEMENT_ROLE));
  assert.deepEqual(missing, []);
});

test('ELEMENT_ROLE names no pattern that does not require roles.element', () => {
  const stale = Object.keys(ELEMENT_ROLE).filter(
    (name) => !PATTERNS.has(name) || !('roles.element' in (PATTERNS.get(name).requires ?? {})),
  );
  assert.deepEqual(stale, []);
});

test('every pattern in LABEL_ACCEPTS_TEXT really admits text content as its name', () => {
  for (const name of LABEL_ACCEPTS_TEXT) {
    const value = PATTERNS.get(name)?.requires?.['roles.label'];
    assert.ok(value, `${name} has no roles.label requirement`);
    assert.match(String(value), /text content/i, `${name}'s roles.label prose does not mention text content`);
  }
});

test('no pattern outside LABEL_ACCEPTS_TEXT admits text content', () => {
  // The converse, so a pattern file reworded to allow text content cannot leave
  // the whitelist behind and quietly start producing false OVERCLAIMs.
  for (const [name, pattern] of PATTERNS) {
    const value = pattern.requires?.['roles.label'];
    if (!value || LABEL_ACCEPTS_TEXT.has(name)) continue;
    assert.doesNotMatch(String(value), /text content/i, `${name} now admits text content — add it to LABEL_ACCEPTS_TEXT`);
  }
});

/* ------------------------------------------------------------------ *
 * evaluate — regressions for the three defects that made correct
 * components report OVERCLAIM.
 * ------------------------------------------------------------------ */

test('evaluate resolves roles.element from the pattern, not from its prose', () => {
  // navigation's value is a whole sentence. Comparing against it made a real
  // <nav> — SideNav's root — fail its own pattern.
  const prose = PATTERNS.get('navigation').requires['roles.element'];
  assert.match(String(prose), /^navigation \(native nav/, 'the prose is still a sentence, so this test still means something');
  assert.equal(evaluate(el('nav', { 'aria-label': 'Main' }), 'roles.element', prose, 'navigation'), true);
  assert.equal(evaluate(el('div', { role: 'navigation' }), 'roles.element', prose, 'navigation'), true);
  assert.equal(evaluate(el('div'), 'roles.element', prose, 'navigation'), false);
});

test('evaluate maps menu-button roles.element to the button role', () => {
  assert.equal(evaluate(el('button'), 'roles.element', 'button', 'menu-button'), true);
  assert.equal(evaluate(el('div', { role: 'menu' }), 'roles.element', 'button', 'menu-button'), false);
});

test('evaluate throws when a pattern requires roles.element with no ELEMENT_ROLE entry', () => {
  assert.throws(
    () => evaluate(el('div'), 'roles.element', 'widget', 'invented-pattern'),
    /invented-pattern.*ELEMENT_ROLE/s,
  );
});

test('evaluate credits text content for roles.label only in the patterns that allow it', () => {
  const button = el('button', {}, 'Save');
  assert.equal(evaluate(button, 'roles.label', '', 'button'), true, 'a labelled-by-content button is named');

  const dialog = el('div', { role: 'dialog' }, 'Delete project');
  assert.equal(evaluate(dialog, 'roles.label', '', 'dialog-modal'), false,
    'dialog-modal asks for an explicit name; crediting its title text would retire a true exception');
  assert.equal(evaluate(el('div', { role: 'dialog', 'aria-label': 'Delete' }), 'roles.label', '', 'dialog-modal'), true);
});

test('evaluate decides the aria-state requirements by attribute presence', () => {
  assert.equal(evaluate(el('div', { 'aria-modal': 'true' }), 'roles.aria-modal', 'true', 'dialog-modal'), true);
  assert.equal(evaluate(el('div'), 'roles.aria-modal', 'true', 'dialog-modal'), false);
  assert.equal(evaluate(el('button', { 'aria-expanded': 'false' }), 'roles.expanded', '', 'menu-button'), true);
});

test('evaluate resolves the role-named-by-key requirements, single and array', () => {
  assert.equal(evaluate(el('div', { role: 'grid' }), 'roles.grid', '', 'grid'), true);
  assert.equal(evaluate(el('tr'), 'roles.row', '', 'grid'), true);
  // roles.cell accepts any of four roles; roles.group and roles.item likewise.
  for (const role of ['gridcell', 'columnheader', 'rowheader']) {
    assert.equal(evaluate(el('div', { role }), 'roles.cell', '', 'grid'), true, role);
  }
  assert.equal(evaluate(el('td'), 'roles.cell', '', 'grid'), true, 'the implicit cell role counts');
  assert.equal(evaluate(el('div', { role: 'row' }), 'roles.cell', '', 'grid'), false);

  assert.equal(evaluate(el('div', { role: 'radiogroup' }), 'roles.group', '', 'radiogroup'), true);
  assert.equal(evaluate(el('fieldset'), 'roles.group', '', 'radiogroup'), true);
  assert.equal(evaluate(el('div', { role: 'radio' }), 'roles.item', '', 'radiogroup'), true);
  assert.equal(evaluate(el('div', { role: 'option' }), 'roles.item', '', 'radiogroup'), true);
  assert.equal(evaluate(el('div'), 'roles.item', '', 'radiogroup'), false);
});

test('evaluate credits native checked-ness for states.checked', () => {
  // The implicit-semantics principle the module already applied to roles and had
  // failed to apply to states: a native checkbox exposes checked-ness through the
  // platform and has no aria-checked to read.
  assert.equal(evaluate(el('input', { type: 'checkbox' }), 'states.checked', '', 'checkbox'), true);
  assert.equal(evaluate(el('input', { type: 'radio' }), 'states.checked', '', 'radiogroup'), true);
  assert.equal(evaluate(el('div', { role: 'checkbox', 'aria-checked': 'false' }), 'states.checked', '', 'checkbox'), true);
  assert.equal(evaluate(el('div', { role: 'checkbox' }), 'states.checked', '', 'checkbox'), false);
  assert.equal(evaluate(el('input', { type: 'text' }), 'states.checked', '', 'checkbox'), false);
});

test('evaluate decides states.multiline from a textarea or the explicit attribute', () => {
  assert.equal(evaluate(el('textarea'), 'states.multiline', '', 'textbox'), true);
  assert.equal(evaluate(el('div', { role: 'textbox', 'aria-multiline': 'false' }), 'states.multiline', '', 'textbox'), true);
  assert.equal(evaluate(el('input'), 'states.multiline', '', 'textbox'), false);
});

test('evaluate decides live.politeness from an implicit or explicit live region', () => {
  assert.equal(evaluate(el('div', { role: 'status' }), 'live.politeness', '', 'status'), true);
  assert.equal(evaluate(el('output'), 'live.politeness', '', 'status'), true, 'the implicit status role of <output>');
  assert.equal(evaluate(el('div', { role: 'alert' }), 'live.politeness', '', 'status'), true);
  assert.equal(evaluate(el('div', { 'aria-live': 'polite' }), 'live.politeness', '', 'status'), true);
  assert.equal(evaluate(el('div'), 'live.politeness', '', 'status'), false);
});

test('evaluate returns null for a requirement no single element can decide', () => {
  assert.equal(evaluate(el('div'), 'focus.trap', true, 'dialog-modal'), null);
  assert.equal(evaluate(el('div'), 'keyboard.Escape', 'close', 'dialog-modal'), null);
  assert.equal(evaluate(el('div'), 'content.noAutoDismiss', true, 'alert'), null);
  assert.equal(evaluate(el('div'), 'alternative.table', 'a real <table>', 'figure-with-data-table'), null);
});

test('evaluate treats the conditional states as behavioural, not as presence', () => {
  // An enabled button correctly carries no aria-disabled. Reading that as unmet
  // is what produced "Button, enabled: states.disabled: OVERCLAIM" against a
  // component doing exactly the right thing.
  assert.equal(evaluate(el('button', {}, 'Save'), 'states.disabled', '', 'button'), null);
  for (const key of ['states.required', 'states.readonly', 'states.multiselectable', 'states.busy', 'states.posinset']) {
    assert.equal(evaluate(el('div'), key, '', 'textbox'), null, key);
  }
});

test('evaluate throws on an unrecognised requirement key', () => {
  // The typo case. This used to return null, comparePattern told the author to
  // declare it behavioural, and once declared the misspelt key passed forever
  // while the real requirement was never checked.
  assert.throws(() => evaluate(el('div'), 'states.chekced', '', 'checkbox'), /states\.chekced/);
  assert.throws(() => evaluate(el('div'), 'nonsense', '', 'checkbox'), /nonsense/);
});

test('DECIDABLE and evaluate agree: a decidable key never returns null', () => {
  const cases = [
    ['roles.element', el('button'), 'button', 'button'],
    ['roles.label', el('div', { 'aria-label': 'x' }), '', 'dialog-modal'],
    ['roles.expanded', el('div'), '', 'menu-button'],
    ['states.checked', el('div'), '', 'checkbox'],
    ['live.politeness', el('div'), '', 'status'],
  ];
  for (const [key, node, value, pattern] of cases) {
    assert.ok(DECIDABLE.has(key), `${key} should be listed decidable`);
    assert.notEqual(evaluate(node, key, value, pattern), null, `${key} returned null`);
  }
});

test('DECIDABLE omits every behavioural family', () => {
  for (const key of ['focus.trap', 'focus.onOpen', 'keyboard.Escape', 'content.noAutoDismiss', 'alternative.table', 'states.disabled']) {
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
    'roles.label': 'aria-labelledby or aria-label',
    'focus.trap': true,
    'keyboard.Escape': 'close',
  },
};

const BEHAVIOURAL_KEYS = ['focus.trap', 'keyboard.Escape'];

test('comparePattern is silent when the DOM and the binding agree', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Delete' });
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [] },
    fallback: subject,
    behavioural: BEHAVIOURAL_KEYS,
  });
  assert.deepEqual(problems, []);
});

test('comparePattern treats a binding with no exceptions field as having none', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true' });   // no name
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal' },   // no `exceptions` key at all
    fallback: subject,
    behavioural: BEHAVIOURAL_KEYS,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /OVERCLAIM/);
});

test('comparePattern reports a stale exception when the requirement is met', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Delete' });
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [{ requirement: 'roles.label', reason: 'synthetic' }] },
    fallback: subject,
    behavioural: BEHAVIOURAL_KEYS,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /STALE EXCEPTION/);
  assert.match(problems[0], /roles\.label/);
});

test('comparePattern reports an overclaim when a requirement is unmet and unexcepted', () => {
  const subject = el('div', { role: 'dialog', 'aria-modal': 'true' }, 'Delete project');
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [] },
    fallback: subject,
    behavioural: BEHAVIOURAL_KEYS,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /OVERCLAIM/);
  assert.match(problems[0], /roles\.label/);
});

test('comparePattern is silent for a correct button, which is the case it used to fail', () => {
  // Every one of these requirements is met by a plain native <button> with a
  // text label, and Button's binding declares no exception. Before ELEMENT_ROLE
  // and LABEL_ACCEPTS_TEXT this produced three false OVERCLAIMs, and the cheapest
  // way to silence them would have been to fabricate exceptions into the binding.
  const button = PATTERNS.get('button');
  const problems = comparePattern({
    pattern: button,
    binding: { pattern: 'button', exceptions: [] },
    fallback: el('button', {}, 'Save'),
    behavioural: ['keyboard.Space', 'keyboard.Enter', 'states.disabled'],
  });
  assert.deepEqual(problems, []);
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
    behavioural: [...BEHAVIOURAL_KEYS, 'focus.roving'],
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

test('comparePattern reports a missing subject once per requirement', () => {
  const problems = comparePattern({
    pattern: DIALOG_MODAL,
    binding: { pattern: 'dialog-modal', exceptions: [] },
    fallback: null,
    behavioural: BEHAVIOURAL_KEYS,
  });
  // The exact count, not `> 0` — one message per requirement, plus one per
  // declared behavioural key, because a requirement skipped for want of a
  // subject never marks its key used. Both halves are correct and both are worth
  // pinning: a rendered-nothing suite should hear about everything at once
  // rather than one requirement per run.
  const missing = problems.filter((p) => /no subject element/.test(p));
  const unreached = problems.filter((p) => /never reached/.test(p));
  assert.equal(missing.length, Object.keys(DIALOG_MODAL.requires).length);
  assert.equal(unreached.length, BEHAVIOURAL_KEYS.length);
  assert.equal(problems.length, missing.length + unreached.length);
});
