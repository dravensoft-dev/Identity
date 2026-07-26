# 8C7 — Resolving IDREFs, checking "each", and governing the logical sides

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the compliance layer resolve the references it currently only counts, and check a
requirement quantified over *each* of something against every one of them — closing the two holes
that let 8C6 ship a component whose unselected tabs all pointed at a panel that did not exist.

**Architecture:** The shared evaluator stays DOM-generic, because it is consumed from three
runtimes and one of them has no DOM. Resolution is therefore **injected**: the caller supplies
`resolveId`, scoped to the rendered tree. Quantification is a **curated map** keyed
`pattern:requirement`, never derived from prose. A third, unrelated change rides along because it
is four lines and the same kind of gap: the logical `border`/`inset` sides join `check:dimensions`'
governed properties.

**Tech Stack:** Bun (build, test), `node:test` + `node:assert/strict`, happy-dom for the render
suites, plain node for the evaluator's own suite.

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
6. **Generated output is committed and its generator runs in the same task** — `bun run
   build:demos` for a component `.jsx`, `bun run build:tailwind` for a manifest, `bun run
   build:api` for a contract. No task here should need any of them, but the rule stands.
7. **The shared evaluator may touch only four DOM members** — `tagName`, `getAttribute`,
   `hasAttribute`, `textContent`. It runs under plain node in its own suite. Anything richer
   belongs to the caller and arrives as an injected function.
8. **A gate never degrades silently.** Where this plan says *throw*, it means throw: falling back
   to the weaker check would rebuild the hole the task exists to close.
9. **Never weaken an assertion to make a suite pass.** If a component fails one of the new checks,
   the component has a defect and the defect is what gets fixed.

---

## What this plan measured before it was written

Read off the tree at `4859c91` on 2026-07-26. Verify anything you depend on; do not re-derive.

| measure | value |
|---|---|
| requirements across `behaviour/patterns/` | 103 |
| requirements carrying an IDREF | 5, across 4 patterns |
| IDREF attributes rendered in the React layer | 22, none resolved by any gate |
| covered bindings affected | 3 of 10, all React |
| logical `border`/`inset` in `PROPS` | absent |
| uses of a logical `border`/`inset` side under `frameworks/` | 0 |

Facts the tasks below depend on, each read off the source rather than recalled:

- `evaluate(el, key, value, patternName)` lives in `scripts/lib/behaviour-compliance.mjs`. Its
  IDREF branch today is `const attr = ATTRIBUTE_FOR[key]; if (attr) return el.getAttribute(attr)
  !== null;` — a pure presence check.
- `ATTRIBUTE_FOR` already maps `roles.controls`, `roles.describedby` and `roles.activedescendant`
  to their attributes, alongside four non-IDREF keys.
- `comparePattern({ pattern, binding, subjects = {}, fallback = null, behavioural = {} })` reads
  one subject per requirement: `const el = key in subjects ? subjects[key] : fallback;`.
- It already throws for two programming errors — an unknown requirement key, and a `roles.element`
  requirement whose pattern has no `ELEMENT_ROLE` entry — under the stated policy that *"`null` is
  never a fallthrough"*.
- `states.posinset` is in `BEHAVIOURAL`; `states.selected`, `roles.controls` and
  `roles.describedby` are in `ATTRIBUTE_FOR` and therefore `DECIDABLE`. Verified.
- The evaluator's own suite is `scripts/behaviour-compliance.test.mjs`, and it runs under plain
  node with stub elements.
- The two wrappers are `frameworks/react/test-dom/assert-pattern.jsx` and
  `frameworks/angular/test/compliance.ts`. The Angular one's default subject is the fixture's
  `nativeElement` **itself**, not its first element child — so an id may sit on the root, which the
  resolver must therefore search.
- `PROPS` in `scripts/check-dimension-literals.mjs` already carries the logical `padding` and
  `margin` families; `border` and `inset` are physical-only.

---

## File Structure

**Modified**

- `scripts/lib/behaviour-compliance.mjs` — the resolver parameter, the IDREF check, array subjects,
  and the two curated maps. The batch's centre.
- `scripts/behaviour-compliance.test.mjs` — every new branch, exercised with stubs under plain node.
- `frameworks/react/test-dom/assert-pattern.jsx` — builds and passes the resolver.
- `frameworks/angular/test/compliance.ts` — the same, typed.
- `frameworks/react/test-dom/tabs.test.jsx` — passes collections for the two quantified requirements.
- `scripts/check-dimension-literals.mjs` — `PROPS` gains the logical `border` and `inset` families.
- `scripts/check-dimension-literals.test.mjs` — if it asserts on `PROPS`; read it before assuming.
- `CLAUDE.md` — the Known debt entry 8C6 added about this exact hole is now partly false.

**Not modified, and that is a result rather than an omission**:
`frameworks/react/test-dom/side-nav-disclosure.test.jsx` and `tooltip-keyboard.test.jsx` need no
change — their requirements are not quantified and their references already resolve. Task 5 proves
that rather than assuming it.

---

## Task 1: The logical sides join the governed properties

