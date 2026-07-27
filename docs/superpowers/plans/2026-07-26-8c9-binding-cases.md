# 8C9 — A binding describes a component; compliance judges a render

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a binding declare `cases` — named render configurations, each with its own pattern and
exceptions — so a component that renders differently depending on its own props can be described
truthfully, and make a suite prove **every** declared case rather than the single one a flat binding
forces it to pin to.

**Architecture:** One normalizer, `bindingCases()`, is the single place the flat shape and the cased
shape are reconciled; every other consumer reads bindings through it. The shared evaluator does
**not** change: `comparePattern()` reads only `binding.exceptions`, so each wrapper synthesizes a
per-case binding and calls it unchanged. Completeness is structural rather than tracked — the new
wrapper entry point drives the loop over declared cases and asks the suite to render each, so a
forgotten case is impossible rather than merely detected.

**Tech Stack:** Bun (build, test), `node:test` + `node:assert/strict`, plain node for the evaluator's
own suite, happy-dom for the render suites, Angular JIT + `TestBed` for the Angular suites.

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only**, in code, comments, docs and commit messages.
2. **A commit message containing a backtick uses a quoted here-doc** — `git commit -q -F - <<'MSG'
   … MSG` — never `git commit -m`. A backtick inside a double-quoted shell string opens command
   substitution and is silently spliced away while nothing errors. Verify with
   `git log -1 --format=%B` and confirm the backticks survived.
3. **The first step of every task is `git status --short`**, and it must be clean.
4. **`bun run check` in full runs ONCE, at close-out.** Individual gates are named per task.
5. **Run the React DOM suites with `bun run test:react-dom`, NEVER `bun test
   frameworks/react/test-dom`.** Without the `--preload`, react-dom latches its legacy
   change-detection path at module evaluation and a dispatched event reaches a handler zero times,
   silently.
6. **The shared evaluator may touch only four DOM members** — `tagName`, `getAttribute`,
   `hasAttribute`, `textContent`. It runs under plain node in its own suite.
7. **`scripts/lib/behaviour-compliance.mjs` is NOT modified by this plan.** If a task appears to
   need a change there, stop and report — it means the case shape leaked into the evaluator, which
   the architecture exists to prevent.
8. **No component source under `frameworks/react/components/` or `frameworks/angular/primitives/`
   changes**, except temporarily inside a guarded induction restored with `git checkout --` and
   proved restored with `sha256sum -c`. This batch changes what the layer can *say*, not what any
   component *does*.
9. **Never weaken an assertion to make a suite pass.** If a converted binding fails, the component
   has a real defect — stop and report it.
10. **A test under `scripts/` may not import a framework layer's `.ts` or `.jsx`.** `scripts/` is
    the one suite `check-all.mjs` also runs under plain node.

---

## What this plan measured before it was written

Read off the tree at `313bc12` on 2026-07-26, branch `8c9`. Verify anything you depend on.

| measure | value |
|---|---|
| `bun run check:compliance` | 10 of 70 |
| `bun run check:behaviour` | 21 pattern(s); 50 react + 20 angular + 30 delegated |
| `bun test scripts` | 588 pass |
| `bun run test:react-dom` | 98 pass across 12 files |
| `bun test frameworks/angular/test` | 336 pass |
| exceptions in component bindings | 63 (`grep -rho '"requirement"' --include='*.behaviour.json' frameworks/ \| wc -l`) |
| bindings with no `cases` field | 70, i.e. all of them |

Facts the tasks depend on, each read off the source:

- `comparePattern({pattern, binding, subjects, fallback, behavioural, resolveId})` uses `binding`
  for exactly one thing: `binding.exceptions ?? []`, on its first line. Nothing else.
- `loadBinding(absPath)` and `validateBinding(component, layer, binding, patterns)` live in
  `scripts/lib/behaviour-contracts.mjs`, exported so the gate and both suites read a binding through
  one code path.
- `binding.pattern` is read in exactly three places outside that file:
  `scripts/check-behaviour.mjs:122` (the cross-layer message), and
  `scripts/check-compliance.mjs:200` and `:208` (the inventory).
- `crossLayerAgrees(reactBinding, other)` is exported from `scripts/lib/behaviour-contracts.mjs` and
  is what step 6 of `check-behaviour.mjs` calls.
- Both wrappers — `frameworks/react/test-dom/assert-pattern.jsx` and
  `frameworks/angular/test/compliance.ts` — have the same body: `loadBinding`, look the pattern up
  in a cached map, split `subjects.default` off with `'default' in subjects` (the present-but-null
  distinction is load-bearing and documented in place), call `comparePattern`, and throw a joined
  message. The React fallback is `root.firstElementChild`; the Angular fallback is `root`.
- `Alert.jsx:16` renders `role={tone === 'danger' ? 'alert' : 'status'}`.
- `Toast.jsx:10` renders the same with `aria-live={tone === 'danger' ? 'assertive' : 'polite'}`.
- `Skeleton.jsx:25-27` returns the `circle` branch as `aria-hidden="true"` with **no** role; lines
  32, 39 and 41 render `role="status" aria-label="Loading"`.
- `Skeleton:react` and `Alert:angular` are already in `COVERED`. The other five converted bindings
  are not.

---

## File Structure

**Modified**

- `scripts/lib/behaviour-contracts.mjs` — `bindingCases()` (new export), `validateBinding()` and
  `crossLayerAgrees()` taught the cased shape.
- `scripts/behaviour-contracts.test.mjs` — unit tests for all three.
- `scripts/check-compliance.mjs` — inventory built through `bindingCases()`.
- `scripts/check-behaviour.mjs` — the cross-layer message names case names when they differ.
- `frameworks/react/test-dom/assert-pattern.jsx` — new `assertPatternCases()` export.
- `frameworks/angular/test/compliance.ts` — the same, in TypeScript.
- `behaviour/README.md` — the binding format section gains `cases`.
- Seven binding files and their suites (Tasks 5-7).
- `CLAUDE.md` — Task 8.

**Not modified, and that is a result rather than an omission:** `scripts/lib/behaviour-compliance.mjs`.
The evaluator never learns what a case is.

---

## Task 1: The normalizer, and the format it documents

