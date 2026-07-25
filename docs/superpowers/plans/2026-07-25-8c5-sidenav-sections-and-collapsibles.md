# Plan 8C5 — `SideNav` becomes a compound component: sections, nested collapsibles, and the `disclosure` pattern

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break `SideNav`'s one-batch-old `items` contract and rebuild it as a compound component —
`SideNavItem`, `SideNavSection`, `SideNavCollapsible` — with arbitrary nesting, a token-multiplier
indent, and the repository's first `disclosure` pattern.

**Architecture:** The parent walks its direct children and injects with `cloneElement`; a section
and a collapsible re-inject into *their* direct children with `depth + 1`. One hop per level is what
makes nesting arbitrary without introducing a React context, and it is the same idiom
`Table`/`TableRow` and `RadioGroup`/`Radio` already use — with the same limit, stated rather than
discovered: a consumer's own wrapper component between two levels breaks the chain. Three new
single-layer contracts land one per task, each leaving `check:api` green and one number higher.

**Tech Stack:** Bun (test + build), React 18 with inline style objects and `useId`,
`@happy-dom/global-registrator` for the DOM suite, DTCG tokens, Tailwind v4 manifests, headless
Chromium through `scripts/lib/chromium.mjs` for the hand-verification probe only.

Spec: `docs/superpowers/specs/2026-07-25-8c5-sidenav-sections-and-collapsibles-design.md`.
Branch: `sidenav-8c5`, cut from `daf3580` (main; the 8C4 merge).

---

## How this plan is executed

**One subagent per task, with a brief precise enough that it never has to guess**, and its work
accepted on **what the numbers say, not on what its report says**. In each of the two previous
batches, re-running the gates after a task that reported success surfaced real findings in almost
every task — including one defect no report mentioned at all. So after each task:

- re-run the gates that task touched **yourself**, and read the printed counts;
- reconcile them against the ladder in Task 0 Step 4;
- read the diff, not the summary.

**A task that retires an exception or fixes a defect must watch the proof FAIL against the old code
first**, then pass — and any file temporarily mutated to induce a failure is restored and verified
byte-identical with `sha256sum -c`. A green test that was never seen red proves nothing about the
change that supposedly made it green.

**The first step of every task is `git status --short`.**

---

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only**, everywhere in the repo. **No emoji. No gradients.** Comments, tests, docs and
   UI copy alike.
2. **`check:api` climbs and never drops: 46/66 → 49/69.** One contract and one layer per contract
   task, in the ladder Task 0 records and each task's own header repeats. `SideNav.json` is
   **rewritten** rather than added, so it moves no number; `api/types/side-nav-item.json` is
   **deleted**, and deleting a type moves no number either.
3. **A commit message containing a backtick is written with a quoted here-doc**, never
   `git commit -m "…"`. A backtick inside a double-quoted shell string opens command substitution and
   is silently spliced away. Use `git commit -q -F - <<'MSG' … MSG` and verify with
   `git log -1 --format=%B`. **`git merge` does not accept `-F -`** — use `--no-commit`, then commit.
4. **`bun run check` runs ONCE, in the close-out.** Individual gates run per task, and a task that
   widens a gate watches that gate fail and then pass.
5. **No new gate.** Chromium verification in this plan is a **probe and a written checklist**, never
   a `check:*` step — the same arrangement the grid rule uses, and the same refusal
   `dialog-modal.test.jsx`'s header makes of a fourth non-portable gate.
6. **A dimension in a framework layer is a token or a derivation of tokens.** Run
   `bun run check:dimensions` after touching any `.jsx`. If it flags an indent expression, that is a
   real finding to fix, **never an `EXEMPT` entry to write** — and see constraint 14.
7. **Retiring an exception requires proof above it in the same change.** Never a wholesale deletion.
8. **A required member that cannot be defaulted gets a runtime guard, and the operator is a
   decision.** Use `== null` (absence only) when `false`, `0` or `[]` are values a caller passes on
   purpose — `Dialog.open`, `Pagination.page`, the old `SideNav.items`. Use a falsy check (`!x`) when
   a present-but-blank value **is** the defect, which is the case for **every accessible name and
   every identifier** in this plan: `SideNav.ariaLabel`, `SideNavItem.id`/`label`,
   `SideNavSection.label`, `SideNavCollapsible.id`/`label`. Mixing the two is what let
   `aria-label=""` through in 8C4 and cost a close-out review cycle.
   Message shape: `throw new Error('Component: \`member\` is required')`.
9. **A type a component's `.d.ts` declared locally before migration keeps a re-export from
   `api.generated`** (carried from 8C1–8C4). **This plan is the first exception and it is
   deliberate**: `SideNavItem` stops being a type and becomes a *component* of the same name, so a
   re-export would put two different things called `SideNavItem` in one directory. The re-export is
   deleted with the type. Say so in the commit and in `CHANGELOG.md`.
10. **No per-item renderer.** A function returning a node is not a member; the reader throws on one.
    The whole point of this batch is that a consumer writes the element instead.
11. **Do not touch `CHANGELOG.md` or `CLAUDE.md` before the close-out task.** Record findings for it
    in the ledger.
12. **`bun run test:react-dom` is never `bun test frameworks/react/test-dom`.** It needs
    `--preload ./frameworks/react/test-dom/preload.js`; without it react-dom latches its legacy
    change-detection path at module evaluation and a dispatched event reaches an `onChange` **zero**
    times, silently. This cost a day to find once. The three invocation sites that pass it are
    `test:react-dom`, `test`, and `testStep()` in `scripts/check-all.mjs`.
13. **Every commit leaves the tree green** for every gate it touches. There is no "fix it in the next
    task" — the call sites break in Task 2 and are repaired in Task 2.
14. **`scripts/check-dimension-literals.test.mjs` pins `EXEMPT` and `PASSTHROUGH` by name.** A change
    to either map without touching that suite in the same commit leaves three tests describing a
    gate that no longer exists.
15. **What happy-dom can and cannot prove.** Its `.focus()` moves `document.activeElement`; its
    sequential focus navigation does not exist. So an assertion **following our own `.focus()` call**
    is real, and an assertion that a Tab keypress moved focus is worthless — it would pass identically
    against a perfect implementation and none. For structure, assert `tagName` and `tabindex`, never
    `activeElement`. Likewise a keydown on a native `<button>` does not synthesise a click: see
    Task 4's note on how `keyboard.Enter`/`keyboard.Space` are honestly established.
16. **A behaviour binding, in every layer, for every component.** A new React component means a new
    `<Name>.behaviour.json` beside its source **and** a new entry in
    `frameworks/angular/behaviour-delegated.json`. `check:behaviour` asserts every component
    declares; 8C2 and 8C3 both learned this by making an item a component.

---

## What this plan measured before it was written

Read off the tree at `daf3580` on 2026-07-25. Do not re-derive; do verify anything you are about to
depend on.

### The baselines

| measure | value |
|---|---|
| `bun run check:api` | `46 contract(s) hold across 66 layer implementation(s)` |
| `bun run check:compliance` | `7 of 66 bindings verified by a render suite` |
| merged process (`bun test scripts frameworks/react/test/ frameworks/angular/test`) | **1175 pass, 0 fail across 104 files** |
| isolated DOM process (`bun run test:react-dom`) | **64 pass, 0 fail across 9 files** |

### What `SideNav` is today

- `api/components/SideNav.json` declares four members: `items` (required array of `SideNavItem`),
  `active` (string), `ariaLabel` (required string), `nav` (event, payload `SideNavItem`).
- `api/types/side-nav-item.json` declares `SideNavItem` as an object with `id` (required), `label`
  (required), `icon`, `href` — all strings since 8C4's single-icon convention.
- `SideNav.jsx` is 63 lines: a `<nav>` with two guards (`items == null`, `!ariaLabel`), a `.map()`
  over `items`, one shared style object for both the `<a>` and the `<button>` branch, and the glyph
  Arena draws at `fontSize: var(--icon-lg)`.
- `SideNav.d.ts` imports `SideNavItem` from `../../api.generated` and **re-exports it** — the only
  thing in the tree that does. `frameworks/react/api.generated.d.ts:175` and
  `frameworks/angular/api.generated.ts:175` both declare the interface; **no Angular file imports
  it**, verified by grep.
- `SideNav.behaviour.json` binds `navigation` with `"exceptions": []`. The `navigation` pattern
  requires exactly two things — `roles.element` and `roles.label` — and **says nothing about what
  lives inside the landmark**, so this binding stays true and untouched by everything below.
- `frameworks/angular/behaviour-delegated.json`'s `SideNav` entry delegates to `mat-nav-list` and
  **cites `components-divergences.md`'s SideNav entry by name** — which Task 5 rewrites. See
  constraint 16 and Task 5, Step 6.

### The four call sites this breaks

1. `frameworks/react/ui_kits/console/Shell.jsx` — a module-level `NAV` array of four hash anchors,
   `<SideNav ariaLabel="Primary" items={NAV} active={active} onNav={(item) => onNav?.(item.id)} />`.
2. `frameworks/react/components/navigation/navigation.card.entry.jsx:27-32` — three inline items
   inside a `<div style={{width:'var(--layout-sidebar)'}}>`. Its page declares
   `viewport="700x640"`; growing the demo grows the card, and `check:cards` is what says by how much.
3. `frameworks/react/components/navigation/SideNav.prompt.md` — its example, its prose and its
   Do/Don't list all describe `items`.
4. `frameworks/react/test/side-nav.test.jsx` — **twelve tests**, every one of them passing `items`.

### There is no `disclosure` pattern, and adding one touches two maps

`behaviour/patterns/` holds **twenty** files and none covers a show/hide button. Adding one is not
just a file: `scripts/behaviour-compliance.test.mjs` asserts four things that bind a pattern to
`scripts/lib/behaviour-compliance.mjs`'s maps, and all four fire on this addition —

- every pattern requiring `roles.element` has an `ELEMENT_ROLE` entry;
- `ELEMENT_ROLE` names no pattern that does not require `roles.element`;
- every `ELEMENT_ROLE` value is a role its own pattern's prose names;
- every pattern whose `roles.label` prose mentions text content is in `LABEL_ACCEPTS_TEXT`, and no
  pattern outside it does.

`roles.expanded` and `roles.controls` are **already** in `ATTRIBUTE_FOR` and therefore already
`DECIDABLE`; `keyboard.Enter` and `keyboard.Space` are already in `BEHAVIOURAL`. So the new pattern
needs **no new requirement key** — which is why Task 1 is small and can stand alone.

`check-behaviour.mjs` has **no orphan-pattern rule**: a pattern file with nothing bound to it is
legal. Task 1 verifies that rather than assuming it.

### The Tailwind manifest is behind by more than an icon