**Files:**
- Modify: `scripts/check-dimension-literals.mjs` (the `PROPS` set)
- Test: `scripts/check-dimension-literals.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. It is deliberately first because it is independent of the rest of the batch and
  small enough to warm up on.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Confirm there is nothing to fix, only something to prevent**

```bash
grep -rn "borderInline\|borderBlock\|insetInline\|insetBlock" frameworks/ \
  --include='*.jsx' --include='*.ts' --include='*.tsx' | grep -v node_modules
```

Expected: no output. If there ARE hits, they are live violations this task must fix rather than
grandfather — report them and fix the values, never add an `EXEMPT` entry.

- [ ] **Step 3: Read the gate's own test before touching the gate**

Run: `grep -n "PROPS" scripts/check-dimension-literals.test.mjs`

If that suite asserts on `PROPS` by value, your change to the set is a change to the suite too —
CLAUDE.md carries that rule for `EXEMPT` and `PASSTHROUGH` and it applies to any map the suite
pins. If it does not assert on `PROPS`, no change is needed there.

- [ ] **Step 4: Write the failing test**

Add to `scripts/check-dimension-literals.test.mjs`, beside the existing scan tests:

```js
/* The logical border and inset families were ungoverned while their physical
 * counterparts were governed -- the same shape as the padding-inline-start hole
 * plan 8C5 found and walked straight through with its own split of a shorthand.
 * There were zero uses when this landed, so these tests ARE the proof: without
 * them a reader cannot tell a governed property from an ungoverned one. */
test('a bare literal in a logical border side is a violation', () => {
  const hits = scanText("const s = { borderInlineStart: '2px solid var(--border)' };");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].prop, 'borderInlineStart');
});

test('a bare literal in a logical inset side is a violation', () => {
  const hits = scanText("const s = { insetBlockStart: '12px' };");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].prop, 'insetBlockStart');
});

test('a token in a logical side is not a violation', () => {
  assert.deepEqual(scanText("const s = { borderInlineEnd: 'var(--bw) solid var(--border)' };"), []);
  assert.deepEqual(scanText("const s = { insetInlineStart: 'calc(var(--sp-1) * 2)' };"), []);
});
```

`scanText` is already exported and already used by that suite — check the import line rather than
adding a second one.

- [ ] **Step 5: Run it and watch it fail**

Run: `bun test scripts/check-dimension-literals.test.mjs`
Expected: FAIL — the two violation tests report `0` hits, because the properties are ungoverned.

- [ ] **Step 6: Govern them**

In `PROPS`, beside the physical border and inset entries, add both families with a comment in the
voice of the one above them:

```js
  /* The logical BORDER and INSET sides, added for the reason their padding and
   * margin counterparts were: a logical spelling was one word away from being
   * invisible to this gate while its physical twin was governed. Verified against
   * the tree when added: ZERO sites in frameworks/ use any of them, so this is a
   * ratchet rather than a fix, and the suite above is what proves it works. */
  'borderInline', 'borderBlock',
  'borderInlineStart', 'borderInlineEnd', 'borderBlockStart', 'borderBlockEnd',
  'insetInline', 'insetBlock',
  'insetInlineStart', 'insetInlineEnd', 'insetBlockStart', 'insetBlockEnd',
```

- [ ] **Step 7: Run the tests and the gate**

```bash
bun test scripts/check-dimension-literals.test.mjs   # PASS
bun run check:dimensions                             # clean, no stale exemptions
```

- [ ] **Step 8: Induce a real violation in a real file**

A unit test proves the scanner; this proves the gate. Pick any component under `frameworks/react/`,
take its `sha256sum` first, add `borderInlineStart: '3px'` to an existing style object, and run:

```bash
bun run check:dimensions
```

Expected: FAIL, naming the file, the line and `borderInlineStart`. Then restore and prove it:

```bash
git checkout -- <the file>
sha256sum -c <the guard file>
bun run check:dimensions    # clean again
```

- [ ] **Step 9: Commit**

```bash
git commit -q -F - <<'MSG'
feat(check:dimensions): govern the logical border and inset sides

`padding` and `margin` were governed in both spellings; `border` and `inset` in
the physical one only. A logical border width was one word away from being
invisible to the gate -- the same hole 8C5 found in `padding-inline-start` and
walked straight through with its own split of a shorthand.

Zero sites use any of them today, so this is a ratchet and not a fix, and a
ratchet that catches nothing on the day it lands is invisible unless it is
induced: `borderInlineStart: '3px'` written into a real component failed the
gate by name, and the tree was restored and verified with sha256sum -c.
MSG
```

---

## Task 2: `resolveId` — an IDREF must resolve, not merely exist

**Files:**
- Modify: `scripts/lib/behaviour-compliance.mjs` (`evaluate`, `comparePattern`, one new export)
- Test: `scripts/behaviour-compliance.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `evaluate(el, key, value, patternName, resolveId)` — one new trailing parameter, so
  every existing call that passes four arguments keeps working for every non-IDREF requirement.
  `comparePattern({ pattern, binding, subjects, fallback, behavioural, resolveId })` — one new
  option. `export const IDREF` — the set of requirement keys whose attribute is a reference.
  Task 4 supplies the resolver; Task 3 threads it through the array path.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing tests**

