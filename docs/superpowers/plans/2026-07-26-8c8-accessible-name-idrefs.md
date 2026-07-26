# 8C8 — Resolving the accessible name, and giving each reference its own rule

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `roles.label` resolve its `aria-labelledby` instead of counting it, and move
reference strictness onto the attribute it belongs to — closing the hole 8C7's own whole-branch
review found, where a dangling `aria-labelledby` on a dialog with no accessible name at all left its
suite green.

**Architecture:** Strictness belongs to the **attribute**, not the requirement key, because it is a
fact about what the attribute means and because it is the only place `aria-labelledby` can be
governed at all — `roles.label` has no `ATTRIBUTE_FOR` entry. One curated map holds it, one shared
helper reads it, and the requirement-key set `evaluate` already uses is **derived** from that map
rather than written twice. `hasAccessibleName` stops asking whether an attribute is present and
starts asking whether there is a name.

**Tech Stack:** Bun (build, test), `node:test` + `node:assert/strict`, plain node for the
evaluator's own suite, happy-dom for the render suites.

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only**, in code, comments, docs and commit messages.
2. **A commit message containing a backtick uses a quoted here-doc** — `git commit -q -F - <<'MSG'
   … MSG` — never `git commit -m`. A backtick inside a double-quoted shell string opens command
   substitution and is silently spliced away. Verify with `git log -1 --format=%B`.
3. **The first step of every task is `git status --short`**, and it must be clean.
4. **`bun run check` in full runs ONCE, at close-out.** Individual gates are named per task.
5. **Run the React DOM suites with `bun run test:react-dom`, NEVER `bun test
   frameworks/react/test-dom`.** Without the `--preload` react-dom latches its legacy
   change-detection path at module evaluation and a dispatched event reaches a handler zero times,
   silently.
6. **The shared evaluator may touch only four DOM members** — `tagName`, `getAttribute`,
   `hasAttribute`, `textContent`. It runs under plain node in its own suite. Anything richer belongs
   to the caller and arrives as an injected function.
7. **A gate never degrades silently.** Where this plan says *throw*, it means throw.
8. **Never weaken an assertion to make a suite pass.** If a component fails one of the new checks,
   the component has a defect and the defect is what gets fixed — stop and report it.
9. **Do NOT run `bun run build:demos` during an induction.** Every component `.jsx` has a committed
   compiled `.js` sibling; rebuilding while a component is temporarily broken would commit the
   break. The DOM suites import the `.jsx` directly, so no rebuild is needed.
10. **No component under `frameworks/react/components/` or `frameworks/angular/primitives/` changes
    in this batch**, except temporarily inside a guarded induction that is restored and proved
    restored with `sha256sum -c`.

---

## What this plan measured before it was written

Read off the tree at `28b2850` on 2026-07-26 (branch `accessible-name-idrefs-8c8`, cut from `main`
after 8C7 merged). Verify anything you depend on; do not re-derive.

| measure | value |
|---|---|
| `ARENA_CHECK_STRICT=1 bun run check` | all 23 step(s) passed |
| `bun run check:compliance` | 10 of 70 |
| patterns declaring `roles.label` | 13 (`grep -l '"roles.label"' behaviour/patterns/*.json \| wc -l`) |
| `dialog-modal.test.jsx` today | 6 pass / 0 fail |
| `bun test scripts` | 571 pass |
| `bun run test:react-dom` | 98 pass |

Facts the tasks depend on, each read off the source rather than recalled:

- `ATTRIBUTE_FOR` is module-private today and holds seven keys. Three of its values are reference
  attributes: `aria-controls`, `aria-activedescendant`, `aria-describedby`.
- `export const IDREF = new Set([...])` is hand-written beside it, with a long docstring whose
  closing paragraph records this batch's subject as *Known debt*. That paragraph is retired here.
- `evaluate`'s `ATTRIBUTE_FOR` branch ends `return ids.some((id) => resolveId(id) != null);`.
- `hasAccessibleName(el, acceptsText = false)` is `if (el.getAttribute('aria-label') ||
  el.getAttribute('aria-labelledby')) return true;` then the text-content route.
- `roleOf(el)` calls `hasAccessibleName(el, false)` for exactly one case: `<section>`, which exposes
  `role="region"` only when named.