`frameworks/tailwind/components/SideNav.manifest.json` declares **two** slots — `root` and `item` —
plus an `active` true/false variant. It has been wrong since 8C4: Arena took ownership of the glyph
(`<i className={icon}>` at `fontSize: var(--icon-lg)`) and the manifest describes no icon at all.
`components-divergences.md`'s SideNav entry records that as *"a real gap rather than a divergence
with a reason"* and says in as many words that **the manifest "owes an `icon` slot"** and that the
gap **is a defect to fix**. After this batch it owes considerably more: the section group and its
label, the collapsible's trigger, its caret and its region.

**The manifest carries no hover/focus modifier today and must not gain one.** `SideNav.jsx`
implements no hover and no focus state anywhere — no `onMouseEnter`, no `onFocus`, no `:hover` in an
injected string — and `check:states` fails a `hover:`/`focus:`-family modifier in a manifest whose
mirrored React component implements none. That gate exists because this exact shape shipped twice on
one branch.

---

## File Structure

**Created**

- `behaviour/patterns/disclosure.json` — the show/hide contract, adopted from APG.
- `frameworks/react/components/navigation/side-nav-inject.js` — the two shared pure helpers,
  `injectInto()` and `indentFor()`. A module beside the components rather than duplicated code in
  four files; `use-container-width.js` and `use-dialog-modal.js` are the precedent that
  CLAUDE.md's "a component is self-contained" rule is about CSS classes, not JS helpers.
- `frameworks/react/components/navigation/SideNavItem.{jsx,d.ts,prompt.md,behaviour.json}`
- `frameworks/react/components/navigation/SideNavSection.{jsx,d.ts,prompt.md,behaviour.json}`
- `frameworks/react/components/navigation/SideNavCollapsible.{jsx,d.ts,prompt.md,behaviour.json}`
- `api/components/SideNavItem.json`, `SideNavSection.json`, `SideNavCollapsible.json`
- `frameworks/react/test/side-nav-structure.test.jsx` — the DOM-free suite for the section and the
  collapsible: shape, guards, the indent, and the two R4 escapes per component.
- `frameworks/react/test-dom/side-nav-disclosure.test.jsx` — the DOM suite: expand/collapse,
  `aria-expanded`, auto-expand on `active`, the `toggle` payload, the injected `aria-current` at
  depth, and `assertPattern` against the `disclosure` binding.

**Modified**

- `api/components/SideNav.json` — `items` out, `content`/`indentStep` in, `nav`'s payload becomes
  `string`.
- `frameworks/react/components/navigation/SideNav.{jsx,d.ts,prompt.md}` — the compound rewrite.
- `frameworks/react/test/side-nav.test.jsx` — rewritten around children.
- `frameworks/react/ui_kits/console/Shell.jsx`,
  `frameworks/react/components/navigation/navigation.card.entry.jsx` — the two live call sites.
- `frameworks/angular/behaviour-delegated.json` — three new entries.
- `frameworks/tailwind/components/SideNav.manifest.json` and `SideNav.card.html`.
- `scripts/check-compliance.mjs` — `COVERED` gains `SideNavCollapsible:react`.
- `components-divergences.md` — the SideNav entry rewritten whole.
- Generated, never hand-edited: `frameworks/react/api.generated.d.ts`,
  `frameworks/angular/api.generated.ts` (`bun run build:api`);
  `frameworks/tailwind/components/SideNav.manifest.ts` (`bun run build:tailwind`); every `.js`
  sibling under `frameworks/react/` (`bun run build:demos`).

**Deleted**

- `api/types/side-nav-item.json` — the item stops being data Arena reads.

---

## Task 0: Pre-flight

**Files:** none. No commit.

- [ ] **Step 1: `git status --short`** — the first step of every task in this plan. Expected: empty.

- [ ] **Step 2: Confirm the baseline**

```bash
cd /home/juan/Dravensoft/Identity
git rev-parse --abbrev-ref HEAD          # sidenav-8c5
bun run check:api                        # 46 contract(s) ... 66 layer implementation(s)
bun run check:compliance                 # 7 of 66
bun run check:behaviour                  # green
bun test scripts frameworks/react/test/ frameworks/angular/test   # 1175 across 104
bun run test:react-dom                   # 64 across 9 — NOT `bun test <dir>`, it needs the preload
```

If any differs from the table under *What this plan measured*, **stop** and find out why before
writing a line of code.

- [ ] **Step 3: Open the ledger.** 8C4's is still in place, so archive it and start 8C5's:

```bash
cd /home/juan/Dravensoft/Identity/.superpowers/sdd
mv progress.md progress-8c4-archived.md
```

`.superpowers/` is git-ignored, so this produces no commit. Write the new `progress.md` with the
header 8C1–8C4 used: plan path, spec path, branch, base commit, the ladder this batch walks, and a
`## Pre-flight` section recording every number Step 2 printed. Four archived ledgers now sit beside
it (`progress-8c1-archived.md` … `progress-8c4-archived.md`).

- [ ] **Step 4: Record the ladder** in the ledger, because every later task reconciles against it:

| after task | `check:api` | `check:compliance` |
|---|---|---|
| 0 (baseline) | 46/66 | 7 of 66 |
| 2 — `SideNavItem` | **47/67** | 7 of 66 |
| 3 — `SideNavSection` | **48/68** | 7 of 66 |
| 4 — `SideNavCollapsible` | **49/69** | **8 of 66** |

---

## Task 1: `behaviour/patterns/disclosure.json`

**Files:** create `behaviour/patterns/disclosure.json`; modify
`scripts/lib/behaviour-compliance.mjs` (`ELEMENT_ROLE`, `LABEL_ACCEPTS_TEXT`).
**Interfaces produced:** the pattern name `disclosure` and its six requirement keys, which Task 4's
binding and its compliance suite consume.

> **Why this is its own task, before the component that binds it.** The pattern is the authority a
> binding is judged against; writing it in the same commit as its first binder makes the pattern
> answerable to the component instead of the other way round. It is also the one task in this plan
> that touches a shared script, and a reviewer should be able to reject it without rejecting a
> component.

- [ ] **Step 1: `git status --short`** — expected empty.

- [ ] **Step 2: Write the failing test.** Add to `scripts/behaviour-compliance.test.mjs`:

```js
test('the disclosure pattern is bound to the button role', () => {
  const pattern = JSON.parse(readFileSync(join(PATTERN_DIR, 'disclosure.json'), 'utf8'));
  assert.equal(pattern.name, 'disclosure');
  assert.match(pattern.source, /apg\/patterns\/disclosure/);
  assert.equal(ELEMENT_ROLE.disclosure, 'button');
  assert.ok(LABEL_ACCEPTS_TEXT.has('disclosure'),
    'a disclosure button is named by its own text content');
  // Every key it requires must already be decidable or behavioural: this pattern
  // deliberately introduces no new requirement vocabulary.
  for (const key of Object.keys(pattern.requires)) {
    assert.ok(DECIDABLE.has(key) || BEHAVIOURAL.has(key), `${key} is in neither set`);
  }
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: FAIL — `ENOENT`, no such file `behaviour/patterns/disclosure.json`.

- [ ] **Step 4: Write the pattern**

```json
{
  "name": "disclosure",
  "source": "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "description": "A button that shows and hides one section of content. The button is the whole widget: there is no roving tab stop, no arrow navigation and no relationship between one disclosure and the next -- two of them side by side are two independent buttons, which is exactly why a sidebar of nested groups is a stack of disclosures and NOT a treeview. What that costs is stated in every binding that names this pattern: no aria-level, no arrow keys, no set-size information.",
  "requires": {
    "roles.element": "button (a native button element, or role=button where a button cannot be used)",
    "roles.label": "text content, aria-labelledby, or aria-label on the button",
    "roles.expanded": "aria-expanded on the button -- true while the region it controls is shown, false while it is hidden",
    "roles.controls": "aria-controls on the button, naming the id of the region it shows and hides",
    "keyboard.Enter": "activates the button and toggles the region",
    "keyboard.Space": "activates the button and toggles the region"
  }
}
```

- [ ] **Step 5: Extend the two maps** in `scripts/lib/behaviour-compliance.mjs`. In `ELEMENT_ROLE`,
  in alphabetical position between `'dialog-modal'` and `listbox`:

```js
  disclosure: 'button',      // the button IS the widget; the region it controls carries no role
```

and in `LABEL_ACCEPTS_TEXT`:

```js
export const LABEL_ACCEPTS_TEXT = new Set(['button', 'checkbox', 'disclosure', 'switch']);
```

**Both are required by the assertions listed under *What this plan measured*, and the second is not
optional prose**: `roles.label`'s value above says *"text content"*, and the test
*"no pattern outside `LABEL_ACCEPTS_TEXT` admits text content"* fails on the pattern file alone.

- [ ] **Step 6: Run the suite and watch it pass**

Run: `bun test scripts/behaviour-compliance.test.mjs`
Expected: PASS, including the four pre-existing map/pattern agreement tests.

- [ ] **Step 7: Prove the pattern may stand unbound**

Run: `bun run check:behaviour`
Expected: green. `check-behaviour.mjs` has no orphan-pattern rule — verified against the source when
this plan was written, and this step is what re-verifies it. **If it fails**, the pattern cannot land
before its binder and Tasks 1 and 4 must be merged; record that in the ledger and stop.

- [ ] **Step 8: Commit**

```bash
git add behaviour/patterns/disclosure.json scripts/lib/behaviour-compliance.mjs scripts/behaviour-compliance.test.mjs
git commit -q -F - <<'MSG'
feat(behaviour): the disclosure pattern, and the two maps that make it judgeable