Add to `scripts/behaviour-compliance.test.mjs`. The suite runs under plain node with stub elements,
so a stub resolver is just a function:

```js
/* A stub element: the evaluator touches only tagName, getAttribute,
   hasAttribute and textContent, which is what lets this suite run with no DOM. */
const el = (tag, attrs = {}) => ({
  tagName: tag.toUpperCase(),
  getAttribute: (n) => (n in attrs ? attrs[n] : null),
  hasAttribute: (n) => n in attrs,
  textContent: attrs.textContent ?? '',
});

test('an IDREF that resolves meets the requirement', () => {
  const tab = el('button', { 'aria-controls': 'panel-1' });
  const resolve = (id) => (id === 'panel-1' ? el('div') : null);
  assert.equal(evaluate(tab, 'roles.controls', 'each tab…', 'tabs', resolve), true);
});

test('an IDREF that dangles does NOT meet it, though the attribute is present', () => {
  const tab = el('button', { 'aria-controls': 'panel-9' });
  const resolve = () => null;
  assert.equal(evaluate(tab, 'roles.controls', 'each tab…', 'tabs', resolve), false);
});

test('a missing IDREF attribute is unmet without consulting the resolver', () => {
  let asked = false;
  const resolve = () => { asked = true; return null; };
  assert.equal(evaluate(el('button'), 'roles.controls', 'x', 'tabs', resolve), false);
  assert.equal(asked, false, 'the resolver was consulted for an absent attribute');
});

/* aria-describedby holds a SPACE-SEPARATED LIST, and Tooltip merges the
   consumer's own description with the bubble's id. A consumer's id may name an
   element outside the component's own rendered tree, which is legitimate -- so
   the requirement is met when the reference to OUR element lands, not when every
   id in the list does. */
test('one resolving id in a list is enough', () => {
  const trigger = el('button', { 'aria-describedby': 'consumer-hint tooltip-1' });
  const resolve = (id) => (id === 'tooltip-1' ? el('span') : null);
  assert.equal(evaluate(trigger, 'roles.describedby', 'x', 'tooltip', resolve), true);
});

test('a list where nothing resolves is unmet', () => {
  const trigger = el('button', { 'aria-describedby': 'a b' });
  assert.equal(evaluate(trigger, 'roles.describedby', 'x', 'tooltip', () => null), false);
});

test('an IDREF requirement with no resolver THROWS rather than falling back', () => {
  const tab = el('button', { 'aria-controls': 'panel-1' });
  assert.throws(
    () => evaluate(tab, 'roles.controls', 'x', 'tabs'),
    /roles\.controls.*resolveId/s,
  );
});

test('a non-IDREF attribute requirement still needs no resolver', () => {
  const t = el('button', { 'aria-selected': 'false' });
  assert.equal(evaluate(t, 'states.selected', 'x', 'tabs'), true);
});

test('comparePattern reports a dangling reference as an OVERCLAIM', () => {
  const problems = comparePattern({
    pattern: { name: 'disclosure', requires: { 'roles.controls': 'aria-controls on the button' } },
    binding: { pattern: 'disclosure', exceptions: [] },
    subjects: { 'roles.controls': el('button', { 'aria-controls': 'gone' }) },
    resolveId: () => null,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /roles\.controls: OVERCLAIM/);
});

test('a dangling reference with an exception declared is not a problem', () => {
  const problems = comparePattern({
    pattern: { name: 'disclosure', requires: { 'roles.controls': 'aria-controls on the button' } },
    binding: { pattern: 'disclosure', exceptions: [{ requirement: 'roles.controls', reason: 'known' }] },
    subjects: { 'roles.controls': el('button', { 'aria-controls': 'gone' }) },
    resolveId: () => null,
  });
  assert.deepEqual(problems, []);
});

test('a resolving reference with an exception declared is a STALE EXCEPTION', () => {
  const problems = comparePattern({
    pattern: { name: 'disclosure', requires: { 'roles.controls': 'aria-controls on the button' } },
    binding: { pattern: 'disclosure', exceptions: [{ requirement: 'roles.controls', reason: 'stale' }] },
    subjects: { 'roles.controls': el('button', { 'aria-controls': 'region-1' }) },
    resolveId: () => el('div'),
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /STALE EXCEPTION/);
});
```

Match the suite's existing import line rather than adding a second one; `evaluate` and
`comparePattern` are already imported there.

- [ ] **Step 3: Run them and watch them fail**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: FAIL. The dangling cases return `true` today, because the check is presence-only, and the
no-resolver case does not throw.

- [ ] **Step 4: Name the IDREF requirements**

In `scripts/lib/behaviour-compliance.mjs`, beside `ATTRIBUTE_FOR`:

```js
/** The requirement keys whose attribute is a REFERENCE rather than a value. For
 *  these, presence is not the claim: `aria-controls="panel-9"` with no element
 *  called panel-9 is a broken reference that reads as met to a presence check.
 *  8C6 shipped exactly that -- `Tabs` carried one `aria-controls` per tab and
 *  rendered one panel, so N-1 references pointed at nothing and `roles.controls`
 *  passed.
 *
 *  Resolution needs the tree, and this file may not have it (see the header: it
 *  runs under plain node in its own suite), so the caller injects `resolveId`. */
export const IDREF = new Set(['roles.controls', 'roles.describedby', 'roles.activedescendant']);
```

- [ ] **Step 5: Teach `evaluate` to resolve**

Replace the two-line `ATTRIBUTE_FOR` branch with:

```js
  const attr = ATTRIBUTE_FOR[key];
  if (attr) {
    const raw = el.getAttribute(attr);
    if (raw === null) return false;
    if (!IDREF.has(key)) return true;
    if (typeof resolveId !== 'function') {
      throw new Error(
        `evaluate: requirement "${key}" carries an IDREF and no resolveId was supplied. ` +
        'Pass resolveId to comparePattern -- each wrapper builds one scoped to the rendered ' +
        'tree. Falling back to a presence check would report a dangling reference as met, ' +
        'which is the defect this parameter exists to catch.',
      );
    }
    /* A space-separated list, and ONE resolving id is the claim. aria-describedby
     * legitimately carries the consumer's own description alongside ours, and that
     * one may name an element outside the component's rendered tree -- demanding
     * that every id resolve would fail a correct component. */
    const ids = raw.split(/\s+/).filter(Boolean);
    return ids.some((id) => resolveId(id) != null);
  }
```

Widen `evaluate`'s signature to `(el, key, value, patternName, resolveId)` and its JSDoc with a
line for the new parameter.

- [ ] **Step 6: Thread it through `comparePattern`**

Add `resolveId` to the destructured options and pass it as `evaluate`'s fifth argument. Document
the option in the function's JSDoc, naming what it must be scoped to.

- [ ] **Step 7: Run the tests**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: PASS, all of them.

- [ ] **Step 8: Confirm nothing else moved yet**

Run: `bun test scripts`
Expected: PASS. `check:compliance` reads bindings and suite filenames rather than rendering, so it
is unaffected; the render suites break in Task 4, not here, because none of them passes a resolver
yet and their patterns' IDREF requirements will now throw. **That is expected and is what Task 4
repairs** — do not "fix" it here by making the throw conditional.

- [ ] **Step 9: Commit**

```bash
git commit -q -F - <<'MSG'
feat(compliance): an IDREF must resolve, not merely be present

`roles.controls`, `roles.describedby` and `roles.activedescendant` were checked
with `getAttribute(attr) !== null`, which cannot tell a reference that lands from
one that dangles. 8C6 shipped the consequence: `Tabs` rendered one
`aria-controls` per tab and one panel, so every unselected tab pointed at an id
that existed nowhere, and the requirement passed.

Resolution needs the tree and this file may not have one -- it is consumed from
three runtimes, one of them plain node in its own suite -- so the caller injects
`resolveId`. A pattern that carries an IDREF requirement and is given no resolver
THROWS, because degrading to the old presence check would rebuild the hole in
silence, and this file's own policy is that `null` is never a fallthrough.

One resolving id in a space-separated list is the claim rather than all of them:
`aria-describedby` legitimately carries the consumer's own description beside
ours, and that one may name an element outside the component's rendered tree.

The render suites do not pass a resolver yet and will throw until the next task
plumbs one through. That is the throw working.
MSG
```

---

## Task 3: A requirement quantified over "each" is checked against each

**Files:**
- Modify: `scripts/lib/behaviour-compliance.mjs` (`comparePattern`, two new exports)
- Test: `scripts/behaviour-compliance.test.mjs`

**Interfaces:**
- Consumes: `comparePattern`'s `resolveId` option from Task 2.
- Produces: `subjects[key]` may be an array. `export const QUANTIFIED` (a `Map` of
  `pattern:requirement` → reason) and `export const NOT_QUANTIFIED` (the same shape, for the two
  requirements whose prose quantifies but which are deliberately excluded). Task 5's `Tabs` suite
  passes arrays because of this.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing tests**