- `evaluate` calls `roleOf(el)` **four** times — the `roles.element`, `ROLE_NAMED_BY_KEY`,
  `states.checked` and `live.politeness` branches — and calls `hasAccessibleName` once, in the
  `roles.label` branch. The last two `roleOf` sites look unrelated to naming and are the ones a
  reader misses.
- `hasAccessibleName` and `roleOf` are exported but consumed only by this file and its own suite.
  No wrapper calls either. Verified by grep.
- `Dialog.behaviour.json` is `{"pattern": "dialog-modal", "exceptions": []}`.
- `aria-controls` is rendered at `frameworks/react/components/navigation/Tab.jsx:26`, not in
  `Tabs.jsx`.
- `scripts/behaviour-compliance.test.mjs` around lines 83-92 asserts the OLD presence semantics of
  `hasAccessibleName`. Those assertions describe behaviour this batch deliberately changes and must
  be **rewritten to the new truth**, not deleted. That is not weakening an assertion; it is an
  assertion whose subject moved.

---

## File Structure

**Modified**

- `scripts/lib/behaviour-compliance.mjs` — the whole batch. One new exported map, one new private
  helper, `IDREF` derived, `hasAccessibleName` and `roleOf` re-signatured, three call sites threaded.
- `scripts/behaviour-compliance.test.mjs` — every new branch under plain node with stubs, plus the
  rewrite of the four old presence assertions.
- `CLAUDE.md` — the *Known debt* entry 8C7 wrote about `roles.label` becomes false.

**Not modified, and that is a result rather than an omission**: no component, no wrapper, no render
suite. `comparePattern` already threads `resolveId` and both wrappers already build one, so the fix
reaches the render suites with nothing to change there. Task 2 proves that rather than assuming it.

---

## Task 1: Strictness moves onto the attribute

**Files:**
- Modify: `scripts/lib/behaviour-compliance.mjs`
- Test: `scripts/behaviour-compliance.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `export const IDREF_ATTRIBUTES` — a `Map` from reference attribute to
  `{match: 'every' | 'some', reason: string}`. `export const ATTRIBUTE_FOR` — newly exported so the
  staleness test can read it. `export const IDREF` — unchanged in shape and meaning, now **derived**
  from those two. A module-private `referenceResolves(attr, raw, resolveId) => boolean`, which
  Task 2 also calls.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing tests**

Add to `scripts/behaviour-compliance.test.mjs`. The suite already has an `el(tagName, attrs, text)`
stub helper and already imports `evaluate` — extend the existing import line for the new names
rather than adding a second one.

```js
/* Strictness is a fact about the ATTRIBUTE. 8C7 applied `some` to all three keys
   it knew about, on a justification that belongs to exactly one of them. */
test('an aria-controls list is met only when EVERY id resolves', () => {
  const tab = el('button', { 'aria-controls': 'panel-1 panel-2' });
  const both = (id) => (id === 'panel-1' || id === 'panel-2' ? el('div') : null);
  const onlyOne = (id) => (id === 'panel-1' ? el('div') : null);
  assert.equal(evaluate(tab, 'roles.controls', 'x', 'tabs', both), true);
  assert.equal(evaluate(tab, 'roles.controls', 'x', 'tabs', onlyOne), false);
});

test('aria-describedby keeps the one-resolving-id rule, and keeps its reason', () => {
  const trigger = el('button', { 'aria-describedby': 'consumer-hint tooltip-1' });
  const resolve = (id) => (id === 'tooltip-1' ? el('span') : null);
  assert.equal(evaluate(trigger, 'roles.describedby', 'x', 'tooltip', resolve), true);
  assert.equal(IDREF_ATTRIBUTES.get('aria-describedby').match, 'some');
});

/* `every` over an empty list is vacuously TRUE, which would report the emptiest
   possible reference as met -- the exact shape of failure this file refuses. */
test('a reference attribute holding only whitespace names nothing', () => {
  const tab = el('button', { 'aria-controls': '   ' });
  assert.equal(evaluate(tab, 'roles.controls', 'x', 'tabs', () => el('div')), false);
});

test('IDREF is derived from IDREF_ATTRIBUTES and still names the ATTRIBUTE_FOR reference keys', () => {
  assert.deepEqual(
    [...IDREF].sort(),
    ['roles.activedescendant', 'roles.controls', 'roles.describedby'],
  );
});

/* The staleness discipline QUANTIFIED and EXEMPT carry: an entry naming an
   attribute no branch of this file reads fails the suite rather than rotting. */
