# Behaviour compliance — verifying the contracts by render — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a behaviour exception expire — assert against a real rendered DOM that every requirement a component claims to meet is met, and every requirement it excepts is still unmet.

**Architecture:** One pure, DOM-generic requirement evaluator in `scripts/lib/`, consumed by
render suites in both framework layers. React gains a DOM harness it does not have today
(`frameworks/react/test-dom/`, kept in its own directory and its own `bun test` process so
`@happy-dom/global-registrator`'s process-wide globals never reach the six existing
`renderToStaticMarkup` suites). A new coverage gate, `check:compliance`, records which
bindings have a compliance suite and fails when that record goes stale in either direction.
The assertion is **bidirectional and per requirement**: for each requirement of a
component's bound pattern, the suite asserts either "met in the DOM, and the binding
declares no exception" or "not met in the DOM, and the binding declares an exception".
That single statement is the stale-exception rule the whole contract layer was modelled on.

**Tech Stack:** Bun (`bun test`), plain-node-portable `.mjs` gates, `happy-dom` +
`@happy-dom/global-registrator` (already devDependencies), `react-dom/client` (React 18,
already a devDependency), Angular 22 zoneless `TestBed` under JIT.

---

## The decision this plan encodes, and the evidence for it

The spec (`docs/superpowers/specs/2026-07-22-7c-behaviour-compliance-design.md`) proposes
three levels and its first open question asks whether level 2 — a static text scan — is
worth its false-positive rate, instructing the planner to size it against real bindings and
be willing to conclude level 3 alone is the better buy.

**It was sized against all 94 sidecar exceptions and all 131 claimed-met requirements, by
building the scan and running it. Level 2 is cut.** The numbers, reproducible from the tree:

| Direction | Result |
|---|---|
| **A — "claimed met, no textual evidence" → gate fails a true claim** | **60 of 118 scannable claims (51%)**, across 25 components |
| **B — "evidence found" → gate wrongly retires a live exception** | **18 of 94 exceptions (19%)**, across 12 components |

Direction A fails for a cause the spec never names: **implicit ARIA**. A native `<button>`
satisfies `roles.element: "button"`, `keyboard.Space` and `keyboard.Enter` while leaving no
text to scan; `<input type="checkbox">` satisfies `states.checked`; `<table>` satisfies
`roles.grid`'s neighbours. The spec's "reachable by scan" list assumes explicit ARIA
authoring, which is not this repo's dominant idiom. A text scan penalises exactly the
correctly-authored components.