APG's Disclosure (Show/Hide), the twenty-first pattern in behaviour/patterns/ and
the first covering a button that reveals a region. It introduces no new
requirement key: `roles.expanded` and `roles.controls` were already in
ATTRIBUTE_FOR and `keyboard.Enter`/`keyboard.Space` already in BEHAVIOURAL, so
what it needed was an ELEMENT_ROLE entry (a disclosure's element is a button) and
a LABEL_ACCEPTS_TEXT entry (its name is its own text content). Both are asserted
against the real pattern file by scripts/behaviour-compliance.test.mjs, in both
directions, so neither map can drift from it.

It says in its own description what it is NOT: a stack of nested disclosures is
not a treeview, and every binding that names this pattern inherits that -- no
aria-level, no arrow keys, no set-size information.
MSG
git log -1 --format=%B
```

---

## Task 2: the compound migration — `SideNavItem`, and `SideNav` rebuilt around children

**Files:** create `api/components/SideNavItem.json`,
`frameworks/react/components/navigation/side-nav-inject.js`, and the
`SideNavItem` quartet; delete `api/types/side-nav-item.json`; modify `api/components/SideNav.json`,
the `SideNav` quartet, both call sites and `frameworks/react/test/side-nav.test.jsx`; add three of
the four new `behaviour-delegated.json` entries' first member.
**`check:api` +1/+1 → 47/67.**

**Interfaces produced** — later tasks consume these exact names:

```js
// frameworks/react/components/navigation/side-nav-inject.js
export function injectInto(children, injected): React.ReactNode[]
export function indentFor(indentStep: number, depth: number): string
// the injected bag, identical at every level:
//   { depth: number, activeId: string | undefined,
//     indentStep: number, onActivate: ((id: string) => void) | undefined }
```

> **This is the batch's breaking change and it is the whole batch in one commit.** `items` cannot
> leave without the call sites moving in the same change, so this task is larger than its neighbours
> on purpose: constraint 13 forbids a red tree between commits. What it deliberately does **not**
> include is `indentStep` — there is no nesting yet, so a depth multiplier would be a member with
> nothing to multiply. It arrives in Task 3, where the first `depth + 1` does.

- [ ] **Step 1: `git status --short`** — expected empty.

- [ ] **Step 2: Write the failing tests.** Rewrite `frameworks/react/test/side-nav.test.jsx` around
  children. Twelve tests exist today and every one passes `items`; the rewrite keeps their subjects
  and changes their call. The new fixture:

```jsx
import { SideNav } from '../components/navigation/SideNav.jsx';
import { SideNavItem } from '../components/navigation/SideNavItem.jsx';

/* An ARRAY, deliberately, and not a fragment. `React.Children.toArray` flattens
   nested arrays and does NOT flatten a fragment -- it returns the fragment as one
   child -- so a fixture written as <>…</> would hand injectInto a single element
   that is not an item, and every assertion below would fail for a reason that has
   nothing to do with the component. See injectInto's own comment: this is a real
   limit of the idiom, not a quirk of the test. */
const TREE = [
  <SideNavItem key="dashboard" id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />,
  <SideNavItem key="settings" id="settings" label="Settings" />,
];
```

Keep, with the call rewritten: *an item with href is an anchor, one without is a button*; *the
active item carries `aria-current="page"` and nothing else does*; *the nav is labelled*; *active and
inactive items differ in weight and colour*; *an icon is a class name Arena draws*; *`ariaLabel` is
required and its absence throws*; *an empty `ariaLabel` throws too*; *the item text re-densifies*.
Both `SideNav` R4 tests stay exactly as they are — they pass no `items`.

Three tests change meaning and must be **rewritten, not adapted**:

```jsx
/* `nav` used to carry the whole SideNavItem. Under the compound shape there is
   no item datum to carry -- the consumer wrote the element and already holds
   everything on it -- so it carries the activated item's `id`, a string. The
   Breadcrumbs resolution that put the item alone in the payload is unchanged and
   simply has nothing left to apply to. */
test('onNav carries the activated id alone, and no DOM event reaches the handler', () => {
  const seen = [];
  const tree = SideNav({ children: TREE, ariaLabel: 'Primary', onNav: (...args) => seen.push(args) });
  // The <nav>'s children are the cloned items; each item element must be invoked
  // to read the onClick its own render puts on the <a>/<button>.
  const [anchor, button] = tree.props.children.map((el) => SideNavItem(el.props));
  const event = { preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false };

  anchor.props.onClick(event);
  assert.equal(seen[0].length, 1, 'a second argument reached the handler -- the DOM event is back');
  assert.equal(seen[0][0], 'dashboard', 'the payload is not the activated id');

  button.props.onClick(event);
  assert.equal(seen[1][0], 'settings');
});

test('the anchor keeps its native navigation: nothing in the click path suppresses it', () => {
  const tree = SideNav({ children: TREE, ariaLabel: 'Primary', onNav: () => {} });
  const anchor = SideNavItem(tree.props.children[0].props);
  assert.equal(anchor.props.href, '/projects', 'the anchor lost its href and stopped being a link');
  const event = { preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false };
  anchor.props.onClick(event);
  assert.equal(event.defaultPrevented, false,
    'something called preventDefault -- ctrl-click and open-in-new-tab are what that costs');
});

/* `items` is gone, so its absence-only guard is gone with it. What replaces it is
   NOT a guard: a SideNav with no children renders an empty landmark, which was
   always the legal reading of an empty array. The test that asserted `items` is
   required is deleted, and this one keeps the behaviour it protected. */
test('a SideNav with no children renders an empty landmark rather than throwing', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary" />);
  assert.match(html, /<nav[^>]*aria-label="Primary"/);
  assert.doesNotMatch(html, /<a|<button/);
});
```

Then add `SideNavItem`'s own tests, in the same file:

```jsx
test('SideNavItem: `id` is required and a blank one throws too', () => {
  assert.throws(() => renderToStaticMarkup(<SideNavItem label="Home" />), /SideNavItem: `id` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="" label="Home" />), /SideNavItem: `id` is required/);
});

test('SideNavItem: `label` is required and a blank one throws too', () => {
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="home" />), /SideNavItem: `label` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="home" label="" />), /SideNavItem: `label` is required/);
});

/* R4, per component and asserted in two separate bodies -- node:assert aborts on
   the first failure, so one body asserting both escapes cannot say which came back. */