test('every IDREF_ATTRIBUTES entry names an attribute the evaluator actually consults', () => {
  const consulted = new Set([...Object.values(ATTRIBUTE_FOR), 'aria-labelledby']);
  for (const attr of IDREF_ATTRIBUTES.keys()) {
    assert.ok(consulted.has(attr), `${attr}: no branch of the evaluator reads it`);
  }
});

test('every IDREF_ATTRIBUTES entry declares a match rule and a reason', () => {
  for (const [attr, spec] of IDREF_ATTRIBUTES) {
    assert.ok(['every', 'some'].includes(spec.match), `${attr}: match must be "every" or "some"`);
    assert.ok(typeof spec.reason === 'string' && spec.reason.length > 20, `${attr}: no reason on file`);
  }
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: FAIL. `IDREF_ATTRIBUTES` and `ATTRIBUTE_FOR` are not exported, the partially-resolving
`aria-controls` list returns `true` under the blanket `some`, and the whitespace case returns
`false` today only by accident of `some` — assert it either way and keep the test, because the
`every` rewrite is what would break it.

- [ ] **Step 4: Write the map**

In `scripts/lib/behaviour-compliance.mjs`, immediately below `ATTRIBUTE_FOR`, and change
`const ATTRIBUTE_FOR` to `export const ATTRIBUTE_FOR` on the line above:

```js
/** The reference attributes this file resolves, and HOW STRICT each one is.
 *
 *  Strictness belongs to the ATTRIBUTE rather than to the requirement key, for
 *  two reasons. It is a fact about what the attribute MEANS: aria-labelledby
 *  concatenates the text of everything it names into one accessible name, so an
 *  id that resolves to nothing truncates that name in silence, where
 *  aria-describedby merely contributes one description among several. And it is
 *  the only place aria-labelledby can be governed at all -- roles.label has no
 *  ATTRIBUTE_FOR entry and never reaches the branch that reads this.
 *
 *  `some` is the exception and carries the reason; `every` is the rule. 8C7
 *  applied `some` to all three keys it knew about on a justification that belongs
 *  to exactly one of them, so aria-controls spent a batch holding a concession
 *  earned by aria-describedby.
 *
 *  Same staleness discipline as QUANTIFIED and EXEMPT: an entry naming an
 *  attribute no branch of this file consults fails the suite rather than rotting.
 *  @type {Map<string, {match: 'every' | 'some', reason: string}>} */
export const IDREF_ATTRIBUTES = new Map([
  ['aria-labelledby', {
    match: 'every',
    reason: "the attribute concatenates the text of every element it names into ONE accessible name, so an id resolving to nothing truncates that name in silence rather than removing it.",
  }],
  ['aria-controls', {
    match: 'every',
    reason: "every aria-controls in either layer is a single id Arena generates itself, so nothing legitimately points outside the rendered tree and a looser rule protects nobody.",
  }],
  ['aria-activedescendant', {
    match: 'every',
    reason: "a single IDREF by specification rather than a list, so every and some agree -- every is the honest spelling of a rule with one id to judge.",
  }],
  ['aria-describedby', {
    match: 'some',
    reason: "the one exception: Tooltip merges the consumer's own description with Arena's bubble id, and the consumer's may name an element outside the component's rendered tree, so demanding that every id resolve would fail a correct component.",
  }],
]);

/** Whether a space-separated IDREF list satisfies its attribute's rule. The ONE
 *  place either branch decides that, so IDREF_ATTRIBUTES is the authority rather
 *  than a table two call sites happen to agree with. */
function referenceResolves(attr, raw, resolveId) {
  const ids = raw.split(/\s+/).filter(Boolean);
  /* An attribute holding only whitespace names nothing, and `every` over an empty
   * list is vacuously TRUE -- so without this the emptiest possible reference
   * would report as met, which is the shape of failure this file exists to refuse. */
  if (!ids.length) return false;
  return IDREF_ATTRIBUTES.get(attr).match === 'every'
    ? ids.every((id) => resolveId(id) != null)
    : ids.some((id) => resolveId(id) != null);
}
```

- [ ] **Step 5: Derive `IDREF` and delete the retired paragraph**

Replace the whole existing `IDREF` declaration and its docstring with:

```js
/** The requirement keys whose ATTRIBUTE_FOR attribute is a reference. DERIVED
 *  from IDREF_ATTRIBUTES rather than written beside it: two hand-written lists of
 *  one fact can disagree, and this one did -- its own docstring used to carry a
 *  paragraph recording that aria-labelledby was governed nowhere, which is what
 *  this batch closed.
 *  @type {Set<string>} */
export const IDREF = new Set(
  Object.entries(ATTRIBUTE_FOR)
    .filter(([, attr]) => IDREF_ATTRIBUTES.has(attr))
    .map(([key]) => key),
);
```

The long `SCOPE` paragraph recording the `aria-labelledby` hole goes with it — the hole is what
Task 2 closes, and a record of a closed hole is exactly the stale assertion this repo treats as a
defect.

- [ ] **Step 6: Rewire `evaluate`'s `ATTRIBUTE_FOR` branch**

Replace the trailing comment and the two lines that split and test the ids with one call:

```js
    return referenceResolves(attr, raw, resolveId);
```

The comment that justified `some` moves with it: it now lives in `IDREF_ATTRIBUTES`'s
`aria-describedby` entry, which is where the rule it explains lives. Do not leave a copy behind.

- [ ] **Step 7: Run the tests**

```bash
bun test scripts/behaviour-compliance.test.mjs   # PASS
bun test scripts                                 # PASS
bun run test:react-dom                           # 98 pass, 0 fail
```

`aria-controls` tightening from `some` to `every` must change nothing: every one in the layer is a
single id. If a render suite turns red, a component has a real dangling reference — STOP and report
it rather than relaxing the rule.

- [ ] **Step 8: Prove the tightening bites, by induction**

`Tab.jsx` renders the attribute. Guard it, then add a second id that names nothing, leaving the
first one resolving — which is precisely what the old `some` accepted:

```bash
sha256sum frameworks/react/components/navigation/Tab.jsx > "${CLAUDE_JOB_DIR:-/tmp}/8c8-tab.sha"
```

In `Tab.jsx:26`, change `aria-controls={panelId}` to
``aria-controls={`${panelId} invented`}``. Then:

```bash
bun run test:react-dom
```

Expected: FAIL in `tabs.test.jsx` with `roles.controls: OVERCLAIM`. **This is the assertion that
could not exist before this task**: the first id still resolves, so the old rule passed it. Restore
and prove it:

```bash
git checkout -- frameworks/react/components/navigation/Tab.jsx
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c8-tab.sha"   # OK
bun run test:react-dom                               # 98 pass again
```

- [ ] **Step 9: Commit**

```bash
git commit -q -F - <<'MSG'
feat(compliance): reference strictness belongs to the attribute, not the key

8C7 wrote `ids.some((id) => resolveId(id) != null)` for all three keys in `IDREF`,
and the comment justifying `some` is a fact about ONE attribute: `Tooltip` merges
the consumer's own `aria-describedby` with Arena's, and the consumer's may name an
element outside the rendered tree. No such merge exists for `aria-controls` --
every one in either layer is a single id Arena generates -- so it spent a batch
holding a concession earned by its neighbour, and `aria-controls="panel-1 invented"`
passed.

`IDREF_ATTRIBUTES` maps each reference attribute to `every` or `some` with the
reason on file, in the idiom `QUANTIFIED` and `EXEMPT` already use and under the
same staleness rule. `every` is the rule and `some` is the exception, which is the
right way round for a layer whose whole subject is that presence is not proof.

`IDREF` is now DERIVED from that map rather than hand-written beside it: two lists
of one fact can disagree, and this pair did -- `IDREF`'s docstring carried a
paragraph recording that `aria-labelledby` was governed nowhere.

One shared helper reads the map, so a rule cannot hold in one branch and not the
other, and it refuses an attribute holding only whitespace -- `every` over an
empty list is vacuously true, which would have reported the emptiest possible
reference as met.

Induced against a real component: a second, dangling id beside a resolving one in
`Tab.jsx` failed `roles.controls: OVERCLAIM`, where the old rule passed it. Tree
restored and verified with sha256sum -c.
MSG
```

---

## Task 2: `hasAccessibleName` asks whether there is a name

**Files:**
- Modify: `scripts/lib/behaviour-compliance.mjs`
- Test: `scripts/behaviour-compliance.test.mjs`

**Interfaces:**
- Consumes: `referenceResolves` and `IDREF_ATTRIBUTES` from Task 1.
- Produces: `hasAccessibleName(el, acceptsText = false, resolveId)` and `roleOf(el, resolveId)`.
  Both are exported and consumed only by this file and its own suite, so no other file changes.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Rewrite the four assertions whose subject this task moves**

`scripts/behaviour-compliance.test.mjs` around lines 83-92 pins the OLD presence semantics —
`hasAccessibleName(el('div', { 'aria-labelledby': 'x1' }))` asserted `true`. That assertion becomes
false by design, and Step 3's tests replace it. **Rewrite it to the new truth rather than deleting
it**: the `aria-label` half and the text-content half are unchanged and must stay asserted, and the
`aria-labelledby` half moves into the new tests below.

- [ ] **Step 3: Write the failing tests**

```js
test('aria-label alone names the element without consulting the resolver', () => {
  let asked = false;
  const resolve = () => { asked = true; return null; };
  assert.equal(hasAccessibleName(el('div', { 'aria-label': 'Schedule' }), false, resolve), true);
  assert.equal(asked, false, 'the resolver was consulted for an element aria-label already named');
});

test('a resolving aria-labelledby names the element', () => {
  assert.equal(hasAccessibleName(el('div', { 'aria-labelledby': 'title-1' }), false, () => el('h2')), true);
});

test('a dangling aria-labelledby does NOT name the element', () => {
  assert.equal(hasAccessibleName(el('div', { 'aria-labelledby': 'gone' }), false, () => null), false);
});

/* aria-labelledby concatenates, so EVERY id must resolve -- unlike
   aria-describedby, whose rule and reason live in IDREF_ATTRIBUTES. */
test('every id in an aria-labelledby list must resolve', () => {
  const d = el('div', { 'aria-labelledby': 'a b' });
  const onlyA = (id) => (id === 'a' ? el('span') : null);
  assert.equal(hasAccessibleName(d, false, onlyA), false);
  assert.equal(hasAccessibleName(d, false, () => el('span')), true);
});

/* The three routes are ALTERNATIVES, so a dangling reference falls through to
   the next one rather than nulling the name -- which is also what a real
   accessible-name computation does. The resolver is never consulted here,
   because text answered first, and that is what the order is for. */
test('text content still names an element whose aria-labelledby dangles', () => {
  let asked = false;
  const b = el('button', { 'aria-labelledby': 'gone' }, 'Save');
  assert.equal(hasAccessibleName(b, true, () => { asked = true; return null; }), true);
  assert.equal(asked, false);
});

test('text content does not rescue a pattern that does not admit it', () => {
  const d = el('div', { 'aria-labelledby': 'gone' }, 'Delete project');
  assert.equal(hasAccessibleName(d, false, () => null), false);
});

test('an aria-labelledby with no resolver THROWS rather than counting the attribute', () => {
  assert.throws(
    () => hasAccessibleName(el('div', { 'aria-labelledby': 'x' })),
    /aria-labelledby.*resolveId/s,
  );
});

test('an element with no naming route at all needs no resolver', () => {
  assert.equal(hasAccessibleName(el('div')), false);
  assert.equal(hasAccessibleName(el('button', {}, 'Save'), true), true);
});

/* roleOf asks the same question for a <section>: unnamed, it exposes no role at
   all, so a labelledby that resolves to nothing must take the role with it. */
test('roleOf refuses region to a section whose aria-labelledby dangles', () => {
  assert.equal(roleOf(el('section', { 'aria-labelledby': 'gone' }), () => null), null);
  assert.equal(roleOf(el('section', { 'aria-labelledby': 'h1' }), () => el('h2')), 'region');
});

test('evaluate decides roles.label by resolving, not by counting', () => {
  const d = el('div', { 'aria-labelledby': 'gone' });
  assert.equal(evaluate(d, 'roles.label', 'aria-labelledby or aria-label', 'dialog-modal', () => null), false);
  assert.equal(evaluate(d, 'roles.label', 'aria-labelledby or aria-label', 'dialog-modal', () => el('h2')), true);
});
```

- [ ] **Step 4: Run them and watch them fail**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: FAIL — every dangling case returns `true` today, and the no-resolver case does not throw.

- [ ] **Step 5: Rewrite `hasAccessibleName`**

```js
/** Whether the element carries an accessible name.
 *
 *  Three routes satisfy the requirement and they are ALTERNATIVES, so the answer
 *  is a disjunction and the order below is free. What the order buys is that
 *  `resolveId` is consulted only where it can change the answer -- a button
 *  carrying both its own text and an aria-labelledby never needs one. It also
 *  matches the real name computation: an aria-labelledby resolving to nothing
 *  falls through to the next route rather than nulling the name.
 *
 *  `acceptsText` decides whether the element's own text content counts, and the
 *  caller must pass it deliberately — it defaults to false, the stricter answer,
 *  so a new call site cannot accidentally widen the rule. Only the patterns in
 *  LABEL_ACCEPTS_TEXT say text content is enough.
 *  @param {{getAttribute: (n: string) => string | null, textContent?: string | null}} el
 *  @param {boolean} [acceptsText]
 *  @param {(id: string) => object | null} [resolveId] required when the element's
 *    ONLY remaining route is aria-labelledby — see the throw below.
 *  @throws {Error} when aria-labelledby is the deciding route and no resolver was
 *    supplied. Counting the attribute instead would report a dangling reference
 *    as a name, which is the defect this parameter exists to catch. */
export function hasAccessibleName(el, acceptsText = false, resolveId) {
  if (el.getAttribute('aria-label')) return true;
  if (acceptsText && (el.textContent ?? '').trim()) return true;
  const raw = el.getAttribute('aria-labelledby');
  if (!raw) return false;
  if (typeof resolveId !== 'function') {
    throw new Error(
      'hasAccessibleName: this element is named only by aria-labelledby and no resolveId was ' +
      'supplied, so whether it has a name cannot be decided. Pass resolveId to comparePattern -- ' +
      'each wrapper builds one scoped to the rendered tree. Counting the attribute instead would ' +
      'report a dangling reference as a name, and a dialog whose title carried no id would read ' +
      'as fully compliant while having no accessible name at all.',
    );
  }
  return referenceResolves('aria-labelledby', raw, resolveId);
}
```

- [ ] **Step 6: Thread the resolver through `roleOf` and `evaluate`**

`roleOf` gains the parameter and passes it on:

```js
/** The element's ARIA role: explicit if authored, else implicit, else null.
 *  @param {{tagName: string, getAttribute: (n: string) => string | null}} el
 *  @param {(id: string) => object | null} [resolveId] threaded to
 *    hasAccessibleName for the one case that needs it: a <section> exposes
 *    role="region" only when it is named, so a labelledby resolving to nothing
 *    takes the role with it. */
export function roleOf(el, resolveId) {
```

and its `SECTION` line becomes `return hasAccessibleName(el, false, resolveId) ? 'region' : null;`.

In `evaluate`, **five** call sites take the resolver it already has. Find them with
`grep -n 'roleOf(el)\|hasAccessibleName(el' scripts/lib/behaviour-compliance.mjs` rather than
trusting the line numbers below, and thread **every** one — a `roleOf` left un-threaded is a branch
where the new throw can fire with no resolver in reach, which is a crash rather than a verdict:

- the `roles.label` branch (~line 319):
  `return hasAccessibleName(el, LABEL_ACCEPTS_TEXT.has(patternName), resolveId);`
- the `roles.element` branch (~line 318): `return roleOf(el, resolveId) === wanted;`
- the `ROLE_NAMED_BY_KEY` branch (~line 345): `const actual = roleOf(el, resolveId);`
- the `states.checked` branch (~line 355): `const role = roleOf(el, resolveId);`
- the `live.politeness` branch (~line 365):
  `return ['status', 'alert', 'log'].includes(roleOf(el, resolveId));`

The last two are easy to miss and were missed once while this plan was being written: `roleOf`
reaches `hasAccessibleName` only for a `<section>`, so they look unrelated until a `<section>`
carrying an `aria-labelledby` is evaluated for one of them.

Widen `evaluate`'s `@throws` clause: it lists three programming errors today, and the fourth is an
`aria-labelledby` that decides a `roles.label` with no resolver.

- [ ] **Step 7: Correct the stale example in `LABEL_ACCEPTS_TEXT`'s docstring**

That docstring argues its whitelist by citing *"Dialog's exception records that its title carries no
id and the dialog element carries neither attribute"*. `Dialog.behaviour.json` has read
`"exceptions": []` since 8C4 — verify with `cat` — so the example is stale even though the reasoning
is sound. Rewrite the example to something true; the argument that crediting text everywhere would
wrongly retire a real exception survives and must stay.

- [ ] **Step 8: Run everything**

```bash
bun test scripts/behaviour-compliance.test.mjs   # PASS
bun test scripts                                 # PASS
bun run test:react-dom                           # 98 pass, 0 fail
bun test frameworks/angular/test                 # 336 pass, 0 fail
node --test scripts/behaviour-compliance.test.mjs  # still node-portable, no DOM
```

Every `aria-labelledby` in both layers resolves today, so nothing should turn red. **If a suite
fails, a component has a real accessibility defect** — report it and stop; do not relax the check
and do not edit the component.

- [ ] **Step 9: Prove the hole is closed, by induction**

This is the batch's headline claim and the reason it exists.

```bash
sha256sum frameworks/react/components/feedback/Dialog.jsx > "${CLAUDE_JOB_DIR:-/tmp}/8c8-dialog.sha"
```

In `Dialog.jsx`, delete `id={titleId}` from the title `<div>` (around line 60), leaving
`aria-labelledby={titleId}` on the panel. The dialog now has **no accessible name of any kind**.
Then:

```bash
bun run test:react-dom
```

Expected: FAIL with `roles.label: OVERCLAIM` in `dialog-modal.test.jsx`. **Before this batch that
same tree reported 6 pass / 0 fail** — which is the measurement that started it. Restore:

```bash
git checkout -- frameworks/react/components/feedback/Dialog.jsx
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c8-dialog.sha"   # OK
bun run test:react-dom                                  # 98 pass again
```

- [ ] **Step 10: Commit**

```bash
git commit -q -F - <<'MSG'
feat(compliance): decide roles.label by resolving the name, not counting it

`hasAccessibleName` returned true the moment `aria-labelledby` was a non-empty
string, and `roles.label` never reaches `ATTRIBUTE_FOR`, so `IDREF` never saw it:
8C7 taught this layer that a reference must resolve and left the commonest
reference of all unresolved. 8C7's own whole-branch review proved the cost by
induction -- deleting `id={titleId}` from `Dialog.jsx` left a dangling reference
on a dialog with NO accessible name at all, and `dialog-modal.test.jsx` reported
6 pass / 0 fail.

The function now asks whether there is a NAME rather than whether there is an
attribute, walking the three routes that satisfy the requirement. They are
alternatives, so the order is free and no verdict moves; what the order buys is
that the resolver is consulted only where it decides the answer, so a button with
its own text and an aria-labelledby never needs one. It also matches the real name
computation, where a reference resolving to nothing falls through to the next
route rather than nulling the name.

`roleOf` takes the resolver by the same door. A <section> exposes role="region"
only when it is named, so a labelledby resolving to nothing takes the role with
it -- the same question, and one file may not hold two answers to it.

A labelledby that decides the answer with no resolver THROWS, per this file's own
policy that null is never a fallthrough. The alternative -- treating an
unresolvable name as simply unnamed -- fails the opposite way and worse: a correct
component starts failing wherever a resolver has not been threaded, saying
nothing about why.

`LABEL_ACCEPTS_TEXT`'s docstring argued its whitelist from "Dialog's exception",
which has read `"exceptions": []` since 8C4. The argument survives; the example
was stale and is replaced.

Induced against the real component: with `id={titleId}` gone, `roles.label:
OVERCLAIM`. Tree restored and verified with sha256sum -c.
MSG
```

---

## Task 3: Close-out

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: everything.
- Produces: a green tree.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Rewrite the Known debt entry this batch makes false**

8C7's fix wave added an entry recording that `roles.label` is decided by `hasAccessibleName()` as
pure presence, that `aria-labelledby` is its reference form and is resolved nowhere, that the
exposure is live on covered bindings, and what a real fix would have to change. Find it —
`grep -n "hasAccessibleName\|aria-labelledby" CLAUDE.md` — and rewrite it to what is now true.

What must survive, because this batch closed none of it:

- **A resolved reference is not proof it landed on the RIGHT element.** A pattern cannot say what
  kind of element a reference must reach.
- **A resolved `aria-labelledby` may name an EMPTY element.** `SideNavSection.jsx` already worries
  about exactly this in its own comment. Requiring text at the target was considered and rejected:
  `textContent` cannot see a legitimate name coming from an image's `alt` or a nested `aria-label`,
  so the check would produce false negatives against correct components. Record the rejection with
  its reason, not just the gap.
- Anything else in the entry still true. Read it whole before cutting; a deletion that takes a
  still-true fact out of the index is a defect in this repo.

Do not write a figure that will go stale. Where a count is wanted, name the command.

- [ ] **Step 3: Sweep for other prose this batch falsified**

```bash
grep -n "presence\|IDREF\|aria-labelledby\|hasAccessibleName" CLAUDE.md | head -30
```

Check in particular the paragraph describing what the shared evaluator does and the entry about
8C7's own IDREF work — a sentence claiming `aria-labelledby` is unresolved, or that `IDREF` is
hand-written, is now false.

- [ ] **Step 4: Run the full sweep, once**

```bash
export CHROME_PATH=/usr/bin/chromium
ARENA_CHECK_STRICT=1 bun run check
```

Expected: `check-all: all 23 step(s) passed`. If any step fails, STOP and report BLOCKED with the
failing step's output — never fix a gate to make it agree.

- [ ] **Step 5: Confirm the batch's own claims**

```bash
bun run check:compliance    # 10 of 70, unchanged — this batch changes what green MEANS
bun run check:behaviour
bun test scripts            # all pass, including both staleness tests
```

- [ ] **Step 6: Commit**

```bash
git commit -q -F - <<'MSG'
docs: close out 8C8 — the accessible-name debt entry this batch made false

8C7 recorded that `roles.label` is decided by `hasAccessibleName()` as pure
attribute presence, that `aria-labelledby` is its reference form and is resolved
nowhere, and that the exposure was live on covered bindings. All of that is now
false and the entry says what replaced it.

What survives is what neither batch closed: a resolved reference is not proof it
landed on the RIGHT element, because a pattern cannot say what kind of element a
reference must reach -- and a resolved `aria-labelledby` may still name an EMPTY
element. The second was considered and deliberately refused rather than missed:
`textContent` cannot see a name that comes from an image's `alt` or a nested
`aria-label`, so requiring text at the target would fail correct components. The
entry records the refusal and its reason, not just the gap.

Full `bun run check` run once, at close-out, per the rule that the sweep is a
completion gate rather than a per-commit toll.
MSG
```

---

## Self-review

**Spec coverage.** Spec §1 (`hasAccessibleName` asks for a name; the three-route order; every id
resolves) → Task 2 Steps 5 and 3. §2 (`roleOf` takes the resolver) → Task 2 Step 6. §3 (a missing
resolver throws) → Task 2 Step 5, with the rejected alternative recorded in the commit message.
§4 (per-attribute map, derived `IDREF`) → Task 1. *Verification* → Task 1 Step 8 and Task 2 Step 9,
the two inductions the spec names, plus the unit suite in both tasks. *Blast radius* (no component
changes, no wrapper changes) → Task 2 Step 8 proves it rather than assuming it. *What stays open*
→ Task 3 Step 2, which names the empty-target case and its rejection explicitly. *Out of scope*
(Angular, coverage width, the pattern schema) → untouched by every task.

**One ordering note, so it does not look like a failure.** Unlike 8C7, this plan leaves **no red
window**: Task 1 is complete on its own, and Task 2 changes `hasAccessibleName` and threads every
one of its callers in the same task precisely so no intermediate commit has a caller passing two
arguments to a function that needs three. Splitting Task 2 would recreate 8C7's designed-red state
for no benefit, since every caller lives in the same file.

**Type consistency.** `referenceResolves(attr, raw, resolveId) => boolean` is defined in Task 1
Step 4 and called in Task 1 Step 6 and Task 2 Step 5. `IDREF_ATTRIBUTES` is a `Map` to
`{match, reason}` in Task 1 and read as one by Task 1's two staleness tests and by
`referenceResolves`. `hasAccessibleName(el, acceptsText, resolveId)` is defined in Task 2 Step 5 and
called with three arguments in Task 2 Step 6 from both `roleOf` and `evaluate`. `roleOf(el,
resolveId)` is defined in Task 2 Step 6 and called with two arguments at **all four** of its
`evaluate` sites in the same step — the count was measured off the file, not recalled, because two
of the four reach naming only through a `<section>` and read as unrelated. `ATTRIBUTE_FOR` is newly exported in Task 1 Step 4 and imported by Task 1's staleness
test in Step 2.