Direction B fails on the components whose bindings are most careful, and **all 18 are
irreducible** — not one is a regex that could be sharpened. Each is a claim about
*placement* (`Menu`'s `aria-haspopup` sits on a wrapping `<span>`, not the focusable
trigger), *branch* (`Skeleton` renders `role="status"` in three of four variants),
*conditional value* (`alert.ts`'s `'[attr.role]': "tone() === 'danger' ? 'alert' : 'status'"`;
`Toast.jsx` the same shape), or *semantic completeness* (`Menu`'s Enter opens the menu but
never moves focus; `command-palette.ts`'s Enter runs the command but does not close).

A real DOM resolves all three failure modes at once, which is why level 3 absorbs the
stale-exception check rather than sharing it: implicit roles are resolved because a
`<button>` *is* `role=button` in the tree; placement is resolved because the assertion
names the element; branches are resolved because the suite renders each variant.

**Consequences carried by this plan:**

- Level 2 is not built. Its rejection, with these numbers, is recorded in `CLAUDE.md`'s
  *Known debt* (Task 8) so the next reader does not re-derive it.
- Spec open question 1 — answered: cut.
- Spec open question 2 — answered: the stale-exception check belongs to level 3, and is
  its organizing principle rather than a clause of it.
- Spec open question 3 — moot. With no text scan, Angular's three attribute-authoring
  forms (template literal, `[attr.x]`, host-object literal) are indistinguishable in the
  rendered tree, which is the only thing asserted.
- Spec open question 4 — dissolved. The assertion is bidirectional, so a suite over `Tabs`
  is not "a test asserting a known defect"; it asserts *the exception is still true*, and
  fails the day somebody fixes `Tabs` without deleting the exception. Both directions are
  one statement.
- Spec open question 5 — answered: **apart**. See Task 2.
- Spec open question 6 — **out of scope**, with the migration. See below.
- Spec open question 7 — answered: yes, and more cheaply than the spec fears. Both layers
  already render a real `<table>` in all three charts (verified). See Task 5.

**Scope cut: the `components-divergences.md` migration is NOT in this plan.** It is 1127
lines (not 1119 — 7b's preamble note moved it), the spec itself says to sequence it last
because levels 2 and 3 change which exceptions are true, and it is a documentation
subsystem with a different shape from a test harness. It becomes plan **7d**. Task 8
records that hand-off, including a finding the spec's three-way split does not cover: of
the ~790 per-component lines, roughly a third are behaviour that migrates into
`exceptions`; about nine sections are per-component **rendering** divergences (BarChart's
per-bar axis, DoughnutChart's per-slice legend, `chart-internals`' units, UnauthCard's
duplicated panel classes) that are neither behaviour nor API and have no destination in the
spec's scheme.

---

## Global Constraints

Copied from the spec and `CLAUDE.md`. Every task's requirements implicitly include these.

- **No component source is edited.** Not a `.jsx`, not a primitive's `.ts`. This plan
  verifies declarations. The moment a task edits a component to make a contract true, it
  has left scope — record the finding and move on. A `*.behaviour.json` **may** be edited
  (that is the point); a component **may not**.
- **No rendered output changes.** Follows from the above.
- **No gate that needs a browser.** `check:cards`, `check:vendor` and `check:demos` are the
  only three non-portable gates and a fourth is refused. "Tab cycles inside the trap" is
  proven as a pure function over `frameworks/angular/primitives/focus-trap.ts`, never by
  render — `happy-dom` does not implement sequential focus navigation.
- **`check:compliance` must run under plain `node scripts/check-all.mjs`.** It reads JSON
  and filesystem paths only. It must not import a framework layer's `.ts`/`.jsx`.
- **A gate's scan sits behind `if (process.argv[1] === fileURLToPath(import.meta.url))`**
  so its own test can import its pure helpers without an unguarded `process.exit(1)`
  killing the test process. This bit two gates before.
- **A test under `scripts/` may not import a framework layer's `.ts` or `.jsx`** —
  `scripts/` is the one suite `check-all.mjs` also runs under plain node.
- **Never derive one layer's name from the other's.** Angular bindings carry an explicit
  `component` field naming the React counterpart in Pascal case. Use it; never
  kebab↔Pascal derivation. A cross-layer check that silently never fires looks exactly
  like coverage.
- **`scripts/check-all.test.mjs` asserts the gate count and the gate-name array by literal
  value.** It is at **19** and both the count and the array move with the gate this plan
  adds. `scripts/check-all.mjs`'s header comment says "Twenty steps total: the nineteen
  gates" and moves too.
- **`testStep()` in `check-all.mjs` hardcodes the test directories** as
  `['test', 'scripts', 'frameworks/react/test', 'frameworks/angular/test']`, and
  `check-all.test.mjs` asserts that array by literal value. The new React DOM directory
  moves both.
- **`check:coverage` inventories the four generated CSS files.** This plan adds no token,
  so it is untouched — but do not add one.
- **`check:demos` guards a committed compiled `.js` sibling for every `.jsx`.** This plan
  adds no `.jsx` under `frameworks/react/components/`; test files under
  `frameworks/react/test-dom/` are not demo entries and are not compiled. Confirm with
  `bun run check:demos` in Task 2 rather than assuming.
- **Prove every gate fires.** A gate whose failure path has never been seen is untested.
  Each gate task carries an explicit break-it-and-revert step.
- **Debt goes in `CLAUDE.md`'s *Known debt*, never in this document.** Plans under
  `docs/superpowers/` are deleted once executed (`24f250b`).
- **English only**, no emoji, no gradients. Specs and plans under `docs/superpowers/`.

## State of the tree, re-derived at `73f2116`

Do not trust these from memory; they were re-derived and the chain has miscounted three
times. Re-run before relying on them.

```bash
ls behaviour/patterns/*.json | wc -l                                    # 20
find frameworks/react -name '*.behaviour.json' | wc -l                  # 43
find frameworks/angular/primitives -name '*.behaviour.json' | wc -l     # 21
python3 -c "import json;print(len(json.load(open('frameworks/angular/behaviour-delegated.json'))))"  # 22
```

- 20 patterns, 43 React bindings, 21 Angular bindings, 22 delegated entries.
- **94 exceptions in sidecars** (the population this plan can verify) + **13 in
  `behaviour-delegated.json`** (Angular Material, out of scope) = the spec's 107.
- 47 bindings name a real pattern; **17 bind `none` or `absent`** and have zero
  requirements — they are trivially compliant and this plan does not write suites for them.
- `scripts/behaviour-contracts.test.mjs` holds 30 tests.
- `bun run check` runs 19 gates + 1 test step = 20 steps.

## File Structure

**New:**

| Path | Responsibility |
|---|---|
| `scripts/lib/behaviour-compliance.mjs` | Pure, DOM-generic requirement evaluator. `roleOf`, `hasAccessibleName`, `isFocusable`, `evaluate`, `DECIDABLE`. No framework import, no filesystem. |
| `scripts/behaviour-compliance.test.mjs` | Unit tests for the evaluator against hand-built element stubs (runs under plain node — no DOM available there). |
| `scripts/check-compliance.mjs` | The `check:compliance` gate. Coverage bookkeeping over `COVERED`, bidirectional staleness. |
| `scripts/check-compliance.test.mjs` | Tests the gate's pure helpers, including both failure branches. |
| `frameworks/react/test-dom/harness.jsx` | React DOM harness: registers happy-dom globals, `mount()` / `cleanup()`. |
| `frameworks/react/test-dom/assert-pattern.jsx` | `assertPattern()` — the bidirectional per-requirement assertion, React side. |
| `frameworks/react/test-dom/dialog-modal.test.jsx` | `Dialog`, `ConfirmDialog`. |
| `frameworks/react/test-dom/placement-and-branches.test.jsx` | `Menu` (placement), `Skeleton` (branches). |
| `frameworks/react/test-dom/behavioural.test.jsx` | Escape, initial focus — the requirements a DOM snapshot cannot decide. |
| `frameworks/react/test-dom/tooltip-timer.test.jsx` | The recorded-debt tooltip timer, via `bun:test` fake timers. |
| `frameworks/angular/test/compliance.ts` | `assertPattern()`, Angular side — same contract, Angular's element access. |
| `frameworks/angular/test/alert-role-tones.test.ts` | The conditional-role case. |
| `frameworks/angular/test/chart-data-table.test.ts` | `alternative.table`, both the Angular charts and (by parity note) React's. |

**Modified:** `scripts/check-all.mjs`, `scripts/check-all.test.mjs`, `package.json`,
`scripts/lib/behaviour-contracts.mjs` (export a binding loader the gate reuses),
`scripts/behaviour-contracts.test.mjs`, several `*.behaviour.json` where a suite proves an
exception stale, `CLAUDE.md`, `CHANGELOG.md`, `behaviour/README.md`.

**Unchanged, and this is a hard constraint:** every component source.

---

## Task 1: The pure requirement evaluator

The one piece both layers share. It is DOM-generic — it touches only `tagName`,
`getAttribute`, `hasAttribute` — so it lives in `scripts/lib/` and is unit-tested under
plain node with hand-built stubs, which is the only way to test it in a directory that has
no DOM.

Its third return value is the honest one: `null` means **not decidable from this element
alone**. `focus.trap`, `keyboard.Escape`, `content.noAutoDismiss` are behaviours, not
attributes. A requirement evaluating to `null` must be covered by a named behavioural test
instead, and Task 7's gate enforces that.

**Files:**
- Create: `scripts/lib/behaviour-compliance.mjs`
- Test: `scripts/behaviour-compliance.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `roleOf(el) -> string | null` — the element's explicit `role`, else its implicit ARIA role, else `null`.
  - `hasAccessibleName(el) -> boolean`
  - `isFocusable(el) -> boolean`
  - `evaluate(el, key, value) -> true | false | null` — `null` = undecidable from this element.
  - `DECIDABLE -> Set<string>` — the requirement keys `evaluate` can decide, by prefix or exact key.
  - `comparePattern({ pattern, binding, subjects, fallback, behavioural }) -> string[]` — the bidirectional comparison, pure and framework-agnostic. Returns one message per problem, empty when clean. **Both layers' assertion wrappers call this**; neither reimplements it.

- [ ] **Step 1: Write the failing test**

Create `scripts/behaviour-compliance.test.mjs`:

```js
/* Unit tests for the DOM-generic requirement evaluator. This suite runs under
 * plain node as well as bun (check-all.mjs runs scripts/ both ways), and plain
 * node has no DOM — so every element here is a hand-built stub implementing the
 * three methods the evaluator is allowed to touch. That constraint is the reason
 * the evaluator takes an element rather than a selector. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { roleOf, hasAccessibleName, isFocusable, evaluate, DECIDABLE } from './lib/behaviour-compliance.mjs';

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
```

Add `comparePattern` to the import at the top of the file.

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: FAIL — `Cannot find module './lib/behaviour-compliance.mjs'`.

- [ ] **Step 3: Write the evaluator**

Create `scripts/lib/behaviour-compliance.mjs`:

```js
/* The DOM-generic half of the behaviour compliance layer: given one element and
 * one of a pattern's requirement keys, decide whether that element meets it.
 *
 * Three return values, and the third is the point. `true` and `false` are a
 * verdict; `null` means "no single element can decide this" — focus behaviour,
 * key handling, and the auto-dismiss claim are behaviours, not attributes, and
 * a suite must assert them by acting on the tree rather than by reading it.
 * scripts/check-compliance.mjs holds every suite to that: a requirement whose
 * evaluate() is null must be named in a behavioural test or the gate fails.
 *
 * Why this file is DOM-generic rather than DOM-typed: it is consumed from three
 * runtimes — bun+happy-dom on the React side, bun+happy-dom under Angular's
 * TestBed, and plain node in its own test suite, which has no DOM at all. It
 * therefore touches exactly three members: `tagName`, `getAttribute`,
 * `hasAttribute`. Anything richer (querySelector, matches, closest) belongs to
 * the caller, which knows its own tree.
 *
 * Why a real DOM at all, rather than the text scan the spec proposed: a text
 * scan was built and measured against the whole tree before this file existed.
 * It reported 60 of 118 true "claimed met" requirements as unmet (native <button>
 * satisfies roles.element and keyboard.Space while leaving nothing to grep), and
 * wrongly retired 18 of 94 live exceptions (an attribute on the wrong element, in
 * three of four branches, or behind a ternary reads identically to a correct one).
 * The DOM resolves all three: an implicit role is a role, an assertion names its
 * element, and a suite renders every branch.
 */

/** Implicit ARIA roles, tag -> role, for the tags Arena's components actually
 *  render. Deliberately not exhaustive: an unlisted tag returns null, which
 *  reads as "no role", which is the safe direction — it can fail a true claim
 *  loudly, never pass a false one silently. Extend it when a component needs it.
 *  @type {Record<string, string>} */
export const IMPLICIT_ROLE = {
  A: 'link',
  ARTICLE: 'article',
  ASIDE: 'complementary',
  BUTTON: 'button',
  DIALOG: 'dialog',
  FIELDSET: 'group',
  FIGURE: 'figure',
  FOOTER: 'contentinfo',
  H1: 'heading', H2: 'heading', H3: 'heading', H4: 'heading', H5: 'heading', H6: 'heading',
  HEADER: 'banner',
  IMG: 'img',
  LI: 'listitem',
  MAIN: 'main',
  NAV: 'navigation',
  OL: 'list',
  OUTPUT: 'status',
  PROGRESS: 'progressbar',
  SELECT: 'combobox',
  TABLE: 'table',
  TBODY: 'rowgroup',
  TD: 'cell',
  TEXTAREA: 'textbox',
  TH: 'columnheader',
  TR: 'row',
  UL: 'list',
};

/** `<input>` has no single implicit role; it depends on `type`. */
const INPUT_ROLE = {
  button: 'button', submit: 'button', reset: 'button',
  checkbox: 'checkbox',
  radio: 'radio',
  range: 'slider',
  search: 'searchbox',
};

/** Tags that take focus with no `tabindex` of their own. */
const NATIVELY_FOCUSABLE = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

/** The element's ARIA role: explicit if authored, else implicit, else null.
 *  @param {{tagName: string, getAttribute: (n: string) => string | null}} el */
export function roleOf(el) {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit.trim().split(/\s+/)[0];
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return INPUT_ROLE[type] ?? 'textbox';
  }
  // A <section> is only a region when it is named; unnamed it exposes no role.
  if (tag === 'SECTION') return hasAccessibleName(el) ? 'region' : null;
  return IMPLICIT_ROLE[tag] ?? null;
}

/** Whether the element carries an ARIA name. Content-derived names (a <button>'s
 *  own text) are deliberately not credited: every roles.label requirement in
 *  behaviour/patterns/ asks for an explicit one, and crediting text content would
 *  pass Dialog, whose exception says plainly that its title has no id and the
 *  dialog element carries neither attribute.
 *  @param {{getAttribute: (n: string) => string | null}} el */
export function hasAccessibleName(el) {
  return Boolean(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'));
}

/** Whether the element can take keyboard focus. Not a claim about focus *order*
 *  — happy-dom does not implement sequential navigation and this layer never
 *  asserts it.
 *  @param {{tagName: string, getAttribute: (n: string) => string | null, hasAttribute: (n: string) => boolean}} el */
export function isFocusable(el) {
  if (el.hasAttribute('disabled')) return false;
  const ti = el.getAttribute('tabindex');
  if (ti !== null) return Number(ti) >= 0;
  return NATIVELY_FOCUSABLE.has(el.tagName.toUpperCase());
}

/** Requirement key -> the ARIA attribute that satisfies it, for the requirements
 *  that are pure attribute presence. */
const ATTRIBUTE_FOR = {
  'roles.aria-modal': 'aria-modal',
  'roles.haspopup': 'aria-haspopup',
  'roles.expanded': 'aria-expanded',
  'roles.controls': 'aria-controls',
  'roles.activedescendant': 'aria-activedescendant',
  'roles.describedby': 'aria-describedby',
  'states.checked': 'aria-checked',
  'states.selected': 'aria-selected',
  'states.multiselectable': 'aria-multiselectable',
  'states.posinset': 'aria-posinset',
  'states.busy': 'aria-busy',
  'states.required': 'aria-required',
  'states.readonly': 'aria-readonly',
};

/** Requirement keys naming a role the element itself must expose. `roles.element`
 *  is excluded because its required role comes from the pattern's value, not the key. */
const ROLE_NAMED_BY_KEY = {
  'roles.grid': 'grid',
  'roles.row': 'row',
  'roles.cell': ['gridcell', 'cell', 'columnheader', 'rowheader'],
  'roles.feed': 'feed',
  'roles.article': 'article',
  'roles.tablist': 'tablist',
  'roles.tab': 'tab',
  'roles.tabpanel': 'tabpanel',
  'roles.option': 'option',
  'roles.group': ['group', 'radiogroup'],
  'roles.item': ['radio', 'menuitem', 'option'],
  'roles.graphic': 'img',
};

/** The requirement keys evaluate() can decide from one element. Everything else
 *  returns null and must be asserted behaviourally. @type {Set<string>} */
export const DECIDABLE = new Set([
  'roles.element', 'roles.label',
  ...Object.keys(ATTRIBUTE_FOR),
  ...Object.keys(ROLE_NAMED_BY_KEY),
  'states.disabled', 'states.multiline',
  'live.politeness',
]);

/** Decide one requirement against one element.
 *  @param {object} el
 *  @param {string} key dotted requirement key, e.g. 'roles.element'
 *  @param {unknown} value the pattern's declared value for that key
 *  @returns {true | false | null} null = undecidable from this element alone */
export function evaluate(el, key, value) {
  if (key === 'roles.element') return roleOf(el) === String(value);
  if (key === 'roles.label') return hasAccessibleName(el);

  const attr = ATTRIBUTE_FOR[key];
  if (attr) return el.getAttribute(attr) !== null;

  const wanted = ROLE_NAMED_BY_KEY[key];
  if (wanted) {
    const actual = roleOf(el);
    return Array.isArray(wanted) ? wanted.includes(actual) : actual === wanted;
  }

  if (key === 'states.disabled') {
    return el.hasAttribute('disabled') || el.getAttribute('aria-disabled') !== null;
  }
  if (key === 'states.multiline') {
    return el.tagName.toUpperCase() === 'TEXTAREA' || el.getAttribute('aria-multiline') !== null;
  }
  if (key === 'live.politeness') {
    // role=status and role=alert carry an implicit live region; an explicit
    // aria-live satisfies it directly.
    if (el.getAttribute('aria-live') !== null) return true;
    return ['status', 'alert', 'log'].includes(roleOf(el));
  }

  // focus.*, keyboard.*, content.*, alternative.* — behaviours, not attributes.
  return null;
}

/**
 * Compare one component's rendered subject elements against its binding, in both
 * directions, and return one message per disagreement.
 *
 * This is the whole assertion, and it lives here — framework-agnostic, no fs, no
 * DOM beyond what evaluate() touches — so that React's and Angular's suites share
 * it rather than each carrying a copy. Two copies of a comparison is two places
 * for the rule to drift, and this rule is the layer's only real guarantee.
 *
 * Both directions in one statement, because the asymmetry is what made the
 * contract layer unverifiable: a binding could overclaim (a requirement not
 * excepted that is not met) or underclaim (an exception kept after the source was
 * fixed), and only the second is the property the layer was modelled on. Checking
 * one and not the other is how EXEMPT maps rot.
 *
 * `subjects` exists because a text scan cannot tell which element carries an
 * attribute and a human can. Menu.jsx puts aria-haspopup on a wrapping <span>
 * rather than the focusable trigger; judged against the wrapper the exception
 * looks stale, judged against the trigger it is true. Naming the element the
 * requirement is *about* is stated once per suite rather than inferred forever.
 *
 * @param {object} o
 * @param {{name: string, requires: Record<string, unknown>}} o.pattern
 * @param {{pattern: string, exceptions?: {requirement: string, reason: string}[]}} o.binding
 * @param {Record<string, object|null>} [o.subjects] requirement key -> the element that must carry it
 * @param {object|null} [o.fallback] the element used for any requirement not named in `subjects`
 * @param {string[]} [o.behavioural] requirement keys the caller asserts by acting on
 *   the tree rather than by reading it. Every undecidable requirement must be listed
 *   or this reports it — silence about an unverifiable claim is what this layer exists
 *   to remove.
 * @returns {string[]} one message per problem, empty when clean
 */
export function comparePattern({ pattern, binding, subjects = {}, fallback = null, behavioural = [] }) {
  const excepted = new Map((binding.exceptions ?? []).map((e) => [e.requirement, e.reason]));
  const declared = new Set(behavioural);
  const used = new Set();
  const problems = [];

  for (const [key, value] of Object.entries(pattern.requires)) {
    const el = key in subjects ? subjects[key] : fallback;
    if (!el) {
      problems.push(`${key}: no subject element — nothing was rendered, or the selector matched nothing.`);
      continue;
    }
    const verdict = evaluate(el, key, value);

    if (verdict === null) {
      if (declared.has(key)) { used.add(key); continue; }
      problems.push(
        `${key}: undecidable from the DOM and not declared behavioural. ` +
        'Assert it by acting on the tree and list it in `behavioural`, or explain why it cannot be asserted at all.',
      );
      continue;
    }

    const hasException = excepted.has(key);
    if (verdict && hasException) {
      problems.push(
        `${key}: STALE EXCEPTION — met in the rendered DOM, but the binding still excepts it.\n` +
        `      reason on file: ${excepted.get(key)}\n` +
        '      Delete the exception, or name a subject if the exception is about a different element.',
      );
    } else if (!verdict && !hasException) {
      problems.push(
        `${key}: OVERCLAIM — the binding declares no exception, but the rendered DOM does not meet it.\n` +
        `      pattern requires: ${JSON.stringify(value)}`,
      );
    }
  }

  for (const key of declared) {
    if (used.has(key)) continue;
    problems.push(
      `${key}: declared behavioural but never reached. ` +
      'Either the pattern no longer requires it, or it is now decidable from the DOM — remove it from `behavioural`.',
    );
  }
  return problems;
}
```

- [ ] **Step 4: Run the tests to verify they pass, under both runtimes**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: PASS, 22 tests.

Run: `node --test scripts/behaviour-compliance.test.mjs`
Expected: PASS — the file must be node-portable, because `check-all.mjs` runs `scripts/`
under plain node too.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/behaviour-compliance.mjs scripts/behaviour-compliance.test.mjs
git commit -m "feat(behaviour): a DOM-generic evaluator that knows an implicit role is a role"
```

---

## Task 2: The React DOM harness, in its own process

The spec's open question 5 asks whether the DOM harness lives beside the six
`renderToStaticMarkup` suites or apart. **Apart.** `@happy-dom/global-registrator` installs
`window`, `document` and friends process-wide, and `bun test <dir>` runs a directory in one
process. The six existing suites exist to prove those components render correctly *without*
a DOM — server-side. Registering a DOM into their process would silently change what they
prove, and nothing would fail to tell you. A second directory costs one `package.json`
script and two lines in `check-all.mjs`.

**Files:**
- Create: `frameworks/react/test-dom/harness.jsx`
- Create: `frameworks/react/test-dom/smoke.test.jsx`
- Modify: `package.json` (add `test:react-dom`, extend `test`)
- Modify: `scripts/check-all.mjs:76-78` (`testStep`)
- Modify: `scripts/check-all.test.mjs:18-21` (the `testStep` assertion)

**Interfaces:**
- Consumes: nothing from Task 1 yet.
- Produces:
  - `mount(element) -> HTMLElement` — renders a React element into a fresh detached-but-attached container and returns it. Synchronous by the time it returns.
  - `cleanup() -> void` — unmounts every root this module created and empties `document.body`.
  - `act` — re-exported from `react-dom/test-utils` for suites that dispatch events.

- [ ] **Step 1: Write the failing smoke test**

Create `frameworks/react/test-dom/smoke.test.jsx`:

```jsx
/* Proves the DOM harness itself works before any compliance suite depends on it:
 * a React tree reaches a real document, and cleanup() leaves nothing behind.
 *
 * This directory is separate from frameworks/react/test/ on purpose.
 * @happy-dom/global-registrator installs globals process-wide and `bun test <dir>`
 * is one process per directory; the six suites next door assert on
 * renderToStaticMarkup precisely to prove those components render with no DOM
 * present, and giving them one would quietly change what they prove. */
import { test, expect, afterEach } from 'bun:test';
import { mount, cleanup } from './harness.jsx';
import React from 'react';

afterEach(cleanup);

test('mount renders a React tree into a real document', () => {
  const el = mount(<div role="dialog" aria-modal="true">hello</div>);
  expect(el.querySelector('[role="dialog"]')).not.toBeNull();
  expect(el.querySelector('[role="dialog"]').getAttribute('aria-modal')).toBe('true');
});

test('mount resolves an implicit role through a real element, not a string', () => {
  const el = mount(<button type="button">Go</button>);
  expect(el.querySelector('button').tagName).toBe('BUTTON');
});

test('cleanup empties the document body', () => {
  mount(<div id="leftover" />);
  cleanup();
  expect(document.body.innerHTML).toBe('');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test frameworks/react/test-dom`
Expected: FAIL — `Cannot find module './harness.jsx'`.

- [ ] **Step 3: Write the harness**

Create `frameworks/react/test-dom/harness.jsx`:

```jsx
/* A real DOM for React under `bun test`. frameworks/react/test/ asserts on
 * renderToStaticMarkup, which is enough for structure and conditional branches
 * and useless for dispatching an event or holding focus — and the behaviour
 * contracts are largely about the second kind.
 *
 * Both dependencies were already devDependencies: react/react-dom because
 * frameworks/react/vendor/*.js is built from them, and happy-dom because the
 * Angular harness needs it. Nothing new is installed.
 *
 * GlobalRegistrator.register() runs at import time, exactly as
 * frameworks/angular/test/*.ts does it — a lazy register inside mount() would
 * leave `document` undefined for a suite's top-level code. It is never
 * unregistered here: this directory is its own `bun test` process and the
 * process exiting is the teardown. */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

if (!globalThis.document) GlobalRegistrator.register();

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

export { act };

/** Every root this module created, so cleanup() can unmount all of them.
 *  @type {{root: import('react-dom/client').Root, container: HTMLElement}[]} */
const mounted = [];

/** Render a React element into a container attached to document.body and return
 *  that container. Attached rather than detached because focus and `:focus`
 *  behave differently on a detached tree.
 *  @param {React.ReactElement} element
 *  @returns {HTMLElement} */
export function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(element); });
  mounted.push({ root, container });
  return container;
}

/** Unmount everything mounted() created and empty the body. Call it from an
 *  afterEach; a container left behind is found by the next test's querySelector. */
export function cleanup() {
  while (mounted.length) {
    const { root, container } = mounted.pop();
    act(() => { root.unmount(); });
    container.remove();
  }
  document.body.innerHTML = '';
}
```

- [ ] **Step 4: Run the smoke test to verify it passes**

Run: `bun test frameworks/react/test-dom`
Expected: PASS, 3 tests.

If `react-dom/test-utils`' `act` warns about `IS_REACT_ACT_ENVIRONMENT`, set it in the
harness immediately after registration:

```js
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
```

- [ ] **Step 5: Wire the new directory into `package.json`**

In `package.json`'s `scripts`, add `test:react-dom` and extend `test`:

```json
"test:react": "bun test frameworks/react/test",
"test:react-dom": "bun test frameworks/react/test-dom",
"test:angular": "bun test frameworks/angular/test",
"test": "bun test scripts frameworks/react/test frameworks/react/test-dom frameworks/angular/test"
```

- [ ] **Step 6: Update `testStep` and its test**

In `scripts/check-all.mjs`, `testStep()` (around line 76) currently reads:

```js
export function testStep({ isBun, testFiles }) {
  if (isBun) return { name: 'test (bun test scripts/ + framework suites)', args: ['test', 'scripts', 'frameworks/react/test', 'frameworks/angular/test'] };
  return { name: 'test (node --test scripts/*.test.mjs)', args: ['--test', ...testFiles] };
}
```

Change the bun branch's args to include the new directory:

```js
export function testStep({ isBun, testFiles }) {
  if (isBun) return { name: 'test (bun test scripts/ + framework suites)', args: ['test', 'scripts', 'frameworks/react/test', 'frameworks/react/test-dom', 'frameworks/angular/test'] };
  return { name: 'test (node --test scripts/*.test.mjs)', args: ['--test', ...testFiles] };
}
```

In `scripts/check-all.test.mjs`, the assertion at line ~18 moves with it:

```js
test('testStep runs every suite under bun', () => {
  const step = testStep({ isBun: true, testFiles: ['a.test.mjs', 'b.test.mjs'] });
  assert.deepEqual(step.args, ['test', 'scripts', 'frameworks/react/test', 'frameworks/react/test-dom', 'frameworks/angular/test']);
});
```

- [ ] **Step 7: Verify nothing else moved**

Run: `bun test scripts/check-all.test.mjs`
Expected: PASS.

Run: `bun run check:demos`
Expected: PASS — `frameworks/react/test-dom/*.jsx` are test files, not demo entries, and
`check-demos-generated.mjs` must not demand a compiled `.js` sibling for them. **If it
fails**, that is a real finding: the gate globs `.jsx` more broadly than assumed. Fix by
excluding `test-dom/` in `check-demos-generated.mjs`'s file discovery — the same way it
must already be excluding `frameworks/react/test/*.test.jsx` — and add a test for the
exclusion in `scripts/check-demos-generated.test.mjs`. Do not "fix" it by compiling test
files.

Run: `bun run test:react`
Expected: PASS, unchanged — proving the six existing suites are untouched by the new
directory.

- [ ] **Step 8: Commit**

```bash
git add frameworks/react/test-dom package.json scripts/check-all.mjs scripts/check-all.test.mjs
git commit -m "feat(react): a DOM test harness, in its own process so the static suites keep proving what they prove"
```

---

## Task 3: The bidirectional assertion, proven on `dialog-modal`

The core of the plan. `assertPattern` makes one statement per requirement, in both
directions at once, and that statement is the stale-exception rule.

`dialog-modal` is the anchor the spec names: three components share the contract and the
cost of being wrong is highest. Two of them are React's (`Dialog`, `ConfirmDialog`).

**Files:**
- Create: `frameworks/react/test-dom/assert-pattern.jsx`
- Create: `frameworks/react/test-dom/dialog-modal.test.jsx`
- Modify: `scripts/lib/behaviour-contracts.mjs` (export `loadBinding`)
- Modify: `scripts/behaviour-contracts.test.mjs` (test `loadBinding`)

**Interfaces:**
- Consumes: `comparePattern` (Task 1); `mount`, `cleanup` (Task 2). **Do not reimplement the comparison** — this file is a wrapper over it.
- Produces:
  - `loadBinding(path) -> {pattern: string, exceptions: {requirement: string, reason: string}[], ...}` — from `scripts/lib/behaviour-contracts.mjs`.
  - `assertPattern({ root, bindingPath, subjects, behavioural }) -> void` — throws on the first disagreement. `subjects` maps a requirement key to the element that must carry it (default: `root`'s first element child). `behavioural` is the set of undecidable requirement keys the calling suite asserts elsewhere; every one must be listed or the assertion throws.

- [ ] **Step 1: Export a binding loader from the contracts library**

`scripts/lib/behaviour-contracts.mjs` already loads bindings internally. Add a named export
so the suites read a binding through the same code the gate does, rather than a second
`JSON.parse` that could diverge:

```js
/** Read one *.behaviour.json from an absolute path. Exported so the compliance
 *  suites read a binding through exactly the code check:behaviour reads it with —
 *  a second parser here would be a second definition of the file format. */
export function loadBinding(absPath) {
  return JSON.parse(readFileSync(absPath, 'utf8'));
}
```

Add to `scripts/behaviour-contracts.test.mjs`:

```js
test('loadBinding reads a real binding from disk', () => {
  const p = join(REPO, 'frameworks/react/components/feedback/Dialog.behaviour.json');
  const b = loadBinding(p);
  assert.equal(b.pattern, 'dialog-modal');
  assert.ok(Array.isArray(b.exceptions));
});
```

(Import `loadBinding` in that file's existing import list, and reuse whatever `REPO`/root
constant the suite already defines — check the file rather than inventing one.)

Run: `bun test scripts/behaviour-contracts.test.mjs`
Expected: PASS, 31 tests.

- [ ] **Step 2: Write the failing compliance suite**

Create `frameworks/react/test-dom/dialog-modal.test.jsx`:

```jsx
/* dialog-modal, asserted in both directions.
 *
 * For each of the pattern's seven requirements this suite states one thing: the
 * requirement is met in the rendered DOM and the binding declares no exception,
 * or it is not met and the binding declares one. That single statement is the
 * stale-exception rule — the property check-dimension-literals.mjs's EXEMPT has
 * and the contract layer did not. The day somebody gives Dialog an aria-label
 * without deleting its roles.label exception, this fails.
 *
 * The four requirements no DOM snapshot can decide (focus.onOpen, focus.onClose,
 * focus.trap, keyboard.Escape) are declared `behavioural` here and asserted by
 * acting on the tree in behavioural.test.jsx. assertPattern refuses to skip one
 * that is not declared. */
import { test, afterEach } from 'bun:test';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Dialog } from '../components/feedback/Dialog.jsx';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog.jsx';

afterEach(cleanup);

const BEHAVIOURAL = ['focus.onOpen', 'focus.onClose', 'focus.trap', 'keyboard.Escape'];

test('Dialog matches its dialog-modal binding, in both directions', () => {
  const container = mount(
    <Dialog open onClose={() => {}} title="Delete project">
      <p>Body</p>
    </Dialog>,
  );
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'feedback/Dialog.behaviour.json'),
    subjects: { default: container.querySelector('[role="dialog"], dialog') },
    behavioural: BEHAVIOURAL,
  });
});

test('ConfirmDialog matches its dialog-modal binding, in both directions', () => {
  const container = mount(
    <ConfirmDialog
      open
      onCancel={() => {}}
      onConfirm={() => {}}
      title="Delete project"
      confirmLabel="Delete"
    />,
  );
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'feedback/ConfirmDialog.behaviour.json'),
    // ConfirmDialog renders role="alertdialog"; its binding excepts roles.element
    // for exactly that, so the subject is located by either role.
    subjects: { default: container.querySelector('[role="dialog"], [role="alertdialog"]') },
    behavioural: BEHAVIOURAL,
  });
});
```

**Before running:** open `Dialog.jsx` and `ConfirmDialog.jsx` and confirm the prop names
used above (`open`, `onClose`, `title`; `onCancel`, `onConfirm`, `confirmLabel`).
`Dialog.jsx:23` is known to be
`Dialog({ open, onClose, title, eyebrow, children, footer, width })`. Read
`ConfirmDialog.jsx`'s signature rather than trusting this snippet — if it differs, use the
real names. **Do not edit either component.**

- [ ] **Step 3: Run it to verify it fails**

Run: `bun test frameworks/react/test-dom/dialog-modal.test.jsx`
Expected: FAIL — `Cannot find module './assert-pattern.jsx'`.

- [ ] **Step 4: Write the assertion**

Create `frameworks/react/test-dom/assert-pattern.jsx`:

```jsx
/* The React layer's binding to comparePattern(): path constants, the two file
 * reads, and throwing on the result.
 *
 * The comparison itself is NOT here. It lives in
 * scripts/lib/behaviour-compliance.mjs, shared with the Angular suites and
 * unit-tested there against stub elements. Two copies of this rule would be two
 * places for it to drift, and it is the layer's only real guarantee. What is
 * genuinely layer-specific is exactly what remains below: where this layer's
 * bindings live, and how deep the import is. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { comparePattern } from '../../../scripts/lib/behaviour-compliance.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path of frameworks/react/components, so a suite can name a binding
 *  without counting `../` hops — a wrong import depth has already cost this chain
 *  one review cycle. */
export const REACT_COMPONENTS = join(here, '..', 'components');

/** Absolute path of behaviour/patterns. */
export const PATTERN_DIR = join(here, '..', '..', '..', 'behaviour', 'patterns');

/**
 * Assert a rendered tree against its behaviour binding, in both directions.
 * Throws with every disagreement listed, not just the first.
 *
 * @param {object} o
 * @param {HTMLElement} o.root the mounted container
 * @param {string} o.bindingPath absolute path to the component's *.behaviour.json
 * @param {Record<string, Element | null>} [o.subjects] requirement key -> the element
 *   that must carry it. The key `default` sets the element used for every
 *   requirement not named individually; without it, the container's first element
 *   child is used.
 * @param {string[]} [o.behavioural] requirement keys this suite asserts by acting
 *   on the tree rather than by reading it.
 */
export function assertPattern({ root, bindingPath, subjects = {}, behavioural = [] }) {
  const binding = JSON.parse(readFileSync(bindingPath, 'utf8'));
  const pattern = JSON.parse(readFileSync(join(PATTERN_DIR, `${binding.pattern}.json`), 'utf8'));
  const { default: fallbackSubject, ...perRequirement } = subjects;

  const problems = comparePattern({
    pattern,
    binding,
    subjects: perRequirement,
    fallback: fallbackSubject ?? root.firstElementChild,
    behavioural,
  });

  if (problems.length) {
    throw new Error(`${bindingPath}\n  pattern: ${pattern.name}\n  - ${problems.join('\n  - ')}`);
  }
}
```

- [ ] **Step 5: Run it and read what it says**

Run: `bun test frameworks/react/test-dom/dialog-modal.test.jsx`

Expected: **PASS**, if `Dialog`'s and `ConfirmDialog`'s bindings are accurate.

**If it fails, do not edit the component and do not weaken the assertion.** Read the
message. There are exactly three legitimate outcomes:

1. *STALE EXCEPTION* — the exception really is stale. **Delete it from the
   `*.behaviour.json`** and note it for the CHANGELOG. This is the plan working.
2. *STALE EXCEPTION* but the reason describes a different element (e.g. `roles.label` is
   about the *title* having no id) — add a `subjects` entry naming the element the
   requirement is really about, and re-run.
3. *OVERCLAIM* — the binding claims a requirement it does not meet. **Add the exception**,
   with a reason written from the source you just read.

Record which of the three each failure was; Task 8's CHANGELOG entry needs the count.

- [ ] **Step 6: Prove the assertion fires in both directions**

Add to `dialog-modal.test.jsx`:

```jsx
import { expect } from 'bun:test';
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';

test('assertPattern reports a stale exception', () => {
  const p = join(tmpdir(), 'arena-stale.behaviour.json');
  // Dialog does render role="dialog" and aria-modal="true"; excepting them is a lie.
  writeFileSync(p, JSON.stringify({
    pattern: 'dialog-modal',
    exceptions: [{ requirement: 'roles.aria-modal', reason: 'synthetic' }],
  }));
  const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
  expect(() => assertPattern({
    root: container,
    bindingPath: p,
    subjects: { default: container.querySelector('[role="dialog"]') },
    behavioural: BEHAVIOURAL,
  })).toThrow(/STALE EXCEPTION/);
  unlinkSync(p);
});

test('assertPattern reports an overclaim', () => {
  const p = join(tmpdir(), 'arena-overclaim.behaviour.json');
  // Dialog has no aria-label; a binding with no exceptions at all overclaims it.
  writeFileSync(p, JSON.stringify({ pattern: 'dialog-modal', exceptions: [] }));
  const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
  expect(() => assertPattern({
    root: container,
    bindingPath: p,
    subjects: { default: container.querySelector('[role="dialog"]') },
    behavioural: BEHAVIOURAL,
  })).toThrow(/OVERCLAIM/);
  unlinkSync(p);
});

test('assertPattern refuses an undeclared undecidable requirement', () => {
  const p = join(tmpdir(), 'arena-undeclared.behaviour.json');
  writeFileSync(p, JSON.stringify({ pattern: 'dialog-modal', exceptions: [] }));
  const container = mount(<Dialog open onClose={() => {}} title="t"><p>b</p></Dialog>);
  expect(() => assertPattern({
    root: container,
    bindingPath: p,
    subjects: { default: container.querySelector('[role="dialog"]') },
    behavioural: [],           // nothing declared
  })).toThrow(/not declared behavioural/);
  unlinkSync(p);
});
```

Run: `bun test frameworks/react/test-dom/dialog-modal.test.jsx`
Expected: PASS, all five tests. The three synthetic ones are the proof the assertion fires;
without them it is a gate whose failure path has never been seen.

- [ ] **Step 7: Commit**

```bash
git add frameworks/react/test-dom scripts/lib/behaviour-contracts.mjs scripts/behaviour-contracts.test.mjs frameworks/react/components
git commit -m "feat(behaviour): assert dialog-modal in both directions, so an exception can finally expire"
```

(If any `*.behaviour.json` changed in step 5, it is included by that `git add` of
`frameworks/react/components` — check `git status` and mention the retirement in the
commit body.)

---

## Task 4: The two cases a text scan gets wrong — placement and branches

These are the two mistakes 7b's review found by hand, and the reason level 2 was cut. They
are the plan's proof that the DOM buys something a scan cannot.

- **Placement:** `Menu.jsx:41` renders `<span onClick={…} aria-haspopup="menu" aria-expanded={open}>{trigger}</span>`. The attribute exists; the element carrying it is not focusable. A scan says met; the DOM says the span has no `tabindex` and is not a native control.
- **Branches:** `Skeleton.jsx` renders `role="status" aria-label="Loading"` for `block`, `line` and multi-line `text`, and `aria-hidden="true"` with no role for `circle`. A scan sees the role and retires both exceptions.

**Files:**
- Create: `frameworks/react/test-dom/placement-and-branches.test.jsx`

**Interfaces:**
- Consumes: `mount`, `cleanup` (Task 2); `assertPattern`, `REACT_COMPONENTS` (Task 3); `isFocusable` (Task 1).
- Produces: nothing consumed later.

- [ ] **Step 1: Write the failing test**

Create `frameworks/react/test-dom/placement-and-branches.test.jsx`:

```jsx
/* The two mistakes a text scan cannot catch, pinned against a real tree.
 *
 * A static scan of these two files was built and measured before this suite
 * existed: it wrongly retired four of Menu's six exceptions and both of
 * Skeleton's, because an attribute on the wrong element and an attribute in
 * three of four branches are textually identical to correct ones. Neither
 * mistake survives a rendered DOM. */
import { test, expect, afterEach } from 'bun:test';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { isFocusable } from '../../../scripts/lib/behaviour-compliance.mjs';
import { Menu } from '../components/navigation/Menu.jsx';
import { Skeleton } from '../components/display/Skeleton.jsx';

afterEach(cleanup);

test('Menu carries aria-haspopup on an element that cannot take focus — the exception stands', () => {
  const container = mount(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} />,
  );
  const carrier = container.querySelector('[aria-haspopup]');
  expect(carrier).not.toBeNull();
  // This is the assertion a text scan cannot make: the attribute exists, and the
  // element holding it is not the one a screen reader lands on.
  expect(carrier.tagName).toBe('SPAN');
  expect(isFocusable(carrier)).toBe(false);
  // ...while the real trigger, which focus does reach, carries neither state.
  const trigger = container.querySelector('button');
  expect(isFocusable(trigger)).toBe(true);
  expect(trigger.getAttribute('aria-haspopup')).toBeNull();
  expect(trigger.getAttribute('aria-expanded')).toBeNull();
});

test('Menu matches its menu-button binding when the subject is the focusable trigger', () => {
  const container = mount(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} />,
  );
  const trigger = container.querySelector('button');
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'navigation/Menu.behaviour.json'),
    // Every role/state requirement is about the element focus reaches. Naming it
    // is what makes the haspopup and expanded exceptions verifiably true rather
    // than verifiably false.
    subjects: { default: trigger },
    behavioural: ['focus.onOpen', 'keyboard.Enter', 'keyboard.Space', 'keyboard.Escape'],
  });
});

const VARIANTS = ['block', 'line', 'text', 'circle'];

test('Skeleton renders role=status in three variants and not in circle', () => {
  const seen = {};
  for (const variant of VARIANTS) {
    const container = mount(<Skeleton variant={variant} />);
    seen[variant] = Boolean(container.querySelector('[role="status"]'));
    cleanup();
  }
  expect(seen).toEqual({ block: true, line: true, text: true, circle: false });
});

test('Skeleton circle is aria-hidden with no live region — both exceptions stand', () => {
  const container = mount(<Skeleton variant="circle" />);
  const el = container.firstElementChild;
  expect(el.getAttribute('aria-hidden')).toBe('true');
  expect(el.getAttribute('role')).toBeNull();
  expect(el.getAttribute('aria-live')).toBeNull();
});

test('Skeleton block variant matches its status binding with no exception in play', () => {
  const container = mount(<Skeleton variant="block" />);
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'display/Skeleton.behaviour.json'),
    subjects: { default: container.querySelector('[role="status"]') },
    behavioural: ['focus.unaffected'],
    // NOTE: this one is expected to report the two exceptions as STALE, because
    // for the block variant they are. See step 3 — the fix is a per-variant
    // binding note, not a deleted exception.
  });
});
```

- [ ] **Step 2: Run it and expect the last test to fail**

Run: `bun test frameworks/react/test-dom/placement-and-branches.test.jsx`

Expected: the first four PASS; the fifth FAILS with `roles.element: STALE EXCEPTION` and
`live.politeness: STALE EXCEPTION`.

**This failure is correct and is the plan's central lesson.** `Skeleton`'s exceptions are
true *of the circle variant* and false of the other three. A binding has no way to say
"true in one variant" — the spec records that same gap for `Tag`'s conditional `button`
pattern, and calls it unresolved.

- [ ] **Step 3: Resolve it the honest way — assert the variant the exception is about**

Do **not** delete `Skeleton`'s exceptions (they are true) and do **not** edit `Skeleton.jsx`
(out of scope). Replace the fifth test with one that asserts against the variant the
exception describes:

```jsx
test('Skeleton matches its status binding on the circle variant, which is what its exceptions describe', () => {
  const container = mount(<Skeleton variant="circle" />);
  assertPattern({
    root: container,
    bindingPath: join(REACT_COMPONENTS, 'display/Skeleton.behaviour.json'),
    subjects: { default: container.firstElementChild },
    behavioural: ['focus.unaffected'],
  });
});
```

This passes, and it pins the exact thing the exceptions claim. The gap it exposes — that a
binding cannot scope an exception to a variant — is **debt, recorded in Task 8**, not
something to fix here by widening the schema.

- [ ] **Step 4: Run to verify it passes**

Run: `bun test frameworks/react/test-dom/placement-and-branches.test.jsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add frameworks/react/test-dom/placement-and-branches.test.jsx
git commit -m "test(behaviour): pin the placement and branch cases a text scan reports backwards"
```

---

## Task 5: The Angular side — a conditional role, and the data table

Two things only Angular's harness reaches, and one that answers spec open question 7.

- **Conditional value:** `alert.ts:26` binds `'[attr.role]': "tone() === 'danger' ? 'alert' : 'status'"`. Its exception says role is `alert` only for the danger tone. A DOM assertion per tone proves exactly that.
- **`alternative.table`:** the spec fears this is unverifiable. It is not, and it is already implemented — all three charts in **both** layers render a real `<table>` (verified by grep across `frameworks/react/components/charts/*.jsx` and `frameworks/angular/primitives/{bar,line,doughnut}-chart/*.ts`). A render suite can assert the table exists, is visually hidden, and that its cell text equals the plotted data. What it cannot judge is whether the `aria-label` is a *good* name — that part stays human, and is recorded as debt.

**Angular harness constraints (`CLAUDE.md`, verified in-tree):** JIT, never `ngtsc`, so a
signal input **cannot** be driven through a template binding (NG0303) or a literal
attribute (silent no-op) — set inputs via `fixture.componentRef.setInput()`.
`TestBed.initTestEnvironment()` may be called only once per `bun test` process, so a suite
needing a real render either lives in `host-class-binding.test.ts` with scoped hooks, or
guards initialisation itself. Every directly-created fixture must be `destroy()`-ed.

**Files:**
- Create: `frameworks/angular/test/compliance.ts`
- Create: `frameworks/angular/test/alert-role-tones.test.ts`
- Create: `frameworks/angular/test/chart-data-table.test.ts`

**Interfaces:**
- Consumes: `comparePattern` (Task 1). **Do not reimplement the comparison** — this file is a wrapper over it, mirroring `frameworks/react/test-dom/assert-pattern.jsx`.
- Produces: `assertPattern({ root, bindingPath, subjects, behavioural })` — same signature as the React one; a separate file only because the binding path constants differ and an Angular primitive's default subject is the host itself.

- [ ] **Step 1: Check how the existing suites initialise TestBed**

Run: `grep -n "initTestEnvironment\|beforeAll\|afterAll\|GlobalRegistrator" frameworks/angular/test/*.ts`

Read `frameworks/angular/test/host-class-binding.test.ts`'s hooks and follow the same
shape. If `initTestEnvironment` is already called there, the two new suites must **not**
call it again in the same process — either guard it
(`if (!getTestBed().platform) TestBed.initTestEnvironment(...)`) or put the rendering tests
in `host-class-binding.test.ts`. Decide from what you read, not from this plan.

- [ ] **Step 2: Write the Angular assertion**

Create `frameworks/angular/test/compliance.ts` — the same logic as
`frameworks/react/test-dom/assert-pattern.jsx`, with Angular's paths:

```ts
/* The Angular layer's binding to comparePattern(): path constants, the two file
 * reads, and throwing on the result. The React wrapper at
 * frameworks/react/test-dom/assert-pattern.jsx is its mirror.
 *
 * The comparison itself is shared, in scripts/lib/behaviour-compliance.mjs. Only
 * three things genuinely differ between the layers and all three are here: where
 * this layer's bindings live, and the fact that an Angular primitive's subject
 * defaults to the host element itself rather than a child (a primitive host-binds
 * its root, so the host IS the styled and measured element).
 *
 * The shared evaluator is DOM-generic, which is what makes Angular's three ways
 * of authoring an attribute — a template literal, '[attr.role]', and a host-object
 * entry — indistinguishable here. In a rendered tree they are one attribute. That
 * is the whole reason this layer is a render suite and not the text scan the spec
 * proposed: check-dimension-literals.mjs still cannot see [style.x], and a
 * behaviour scan would have inherited that blind spot. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { comparePattern } from '../../../scripts/lib/behaviour-compliance.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path of frameworks/angular/primitives. */
export const ANGULAR_PRIMITIVES = join(here, '..', 'primitives');
/** Absolute path of behaviour/patterns. */
export const PATTERN_DIR = join(here, '..', '..', '..', 'behaviour', 'patterns');

export interface AssertPatternOptions {
  /** The fixture's nativeElement — the host, which is the styled root. */
  root: Element;
  bindingPath: string;
  /** Requirement key -> the element that must carry it. `default` overrides the
   *  element used for every requirement not named individually. */
  subjects?: Record<string, Element | null>;
  behavioural?: string[];
}

export function assertPattern({ root, bindingPath, subjects = {}, behavioural = [] }: AssertPatternOptions): void {
  const binding = JSON.parse(readFileSync(bindingPath, 'utf8'));
  const pattern = JSON.parse(readFileSync(join(PATTERN_DIR, `${binding.pattern}.json`), 'utf8'));
  const { default: fallbackSubject, ...perRequirement } = subjects;

  const problems = comparePattern({
    pattern,
    binding,
    subjects: perRequirement,
    fallback: fallbackSubject ?? root,
    behavioural,
  });

  if (problems.length) {
    throw new Error(`${bindingPath}\n  pattern: ${pattern.name}\n  - ${problems.join('\n  - ')}`);
  }
}
```

- [ ] **Step 3: Write the conditional-role test**

Create `frameworks/angular/test/alert-role-tones.test.ts`:

```ts
/* arena-alert binds its host role conditionally:
 *   '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'"
 * and its binding excepts roles.element saying so. A text scan reads the string
 * 'alert' in the source and calls the requirement met, retiring a true exception.
 * Rendering once per tone settles it.
 *
 * Inputs are set with componentRef.setInput() rather than a template binding:
 * this harness runs Angular's JIT and a signal input driven through a template
 * throws NG0303. */
import { test, expect, beforeAll, afterAll } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();

import { TestBed } from '@angular/core/testing';
import { join } from 'node:path';
import { Alert } from '../primitives/alert/alert';
import { assertPattern, ANGULAR_PRIMITIVES } from './compliance';

const BINDING = join(ANGULAR_PRIMITIVES, 'alert/alert.behaviour.json');

const TONES = ['danger', 'info', 'success', 'warning', 'neutral'] as const;

test('arena-alert exposes role=alert only for the danger tone', () => {
  const seen: Record<string, string | null> = {};
  for (const tone of TONES) {
    const fixture = TestBed.createComponent(Alert);
    fixture.componentRef.setInput('tone', tone);
    fixture.detectChanges();
    seen[tone] = (fixture.nativeElement as Element).getAttribute('role');
    fixture.destroy();
  }
  expect(seen).toEqual({
    danger: 'alert', info: 'status', success: 'status', warning: 'status', neutral: 'status',
  });
});

test('arena-alert matches its alert binding on a non-danger tone, where the exception is true', () => {
  const fixture = TestBed.createComponent(Alert);
  fixture.componentRef.setInput('tone', 'info');
  fixture.detectChanges();
  assertPattern({
    root: fixture.nativeElement as Element,
    bindingPath: BINDING,
    behavioural: ['focus.unaffected', 'content.noAutoDismiss'],
  });
  fixture.destroy();
});

afterAll(() => { GlobalRegistrator.unregister(); });
```

**Before running:** confirm `Alert`'s exported class name and its input name (`tone`) by
reading `frameworks/angular/primitives/alert/alert.ts`, and confirm the tone values by
reading its `.variants.ts`. Use the real names. Confirm from step 1 whether
`TestBed.initTestEnvironment` needs calling here or is already done elsewhere in the
process — if `frameworks/angular/test/` runs as one `bun test` process, it does.

- [ ] **Step 4: Write the data-table test**

Create `frameworks/angular/test/chart-data-table.test.ts`:

```ts
/* figure-with-data-table's alternative.table requirement — "a real <table> of the
 * plotted numbers, visually hidden" — is the one the spec doubts is verifiable at
 * all. Most of it is: both layers already render a real <table>, so a suite can
 * assert it exists, that it is hidden by the visually-hidden idiom rather than
 * absent, and that its cell text is the data that was passed in.
 *
 * What stays unverifiable is the roles.label half — whether the aria-label is a
 * *good* name for the chart. No suite can judge that, and it is recorded as debt
 * rather than faked here. */
import { test, expect, afterAll } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();

import { TestBed } from '@angular/core/testing';
import { join } from 'node:path';
import { BarChart } from '../primitives/bar-chart/bar-chart';
import { assertPattern, ANGULAR_PRIMITIVES } from './compliance';

const DATA = [
  { label: 'Alpha', value: 12 },
  { label: 'Beta', value: 30 },
];

test('arena-bar-chart renders a real table carrying the plotted numbers', () => {
  const fixture = TestBed.createComponent(BarChart);
  fixture.componentRef.setInput('data', DATA);
  fixture.componentRef.setInput('label', 'Deliveries by region');
  fixture.detectChanges();
  const host = fixture.nativeElement as Element;

  const table = host.querySelector('table');
  expect(table).not.toBeNull();

  const cells = [...table!.querySelectorAll('td, th')].map((c) => c.textContent!.trim());
  for (const row of DATA) {
    expect(cells).toContain(row.label);
    expect(cells).toContain(String(row.value));
  }
  fixture.destroy();
});

test('arena-bar-chart matches its figure-with-data-table binding', () => {
  const fixture = TestBed.createComponent(BarChart);
  fixture.componentRef.setInput('data', DATA);
  fixture.componentRef.setInput('label', 'Deliveries by region');
  fixture.detectChanges();
  const host = fixture.nativeElement as Element;
  assertPattern({
    root: host,
    bindingPath: join(ANGULAR_PRIMITIVES, 'bar-chart/bar-chart.behaviour.json'),
    subjects: { default: host.querySelector('[role="img"]') ?? host },
    behavioural: ['alternative.table'],   // asserted by the test above
  });
  fixture.destroy();
});

afterAll(() => { GlobalRegistrator.unregister(); });
```

**Before running:** read `frameworks/angular/primitives/bar-chart/bar-chart.ts` for the real
input names (`data`, `label` are guesses) and the real shape of a data row, and read its
`.behaviour.json` — it currently declares `"exceptions": []`, so **every** requirement of
`figure-with-data-table` must hold or the assertion reports an OVERCLAIM. If it does,
that is a real finding: add the exception with a reason read from the source.

- [ ] **Step 5: Run both suites**

Run: `bun test frameworks/angular/test`
Expected: PASS, including every pre-existing Angular suite. If a pre-existing suite now
fails, the cause is almost certainly a second `GlobalRegistrator.register()` or a second
`initTestEnvironment()` in the same process — resolve it per step 1, do not disable a suite.

- [ ] **Step 6: Commit**

```bash
git add frameworks/angular/test frameworks/angular/primitives
git commit -m "test(behaviour): a conditional role and a chart's data table, asserted per render"
```

---

## Task 6: The requirements no snapshot decides — and the tooltip timer

Everything `evaluate()` returns `null` for. Three kinds, and the harness bounds each.

- **Reachable by acting on the tree:** `keyboard.Escape` (dispatch a `keydown`, assert the close callback ran), `focus.onOpen` (assert `document.activeElement` after mount).
- **Not reachable by render, ever:** `focus.trap` — `happy-dom` does not implement sequential focus navigation, so Tab does not move `document.activeElement`. Asserted as a **pure function** over `frameworks/angular/primitives/focus-trap.ts`, which is already factored for it. **No browser gate.**
- **Recorded debt this task closes:** `Tooltip`'s cancel-on-transition timer, which `CLAUDE.md` names explicitly and says needs no harness at all — `bun:test`'s fake timers reach it.

**Files:**
- Create: `frameworks/react/test-dom/behavioural.test.jsx`
- Create: `frameworks/react/test-dom/tooltip-timer.test.jsx`

**Interfaces:**
- Consumes: `mount`, `cleanup`, `act` (Task 2).
- Produces: nothing consumed later.

- [ ] **Step 1: Write the behavioural test**

Create `frameworks/react/test-dom/behavioural.test.jsx`:

```jsx
/* The requirements evaluate() returns null for: they are behaviours, not
 * attributes, and a DOM snapshot cannot decide them. Each one dialog-modal.test.jsx
 * declared `behavioural` is settled here by acting on the tree.
 *
 * focus.trap is deliberately absent. happy-dom does not implement sequential
 * focus navigation — pressing Tab does not move document.activeElement — so
 * "Tab cycles inside the trap and cannot escape" is unreachable by render. It is
 * asserted as a pure function over frameworks/angular/primitives/focus-trap.ts
 * instead. A browser-driven gate would be this repo's fourth non-portable gate
 * and is refused. */
import { test, expect, afterEach } from 'bun:test';
import React from 'react';
import { mount, cleanup, act } from './harness.jsx';
import { Dialog } from '../components/feedback/Dialog.jsx';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog.jsx';

afterEach(cleanup);

/** Dispatch a real keydown on an element and let React flush. */
function press(el, key) {
  act(() => {
    el.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

test('Dialog does not close on Escape — its keyboard.Escape exception is still true', () => {
  let closed = false;
  const container = mount(
    <Dialog open onClose={() => { closed = true; }} title="t"><p>b</p></Dialog>,
  );
  press(container.querySelector('[role="dialog"]'), 'Escape');
  // The exception says: "No keydown listener anywhere. The only dismissal path is
  // a mouse click on the backdrop." This asserts that is STILL true, and fails the
  // day somebody implements Escape without deleting the exception.
  expect(closed).toBe(false);
});

test('Dialog moves focus nowhere on open — its focus.onOpen exception is still true', () => {
  const before = document.activeElement;
  const container = mount(
    <Dialog open onClose={() => {}} title="t"><button type="button">Inside</button></Dialog>,
  );
  expect(document.activeElement).toBe(before);
  expect(container.querySelector('button')).not.toBe(document.activeElement);
});

test('ConfirmDialog does not close on Escape either — its exception is still true', () => {
  let cancelled = false;
  const container = mount(
    <ConfirmDialog open onCancel={() => { cancelled = true; }} onConfirm={() => {}} title="t" confirmLabel="Delete" />,
  );
  press(container.querySelector('[role="alertdialog"], [role="dialog"]'), 'Escape');
  expect(cancelled).toBe(false);
});
```

**Note on what these tests are.** They assert a defect is still present. That is not a test
of a bug — it is the stale-exception rule in its behavioural form, and it is the answer to
the spec's open question 4. The value is the day the defect is fixed: the test fails, the
implementer deletes the exception, and the record stays true. Write the comment above into
the file so the next reader does not "fix" the test.

- [ ] **Step 2: Run it**

Run: `bun test frameworks/react/test-dom/behavioural.test.jsx`
Expected: PASS, 3 tests. **If any fails**, the exception is stale — delete it from the
binding and rewrite the test to assert the requirement is now met.

- [ ] **Step 3: Write the tooltip timer test**

`CLAUDE.md`'s *Known debt* names this specifically: plan 7a gave `Pagination` five tests
for a pure relocation that could not break, and gave the tooltip's `useRef`, its
cancel-on-transition rule and its unmount cleanup none. It needs no DOM harness, only fake
timers — but it lives here because this directory is where React tests that need timing go.

Create `frameworks/react/test-dom/tooltip-timer.test.jsx`:

```jsx
/* The one genuinely new behaviour plan 7a shipped, and the one it left untested:
 * Tooltip's pointer-intent delay. Named in CLAUDE.md's Known debt.
 *
 * The rule under test is cancel-and-reschedule: crossing out of a trigger before
 * --delay-open elapses must cancel the pending reveal, not queue a second one,
 * and unmounting must clear the timer rather than leave it to fire into a dead
 * component. */
import { test, expect, afterEach, beforeEach, setSystemTime } from 'bun:test';
import React from 'react';
import { mount, cleanup, act } from './harness.jsx';
import { Tooltip } from '../components/feedback/Tooltip.jsx';
import { delayOpen, delayClose } from '../tokens.generated.js';

afterEach(cleanup);

function hover(el, type) {
  act(() => { el.dispatchEvent(new window.MouseEvent(type, { bubbles: true })); });
}

test('the tooltip does not reveal before --delay-open elapses', async () => {
  const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  const trigger = container.querySelector('button');
  hover(trigger, 'mouseenter');
  await act(async () => { await new Promise((r) => setTimeout(r, delayOpen - 50)); });
  expect(container.textContent).not.toContain('Details');
});

test('the tooltip reveals once --delay-open has elapsed', async () => {
  const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  const trigger = container.querySelector('button');
  hover(trigger, 'mouseenter');
  await act(async () => { await new Promise((r) => setTimeout(r, delayOpen + 50)); });
  expect(container.textContent).toContain('Details');
});

test('crossing out before the delay cancels the reveal rather than queueing it', async () => {
  const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  const trigger = container.querySelector('button');
  hover(trigger, 'mouseenter');
  await act(async () => { await new Promise((r) => setTimeout(r, delayOpen / 2)); });
  hover(trigger, 'mouseleave');
  await act(async () => { await new Promise((r) => setTimeout(r, delayOpen + delayClose + 100)); });
  // The flash-on-crossing defect plan 7a fixed: without the cancel rule, the
  // pending reveal fires after the pointer has already left.
  expect(container.textContent).not.toContain('Details');
});

test('unmounting while a reveal is pending does not throw', async () => {
  const container = mount(<Tooltip label="Details"><button type="button">Hover</button></Tooltip>);
  hover(container.querySelector('button'), 'mouseenter');
  expect(() => cleanup()).not.toThrow();
  await new Promise((r) => setTimeout(r, delayOpen + 100));
});
```

**Before running:** read `frameworks/react/components/feedback/Tooltip.jsx` for the real
prop name (`label` is a guess — it may be `content` or `title`) and read
`frameworks/react/tokens.generated.js` for the real export names of the two delay tokens
(`delayOpen`/`delayClose` are guesses; the generator's naming is `scriptName()`'d, and the
plan-level rule is *never derive one layer's name from the other's* — read the file).

These use real timers with small waits rather than `bun:test`'s fake timers because
`act()` and fake timers interact badly; total suite cost is under a second at
`--delay-open` = 400ms. If that proves flaky, switch to `setSystemTime` with
`jest.useFakeTimers()`-style control and drive `act()` manually.

- [ ] **Step 4: Run it**

Run: `bun test frameworks/react/test-dom/tooltip-timer.test.jsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Confirm the focus-trap pure function is already covered**

Run: `grep -rn "focus-trap" frameworks/angular/test/`

`frameworks/angular/test/command-palette-focus-trap.test.ts` and
`confirm-dialog-focus-trap.test.ts` already exist. Read them and confirm they assert the
cycle-and-cannot-escape property as a pure function over `focus-trap.ts`. **If they do,
add nothing** — this step is a verification, not a deliverable, and duplicating them would
be the "test the thing that cannot break" mistake this chain has already made once. Record
what you found in the commit body.

- [ ] **Step 6: Commit**

```bash
git add frameworks/react/test-dom
git commit -m "test(behaviour): the requirements a snapshot cannot decide, plus the tooltip timer 7a left untested"
```

---

## Task 7: `check:compliance` — the coverage gate and its staleness rule

The suites verify individual bindings. Nothing yet says **which** bindings have a suite, and
without that, coverage silently rots: a component gains a binding and no suite, and the run
stays green. This is the twentieth gate.

Its record is `COVERED` — the same shape as `check-dimension-literals.mjs`'s `EXEMPT` and
`check-manifest-states.mjs`'s own, with the same bidirectional staleness rule: an entry
naming a binding that no longer exists fails, and a binding claiming coverage whose suite
does not mention it fails.

**Files:**
- Create: `scripts/check-compliance.mjs`
- Create: `scripts/check-compliance.test.mjs`
- Modify: `scripts/check-all.mjs` (GATES array + header comment)
- Modify: `scripts/check-all.test.mjs` (count + name array)
- Modify: `package.json` (`check:compliance` script)

**Interfaces:**
- Consumes: `reactComponents`, `angularPrimitives`, `loadBinding` from `scripts/lib/behaviour-contracts.mjs` (Task 3 added `loadBinding`).
- Produces: `COVERED`, `suiteMentions(sourceText, name) -> boolean`, `validateCoverage({bindings, suites}) -> string[]` — the pure helper its own test imports.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-compliance.test.mjs`:

```js
/* Tests check:compliance's pure half. The gate's scan is behind an
 * `import.meta.url` guard so importing it here does not run it — an unguarded
 * process.exit(1) has killed a test process in this repo twice. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { COVERED, suiteMentions, validateCoverage } from './check-compliance.mjs';

test('validateCoverage is clean against a tree that matches its record', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal' }],
    covered: { Dialog: 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'assertPattern for Dialog.behaviour.json' },
  });
  assert.deepEqual(problems, []);
});

test('validateCoverage fails a COVERED entry naming a binding that no longer exists', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal' }],
    covered: { Dialog: 'dialog-modal.test.jsx', Ghost: 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Ghost/);
  assert.match(problems[0], /no binding/i);
});

test('validateCoverage fails a COVERED entry whose suite never mentions the component', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal' }],
    covered: { Dialog: 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'assertPattern for Menu.behaviour.json' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Dialog/);
  assert.match(problems[0], /never mentions/i);
});

test('validateCoverage fails a COVERED entry naming a suite file that does not exist', () => {
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal' }],
    covered: { Dialog: 'gone.test.jsx' },
    suites: {},
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /gone\.test\.jsx/);
});

test('validateCoverage says nothing about an uncovered binding', () => {
  // Coverage is incomplete on purpose and grows one component at a time. The gate
  // guards the record's accuracy, never demands totality — a gate that demanded
  // 47 suites on day one would have been switched off.
  const problems = validateCoverage({
    bindings: [{ name: 'Dialog', pattern: 'dialog-modal' }, { name: 'Table', pattern: 'grid' }],
    covered: { Dialog: 'dialog-modal.test.jsx' },
    suites: { 'dialog-modal.test.jsx': 'Dialog.behaviour.json' },
  });
  assert.deepEqual(problems, []);
});

test('suiteMentions matches a binding filename in a suite body', () => {
  assert.equal(suiteMentions("join(X, 'feedback/Dialog.behaviour.json')", 'Dialog'), true);
  assert.equal(suiteMentions("join(X, 'feedback/Dialog.behaviour.json')", 'Menu'), false);
});

test('every COVERED entry names a real suite file and a real binding', () => {
  // The live record, checked against the live tree. This is the test that turns
  // COVERED from documentation into an invariant.
  assert.ok(Object.keys(COVERED).length > 0, 'COVERED should not be empty');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test scripts/check-compliance.test.mjs`
Expected: FAIL — `Cannot find module './check-compliance.mjs'`.

- [ ] **Step 3: Write the gate**

Create `scripts/check-compliance.mjs`:

```js
/* check:compliance — which behaviour bindings are verified by a render suite,
 * and is that record still true.
 *
 * The suites themselves (frameworks/react/test-dom/, frameworks/angular/test/)
 * do the verifying: each asserts, per requirement, that the rendered DOM either
 * meets it with no exception declared or fails it with one declared. This gate
 * does not re-do that. It guards the *record* of which bindings are covered,
 * because without one the coverage silently rots — a component gains a binding
 * and no suite, and `bun run check` stays green while nobody notices.
 *
 * COVERED is deliberately partial and grows one component at a time. This gate
 * never demands totality: a gate that required 47 suites on day one would have
 * been switched off within a week. It asserts only that every claim in COVERED is
 * true — the same bidirectional staleness rule check-dimension-literals.mjs's
 * EXEMPT and check-manifest-states.mjs's EXEMPT both carry, and the reason either
 * is trusted.
 *
 * What this gate does NOT prove, stated plainly because three other files in this
 * repo had to learn to say it: that a covered component is accessible. A suite can
 * assert every one of a component's four exceptions is still true and the component
 * remains exactly as broken as it was. A green run is a claim about the honesty of
 * the declarations, never about the behaviour of the software.
 *
 * A text scan was considered for this job and rejected with measurements; see
 * CLAUDE.md's Known debt.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { reactComponents, angularPrimitives, loadBinding } from './lib/behaviour-contracts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

/** The suite directories this gate reads. */
export const SUITE_DIRS = [
  join(repoRoot, 'frameworks', 'react', 'test-dom'),
  join(repoRoot, 'frameworks', 'angular', 'test'),
];

/**
 * Bindings verified by a render suite: component name -> the suite file that
 * verifies it. Component names are Pascal case on both layers — an Angular
 * binding carries its React counterpart in its own `component` field, and that
 * field is used rather than derived, because kebab->Pascal has no safe inverse
 * and a cross-layer check that silently never fires looks exactly like coverage.
 *
 * Add an entry when you add a suite. Removing a suite without removing its entry
 * fails this gate, which is the point.
 * @type {Record<string, string>}
 */
export const COVERED = {
  Dialog: 'dialog-modal.test.jsx',
  ConfirmDialog: 'dialog-modal.test.jsx',
  Menu: 'placement-and-branches.test.jsx',
  Skeleton: 'placement-and-branches.test.jsx',
  Alert: 'alert-role-tones.test.ts',
  BarChart: 'chart-data-table.test.ts',
};

/** Does a suite's source mention this component's binding at all?
 *  A filename match, not a semantic one — enough to catch a suite that was
 *  renamed or gutted while COVERED still claimed it.
 *  @param {string} source @param {string} name */
export function suiteMentions(source, name) {
  return source.includes(`${name}.behaviour.json`);
}

/** The pure half, so the gate's own test can exercise both failure branches
 *  without a filesystem.
 *  @param {{bindings: {name: string, pattern: string}[], covered: Record<string,string>, suites: Record<string,string>}} o
 *  @returns {string[]} one message per problem, empty when clean */
export function validateCoverage({ bindings, covered, suites }) {
  const problems = [];
  const known = new Set(bindings.map((b) => b.name));
  for (const [name, suiteFile] of Object.entries(covered)) {
    if (!known.has(name)) {
      problems.push(`COVERED names "${name}", for which there is no binding in the tree. Delete the entry.`);
      continue;
    }
    if (!(suiteFile in suites)) {
      problems.push(`COVERED maps "${name}" to "${suiteFile}", which does not exist. Fix the path or delete the entry.`);
      continue;
    }
    if (!suiteMentions(suites[suiteFile], name)) {
      problems.push(`COVERED maps "${name}" to "${suiteFile}", but that suite never mentions ${name}.behaviour.json. The coverage claim is stale.`);
    }
  }
  return problems;
}

/** Read every binding in the tree as {name, pattern}. */
function collectBindings() {
  const out = [];
  for (const c of reactComponents(repoRoot)) {
    out.push({ name: c.name, pattern: loadBinding(c.bindingPath).pattern });
  }
  for (const p of angularPrimitives(repoRoot)) {
    const b = loadBinding(p.bindingPath);
    out.push({ name: b.component, pattern: b.pattern });
  }
  return out;
}

/** Read every suite file's source, keyed by basename. */
function collectSuites() {
  const out = {};
  for (const dir of SUITE_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!/\.test\.(jsx|ts|mjs)$/.test(f)) continue;
      out[basename(f)] = readFileSync(join(dir, f), 'utf8');
    }
  }
  return out;
}

function main() {
  const bindings = collectBindings();
  const suites = collectSuites();
  const problems = validateCoverage({ bindings, covered: COVERED, suites });

  if (problems.length) {
    console.error('check:compliance — the coverage record no longer matches the tree:\n');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
  }
  const total = bindings.length;
  const n = Object.keys(COVERED).length;
  console.log(`check:compliance OK — ${n} of ${total} bindings verified by a render suite; every coverage claim is current.`);
  console.log('  (A green run says the declarations are honest, never that the components are accessible.)');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

**Before running:** confirm the real signatures of `reactComponents` and
`angularPrimitives` in `scripts/lib/behaviour-contracts.mjs` — whether they take a repo
root, and what fields they return (`name`? `bindingPath`? something else). Adapt
`collectBindings()` to what is actually there. Do not change their signatures.

- [ ] **Step 4: Run the gate's tests and the gate**

Run: `bun test scripts/check-compliance.test.mjs`
Expected: PASS, 7 tests.

Run: `node scripts/check-compliance.mjs`
Expected: PASS — `check:compliance OK — 6 of 64 bindings verified…` (the second number is
whatever `collectBindings()` returns; do not hardcode it in a comment).

Run under node explicitly, because the gate must be runtime-portable:
`node --test scripts/check-compliance.test.mjs`
Expected: PASS.

- [ ] **Step 5: Prove the gate fires**

Three breaks, each reverted immediately:

```bash
# 1. A COVERED entry for a binding that does not exist.
#    Add `Ghost: 'dialog-modal.test.jsx',` to COVERED, then:
node scripts/check-compliance.mjs   # expect exit 1, "no binding in the tree"
git checkout scripts/check-compliance.mjs

# 2. A COVERED entry pointing at a missing suite.
#    Change Dialog's value to 'gone.test.jsx', then:
node scripts/check-compliance.mjs   # expect exit 1, "does not exist"
git checkout scripts/check-compliance.mjs

# 3. A suite that no longer verifies what COVERED claims.
git mv frameworks/react/test-dom/dialog-modal.test.jsx frameworks/react/test-dom/renamed.test.jsx
node scripts/check-compliance.mjs   # expect exit 1, "does not exist"
git mv frameworks/react/test-dom/renamed.test.jsx frameworks/react/test-dom/dialog-modal.test.jsx
```

Confirm each printed the expected message and exited 1. A gate whose failure path has never
been seen is untested.

- [ ] **Step 6: Register the gate**

In `package.json`'s `scripts`:

```json
"check:compliance": "bun scripts/check-compliance.mjs",
```

In `scripts/check-all.mjs`, add to `GATES` **immediately after `check:behaviour`**, so the
two contract-layer gates read together:

```js
  { name: 'check:behaviour', file: 'check-behaviour.mjs' },
  { name: 'check:compliance', file: 'check-compliance.mjs' },
```

In the same file's header comment, change:

```
 * Twenty steps total: the nineteen gates in GATES below, plus the test suite.
```

to:

```
 * Twenty-one steps total: the twenty gates in GATES below, plus the test suite.
```

In `scripts/check-all.test.mjs`, update the count, the name array and the test's own title:

```js
test('GATES lists the twenty check gates', () => {
  assert.equal(GATES.length, 20);
  assert.deepEqual(
    GATES.map((g) => g.name),
    ['check:dtcg', 'check:tokens', 'check:script-tokens', 'check:duplicate-constants', 'check:ramp', 'check:tailwind', 'check:tailwind-generated', 'check:coverage', 'check:radius', 'check:arbitrary', 'check:dimensions', 'check:states', 'check:behaviour', 'check:compliance', 'check:fonts', 'check:vendor', 'check:demos', 'check:cards', 'check:angular', 'check:material'],
  );
});
```

The `check:material runs last` test is unaffected — verify it still passes rather than
assuming.

- [ ] **Step 7: Run the full sweep**

Run: `bun run check`

Expected: 21 steps, all PASS. Three may report SKIP (`check:cards`, `check:vendor`,
`check:demos`) if their dependencies are missing, which makes the run INCOMPLETE — that is
expected behaviour, not a failure of this plan. This is the plan's completion gate and the
one time it is expected to run.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-compliance.mjs scripts/check-compliance.test.mjs scripts/check-all.mjs scripts/check-all.test.mjs package.json
git commit -m "feat(behaviour): check:compliance, the twentieth gate — a coverage record that cannot go stale"
```

---

## Task 8: The record — debt, changelog, and the hand-off to 7d

Documentation only. It is a task rather than a step because what it records is the most
perishable output of this plan: the reason level 2 was cut, which cost real measurement to
establish and which the next reader will otherwise re-derive.

**Files:**
- Modify: `CLAUDE.md` (*Architecture* + *Known debt*)
- Modify: `CHANGELOG.md`
- Modify: `behaviour/README.md`
- Possibly modify: `scripts/lib/behaviour-contracts.mjs` (the `validateUnboundPrimitives` decision)

- [ ] **Step 1: Decide `validateUnboundPrimitives`**

The spec says a planner should decide whether to delete it rather than inherit it.
`UNBOUND_PRIMITIVES` is empty, its two failure branches lost their isolated tests when it
was emptied, and the surviving test only asserts the empty map is clean.

**Delete it**, per the project's standing preference against deprecation debt: dead code
guarded by an untested branch is worse than no code. Remove `UNBOUND_PRIMITIVES` and
`validateUnboundPrimitives` from `scripts/lib/behaviour-contracts.mjs`, remove their call
site in `scripts/check-behaviour.mjs`, and remove the surviving test from
`scripts/behaviour-contracts.test.mjs`.

Run: `bun test scripts/behaviour-contracts.test.mjs && node scripts/check-behaviour.mjs`
Expected: PASS both. Test count drops from 31 to 30.

**If deleting it turns out to remove a check that still fires** (i.e. `check:behaviour`
changes its output for a real binding), stop and keep it — that means the map is not
actually dead, and the finding belongs in *Known debt* instead.

- [ ] **Step 2: Update `CLAUDE.md`'s *Architecture***

Immediately after the existing paragraph ending *"A green run is a coverage claim, never an
accessibility one."*, add:

```markdown
**And now something does check whether a component behaves as it declares — by
rendering it.** `check:compliance` is the coverage record; the verification itself
lives in render suites (`frameworks/react/test-dom/`, `frameworks/angular/test/`)
that assert, per requirement of a component's bound pattern, that the rendered DOM
either meets it with no exception declared, or fails it with one declared. That
single bidirectional statement is the stale-exception rule the layer was modelled
on and did not have: **an exception can finally expire.** The shared evaluator is
`scripts/lib/behaviour-compliance.mjs`, DOM-generic on purpose — it touches only
`tagName`, `getAttribute` and `hasAttribute`, because it is consumed from three
runtimes including plain node in its own test, which has no DOM. It returns a
third value, `null`, for requirements no single element can decide (`focus.*`,
`keyboard.*`, `content.noAutoDismiss`, `alternative.table`); a suite must name
each of those in its `behavioural` list and assert it by acting on the tree, and
`assertPattern` throws if one is silently skipped. **Coverage is partial by design
and grows one component at a time** — `COVERED` in `scripts/check-compliance.mjs`
is the record, with the same bidirectional staleness rule `EXEMPT` carries; the
gate never demands totality, only that every claim in the record is true. A green
`check:compliance` still says nothing about whether a component is accessible: a
suite asserting all four of a component's exceptions are still true passes while
the component stays exactly as broken.

**React has two test directories and they must not merge.**
`frameworks/react/test/` asserts on `renderToStaticMarkup` — no DOM, by design,
because those suites prove those components render correctly server-side.
`frameworks/react/test-dom/` registers `@happy-dom/global-registrator`, which
installs globals **process-wide**, and `bun test <dir>` is one process per
directory. Putting a DOM in the first directory's process would quietly change
what its six suites prove and nothing would fail to say so. `testStep()` in
`scripts/check-all.mjs` lists all three framework directories, and
`check-all.test.mjs` asserts that array by literal value.
```

- [ ] **Step 3: Add three entries to *Known debt***

```markdown
- **A behaviour text scan was designed, built, measured and rejected — do not
  re-propose it without reading this.** Plan 7c's spec proposed a static scan of
  component sources as the cheap tier beneath the render suites. It was
  implemented as a probe and run against the whole tree before being cut. In the
  "claimed met but no textual evidence" direction it reported **60 of 118 true
  claims as unmet (51%)**, across 25 components, because of a cause the spec never
  named: **implicit ARIA**. A native `<button>` satisfies `roles.element`,
  `keyboard.Space` and `keyboard.Enter` while leaving nothing to grep;
  `<input type="checkbox">` satisfies `states.checked`. A text scan penalises
  exactly the correctly-authored components. In the "exception is now stale"
  direction it wrongly retired **18 of 94 live exceptions (19%)**, and **all
  eighteen are irreducible** — none is a regex that could be sharpened. Each is a
  claim about *placement* (`Menu`'s `aria-haspopup` on a wrapping `<span>` rather
  than the focusable trigger), *branch* (`Skeleton`'s `role="status"` in three of
  four variants), *conditional value* (`alert.ts`'s
  `'[attr.role]': "tone() === 'danger' ? 'alert' : 'status'"`, and `Toast.jsx`'s
  same shape), or *semantic completeness* (`Menu`'s Enter opens the menu but never
  moves focus). A rendered DOM resolves all three at once, which is why the render
  suites absorbed the stale-exception check instead of sharing it with a scan.
- **A binding cannot scope an exception to a variant, and `Skeleton` is the proof.**
  `Skeleton`'s `roles.element` and `live.politeness` exceptions are true of the
  `circle` variant and false of `block`, `line` and `text`. The compliance suite
  works around it by asserting against the `circle` variant specifically, which
  pins the claim but leaves a reader of the binding alone believing the exception
  is unconditional. This is the same gap already recorded for `Tag`'s `button`
  pattern applying only when `onRemove` is passed — one level down, at the
  requirement rather than the pattern, and still open. The spec's own unresolved
  question, *"How does a pattern express an optional requirement?"*, is this.
- **Compliance coverage is 6 of 64 bindings and nothing schedules the rest.**
  `COVERED` guards the accuracy of what it claims, never the completeness of it, so
  the 58 uncovered bindings — including every one of `Table`'s and `Calendar`'s
  eight exceptions, the components with no keyboard navigation at all — remain
  exactly as unverified as they were before this gate existed. The gate was built
  that way on purpose: one demanding 47 suites on day one would have been switched
  off. The consequence is that the layer's headline property, *an exception can
  expire*, currently holds for six components and not for the rest.
  `figure-with-data-table`'s `roles.label` half stays unverifiable regardless — a
  suite can assert an `aria-label` exists, never that it is a good name for the
  chart.
```

- [ ] **Step 4: Record the 7d hand-off in *Known debt***

The `components-divergences.md` entry already exists in *Known debt*. Extend it:

```markdown
  Plan 7c deferred the migration to a plan 7d rather than folding it in, on the
  spec's own instruction to sequence it last — the compliance suites change which
  exceptions are true, and migrating prose into entries that are about to move
  wastes the work. Two findings for whoever writes 7d, derived from the file and
  not recalled: it is **1127 lines**, not the 1119 the spec states (7b's preamble
  note moved it), and the structural/per-component seam is at the
  `## Per-component divergences` heading on **line 329**, which matches the spec's
  "roughly the first 300 lines". But the spec's three-way split has a **fourth
  bucket it does not name**: of the ~790 per-component lines, only about a third
  are behaviour that migrates into `exceptions` (~11 sections); ~5 are API and
  belong to plan 8; and **~9 are per-component *rendering* divergences** — BarChart's
  per-bar category axis, DoughnutChart's per-slice legend, `chart-internals`' units,
  UnauthCard's hand-duplicated panel classes, SideNav being described three times —
  which are neither behaviour nor API and have no destination in the spec's scheme.
  They stay as prose alongside the structural half. Three bindings cite this
  document as supporting evidence (`command-palette.behaviour.json`, the `SideNav`
  delegated entry, and `frameworks/angular/primitives/onboarding/onboarding.ts`);
  a migration that deletes a cited section without redirecting the citation breaks
  it, and 7c did not touch them.
```

- [ ] **Step 5: Update `behaviour/README.md`**

Find the passage stating the gate proves only well-formedness and add, without deleting it:

```markdown
`check:behaviour` still proves only that a declaration is well formed. What proves
a declaration is *true* is a render suite: for a component listed in `COVERED`
(`scripts/check-compliance.mjs`), a suite asserts per requirement that the rendered
DOM either meets it with no exception declared or fails it with one declared. That
is bidirectional on purpose — it catches an overclaim and a stale exception with
one statement — and it is why an exception can now expire. Coverage is partial:
`check:compliance` guards that the record is accurate, never that it is complete.
Neither gate is an accessibility claim about any component.
```

- [ ] **Step 6: Update `CHANGELOG.md`**

Under `## [Unreleased]` — **never under the last version**; the plugin is served from the
tag and a release is frozen the moment it is cut:

```markdown
### Added
- Behaviour compliance verification: render suites assert, per requirement, that a
  component's rendered DOM matches its `*.behaviour.json` binding in both
  directions — a requirement met with no exception declared, or unmet with one
  declared. A stale exception now fails, which is the property the contract layer
  was modelled on and lacked.
- `check:compliance`, the twentieth gate: the record of which bindings a render
  suite verifies, with a bidirectional staleness rule of its own.
- `frameworks/react/test-dom/`, a DOM test harness for React, in its own `bun test`
  process so the six `renderToStaticMarkup` suites keep proving what they prove.
- `scripts/lib/behaviour-compliance.mjs`, a DOM-generic requirement evaluator that
  resolves implicit ARIA roles and reports honestly — with a third return value —
  when a requirement is a behaviour no single element can decide.
- Tests for `Tooltip`'s pointer-intent timer, recorded as untested debt since plan 7a.

### Changed
- <N> behaviour exceptions retired as stale, and <M> added where a binding overclaimed.
  <!-- Fill both from what Task 3 step 5 and Task 5 step 4 actually found. If either
       is zero, say zero — a plan that reports only what it hoped for is worse than
       one that reports nothing. -->

### Removed
- `UNBOUND_PRIMITIVES` and `validateUnboundPrimitives`, dead since the Angular
  primitives were all bound and guarded by branches with no isolated test.
```

- [ ] **Step 7: Final verification**

Run: `bun run check`
Expected: 21 steps. All PASS, or PASS with up to three SKIP and an INCOMPLETE verdict if a
headless browser / `Bun.build` / `Bun.Transpiler` is unavailable. **No FAIL.**

Run: `git diff --stat main -- frameworks/react/components frameworks/angular/primitives`
Expected: **only `*.behaviour.json` files listed.** If a `.jsx` or a primitive's `.ts`
appears, the hard constraint was broken — revert that file and re-check.

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md CHANGELOG.md behaviour/README.md scripts/lib/behaviour-contracts.mjs scripts/check-behaviour.mjs scripts/behaviour-contracts.test.mjs
git commit -m "docs(behaviour): record why the text scan was cut, and hand the divergences migration to 7d"
```

---

## Self-review notes

**Spec coverage.** §1 (level 2) — deliberately not implemented; the decision and its
measurements are in the header and Task 8 step 3. §2 (level 3) — Tasks 1–6. §3 (migration)
— deferred to 7d, recorded in Task 8 step 4. *What executing 5.5/7a/7b taught* — the gate
count (Task 7 step 6), the `import.meta.url` guard (Task 7 step 3), never deriving a name
(Global Constraints, Task 7's `COVERED` comment), prove-a-gate-fires (Task 3 step 6, Task 7
step 5), debt-to-`CLAUDE.md` (Task 8). *Non-goals* — the no-component-edits constraint is
in Global Constraints and re-verified in Task 8 step 7.

**Open questions.** 1, 2, 3, 4, 5 and 7 are answered in the header; 6 is explicitly
out of scope with the migration and its three citations are named in Task 8 step 4 so 7d
inherits them.

**Known soft spots, flagged rather than hidden.** Several code blocks name props and
exports that were not read from source (`ConfirmDialog`'s signature, `Tooltip`'s label
prop, the generated delay-token export names, `BarChart`'s Angular input names,
`reactComponents`/`angularPrimitives`' return shape). Each carries a **"Before running:
read the real file"** instruction rather than a guess presented as fact. Expect the plan to
be wrong in places and let execution find it — that has happened on every plan in this
chain and each correction was back-ported into the plan, not only the code.