```js
test('an array subject is met only when every element meets it', () => {
  const ok = el('button', { 'aria-selected': 'false' });
  const bad = el('button');
  const p = (subject) => comparePattern({
    pattern: { name: 'tabs', requires: { 'states.selected': 'true on the active tab, false on the rest' } },
    binding: { pattern: 'tabs', exceptions: [] },
    subjects: { 'states.selected': subject },
    resolveId: () => el('div'),
  });
  assert.deepEqual(p([ok, ok, ok]), []);
  assert.equal(p([ok, bad, ok]).length, 1);
  assert.match(p([ok, bad, ok])[0], /OVERCLAIM/);
});

test('the OVERCLAIM says how many of the collection failed', () => {
  const ok = el('button', { 'aria-selected': 'false' });
  const bad = el('button');
  const problems = comparePattern({
    pattern: { name: 'tabs', requires: { 'states.selected': 'x' } },
    binding: { pattern: 'tabs', exceptions: [] },
    subjects: { 'states.selected': [ok, bad, bad] },
    resolveId: () => el('div'),
  });
  assert.match(problems[0], /2 of 3/);
});

test('a quantified requirement given ONE element throws', () => {
  assert.throws(
    () => comparePattern({
      pattern: { name: 'tabs', requires: { 'states.selected': 'x' } },
      binding: { pattern: 'tabs', exceptions: [] },
      subjects: { 'states.selected': el('button', { 'aria-selected': 'true' }) },
      resolveId: () => el('div'),
    }),
    /quantified.*array/s,
  );
});

test('an unquantified requirement given one element is still fine', () => {
  const problems = comparePattern({
    pattern: { name: 'disclosure', requires: { 'roles.expanded': 'aria-expanded' } },
    binding: { pattern: 'disclosure', exceptions: [] },
    subjects: { 'roles.expanded': el('button', { 'aria-expanded': 'false' }) },
  });
  assert.deepEqual(problems, []);
});

test('an empty array reads as a missing subject, not as vacuously met', () => {
  const problems = comparePattern({
    pattern: { name: 'tabs', requires: { 'states.selected': 'x' } },
    binding: { pattern: 'tabs', exceptions: [] },
    subjects: { 'states.selected': [] },
    resolveId: () => el('div'),
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no subject element/);
});

/* The curated maps carry EXEMPT's discipline: an entry that no longer names a
   real pattern requirement fails this suite rather than rotting quietly. */
test('every QUANTIFIED and NOT_QUANTIFIED key names a real pattern requirement', () => {
  const patterns = loadPatterns(repoRoot);
  for (const map of [QUANTIFIED, NOT_QUANTIFIED]) {
    for (const key of map.keys()) {
      const [name, requirement] = key.split(':');
      const pattern = patterns.get(name);
      assert.ok(pattern, `${key}: no pattern file called "${name}"`);
      assert.ok(requirement in pattern.requires, `${key}: pattern "${name}" declares no "${requirement}"`);
    }
  }
});

test('every QUANTIFIED requirement is decidable per element', () => {
  for (const key of QUANTIFIED.keys()) {
    const requirement = key.split(':')[1];
    assert.ok(DECIDABLE.has(requirement),
      `${key}: quantifying needs a per-element verdict, and this requirement is behavioural`);
  }
});

test('every entry carries a reason', () => {
  for (const map of [QUANTIFIED, NOT_QUANTIFIED]) {
    for (const [key, reason] of map) {
      assert.ok(typeof reason === 'string' && reason.length > 20, `${key}: no reason on file`);
    }
  }
});
```

`loadPatterns` comes from `scripts/lib/behaviour-contracts.mjs` and `repoRoot` is already derived
in that suite — read its top rather than adding a second derivation. Import `QUANTIFIED`,
`NOT_QUANTIFIED` and `DECIDABLE` alongside the existing imports.

- [ ] **Step 3: Run them and watch them fail**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: FAIL — the maps do not exist and an array subject is treated as one opaque element.

- [ ] **Step 4: Write the two maps**

```js
/** Requirements whose prose quantifies over EVERY matching element, so a suite
 *  must hand over a collection and one element is not an answer. Keyed
 *  `pattern:requirement`.
 *
 *  HAND-CURATED, NEVER DERIVED. A scan for the word "each" finds four
 *  requirements; reading the prose finds at least five, because
 *  tabs:states.selected says "false on the REST". Deriving this would rebuild the
 *  false-negative class this file's header already rejected once. Semantics key
 *  off the requirement KEY and the PATTERN NAME, never off the human prose. */
export const QUANTIFIED = new Map([
  ['listbox:states.selected',
    'aria-selected is true on each selected option and false on the rest, so one option cannot answer for the list.'],
  ['tabs:roles.controls',
    'each tab references its own tabpanel; checking only the selected one is exactly the defect 8C6 shipped.'],
  ['tabs:states.selected',
    'true on the active tab and false on the rest -- the same quantification listbox states, written as "the rest".'],
]);

/** Requirements whose prose quantifies but which are deliberately NOT in the map
 *  above, each with the reason. They are listed rather than merely absent so the
 *  next reader meets the decision instead of the silence, and so the staleness
 *  test can prove they still name real requirements. */
export const NOT_QUANTIFIED = new Map([
  ['feed:states.posinset',
    'BEHAVIOURAL rather than decidable: its prose carries a "when" (-1 for setsize when the total is unknown), so a snapshot of one element cannot answer it and evaluate() returns null. There is no per-element verdict to quantify over.'],
  ['navigation:roles.label',
    'quantifies over navigation landmarks on a PAGE, and only when more than one exists. A component suite renders one component; requiring a collection would force fixtures to render two landmarks to satisfy a rule that is not a claim about the component.'],
]);
```

- [ ] **Step 5: Teach `comparePattern` to take a collection**

Replace the single-subject line and the verdict computation:

```js
    const subject = key in subjects ? subjects[key] : fallback;
    const quantified = QUANTIFIED.has(`${pattern.name}:${key}`);
    if (quantified && !Array.isArray(subject)) {
      throw new Error(
        `comparePattern: "${key}" of pattern "${pattern.name}" is quantified over every matching ` +
        'element, but its subject is a single element. Pass an array -- checking one is the ' +
        `defect this rule exists to catch.\n      reason on file: ${QUANTIFIED.get(`${pattern.name}:${key}`)}`,
      );
    }
    const els = Array.isArray(subject) ? subject : (subject ? [subject] : []);
    if (!els.length) {
      missedSubject = true;
      problems.push(`${key}: no subject element — nothing was rendered, or the selector matched nothing.`);
      continue;
    }
    const verdicts = els.map((one) => evaluate(one, key, value, pattern.name, resolveId));
    /* One undecidable element makes the whole requirement undecidable: a
       collection cannot be half-behavioural. */
    const domVerdict = verdicts.includes(null) ? null : verdicts.every(Boolean);
```

and widen the OVERCLAIM message so a collection failure says how many:

```js
      const scale = els.length > 1 ? ` (${verdicts.filter((v) => v === false).length} of ${els.length} failed)` : '';
      problems.push(
        `${key}: OVERCLAIM${scale} — the binding declares no exception, but ${source} does not meet it.\n` +
        `      pattern requires: ${JSON.stringify(value)}`,
      );
```

- [ ] **Step 6: Run the tests**

Run: `bun test scripts/behaviour-compliance.test.mjs` → PASS.

- [ ] **Step 7: Run the whole scripts suite**

Run: `bun test scripts` → PASS. The render suites are still expected to be red until Task 4.

- [ ] **Step 8: Commit**

```bash
git commit -q -F - <<'MSG'
feat(compliance): check a requirement quantified over "each" against each

`subjects[key]` may now be an array, and every element must meet the requirement
for it to be met. For the requirements whose prose quantifies, a single element
THROWS -- checking one is precisely the defect, and it is what let 8C6's `Tabs`
suite pass a `roles.controls` that was true of exactly one of three tabs.

The set is hand-curated and the measurement is the argument: a scan for the word
"each" finds four requirements, while reading the prose finds at least five,
since `tabs:states.selected` says "false on the rest". Deriving it would rebuild
the false-negative class this file's header already rejected once.

Two requirements whose prose quantifies are excluded and say why in their own
entries rather than being silently absent: `feed:states.posinset` is behavioural,
so there is no per-element verdict to quantify, and `navigation:roles.label`
quantifies over landmarks on a PAGE and only when more than one exists.

Both maps carry EXEMPT's staleness discipline -- an entry naming a requirement
that no longer exists fails the suite -- plus a rule the other maps have no
analogue for: a quantified requirement must be decidable per element.
MSG
```

---

## Task 4: Both wrappers build the resolver

**Files:**
- Modify: `frameworks/react/test-dom/assert-pattern.jsx`
- Modify: `frameworks/angular/test/compliance.ts`

**Interfaces:**
- Consumes: `comparePattern`'s `resolveId` option (Task 2).
- Produces: nothing new in either wrapper's own signature — `assertPattern({ root, bindingPath,
  subjects, behavioural })` is unchanged for callers. The resolver is built from `root` internally,
  which is the point: a suite cannot forget to pass one.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Confirm the suites are red for the expected reason**

Run: `bun run test:react-dom`
Expected: FAIL, with the throw from Task 2 naming `resolveId`, in the suites whose patterns carry an
IDREF requirement — `side-nav-disclosure`, `tabs` and `tooltip-keyboard`. If a suite fails for any
other reason, stop and report it.

- [ ] **Step 3: Build the resolver in the React wrapper**

In `frameworks/react/test-dom/assert-pattern.jsx`, above `assertPattern`:

```js
/** Resolve an id WITHIN the rendered tree, which is what an IDREF requirement
 *  claims -- resolving against the whole document would also find a container a
 *  previous test left behind, and would pass in a page where the id belongs to
 *  something else entirely.
 *
 *  It walks `[id]` and compares in JavaScript rather than building `#${id}`,
 *  because an id is legal in HTML in shapes that are a SyntaxError inside a CSS
 *  selector -- the colons `useId()` returns are the case this repo already paid
 *  for. A test tree is small enough that the walk costs nothing worth a bug.
 *
 *  `root` itself is searched as well as its descendants: querySelectorAll does
 *  not include the element it is called on, and an id can sit on the root. */
function resolverFor(root) {
  return (id) => {
    if (root.getAttribute && root.getAttribute('id') === id) return root;
    for (const el of root.querySelectorAll('[id]')) {
      if (el.getAttribute('id') === id) return el;
    }
    return null;
  };
}
```

and pass `resolveId: resolverFor(root)` in the `comparePattern` call.

- [ ] **Step 4: Run the React suites**

Run: `bun run test:react-dom`
Expected: the `resolveId` throws are gone. `tabs.test.jsx` should now fail with the Task 3 throw —
`states.selected` and `roles.controls` are quantified and it passes single elements. That is Task
5's repair; every other suite must be green here.

- [ ] **Step 5: Do the same in the Angular wrapper**

`frameworks/angular/test/compliance.ts` gets the same function, typed, and the same option. Its
root is the fixture's `nativeElement` itself rather than a container's first child, so searching
the root is not optional there — say so in the comment rather than repeating React's.

- [ ] **Step 6: Run the Angular suites**

Run: `bun test frameworks/angular/test`
Expected: PASS. Neither covered Angular binding carries an IDREF requirement today, so this task
changes nothing for them — it keeps the two wrappers the same shape so the next one that does need
it has nothing to discover.

- [ ] **Step 7: Commit**

```bash
git commit -q -F - <<'MSG'
test(compliance): both wrappers build a tree-scoped id resolver