test('SideNavItem drops a consumer style object', () => {
  const html = renderToStaticMarkup(<SideNavItem id="a" label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNavItem drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<SideNavItem id="a" label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `bun test frameworks/react/test/side-nav.test.jsx`
Expected: FAIL — `Cannot find module '../components/navigation/SideNavItem.jsx'`.

- [ ] **Step 4: Write `side-nav-inject.js`**

```js
import React from 'react';

/** Clone each child element, handing it where it sits and the values the whole
 *  tree shares.
 *
 *  DIRECT CHILDREN ONLY, one hop. A section or a collapsible re-injects into its
 *  own children with `depth + 1`, and that is what makes nesting arbitrary
 *  without a React context: every level does the same single hop. It is the
 *  Table/TableRow and RadioGroup/Radio idiom repeated, and it carries their limit
 *  rather than escaping it: Arena can only clone elements it is handed, so a
 *  consumer's own wrapper component sitting between two levels breaks the chain --
 *  and so does a FRAGMENT, because `React.Children.toArray` flattens a nested
 *  array and does not flatten a <>...</>. Write items as siblings or in an array,
 *  never wrapped. `toArray` gives every child a key, so cloning never warns, and
 *  drops null/undefined/booleans, so a conditionally-rendered item is absent
 *  rather than counted.
 *
 *  None of what this injects is a member of any contract, exactly as `Radio.json`
 *  declares none of the name/checked/onSelect `RadioGroup` gives it.
 *
 *  @param {React.ReactNode} children
 *  @param {{depth: number, activeId?: string, indentStep: number,
 *           onActivate?: (id: string) => void}} injected
 *  @returns {React.ReactNode[]} */
export function injectInto(children, injected) {
  return React.Children.toArray(children).map((child) => (
    React.isValidElement(child) ? React.cloneElement(child, injected) : child
  ));
}

/** The inline-start padding of a row sitting at `depth`, as a calc() over --sp-1.
 *
 *  A MULTIPLIER, NEVER A LENGTH. A caller-supplied "1.5rem" is neither a token nor
 *  a derivation of one, so it would stop re-densifying inside `.arena-compact` --
 *  and no gate would catch it, because check:dimensions scans source and not the
 *  values a caller passes in. Multiplying a token keeps the whole chain intact.
 *
 *  Depth 0 returns the base padding unchanged rather than `+ 0`, so the common
 *  case emits no arithmetic at all.
 *
 *  @param {number} indentStep @param {number} depth @returns {string} */
export function indentFor(indentStep, depth) {
  const steps = indentStep * depth;
  return steps === 0
    ? 'calc(var(--sp-1) * 3)'
    : `calc(var(--sp-1) * 3 + var(--sp-1) * ${steps})`;
}
```

- [ ] **Step 5: Write `SideNavItem.jsx`**

```jsx
import React from 'react';
import { indentFor } from './side-nav-inject.js';

/** One destination in a SideNav. `href` decides which element it renders, so it
 *  is the field to read first: present => an <a>, absent => a <button>.
 *
 *  Everything about WHERE the item sits -- its nesting depth, which id is active,
 *  the indent step, the handler that reports `nav` -- is injected by SideNav (or
 *  by the section or collapsible it sits inside) and is deliberately absent from
 *  this component's contract, exactly as RadioProps omits what RadioGroup gives
 *  each Radio. */
export function SideNavItem({
  id, label, icon, href,
  depth = 0, activeId, indentStep = 3, onActivate,
}) {
  /* Both guards are falsy rather than absence-only, and that is the operator
   * decision plan 8C4's close-out review paid for: `label` is this link's whole
   * accessible name and `id` is what `active` matches, so a present-but-blank
   * value IS the defect and `== null` would let it through. `SideNav.items`'
   * `== null` guard was the opposite case -- an empty array is a caller saying
   * "no destinations right now" -- and it left with the member. */
  if (!id) throw new Error('SideNavItem: `id` is required');
  if (!label) throw new Error('SideNavItem: `label` is required');
  const on = id === activeId;
  /* One style object for both elements: an anchor and a button must be
   * indistinguishable here, and two copies of this would drift. The padding is
   * split into block/inline rather than the old shorthand because the inline
   * start is where the indent lands. */
  const shared = {
    'aria-current': on ? 'page' : undefined,
    onClick: () => onActivate && onActivate(id),
    style: {
      display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
      paddingBlock: 'calc(var(--sp-1) * 2.5)',
      paddingInlineEnd: 'calc(var(--sp-1) * 3)',
      paddingInlineStart: indentFor(indentStep, depth),
      borderRadius: 'var(--r-sm)',
      background: on ? 'var(--crimson-soft)' : 'transparent',
      color: on ? 'var(--crimson)' : 'var(--mute)',
      border: 'none', cursor: 'pointer', textAlign: 'left', textDecoration: 'none',
      fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)',
      fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)',
    },
  };
  /* Arena draws the glyph and the consumer names it -- the single-icon
   * convention, unchanged by this migration. */
  const glyph = icon
    ? <i className={icon} aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', display: 'inline-flex' }} />
    : null;
  return href
    ? <a href={href} {...shared}>{glyph}{label}</a>
    : <button type="button" {...shared}>{glyph}{label}</button>;
}
```

- [ ] **Step 6: Rewrite `SideNav.jsx`**

```jsx
import React from 'react';
import { injectInto } from './side-nav-inject.js';

/** The sidebar's navigation list -- the list alone, not the frame around it.
 *  See the Non-goals in the source spec for why there is no AppShell.
 *
 *  A COMPOUND component. The consumer writes one <SideNavItem> per destination,
 *  optionally grouped by <SideNavSection> and <SideNavCollapsible>; SideNav walks
 *  its direct children and injects where each sits, which id is active and the
 *  handler that reports `nav`. None of what it injects is a member of any
 *  contract -- the Table/TableRow shape, one size down. */
export function SideNav({ children, active, ariaLabel, onNav }) {
  /* Falsy, not absence-only: `ariaLabel=""` renders <nav aria-label="">, a
   * landmark with NO accessible name -- exactly the defect the guard exists to
   * prevent, arriving through a value that is present. An accessible name is
   * guarded rather than defaulted because the constant default was itself the
   * defect: the navigation pattern asks each landmark on a page for a UNIQUE
   * name, two sidebars sharing one are indistinguishable, and nothing can derive
   * what a nav is for. */
  if (!ariaLabel) throw new Error('SideNav: `ariaLabel` is required');
  return (
    <nav aria-label={ariaLabel}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      {injectInto(children, { depth: 0, activeId: active, indentStep: 3, onActivate: onNav })}
    </nav>
  );
}
```

- [ ] **Step 7: Run the suite and watch it pass**

Run: `bun test frameworks/react/test/side-nav.test.jsx`
Expected: PASS.

- [ ] **Step 8: The contracts.** Delete `api/types/side-nav-item.json`. Create
  `api/components/SideNavItem.json`:

```json
{
  "component": "SideNavItem",
  "description": "One destination in a SideNav. The consumer writes one per destination; SideNav injects the nesting depth it sits at, which id is currently active and the handler that reports `nav`, and none of those injected props is a member of this contract -- the same shape, and the same reason, as RadioGroup injecting name/checked/onSelect into each Radio. It used to be api/types/side-nav-item.json, a predefined object Arena read out of an array; it is an element the consumer writes now, which is what makes a section, a collapsible and arbitrary nesting expressible at all.",
  "api": {
    "id": { "form": "primitive", "type": "string", "required": true,
            "description": "Identifies the destination. SideNav.active names one of these, and the item whose id matches is the one marked aria-current=\"page\". Required, and guarded with a falsy check rather than an absence check: a blank id can never match and is an omission wearing a value." },
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "What the item reads, and its whole accessible name. Required and falsy-guarded for the same reason." },
    "icon": { "form": "primitive", "type": "string",
              "description": "A Phosphor class name drawn before the label -- Arena draws the <i>, the consumer names the glyph." },
    "href": { "form": "primitive", "type": "string",
              "description": "Present => the item renders an <a>; absent => a <button>. A control that navigates must be a link -- openable in a new tab, address copyable, announced as a link. An item that only changes local state is a button." }
  }
}
```

Rewrite `api/components/SideNav.json`'s `api` block — `items` out, `content` in, `nav`'s payload
becomes `string`:

```json
    "active": { "form": "primitive", "type": "string",
                "description": "The id of the current destination. The SideNavItem whose id matches is marked aria-current=\"page\", and no item is marked when it names none of them." },
    "ariaLabel": { "form": "primitive", "type": "string", "required": true,
                   "description": "Names this navigation landmark. Required, and guarded at runtime rather than defaulted: the navigation pattern asks each landmark on a page for a UNIQUE name, and a constant default satisfies the existence half while two sidebars on one page stay indistinguishable. Nothing can derive it either; what a nav is FOR is editorial. Say what it navigates -- \"Primary\", \"Project settings\" -- the Table.label and SegmentedControl.ariaLabel shape." },
    "content": { "form": "slot",
                 "description": "The navigation tree. One SideNavItem per destination, optionally grouped by SideNavSection and SideNavCollapsible; SideNav injects where each child sits, which id is active and the handler that reports `nav`." },
    "nav": { "form": "event", "payload": "string",
             "description": "An item was activated, carrying its id. It carried the whole SideNavItem for one batch, on the Breadcrumbs precedent that the platform event leaves the payload and the item alone travels; under the compound shape there is no item datum left to carry, because the consumer wrote the element and already holds everything on it. The native MouseEvent is still not forwarded, so a listener cannot call preventDefault() on the anchor's own navigation -- ctrl-click, middle-click and open-in-new-tab keep working for a consumer who wires nothing, and intercepting a plain click to substitute SPA routing belongs at the router." }
```

- [ ] **Step 9: The `.d.ts` pair.** `SideNavItem.d.ts`:

```ts
/** One destination in a `SideNav`. Write one per destination.
 *
 *  Everything about WHERE the item sits — its nesting depth, which id is active,
 *  the indent step and the handler that reports `nav` — is injected by `SideNav`
 *  and is deliberately absent from this interface, exactly as `RadioProps` omits
 *  the `name`/`checked`/`onSelect` `RadioGroup` injects. */
export interface SideNavItemProps {
  /** Identifies the destination. `SideNav.active` names one of these. Required,
   *  and guarded at runtime against a blank value as well as an absent one. */
  id: string;
  /** What the item reads, and its whole accessible name. Required and guarded. */
  label: string;
  /** A Phosphor class name drawn before the label — Arena draws the `<i>`, the
   *  consumer names the glyph. */
  icon?: string;
  /** Present ⇒ an `<a>`; absent ⇒ a `<button>`. A control that navigates must be
   *  a link — openable in a new tab, address copyable, announced as a link. */
  href?: string;
}

export function SideNavItem(props: SideNavItemProps): JSX.Element;
```

`SideNav.d.ts` loses its `import type { SideNavItem }` **and its re-export** — constraint 9's one
deliberate exception, because the name is a component in this directory now. Gains
`children?: React.ReactNode` (the `content` slot), and `onNav?: (id: string) => void`.

- [ ] **Step 10: Bindings, in both places.** `SideNavItem.behaviour.json`:

```json
{
  "pattern": "none",
  "reason": "An item renders an <a> when it has href and a <button> when it does not, so no single interactive pattern always applies to it. Binding `button` with an exception -- what Tag does -- would leave a reader of the binding alone believing the pattern always holds, which is the false half of an honest problem. The schema still cannot say \"this pattern applies only when href is absent\"; that limit is recorded in CLAUDE.md's Known debt and this is the fourth component to meet it. What the element it does render carries -- a link's or a button's implicit role, its native keyboard, aria-current on the active one -- comes from the platform and from SideNav's own `navigation` binding, neither of which this binding weakens.",
  "exceptions": []
}
```

And a `SideNavItem` entry in `frameworks/angular/behaviour-delegated.json`, modelled on the
`TableCell` entry's shape (`pattern`, `delegatedTo`, `dressedBy`, `reason`, `exceptions`):
`mat-nav-list`'s `<a mat-list-item>` / `<button mat-list-item>` is what provides it, dressed by
`frameworks/angular/theme/arena-material.css`, and the reason says that React's `SideNav` became
compound to express sections and nested groups, and that Material's list item is the same
anchor-or-button leaf.

- [ ] **Step 11: Regenerate and run the API gate**

```bash
bun run build:api
bun run check:api
```

Expected: `check-api: 47 contract(s) hold across 67 layer implementation(s)`.
Confirm `SideNavItem` no longer appears as an `export interface` in either `api.generated` file.

- [ ] **Step 12: The two call sites.** In `Shell.jsx`, the module-level `NAV` array becomes elements
  inside the `<SideNav>`, and `onNav` takes the id directly:

```jsx
<SideNav ariaLabel="Primary" active={active} onNav={(id) => onNav?.(id)}>
  <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="#projects" />
  <SideNavItem id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments" href="#deploys" />
  <SideNavItem id="activity" icon="ph-bold ph-pulse" label="Activity" href="#activity" />
  <SideNavItem id="settings" icon="ph-bold ph-gear-six" label="Settings" href="#settings" />
</SideNav>
```

The `NAV` const and the comment above it go with it. The four entries are `#hash` anchors, so the
browser's own navigation moves the fragment and does not reload; the console keeps working.
`navigation.card.entry.jsx` moves the same way, keeping its three items and its wrapper `<div>`.

- [ ] **Step 13: `SideNav.prompt.md` and `SideNavItem.prompt.md`.** The existing prompt's example,
  its prose and two of its Do/Don't lines all describe `items` and must be **rewritten, not appended
  to**. Keep the three Don'ts that are still true (`preventDefault`, tabs-versus-nav, don't wrap it
  in your own `<nav>`) and correct the first: `onNav` now receives an **id**. `SideNavItem.prompt.md`
  is new, follows README's H10 Do/Don't rule, and says plainly that an item cannot carry a
  consumer's own markup — the single-icon convention's stated price, unchanged.

  **Both prompts must carry the fragment limit as a Don't**, because it is the one way a correct-
  looking call site silently renders nothing: *"Don't wrap items in a fragment. Arena injects into
  the children it is handed, and `React.Children.toArray` does not see through a `<>…</>` — write
  them as siblings, or in an array. A wrapper component of your own has the same effect, and it is
  the same limit `Table` and `RadioGroup` already carry."*

- [ ] **Step 14: The R4 proof, induced asymmetrically.** For `SideNavItem` only (the two `SideNav`
  proofs already exist and are untouched):

```bash
sha256sum frameworks/react/components/navigation/SideNavItem.jsx > /tmp/8c5-item.sha
# 1. add `style` to the destructuring and spread it onto `shared.style`; run the suite:
bun test frameworks/react/test/side-nav.test.jsx
#    expect EXACTLY ONE failure: "SideNavItem drops a consumer style object". Restore.
# 2. add `...rest` to the destructuring and spread it onto the returned element; run again:
#    expect EXACTLY ONE failure: "SideNavItem drops a consumer attribute". Restore.
sha256sum -c /tmp/8c5-item.sha   # must print OK
```

**Each escape must fail alone.** If inducing one fails both tests, the two bodies are not
independent and the tests are wrong, not the component.

- [ ] **Step 15: Build and gate**

```bash
bun run build:demos
bun run check:demos
bun run check:dimensions
bun run check:behaviour
bun run check:api
bun test frameworks/react/test/
```

`check:dimensions` is the one to read carefully: `indentFor()` returns a template literal whose only
literals sit inside a `calc()` over `--sp-1`, which is a permitted shape. **If it flags anything,
fix the expression — do not add an `EXEMPT` entry** (constraints 6 and 14).

- [ ] **Step 16: `check:cards`.** The demo card grew. Run with a browser available:

```bash
export CHROME_PATH=/usr/bin/chromium   # or wherever findChromium() finds one
bun run check:cards
```

If `navigation.card.html` over-runs its declared `viewport="700x640"`, **measure by running the
gate** and raise the declared height until it fits. Declaring it by arithmetic does not work; it was
tried and the page clipped in both axes anyway.

- [ ] **Step 17: Commit** (here-doc; the message names `items`, `SideNavItem` and `cloneElement`, so
  it contains backticks). State in it: the contract broken one batch after it shipped, with no
  release between them; the re-export deleted as constraint 9's one exception; `nav`'s payload
  reversed from the whole item to its id, and **why that is not a reversal of the `Breadcrumbs`
  reasoning** — the object it referred to stopped existing.

---

## Task 3: `SideNavSection`, and the indent that needs it

**Files:** create `api/components/SideNavSection.json` and the `SideNavSection` quartet, plus
`frameworks/react/test/side-nav-structure.test.jsx`; modify `api/components/SideNav.json`
(`indentStep`), `SideNav.jsx`, `SideNav.d.ts`, `SideNav.prompt.md`,
`frameworks/angular/behaviour-delegated.json`.
**`check:api` +1/+1 → 48/68.**

**Interfaces consumed:** `injectInto`, `indentFor` from Task 2.
**Interfaces produced:** `SideNavSection`, which re-injects `{ depth: depth + 1, … }` — the hop
Task 4's collapsible copies.

- [ ] **Step 1: `git status --short`** — expected empty.

- [ ] **Step 2: Write the failing tests**, in the new
  `frameworks/react/test/side-nav-structure.test.jsx`:

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SideNav } from '../components/navigation/SideNav.jsx';
import { SideNavItem } from '../components/navigation/SideNavItem.jsx';
import { SideNavSection } from '../components/navigation/SideNavSection.jsx';

const section = (extra = {}) => (
  <SideNav ariaLabel="Primary" active="prod" {...extra}>
    <SideNavItem id="home" label="Home" href="#home" />
    <SideNavSection label="Workspace">
      <SideNavItem id="prod" label="Production" href="#prod" />
    </SideNavSection>
  </SideNav>
);

test('a section is a labelled group, named by the heading a sighted user reads', () => {
  const html = renderToStaticMarkup(section());
  const group = html.match(/<div role="group" aria-labelledby="([^"]+)"/);
  assert.ok(group, 'no role="group" with an aria-labelledby');
  assert.match(html, new RegExp(`id="${group[1]}"[^>]*>Workspace<`),
    'aria-labelledby names no element, or names one that does not read the label');
});