**Files:**
- Modify: `scripts/lib/behaviour-contracts.mjs`
- Modify: `behaviour/README.md`
- Test: `scripts/behaviour-contracts.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `export function bindingCases(binding)` returning
  `Array<{name: string|null, when: string|null, pattern: string, exceptions: object[]}>`. A flat
  binding yields exactly one entry whose `name` is `null`. Tasks 2, 3 and 4 all consume it.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing tests**

Add to `scripts/behaviour-contracts.test.mjs`. Extend the existing import from
`./lib/behaviour-contracts.mjs` rather than adding a second import statement.

```js
test('a flat binding is one anonymous case', () => {
  const cases = bindingCases({ pattern: 'status', exceptions: [{ requirement: 'roles.label' }] });
  assert.equal(cases.length, 1);
  assert.equal(cases[0].name, null);
  assert.equal(cases[0].pattern, 'status');
  assert.equal(cases[0].exceptions.length, 1);
});

test('a flat binding with no exceptions still yields an exceptions array', () => {
  // comparePattern does `binding.exceptions ?? []` itself, but every OTHER
  // consumer would have to repeat that guard. Normalising once is the point.
  assert.deepEqual(bindingCases({ pattern: 'none' })[0].exceptions, []);
});

test('a cased binding yields one entry per case, in order', () => {
  const cases = bindingCases({
    cases: [
      { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
      { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
    ],
  });
  assert.deepEqual(cases.map((c) => c.name), ['danger', 'advisory']);
  assert.deepEqual(cases.map((c) => c.pattern), ['alert', 'status']);
});

/* `none` and `absent` REQUIRE a reason, so a case binding one must carry it or
   inherit the binding's -- otherwise Skeleton's circle case cannot be written at
   all, and every existing flat `none` binding would need rewriting. */
test('a case inherits the binding reason and may override it', () => {
  const [inherited] = bindingCases({ reason: 'from the binding',
    cases: [{ name: 'a', when: 'x', pattern: 'none', exceptions: [] }] });
  assert.equal(inherited.reason, 'from the binding');
  const [own] = bindingCases({ reason: 'from the binding',
    cases: [{ name: 'a', when: 'x', pattern: 'none', reason: 'its own', exceptions: [] }] });
  assert.equal(own.reason, 'its own');
  assert.equal(bindingCases({ pattern: 'status' })[0].reason, null);
});

/* The two shapes are alternatives. Carrying both is two places for one fact,
   which is the defect deriving IDREF from IDREF_ATTRIBUTES already fixed once. */
test('a binding declaring both pattern and cases is rejected by validateBinding', () => {
  const problems = validateBinding('Alert', 'react',
    { pattern: 'alert', cases: [{ name: 'x', when: 'y', pattern: 'alert', exceptions: [] }] },
    new Map([['alert', { name: 'alert', requires: {} }]]));
  assert.ok(problems.some((p) => /both .*pattern.* and .*cases/i.test(p)), problems.join('\n'));
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `bun test scripts/behaviour-contracts.test.mjs`
Expected: FAIL — `bindingCases` is not exported and `validateBinding` accepts the both-fields shape.

- [ ] **Step 4: Write the normalizer**

In `scripts/lib/behaviour-contracts.mjs`, immediately below `loadBinding`:

```js
/** A binding's render CASES, normalised, and the one place the two shapes meet.
 *
 *  A binding describes a component; comparePattern judges a RENDER. A component
 *  that renders differently depending on its own props is several renders, and no
 *  flat exception list is correct for all of them -- Skeleton's two exceptions are
 *  true of the circle variant and false of the other three, and its suite rendered
 *  circle specifically, so the binding looked honest and the component was half
 *  verified.
 *
 *  The flat shape stays valid and means ONE case, so the untouched majority of
 *  bindings is not churned to say what it already says. Every consumer reads
 *  bindings through here rather than testing for `cases` itself: a second place
 *  that decides what a case is would be free to disagree with this one.
 *
 *  An anonymous case (`name: null`) is how a flat binding presents itself, and it
 *  is what the wrappers refuse when a suite asks for cases by name.
 *
 *  `reason` rides along because a case may bind `none` or `absent`, and those
 *  REQUIRE one -- "nothing recorded", "verified presentational" and "does not
 *  exist here" must not look alike. A case's own reason wins; a flat binding's
 *  reason is carried in its place, which is what keeps every existing `none`
 *  binding valid without being rewritten.
 *  @param {{pattern?: string, exceptions?: object[], reason?: string, cases?: object[]}} binding
 *  @returns {Array<{name: string|null, when: string|null, pattern: string, reason: string|null, exceptions: object[]}>} */
export function bindingCases(binding) {
  if (!Array.isArray(binding.cases)) {
    return [{
      name: null,
      when: null,
      pattern: binding.pattern,
      reason: binding.reason ?? null,
      exceptions: binding.exceptions ?? [],
    }];
  }
  return binding.cases.map((c) => ({
    name: c.name ?? null,
    when: c.when ?? null,
    pattern: c.pattern,
    reason: c.reason ?? binding.reason ?? null,
    exceptions: c.exceptions ?? [],
  }));
}
```

- [ ] **Step 5: Teach `validateBinding` the cased shape**

`validateBinding` today reads `binding.pattern` directly and returns early on an unknown pattern.
Replace that opening with a loop over `bindingCases(binding)`, keeping every existing check inside
it, and add the mutual-exclusion check before it:

```js
  if ('pattern' in binding && Array.isArray(binding.cases)) {
    problems.push(`${where}: declares both "pattern" and "cases" — a binding declares one or the other. Two places for one fact is what deriving IDREF from IDREF_ATTRIBUTES fixed once already.`);
    return problems;
  }
  for (const c of bindingCases(binding)) {
    const label = c.name ? `${where} case "${c.name}"` : where;
    if (c.name !== null && !c.when) {
      problems.push(`${label}: a case must say WHEN it is produced. Prose is enough and prose is all that is possible -- nothing can verify a suite rendered the configuration a case names.`);
    }
    const pattern = patterns.get(c.pattern);
    if (!pattern) {
      problems.push(`${label}: unknown pattern "${c.pattern}" — no such file in ${PATTERN_DIR}`);
      continue;
    }
    if (REQUIRES_OPTIONAL.has(c.pattern) && !c.reason) {
      problems.push(`${label}: binding ${c.pattern} requires a reason — "nothing recorded", "verified presentational" and "does not exist here" must not look alike`);
    }
    for (const e of c.exceptions) {
      if (!(e.requirement in pattern.requires)) {
        problems.push(`${label}: excepts "${e.requirement}", which pattern "${c.pattern}" does not require`);
      }
    }
  }
```

Keep the `delegatedTo` and Angular `component` checks exactly where they are, outside the loop —
they are properties of the binding, not of a case.

- [ ] **Step 6: Teach `crossLayerAgrees` about case names**

Two layers agree when they declare the same case **names**, in any order, and the same pattern for
each. Add to `crossLayerAgrees`, before its existing pattern comparison:

```js
  const mine = bindingCases(reactBinding);
  const theirs = bindingCases(other);
  const names = (cs) => cs.map((c) => c.name).sort().join(',');
  if (names(mine) !== names(theirs)) return false;
```

- [ ] **Step 7: Document the format**

In `behaviour/README.md`'s binding-format section, add `cases` beside `pattern` and `exceptions`.
State: the two shapes are alternatives; a case carries `name`, `when`, `pattern` and `exceptions`;
`when` is prose because nothing can verify a suite rendered what it names, and a DOM discriminator
would be circular in every motivating case — what marks `Alert`'s danger case is the `role="alert"`
under examination. Do not write a count of cased bindings; name the command
`grep -rl '"cases"' --include='*.behaviour.json' frameworks/`.

- [ ] **Step 8: Run the tests**

```bash
bun test scripts/behaviour-contracts.test.mjs   # PASS
bun test scripts                                # PASS
bun run check:behaviour                         # unchanged: 21 pattern(s); 50 + 20 + 30
```

- [ ] **Step 9: Commit**

```bash
git commit -q -F - <<'MSG'
feat(behaviour): a binding may declare render cases

A binding describes a COMPONENT; `comparePattern` judges a RENDER. A component
that renders differently depending on its own props is several renders, and no
flat exception list is correct for all of them. `Skeleton` binds `status` with two
exceptions true of the `circle` variant alone, so its compliance call is pinned to
`circle` -- the one configuration that makes them true. Deliberately, and
documented in place: written against `block` it reported both as STALE EXCEPTION,
and that failure was correct. The layer offered no way to say what was true.

`bindingCases()` normalises both shapes and is the ONE place they meet: a flat
binding is one anonymous case, so the untouched majority is not churned. Every
consumer reads bindings through it rather than testing for `cases` itself, because
a second place deciding what a case is would be free to disagree with this one.

`validateBinding` rejects a binding declaring both `pattern` and `cases` -- two
places for one fact is what deriving `IDREF` from `IDREF_ATTRIBUTES` fixed once
already -- and requires a `when` on every named case. `crossLayerAgrees` compares
case NAMES before patterns, so a layer that grew a case the other lacks is a
disagreement the gate reports rather than a difference it cannot see.
MSG
```

---

## Task 2: The two gates read cases

**Files:**
- Modify: `scripts/check-compliance.mjs`
- Modify: `scripts/check-behaviour.mjs`
- Test: `scripts/check-compliance.test.mjs`

**Interfaces:**
- Consumes: `bindingCases` from Task 1.
- Produces: nothing new; both gates keep their current output shape and counts.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing test**

Add to `scripts/check-compliance.test.mjs`:

```js
/* The inventory is one row per BINDING, never one per case. COVERED is keyed
   <component>:<layer>, and a component is covered only when every one of its
   cases is, which the wrapper enforces -- there is deliberately no way to
   record half a component. */
test('a cased binding contributes exactly one inventory row', () => {
  const rows = inventoryFrom({
    'Alert:react': {
      cases: [
        { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
        { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
      ],
    },
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].patterns, ['alert', 'status']);
});
```

If `check-compliance.mjs` has no exported inventory helper today, export the loop body as
`inventoryFrom(bindings)` in this step rather than testing through the process boundary.

- [ ] **Step 3: Run it and watch it fail**

Run: `bun test scripts/check-compliance.test.mjs`
Expected: FAIL — `inventoryFrom` is not exported, and the row carries `pattern` rather than
`patterns`.

- [ ] **Step 4: Build the inventory through the normalizer**

At `scripts/check-compliance.mjs:200` and `:208`, replace `pattern: binding.pattern` with
`patterns: bindingCases(binding).map((c) => c.pattern)`. Update every reader of that field in the
file — a row now names one or more patterns, and any message printing it must join them.

- [ ] **Step 5: Name the cases when the layers disagree**

At `scripts/check-behaviour.mjs:122` the message reads `react binds "X", angular binds "Y"`. A
disagreement can now be about case names rather than patterns, and a message naming only patterns
sends the reader looking at the wrong field. Make it print each side as its case list:

```js
    const describe = (b) => bindingCases(b)
      .map((c) => (c.name ? `${c.name}:${c.pattern}` : c.pattern))
      .join(' + ');
```

and use `describe(reactBinding)` / `describe(other)` in the existing message.

- [ ] **Step 6: Run the gates**

```bash
bun test scripts                # PASS
bun run check:behaviour         # 21 pattern(s); 50 + 20 + 30, unchanged
bun run check:compliance        # 10 of 70, unchanged
```

Both figures must be unchanged: no binding has cases yet, so this task is pure plumbing. If either
moves, the normalizer is being applied where it should not be.

- [ ] **Step 7: Commit**

```bash
git commit -q -F - <<'MSG'
feat(behaviour): both gates read a binding through its cases

`check:compliance` builds one inventory row per BINDING, never one per case:
`COVERED` stays keyed `<component>:<layer>`, and a component is covered only when
every one of its cases is. There is deliberately no way to record half a
component -- that state is what this batch abolishes.

`check:behaviour`'s cross-layer message printed only patterns, and a disagreement
can now be about case NAMES, which would have sent a reader to the wrong field. It
prints each side as its case list instead.

Both headline figures are unchanged, because no binding declares cases yet. This
commit is plumbing, and a moved figure would mean the normalizer reached somewhere
it should not.
MSG
```

---

## Task 3: The React wrapper drives the loop

**Files:**
- Modify: `frameworks/react/test-dom/assert-pattern.jsx`
- Test: `frameworks/react/test-dom/assert-pattern-cases.test.jsx` (create)

**Interfaces:**
- Consumes: `bindingCases` from Task 1.
- Produces: `export function assertPatternCases({bindingPath, cases})`, where `cases` is
  `Record<string, () => {root: Element, subjects?: object, behavioural?: object}>`. Task 4 mirrors
  this signature in TypeScript; Tasks 5-7 call it.

**Why the wrapper drives the loop rather than counting calls.** A suite that calls `assertPattern`
once per case and is checked afterwards can forget the check. A wrapper handed a map of renderers
cannot: a missing key is a missing key before anything runs. Completeness becomes structural.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing tests**

Create `frameworks/react/test-dom/assert-pattern-cases.test.jsx`. Follow the shape of the existing
wrapper failure-path tests, which write a deliberately false binding to a temp file and assert the
wrapper throws.

```jsx
/* The wrapper's own failure paths. These write bindings that are deliberately
   wrong to a temp file and prove the diagnostic fires -- a check nobody has
   watched fail is a check nobody knows works. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertPatternCases } from './assert-pattern.jsx';

function bindingFile(binding) {
  const dir = mkdtempSync(join(tmpdir(), 'arena-cases-'));
  const p = join(dir, 'X.behaviour.json');
  writeFileSync(p, JSON.stringify(binding));
  return p;
}

const TWO_CASES = {
  cases: [
    { name: 'danger', when: 'tone is "danger"', pattern: 'alert', exceptions: [] },
    { name: 'advisory', when: 'any other tone', pattern: 'status', exceptions: [] },
  ],
};

test('a suite that renders only one declared case is refused', () => {
  const p = bindingFile(TWO_CASES);
  assert.throws(
    () => assertPatternCases({ bindingPath: p, cases: { danger: () => { throw new Error('never'); } } }),
    /advisory/,
    'the missing case must be named',
  );
});

test('a case name the binding does not declare is refused', () => {
  const p = bindingFile(TWO_CASES);
  assert.throws(
    () => assertPatternCases({
      bindingPath: p,
      cases: { danger: () => ({ root: null }), advisory: () => ({ root: null }), typo: () => ({ root: null }) },
    }),
    /typo/,
  );
});

test('a flat binding cannot be asserted through the cases entry point', () => {
  const p = bindingFile({ pattern: 'status', exceptions: [] });
  assert.throws(
    () => assertPatternCases({ bindingPath: p, cases: { only: () => ({ root: null }) } }),
    /declares no cases/,
  );
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `bun run test:react-dom`
Expected: FAIL — `assertPatternCases` is not exported.

- [ ] **Step 4: Implement it**

In `frameworks/react/test-dom/assert-pattern.jsx`, beside `assertPattern`:

```jsx
/** Assert a CASED binding, one call per declared case.
 *
 *  The wrapper drives the loop rather than counting calls afterwards, and that is
 *  the whole mechanism: a suite handed the responsibility of calling once per case
 *  can forget, which is exactly how Skeleton verified its circle variant and
 *  claimed the component. Here a missing key is a missing key before anything
 *  renders.
 *
 *  `comparePattern` is called with a SYNTHESIZED binding carrying only this
 *  case's exceptions. The shared evaluator never learns what a case is -- it reads
 *  `binding.exceptions` and nothing else, so there was nothing there to teach.
 *  @param {object} o
 *  @param {string} o.bindingPath
 *  @param {Record<string, () => {root: Element, subjects?: object, behavioural?: object}>} o.cases
 *    case name -> a thunk that renders that case and returns its root. A thunk
 *    rather than a rendered root so nothing is mounted until its case is reached
 *    and the key sets have already been checked. */
export function assertPatternCases({ bindingPath, cases }) {
  const binding = loadBinding(bindingPath);
  const declared = bindingCases(binding);
  if (declared.length === 1 && declared[0].name === null) {
    throw new Error(`${bindingPath}\n  declares no cases — assert it with assertPattern instead.`);
  }
  const want = declared.map((c) => c.name);
  const got = Object.keys(cases);
  const missing = want.filter((n) => !got.includes(n));
  const unknown = got.filter((n) => !want.includes(n));
  if (missing.length || unknown.length) {
    throw new Error(
      `${bindingPath}\n  the suite must render every declared case, and only those.\n` +
      (missing.length ? `  - never rendered: ${missing.join(', ')}\n` : '') +
      (unknown.length ? `  - not declared in the binding: ${unknown.join(', ')}\n` : '') +
      `  declared: ${want.join(', ')}`,
    );
  }

  patternCache ??= loadPatterns(REPO);
  const problems = [];
  for (const c of declared) {
    const pattern = patternCache.get(c.pattern);
    if (!pattern) {
      throw new Error(`${bindingPath}\n  case "${c.name}" names pattern "${c.pattern}", which has no file in ${PATTERN_DIR}`);
    }
    const { root, subjects = {}, behavioural = {} } = cases[c.name]();
    const { default: fallbackSubject, ...perRequirement } = subjects;
    const fallback = 'default' in subjects ? fallbackSubject : root.firstElementChild;
    const found = comparePattern({
      pattern,
      binding: { exceptions: c.exceptions },
      subjects: perRequirement,
      fallback,
      behavioural,
      resolveId: resolverFor(root),
    });
    for (const p of found) problems.push(`case "${c.name}" (${c.when}): ${p}`);
  }
  if (problems.length) {
    throw new Error(`${bindingPath}\n  - ${problems.join('\n  - ')}`);
  }
}
```

Import `bindingCases` alongside the existing `loadBinding` import. Keep the `'default' in subjects`
distinction verbatim — a present-but-null default means a selector matched nothing and must reach
`comparePattern` unchanged, and collapsing it to the first-child fallback misreports a missed
selector as an OVERCLAIM against the wrong element.

- [ ] **Step 5: Run the tests**

```bash
bun run test:react-dom   # 101 pass (98 + the 3 new), 0 fail
```

- [ ] **Step 6: Commit**

```bash
git commit -q -F - <<'MSG'
feat(compliance): the React wrapper drives the loop over declared cases

`assertPatternCases({bindingPath, cases})` takes a map from case name to a thunk
that renders it, and iterates the BINDING's declared cases rather than trusting
the suite to call once per case. A suite handed that responsibility can forget it,
which is exactly how `Skeleton` verified its circle variant and claimed the whole
component. A missing key now fails before anything mounts.

The thunk is a thunk rather than a rendered root so nothing is mounted until the
key sets have already been checked -- a suite with a typo'd case name gets the
name back, not a render.

`comparePattern` is called with a synthesized binding carrying only that case's
exceptions, and the shared evaluator is untouched: it reads `binding.exceptions`
and nothing else, so there was nothing there to teach.

Three failure paths proved by induction rather than assumed -- a case never
rendered, a case not declared, and a flat binding pushed through the cased entry
point.
MSG
```

---

## Task 4: The Angular wrapper mirrors it

**Files:**
- Modify: `frameworks/angular/test/compliance.ts`
- Test: `frameworks/angular/test/assert-pattern-cases.test.ts` (create)

**Interfaces:**
- Consumes: `bindingCases` from Task 1; the signature Task 3 produced.
- Produces: the same `assertPatternCases` in TypeScript. Task 5 calls it for `alert:angular`; Task 7
  for `tag:angular`.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Write the failing tests**

Create `frameworks/angular/test/assert-pattern-cases.test.ts` with the same three failure paths as
Task 3 Step 2 — a declared case never rendered, an undeclared case name, and a flat binding pushed
through the cased entry point — written against `node:test` and the temp-file helper shape that
directory already uses. Do not import the React wrapper; the two layers each own their copy, as they
already do for `assertPattern`.

- [ ] **Step 3: Run them and watch them fail**

Run: `bun test frameworks/angular/test/assert-pattern-cases.test.ts`
Expected: FAIL — `assertPatternCases` is not exported from `compliance.ts`.

- [ ] **Step 4: Implement it**

Port Task 3 Step 4 verbatim, with two differences and no others:

- types: `cases: Record<string, () => {root: Element; subjects?: Record<string, unknown>; behavioural?: Record<string, boolean>}>`;
- the fallback is `root`, not `root.firstElementChild` — matching what `assertPattern` already does
  in this file, because an Angular host-bound root **is** the styled element.

- [ ] **Step 5: Run the tests**

```bash
bun test frameworks/angular/test   # 339 pass (336 + 3), 0 fail
```

- [ ] **Step 6: Commit**

```bash
git commit -q -F - <<'MSG'
feat(compliance): the Angular wrapper takes the same cased entry point

A port of the React wrapper's `assertPatternCases`, not a second design, with the
two differences this layer already carries for `assertPattern`: the fallback
subject is the host root itself rather than its first element child, because a
host-bound root IS the styled element.

The same three failure paths are proved here rather than assumed to hold because
they hold in the other layer.
MSG
```

---

## Task 5: `Alert`, `Toast` and `alert:angular` — the clean split

**Files:**
- Modify: `frameworks/react/components/feedback/Alert.behaviour.json`
- Modify: `frameworks/react/components/feedback/Toast.behaviour.json`
- Modify: `frameworks/angular/primitives/alert/alert.behaviour.json`
- Modify: `scripts/check-compliance.mjs` (the `COVERED` map)
- Test: `frameworks/react/test-dom/alert-tones.test.jsx` (create),
  `frameworks/angular/test/alert-role-tones.test.ts` (modify)

**Interfaces:**
- Consumes: `assertPatternCases` from Tasks 3 and 4.
- Produces: `Alert:react` and `Toast:react` as new `COVERED` keys.

**Why these three first.** They are the simplest split in the batch — one prop, two roles, both
correct — so they prove the mechanism end to end before it meets a harder subject.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Read what the components actually render, and do not trust this plan for it**

```bash
grep -n 'role=\|aria-live' frameworks/react/components/feedback/Alert.jsx frameworks/react/components/feedback/Toast.jsx
grep -n "attr.role\|aria-live" frameworks/angular/primitives/alert/alert.ts
```

Expected: `role={tone === 'danger' ? 'alert' : 'status'}` in both React files, and the same ternary
as a host binding in Angular. If any of them differs, STOP — the split below is derived from these
exact ternaries.

- [ ] **Step 3: Convert `Alert.behaviour.json`**

```json
{
  "cases": [
    { "name": "danger",
      "when": "tone is \"danger\" -- the only tone that renders role=\"alert\"",
      "pattern": "alert",
      "exceptions": [] },
    { "name": "advisory",
      "when": "any other tone -- info, success, warning, neutral, including the default",
      "pattern": "status",
      "exceptions": [] }
  ]
}
```

Apply the identical two cases to `alert.behaviour.json`, keeping its `"component": "Alert"` field,
which the Angular layer needs and the cross-layer assertion reads.

- [ ] **Step 4: Convert `Toast.behaviour.json`**

The same two cases, and **the `content.noAutoDismiss` exception survives, on both**. It is a real
claim about the host owning the timer, not a description problem, and it is true of a danger toast
and an advisory one alike:

```json
{
  "cases": [
    { "name": "danger",
      "when": "tone is \"danger\" -- role=\"alert\" with aria-live=\"assertive\"",
      "pattern": "alert",
      "exceptions": [
        { "requirement": "content.noAutoDismiss",
          "reason": "Toast.jsx has no timer of its own, but its doc comment describes toasts as auto-dismissed by the host by default and `persist` as the opt-out. Nothing in this file enforces persist for a critical state, so the claim rests on the host." }
      ] },
    { "name": "advisory",
      "when": "any other tone -- role=\"status\" with aria-live=\"polite\"",
      "pattern": "status",
      "exceptions": [] }
  ]
}
```

Note the asymmetry and keep it: `status` does not require `content.noAutoDismiss`, so declaring it
on the advisory case would name a requirement that pattern does not have — which Task 1 Step 5's
validation now rejects. Verify with `cat behaviour/patterns/status.json`.

- [ ] **Step 5: Write the React suite**

Create `frameworks/react/test-dom/alert-tones.test.jsx`. It renders each component twice and hands
both to `assertPatternCases`:

```jsx
test('Alert meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: resolve(REPO, 'frameworks/react/components/feedback/Alert.behaviour.json'),
    cases: {
      danger: () => ({ root: render(<Alert tone="danger" title="Failed" />) }),
      advisory: () => ({ root: render(<Alert tone="info" title="Heads up" />) }),
    },
  });
});
```

Write the equivalent for `Toast`, declaring `content.noAutoDismiss` in the danger case's
`behavioural` map with the verdict `false` — the exception says it is unmet, and the suite must
carry that verdict rather than let the requirement go undeclared:

```jsx
      danger: () => ({
        root: render(<Toast tone="danger" message="Failed" />),
        behavioural: { 'content.noAutoDismiss': false },
      }),
```

Follow the existing suites' `render` helper and REPO resolution rather than inventing new ones —
`frameworks/react/test-dom/placement-and-branches.test.jsx` is the nearest shape.

- [ ] **Step 6: Extend the Angular suite**

`frameworks/angular/test/alert-role-tones.test.ts` already renders both tones; it asserts them by
hand today. Add an `assertPatternCases` call beside its existing assertions rather than replacing
them — the hand assertions check the `aria-live` pairing, which is not a requirement key and which
no pattern can ask for.

- [ ] **Step 7: Add the two new `COVERED` keys**

In `scripts/check-compliance.mjs`, add `'Alert:react'` and `'Toast:react'` naming
`alert-tones.test.jsx`. `Alert:angular` is already there and stays.

- [ ] **Step 8: Run everything**

```bash
bun run test:react-dom       # 103 pass, 0 fail
bun test frameworks/angular/test   # 339 pass, 0 fail
bun run check:behaviour      # 21 pattern(s), all coherent
bun run check:compliance     # 12 of 70
```

- [ ] **Step 9: Prove a case measured against the wrong pattern fails**

```bash
sha256sum frameworks/react/components/feedback/Alert.behaviour.json > "${CLAUDE_JOB_DIR:-/tmp}/8c9-alert.sha"
```

Change the `advisory` case's `pattern` from `status` to `alert`, then:

```bash
bun run test:react-dom
```

Expected: FAIL with `case "advisory" (...): roles.element: OVERCLAIM`, because a non-danger alert
renders `role="status"`. Restore and prove it:

```bash
git checkout -- frameworks/react/components/feedback/Alert.behaviour.json
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c9-alert.sha"   # OK
bun run test:react-dom                                  # 103 pass again
```

- [ ] **Step 10: Commit**

```bash
git commit -q -F - <<'MSG'
feat(behaviour): Alert and Toast declare their two tones as cases

`role={tone === 'danger' ? 'alert' : 'status'}` is two renders, and the binding
described one. The `roles.element` exception said the component fell short of
`alert`; it never did -- an advisory alert implements `status`, correctly and
completely. Split into cases, each case is measured against the pattern it
actually implements and both come out empty.

Three exceptions retire and none of them was a defect. `Toast`'s
`content.noAutoDismiss` survives, on the danger case only, because `status` does
not require it and declaring it there would name a requirement that pattern does
not have.

`Alert:react` and `Toast:react` enter `COVERED`: retiring an exception with
nothing rendering it swaps an honest admission for an unverified claim, which is
the defect 8C6 shipped.

Induced against the real binding: pointing the advisory case at `alert` reports
`roles.element: OVERCLAIM`. Restored and verified with sha256sum -c.
MSG
```

---

## Task 6: `Skeleton` — the headline, and the suite that was flattering itself

**Files:**
- Modify: `frameworks/react/components/display/Skeleton.behaviour.json`
- Modify: `frameworks/react/test-dom/placement-and-branches.test.jsx`
- Test: the same file

**Interfaces:**
- Consumes: `assertPatternCases` from Task 3.
- Produces: nothing new; `Skeleton:react` is already in `COVERED` and stays.

**This is the batch's reason for existing, and the existing suite must be read fairly before it is
changed.** Its `assertPattern` call is pinned to `circle` **deliberately**, and the file says so in
its own comment: written against `block` it failed with `roles.element` and `live.politeness`
reported STALE EXCEPTION, *"and that failure was correct."* The authors knew. What they lacked was
any way to **express** it — which is what this batch builds. Do not write, in code or in a commit
message, that the suite was flattering itself.

**Two hand tests in that file cover what the compliance call cannot, and they are NOT superseded.**
`Skeleton renders role=status in three variants and not in circle` asserts the role *distribution
across variants*, and `Skeleton circle is aria-hidden with no live region` asserts the absence of
three attributes. Neither is a requirement key, so no pattern can ask for either and no evaluator
can decide them. **Keep both.** This is the same rule 8C7 recorded for `tabs.test.jsx`'s
hand-resolution test: do not delete it as redundant.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Read the suite and the component, and record what you find**

```bash
sed -n '14,30p;74,105p' frameworks/react/test-dom/placement-and-branches.test.jsx
grep -n 'variant\|role=\|aria-hidden' frameworks/react/components/display/Skeleton.jsx
```

Expected: the file's header explains the branch problem; two hand tests cover all four variants; the
`assertPattern` call is pinned to `circle` with a comment recording the `block` STALE EXCEPTION
failure. In the component, `Skeleton.jsx:25-27` returns the circle branch as `aria-hidden="true"`
with no role, and lines 32, 39 and 41 render `role="status" aria-label="Loading"`.

Record in the task report which hand tests exist, so the reviewer can confirm they survived.

- [ ] **Step 3: Convert the binding**

```json
{
  "cases": [
    { "name": "placeholder",
      "when": "variant is \"block\", \"line\" or \"text\" -- the variants that stand in for content that will arrive",
      "pattern": "status",
      "exceptions": [] },
    { "name": "circle",
      "when": "variant is \"circle\" -- an avatar-shaped placeholder",
      "pattern": "none",
      "reason": "The circle variant renders aria-hidden=\"true\" with no role, which is what a decorative placeholder should be: it stands beside a real name that is itself announced, so announcing \"Loading\" a second time would be noise. It is presentational by decision, not by omission -- which is exactly the distinction the `none` pattern exists to record.",
      "exceptions": [] }
  ]
}
```

The `reason` is required: `none` is in `REQUIRES_OPTIONAL`, and Task 1 Step 5 reads a case's own
`reason` before the binding's. Verify that path works rather than assuming it.

- [ ] **Step 4: Replace the pinned call, and leave the hand tests alone**

Replace **only** the `assertPattern` call for `Skeleton` — and the comment above it that argues for
the `circle` pin, which becomes false the moment both cases are asserted. The two hand tests above
it stay exactly as they are, for the reason in this task's preamble.

```jsx
test('Skeleton meets both of its declared cases', () => {
  assertPatternCases({
    bindingPath: resolve(REPO, 'frameworks/react/components/display/Skeleton.behaviour.json'),
    cases: {
      placeholder: () => ({ root: render(<Skeleton variant="block" />) }),
      circle: () => ({ root: render(<Skeleton variant="circle" />) }),
    },
  });
});
```

- [ ] **Step 5: Run it**

```bash
bun run test:react-dom       # 103 pass, 0 fail
bun run check:compliance     # 12 of 70, unchanged from Task 5
```

- [ ] **Step 6: Prove the hole is closed, by induction**

This is the batch's headline claim.

```bash
sha256sum frameworks/react/test-dom/placement-and-branches.test.jsx > "${CLAUDE_JOB_DIR:-/tmp}/8c9-skel.sha"
```

Delete the `placeholder` line from the `cases` map, leaving only `circle` — which is exactly what
the suite did before this batch. Then:

```bash
bun run test:react-dom
```

Expected: FAIL, naming `placeholder` as never rendered. **Before this batch that same suite passed**,
which is the measurement the whole design rests on. Restore:

```bash
git checkout -- frameworks/react/test-dom/placement-and-branches.test.jsx
sha256sum -c "${CLAUDE_JOB_DIR:-/tmp}/8c9-skel.sha"   # OK
bun run test:react-dom                                 # 103 pass again
```

- [ ] **Step 7: Prove a stale case exception is caught**

Add the old `roles.element` exception back to the `placeholder` case only, run
`bun run test:react-dom`, and expect `STALE EXCEPTION` — that variant does render the role. Revert
the edit by hand and re-run to 103 pass.

- [ ] **Step 8: Commit**

```bash
git commit -q -F - <<'MSG'
feat(behaviour): Skeleton declares its variants instead of pinning to one

This is the defect the batch is named for, and the previous authors are not the
ones who made it. `Skeleton` bound `status` with two exceptions true of the
`circle` variant and false of the other three, so the compliance call was pinned
to `circle` -- deliberately, with a comment recording that written against `block`
it failed with both requirements reported STALE EXCEPTION, "and that failure was
correct." They knew. What the layer lacked was any way to EXPRESS it, which is
what cases are.

What a reader of the binding alone still concluded was false: that a Skeleton is a
`status` and misses two requirements, when three of its four variants meet the
pattern outright and the fourth implements a different one.

Two cases now: `placeholder` for block/line/text, which render
`role="status" aria-label="Loading"` and meet the pattern outright, and `circle`,
which renders `aria-hidden="true"` with no role and binds `none` with a reason.
Presentational by decision rather than by omission is exactly the distinction
`none` exists to record. Both cases are empty; two exceptions retire and neither
was a defect.

Induced twice. Rendering only `circle` -- what the compliance call did before this
batch -- now fails naming `placeholder` as never rendered. Restoring the old
`roles.element` exception on the `placeholder` case reports STALE EXCEPTION,
because that variant does render the role. Both trees restored and verified with
sha256sum -c.

The file's two hand tests are kept: the role distribution across all four variants
and the circle branch's three absent attributes are not requirement keys, so no
pattern can ask for either and no evaluator can decide them. Same rule 8C7
recorded for `tabs.test.jsx` -- not redundant, and not to be deleted as such.
MSG
```

**A note for whoever reviews this task.** This plan's own framing of Task 6 was corrected while it
was being written, after reading the suite instead of assuming it: an earlier draft said the suite
was flattering itself. It was not — the pin to `circle` is deliberate and documented in place, and
the hand tests cover the other variants. If a commit message or comment produced by this task says
otherwise, that is a finding.

---

## Task 7: `Tag`, `tag:angular` and `CalendarEvent` — where the pattern itself changes

**Files:**
- Modify: `frameworks/react/components/display/Tag.behaviour.json`
- Modify: `frameworks/angular/primitives/tag/tag.behaviour.json`
- Modify: `frameworks/react/components/display/CalendarEvent.behaviour.json`
- Modify: `scripts/check-compliance.mjs` (`COVERED`)
- Test: `frameworks/react/test-dom/tag-and-chip-cases.test.jsx` (create),
  `frameworks/angular/test/tag-cases.test.ts` (create)

**Interfaces:**
- Consumes: `assertPatternCases` from Tasks 3 and 4.
- Produces: `Tag:react`, `Tag:angular` and `CalendarEvent:react` as new `COVERED` keys.

**This is the second level.** For `Alert` and `Skeleton` the pattern stayed and the exceptions moved;
here the **pattern itself** differs per case, which is what a flat binding could never say.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Read what each renders**

```bash
grep -n 'removable\|<button\|role=' frameworks/react/components/display/Tag.jsx
grep -n 'removable\|button\|role' frameworks/angular/primitives/tag/tag.ts
grep -n 'onClick\|<button\|role=' frameworks/react/components/display/CalendarEvent.jsx
```

`CalendarEvent`'s own exception says the chip *"takes THREE shapes and the pattern applies to two of
them"*. **Read the component and name all three before writing cases** — this plan deliberately does
not guess them, and a case list that omits a real shape is the exact defect the batch exists to
prevent. Report the three in the task report.

- [ ] **Step 3: Convert `Tag.behaviour.json`**

```json
{
  "cases": [
    { "name": "plain",
      "when": "removable is false or absent -- the common case, a <span> with no interactive affordance",
      "pattern": "none",
      "reason": "Without `removable` a Tag is a label: a <span> carrying text and a tone, with nothing to press. No interactive pattern applies, and binding one with an exception would tell a reader the pattern always holds.",
      "exceptions": [] },
    { "name": "removable",
      "when": "removable is true -- a real <button> renders inside the tag",
      "pattern": "button",
      "exceptions": [
        { "requirement": "states.disabled",
          "reason": "The remove button has no disabled concept at all -- aria-disabled is never set, and there is no prop to make removal unavailable while the tag stays visible. A real gap rather than a description problem, and it survives this batch on purpose." }
      ] }
  ]
}
```

Apply the same two cases to `tag.behaviour.json`, keeping its `"component": "Tag"` field and
rewording `when` to Angular's own spelling (`removable()` is a signal). **The case NAMES must match
across the layers** or `crossLayerAgrees` reports a disagreement — that is Task 1 Step 6 working, not
a bug.

- [ ] **Step 4: Convert `CalendarEvent.behaviour.json`**

Write one case per shape found in Step 2, with the `button` pattern on the shapes that render a real
button and `none` with a reason on the shape that does not. Carry the `states.disabled` exception on
the interactive cases only — like `Toast`'s, it is a real gap and survives.

- [ ] **Step 5: Write the suites**

Create `frameworks/react/test-dom/tag-and-chip-cases.test.jsx` covering `Tag`'s two cases and
`CalendarEvent`'s shapes, and `frameworks/angular/test/tag-cases.test.ts` for `tag:angular`. Declare
`states.disabled` with the verdict `false` in each interactive case's `behavioural` map — it is in
`BEHAVIOURAL`, so `evaluate` returns `null` and an undeclared key is reported rather than silently
skipped.

- [ ] **Step 6: Add the three `COVERED` keys**

`'Tag:react'`, `'Tag:angular'` and `'CalendarEvent:react'`.

- [ ] **Step 7: Run everything**

```bash
bun run test:react-dom             # 0 fail
bun test frameworks/angular/test   # 0 fail
bun run check:behaviour            # all coherent, layers agree on case names
bun run check:compliance           # 15 of 70
```

- [ ] **Step 8: Commit**

```bash
git commit -q -F - <<'MSG'
feat(behaviour): Tag and CalendarEvent declare the cases where the PATTERN changes

The second level, and the one a flat binding could never express. `Tag` renders a
real <button> only when it is removable; without it -- the common case -- it is a
<span> matching no interactive pattern at all. The binding said `button` with an
exception, which tells a reader the pattern always holds and it does not.

Two cases now, and they bind DIFFERENT patterns: `plain` is `none` with a reason,
`removable` is `button`. `CalendarEvent` takes the same treatment across the
shapes its own exception always described.

What survives is what should. Neither component has any concept of a disabled
state, so `states.disabled` stays declared on the interactive cases -- a real gap
rather than a description problem, and the batch does not pretend otherwise.

The case names match across React and Angular, which `crossLayerAgrees` now
requires: a layer that grew a case the other lacks is a disagreement the gate
reports rather than a difference it could not see.
MSG
```

---

## Task 8: Close-out

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: everything.
- Produces: a green tree.

- [ ] **Step 1: Confirm the tree is clean**

Run: `git status --short` → no output.

- [ ] **Step 2: Rewrite the Known debt this batch made false**

`CLAUDE.md` records the conditionality gap in **three** separate entries — `Tag`'s whole-pattern
case, `Skeleton`'s variant-scoped exceptions, and `Tooltip`'s per-child one — plus mentions inside
the `SideNavItem` and grid entries. Find them:

```bash
grep -n "optional requirement\|variant\|conditionally\|Skeleton\|only when" CLAUDE.md | head -30
```

Rewrite what is now false. What **must survive**, because this batch closed none of it:

- **Conditional on consumer usage is still unexpressible.** `Table`'s `focus.roving` (card mode, and
  only when a consumer put an `onClick` on a `TableRow`), `Tooltip`'s `roles.describedby`, and
  `Pagination`'s `roles.label`. `Tooltip` is the one to state most carefully: its binding reads
  `"exceptions": []` and is the only live instance whose binding looks clean.
- **Nothing proves the declared cases are all the cases.** Same limit the curated `QUANTIFIED` set
  carries, with the same non-remedy — deriving cases from source finds fewer renders than a reader
  does.
- **A case bound to `none` verifies nothing**, because `none` has no requirements. Correct for
  `Skeleton`'s `circle`, but the suite confirms only that the case was rendered.
- **`SideNavItem` binds `none` with prose** because it is an `<a>` or a `<button>` depending on
  `href`. That is now expressible as cases and was **not** converted — say so, or the next reader
  will assume it was and find prose that contradicts the mechanism.

- [ ] **Step 3: Record what the batch added to the Architecture section**

The behaviour paragraph describes a binding as naming one pattern and listing exceptions. That is
now one of two shapes. State the normalizer as the single reconciliation point, and state the
wrapper's structural completeness rule, since it is the part that closes a real hole rather than
adding an expression.

- [ ] **Step 4: Run the full sweep, once**

```bash
export CHROME_PATH=/usr/bin/chromium
ARENA_CHECK_STRICT=1 bun run check
```

Expected: `check-all: all 23 step(s) passed`. If any step fails, STOP and report BLOCKED with the
failing step's output — never fix a gate to make it agree.

- [ ] **Step 5: Confirm the batch's own claims**

```bash
bun run check:compliance    # 15 of 70
bun run check:behaviour     # 21 pattern(s), unchanged — this batch adds no pattern
grep -rho '"requirement"' --include='*.behaviour.json' frameworks/ | wc -l   # 55
grep -rl '"cases"' --include='*.behaviour.json' frameworks/ | wc -l          # 7
```

- [ ] **Step 6: Commit**

```bash
git commit -q -F - <<'MSG'
docs: close out 8C9 — the conditionality entries this batch made false

`CLAUDE.md` recorded the conditionality gap three times, in two shapes: a whole
pattern applying conditionally (`Tag`) and a requirement met in some variants
only (`Skeleton`). Both are now expressible and both are expressed, so the entries
say what replaced them.

What survives is the third shape, which this batch names and does not solve:
conditional on CONSUMER usage. `Table`'s card-mode `focus.roving` depends on
whether a consumer put an `onClick` on a `TableRow`; `Pagination`'s name depends
on whether the caller supplied one; and `Tooltip`'s `roles.describedby` holds only
when the consumer's child forwards props -- the one live instance whose binding
reads `"exceptions": []`, so this record is the only place it is written down.

Two limits are recorded rather than left to be rediscovered: nothing proves the
declared cases are ALL the cases, the same limit the curated QUANTIFIED set
carries; and a case bound to `none` verifies nothing, so `Skeleton`'s circle case
confirms the render exists, never that it is correctly inert.

`SideNavItem` is now expressible as cases and was deliberately not converted.
Saying so is the point -- its prose would otherwise read as contradicting a
mechanism that postdates it.

Full `bun run check` run once, at close-out, per the rule that the sweep is a
completion gate rather than a per-commit toll.
MSG
```

---

## Self-review

**Spec coverage.** Spec §1 (a binding may declare cases) → Task 1. §2 (`when` is prose, and why the
alternatives were rejected) → Task 1 Steps 4 and 7, with the reasoning carried into
`behaviour/README.md` rather than left in the spec that gets deleted. §3 (what is enforced: the
wrapper's case-set check, `check:behaviour`'s three assertions, `COVERED` semantics) → Tasks 1, 2, 3
and 4. §4 (eight exceptions retired) → Tasks 5, 6 and 7, one commit per family. §5 (`Table` not
converted, and the third level named) → Task 8 Step 2, which is where it survives deletion of the
spec. *Verification*'s three inductions → Task 5 Step 9 (wrong pattern), Task 6 Step 6 (the missing
case — the headline) and Task 6 Step 7 (stale case exception). *What stays open* → Task 8 Step 2.

**One scope correction against the spec, stated rather than absorbed.** The spec's *Blast radius*
names `comparePattern` among the things that change. It does not change, and Global Constraint 7
forbids changing it: `comparePattern` reads `binding` for exactly one thing, `binding.exceptions`,
so each wrapper synthesizes `{exceptions: c.exceptions}` and the shared evaluator never learns what
a case is. This makes the batch smaller than specified, not larger, and it keeps the file that runs
in three runtimes out of the change entirely.

**Type consistency.** `bindingCases(binding)` is defined in Task 1 Step 4 and returns
`{name, when, pattern, exceptions}`; Task 1 Steps 5 and 6, Task 2 Steps 4 and 5, and Task 3 Step 4
all read exactly those four fields. `assertPatternCases({bindingPath, cases})` is defined in Task 3
Step 4, mirrored in Task 4 Step 4, and called in Task 5 Step 5, Task 6 Step 4 and Task 7 Step 5 with
the same `Record<string, () => {root, subjects?, behavioural?}>` shape. `COVERED` keys are
`<Component>:<layer>` throughout — `Alert:react`, `Toast:react`, `Tag:react`, `Tag:angular`,
`CalendarEvent:react` — matching the existing map's spelling, where the Angular key is the component
name and not the kebab-case directory.

**One deliberate non-placeholder.** Task 7 Step 2 tells the implementer to read `CalendarEvent.jsx`
and name its three shapes rather than giving them. That is not a missing detail: the component's own
exception says there are three and does not name them, this plan did not verify them against the
source, and inventing them here would be exactly the guessed-case-list defect the batch exists to
prevent. The step says what to read and what to report.