The resolver is built from `root` inside each wrapper rather than passed in by a
suite, so a suite cannot forget one and quietly lose the check.

Scoped to the rendered tree, never `document`: an IDREF requirement claims that a
reference resolves WITHIN what was rendered, and resolving document-wide would
also find a container an earlier test left behind.

It walks `[id]` and compares in JavaScript rather than building `#${id}`, because
an id is legal in HTML in shapes that are a SyntaxError inside a CSS selector --
the colons `useId()` returns are the case this repo already paid for. It searches
`root` itself as well as its descendants, because querySelectorAll excludes the
element it is called on and Angular's default subject IS the host.

Angular's two covered bindings carry no IDREF requirement, so nothing changes for
them today; the wrapper gets it anyway so the layers stay one shape.
MSG
```

---

## Task 5: The three affected suites, and the proof the checks bite

**Files:**
- Modify: `frameworks/react/test-dom/tabs.test.jsx`
- Verify unchanged: `frameworks/react/test-dom/side-nav-disclosure.test.jsx`,
  `frameworks/react/test-dom/tooltip-keyboard.test.jsx`

**Interfaces:**
- Consumes: everything from Tasks 2–4.
- Produces: nothing.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Give `Tabs`' `assertPattern` its collections**

In `frameworks/react/test-dom/tabs.test.jsx`, the `subjects` map passes
`root.querySelector('[role="tab"]')` for `roles.controls` and `states.selected`. Both are
quantified now. Pass every tab, and say why:

```js
    subjects: {
      default: root.querySelector('[role="tablist"]'),
      'roles.tab': root.querySelector('[role="tab"]'),
      /* Quantified: the pattern says EACH tab references its tabpanel, and
         aria-selected is true on the active one and false on the rest. Handing
         over the selected tab alone is what let a strip with N-1 dangling
         references pass in 8C6 -- the one tab whose reference resolved was the
         one the fixture put first. */
      'roles.controls': [...root.querySelectorAll('[role="tab"]')],
      'states.selected': [...root.querySelectorAll('[role="tab"]')],
      'roles.tabpanel': root.querySelector('[role="tabpanel"]'),
    },
```

- [ ] **Step 3: Run the DOM suites**

Run: `bun run test:react-dom`
Expected: PASS, everything. All three affected components are correct: 8C6 gave `Tabs` one panel per
tab, and `SideNavCollapsible` and `Tooltip` were built with references that resolve.

**If any fails, the change has found a real defect** — report it and fix the component, never the
assertion.

- [ ] **Step 4: Prove the IDREF check bites, by induction**

`Tooltip` is the cheapest subject. Guard it, then break the reference so the attribute is present
and points nowhere:

```bash
sha256sum frameworks/react/components/feedback/Tooltip.jsx > /tmp/8c7-tt.sha
```

In `Tooltip.jsx`, change the cloned attribute's value to a constant that names no element — e.g.
`'tooltip-does-not-exist'` instead of the merged list — leaving the attribute present. Then:

```bash
bun run test:react-dom
```

Expected: FAIL, `roles.describedby: OVERCLAIM`. **This is the assertion that could not exist before
this batch**: the attribute is present, so the old presence check passed. Restore and prove it:

```bash
git checkout -- frameworks/react/components/feedback/Tooltip.jsx
sha256sum -c /tmp/8c7-tt.sha    # OK
bun run test:react-dom          # green again
```

- [ ] **Step 5: Prove the quantification bites, by induction**

Guard `Tabs.jsx`, then make the defect 8C6 actually shipped: render only the active panel again, so
every other tab's `aria-controls` dangles.

```bash
sha256sum frameworks/react/components/navigation/Tabs.jsx > /tmp/8c7-tabs.sha
```

In the panel map, wrap the returned `<div>` so only `i === at` renders one. Then:

```bash
bun run test:react-dom
```

Expected: FAIL with `roles.controls: OVERCLAIM (2 of 3 failed)` — the exact defect, caught by the
exact mechanism, with the count naming how much of the collection was wrong. Restore:

```bash
git checkout -- frameworks/react/components/navigation/Tabs.jsx
sha256sum -c /tmp/8c7-tabs.sha  # OK
bun run test:react-dom          # green again
```

- [ ] **Step 6: Run the compliance gate**

```bash
bun run check:compliance   # 10 of 70, every coverage claim current
bun run check:behaviour
```

- [ ] **Step 7: Commit**

```bash
git commit -q -F - <<'MSG'
test(Tabs): hand the quantified requirements every tab, not the first one