test('a section indents its children by one step and leaves a root item alone', () => {
  const html = renderToStaticMarkup(section());
  // depth 0 emits the base padding with no arithmetic at all
  assert.match(html, /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3\)/);
  // depth 1 at the default indentStep of 3
  assert.match(html, /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3 \+ var\(--sp-1\) \* 3\)/);
});

test('indentStep multiplies the token, and the caller can only supply a multiplier', () => {
  const html = renderToStaticMarkup(section({ indentStep: 5 }));
  assert.match(html, /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3 \+ var\(--sp-1\) \* 5\)/);
});

test('a section with no children throws -- a childless section is not a legal shape', () => {
  assert.throws(
    () => renderToStaticMarkup(<SideNav ariaLabel="Primary"><SideNavSection label="Empty" /></SideNav>),
    /SideNavSection: a section with no children is not a legal shape/,
  );
});

test('SideNavSection: `label` is required and a blank one throws too', () => {
  const one = <SideNavItem id="a" label="A" />;
  assert.throws(() => renderToStaticMarkup(<SideNavSection>{one}</SideNavSection>),
    /SideNavSection: `label` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavSection label="">{one}</SideNavSection>),
    /SideNavSection: `label` is required/);
});

test('SideNavSection drops a consumer style object', () => {
  const html = renderToStaticMarkup(
    <SideNavSection label="W" style={{ color: '#ff00ff' }}><SideNavItem id="a" label="A" /></SideNavSection>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNavSection drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <SideNavSection label="W" data-stray="x"><SideNavItem id="a" label="A" /></SideNavSection>);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `bun test frameworks/react/test/side-nav-structure.test.jsx`
Expected: FAIL — `Cannot find module '../components/navigation/SideNavSection.jsx'`.

- [ ] **Step 4: Write `SideNavSection.jsx`**

```jsx
import React, { useId } from 'react';
import { injectInto, indentFor } from './side-nav-inject.js';

/** A named group of navigation items. It WRAPS -- it never replaces what a
 *  consumer wrote -- and its accessible name is the same heading a sighted user
 *  reads, so the grouping the eye sees is the grouping a screen reader announces.
 *
 *  A SECTION ALWAYS HAS CHILDREN, and that is a guard rather than a convention.
 *  Allowing a childless one would give the component two shapes that a single
 *  behaviour binding cannot describe -- the fifth instance of the "true in one
 *  variant, false in the other" limit Tag, Skeleton, Table and Pagination already
 *  carry, and which has no fix. What IS optional is having sections at all: loose
 *  items at the root are legal and may sit beside them.
 *
 *  useId rather than a derived id: the section declares no `id` member, and this
 *  wiring is internal -- nothing outside needs to address the heading. That is the
 *  Dialog/ConfirmDialog precedent (never Math.random(), which differs between the
 *  server pass and the client one). SideNavCollapsible does the opposite for the
 *  opposite reason; see its own comment. */
export function SideNavSection({
  label, children,
  depth = 0, activeId, indentStep = 3, onActivate,
}) {
  if (!label) throw new Error('SideNavSection: `label` is required');
  if (React.Children.count(children) === 0) {
    throw new Error('SideNavSection: a section with no children is not a legal shape');
  }
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <div id={labelId} style={{
        paddingInlineStart: indentFor(indentStep, depth),
        paddingBlock: 'calc(var(--sp-1) * 1.5)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)',
        letterSpacing: 'var(--ls-badge)', textTransform: 'uppercase',
        color: 'var(--mute)',
      }}>{label}</div>
      {injectInto(children, { depth: depth + 1, activeId, indentStep, onActivate })}
    </div>
  );
}
```

- [ ] **Step 5: Thread `indentStep` through `SideNav`.** Its signature becomes
  `({ children, active, ariaLabel, indentStep = 3, onNav })` and it injects that value rather than
  the literal `3`. **`3` is the default in exactly one place after this** — the parameter — and the
  `= 3` fallbacks in the children are for a child rendered outside a `SideNav`, which is the same
  shape `TableRow` carries.

- [ ] **Step 6: Run the suites and watch them pass**

Run: `bun test frameworks/react/test/side-nav-structure.test.jsx frameworks/react/test/side-nav.test.jsx`
Expected: PASS, both files.

- [ ] **Step 7: The contract.** `api/components/SideNavSection.json`:

```json
{
  "component": "SideNavSection",
  "description": "A named group of navigation items inside a SideNav. It wraps what the consumer wrote and never replaces it; its accessible name is the same heading a sighted user reads. A section always has children -- a childless one is guarded against at runtime, because two shapes would be one more thing a single behaviour binding cannot describe. Having sections at all is optional: loose SideNavItems at the root are legal and may sit beside them.",
  "api": {
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "Names the group, both on screen and to assistive technology. Required, and guarded with a falsy check: a blank label leaves the group with no accessible name, which is the defect the guard exists to prevent arriving through a value that is present." },
    "content": { "form": "slot",
                 "description": "The items in the group -- SideNavItems, further SideNavSections, SideNavCollapsibles. Each is re-injected one nesting level deeper than the section itself." }
  }
}
```

Add `indentStep` to `api/components/SideNav.json`:

```json
    "indentStep": { "form": "primitive", "type": "number", "default": 3,
                    "description": "How far each nesting level indents, as a MULTIPLIER of --sp-1 rather than a length: the row at depth N is padded calc(var(--sp-1) * 3 + var(--sp-1) * indentStep * N). A CSS string was rejected -- a caller-supplied \"1.5rem\" is neither a token nor a derivation of one, so it would stop re-densifying inside .arena-compact, and no gate would catch it because check:dimensions scans source and not the values a caller passes in." }
```

- [ ] **Step 8: `.d.ts`, `.prompt.md`, bindings.** `SideNavSection.d.ts` declares `label: string` and
  `children?: React.ReactNode`, with the injected props deliberately absent and a comment saying so.
  `SideNav.d.ts` gains `indentStep?: number`. `SideNavSection.behaviour.json` binds `none` with a
  reason: it renders a labelled `role="group"` wrapper and carries no interactive affordance of its
  own — every control inside it is a child component's. A `SideNavSection` entry goes into
  `behaviour-delegated.json`; Material's counterpart is `mat-nav-list`'s own
  `<div mat-subheader>` grouping, and the entry says so with the same honesty the `TableCell` entry
  uses.

- [ ] **Step 9: Regenerate, gate, R4 proof**

```bash
bun run build:api && bun run check:api      # 48 contract(s) ... 68 layer implementation(s)
bun run check:behaviour
bun run check:dimensions
bun test frameworks/react/test/
```

Then the two-escape induction of Step 14 in Task 2, for `SideNavSection.jsx`, with its own
`sha256sum` before and `sha256sum -c` after. Each escape must fail exactly one test.

- [ ] **Step 10: Commit** (here-doc).

---

## Task 4: `SideNavCollapsible` — the first `disclosure`, nested to any depth

**Files:** create `api/components/SideNavCollapsible.json`, the `SideNavCollapsible` quartet and
`frameworks/react/test-dom/side-nav-disclosure.test.jsx`; modify
`frameworks/react/test/side-nav-structure.test.jsx`, `scripts/check-compliance.mjs` (`COVERED`),
`frameworks/angular/behaviour-delegated.json`, `SideNav.prompt.md`, and
`navigation.card.entry.jsx`.
**`check:api` +1/+1 → 49/69. `check:compliance` 7 of 66 → 8 of 66.**

**Interfaces consumed:** `injectInto`, `indentFor`, `SideNavItem` (by identity, see Step 4), and
`behaviour/patterns/disclosure.json` from Task 1.

> **Four design decisions this task makes, each with a reason a reviewer can reject.**
>
> **(a) The region is always rendered and toggled with `hidden`, never conditionally mounted.**
> `aria-controls` must name an element that exists; pointing it at nothing while collapsed is an ARIA
> defect, and `roles.controls` would be un-meetable half the time. The cost is stated in (b).
>
> **(b) `hidden` needs help from the inline style, and this is the trap.** `[hidden]` is
> `display: none` from the UA stylesheet, and an **inline** `display: flex` beats it — so a region
> carrying both would stay visible while claiming to be hidden. The region's `display` is therefore
> driven by the same state as `hidden`: `display: expanded ? 'flex' : 'none'`. Both are set; neither
> alone is enough (`hidden` alone loses the flex column, `display:none` alone leaves the element in
> the a11y tree for some engines).
>
> **(c) The region's id is derived from the required `id` member, not from `useId()`.** The opposite
> of what `SideNavSection` does one task earlier, and the reason is `api/README.md`'s own rule about
> when `id` is a member: a component that generates an id takes the only path to addressing that
> element out of the consumer's hands. A `useId()` value is unaddressable from outside, so a required
> `id` gives strictly more than an optional one — the region is `${id}-region`, the trigger is
> `${id}-trigger`, and both are reachable from a consumer's `aria-describedby` or a test hook.
>
> **(d) Auto-expand seeds the initial state AND runs as an effect.** Seeding alone would never reopen
> the group on a later route change; an effect alone would render the active item **hidden** in a
> server pass, because effects do not run under `renderToStaticMarkup`. Both together open it on
> first paint and on every later transition into holding the active id, and leave the user free to
> collapse it again afterwards. `toggle` fires on the **button press only** — the auto-expand is
> Arena's decision, not the user's, and reporting it as one would be a lie the consumer acts on.

- [ ] **Step 1: `git status --short`** — expected empty.

- [ ] **Step 2: Write the failing DOM-free tests**, appended to
  `frameworks/react/test/side-nav-structure.test.jsx`:

```jsx
import { SideNavCollapsible } from '../components/navigation/SideNavCollapsible.jsx';

const nested = (props = {}) => (
  <SideNav ariaLabel="Primary" {...props}>
    <SideNavSection label="Workspace">
      <SideNavCollapsible id="deploys" label="Deployments" icon="ph-bold ph-rocket-launch">
        <SideNavItem id="prod" label="Production" href="#prod" />
      </SideNavCollapsible>
    </SideNavSection>
  </SideNav>
);

test('the trigger is a native button wired to the region it controls', () => {
  const html = renderToStaticMarkup(nested());
  assert.match(html, /<button [^>]*type="button"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="deploys-region"/);
  assert.match(html, /id="deploys-region"/);
  assert.match(html, /id="deploys-trigger"/);
});

/* The region exists while collapsed -- see decision (a). And `hidden` alone is
   not enough, because an inline display:flex would beat it -- decision (b). */
test('a collapsed region is rendered, hidden, and not merely display:none', () => {
  const html = renderToStaticMarkup(nested());
  assert.match(html, /id="deploys-region"[^>]*hidden/);
  assert.match(html, /id="deploys-region"[^>]*display:\s*none/);
});

test('defaultExpanded opens it on the first pass', () => {
  const html = renderToStaticMarkup(
    <SideNav ariaLabel="Primary">
      <SideNavCollapsible id="d" label="D" defaultExpanded>
        <SideNavItem id="p" label="P" href="#p" />
      </SideNavCollapsible>
    </SideNav>);
  assert.match(html, /aria-expanded="true"/);
  assert.doesNotMatch(html, /id="d-region"[^>]*hidden/);
});

/* Decision (d), the half a DOM suite cannot reach: an active id inside the
   subtree must open the group in the SERVER pass, or the active destination is
   missing from the markup a crawler and a no-JS reader see. */
test('a subtree holding the active id renders expanded with no effect having run', () => {
  const html = renderToStaticMarkup(nested({ active: 'prod' }));
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /aria-current="page"/);
});

test('nesting compounds the indent: an item inside a section inside a collapsible sits at depth 2', () => {
  const html = renderToStaticMarkup(nested({ active: 'prod' }));
  assert.match(html, /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3 \+ var\(--sp-1\) \* 6\)/);
});

test('SideNavCollapsible: `id` and `label` are required, blank included', () => {
  const kid = <SideNavItem id="a" label="A" />;
  assert.throws(() => renderToStaticMarkup(<SideNavCollapsible label="D">{kid}</SideNavCollapsible>),
    /SideNavCollapsible: `id` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavCollapsible id="" label="D">{kid}</SideNavCollapsible>),
    /SideNavCollapsible: `id` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavCollapsible id="d">{kid}</SideNavCollapsible>),
    /SideNavCollapsible: `label` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavCollapsible id="d" label="">{kid}</SideNavCollapsible>),
    /SideNavCollapsible: `label` is required/);
});

test('SideNavCollapsible drops a consumer style object', () => {
  const html = renderToStaticMarkup(
    <SideNavCollapsible id="d" label="D" style={{ color: '#ff00ff' }}>
      <SideNavItem id="a" label="A" /></SideNavCollapsible>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNavCollapsible drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <SideNavCollapsible id="d" label="D" data-stray="x">
      <SideNavItem id="a" label="A" /></SideNavCollapsible>);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `bun test frameworks/react/test/side-nav-structure.test.jsx`
Expected: FAIL — `Cannot find module '../components/navigation/SideNavCollapsible.jsx'`.

- [ ] **Step 4: Write `SideNavCollapsible.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import { injectInto, indentFor } from './side-nav-inject.js';
import { SideNavItem } from './SideNavItem.jsx';

/** Whether `id` names a SideNavItem anywhere in this subtree.
 *
 *  Matched by element TYPE and not by `props.id` alone: a collapsible carries an
 *  id of its own, and a consumer who names a group after a destination has not
 *  said the group IS that destination. Importing SideNavItem for the comparison
 *  makes no cycle -- SideNavItem imports only the shared helpers.
 *
 *  Exported so its own test can exercise it without a render.
 *  @param {React.ReactNode} children @param {string} [id] */
export function subtreeHasItem(children, id) {
  if (!id) return false;
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement(child)) continue;
    if (child.type === SideNavItem && child.props.id === id) return true;
    if (subtreeHasItem(child.props.children, id)) return true;
  }
  return false;
}

