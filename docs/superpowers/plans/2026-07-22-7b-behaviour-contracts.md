# Behaviour contracts Implementation Plan (7b)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Arena a normative, machine-checked contract for what each component must *do*, so that "no divergence recorded" stops meaning the same thing as "verified equivalent".

**Architecture:** A catalogue of behaviour patterns at the repo root (`behaviour/patterns/*.json`), derived from WAI-ARIA APG and carrying their source URL, plus one binding declaration per component per layer stating which pattern it implements and which requirements it does not yet meet. A new portable gate, `check:behaviour`, asserts every component declares, every named pattern and requirement exists, and the two layers agree or the difference is written down.

**Tech Stack:** Bun (build + test), plain JSON, `node:test`/`node:assert`, no new dependency.

## Source spec

`docs/superpowers/specs/2026-07-22-7-behaviour-tokens-and-contracts-design.md`

Read its *What plan 5.5's execution settled* section before writing code. Two items there bind this plan directly: coverage must be phrased as **every layer**, never "at least one"; and a gate's scan must sit behind an argv guard or its own test cannot import it.

## Scope: this is 7b of three

Plan 7a shipped the value layer. This plan is the **declaration layer**: patterns, bindings, and level 1 of the gate. It is self-contained and ships working software — after it, every component in every layer has a stated contract and no two layers can silently claim different ones.

**7c, planned separately, holds verification of compliance**: level 2 (a static scan of what the source actually implements, with its own `EXEMPT` map), level 3 (render suites, needing a DOM-based React harness beside the five `renderToStaticMarkup` suites already in `frameworks/react/test/`), and the migration of `components-divergences.md`'s per-component half into the `exceptions` this plan creates.

**Why the split, in numbers.** This plan authors ~18 pattern files and 85 binding declarations, each of which requires reading a component to decide its pattern and its exceptions. That is judgement, not transcription. Folding levels 2 and 3 and a 1119-line document migration on top would produce a plan nobody finishes, which CLAUDE.md warns against by name.

**What level 1 can and cannot prove, stated up front.** It proves every component *declares*, that declarations are internally coherent, that no declaration names a pattern or requirement that does not exist, and that the layers agree. **It proves nothing about whether a component actually behaves as it declares.** A component can bind `dialog-modal` and trap no focus at all, and level 1 will pass it. That is 7c's job, and no commit message or CHANGELOG entry from this plan may imply otherwise.

## The inventory, computed rather than assumed

Every count below was derived from the tree, and the decomposition is exact:

| | Count | |
|---|---|---|
| React components | **43** | `frameworks/react/components/*/*.jsx`, excluding `*.card.entry.jsx` |
| Angular primitives | **21** | `frameworks/angular/primitives/*/` |
| Tailwind manifests | **39** | |

43 = **21 + 21 + 1**:

- **21 components exist in both layers** — every Angular primitive has a React counterpart, with no exceptions.
- **21 components React implements and Angular delegates to Material** — they have a Tailwind manifest and no `arena-*` primitive: `Badge`, `Button`, `Card`, `Checkbox`, `Dialog`, `IconButton`, `Input`, `Menu`, `Pagination`, `ProgressBar`, `Radio`, `SegmentedControl`, `Select`, `SideNav`, `Spinner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`, `Tooltip`.
- **1 component is React-only**: `Calendar`. Angular has no primitive and Arena's Material bridge dresses nothing for it.

So the binding count is 43 (React) + 21 (Angular primitives) + 21 (Angular delegated) = **85 declarations**.

**Delegation is a first-class state, not an absence.** This is plan 7a's finding and it is why the count works out: saying "Angular has no `Tooltip`" is false — Angular has `matTooltip`, and `arena-material.css` already dresses parts of the Material surface. A declaration that reads "absent" where the truth is "provided by Material" is exactly the silence this plan exists to end.

## Open questions this plan settles

The spec left six contract-layer questions. All six are answered here, five of them with evidence from the tree.

| # | Question | Decision |
|---|---|---|
| 4 | How does a pattern express an *optional* requirement? | **It does not.** A pattern's `requires` map holds only requirements. Anything genuinely per-component (a modal that may or may not dismiss on scrim click) is a **choice declared in the binding**, not an optional entry in the pattern. A gate cannot verify "optional", and an optional requirement is one nobody has decided. |
| 5 | What granularity is `exceptions.requirement`? | **A leaf, enforced structurally.** `requires` is a flat map of dotted keys (`roles.aria-modal`, `focus.trap`, `keyboard.Escape`), so an exception names exactly one. `"roles.required"` as a whole clause is not expressible, which is the point: one exception must not excuse three requirements. |
| 6 | Which layer wins when they disagree and neither declares an exception? | **Neither. The pattern wins.** That is what a normative contract means. The gate fails and names both layers; a human decides which is the defect. Encoding "Angular is usually the accessible one" as policy would freeze an observation into a rule. |
| 8 | Do the charts bind `none`? | **No — they bind `figure-with-data-table`, and it is Arena's one non-APG pattern.** Both layers pair `role="img"` + `aria-label` on the `<svg>` with a visually-hidden `<table>` of the numbers. APG has no chart pattern, so this one is sourced from WCAG 1.1.1 and declared as such. Angular's keyboard-reachable legend is a **declared addition**, not a divergence to converge — its own comment explains it (a scrollable `overflow` box without `tabindex` is a keyboard trap, WCAG 2.1.1). |
| 9 | Is `Calendar` a `grid`? | **It binds `grid`, with an exception covering the whole keyboard clause — because it implements none of it.** `Calendar` has zero `role=`, zero `tabIndex` and zero key handling. Binding `none` would be a lie: it is not presentational, it is unimplemented. **And `Table` is in exactly the same state**, which this plan surfaces as a tracked admission rather than leaving as silence. |
| 7 | Does `SideNav` get a binding? | **Yes, as a delegated one.** Answered in plan 7a: React implements it, Angular delegates to `mat-nav-list`, and the Material bridge declares colour but no geometry. That asymmetry is recorded in `components-divergences.md` and is correct. |

## Global Constraints