`roles.controls` and `states.selected` are quantified over every tab, and this
suite passed `querySelector('[role="tab"]')` -- the FIRST tab, which its fixture
makes the selected one, and the selected tab was the only one whose reference
resolved. That is not a hypothetical: it is how 8C6 shipped a strip where every
unselected tab pointed at a panel that did not exist.

The other two affected suites needed no change, which this task verified rather
than assumed: `SideNavCollapsible` and `Tooltip` both render references that
resolve.

Both new checks were induced against real components and watched to fail --
`Tooltip`'s description pointed at a name nothing renders (present attribute,
dangling reference, invisible to the old presence check), and `Tabs` went back to
rendering one panel, which reported `2 of 3 failed`. Each tree was restored and
verified with sha256sum -c.
MSG
```

---

## Task 6: Close-out

**Files:**
- Modify: `CLAUDE.md`
- Verify: `docs/superpowers/specs/` carries no `-pending-N` suffix

**Interfaces:**
- Consumes: everything.
- Produces: a green tree.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Correct the Known debt entry this batch makes false**

8C6's final fix wave added an entry recording that `ATTRIBUTE_FOR` requirements are evaluated as
pure attribute **presence** on the **one** subject element a suite chooses, that a requirement
quantified over *each* of something is therefore only ever checked once, and that **no IDREF is
resolved anywhere in the compliance layer**. Find it — `grep -n "IDREF" CLAUDE.md` — and rewrite it
to say what is now true and what is still not.

What survives and must stay: a resolved reference is not proof it landed on the **right** element,
because a pattern cannot say what kind of element a reference must reach; and the requirements
`NOT_QUANTIFIED` excludes are excluded for stated reasons rather than closed.

Do not write a figure that will go stale. Where a count is wanted, name the command.

- [ ] **Step 3: Sweep for other prose this batch falsified**

```bash
grep -n "presence\|IDREF\|one subject" CLAUDE.md scripts/lib/behaviour-compliance.mjs | head -20
```

The evaluator's own header describes what it touches and why. It is still accurate — the file still
touches four DOM members — but check whether any sentence claims resolution is impossible rather
than merely absent, and correct it if so.

- [ ] **Step 4: Run the full sweep, once**

```bash
export CHROME_PATH=/usr/bin/chromium
ARENA_CHECK_STRICT=1 bun run check
```

Expected: `check-all: all 23 step(s) passed`. If any step fails, STOP and report BLOCKED with the
failing step's output — never fix a gate to make it agree.

- [ ] **Step 5: Confirm the batch's own claims**

```bash
bun run check:compliance    # 10 of 70
bun run check:dimensions    # clean, no stale exemptions
bun test scripts            # all pass, including the two staleness tests
```

- [ ] **Step 6: Confirm the spec carries no `-pending-N` suffix**

Run: `ls docs/superpowers/specs/ | grep pending`
Expected: no output — it was dropped in the commit that added this plan.

- [ ] **Step 7: Commit**

```bash
git commit -q -F - <<'MSG'
docs: close out 8C7 — the compliance debt entry this batch made false

8C6 recorded that the compliance layer checks attribute PRESENCE on the ONE
subject a suite chooses, so a requirement quantified over "each" is checked once
and no IDREF is resolved anywhere. Both halves are now false and the entry says
what replaced them.

What survives is the part neither half closed: a resolved reference is not proof
it landed on the RIGHT element, because a pattern cannot say what kind of element
a reference must reach. Closing that is a change to the pattern schema and is not
this batch.

Full `bun run check` run once, at close-out, per the rule that the sweep is a
completion gate rather than a per-commit toll.
MSG
```

---

## Self-review

**Spec coverage.** Part 1 (IDREF resolution: injected resolver, root-scoped, no CSS selector, throw
when absent) → Task 2 for the evaluator half and Task 4 for the wrappers. Part 1's last paragraph
(a resolved reference does not prove the right element) → recorded, not implemented, and Task 6
Step 2 makes sure it survives into the debt record. Part 2 (array subjects, the curated map, the
two exclusions, the staleness rule) → Task 3. Part 3 (logical sides) → Task 1. Part 4 (blast
radius) → Task 5, which changes the one suite that needs it and verifies the two that do not.
Part 5 (verification) → the induction steps in Tasks 1 and 5, and the evaluator's own suite in
Tasks 2 and 3. Part 6 (out of scope) → untouched by every task, deliberately.

**One ordering hazard, stated because it will look like a failure.** Task 2 makes the render suites
throw, and they stay red until Task 4. That is the throw working as designed, and both tasks say
so; an implementer who "fixes" it inside Task 2 by making the throw conditional has removed the
batch's central guarantee.

**Type consistency.** `evaluate(el, key, value, patternName, resolveId)` is defined in Task 2 and
called with five arguments in Task 3's array map. `comparePattern`'s option is `resolveId` in Tasks
2, 3 and 4. `QUANTIFIED` and `NOT_QUANTIFIED` are `Map`s in Task 3 and read as `Map`s by its
staleness tests. `resolverFor(root)` returns `(id) => element | null` in Task 4, which is what
Task 2's throw message promises.