/** A named group that shows and hides its own contents. Binds the `disclosure`
 *  pattern: a real <button> carrying aria-expanded, with aria-controls naming the
 *  region it toggles.
 *
 *  IT IS NOT A TREEVIEW, and the binding says so. With arbitrary nesting the
 *  structure resembles one, and APG's treeview would demand aria-level on every
 *  node, a roving tab stop and four-direction arrow navigation. None of that is
 *  designed here: each collapsible is an independent disclosure, which is what
 *  production sidebars ship and what a nav landmark full of links actually is. */
export function SideNavCollapsible({
  id, label, icon, defaultExpanded = false, children, onToggle,
  depth = 0, activeId, indentStep = 3, onActivate,
}) {
  if (!id) throw new Error('SideNavCollapsible: `id` is required');
  if (!label) throw new Error('SideNavCollapsible: `label` is required');

  const holdsActive = subtreeHasItem(children, activeId);
  /* Seeded AND effected, and both halves are load-bearing. Seeding alone never
   * reopens the group when the route moves into it; an effect alone renders the
   * active destination HIDDEN in a server pass, because effects do not run under
   * renderToStaticMarkup. Together they open it on first paint and on every later
   * transition into holding the active id -- and leave the user free to collapse
   * it again, which a derived `expanded || holdsActive` would not. */
  const [expanded, setExpanded] = useState(defaultExpanded || holdsActive);
  useEffect(() => { if (holdsActive) setExpanded(true); }, [holdsActive]);

  /* Derived from the required `id` rather than from useId(): a useId value cannot
   * be addressed from outside, and api/README.md's rule about when `id` is a
   * member is precisely that a component generating one takes the consumer's only
   * path to that element away. SideNavSection has no such need and uses useId. */
  const regionId = `${id}-region`;
  const triggerId = `${id}-trigger`;

  /* `toggle` reports the BUTTON PRESS only. The auto-expand above is Arena's
   * decision, not the user's, and reporting it as one would be a lie a consumer
   * persists. */
  const press = () => {
    const next = !expanded;
    setExpanded(next);
    if (onToggle) onToggle(next);
  };

  const glyph = icon
    ? <i className={icon} aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', display: 'inline-flex' }} />
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <button id={triggerId} type="button" aria-expanded={expanded} aria-controls={regionId}
        onClick={press}
        style={{
          display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
          paddingBlock: 'calc(var(--sp-1) * 2.5)',
          paddingInlineEnd: 'calc(var(--sp-1) * 3)',
          paddingInlineStart: indentFor(indentStep, depth),
          borderRadius: 'var(--r-sm)', background: 'transparent', color: 'var(--mute)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', fontWeight: 'var(--fw-medium)',
        }}>
        {glyph}
        <span style={{ flex: 1 }}>{label}</span>
        <i className={expanded ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'}
          aria-hidden="true" style={{ fontSize: 'var(--icon-md)', display: 'inline-flex' }} />
      </button>
      {/* `hidden` AND display, never one of them -- an inline display:flex beats
          [hidden]'s UA display:none, and hidden alone would lose the column. */}
      <div id={regionId} role="group" aria-labelledby={triggerId} hidden={!expanded}
        style={{ display: expanded ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--sp-1)' }}>
        {injectInto(children, { depth: depth + 1, activeId, indentStep, onActivate })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the DOM-free suite and watch it pass**

Run: `bun test frameworks/react/test/`
Expected: PASS, all three side-nav files.

- [ ] **Step 6: Write the DOM suite**, `frameworks/react/test-dom/side-nav-disclosure.test.jsx`.
  It carries the header explaining what happy-dom can and cannot prove here, and it does four things
  the DOM-free suite cannot:

```jsx
/* The DOM half of SideNav's proof, and it is here rather than in
 * frameworks/react/test/ because every assertion below needs a real click to have
 * happened and a real attribute to have changed as a result.
 *
 * What this suite may and may not claim, because happy-dom bounds it:
 *   - a dispatched `click` on a real element runs React's handler: PROVABLE, and
 *     everything below rests on it.
 *   - a `keydown` of Enter or Space on a native <button> does NOT synthesise a
 *     click in happy-dom -- that is the browser's own activation behaviour, which
 *     we neither implement nor can observe here. So `keyboard.Enter` and
 *     `keyboard.Space` are NOT asserted by dispatching keys. They are established
 *     the only honest way available: the trigger is a native <button type=button>
 *     with no onKeyDown of ours intercepting, and clicking it toggles the region.
 *     A native button's Enter and Space route to click through the platform; that
 *     is the same implicit-semantics principle ELEMENT_ROLE encodes for roles, and
 *     the reason the rejected text scan reported 60 of 118 true claims as unmet.
 *   - `document.activeElement` after a Tab keypress: NEVER asserted. happy-dom has
 *     no sequential focus navigation, so such a test passes identically against a
 *     correct implementation and none. Focus structure is asserted as `tagName`
 *     and `tabindex` instead.
 */
```

Its tests:

1. **clicking the trigger expands it** — `aria-expanded` flips `false` → `true`, the region loses
   `hidden`, and its inline `display` becomes `flex`;
2. **clicking again collapses it**, and `onToggle` received exactly `[false]` the second time and
   `[true]` the first — one call per press, the payload a boolean;
3. **the auto-expand is not reported through `toggle`** — mount with `active` inside the subtree and
   assert `onToggle` was never called while `aria-expanded` is `true`;
4. **a route change into a collapsed subtree opens it** — rerender with a new `active` and assert the
   region opened, with `onToggle` still never called;
5. **the user may collapse a group holding the active item** — click after the auto-expand and assert
   it closed, which is the property a derived `expanded || holdsActive` would silently lose;
6. **a nested collapsible opens independently of its parent** — two levels, open the outer, assert
   the inner is still collapsed, open the inner, assert both open;
7. **the injected `aria-current` lands on the item at depth 2**, and on exactly one element;
8. **an R4 escape after expansion** — pass `data-stray` and `style` to a collapsible that is
   *collapsed at mount*, then expand it and assert neither reached any element in the revealed
   region. **This is the one R4 assertion an SSR-only suite could not be trusted with**: today the
   region is rendered while collapsed, so `renderToStaticMarkup` does see it — but that is a property
   of decision (a), not of the component's contract, and the day someone conditionally mounts the
   region the SSR suite goes blind without a single test failing. This one does not;
9. **a collapsed region's links are out of the tab order, and an expanded one's are in it** — the
   spec asks this suite for focus behaviour, and this is the part of it happy-dom can honestly
   answer. Assert **structurally**, per constraint 15: query the region's `<a>` elements and check
   they are inside an element carrying `hidden` while collapsed and not while expanded, and that
   none of them carries a `tabindex` of its own in either state. **Do not** dispatch a Tab and read
   `document.activeElement` — happy-dom has no sequential focus navigation, so that assertion would
   pass identically against a correct implementation and none. The half this cannot reach — that Tab
   really does skip the hidden region in a browser — is Task 7 Step 3's checklist item;
10. **the compliance assertion**:

```jsx
import { join } from 'node:path';
import test from 'node:test';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
// mount() RETURNS THE CONTAINER; cleanup() is a separate export that unmounts
// everything mount() created. Call it from an afterEach, never destructure it.
import { mount, cleanup, act } from './harness.jsx';

test('SideNavCollapsible meets the disclosure pattern it binds', () => {
  const root = mount(
    <SideNavCollapsible id="deploys" label="Deployments">
      <SideNavItem id="prod" label="Production" href="#prod" />
    </SideNavCollapsible>,
  );
  const trigger = root.querySelector('button');
  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation', 'SideNavCollapsible.behaviour.json'),
    // Every requirement of this pattern is about the button: roles.element,
    // roles.label, roles.expanded and roles.controls all live on it, and the two
    // keyboard keys are declared behavioural below.
    subjects: { default: trigger },
    behavioural: { 'keyboard.Enter': true, 'keyboard.Space': true },
  });
});
```

**Every verdict in `behavioural` must have a real assertion behind it** — the two above are
established by test 1 plus an explicit `assert.equal(trigger.tagName, 'BUTTON')` and
`assert.equal(trigger.getAttribute('type'), 'button')` in the same test body. A declared verdict with
no assertion pins a claim the suite does not check, which is the exact failure the layer exists to
remove.

- [ ] **Step 7: Run the DOM suite and watch it pass**

Run: `bun run test:react-dom`
Expected: PASS. **Never `bun test frameworks/react/test-dom`** — constraint 12.

- [ ] **Step 8: The contract.** `api/components/SideNavCollapsible.json`:

```json
{
  "component": "SideNavCollapsible",
  "description": "A named group inside a SideNav that shows and hides its own contents. It may contain items, sections and further collapsibles to any depth; the indent compounds with depth, which is why SideNav.indentStep is a step rather than a total. It binds the `disclosure` pattern and deliberately does NOT claim to be a treeview: there is no aria-level, no roving tab stop and no arrow navigation, because each collapsible is an independent disclosure. Its expanded state lives in the component, seeded by defaultExpanded, and it additionally opens itself when the subtree it holds contains SideNav.active -- implicit behaviour, stated here and in its .prompt.md rather than left to be discovered.",
  "api": {
    "id": { "form": "primitive", "type": "string", "required": true,
            "description": "Identifies the group. Arena derives the trigger's and the region's DOM ids from it, so a consumer can address either from outside -- an aria-describedby, a deep link, a test hook. Required and falsy-guarded; a generated id would take that path away, which is the same reasoning api/README.md gives for why `id` is a member at all." },
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "What the trigger reads, and the accessible name of both the trigger and the region it controls. Required and falsy-guarded." },
    "icon": { "form": "primitive", "type": "string",
              "description": "A Phosphor class name drawn before the label. The caret that reports expanded-ness is Arena's own and is not this member." },
    "defaultExpanded": { "form": "primitive", "type": "boolean", "default": false,
                         "description": "Whether the group starts open. It is a seed, not a control: after the first render the state is the component's, and the group also opens itself when it comes to hold the active destination." },
    "content": { "form": "slot",
                 "description": "What the group holds -- items, sections, further collapsibles. Each is re-injected one nesting level deeper." },
    "toggle": { "form": "event", "payload": "boolean",
                "description": "The trigger was pressed, carrying the state it moved to. It fires on a press ONLY: the automatic expansion that follows the active destination is Arena's decision rather than the user's, and reporting it here would be a lie a consumer persists." }
  }
}
```

- [ ] **Step 9: `.d.ts`, `.prompt.md`, bindings, `COVERED`.**
  `SideNavCollapsible.behaviour.json` binds `disclosure` with `"exceptions": []` — the component
  meets all six requirements, and Step 6's suite is the proof standing above the claim
  (constraint 7). Its file also carries the treeview refusal in a `reason`-shaped note, so a reader
  of the binding alone learns what is not claimed.
  `SideNavCollapsible.prompt.md` **must say plainly** that the group opens itself around the active
  destination — the spec names that as the only mitigation for implicit behaviour.
  A `SideNavCollapsible` entry goes into `behaviour-delegated.json`: Angular Material has
  `MatExpansionPanel`, and the entry says whether that is what a consumer reaches for and what
  `arena-material.css` does or does not dress. **Do not invent a claim about Material here** — read
  `frameworks/angular/theme/arena-material.css` and describe what is really in it, the way the
  `TableCell` entry does.
  `scripts/check-compliance.mjs`'s `COVERED` gains one line:

```js
  'SideNavCollapsible:react': 'side-nav-disclosure.test.jsx',
```

- [ ] **Step 10: Enrich the demo.** `navigation.card.entry.jsx`'s SideNav block gains a section and a
  nested collapsible, so the card shows the shape this batch exists for. Then
  `bun run build:demos`, `bun run check:demos`, and `check:cards` with a browser — the card grows
  again and its declared height is measured, not calculated.

- [ ] **Step 11: Regenerate and gate**

```bash
bun run build:api && bun run check:api      # 49 contract(s) ... 69 layer implementation(s)
bun run check:behaviour
bun run check:compliance                    # 8 of 66
bun run check:dimensions
bun test frameworks/react/test/
bun run test:react-dom
```

- [ ] **Step 12: R4 proof** for `SideNavCollapsible.jsx`, both escapes, each failing alone, `sha256`
  identical after restore. **Induce the `{...rest}` one on the region element specifically**, not
  only on the root — that is what test 8 above exists to catch, and inducing it on the root would
  leave test 8 green and prove nothing about it.

- [ ] **Step 13: Commit** (here-doc). Name in it: the first `disclosure` binding, the four design
  decisions from this task's header, and that `check:compliance` moved to 8 of 66.

---

## Task 5: the Tailwind manifest, brought fully up to date, and the divergence entry that said so

**Files:** modify `frameworks/tailwind/components/SideNav.manifest.json`, `SideNav.card.html`, and
`components-divergences.md`; regenerate `SideNav.manifest.ts`.

> **This is a debt payment, not a slot addition.** `components-divergences.md` records that the
> manifest **owes an `icon` slot** and that the gap **is a defect to fix rather than a divergence to
> record**. It owes more than that now: a manifest's contract is to mirror the React component, and
> the component has grown a section group, a section heading, a disclosure trigger, a caret and a
> region. Bring it to the whole component, not to the icon alone.

- [ ] **Step 1: `git status --short`** — expected empty.

- [ ] **Step 2: Read the component before writing a class.** Every slot below must correspond to an
  element one of the four `.jsx` files actually renders, with the same token behind each utility.
  There is **no gate comparing a manifest to its component** — `check:tailwind` proves every class
  resolves, and nothing proves the manifest still matches. So the mirroring is done by reading, and
  the reading is this step.

- [ ] **Step 3: Grow the manifest.** Keep `root`, `item` and the `active` variant as they are; add:

  - `icon` — the glyph Arena draws before a label, at `--icon-lg` (the size `SideNavItem.jsx` sets);
  - `section` — the `role="group"` wrapper's column;
  - `sectionLabel` — the mono uppercase micro-label, mirroring
    `font-mono` / `text-ctl-2xs`-family / tracking / `text-base-content/62`;
  - `trigger` — the disclosure button, geometrically the same row as `item` and coloured like an
    inactive one;
  - `caret` — the expanded/collapsed chevron at `--icon-md`;
  - `region` — the controlled region's column.

  **No `hover:` or `focus:`-family modifier anywhere in it.** `SideNav.jsx` and its three new
  siblings implement no hover and no focus state, and `check:states` fails a manifest asserting one
  its mirrored component does not implement. That gate exists because this exact shape shipped twice
  on one branch.

  **The indent is the one thing the manifest cannot mirror, and that is recorded rather than faked.**
  `calc(var(--sp-1) * 3 + var(--sp-1) * N)` is computed per row from `indentStep × depth`, and a
  static utility cannot carry a runtime multiplier. No slot claims it, and Step 6's rewritten
  divergence entry says so in one sentence.

- [ ] **Step 4: Grow the specimen.** `SideNav.card.html` renders from the manifest through
  `classesFor()`, which is what keeps a specimen structurally honest — a literal typed into one is
  styling the manifest does not carry. Add a third section to the page showing a group with a
  heading and a collapsible in both states, built from the new slots. Then re-measure:

```bash
export CHROME_PATH=/usr/bin/chromium
bun run check:cards
```

and raise `viewport="420x373"` to whatever the gate says fits. **Measure by running it.**

- [ ] **Step 5: Regenerate and gate**

```bash
bun run build:tailwind
bun run check:tailwind            # every class emits a rule, every theme key resolves to a token
bun run check:tailwind-generated  # the committed .manifest.ts matches the .json
bun run check:coverage            # no token left reaching nothing, no stale EXCLUDED entry
bun run check:arbitrary
bun run check:radius
bun run check:states              # must stay silent -- see Step 3
```

`check:coverage` is in the list for a reason the spec names: a new utility may expose a token that
was previously in `EXCLUDED` with a reason saying it reached nothing. **If a token leaves
`EXCLUDED`, delete its entry in the same commit** — a stale exclusion fails the gate itself.

- [ ] **Step 6: Rewrite the divergence entry whole.** `components-divergences.md`'s
  *"SideNav is described three times, and only the colours agree"* has three claims that this batch
  makes false and one it makes truer:

  - **False:** *"`SideNav.jsx` renders a `<nav>` with direct `<a>`/`<button>` children"* — it renders
    a compound tree now.
  - **False:** *"The manifest declares two slots, `root` and `item`, and describes no icon at all"*.
  - **False, and this is the one to be careful with:** *"The manifest's gap IS a defect … and it owes
    an `icon` slot."* It is paid. Do not soften it into "it owed"; **state what was owed, that this
    batch paid it, and what the manifest deliberately still does not carry** (the runtime indent).
  - **Truer:** the Angular half. `mat-nav-list` provides a flat list of links; it does not provide a
    named section group or a nested disclosure. Say so — and see Appendix B, because that is a Plan D
    question this batch registers and does not answer.

  **Keep the section's heading text**, or redirect its citation in the same change:
  `frameworks/angular/behaviour-delegated.json`'s `SideNav` entry cites *"components-divergences.md's
  SideNav entry"* by name. Constraint: a change deleting a cited section must redirect the citation
  in the same change.

- [ ] **Step 7: Commit** (here-doc).

---

## Task 6: the citation sweep, and the references this batch made false

**Files:** whatever Steps 1–3 find. Possibly none.

- [ ] **Step 1: `git status --short`** — expected empty.

- [ ] **Step 2: Citations of `components-divergences.md`.** Task 5 rewrote a section; this confirms
  nothing pointing at it broke.

```bash
grep -rn "components-divergences" --include='*.json' --include='*.ts' --include='*.md' --include='*.jsx' . | grep -v node_modules
```

Keep only the hits that quote a section **by name** — those are the ones a deletion or a rename
breaks. A citation naming the file alone survives any edit to it. **Measure the citing set; do not
trust a list written anywhere**, including in `CLAUDE.md` and `api/README.md`, both of which have
been wrong about it in both directions.

- [ ] **Step 3: Dead references to everything this batch removed or reshaped.** Sweep for each, and
  read every hit rather than counting them:

```bash
grep -rn "SideNavItem\|SideNav.items\|side-nav-item" --include='*.md' --include='*.json' --include='*.ts' --include='*.jsx' --include='*.js' . | grep -v node_modules
grep -rn "onNav" --include='*.md' --include='*.jsx' --include='*.ts' . | grep -v node_modules
```

Subjects: `items` as a member; `SideNavItem` as a **type** rather than a component; `nav` carrying
the whole item; the deleted re-export; `README.md:419`'s `SideNav` paragraph and its component
inventory at `README.md:373`, which now lists three more navigation components.

**A hit in a contracted component or in `README.md` is this task's to fix. A hit in `CHANGELOG.md` or
`CLAUDE.md` is Task 7's — record it in the ledger, do not fix it here** (constraint 11).

- [ ] **Step 4: Commit only if something changed.** Otherwise record "no change" in the ledger and
  say so in the report.

---

## Task 7: Close-out

**Files:** modify the spec, `CHANGELOG.md`, `CLAUDE.md`, the three new `.prompt.md` files; delete the
executed 8C4 plan and this batch's own spec.

- [ ] **Step 1: `git status --short`** — expected empty. Then the full sweep, **once**:

```bash
cd /home/juan/Dravensoft/Identity
export CHROME_PATH=/usr/bin/chromium
bun run check
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun run test:react-dom 2>&1 | tail -3
```

Expected: every gate PASS, no `SKIP` and no `INCOMPLETE`. Reconcile both test counts against the
ledger's per-task deltas: they must add up, and a discrepancy is a finding rather than a rounding
error. **Run it again at the very end if any step after this one changes code** — 8C3's and 8C4's
close-outs both found their own later fixes postdating the sweep, and a close-out claiming a green
tree has to claim it of the final one.

- [ ] **Step 2: Whole-branch review.** Read `git diff main...HEAD` against these questions, and fix
  each finding in its own commit:

  - Does the ladder reconcile 46 → 47 → 48 → 49, one contract and one layer per step?
  - Is every member `description` consistent across contract / `.d.ts` / `.prompt.md`? Nothing holds
    the three in step, and `api/README.md` records that as a known limit — this review is the only
    thing that catches a drift.
  - Are `style` and `{...rest}` gone from all four components **in the `.jsx`**, not only in the
    `.d.ts`? `check:api` reads the declaration and never opens the implementation, so a restored
    spread leaves it green. The four R4 test pairs are what would catch it; confirm each pair exists.
  - Does every guard use the operator constraint 8 prescribes, and is each one's reason written at
    the guard?
  - Do all four components take their indent from `indentFor()` rather than from a second copy of the
    expression? `check:duplicate-constants` will not catch this — it fires only on module-level named
    numeric consts in **both layers**, and this is one layer.
  - Does `SideNavCollapsible`'s `behavioural` map have a real assertion behind each verdict?
  - Did any suite weaken a title or an assertion message while being rewritten in Task 2?

- [ ] **Step 3: Verify in real Chromium what no suite can see, and write the checklist.** Reuse the
  repo's own harness rather than building one:

```js
import { findChromium, launchChromium } from './scripts/lib/chromium.mjs';
import { startStaticServer } from './scripts/lib/static-server.mjs';
// findChromium() returns { path }, NOT a string -- destructure it.
```

Two gotchas that have already cost time and are carried forward:
  - **A raw `rawKeyDown` does not activate a button.** Enter needs a `keyDown` with `text: '\r'`.
  - **Several specimen cards mount with their overlay already OPEN** (`useState(true)`), so a probe
    testing an opening transition must close it first.

Drive `frameworks/react/components/navigation/navigation.card.html` and the Delivery Console, and
confirm the two things this plan's suites genuinely cannot:
  1. **a nested collapsible opens and closes under a real Enter and a real Space**, at depth 2, with
     the caret and `aria-expanded` agreeing;
  2. **focus does not escape the bar** — Tab from the last item inside an expanded region reaches the
     next control in the sidebar and not something behind it, and Tab into a **collapsed** region
     skips it entirely rather than landing on a hidden link.

Write both into `SideNavCollapsible.prompt.md` as a *"Verifying the disclosure by hand"* section,
modelled on `CalendarEvent.prompt.md`'s. **A rule that says "checked by hand" and produces no written
checklist is a rule that says "not checked".**

- [ ] **Step 4: The spec.** Add the 8C5 running-count row (both test processes) and a register
  paragraph: 46/66 → 49/69, `check:compliance` 7 → 8, the `disclosure` pattern added as the
  twenty-first, and the one thing this batch registers without resolving — Appendix B.

- [ ] **Step 5: `CHANGELOG.md`, under `## [Unreleased]` only.** Read what is there first; it already
  carries plans B through 8C4, so this completes a record rather than starting one. **Do not rewrite
  any released section** — a release is frozen the moment it is cut, because the plugin is served
  from the tag. Verify by hunk position that every line landed above the first versioned heading.

  Breaking changes to spell out, and this is the batch's whole surface:
  - **`SideNav.items` is gone and `SideNav` is a compound component.** Every call site breaks.
  - **`SideNavItem` is a component, not a type**, and `SideNav.d.ts`'s re-export of it is deleted —
    the first deliberate exception to the re-export rule 8C1–8C4 carried, because the name is a
    component in that directory now.
  - **`SideNav.nav` carries a `string` id** where one batch ago it carried the whole `SideNavItem`.
    Say plainly that a contract shipped in `7640db2` is broken here with no release between them, and
    why: the object the earlier payload referred to stopped existing.
  - **New:** `SideNavSection`, `SideNavCollapsible`, `SideNav.indentStep`.

- [ ] **Step 6: `CLAUDE.md`.** Additions and retirements, each verified before it is written:

  - **Architecture:** the compound-injection idiom now reaches a third family, and this one is
    *recursive* — a section and a collapsible re-inject with `depth + 1`, which is what makes nesting
    arbitrary without a context, and it carries the same broken-chain limit as `Table` and
    `RadioGroup`. And `behaviour/patterns/` is no longer twenty files; **do not write the new count as
    prose if a count would drift** — the file's own rule about derived figures has been broken twice
    by the paragraphs recording it.
  - **Retire:** the `components-divergences.md` claim that the SideNav manifest owes an `icon` slot,
    **only after confirming Task 5 landed it.**
  - **New debt, and there are three:**
    1. **`SideNavCollapsible` is a stack of independent disclosures and deliberately not a treeview.**
       No `aria-level`, no arrow navigation, no set-size information. What that costs a screen-reader
       user in a deeply nested sidebar is real and is recorded rather than discovered.
    2. **`SideNavItem` binds `none` with a prose reason**, because the binding schema still cannot
       say *"this pattern applies only when `href` is absent"* — the same unresolved question `Tag`,
       `Skeleton`, `Table` and `Pagination` already carry, at the pattern level rather than the
       requirement level. **Count the `none` bindings rather than writing an ordinal**
       (`grep -rl '"pattern": "none"' frameworks/ | wc -l`): this batch adds two of them in one
       change, and every prose count in this file that was written as an ordinal has gone stale.
    3. **Appendix B's Plan D question**, verbatim.
  - **Check, do not assume:** whether the recorded debt about `check:api` not comparing a primitive
    member's `type` needs `indentStep` added as a live example. `indentStep` is declared `number` in
    both the contract and the `.d.ts`, and nothing would notice if one said `string`.

- [ ] **Step 7: Delete what has been executed**

```bash
git rm docs/superpowers/plans/2026-07-25-8c4-dialog-modal-and-the-last-four-contracts.md
git rm docs/superpowers/specs/2026-07-25-8c5-sidenav-sections-and-collapsibles-design.md
```

**Read each for debt living only there before deleting it** — that is the failure `CLAUDE.md`'s Known
debt preamble names, and it has happened once already. This plan itself is deleted by the *next*
batch's close-out, not by this one.

- [ ] **Step 8: Commit** (here-doc), append the batch summary to `.superpowers/sdd/progress.md`, and
  report. **Do not merge and do not push** — both are the maintainer's call.

---

## Appendix A: what this plan deliberately does not do

- **It does not build an Angular implementation.** All three new contracts are single-layer, like
  every Plan C subject, because Angular delegates `SideNav` to `mat-nav-list`.
- **It does not make `SideNav` a treeview**, and the `disclosure` pattern's own description says so
  rather than leaving a reader to infer it.
- **It does not add keyboard navigation between items** beyond what the browser gives a list of links
  and buttons. There is no roving tab stop and no arrow handling anywhere in this batch.
- **It does not add a browser-driven gate.** The Chromium work in Task 7 is a probe and a written
  checklist, the same arrangement the grid rule uses and the same one
  `dialog-modal.test.jsx`'s header refuses a fourth non-portable gate for.
- **It does not fix `Tabs`**, which still excepts all eight requirements of the `tabs` pattern and
  remains the largest untouched accessibility gap in the tree.
- **It does not make `Tooltip` keyboard-reachable.**
- **It does not touch `Menu`, `Pagination` or `Dialog`.**
- **It does not cut a release.** Everything lands under `## [Unreleased]`.

---

## Appendix B: what this plan registers and does not resolve

**`frameworks/angular/behaviour-delegated.json`'s `SideNav` entry claims Angular Material provides
this control, and that claim gets weaker in this batch.** Its `reason` says *"`mat-nav-list` already
provides the anchor-or-button distinction, the active state and the keyboard behaviour"* — defensible
for a flat list of links, and questionable for named section groups and nested disclosure groups,
which `mat-nav-list` does not provide at all. Nothing in this plan resolves it: this batch adds no
Angular component and changes no delegated claim beyond adding the three new entries constraint 16
requires.

It is registered here, in `CLAUDE.md`'s Known debt by Task 7 Step 6, and in the rewritten divergence
entry by Task 5 Step 6, **so Plan D does not inherit it silently.** The two ways it could be resolved
— an `arena-side-nav` primitive that stops delegating, or a narrowed delegated claim that admits
Material covers the flat case only — are Plan D's decision to make, not this batch's to pre-empt.

Two adjacent facts a Plan D reader should have with it: none of the delegated file's claims about
Material records the version it was verified against (`@angular/material` 22.0.5 at the time), and
`check:behaviour` never re-checks a claim about a third-party library — so these reasons can quietly
become false while the whole suite stays green.