- **English only** — all code, comments, docs and copy. **No emoji**, in product or docs.
- **A pattern is adopted, not invented.** Every pattern file carries a `source`. Of the eighteen, **sixteen** cite a WAI-ARIA Authoring Practices Guide page. Two do not and each says why in its own file: `figure-with-data-table` cites WCAG, because APG has no chart pattern, and `none` cites nothing, because the absence of a pattern is not adopted from anywhere.
- **Coverage is phrased as EVERY layer, never "at least one".** A component a layer does not implement is declared — as `delegated`, or as absent with a reason — never skipped.
- **A stale entry fails the gate that owns it.** An exception naming a requirement that does not exist in its pattern fails, exactly as `check-dimension-literals.mjs`'s `EXEMPT` does.
- **Gates must be runtime-portable.** `scripts/check-all.mjs` also runs under plain `node`; only `check:cards`, `check:vendor` and `check:demos` may be non-portable, and this gate is not one of them. Verify under `node`, not only `bun`.
- **A gate's scan sits behind `if (process.argv[1] === fileURLToPath(import.meta.url))`** so its own test can import its pure helpers. This bit two gates already.
- **A test under `scripts/` may not import a framework layer's `.ts` or `.jsx`** — that suite also runs under plain node. Parsing them as text is fine; importing is not.
- **`scripts/check-all.test.mjs` asserts the gate count and the gate-name array by literal value.** This plan takes it 18 → 19.
- **`bun run check` is a completion gate**, run once at the end.
- **CHANGELOG entries go under `## [Unreleased]`.** **Debt goes in `CLAUDE.md`'s *Known debt***, never in this document.
- **This plan changes no rendered output and no component source.** It adds declarations and a gate. If a task finds itself editing a `.jsx` or a `.ts` to make a contract true, that is 7c's work and the task has gone out of scope.

---

## File structure

**Created:**

| Path | Responsibility |
|---|---|
| `behaviour/patterns/*.json` | ~18 pattern files. One per file, named for the pattern. |
| `behaviour/README.md` | What this directory is, and why it is not under `tokens/`. |
| `frameworks/react/components/<group>/<Name>.behaviour.json` | 43 React bindings, beside each component. |
| `frameworks/angular/primitives/<name>/<name>.behaviour.json` | 21 Angular bindings, beside each primitive. |
| `frameworks/angular/behaviour-delegated.json` | The 21 Angular components Material provides. One file, because there is no per-component directory to sit beside. |
| `scripts/lib/behaviour-contracts.mjs` | Pure loaders and validators. The gate's testable half. |
| `scripts/check-behaviour.mjs` | The gate. |
| `scripts/behaviour-contracts.test.mjs` | Its suite. |

**Modified:** `scripts/check-all.mjs`, `scripts/check-all.test.mjs`, `package.json`, `CLAUDE.md`, `CHANGELOG.md`.

---

### Task 1: The pattern format, and the loader that reads it

**Files:**
- Create: `behaviour/patterns/dialog-modal.json`, `behaviour/patterns/none.json`
- Create: `behaviour/README.md`
- Create: `scripts/lib/behaviour-contracts.mjs`, `scripts/behaviour-contracts.test.mjs`

**Interfaces:**
- Produces, from `scripts/lib/behaviour-contracts.mjs`:
  - `loadPatterns(root) -> Map<string, {name, source, requires: Record<string,string|boolean>}>`
  - `validatePattern(name, pattern) -> string[]` (problems; empty means valid)
  - `PATTERN_DIR` — the repo-relative path `'behaviour/patterns'`
  These are consumed by Tasks 2, 3 and 8.

Two patterns only in this task. The other sixteen come in Task 2, once the format is proven.

- [ ] **Step 1: Write the failing test**

Create `scripts/behaviour-contracts.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePattern } from './lib/behaviour-contracts.mjs';

const ok = {
  name: 'dialog-modal',
  source: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
  requires: { 'roles.element': 'dialog', 'focus.trap': true },
};

test('a well-formed pattern has no problems', () => {
  assert.deepEqual(validatePattern('dialog-modal', ok), []);
});

test('a pattern whose name disagrees with its filename is a problem', () => {
  assert.match(validatePattern('modal', ok)[0], /name "dialog-modal" does not match/);
});

test('a pattern with no source is a problem', () => {
  const { source, ...noSource } = ok;
  assert.match(validatePattern('dialog-modal', noSource)[0], /source/);
});

test('a pattern with an empty requires map is a problem', () => {
  assert.match(validatePattern('dialog-modal', { ...ok, requires: {} })[0], /at least one requirement/);
});

test('a requirement key must be dotted, so an exception can name exactly one leaf', () => {
  const flat = { ...ok, requires: { trap: true } };
  assert.match(validatePattern('dialog-modal', flat)[0], /"trap" must be dotted/);
});

test('the none pattern is the one allowed to have no requirements', () => {
  const none = { name: 'none', source: 'n/a', requires: {} };
  assert.deepEqual(validatePattern('none', none), []);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/behaviour-contracts.test.mjs`
Expected: FAIL — `Cannot find module './lib/behaviour-contracts.mjs'`.

- [ ] **Step 3: Write the loader and validator**

Create `scripts/lib/behaviour-contracts.mjs`:

```js
/* Loaders and validators for Arena's behaviour contract layer.
 *
 * A PATTERN says what a kind of component must do -- which roles, which keys,
 * where focus goes. A BINDING says which pattern a component implements, and
 * which of that pattern's requirements it does not yet meet.
 *
 * These live in behaviour/ at the repo root rather than under tokens/ because a
 * contract is not a value and DTCG does not model one. tokens/ answers "what is
 * this value"; behaviour/ answers "what must this component do".
 *
 * Everything here is pure. scripts/check-behaviour.mjs does the filesystem walk
 * and the reporting; this module is what its suite can import. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

export const PATTERN_DIR = 'behaviour/patterns';

/** The one pattern allowed to require nothing: a component that carries no
 *  interactive affordance at all still has to SAY so, which is the whole point
 *  -- "no entry" and "verified presentational" must stop looking alike. */
const NONE = 'none';

/** @returns {string[]} problems; empty means valid */
export function validatePattern(fileStem, pattern) {
  const problems = [];
  if (pattern.name !== fileStem) {
    problems.push(`${fileStem}: name "${pattern.name}" does not match its filename`);
  }
  if (!pattern.source) {
    problems.push(`${fileStem}: no source — a pattern is adopted, not invented, and must cite where from`);
  }
  const keys = Object.keys(pattern.requires ?? {});
  if (fileStem !== NONE && keys.length === 0) {
    problems.push(`${fileStem}: requires is empty — a pattern must state at least one requirement`);
  }
  for (const key of keys) {
    if (!key.includes('.')) {
      problems.push(`${fileStem}: requirement "${key}" must be dotted (group.leaf) so an exception can name exactly one`);
    }
  }
  return problems;
}

/** @returns {Map<string, object>} pattern name -> pattern */
export function loadPatterns(root) {
  const dir = join(root, PATTERN_DIR);
  const out = new Map();
  for (const entry of readdirSync(dir).sort()) {
    if (extname(entry) !== '.json') continue;
    const stem = basename(entry, '.json');
    out.set(stem, JSON.parse(readFileSync(join(dir, entry), 'utf8')));
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun test scripts/behaviour-contracts.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Author the first two patterns**

Create `behaviour/patterns/dialog-modal.json`:

```json
{
  "name": "dialog-modal",
  "source": "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  "description": "A window that covers the app and takes the whole interaction until it is dismissed. Shared by Dialog, ConfirmDialog and Onboarding, which is the point: this contract was written three times implicitly before it was written once here.",
  "requires": {
    "roles.element": "dialog",
    "roles.aria-modal": "true",
    "roles.label": "aria-labelledby or aria-label",
    "focus.onOpen": "first-focusable",
    "focus.onClose": "restore-invoker",
    "focus.trap": true,
    "keyboard.Escape": "close"
  }
}
```

Create `behaviour/patterns/none.json`:

```json
{
  "name": "none",
  "source": "n/a — the absence of a pattern is not adopted from anywhere",
  "description": "A component with no interactive affordance: it renders, and a user cannot act on it. Binding this REQUIRES a reason, because the whole purpose of this layer is that 'nothing recorded' and 'verified presentational' stop looking alike.",
  "requires": {}
}
```

- [ ] **Step 6: Document the directory**

Create `behaviour/README.md`:

```markdown
# Arena behaviour contracts

`tokens/` answers *what is this value*. This directory answers *what must this
component do* — which roles it carries, which keys it answers, where focus goes,
what dismisses it.

It is a sibling of `tokens/`, not a child, and deliberately so. A contract is not
a value: DTCG models colours, dimensions and durations, and does not model "Escape
closes this". Putting a pattern under `tokens/src/` would mean relaxing
`scripts/check-dtcg.mjs`, which is one of the cleanest gates in the repo.

## Patterns

One file per pattern in `patterns/`, each citing the source it was adopted from.
Sixteen come from the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/).
Two do not, and each says why in its own `source`: `figure-with-data-table`, which
cites WCAG because APG has no chart pattern, and `none`, which cites nothing at all
because the absence of a pattern is not adopted from anywhere.

`requires` is a flat map of dotted keys. That shape is load-bearing: an exception
in a binding names exactly one requirement, so one exception cannot quietly excuse
three.

## Bindings

Every component declares, in every layer, beside its own source:

- React: `frameworks/react/components/<group>/<Name>.behaviour.json`
- Angular: `frameworks/angular/primitives/<name>/<name>.behaviour.json`
- Angular, delegated: one entry in `frameworks/angular/behaviour-delegated.json`,
  because a component Material provides has no Arena directory to sit beside.

A binding names a pattern and lists the requirements the component does not yet
meet, each with a reason. `bun run check:behaviour` asserts that every component
declares, that every named pattern and requirement exists, and that the two layers
agree or the difference is written down.

**What it does not assert is whether the component actually behaves as it says.**
That is a later plan's work. A component can bind `dialog-modal` here and trap no
focus at all.
```

- [ ] **Step 7: Verify the loader reads them**

Run:
```bash
bun -e 'import("./scripts/lib/behaviour-contracts.mjs").then(m => { const p = m.loadPatterns("."); console.log([...p.keys()], m.validatePattern("dialog-modal", p.get("dialog-modal"))); })'
```
Expected: `[ "dialog-modal", "none" ] []`

- [ ] **Step 8: Commit**

```bash
git add behaviour/ scripts/lib/behaviour-contracts.mjs scripts/behaviour-contracts.test.mjs
git commit -m "feat(behaviour): a pattern format, and the two patterns that prove it

behaviour/ sits beside tokens/, not under it: tokens/ answers what a value is,
and a contract is not a value. DTCG does not model 'Escape closes this' and
putting one under tokens/src/ would mean relaxing check-dtcg.mjs.

requires is a flat map of DOTTED keys, and that shape is the design. An exception
in a binding names exactly one requirement, so one exception cannot quietly
excuse three -- which answers the spec's open question about exception
granularity structurally rather than by convention.

A pattern must cite a source, because a pattern is adopted rather than invented.
none is the one that cannot, and it says so."
```

---

### Task 2: The rest of the catalogue

**Files:**
- Create: sixteen more files in `behaviour/patterns/`

**Interfaces:**
- Consumes: `validatePattern` from Task 1.
- Produces: the pattern names Tasks 3–7 bind against: `button`, `checkbox`, `switch`, `radiogroup`, `textbox`, `combobox`, `listbox`, `menu-button`, `tabs`, `alert`, `status`, `tooltip`, `grid`, `feed`, `navigation`, `figure-with-data-table` — plus `dialog-modal` and `none` from Task 1.

- [ ] **Step 1: Extend the test to cover the whole catalogue**

Append to `scripts/behaviour-contracts.test.mjs`:

```js
import { loadPatterns, PATTERN_DIR } from './lib/behaviour-contracts.mjs';

test('every pattern on disk is valid', () => {
  const patterns = loadPatterns('.');
  const problems = [...patterns].flatMap(([stem, p]) => validatePattern(stem, p));
  assert.deepEqual(problems, []);
});

test('every pattern but none cites an APG or WCAG URL', () => {
  for (const [stem, p] of loadPatterns('.')) {
    if (stem === 'none') continue;
    assert.match(p.source, /^https:\/\/www\.w3\.org\//, `${stem} must cite a w3.org source`);
  }
});

test('none aside, exactly one pattern is not from the APG', () => {
  const nonApg = [...loadPatterns('.')]
    .filter(([stem, p]) => stem !== 'none' && !p.source.includes('/ARIA/apg/'))
    .map(([stem]) => stem);
  assert.deepEqual(nonApg, ['figure-with-data-table']);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/behaviour-contracts.test.mjs`
Expected: FAIL — the third test finds no `figure-with-data-table`.

- [ ] **Step 3: Author the sixteen**

Create one file per pattern in `behaviour/patterns/`. Each takes the shape Task 1 established: `name` matching the filename, `source`, a `description` saying what the pattern is for in this repo, and a flat dotted `requires` map.

Sources are the APG pattern pages at `https://www.w3.org/WAI/ARIA/apg/patterns/<slug>/`. Use these slugs: `button`, `checkbox`, `switch`, `radio` (for `radiogroup`), `combobox`, `listbox`, `menu-button`, `tabs`, `alert`, `alertdialog` is NOT used, `grid`, `feed`, `landmarks/navigation.html` under `https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/` for `navigation`. For `textbox`, `status` and `tooltip`, use the ARIA role reference at `https://www.w3.org/TR/wai-aria-1.2/#<role>`.

**Read the source page's keyboard-interaction table before writing `requires`.** A pattern that lists requirements nobody checked against APG is a pattern that will be wrong in a way this plan's own gate cannot catch — level 1 verifies the shape, never the content.

`figure-with-data-table` is the one you author rather than adopt. It must cite WCAG 1.1.1 (`https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html`) and its `description` must say plainly that APG has no chart pattern and that this is Arena's own, derived from what both chart layers already do:

```json
{
  "name": "figure-with-data-table",
  "source": "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
  "description": "A chart. APG has no pattern for one, so this is Arena's own, adopted from WCAG 1.1.1 rather than invented: a picture nobody can read is not an alternative, so every chart pairs a labelled graphic with a real table of its numbers. The table is visually hidden, not absent.",
  "requires": {
    "roles.graphic": "img",
    "roles.label": "aria-label naming the chart",
    "alternative.table": "a real <table> of the plotted numbers, visually hidden"
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test scripts/behaviour-contracts.test.mjs`
Expected: PASS, 9 tests.

Run: `ls behaviour/patterns/ | wc -l`
Expected: `18`

- [ ] **Step 5: Commit**

```bash
git add behaviour/patterns/
git commit -m "feat(behaviour): the catalogue, sixteen adopted from APG and two that cannot be

Sixteen more patterns, each citing its APG page. The keyboard clauses were read
off the source tables rather than recalled, because level 1 of the gate verifies
a pattern's SHAPE and never its content -- a wrong requirement here is invisible
to it.

figure-with-data-table is the one Arena writes rather than adopts, and the test
suite pins that it is the only one: APG has no chart pattern, so it cites WCAG
1.1.1 instead. Its requirements are not aspirational -- they describe what both
chart layers already do, pairing a labelled role=img graphic with a real table of
the numbers."
```

---

### Task 3: The binding format, and the gate that reads declarations

**Files:**
- Modify: `scripts/lib/behaviour-contracts.mjs`, `scripts/behaviour-contracts.test.mjs`
- Create: `scripts/check-behaviour.mjs`
- Modify: `scripts/check-all.mjs`, `scripts/check-all.test.mjs`, `package.json`

**Interfaces:**
- Consumes: `loadPatterns`, `validatePattern` from Task 1.
- Produces:
  - `validateBinding(component, layer, binding, patterns) -> string[]`
  - `reactComponents(root) -> string[]`, `angularPrimitives(root) -> string[]` — the inventories the gate walks
  - the `check:behaviour` gate
  Consumed by Tasks 4–8.

- [ ] **Step 1: Write the failing test**

Append to `scripts/behaviour-contracts.test.mjs`:

```js
import { validateBinding, reactComponents, angularPrimitives } from './lib/behaviour-contracts.mjs';

const patterns = new Map([
  ['dialog-modal', { name: 'dialog-modal', source: 'x', requires: { 'focus.trap': true, 'keyboard.Escape': 'close' } }],
  ['none', { name: 'none', source: 'n/a', requires: {} }],
]);

test('a binding naming a real pattern with no exceptions is valid', () => {
  assert.deepEqual(validateBinding('Dialog', 'react', { pattern: 'dialog-modal' }, patterns), []);
});

test('a binding naming a pattern that does not exist is a problem', () => {
  assert.match(validateBinding('Dialog', 'react', { pattern: 'modal' }, patterns)[0], /unknown pattern "modal"/);
});

test('binding none without a reason is a problem', () => {
  assert.match(validateBinding('Card', 'react', { pattern: 'none' }, patterns)[0], /requires a reason/);
});

test('binding none with a reason is valid', () => {
  assert.deepEqual(validateBinding('Card', 'react', { pattern: 'none', reason: 'a surface' }, patterns), []);
});

test('an exception naming a requirement the pattern does not have is a problem', () => {
  const b = { pattern: 'dialog-modal', exceptions: [{ requirement: 'focus.restore', reason: 'x' }] };
  assert.match(validateBinding('Dialog', 'react', b, patterns)[0], /no requirement "focus.restore"/);
});

test('an exception without a reason is a problem', () => {
  const b = { pattern: 'dialog-modal', exceptions: [{ requirement: 'focus.trap' }] };
  assert.match(validateBinding('Dialog', 'react', b, patterns)[0], /reason/);
});

test('a delegated binding must name what provides the behaviour', () => {
  const b = { pattern: 'dialog-modal', delegatedTo: '' };
  assert.match(validateBinding('Dialog', 'angular', b, patterns)[0], /delegatedTo/);
});

/* An Angular primitive's directory is kebab-case (stat-card) and its React
 * counterpart is Pascal (StatCard). Deriving one from the other is the same
 * unsafe round-trip that bit the script-readable gate -- so the binding CARRIES
 * the counterpart's name instead. Without it the cross-layer assertion silently
 * never fires, which would quietly disable the one check this plan exists for. */
test('an angular binding must name its React counterpart', () => {
  const b = { pattern: 'dialog-modal' };
  assert.match(validateBinding('stat-card', 'angular', b, patterns)[0], /must declare "component"/);
});

test('an angular binding that names its counterpart is valid', () => {
  const b = { pattern: 'dialog-modal', component: 'StatCard' };
  assert.deepEqual(validateBinding('stat-card', 'angular', b, patterns), []);
});

test('the React inventory finds every component and no demo entry', () => {
  const found = reactComponents('.');
  assert.equal(found.length, 43);
  assert.ok(found.includes('Dialog'));
  assert.ok(!found.some((c) => c.endsWith('.card.entry')));
});

test('the Angular inventory finds every primitive and no bare module', () => {
  const found = angularPrimitives('.');
  assert.equal(found.length, 21);
  assert.ok(found.includes('tag'));
  assert.ok(!found.includes('chart-internals'));
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `bun test scripts/behaviour-contracts.test.mjs`
Expected: FAIL — `validateBinding is not a function`.

- [ ] **Step 3: Implement the binding validator and the inventories**

Append to `scripts/lib/behaviour-contracts.mjs`:

```js
/** @returns {string[]} problems; empty means valid */
export function validateBinding(component, layer, binding, patterns) {
  const problems = [];
  const where = `${layer}/${component}`;
  const pattern = patterns.get(binding.pattern);

  if (!pattern) {
    problems.push(`${where}: unknown pattern "${binding.pattern}" — no such file in ${PATTERN_DIR}`);
    return problems;
  }
  if (binding.pattern === NONE && !binding.reason) {
    problems.push(`${where}: binding none requires a reason — "nothing recorded" and "verified presentational" must not look alike`);
  }
  if ('delegatedTo' in binding && !binding.delegatedTo) {
    problems.push(`${where}: delegatedTo must name what provides the behaviour, e.g. "Angular Material matTooltip"`);
  }
  /* An Angular primitive's directory name is kebab-case; its React counterpart is
   * Pascal. Never derive one from the other -- scriptName('sp-4') is 'sp4' and
   * nothing recovers 'sp-4' from that, and the same asymmetry applies here.
   * Carrying the name is what lets the cross-layer assertion fire at all. */
  if (layer === 'angular' && !binding.component) {
    problems.push(`${where}: an angular binding must declare "component", naming its React counterpart (e.g. "StatCard" for stat-card)`);
  }
  for (const exception of binding.exceptions ?? []) {
    if (!(exception.requirement in pattern.requires)) {
      problems.push(`${where}: exception names no requirement "${exception.requirement}" in pattern ${binding.pattern} — stale or mistyped`);
    }
    if (!exception.reason) {
      problems.push(`${where}: exception for "${exception.requirement}" has no reason`);
    }
  }
  return problems;
}

/** Every React component, by exported name. A `*.card.entry.jsx` is a demo page's
 *  composition script, not a component, and has no contract. */
export function reactComponents(root) {
  const base = join(root, 'frameworks/react/components');
  const out = [];
  for (const group of readdirSync(base)) {
    for (const file of readdirSync(join(base, group))) {
      if (extname(file) !== '.jsx' || file.includes('.card.entry.')) continue;
      out.push(basename(file, '.jsx'));
    }
  }
  return out.sort();
}

/** Every Angular primitive, by directory name. Bare `.ts` files under
 *  primitives/ are shared internals (chart-internals, focus-trap), not
 *  components, so the walk keys on directories. */
export function angularPrimitives(root) {
  const base = join(root, 'frameworks/angular/primitives');
  return readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}
```

`readdirSync`, `join`, `basename` and `extname` are already imported at the top of the file from Task 1, so no import changes are needed. `angularPrimitives` filters to directories with `withFileTypes` deliberately: `frameworks/angular/primitives/` holds five bare `.ts` files alongside the twenty-one directories — `chart-internals.ts`, `focus-trap.ts`, `container-size.ts`, `projection-markers.ts`, `index.ts` — and none of those is a component.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test scripts/behaviour-contracts.test.mjs`
Expected: PASS, 18 tests.

- [ ] **Step 5: Write the gate**

Create `scripts/check-behaviour.mjs`:

```js
/* Asserts every component declares a behaviour contract, in every layer, and
 * that every declaration is coherent.
 *
 * WHAT THIS PROVES: that a contract was DECLARED, that it names a pattern and
 * requirements that exist, and that the two framework layers agree or their
 * difference is written down.
 *
 * WHAT THIS DOES NOT PROVE, and the distinction matters more than the gate does:
 * that a component actually behaves as it declares. A component can bind
 * dialog-modal here and trap no focus at all. Verifying compliance is a later
 * plan's work -- a static scan of what the source implements, and render suites
 * that drive it. Do not read a green run as "the layers are accessible".
 *
 *   bun scripts/check-behaviour.mjs   -> exit 0 if every component declares
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  loadPatterns, validatePattern, validateBinding,
  reactComponents, angularPrimitives, PATTERN_DIR,
} from './lib/behaviour-contracts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** React components live in group directories; find the one holding a component. */
const REACT_GROUPS = ['brand', 'charts', 'display', 'feedback', 'forms', 'navigation'];
function reactBindingPath(component) {
  for (const group of REACT_GROUPS) {
    const path = join(root, 'frameworks/react/components', group, `${component}.behaviour.json`);
    if (existsSync(path)) return path;
  }
  return null;
}

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));

async function main() {
  const problems = [];
  const patterns = loadPatterns(root);

  /* 1. Every pattern is well formed. */
  for (const [stem, pattern] of patterns) problems.push(...validatePattern(stem, pattern));

  /* 2. Every React component declares. */
  const react = new Map();
  for (const component of reactComponents(root)) {
    const path = reactBindingPath(component);
    if (!path) {
      problems.push(`react/${component}: no ${component}.behaviour.json — every component declares, including a presentational one`);
      continue;
    }
    const binding = read(path);
    problems.push(...validateBinding(component, 'react', binding, patterns));
    react.set(component, binding);
  }

  /* 3. Every Angular primitive declares. */
  const angular = new Map();
  for (const name of angularPrimitives(root)) {
    const path = join(root, 'frameworks/angular/primitives', name, `${name}.behaviour.json`);
    if (!existsSync(path)) {
      problems.push(`angular/${name}: no ${name}.behaviour.json`);
      continue;
    }
    const binding = read(path);
    problems.push(...validateBinding(name, 'angular', binding, patterns));
    if (binding.component && !react.has(binding.component)) {
      problems.push(`angular/${name}: component "${binding.component}" is not a React component — mistyped, or React dropped it`);
    }
    angular.set(binding.component ?? name, binding);
  }

  /* 4. Every React component Angular does NOT implement as a primitive is
   *    declared in the delegated file -- as provided by Material, or as
   *    genuinely absent. Coverage is EVERY layer, never "at least one": a
   *    component nobody declares for Angular is exactly the silence this gate
   *    exists to end. */
  const delegatedPath = join(root, 'frameworks/angular/behaviour-delegated.json');
  const delegated = existsSync(delegatedPath) ? read(delegatedPath) : {};
  for (const [component] of react) {
    if (angular.has(component)) continue;
    const entry = delegated[component];
    if (!entry) {
      problems.push(`angular/${component}: no primitive and no entry in behaviour-delegated.json — say whether Material provides it or nothing does`);
      continue;
    }
    problems.push(...validateBinding(component, 'angular-delegated', entry, patterns));
  }

  /* 5. Stale delegated entries: an entry for a component that now HAS a
   *    primitive, or that no longer exists in React at all. */
  for (const component of Object.keys(delegated)) {
    if (angular.has(component)) {
      problems.push(`angular/${component}: delegated entry is stale — an arena-* primitive now exists for it`);
    } else if (!react.has(component)) {
      problems.push(`angular/${component}: delegated entry names a component React no longer has`);
    }
  }

  /* 6. The two layers agree, or the difference is declared. */
  for (const [component, reactBinding] of react) {
    const other = angular.get(component) ?? delegated[component];
    if (!other) continue;
    if (other.pattern === reactBinding.pattern) continue;
    if (other.divergesFrom === reactBinding.pattern || reactBinding.divergesFrom === other.pattern) continue;
    problems.push(
      `${component}: react binds "${reactBinding.pattern}", angular binds "${other.pattern}", and neither declares divergesFrom.`
      + ` The PATTERN is the authority, not either layer — decide which is the defect.`,
    );
  }

  if (problems.length) {
    console.error(`check-behaviour: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(
    `check-behaviour: ${patterns.size} pattern(s); ${react.size} react + ${angular.size} angular`
    + ` + ${Object.keys(delegated).length} delegated declaration(s), all coherent`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
```

- [ ] **Step 6: Run the gate and watch it fail for the right reason**

Run: `bun scripts/check-behaviour.mjs`
Expected: **FAIL, exit 1, with 43 "no .behaviour.json" problems for React, 21 for Angular, and 21 delegated gaps** — because nothing is bound yet. That is the gate proving it works. Tasks 4–7 clear it.

- [ ] **Step 7: Wire it in**

In `package.json`: `"check:behaviour": "bun scripts/check-behaviour.mjs",`

In `scripts/check-all.mjs`, after the `check:states` entry:
```js
  { name: 'check:behaviour', file: 'check-behaviour.mjs' },
```

Update `scripts/check-all.test.mjs`: the gate count moves 18 → 19 and `check:behaviour` joins the name array.

- [ ] **Step 8: Commit**

```bash
git add scripts/ package.json
git commit -m "feat(scripts): check:behaviour asserts every component declares a contract

Six assertions: patterns are well formed; every React component declares; every
Angular primitive declares; every component Angular does not implement is
declared delegated or absent; no delegated entry is stale; and the two layers
name the same pattern or say why not.

Coverage is EVERY layer, never 'at least one'. The script-readable gates took the
weaker form for a good reason and left a hole now recorded under Known debt --
here it would let one layer declare nothing at all, which is the exact silence
this gate exists to end.

When the layers disagree and neither declares divergesFrom, the gate fails and
names both rather than picking a winner. The pattern is the authority; which
layer is the defect is a human's call.

The header says plainly what this does not prove: that a component behaves as it
declares. That is a later plan's work, and a green run here is not an
accessibility claim.

The gate currently fails with 85 undeclared components, which is the point."
```

---

### Task 4: Bind React's forms and navigation

**Files:**
- Create: 18 `*.behaviour.json` files under `frameworks/react/components/forms/` (9) and `navigation/` (9)

**Interfaces:**
- Consumes: the pattern names from Task 2, the validator from Task 3.

**Read each component before binding it.** A binding is a claim about what the source does, and the gate cannot check that claim — it is the one thing here that rests on care rather than machinery.

- [ ] **Step 1: Bind the nine forms components**

For each of `Button`, `Checkbox`, `IconButton`, `Input`, `Radio`, `Select`, `Switch`, `Textarea`, `ThemeToggle`, read the `.jsx` and create `<Name>.behaviour.json` beside it.

The shape, using `Button` as the worked example:

```json
{
  "pattern": "button",
  "exceptions": []
}
```

And where the component does not meet a requirement, name it and say why:

```json
{
  "pattern": "combobox",
  "exceptions": [
    { "requirement": "roles.element",
      "reason": "Select renders a native <select>, so the combobox role is implicit rather than authored. Verify when level 2 lands." }
  ]
}
```

Bind `ThemeToggle` to `button` — it renders an `<IconButton>` and nothing else.

- [ ] **Step 2: Bind the nine navigation components**

For `Breadcrumbs`, `BulkActionBar`, `CommandPalette`, `Menu`, `PageHead`, `Pagination`, `SegmentedControl`, `SideNav`, `Tabs`.

**`CommandPalette` is the case this whole layer exists for**, and its React binding must be honest: React sets no ARIA roles at all, while Angular implements an accessible combobox. Bind it `combobox` and declare an exception per unmet requirement — one exception each, not one blanket exception, because the dotted-key format exists to stop a single entry excusing a whole clause:

```json
{
  "pattern": "combobox",
  "exceptions": [
    { "requirement": "roles.element", "reason": "React sets no roles at all. Angular's arena-command-palette is the accessible reference; this is a real defect, not idiom." },
    { "requirement": "roles.aria-expanded", "reason": "Same. Converging on Angular's implementation." }
  ]
}
```

`PageHead` is presentational — bind `none` with a reason.

- [ ] **Step 3: Verify the shape of every file you wrote**

Run: `bun scripts/check-behaviour.mjs 2>&1 | grep -c "react/"`
Expected: a count 18 lower than before this task. No `unknown pattern`, no `requires a reason`, no `stale or mistyped` lines mentioning a component you just bound. If one appears, the binding is malformed — fix it rather than changing the pattern to accommodate it.

- [ ] **Step 4: Commit**

```bash
git add frameworks/react/components/forms/ frameworks/react/components/navigation/
git commit -m "feat(behaviour): eighteen React bindings — forms and navigation

CommandPalette is the entry this layer was designed around. React sets no ARIA
roles at all while Angular implements a real combobox, and that has been recorded
as a 'divergence' -- which by definition is not a defect -- for as long as both
have existed. It is now an exception per unmet requirement, with a reason saying
plainly that it IS a defect and which layer is the reference.

One exception per requirement rather than one per component: the dotted-key
format exists precisely so a single entry cannot excuse a whole clause."
```

---

### Task 5: Bind React's display and feedback

**Files:**
- Create: 20 `*.behaviour.json` files under `frameworks/react/components/display/` (10) and `feedback/` (10)

- [ ] **Step 1: Bind the ten display components**

For `ActivityFeed`, `Avatar`, `Badge`, `Calendar`, `Card`, `Skeleton`, `StatCard`, `Table`, `Tag`, `UnauthCard`.

Most are presentational and bind `none` with a reason — `Avatar`, `Badge`, `Card`, `Skeleton`, `StatCard`, `Tag`, `UnauthCard`. Write a real reason for each; "presentational" alone is not one. `ActivityFeed` binds `feed`.

**`Calendar` and `Table` are the two entries worth care, and they are the same case.** Both have zero `role=`, zero `tabIndex` and zero key handling — verify that yourself with `grep -c 'role=\|tabIndex\|onKeyDown'` on each before writing. Neither is presentational: they render interactive data. Binding them `none` would be a lie. Bind each to `grid` and declare an exception for every keyboard requirement, with a reason that says what is actually true:

```json
{
  "pattern": "grid",
  "exceptions": [
    { "requirement": "keyboard.ArrowKeys",
      "reason": "Calendar implements no keyboard navigation at all — zero role, tabIndex or key handling. Mouse-only. This is a defect, recorded so it stops looking like a component nobody had anything to say about." }
  ]
}
```

Add one such exception per keyboard requirement `grid` declares.

- [ ] **Step 2: Bind the ten feedback components**

For `Alert`, `ConfirmDialog`, `Dialog`, `EmptyState`, `ErrorState`, `Onboarding`, `ProgressBar`, `Spinner`, `Toast`, `Tooltip`.

`Dialog`, `ConfirmDialog` and `Onboarding` all bind `dialog-modal` — that shared binding is the point of the pattern, and the differences between the three become exceptions rather than three separately-drifting implementations.

`Tooltip` binds `tooltip`, with an exception for the keyboard requirement: it has `onMouseEnter`/`onMouseLeave` and no `onFocus`/`onBlur`, so it is unreachable by keyboard. That is already recorded in CLAUDE.md's *Known debt*; the reason here should point at it rather than restating it.

- [ ] **Step 3: Verify**

Run: `bun scripts/check-behaviour.mjs 2>&1 | grep -c "react/"`
Expected: `0` — every React component now declares.

- [ ] **Step 4: Commit**

```bash
git add frameworks/react/components/display/ frameworks/react/components/feedback/
git commit -m "feat(behaviour): twenty React bindings, and two admissions

Calendar and Table both render interactive data with zero roles, zero tabIndex
and zero key handling. Binding them 'none' would have been a lie -- they are not
presentational, they are unimplemented -- so both bind grid with an exception per
keyboard requirement and a reason that says so. That converts two silences into
two tracked admissions, which is the whole warrant for this layer.

Dialog, ConfirmDialog and Onboarding now share one dialog-modal contract. It was
written three times implicitly before, which is why Onboarding drifted into being
an assertion rather than a real modal on one of the layers.

Every React component declares."
```

---

### Task 6: Bind React's brand and charts, and every Angular primitive

**Files:**
- Create: 5 React bindings (`brand/AppLogo`, `charts/BarChart`, `ChartCard`, `DoughnutChart`, `LineChart`)
- Create: 21 Angular bindings under `frameworks/angular/primitives/<name>/<name>.behaviour.json`

- [ ] **Step 1: Bind the five React brand and chart components**

`AppLogo` and `ChartCard` are presentational — `none` with a reason. The three charts bind `figure-with-data-table`.

- [ ] **Step 2: Bind the twenty-one Angular primitives**

One file per directory in `frameworks/angular/primitives/`. **Each must declare `component`, naming its React counterpart in Pascal case** — `{"component": "StatCard", "pattern": "..."}` for `stat-card`. That is not bookkeeping: the directory name is kebab and the React name is Pascal, deriving one from the other is unsafe, and without the field the gate's cross-layer assertion silently never fires.

Each names the same pattern its React counterpart does — **every Angular primitive has one**, verified — unless the layer genuinely diverges, in which case declare `divergesFrom` naming the React pattern plus a reason.

`doughnut-chart` binds `figure-with-data-table` with an **addition**, not an exception: its legend carries `tabindex="0"` and `role="group"` because the legend scrolls and a `tabindex`-less `overflow` box is a keyboard trap (WCAG 2.1.1). React's has none. Record it in the binding's `additions` array so it is visible rather than looking like an undeclared difference:

```json
{
  "pattern": "figure-with-data-table",
  "additions": [
    { "provides": "keyboard.legend-reachable",
      "reason": "The legend scrolls, and a tabindex-less overflow box is a keyboard trap (WCAG 2.1.1). React's DoughnutChart has no equivalent; this is Angular ahead, not Angular diverging." }
  ]
}
```

`additions` is free-form and unvalidated by design: the gate has no pattern requirement to check it against, because by definition an addition is something the pattern does not require. Do not extend the validator for it.

- [ ] **Step 3: Verify**

Run: `bun scripts/check-behaviour.mjs`
Expected: only the 21 delegated gaps remain. No `react/` or `angular/<primitive>` problems.

- [ ] **Step 4: Commit**

```bash
git add frameworks/react/components/brand/ frameworks/react/components/charts/ frameworks/angular/primitives/
git commit -m "feat(behaviour): the charts get a pattern, and every Angular primitive declares

APG has no chart pattern, so figure-with-data-table is Arena's own, adopted from
WCAG 1.1.1 and describing what both layers already do: a labelled role=img
graphic paired with a real, visually hidden table of the numbers.

Angular's doughnut legend records an ADDITION rather than an exception. Its
tabindex/role=group is there because the legend scrolls and a tabindex-less
overflow box is a keyboard trap; React has no equivalent. That is Angular ahead
of the pattern, not diverging from it, and the two need different words or the
record teaches the wrong lesson."
```

---

### Task 7: Declare what Angular delegates to Material

**Files:**
- Create: `frameworks/angular/behaviour-delegated.json`

**Interfaces:**
- Consumes: `validateBinding`'s `delegatedTo` rule from Task 3.

This is plan 7a's finding made concrete. Twenty-one React components have a Tailwind manifest and no `arena-*` primitive, because Material provides the control — and calling that "Angular does not have a Tooltip" is false in a way that matters.

- [ ] **Step 1: Write the file**

Create `frameworks/angular/behaviour-delegated.json`. One entry per component, keyed by its React name, each naming the pattern, what provides it, and — where Arena dresses it — what does the dressing:

```json
{
  "Tooltip": {
    "pattern": "tooltip",
    "delegatedTo": "Angular Material matTooltip",
    "reason": "Material provides the directive, its positioning and its dismissal. Arena has no arena-tooltip primitive and should not grow one.",
    "exceptions": [
      { "requirement": "timing.open-delay",
        "reason": "matTooltip's showDelay and hideDelay default to 0, so Angular reveals instantly where React now waits --delay-open. The seam is MAT_TOOLTIP_DEFAULT_OPTIONS and nothing wires it. Recorded in CLAUDE.md Known debt." }
    ]
  },
  "SideNav": {
    "pattern": "navigation",
    "delegatedTo": "Angular Material mat-nav-list",
    "dressedBy": "frameworks/angular/theme/arena-material.css",
    "reason": "mat-nav-list already provides the anchor-or-button distinction, the active state and the keyboard behaviour. The bridge declares colour, weight, font and shape and deliberately no geometry — re-specifying Material's list metrics is the duplication the bridge exists to avoid."
  }
}
```

Write the remaining nineteen the same way: `Badge`, `Button`, `Card`, `Checkbox`, `Dialog`, `IconButton`, `Input`, `Menu`, `Pagination`, `ProgressBar`, `Radio`, `SegmentedControl`, `Select`, `Spinner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Toast`.

**Name the real Material control for each** — `MatDialog`, `MatMenu`, `MatPaginator`, `MatProgressBar`, `MatSnackBar`, `MatTabGroup`, `MatTable`, `matInput`, `MatSelect`, and so on. Check `frameworks/angular/theme/arena-material.css` for which ones Arena actually dresses and set `dressedBy` only for those; do not guess.

The `Tooltip` entry's exception above is not decoration — it is the divergence plan 7a's whole-branch review found, and this file is where it becomes machine-visible rather than prose in a Known debt list.

- [ ] **Step 2: Verify the gate is now green**

Run: `bun scripts/check-behaviour.mjs`
Expected: **PASS** — `18 pattern(s); 43 react + 21 angular + 21 delegated declaration(s), all coherent`.

Run: `node scripts/check-behaviour.mjs`
Expected: identical output. The gate must be portable; if it fails under plain node, it used a Bun-only API.

- [ ] **Step 3: Prove the stale-entry rules fire**

Both directions, then revert each:

```bash
# a delegated entry for a component that has a primitive
bun -e 'const f="frameworks/angular/behaviour-delegated.json";const j=JSON.parse(require("fs").readFileSync(f));j.Tag={pattern:"none",reason:"x",delegatedTo:"y"};require("fs").writeFileSync(f,JSON.stringify(j,null,2))'
bun scripts/check-behaviour.mjs   # expect FAIL naming Tag as stale
git checkout frameworks/angular/behaviour-delegated.json
```

Then an exception naming a requirement that does not exist: edit any binding's exception `requirement` to `focus.nonexistent`, run the gate, confirm it fails naming it stale or mistyped, and revert.

Run `git status --porcelain` after both and confirm nothing is left behind.

- [ ] **Step 4: Commit**

```bash
git add frameworks/angular/behaviour-delegated.json
git commit -m "feat(behaviour): Angular declares the twenty-one controls Material provides

Saying 'Angular has no Tooltip' is false and was said anyway, in a plan whose own
scope section had just explained why it is false. Angular has matTooltip;
twenty-one React components have a Tailwind manifest and no arena-* primitive for
exactly this reason, and that is delegation, not absence.

Each entry names the Material control, and dressedBy where arena-material.css
actually dresses it -- checked against that file rather than assumed.

Tooltip's entry carries the divergence plan 7a's whole-branch review found:
matTooltip's showDelay defaults to 0, so Angular reveals instantly where React
now waits. It was prose in a Known debt list; it is a machine-visible exception
against a named requirement now, and it cannot go stale unnoticed."
```

---

### Task 8: Documentation and the completion gate

**Files:**
- Modify: `CLAUDE.md`, `CHANGELOG.md`

- [ ] **Step 1: Document the layer in CLAUDE.md**

After the behaviour-values paragraph plan 7a added, insert:

```markdown
**Behaviour also has contracts, and they are not tokens.** `behaviour/patterns/*.json`
states what a kind of component must do — roles, keys, focus, dismissal — one file per
pattern, each citing the WAI-ARIA APG page it was adopted from. Exactly one,
`figure-with-data-table`, is Arena's own and cites WCAG instead, because APG has no
chart pattern. `requires` is a flat map of **dotted** keys, and that shape is
load-bearing: an exception names exactly one requirement, so one entry cannot excuse a
whole clause.

Every component declares, in **every** layer, beside its own source — React at
`<Name>.behaviour.json`, Angular at `<name>.behaviour.json`, and the twenty-one
controls Angular delegates to Material in `frameworks/angular/behaviour-delegated.json`.
**Delegation is a state, not an absence**: Angular has a tooltip, it is `matTooltip`,
and a declaration reading "absent" would be false.

`bun run check:behaviour` asserts every component declares, that no declaration names a
pattern or requirement that does not exist, that no delegated entry is stale, and that
the layers agree or say why not. When they disagree the gate names both and picks no
winner — the pattern is the authority. **It does not assert that a component behaves as
it declares**: a component can bind `dialog-modal` and trap no focus. A green run is a
coverage claim, never an accessibility one.
```

Update the gate count sentence from eighteen to nineteen.

- [ ] **Step 2: Record what this layer newly makes visible**

In `CLAUDE.md` under `## Known debt`, add:

```markdown
- **`Calendar` and `Table` implement no keyboard navigation at all** — zero `role=`,
  zero `tabIndex`, zero key handling, in components that render interactive data. Both
  bind `grid` with an exception per keyboard requirement rather than binding `none`,
  because "presentational" would be a lie: they are not simple, they are unimplemented.
  This was invisible before the contract layer, which is the clearest evidence that
  layer was worth building.
```

- [ ] **Step 3: Add the changelog entry**

Under `## [Unreleased]`:

```markdown
### Added
- **Behaviour contracts.** `behaviour/patterns/` holds eighteen patterns — sixteen adopted from the WAI-ARIA APG with their source URLs, plus `figure-with-data-table` (Arena's own, from WCAG, because APG has no chart pattern) and `none` (adopted from nowhere, because it is the absence of a pattern). Every component declares which it implements, in every layer: 43 React bindings, 21 Angular, and 21 controls Angular delegates to Material.
- `check:behaviour` — every component declares, every named pattern and requirement exists, no delegated entry is stale, and the layers agree or say why not. It asserts declaration and coherence, **not** that a component behaves as it declares.

### Changed
- `CommandPalette`'s ARIA gap is an exception with a reason rather than a "divergence", which by definition could not be a defect.
```

- [ ] **Step 4: Run the completion gate**

Run: `bun run check`
Expected: 19 gates. `check:cards`, `check:vendor` and `check:demos` may SKIP; **no gate may FAIL**.

Run: `node scripts/check-all.mjs`
Expected: `check:behaviour` PASS under plain node too.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: behaviour has contracts now, and CLAUDE.md says what a green run does not mean

The gate asserts coverage and coherence. It does not assert that a component
behaves as it declares, and the paragraph says so twice, because the failure mode
of a contract layer is somebody reading a green run as an accessibility claim.

Known debt gains the thing this layer made visible on its first pass: Calendar
and Table render interactive data with no keyboard navigation whatsoever. Nothing
in the repo said so before, because there was nowhere for a component to be
silent in a way that showed up."
```

---

## Self-review

**Spec coverage.** This plan implements the spec's §4 (patterns), §5 (bindings, mandatory, per layer), §6 level 1, and §8's day-one strategy. §6 levels 2 and 3 and §7's `components-divergences.md` migration are **not** here and are 7c's subject, declared under *Scope*. §§1–3 were plan 7a's.

**Open questions.** All six contract-layer questions are answered in the table above, five with evidence read from the tree rather than reasoned about in the abstract.

**What this plan does NOT claim.** That any component is accessible, or that any declaration is true. Level 1 proves declaration and coherence only, and the gate's own header, CLAUDE.md and the CHANGELOG each say so independently — because that is the misreading this layer invites.

**Placeholder scan.** No TBD, no "add error handling", no "similar to Task N".

**Type consistency.** `loadPatterns`/`validatePattern`/`PATTERN_DIR` are defined in Task 1 and consumed in Tasks 2 and 3. `validateBinding`/`reactComponents`/`angularPrimitives` are defined in Task 3 and consumed by the gate. The binding fields used in Tasks 4–7 — `pattern`, `reason`, `exceptions[].requirement`, `exceptions[].reason`, `delegatedTo`, `dressedBy`, `divergesFrom`, `additions` — are exactly those Task 3's validator reads, except `dressedBy` and `additions`, which are deliberately unvalidated and Task 6 says why.

**A deliberate brittleness worth not "fixing".** Task 3's suite pins `reactComponents` at 43 and `angularPrimitives` at 21. Those literals break when a component is added — and that is correct, not brittle: adding a component to this repo now *requires* declaring its contract, so a failing count is the reminder. A reviewer should not soften it into `assert.ok(length > 0)`, which would pass a walker that silently collected nothing.

**Known risk, and it is the real one.** Tasks 4–7 author 85 declarations, and **the gate cannot check whether any of them is true**. It checks that a pattern named exists, not that the component implements it. A binding claiming `dialog-modal` for a component that traps no focus passes level 1 cleanly. That is inherent to a declaration layer and is why 7c exists — but it means these four tasks rest on the implementer actually reading each component, and a reviewer should spot-check bindings against sources rather than only against the schema.
