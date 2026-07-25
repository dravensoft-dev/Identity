# Plan 8C3 — 8C2's four debts, Calendar and Table keyboard navigation, and seven contracts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pay the four Known debt entries plan 8C2 recorded, give `Calendar` and `Table` the keyboard
navigation their `grid` bindings have excepted since the behaviour layer was built, teach the reader
the **per-item renderer convention** (which removes two members rather than modelling them), and
bring seven more components under the API capability contract —
`check:api` from **32 contracts / 52 layer implementations to 39 / 59**.

**Architecture:** Three phases that must run in order, because each unblocks the next. **Phase A**
(Tasks 2–5) pays the debts; three of the four are small and one — proving at runtime that the six
form controls' events actually fire — needs a new DOM suite. **Phase B** (Task 6) is the batch's
structural event, the way `consumerData` was 8C1's and `functionInput` was 8C2's — teaching the
reader that an inbound function returning a **node** is a parameterised slot, which it has thrown on
by name since 8C2. **It is not.** Measuring `api/README.md` during Task 2 showed the document
already REMOVES such members, by an older convention, in a passage contradicting the one that
implied R3 support was coming. Phase B shrank to settling that contradiction, both renderers are
removed instead of modelled, and this plan's structural task is the thing it deleted. **Phase C** (Tasks
7–13) migrates the seven, with `Calendar` and `Table` each taking two tasks — keyboard navigation
first, then the contract — so the contract task works on settled markup.

**Tech Stack:** Bun (build, test, gates), plain-node-portable `scripts/`, React 18 with inline
token-valued styles and no CSS classes. Angular 22 is untouched except regenerated output and one
reader fix that Plan D consumes.

**Spec:** `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` — *Plan C*. **Normative
vocabulary:** `api/README.md` (nine forms; this plan adds no tenth, and — after the correction made
during Task 2 — teaches the reader no new shape either).

**Branch:** `api-contracts-8c3`, cut from `main` at `7e922e8` (the 8C2 merge).

> **This plan is large on purpose and its phase boundaries are real split points.** If it needs to
> become three plans, cut after Task 5 and after Task 6; each phase leaves the tree green, every gate
> passing, and `check:api` at a stated pair. Do not cut inside a phase.

---

## What this plan measured

Every figure was measured against `HEAD` (`7e922e8`) on 2026-07-24 while writing this plan. Line
numbers are **not** load-bearing (Constraint 27); the quoted code identifies the site.

### The baseline

- **`check:api` reads `32 contract(s) hold across 52 layer implementation(s)`.**
- **Merged process 1048 tests across 94 files; isolated DOM process 26 across 5.**
- **Plan C's subject set is TWENTY-TWO, not twenty-one.** 43 React components under
  `frameworks/react/components/` (excluding `*.card.entry.jsx`); 20 have a matching directory under
  `frameworks/angular/primitives/`; the remaining 23 are exactly the key set of
  `frameworks/angular/behaviour-delegated.json`; minus `Switch`, contracted before Plan C began. The
  stale *twenty-one* was true when written and went stale **inside 8C2**, which split `Radio.jsx`
  into two quartets and thereby created a new React component and a new delegated entry in one
  change. Corrected in `CLAUDE.md` and the spec on this branch before this plan was written.
- **Eleven of the twenty-two remain uncontracted:** `Calendar`, `Table`, `Dialog`, `ProgressBar`,
  `Toast`, `Tooltip`, `Menu`, `Pagination`, `SegmentedControl`, `SideNav`, `Tabs`. This plan takes
  **seven**; `Dialog`, `Menu`, `Pagination` and `SideNav` are C4's.

### The seven subjects, probed through `reactSurface()`

Five read cleanly today. Two throw, **for different reasons, and that difference sets the order**:

| Component | `reactSurface()` | R4 escapes |
|---|---|---|
| `Tabs` | reads; `tabs` is a **union** `string \| TabItem` (R5) | `style` |
| `SegmentedControl` | reads; `options` is a **union** `string \| SegmentOption` (R5) | `style` **and `{...rest}`** |
| `ProgressBar` | reads; `label` is a slot | `style` |
| `Toast` | reads; `action` is `named: ToastAction` | `style` |
| `Tooltip` | reads; `content` and `children` both required slots | `style` |
| `Calendar` | **THROWS** on `renderEvent` | `style` |
| `Table` | **THROWS** on `TableColumn<T>`, never reaching `render` | `style` |

- **No component in this batch has a heritage clause.** `grep -n 'extends' ` across all seven `.d.ts`
  returns nothing. Unlike 8C1 and 8C2 there is **no D1 flatten to do here** — the only R4 escapes are
  the seven `style` members and `SegmentedControl`'s lone `{...rest}`.
- **`Calendar` throws with the message Task 1b wrote for exactly this moment:**
  `a function returning a node is a parameterised slot (R3), not a functionInput, and the reader does
  not model that shape yet: (event: CalendarEvent) => React.ReactNode`.
- **`Table` throws earlier, at the generic:** `unreadable type annotation: TableColumn<T>`. Erasing
  the generic does **not** rescue `render` — probed, it then throws the same R3 message. Table needs
  three fixes in order: erase the generic, then R3, then two members the earlier failures mask.
- **Two members are masked behind Table's generic and only appear once it is gone.**
  `getRowKey?: (row: T, i: number) => React.Key` classifies as `{form:'platform', type:'React.Key'}`
  (an R4 violation the gate can name — the platform-return check fires before parameter count is ever
  examined), and `onRowClick?: (row: T, i: number) => void` throws
  `an event takes one payload, and this declares more than one parameter`.
- **`CatSlot` is a NUMERIC literal union** (`1 | 2 | … | 8`). `classify()`'s enum branch requires
  string literals (`/^'[^']*'$/`), so an inline numeric union reads as `union`, never `enum` — but
  `CatSlot` is a **named** type in the `.d.ts`, so it reads as `{form:'named'}` and resolves against
  `api/types/` normally. `validateTypes` requires only a non-empty `values` array, not strings. A
  numeric enum is therefore legal and has no precedent among the current `api/types/` files.
- **`CalendarEvent.meta` is `Record<string, unknown>`, and consumer data MAY NOT be a field of a
  predefined object.** That is one of the eighth form's two mechanical guards (`api/README.md`;
  `validateTypes` enforces it). `CalendarEvent` cannot carry `meta` as declared — Task 1 decides.

### The precedents that settle three of this batch's design questions

- **`Alert` already solved the object-carrying-a-callback shape.** `Alert.d.ts` has
  `actionLabel?: string; onAction?: () => void;` and `api/components/Alert.json` declares
  `actionLabel` (primitive) + `action` (event). `Toast`'s `ToastAction { label; onClick }` takes the
  same decomposition. **This is not a new decision; it is an existing one applied.**
- **`AlertTone` shows a component gets its OWN tone enum** rather than reusing `Tone` when its value
  set differs. `Tone` is `neutral accent gold success warning danger info`; `AlertTone` is
  `info success warning danger neutral`. `ProgressBar`'s and `Toast`'s tone sets differ from both.
- **`ControlSize` already exists** as `sm md lg`. `ProgressBar.size` is exactly that set and reuses
  it. `SegmentedControl.size` is `sm md` — a different set, needing its own enum.

### Call sites

- **No call site anywhere passes a `TabItem` or a `SegmentOption` object.** All three sites pass bare
  string arrays (`navigation.card.entry.jsx` ×2, `ProjectScreen.jsx`). The R5 union's object arm is
  unexercised in the tree, though both `.jsx` files handle it.
- **`ProjectScreen.jsx` is the only call site passing `style`** to any of the seven —
  `style={{ marginBottom: 'calc(var(--sp-1) * 5.5)' }}` on `Tabs`, a real layout dependency. It takes
  the wrapping-`<div>` treatment 8C2's F2 established.
- `Toast`'s `action` is passed as an object at `frameworks/react/ui_kits/console/index.entry.jsx`
  (`action={t.action}`) and as `onClose={()=>{}}` in `feedback.card.entry.jsx`.
- `Table`'s two call sites (`ProjectScreen.jsx`, `table-avatar.card.entry.jsx`) both pass `columns`
  arrays carrying `render` functions, and both pass `getRowKey`.

### Suites and bindings

- **Six of the seven have no React suite at all.** Only `Tooltip` does
  (`frameworks/react/test-dom/tooltip-timer.test.jsx`).
- `Calendar` and `Table` each bind `grid` with **all eight** requirements excepted. `Tabs` binds
  `tabs` with **all eight** excepted — the same total-exception shape, and this plan does **not** fix
  it (Appendix A).
- `SegmentedControl` binds `radiogroup` with **zero** exceptions.
- `COVERED` in `scripts/check-compliance.mjs` holds six entries; `Calendar` and `Table` are in none.

### The four debts, re-measured

1. **`id`.** Neither `Input.jsx` nor `Textarea.jsx` accepts `id` today; both derive it from `label`
   alone. **Correction to the debt entry's framing:** `id` was never a *declared member* of either
   contract — `Input` reached it through its heritage clause and `Textarea` only ever had it as an
   undocumented `.jsx` parameter. Restoring it is **adding a new member**, not reinstating one.
2. **Angular `functionInput`.** Already better than the debt entry says: `angularSurface()` on
   `readonly validate = input<(value: string) => string>()` **already returns**
   `{form:'functionInput', params:{value:'string'}, returns:'string'}`. What fails is the optional
   spelling `input<((value: string) => string) | undefined>()`, and it fails on a **greedy-regex
   mis-parse**, not a rule: `classify()`'s arrow pattern is tested before its union branch, so it
   backtracks and captures the return as `string) | undefined`, giving
   `unreadable type annotation: string)`.
3. **Enum event payload.** `validateContract` sends any non-primitive, non-`consumerData` payload to
   `declared(payload, 'object')`. Verified by probe: `string`/`number`/`boolean`/`consumerData`/a
   declared object are accepted; `LogoSize` is rejected as *"an enum, used where an object belongs"*.
4. **DA unverified at runtime.** `frameworks/react/test/` renders with `renderToStaticMarkup` and has
   no DOM. `frameworks/react/test-dom/` does, and holds `harness.jsx` plus six suites.

---

## Global Constraints

Every task's requirements implicitly include this section. 1–29 are 8C2's, carried forward in
substance because each was earned; 30–36 are new to this plan.

1. **English only.** All code, comments, docs, contract `description`s and UI copy are English.
   Conversation with the maintainer is Spanish; the repo is not.
2. **Task 1 is a single blocking audit and it STOPS.** Tasks 2–13 each open with a per-component
   confirmation that also blocks but must not re-litigate a Task 1 decision.
3. **`check:api` climbs and never drops:** 32/52 → (Tasks 2–6 contract nothing except Task 2's two
   added members, which change no count) → **34/54** (Task 7, +2) → **36/56** (Task 8, +2) →
   **37/57** (Task 9) → **38/58** (Task 11) → **39/59** (Task 11b) → **42/62** (Task 13, +3). Record
   the measured pair in `.superpowers/sdd/progress.md` at the end of every task. Task 11b was added
   during execution and is what moved Task 13's starting figure by one; Task 13 then landed as
   THREE contracts rather than one — `Table`, `TableRow`, `TableCell` — because the maintainer chose
   the compound shape over the capability loss its Step 1 asks them to confirm. See Task 13's
   superseded note.
4. **`check:api` carries no exception map.** An API divergence is a defect.
5. **`api/README.md` is the normative vocabulary, and this plan found it contradicting itself.**
   Task 2 corrected two passages asserting opposite futures for a per-item renderer. Task 6 makes
   the reader's refusal state the surviving rule; it adds no form and teaches no shape.
6. **The other two contracts are firm.** Bringing a component under the API contract may not weaken,
   remove or contradict its behaviour binding or the tokens it renders from. **Tasks 10 and 12 are
   the deliberate exception**: they *strengthen* a binding by retiring exceptions the implementation
   has stopped needing. Verify per task with `git diff --stat -- '*.behaviour.json'` — empty
   everywhere except Tasks 10 and 12, and there only in the retiring direction.
7. **The binding table is mechanical** (`bindingName()` in `scripts/check-api.mjs`): a
   primitive/enum/object/array/functionInput member `x` is a React prop `x`; the slot named `content`
   is React's `children`; a slot named `x` is a node-valued prop `x`; an event named `x` is a
   function prop `onX`.
8. **Required-ness is contracted** for the inbound non-slot forms and governs runtime: a required
   member fails hard when absent. Idiom: `if (!x) throw new Error('C: \`x\` is required');`
   (`frameworks/react/components/feedback/EmptyState.jsx`). Use `== null` for a boolean or a number,
   bare truthiness for a string — both idioms are in the tree; match the neighbouring components.
9. **`react/.d.ts` re-export rule.** A migrated `.d.ts` re-exports **exactly** the named types the
   pre-migration file declared and exported locally — no more, no less. Measured for this batch:
   `Tabs`→`TabItem`, `SegmentedControl`→`SegmentOption`, `Toast`→`ToastAction` (but see Task 8 — it
   is decomposed away, so there is nothing to re-export), `Calendar`→`CatSlot` and `CalendarEvent`,
   `Table`→`TableColumn`. `ProgressBar` and `Tooltip` declare none. Verify each file rather than
   trusting this sentence.
10. **A contract type is imported with `import type`**, specifier `'../../api.generated'` from
    `frameworks/react/components/<group>/`.
11. **Any `.jsx`/`.entry.jsx` edit is followed by `bun run build:demos`, and the regenerated `.js`
    sibling is committed in the same commit.** Verified with `bun run check:demos`. `build:demos`
    covers `frameworks/react/ui_kits/console/`, and the Console uses `Tabs`, `Table` and `Toast`.
12. **`bun run check` runs exactly ONCE**, in Task 15. Individual gates run per task.
13. **Do not merge and do not push.** The branch stays local until the maintainer asks.
14. **`export CHROME_PATH=/usr/bin/chromium` before `bun run check`.** Without it `check:cards` SKIPs
    and the run reports INCOMPLETE, which reads as a failure of the change and is not.
15. **Test the layer you changed.** Six of the seven have no React suite; each migration writes one.
16. **A task that removes an R4 escape ships a test proving the escape is gone, and it must
    DISCRIMINATE.** `check:api` reads the `.d.ts` and never opens the `.jsx`, so a test is the only
    regression guard.
17. **The R4 non-vacuity proof needs TWO SEPARATE RUNS, induced asymmetrically:** (1) `style`
    destructured AND merged into the root style object, no `{...rest}` → the STYLE assertion fails;
    (2) `style` destructured and NOT merged, `{...rest}` spread on the root → the ATTRIBUTE assertion
    fails. `sha256sum` before, byte-identical after. Assert on `color` (not in `check:dimensions`'
    `PROPS` set) and on attribute NAMES, never on a length — that gate walks test directories too.
    **Six of the seven carry no `{...rest}`**, so for those the second run is induced by ADDING one;
    say so in the report rather than skipping the run.
18. **A test title states exactly what the body asserts, and this plan's worked test code is a
    starting point, not a verified artifact.** Run it; if it does not discriminate, fix the test.
19. **`README.md` is the normative design specification and moves in the same change as the
    component.** Find its prose with `grep -n '<Component>' README.md` and report the check either
    way. `Tabs` and `SegmentedControl` have real prose there (the *Navigate vs. filter* paragraph) —
    expect to touch it, unlike 8C1 and 8C2 where nothing moved.
20. **A member `description` lives in the contract only.** Restate it in the `.d.ts` JSDoc and the
    `.prompt.md`; nothing holds the three in step, so leave no layer's prose describing a removed
    member.
21. **A citation sweep uses a broad `--include`**: all of `*.ts *.tsx *.js *.jsx *.json *.md *.html`.
    Read every hit.
22. **Do not write a derived figure into a normative document.** Counts belong in this plan and the
    ledger; `CLAUDE.md` and the spec get the *method of measuring*. This is not decoration — the
    *twenty-one* this plan corrects is what that rule exists to prevent.
23. **Budget the final whole-branch review as real work.** This batch's specific cross-task risk:
    seven components each independently decide how a tone enum is named, whether a size enum is
    shared, and how an option list is shaped.
24. **No Angular component work exists in this plan.** The Angular files that change are the
    generated `api.generated.ts` and, in Task 4, nothing at all — that task changes only
    `scripts/lib/api-surface.mjs`. `check:angular` still runs per task.
25. **A commit message containing a backtick is written with a quoted here-doc, never
    `git commit -m "…"`.** A backtick in a double-quoted shell string opens command substitution and
    is silently spliced away. Use `git commit -q -F - <<'MSG' … MSG`, verify `git log -1 --format=%B`.
    **`git merge` does NOT accept `-F -`** — it cannot read a message from stdin; write the message
    to a file and pass the path. This cost one failed command in 8C2.
26. **A task opens by checking the tree is clean** (`git status --short`) and folds in what it finds
    rather than redoing it, verifying leftovers against the plan's steps first.
27. **Line numbers in this plan are not load-bearing** — the quoted code identifies the site.
28. **An event payload is a VALUE, never a platform event type.** Settled by `Breadcrumbs`, applied
    to six controls by 8C2, and it governs `Table.onRowClick` and `Calendar.onEventClick` here.
29. **`functionInput` is legal ONLY in a contract declaring `"kind": "input"`.** None of this
    batch's seven is a data-entry control, so **none may carry one** — which is exactly why
    `renderEvent` and `render` are REMOVED rather than smuggled through the ninth form (Task 6).
30. **React's SSR does not emit attributes in source order, and camelCases some of them.** Measured
    across 8C2: `checked=""` lands after `style`; `maxLength` and `autoComplete` emit camelCase while
    `readonly`/`disabled`/`required` lowercase. Never assume adjacency in a regex — use `[^>]*` or
    assert each attribute independently, and **probe the real render before writing the regex**.
31. **Tasks 10 and 12 change rendered DOM, so they re-run `check:cards` reasoning by hand.** They may
    not run the full sweep (Constraint 12), but a task adding `role`, `tabIndex` and a focus ring to
    a grid must state in its report whether any demo card's content box could have grown.
32. **A retired exception is deleted, never softened.** Tasks 10 and 12 remove an exception only when
    the rendered DOM satisfies the requirement; a requirement that is *partly* met keeps its
    exception with a reason that says which part. `comparePattern` has no vocabulary for "true in one
    variant", and this plan does not add one (Appendix A).
33. **`Table` has TWO layouts and the `grid` pattern governs one of them.** The wide layout is a real
    `<table>`; below `--bp-md` it is one card per row, which is a list and not a grid. Task 12's
    keyboard work targets the wide layout; the narrow layout keeps an exception naming the variant.
    This is the same "a binding cannot scope an exception to a variant" limit `Skeleton` already
    proves, and Task 12 must not pretend otherwise.
34a. **`frameworks/react/test-dom/` now runs under real browser event semantics, and a suite must
    be run through the preloaded invocation.** This supersedes the original constraint, which told
    Tasks 10 and 12 to plan around React's legacy change detection and said the cause was unknown.
    **The cause was module ordering after all** — settled by instrumenting react-dom's `canUseDOM`
    directly: bun evaluates `react-dom` before a test module's body *and* before an ES module
    imported ahead of it, so `isInputEventSupported` latched false. `bun test --preload
    ./frameworks/react/test-dom/preload.js` installs the DOM early enough; all three invocation
    sites pass it, and `harness.jsx` throws if it is missing. So: a dispatched `input` drives
    `Input`/`Textarea`, `change` drives `Select`, `click()` drives checkbox and radio (React's own
    `shouldUseClickEvent`, true in every browser), `focus()`/`blur()` drives `onBlur`, and
    `keydown` is unaffected as before. A value still must be written through the PROTOTYPE's
    `value` setter — that is React's value tracker, not the harness. The six tests in
    `form-control-events.test.jsx` were rewritten accordingly.

34. **A compliance suite's `behavioural` map is trusted, not re-derived.** `comparePattern` returns
    `null` for requirements no single element can decide (`focus.*`, `keyboard.*`); a suite must name
    each in `behavioural` and prove it by acting on the tree. `assertPattern` throws if one is
    silently skipped. A suite declaring a wrong verdict pins a false claim.
35. **Do not widen a gate outside the task that owns the widening.** Tasks 3 and 6 widen; every other
    task that finds a gate rejecting something it believes correct **STOPS and reports**.
36. **A numeric enum is legal in `api/types/` and has no precedent.** `validateTypes` requires only a
    non-empty `values` array. `CatSlot` would be the first. Task 11 must state, in its commit
    message, that it is establishing the precedent.

---

## The per-item renderer, stated once

**A per-item renderer is not a member, and `Calendar.renderEvent` and `TableColumn.render` are
removed rather than modelled.** This reverses what this plan originally said. The reversal is the
plan's own correction, made during Task 2 and recorded here rather than quietly applied.

`api/README.md` had **two passages asserting opposite futures for the same member**. Beside the
ninth form it said the reader throws on `(item: T) => React.ReactNode` deliberately, because
absorbing a render prop into `functionInput` would *"close a door `Table.render` needs left open"* —
written in plan 8C2, and reading as though R3 support was coming. Further down, older and far better
argued, the per-item convention said a field inside a predefined object is never a node, and that
this convention **already removed `ActivityFeed.renderItem`** — naming `TableColumn.render` as the
same case in the same sentence.

**The convention wins, and its reason is not R3 at all.** `renderItem` did not go because it broke
R3; measured against the source it filled the `<li>` Arena renders, exactly as `TableColumn.render`
fills a `<td>`, so R3 permitted it. It went because **per-item projection has no Angular answer**
short of a structural directive and `ngTemplateOutlet` — a binding no row of the binding table covers
and no reader function reads. That reason applies identically to `renderEvent` and to `render`, and
Plan D would meet it head-on.

**So the task that was going to teach the reader R3 is deleted.** Verified before deleting it: **no
shipped contract declares a parameterised slot** — the only `"params"` anywhere in `api/components/`
is `Input.validate`'s, and that is a `functionInput`. With both would-be consumers removed, a reader
for that shape has none, and this layer refuses speculative machinery on principle (the `debounce`
precedent). The reader's throw stops being *"does not model that shape yet"* and becomes an
**enforcement**: no contract may declare such a member, so refusing every one is correct.

**The cost is the highest this convention has charged, and Task 13 must not discover it.** Measured
in the tree before removal, the three `render` functions drew a `Badge` in a status cell — at both
call sites — and a `Button` in an actions cell. Those are the two commonest things anyone puts in a
table cell, and the Delivery Console uses both. A status column now needs a member Arena draws from,
and **an actions column has no expression in the contract at all**. `renderEvent` costs nothing by
comparison: no call site passes it.

**What still is not checked.** R3 itself — fills rather than replaces — remains an authoring rule
with R2's status. Nothing in this plan changes that, and nothing should read as though it does.

---

## File Structure

Created by this plan:

| Path | Responsibility |
|---|---|
| `frameworks/react/test-dom/form-control-events.test.jsx` | Task 5 — proves the six controls' events fire with values |
| `api/types/tab-item.json` | `TabItem` object — `{value, label}` |
| `api/types/segment-option.json` | `SegmentOption` object — `{value, label}` |
| `api/types/segmented-control-size.json` | `SegmentedControlSize` enum — `sm md` |
| `api/types/progress-tone.json` | `ProgressTone` enum |
| `api/types/toast-tone.json` | `ToastTone` enum |
| `api/types/cat-slot.json` | `CatSlot` enum — the first NUMERIC enum in the directory |
| `api/types/calendar-event.json` | `CalendarEvent` object |
| `api/types/calendar-view.json` | `CalendarView` enum — `week day` |
| `api/types/table-column.json` | `TableColumn` object |
| `api/types/cell-align.json` | `CellAlign` enum — `left center right` |
| `api/types/table-cell-layout.json` | `TableCellLayout` enum — `row block` |
| `api/components/{Tabs,SegmentedControl,ProgressBar,Toast,Tooltip,Calendar,Table}.json` | Tasks 7–13 |
| `frameworks/react/test/{tabs,segmented-control,progress-bar,toast,tooltip,calendar,table}.test.jsx` | render proofs |
| `frameworks/react/test-dom/grid-keyboard.test.jsx` | Tasks 10 and 12 — the shared compliance suite |

Modified structurally: `scripts/lib/api-surface.mjs` (Tasks 4 and 6), `scripts/api-surface.test.mjs`,
`scripts/check-api.mjs` (Tasks 3 and 6), `scripts/check-api.test.mjs`, `scripts/build-api-types.mjs`
and `scripts/build-api-types.test.mjs` (Task 11 Step 2a — the numeric-enum emitter),
`scripts/check-compliance.mjs` (`COVERED`, Tasks 10 and 12), `api/README.md`, `CLAUDE.md`, the spec.

Regenerated: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`, the `.js`
sibling of every `.jsx` touched.

---

## Task 0: Pre-flight

**Files:** archive `.superpowers/sdd/progress.md` → `progress-8c2-archived.md`; create a fresh
`progress.md`. `.superpowers/` is git-ignored — plain `mv`, **no commit**.

- [ ] **Step 1: Archive 8C2's ledger**

```bash
cd /home/juan/Dravensoft/Identity
mv .superpowers/sdd/progress.md .superpowers/sdd/progress-8c2-archived.md
wc -l .superpowers/sdd/progress-8c2-archived.md
test ! -e .superpowers/sdd/progress.md && echo "cleared, ready for the C3 ledger"
```

- [ ] **Step 2: Open the C3 ledger**

Create `.superpowers/sdd/progress.md`:

```markdown
# Plan 8C3 — the four debts, Calendar/Table keyboard navigation, seven contracts

Plan: docs/superpowers/plans/2026-07-24-8c3-debt-paydown-keyboard-navigation-and-seven-contracts.md
Branch: api-contracts-8c3
Base commit: 7e922e8 (main; the 8C2 merge)
(8C2's ledger is archived beside this one as progress-8c2-archived.md.)

Three phases, in order.
  A (Tasks 2-5): pay 8C2's four Known debt entries. check:api unchanged at 32/52.
  B (Task 6):    the per-item renderer convention, made enforceable. Contracts nothing.
                 (It was going to teach the reader R3; measuring api/README.md showed the
                  convention already removes such members, so both renderers go instead.)
  C (Tasks 7-13): seven contracts, 32/52 -> 39/59. Calendar and Table take two tasks each,
                  keyboard navigation first and the contract second.

## Pre-flight

(fill from Step 3)

## Progress

## Maintainer decisions taken
```

- [ ] **Step 3: Measure the baseline and stop**

```bash
cd /home/juan/Dravensoft/Identity
git status --short
git log --oneline -1
bun run check:api
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun test frameworks/react/test-dom 2>&1 | tail -3
```

Expected: clean; `check-api: 32 … across 52`; 1048/94 merged; 26/5 isolated. **If `check:api` is not
32/52, stop and report.** Fill the ledger's Pre-flight. No commit.

---

## Task 1: The cross-cutting blocking audit

**Files:** none — writes only the ledger's `## Maintainer decisions taken`.

**Interfaces:** produces decisions EA–EH that Tasks 2–13 implement without re-opening.

- [ ] **Step 1: Re-measure**

```bash
cd /home/juan/Dravensoft/Identity
cat > /tmp/probe-c3.mjs <<'EOF'
import { readFileSync } from 'node:fs';
import { reactSurface } from '/home/juan/Dravensoft/Identity/scripts/lib/api-surface.mjs';
for (const [p, sym] of [
  ['navigation/Tabs','TabsProps'], ['navigation/SegmentedControl','SegmentedControlProps'],
  ['feedback/ProgressBar','ProgressBarProps'], ['feedback/Toast','ToastProps'],
  ['feedback/Tooltip','TooltipProps'], ['display/Calendar','CalendarProps'],
  ['display/Table','TableProps'],
]) {
  const src = readFileSync(`/home/juan/Dravensoft/Identity/frameworks/react/components/${p}.d.ts`,'utf8');
  try { console.log(sym, JSON.stringify(reactSurface(src, sym))); }
  catch (e) { console.log(sym, 'THREW', e.name + ':', e.message); }
}
EOF
bun /tmp/probe-c3.mjs; rm /tmp/probe-c3.mjs
```

Confirm against *What this plan measured*. Any deviation is the audit's finding.

- [ ] **Step 2: Present EA–EH and STOP**

- **EA — `id` becomes a real contracted member on `Input` and `Textarea`.** It is not a
  reinstatement: `id` was never a declared member of either contract. D1 was right that
  `className`, `dir`, `tabIndex` and ARIA are not members; `id` is different because the component
  **already generates one** to wire its own `htmlFor`, so a host that needs to point an external
  `<label>`, an `aria-describedby` or a form library at the field has no path at all. The generated
  value stays the fallback: `id || (label ? … : undefined)`. Cost: D1's "no global attribute is a
  member" reads as a rule with one exception, and the exception must be stated in `api/README.md`
  rather than left as a special case a reader discovers.
- **EB — the enum event payload is admitted.** `validateContract` resolves a payload as primitive,
  `consumerData`, declared object **or declared enum**. Cost: none measurable — no contract declares
  one today; this is the reader/gate gap Task 2 of 8C2 closed one type-kind short of.
- **EC — the Angular `functionInput` spelling is the BARE arrow, and the reader is fixed to accept
  the optional one too.** `input<(value: string) => string>()` already classifies. Plan D writes that
  spelling; the `| undefined` variant is fixed in `classify()` because a greedy regex, not a rule,
  rejects it. Cost: the fix strips a trailing `| null`/`| undefined` before the arrow test, which
  changes how *every* nullable annotation is read — Task 4 must prove nothing else moved.
- **ED — the six form controls get a DOM suite proving their events fire with values.** DA's whole
  reshape is unverified today. Cost: `frameworks/react/test-dom/` registers a DOM process-wide and is
  a separate `bun test` process; the isolated count moves off 26/5 for the first time since the
  suspension, and the spec's running-count table must say so.
- **EE — SUPERSEDED during Task 2, and the supersession is the plan's own correction.** It read
  *"R3 becomes readable"*, naming `Calendar.renderEvent` and `TableColumn.render` as its two
  consumers. Reading `api/README.md` far enough showed the document already **removed** such members
  by a convention older and better argued than the sentence implying R3 support was coming — two
  passages asserting opposite futures for one member. Both renderers are removed; Task 6 shrinks
  from teaching the reader a shape to making its refusal state the rule. Cost, and it is the highest
  this convention has charged: a status column needs a member Arena draws from, and an actions column
  has no expression in the contract at all. R3's own claim stays unenforced either way.
- **EF — `Toast.action` is decomposed the way `Alert`'s already is.** `ToastAction { label; onClick }`
  becomes `actionLabel` (primitive string) + `action` (event). `ToastAction` leaves the `.d.ts`
  entirely, so Constraint 9 gives it no re-export. Cost: `index.entry.jsx` passes an object today and
  is rewritten; a consumer holding a `ToastAction` value loses the type.
- **EG — `CalendarEvent.meta` cannot stay a field.** Consumer data may not be a field of a predefined
  object — a mechanical guard, not a preference. Two ways out, and the audit RECOMMENDS the first:
  **(1)** drop `meta` from `CalendarEvent`; **(2)** make `CalendarEvent` itself consumer data, losing
  every declared field. (1) keeps `id`/`title`/`start`/`end`/`slot` declared and honest.
  **The route argument died with `renderEvent`**: `meta` existed so a consumer's own object could
  reach a custom renderer, and with that member removed by the per-item convention it has no consumer
  at all — which makes (1) a plain deletion rather than a redirection. Task 1 measured the in-tree
  cost as nil: `meta` appears only in `Calendar.jsx`'s own doc comment and no call site passes it.
- **EH — the two option unions are resolved to object arrays.** `Tabs.tabs` and
  `SegmentedControl.options` are `(string | X)[]`, which R5 forbids. The bare-string arm goes, exactly
  as `Select.options` did in 8C2. Cost: all three call sites rewrite; **no call site in the tree uses
  the object arm today**, so the ergonomic loss is real and unmeasured by any test.

- [ ] **Step 3: Record and stop.** Write `## Maintainer decisions taken` with EA–EH. No commit.

---

## Task 2: Debt 1 — `id` becomes a member of `Input` and `Textarea`

**Files:** modify `api/components/Input.json`, `api/components/Textarea.json`,
`frameworks/react/components/forms/Input.{d.ts,jsx,prompt.md}`,
`frameworks/react/components/forms/Textarea.{d.ts,jsx,prompt.md}`, `api/README.md`,
`frameworks/react/test/{input,textarea}.test.jsx`; regenerate the `.js` siblings.

**Interfaces:** consumes EA. `check:api` stays **32/52** — this adds a member to two existing
contracts, not a contract.

- [ ] **Step 1: Confirm and STOP.** Report that `id` is a NEW member on both, not a reinstatement,
  and that the generated value stays the fallback. Must not re-open EA.

- [ ] **Step 2: Write the failing tests**

Append to `frameworks/react/test/input.test.jsx`:

```jsx
/* id is a contracted member as of plan 8C3, and it is the ONE global attribute
 * that is. The component still generates one from the label to wire its own
 * htmlFor; a consumer id overrides that, because a host pointing an external
 * <label> or an aria-describedby at this field had no path at all otherwise. */
test('a consumer id overrides the one generated from the label', () => {
  const html = renderToStaticMarkup(<Input label="Email" id="signup-email" />);
  assert.match(html, /id="signup-email"/);
  assert.match(html, /for="signup-email"/);
  assert.doesNotMatch(html, /in-email/, 'the generated id is still being used despite an explicit one');
});

test('without a consumer id the label-derived one is still generated', () => {
  const html = renderToStaticMarkup(<Input label="Email" />);
  assert.match(html, /id="in-email"/);
  assert.match(html, /for="in-email"/);
});
```

Append the same pair to `frameworks/react/test/textarea.test.jsx`, with `Textarea`, `ta-` and
`<textarea`.

- [ ] **Step 3: Run them and watch them fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/input.test.jsx frameworks/react/test/textarea.test.jsx
```

Expected: the override tests FAIL (the consumer `id` is dropped); the generated ones PASS.

- [ ] **Step 4: Add the member in all three places, per component**

Contract — add to `api/components/Input.json` and `api/components/Textarea.json`:

```json
"id": { "form": "primitive", "type": "string",
        "description": "The control's id, and what the label's `for` points at. Generated from `label` when omitted." }
```

`.d.ts` — add to `InputProps` and `TextareaProps`:

```ts
  /** The control's id, and what the label's `for` points at. Generated from `label` when omitted. */
  id?: string;
```

`.jsx` — restore `id` to the destructuring and to the fallback expression:

```jsx
const inputId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
```

```jsx
const taId = id || (label ? 'ta-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
```

- [ ] **Step 5: Run the tests, then state the exception in `api/README.md`**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/input.test.jsx frameworks/react/test/textarea.test.jsx
```

Expected: all PASS.

Then, in `api/README.md` where D1 (the heritage flatten) is stated, add that **`id` is the one global
attribute that is a member**, and why: a component that generates an id to wire its own label leaves
a host with no way to point an external label, an `aria-describedby` or a form library at the field.
Write it as a stated exception to D1, not as a silent one.

- [ ] **Step 6: Prompt files, gates, commit**

Update both `.prompt.md`s — each currently says `id` is gone (8C2 wrote that); it now says the
opposite, and leaving the old sentence is exactly the Constraint 20 failure.

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api        # MUST still read 32 … across 52
bun run check:angular
bun run build:demos && bun run check:demos
bun run check:dimensions
git diff --stat -- '*.behaviour.json'   # empty
```

Commit (here-doc). The message states that `id` is a NEW member rather than a reinstatement, that it
is the single stated exception to D1, and that `check:api` is unchanged at 32/52.

---

## Task 3: Debt 3 — an event payload may be a declared enum

**Files:** modify `scripts/check-api.mjs`, `scripts/check-api.test.mjs`.

**Interfaces:** consumes EB. Contracts nothing; `check:api` stays **32/52**.

> Today `validateContract` sends any non-primitive, non-`consumerData` payload to
> `declared(spec.payload, 'object')`. `classify()` reads `(v: SomeEnum) => void` as
> `{form:'event', payload:'SomeEnum'}` perfectly well, so the reader can produce a payload the
> contract cannot declare — the same gap 8C2's Task 2 closed for primitives, one type-kind short.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/check-api.test.mjs`:

```js
/* An event payload resolves as a primitive, consumerData, a declared object OR a
 * declared enum. The enum arm is the last of the four: plan 8C2 admitted the
 * first three and stopped one type-kind short, so a contract declaring an enum
 * payload read as "an enum, used where an object belongs" while classify() read
 * the arrow without complaint. */
test('validateContract accepts an event payload naming a declared enum', () => {
  const problems = validateContract(
    { component: 'X', api: { pick: { form: 'event', payload: 'LogoSize' } } },
    new Map([['LogoSize', 'enum']]),
  );
  assert.deepEqual(problems, []);
});

test('validateContract still rejects an event payload naming no declared type', () => {
  const problems = validateContract(
    { component: 'X', api: { pick: { form: 'event', payload: 'Nope' } } },
    new Map([['LogoSize', 'enum']]),
  );
  assert.ok(problems.some((p) => /Nope/.test(p)));
});
```

- [ ] **Step 2: Run them and watch the first fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/check-api.test.mjs
```

Expected: the first FAILS with *"is a enum, used where a object belongs"*; the second PASSES.

- [ ] **Step 3: Widen the payload resolution**

In `scripts/check-api.mjs`, `validateContract`, replace the event-payload branch:

```js
    /* A payload resolves as a primitive, consumerData, a declared object or a
     * declared ENUM -- all four, because classify() produces all four and a
     * contract that cannot state what the reader reads is a gap, not a rule.
     * Plan 8C2 admitted the first three; this is the fourth. `declared()` takes
     * one kind, so the enum arm is tried first and only a name that is neither
     * falls through to the object message, which stays the default because an
     * object payload is by far the commoner case. */
    if (spec.form === 'event' && spec.payload
        && !PRIMITIVE_TYPES.has(spec.payload) && spec.payload !== CONSUMER_DATA) {
      if (typeNames.get(spec.payload) !== 'enum') {
        problems.push(...[declared(spec.payload, 'object')].filter(Boolean));
      }
    }
```

- [ ] **Step 4: Run, then run every script test**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/check-api.test.mjs
bun test scripts/
bun run check:api        # MUST still read 32 … across 52
```

Expected: all PASS; no earlier script test regresses.

- [ ] **Step 5: Record it in `api/README.md`** — in *What the gate asserts*, the payload's four legal
  resolutions, stated as four rather than as "a declared type".

- [ ] **Step 6: Commit** (here-doc), stating that this closes the last arm of the reader/gate payload
  gap and contracts nothing.

---

## Task 4: Debt 2 — the Angular `functionInput` spelling

**Files:** modify `scripts/lib/api-surface.mjs`, `scripts/api-surface.test.mjs`, `api/README.md`,
`CLAUDE.md`.

**Interfaces:** consumes EC. Contracts nothing; `check:api` stays **32/52**. Produces the spelling
Plan D implements.

> **The debt entry overstates the problem, and the audit's re-measurement is the finding.**
> `angularSurface()` on `readonly validate = input<(value: string) => string>()` ALREADY returns
> `{form:'functionInput', params:{value:'string'}, returns:'string'}`. What fails is
> `input<((value: string) => string) | undefined>()`, and it fails because `classify()`'s arrow
> pattern `/^\(([\s\S]*)\)\s*=>\s*([\s\S]+)$/` is tested before its union branch: it backtracks,
> matches the inner `)`, and captures the return as `string) | undefined`. Message:
> `unreadable type annotation: string)`.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/api-surface.test.mjs`:

```js
/* An optional annotation is the same annotation. `T | undefined` and `T | null`
 * are TypeScript's way of spelling optionality inline, and Angular's signal
 * inputs reach for it: `input<((value: string) => string) | undefined>()`. The
 * arrow branch is tested before the union branch, so a greedy backtrack used to
 * capture the RETURN as "string) | undefined" and die on it. Stripping a
 * trailing null/undefined arm first is what makes the two spellings agree. */
test('a nullable arrow annotation reads as the arrow it wraps', () => {
  assert.deepEqual(classify('((value: string) => string) | undefined'),
    { form: 'functionInput', params: { value: 'string' }, returns: 'string' });
  assert.deepEqual(classify('((v: string) => void) | null'),
    { form: 'event', payload: 'string' });
});

/* The strip must not eat a genuine union between two real types -- that is R5's
 * subject and must keep surfacing as a union, not as its first arm. */
test('stripping null/undefined does not collapse a genuine union', () => {
  assert.equal(classify('string | TabItem').form, 'union');
  assert.equal(classify('string | TabItem | undefined').form, 'union');
});

/* A bare optional primitive still reads as that primitive, which is what every
 * existing caller already relies on. */
test('a nullable primitive still reads as the primitive', () => {
  assert.deepEqual(classify('string | undefined'), { form: 'primitive', type: 'string' });
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/api-surface.test.mjs
```

Expected: the first FAILS with `unreadable type annotation: string)`.

- [ ] **Step 3: Strip the nullable arms before the arrow test**

In `scripts/lib/api-surface.mjs`, `classify()`, immediately after the `readonly ` strip and **before**
the node/primitive tests, add:

```js
  /* An optional annotation is the same annotation, and it must be reduced BEFORE
   * the arrow branch, which is tested before the union branch and backtracks: on
   * `((v: string) => string) | undefined` the arrow pattern matches the inner `)`
   * and captures the return as `string) | undefined`, which reads as nothing.
   * Split at the TOP level only -- `Record<string, unknown> | undefined` must not
   * be cut at the generic's comma, and a genuine union between two real types
   * must survive with every arm intact so R5 still sees it. */
  const arms = splitTopLevel(ts, '|').map((s) => s.trim()).filter(Boolean);
  if (arms.length > 1) {
    const real = arms.filter((a) => a !== 'null' && a !== 'undefined');
    if (real.length === 1 && real.length !== arms.length) return classify(real[0]);
  }
```

**This block is a starting point (Constraint 18).** Run the tests; if `splitTopLevel` is not in
scope at that point in the file, hoist rather than duplicating it. If the existing union branch
already strips nullables further down, do not add a second strip — fix the ordering instead, and say
so in the report.

- [ ] **Step 4: Run, and prove nothing else moved**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/api-surface.test.mjs
bun test scripts/
bun run check:api        # MUST still read 32 … across 52
bun run check:angular
```

Expected: all PASS. **This change touches how every nullable annotation is read**, so a green
`bun test scripts/` is the evidence that it did not — report the count, not an impression.

- [ ] **Step 5: Record the spelling**

In `api/README.md`, beside the ninth form, state the Angular spelling a `functionInput` takes —
`readonly validate = input<(value: string) => string>()`, with the optional form also readable — and
that required-ness comes from `.required`, not from the `| undefined` arm, so the bare form is
preferred.

In `CLAUDE.md`'s Known debt, **rewrite** the Plan D `functionInput` entry: the obligation stands, but
the reader is no longer the obstacle. What Plan D must satisfy is the modelled signature, and the
spelling that satisfies it is now written down and tested. Do not delete the entry — Angular still
has no implementation.

- [ ] **Step 6: Commit** (here-doc), stating that the debt entry overstated the problem, what actually
  failed, and that the reader fix is a parse-order correction rather than a new rule.

---

## Task 5: Debt 4 — the six form controls' events, proved at runtime

**Files:** create `frameworks/react/test-dom/form-control-events.test.jsx`; modify `CLAUDE.md`.

**Interfaces:** consumes ED. Contracts nothing; `check:api` stays **32/52**. **Moves the isolated DOM
process off 26/5 for the first time since the suspension** — Task 15's spec row must say so.

> 8C2 reshaped every native `onChange` into an event carrying a VALUE and **could not prove any of it
> fires**: `frameworks/react/test/` renders with `renderToStaticMarkup` and has no DOM. Each of the
> six suites says so in a header comment rather than faking a verdict. This task is that debt paid,
> and it is the same shape `tooltip-timer.test.jsx` paid for `Tooltip`'s delay.

- [ ] **Step 1: Read the harness first**

```bash
cd /home/juan/Dravensoft/Identity
cat frameworks/react/test-dom/harness.jsx
sed -n '1,40p' frameworks/react/test-dom/tooltip-timer.test.jsx
```

`frameworks/react/test-dom/` registers `@happy-dom/global-registrator` **process-wide** and is a
separate `bun test` process from `frameworks/react/test/`. Use the existing `harness.jsx` mount/unmount
helpers rather than inventing a second way to mount — two ways to mount is two ways to leak a
document between files, and this directory shares one document for its whole run.

- [ ] **Step 2: Write the suite**

Create `frameworks/react/test-dom/form-control-events.test.jsx`. **Starting point — run it.**

```jsx
/* Plan 8C2 turned every form control's native onChange into an event carrying a
 * VALUE rather than the DOM event -- string for Input, Select, Textarea and
 * RadioGroup, boolean for Checkbox, and Input.blur likewise. Six suites under
 * frameworks/react/test/ assert the SHAPE of that and each says, in its own
 * header, that it cannot assert the event fires: renderToStaticMarkup has no DOM.
 * This file is that debt paid. It asserts the payload's TYPE as well as its
 * value, because `e.target.value` and the value itself are both strings and a
 * test asserting only equality would pass against the defect it exists to catch.
 * For Checkbox the two are different types, which is why its assertion is the
 * sharpest of the six. */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, unmount } from './harness.jsx';
import { Input } from '../components/forms/Input.jsx';
import { Checkbox } from '../components/forms/Checkbox.jsx';

test('Checkbox change hands the consumer a boolean, not an event', () => {
  const seen = [];
  const root = mount(<Checkbox label="Notify" checked={false} onChange={(v) => seen.push(v)} />);
  try {
    const box = root.querySelector('input[type="checkbox"]');
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    assert.equal(seen.length, 1, 'the change handler did not fire');
    assert.equal(typeof seen[0], 'boolean', 'the payload is not a boolean -- a DOM event is travelling');
    assert.equal(seen[0], true);
  } finally { unmount(root); }
});

test('Input change hands the consumer the string value, not an event', () => {
  const seen = [];
  const root = mount(<Input label="Email" value="" onChange={(v) => seen.push(v)} />);
  try {
    const field = root.querySelector('input.arena-input');
    field.value = 'ana@dravensoft.dev';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    assert.equal(seen.length, 1, 'the change handler did not fire');
    assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
    assert.equal(seen[0], 'ana@dravensoft.dev');
  } finally { unmount(root); }
});
```

**React binds `onChange` to the DOM `input` event, not `change`** — that is React's own normalisation
and it is why the two tests above dispatch different event names. Verify which one each control
actually listens for by dispatching and observing, rather than by assuming; fix the test, not the
title (Constraint 18).

Add the same shape for `Select` (dispatch `change` on the `<select>`), `Textarea` (dispatch `input`),
and `RadioGroup` (dispatch `change` on one child radio, asserting the payload is the child's `value`
string). Add one more for **`Input.blur`**, which is the member no SSR test could reach at all:

```jsx
test('Input blur hands the consumer the value, and validate runs on it', () => {
  const seen = [];
  const root = mount(
    <Input label="Email" value="nope" validate={(v) => (v.includes('@') ? '' : 'Bad email')}
      onBlur={(v) => seen.push(v)} />,
  );
  try {
    const field = root.querySelector('input.arena-input');
    field.dispatchEvent(new Event('blur', { bubbles: true }));
    assert.deepEqual(seen, ['nope'], 'blur did not carry the value');
    assert.match(root.textContent, /Bad email/, 'validate did not run on blur');
  } finally { unmount(root); }
});
```

That last assertion is the ninth form's first runtime proof: `validate` is a `functionInput`, and
until now nothing showed its result reaching the render.

- [ ] **Step 3: Run it**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test-dom
```

Expected: PASS, and the file count rises from 5. **Record the new pair** — it is the first movement
of the isolated process since the suspension and Task 15 writes it into the spec.

- [ ] **Step 4: Prove the suite discriminates**

For **one** control, induce the defect and watch the right assertion fail: change `Checkbox.jsx`'s
`onChange(e.target.checked)` back to `onChange(e)`, run, confirm the **`typeof … boolean`** assertion
fails (not merely the equality one), restore, and `sha256sum` before and after to prove the restore is
byte-identical. A suite that would pass against `onChange(e)` proves nothing, and equality alone
would pass for the string controls.

- [ ] **Step 5: Retire the debt entry and commit**

In `CLAUDE.md`'s Known debt, delete the *"DA's whole reshape is unverified at runtime"* entry — a debt
record that outlives the debt is what that section rejects. **Verify the suite really covers all six
before deleting**, and if any control is left uncovered, keep the entry and narrow it to name that
control rather than deleting it wholesale.

Update each of the six `frameworks/react/test/*.test.jsx` header comments: they currently say the
payload is unverifiable here, which stays true of *that* file but must now point at the DOM suite
rather than reading as though nothing verifies it.

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test-dom
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun run check:compliance
```

Commit (here-doc), stating both measured pairs and that `Input.blur` and `validate`'s result reaching
the render are proved for the first time.

---

## Task 6: The per-item renderer convention, made enforceable

**Files:** modify `api/README.md` (corrected ahead of this task — verify rather than redo),
`scripts/lib/api-surface.mjs` (the throw's message), `scripts/api-surface.test.mjs`, `CLAUDE.md`.

**Interfaces:** contracts nothing; `check:api` stays **32/52**. Produces the settled rule Tasks 11
and 13 apply. Read *The per-item renderer, stated once* above before starting.

> **This task replaces the one that was going to teach the reader R3.** That task was deleted when
> `api/README.md` was found to assert two opposite futures for the same member; the section above
> carries the reasoning and the measured cost. What remains is small: make the reader's message say
> what the rule actually is, and make `CLAUDE.md` agree.

- [ ] **Step 1: Verify the documentation is already correct**

`api/README.md` was corrected during Task 2. Read both passages and confirm they now agree:

```bash
cd /home/juan/Dravensoft/Identity
grep -n "not a member at all" -A 16 api/README.md
grep -n "highest this convention has charged" -B 4 -A 12 api/README.md
```

If either is missing or still contradicts the other, fix it here. Do not restate the cost a third
time — two statements of it is already one more than this repo usually allows itself.

- [ ] **Step 2: Rewrite the failing test first**

`scripts/api-surface.test.mjs` asserts the throw's message matches `/parameterised slot/i` and
`/R3/`. That message is about to stop saying *"the reader does not model that shape yet"*, because
"yet" is now false: no contract may declare such a member, so the refusal is permanent. Find the test
with `grep -n 'parameterised slot' scripts/api-surface.test.mjs`, rewrite its assertion and its
comment to pin the **enforcement** rather than the gap, then run it and watch it fail:

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/api-surface.test.mjs
```

- [ ] **Step 3: Rewrite the message**

In `scripts/lib/api-surface.mjs`, the arrow branch's node-return throw. The message must name the
convention rather than the reader's limitation — something the shape of:

```
a function returning a node is a per-item renderer, and a per-item renderer is not a member:
the convention that removed ActivityFeed.renderItem removes it too (api/README.md). It IS a
parameterised slot and R3 permits it -- Angular is what does not, because per-item projection
needs ngTemplateOutlet, which no binding-table row covers and no reader function reads.
```

**Keep `R3` in it**, because the rule it is *not* violating is worth naming: a reader of this message
must not conclude R3 was the reason.

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/api-surface.test.mjs
bun test scripts/
bun run check:api        # MUST still read 32 ... across 52
```

- [ ] **Step 4: `CLAUDE.md`**

Its API paragraph and its Known debt both describe R2/R3 as unchecked authoring rules, which stays
true. Add one clause recording that a per-item renderer is not a member and that the reader enforces
that — and **do not** write that R3 became checkable, because it did not.

- [ ] **Step 5: Commit** (here-doc), stating that the plan deleted its own structural task, why the
  contradiction resolved the way it did, and that the throw is now an enforcement rather than a gap.

---

## Task 7: Tabs and SegmentedControl

**Files:** create `api/types/tab-item.json`, `api/types/segment-option.json`,
`api/types/segmented-control-size.json`, `api/components/{Tabs,SegmentedControl}.json`,
`frameworks/react/test/{tabs,segmented-control}.test.jsx`; modify both `.d.ts` `.jsx` `.prompt.md`,
`frameworks/react/components/navigation/navigation.card.entry.jsx`,
`frameworks/react/ui_kits/console/ProjectScreen.jsx`, `README.md`; regenerate.

**Interfaces:** consumes EH. Produces `TabItem`, `SegmentOption`, `SegmentedControlSize`. **+2/+2 →
34/54.** These two share a task because they share the union problem and the README paragraph that
tells them apart.

- [ ] **Step 1: Confirm and STOP.** Report both contracts member-by-member; confirm the bare-string
  arm leaves both (EH), that `ProjectScreen.jsx`'s `style` on `Tabs` moves to a wrapping `<div>` with
  the value byte-identical, and that `SegmentedControl` is the only component in the batch also
  losing a `{...rest}`.

- [ ] **Step 2: Write the three types and regenerate**

```json
{ "name": "TabItem", "kind": "object",
  "description": "One tab in a Tabs strip.",
  "fields": { "value": { "form": "primitive", "type": "string", "required": true,
                         "description": "What the tab selects, and what `change` carries." },
              "label": { "form": "primitive", "type": "string", "required": true,
                         "description": "What the tab reads." } } }
```

```json
{ "name": "SegmentOption", "kind": "object",
  "description": "One option in a SegmentedControl.",
  "fields": { "value": { "form": "primitive", "type": "string", "required": true,
                         "description": "What the option selects, and what `change` carries." },
              "label": { "form": "primitive", "type": "string", "required": true,
                         "description": "What the option reads. One word — the track stops being compact past that." } } }
```

```json
{ "name": "SegmentedControlSize", "kind": "enum",
  "description": "Compact or default. Both sit below Button on purpose — a filter never outweighs an action. Distinct from ControlSize, which offers a large step this control does not.",
  "values": ["sm", "md"] }
```

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
git diff frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

Read the **full** diff: three types added, nothing else moved, the two module diffs identical.

- [ ] **Step 3: Write the two contracts**

`api/components/Tabs.json`:

```json
{
  "component": "Tabs",
  "description": "Tab navigation between views. The active tab carries the crimson underline.",
  "api": {
    "tabs": { "form": "array", "of": "TabItem", "required": true, "description": "The tabs, in order." },
    "value": { "form": "primitive", "type": "string", "description": "The selected tab's value. Omit and pass `defaultValue` to let it govern itself." },
    "defaultValue": { "form": "primitive", "type": "string", "description": "The initially selected value when uncontrolled. Defaults to the first tab." },
    "change": { "form": "event", "payload": "string", "description": "A different tab was chosen; carries its value." }
  }
}
```

`api/components/SegmentedControl.json`:

```json
{
  "component": "SegmentedControl",
  "description": "A compact inline filter over mutually exclusive options. A real radio group, never a tab list, and it carries no crimson.",
  "api": {
    "options": { "form": "array", "of": "SegmentOption", "required": true, "description": "The options, in order. Two to four with one-word labels." },
    "value": { "form": "primitive", "type": "string", "description": "The selected option's value. Omit and pass `defaultValue` to let it govern itself." },
    "defaultValue": { "form": "primitive", "type": "string", "description": "The initially selected value when uncontrolled. Defaults to the first option." },
    "size": { "form": "enum", "type": "SegmentedControlSize", "default": "md", "description": "Compact or default." },
    "ariaLabel": { "form": "primitive", "type": "string", "required": true, "description": "Names what is being filtered — \"Time range\", not \"Filter\". A radio group with no accessible name is announced unlabelled." },
    "name": { "form": "primitive", "type": "string", "description": "Shared name for the underlying radios; generated when omitted." },
    "change": { "form": "event", "payload": "string", "description": "A different option was chosen; carries its value." }
  }
}
```

`ariaLabel` is `required: true` in the contract, so Constraint 8 applies: `SegmentedControl.jsx`
gains `if (!ariaLabel) throw new Error('SegmentedControl: \`ariaLabel\` is required');`. Confirm it
does not already have one before adding a second.

- [ ] **Step 4: Migrate both `.d.ts`** — `import type { TabItem } from '../../api.generated';` plus
  `export type { TabItem };` (Constraint 9 — it was a locally exported type); `tabs: TabItem[]`;
  `onChange?: (value: string) => void`; drop `style`. Same shape for `SegmentedControl` with
  `SegmentOption` and `SegmentedControlSize`.

- [ ] **Step 5: Migrate both `.jsx`** — each `map` loses its `typeof t === 'string'` branch;
  `SegmentedControl` drops `{...rest}`; both drop `...style` from the root. The rendered DOM must not
  otherwise change.

- [ ] **Step 6: Fix the three call sites**

`navigation.card.entry.jsx`: `tabs={['Overview',…]}` → `tabs={[{value:'Overview',label:'Overview'},…]}`,
and the same for `options={['24h','7d','30d']}`.

`ProjectScreen.jsx`: the same object rewrite, and the `style={{ marginBottom: … }}` moves to a wrapping
`<div>` with the value **byte-identical** (8C2's F2 idiom).

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos && bun run check:demos
```

- [ ] **Step 7: Two suites, the R4 proofs, README, gates, commit**

Create `frameworks/react/test/tabs.test.jsx` and `segmented-control.test.jsx`. Each asserts: an item
renders its `label` as text and its `value` as the selection key **and the two differ** (use
`{value:'ov', label:'Overview'}` — a same-string fixture cannot discriminate); the active item carries
its active treatment and only it; the required-member throw fires (`SegmentedControl` only); and the
two R4 escapes are gone, **as two separate tests**.

Run the two induced R4 regressions per Constraint 17 on each component, `sha256sum` before and after.
**`Tabs` has no `{...rest}` today**, so its attribute run is induced by adding one.

`README.md`: the *Navigate vs. filter* paragraph names both components. Re-read it — it describes
shape and accent, not members, so it likely stands; report either way (Constraint 19).

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api        # MUST read 34 … across 54
bun run check:angular && bun run check:behaviour && bun run check:dimensions
bun run check:demos && bun run check:tailwind && bun run check:states
bun test frameworks/react/test/
git diff --stat -- '*.behaviour.json'   # empty
```

Commit (here-doc): the bare-string arm gone from both (R5), `style` and `{...rest}` gone, 32/52 → 34/54.

---

## Task 8: ProgressBar and Toast

**Files:** create `api/types/progress-tone.json`, `api/types/toast-tone.json`,
`api/components/{ProgressBar,Toast}.json`, `frameworks/react/test/{progress-bar,toast}.test.jsx`;
modify both quartets, `frameworks/react/components/feedback/feedback.card.entry.jsx`,
`frameworks/react/ui_kits/console/index.entry.jsx`; regenerate.

**Interfaces:** consumes EF. Produces `ProgressTone`, `ToastTone`. **+2/+2 → 36/56.**

- [ ] **Step 1: Confirm and STOP.** Report both contracts; confirm `ToastAction` is decomposed into
  `actionLabel` + `action` exactly as `Alert`'s already is (EF), that `ProgressBar.size` reuses the
  existing `ControlSize` rather than declaring a fourth `sm md lg` enum, and that `ProgressBar.label`
  stays a slot.

- [ ] **Step 2: Two tone enums**

```json
{ "name": "ProgressTone", "kind": "enum",
  "description": "The bar's colour. No neutral and no warning: a progress bar reports work, and work is either running, done or failed.",
  "values": ["accent", "gold", "success", "danger", "info"] }
```

```json
{ "name": "ToastTone", "kind": "enum",
  "description": "The side bar's colour. Narrower than Tone: a toast reports an outcome, and there is no informational outcome a toast should interrupt for.",
  "values": ["neutral", "success", "danger", "gold"] }
```

**Before writing these, check every existing enum's value set** — `AlertTone` is
`info success warning danger neutral` and neither of these matches it. If one does, reuse it
(Constraint 23's enum-minimality question).

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
git diff frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

- [ ] **Step 3: The two contracts**

`api/components/ProgressBar.json`:

```json
{
  "component": "ProgressBar",
  "description": "Determinate progress by default; indeterminate for a wait with no percentage.",
  "api": {
    "value": { "form": "primitive", "type": "number", "default": 0, "description": "0-100. Ignored when `indeterminate`." },
    "indeterminate": { "form": "primitive", "type": "boolean", "default": false, "description": "A wait with no percentage; the bar animates instead of filling." },
    "tone": { "form": "enum", "type": "ProgressTone", "default": "accent", "description": "The bar's colour." },
    "label": { "form": "slot", "description": "The line above the bar." },
    "showValue": { "form": "primitive", "type": "boolean", "default": true, "description": "Shows the percentage beside the label. Determinate only." },
    "size": { "form": "enum", "type": "ControlSize", "default": "md", "description": "The bar's thickness." }
  }
}
```

`api/components/Toast.json`:

```json
{
  "component": "Toast",
  "description": "Ephemeral notification with a tone-coloured side bar and one optional action.",
  "api": {
    "title": { "form": "primitive", "type": "string", "description": "The bold lead line." },
    "message": { "form": "primitive", "type": "string", "description": "The body." },
    "tone": { "form": "enum", "type": "ToastTone", "default": "neutral", "description": "The side bar's colour." },
    "actionLabel": { "form": "primitive", "type": "string", "description": "The label of the single inline action — Undo, Retry, View logs. Absent renders no action." },
    "action": { "form": "event", "description": "The inline action was activated." },
    "persist": { "form": "primitive", "type": "boolean", "default": false, "description": "Disables the host's auto-dismiss. Always use it in an error state." },
    "close": { "form": "event", "description": "The × was activated." }
  }
}
```

Note `close`, not `onClose`: the contract names the event, the binding table makes it React's
`onClose` (Constraint 7).

- [ ] **Step 4: Migrate both quartets.** `ToastAction` leaves `Toast.d.ts` entirely, so Constraint 9
  gives it **no** re-export — verify by reading the pre-migration file rather than trusting this
  sentence. `Toast.jsx` takes `actionLabel` and `onAction` in place of the `action` object and renders
  the button from the two; copy the shape from `Alert.jsx`, which already does exactly this.

- [ ] **Step 5: Fix the call sites.** `feedback.card.entry.jsx` (three `ProgressBar`, two `Toast`);
  `index.entry.jsx` passes `action={t.action}` and must pass `actionLabel` and `onAction` instead —
  read what `t.action` holds and split it at the source. Then `bun run build:demos && bun run check:demos`.

- [ ] **Step 6: Two suites, the R4 proofs (both components need an induced `{...rest}`), prompts,
  README, gates, commit.**

Expected: `check-api: 36 … across 56`; behaviour diff empty. 34/54 → 36/56.

---

## Task 9: Tooltip

**Files:** create `api/components/Tooltip.json`, `frameworks/react/test/tooltip.test.jsx`; modify the
quartet and `feedback.card.entry.jsx`; regenerate.

**Interfaces:** no new type. **+1/+1 → 37/57.**

- [ ] **Step 1: Confirm and STOP.** Report the contract — three members, two of them required slots.
  Confirm that contracting `Tooltip` **does not** touch its recorded debt: it is still not
  keyboard-reachable, `focus.never` stays excepted in its binding, and a green `check:api` says
  nothing about that. Say so explicitly; this component is the clearest case in the batch where a
  contract could be misread as a clean bill of health.

- [ ] **Step 2: The contract**

```json
{
  "component": "Tooltip",
  "description": "A short label revealed on pointer intent. Bone over dark for contrast. It waits before appearing and before withdrawing, so a pointer crossing a toolbar reveals nothing.",
  "api": {
    "content": { "form": "slot", "required": true, "description": "The tooltip's own body." },
    "target": { "form": "slot", "required": true, "description": "The element the tooltip describes and attaches to." }
  }
}
```

> **The naming decision this task must make and report.** React's `TooltipProps` has `content` AND
> `children`, and the binding table maps the contract slot named `content` to React's `children`.
> Both cannot be `content`. The contract above names the wrapped element `target` (→ React prop
> `target`) and the body `content` (→ React's `children`) — **which inverts the current React
> spelling**, where `children` is the target and `content` is the body. The alternative is to name the
> body `body` and keep `target` as `children`. Present both to the maintainer in Step 1 with this
> paragraph; do not choose alone. Whichever wins, the `.jsx` and all six call sites move.

- [ ] **Step 3: Migrate the quartet, fix `feedback.card.entry.jsx` and the five `<Tooltip>` mounts in
  `frameworks/react/test-dom/tooltip-timer.test.jsx`.** That suite is a real consumer and its mounts
  break with the rename — updating it is required, and it must keep asserting exactly what it asserts
  today about the delays.

- [ ] **Step 4: Suite, R4 proofs (induced `{...rest}`), prompt, README, gates, commit.**

Expected: `check-api: 37 … across 57`; behaviour diff empty; `bun test frameworks/react/test-dom`
still green. 36/56 → 37/57.

---

## Task 10: Calendar — keyboard navigation and compliance

**Files:** modify `frameworks/react/components/display/Calendar.jsx`,
`frameworks/react/components/display/Calendar.behaviour.json`, `scripts/check-compliance.mjs`
(`COVERED`); create `frameworks/react/test-dom/grid-keyboard.test.jsx`; regenerate the `.js` sibling.

**Interfaces:** produces the settled markup Task 11 contracts. **Contracts nothing** — `check:api`
stays 37/57. **This is the one task besides 12 that may edit a `*.behaviour.json`**, and only to
retire exceptions the implementation has stopped needing (Constraints 6 and 32).

> `Calendar` binds `grid` with all eight requirements excepted, and `CLAUDE.md` records the pair with
> `Table` as the clearest evidence the behaviour layer was worth building. This task is that record
> being paid down. **It is an accessibility implementation, not a contract task** — do not touch
> `Calendar.d.ts` or write a contract here.

- [ ] **Step 1: Confirm and STOP.** Read `behaviour/patterns/grid.json` and `Calendar.behaviour.json`
  aloud in the report — all eight requirements and all eight reasons. State which of the eight this
  task will satisfy and which will keep an exception with a narrowed reason. **A partial implementation
  is expected and honest; a wholesale exception deletion is not** (Constraint 32).

- [ ] **Step 2: Write the failing compliance suite**

Create `frameworks/react/test-dom/grid-keyboard.test.jsx`. It uses `assertPattern` from
`./assert-pattern.jsx`, which compares the rendered tree against the binding **in both directions** —
a requirement met with no exception declared fails, and an exception that is no longer true fails.
That bidirectionality is why this suite is written before the implementation: it goes red for the
right reason.

```jsx
/* Calendar and Table both bind `grid` and both excepted all eight of its
 * requirements. This suite is the bidirectional half: assertPattern fails a
 * requirement met with no exception declared AND an exception that has stopped
 * being true, so the implementation and the binding cannot drift apart.
 *
 * Four of the eight are requirements no single element can decide -- focus.roving
 * and the three keyboard.* -- so comparePattern returns null for them and this
 * suite must prove each by ACTING on the tree and recording the verdict in
 * `behavioural`. assertPattern throws if one is silently skipped. A wrong verdict
 * here pins a false claim exactly as a text scan would have. */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, unmount } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Calendar } from '../components/display/Calendar.jsx';

const EVENTS = [
  { id: 'a', title: 'Standup', start: '2026-07-20T09:00:00Z', end: '2026-07-20T09:30:00Z', slot: 1 },
  { id: 'b', title: 'Review',  start: '2026-07-21T14:00:00Z', end: '2026-07-21T15:00:00Z', slot: 2 },
];

test('Calendar exposes one tab stop into the grid and moves focus with the arrows', () => {
  const root = mount(<Calendar events={EVENTS} timeZone="UTC" anchorDate="2026-07-20" />);
  try {
    const grid = root.querySelector('[role="grid"]');
    assert.ok(grid, 'no role="grid" — the grid pattern has nothing to attach to');

    const stops = root.querySelectorAll('[tabindex="0"]');
    assert.equal(stops.length, 1, 'a grid is ONE tab stop; found ' + stops.length);

    const first = stops[0];
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.notEqual(root.ownerDocument.activeElement, first, 'ArrowRight did not move focus');
    assert.equal(root.querySelectorAll('[tabindex="0"]').length, 1, 'the roving stop did not rove — two cells are in the Tab sequence');
  } finally { unmount(root); }
});

test('Calendar keeps focus inside the grid at its edges', () => {
  const root = mount(<Calendar events={EVENTS} timeZone="UTC" anchorDate="2026-07-20" />);
  try {
    const cell = root.querySelector('[role="gridcell"][tabindex="0"]');
    cell.focus();
    const before = root.ownerDocument.activeElement;
    for (let i = 0; i < 40; i += 1) {
      root.ownerDocument.activeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    }
    assert.ok(root.contains(root.ownerDocument.activeElement), 'focus escaped the grid at its edge');
    assert.ok(before !== null);
  } finally { unmount(root); }
});

test('Calendar agrees with its own behaviour binding, in both directions', () => {
  const root = mount(<Calendar events={EVENTS} timeZone="UTC" anchorDate="2026-07-20" />);
  try {
    assertPattern({
      root,
      bindingPath: join(REACT_COMPONENTS, 'display', 'Calendar.behaviour.json'),
      subjects: { default: root.querySelector('[role="grid"]') },
      behavioural: {
        'focus.roving': true,
        'keyboard.ArrowKeys': true,
        'keyboard.Home': true,
        'keyboard.End': true,
      },
    });
  } finally { unmount(root); }
});
```

**Every verdict in that `behavioural` map must be earned by a test above it in the same file.** The
Home/End verdicts are asserted `true` here with no test proving them — **write those two tests, or set
the verdicts to `false` and keep the exceptions.** A declared verdict with no assertion behind it is
the precise failure Constraint 34 names.

- [ ] **Step 3: Run it and watch it fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test-dom/grid-keyboard.test.jsx
```

Expected: FAIL at `no role="grid"` — the very first assertion.

- [ ] **Step 4: Implement**

In `Calendar.jsx`: put `role="grid"` on the scroll container that holds the day columns and
`aria-label` on it (the `<section>` already computes a schedule title — move or mirror it so the label
lands on the grid element, which its own exception says it cannot today). Give each day column
`role="row"` and each hour cell `role="gridcell"`. Hold the focused cell in state
(`const [cursor, setCursor] = useState({ day: 0, hour: 0 })`), render `tabIndex={isCursor ? 0 : -1}`
on each cell, and add one `onKeyDown` on the grid container handling `ArrowLeft`/`ArrowRight`
(day ±1), `ArrowUp`/`ArrowDown` (hour ±1), `Home`/`End` (first/last cell in the row), each clamped at
the edges and each calling `preventDefault()`. Move DOM focus in a `useEffect` keyed on `cursor`.

**Two things this must not break.** The event blocks become native `<button>`s when `onEventClick` is
set, each its own tab stop — that is what `focus.roving`'s exception describes, and a roving grid with
buttons inside it is a real design question: the APG answer is that the buttons are reachable from
within the cell, not as page-level tab stops, so they take `tabIndex={-1}`. And the absolutely
positioned layout must not shift: `role` and `tabIndex` add no box.

- [ ] **Step 5: Run, retire only what is true, register coverage**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test-dom/grid-keyboard.test.jsx
```

Delete from `Calendar.behaviour.json` **only** the exceptions the suite now proves false. For any
requirement still unmet, rewrite the reason to say what is met and what is not — the current reasons
say "no keyboard navigation exists at all", which stops being true the moment Step 4 lands, and a
stale reason is exactly what `assertPattern` exists to catch.

Add to `COVERED` in `scripts/check-compliance.mjs`:

```js
  'Calendar:react': 'grid-keyboard.test.jsx',
```

`COVERED` is keyed `<component>:<layer>`; a key without the suffix is rejected.

- [ ] **Step 6: Gates and commit**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:behaviour
bun run check:compliance
bun run check:dimensions
bun run build:demos && bun run check:demos
bun run check:api        # unchanged, 37 … across 57
bun test frameworks/react/test-dom
git diff --stat -- '*.behaviour.json'   # ONE file, exceptions REMOVED
```

Per Constraint 31, state in the report whether `calendar.card.html`'s content box could have grown —
`role` and `tabIndex` add no box, but a focus ring drawn with `outline` does not either while one
drawn with `border` does. Say which you used.

Commit (here-doc): which of the eight requirements are now met, which keep a narrowed exception and
why, and that `check:api` is untouched because this is behaviour work.

---

## Task 11: Calendar — the API contract

**Files:** create `api/types/cat-slot.json`, `api/types/calendar-event.json`,
`api/components/Calendar.json`, `frameworks/react/test/calendar.test.jsx`; modify the quartet and
`frameworks/react/components/display/calendar.card.entry.jsx`; regenerate.

**Interfaces:** consumes EE, EG and Task 6's R3. Produces `CatSlot`, `CalendarEvent`. **+1/+1 → 38/58.**

- [ ] **Step 1: Confirm and STOP.** Report the contract; confirm `renderEvent` is **REMOVED** under
  the per-item convention — not modelled as a parameterised slot and not smuggled through the ninth
  form (Constraint 29 — `Calendar` is not a data-entry control); confirm `meta` leaves
  `CalendarEvent` per EG, and that with `renderEvent` gone it has no consumer left at all; confirm
  `CatSlot` is the
  directory's **first numeric enum** (Constraint 36).

- [ ] **Step 2: The two types**

```json
{ "name": "CatSlot", "kind": "enum",
  "description": "A slot in the categorical ramp, in fixed order and never cycled. The same eight slots the charts use — identity is one system across Arena, not one per component. Colour here means which thing, never what state.",
  "values": [1, 2, 3, 4, 5, 6, 7, 8] }
```

```json
{ "name": "CalendarEvent", "kind": "object",
  "description": "One event on the schedule. Times are ISO datetimes read in the calendar's timeZone, never the reader's.",
  "fields": {
    "id": { "form": "primitive", "type": "string", "required": true, "description": "Stable identity, so a host can switch on it rather than on the title." },
    "title": { "form": "primitive", "type": "string", "required": true, "description": "What the chip reads." },
    "start": { "form": "primitive", "type": "string", "required": true, "description": "ISO datetime the event begins." },
    "end": { "form": "primitive", "type": "string", "required": true, "description": "ISO datetime the event ends." },
    "slot": { "form": "enum", "type": "CatSlot", "description": "Identity colour. Give the same entity the same slot everywhere and it keeps its colour across views." }
  } }
```

`meta` is **absent** and that is EG: consumer data may not be a field of a predefined object, and
`renderEvent`'s parameter is the route by which a consumer's own object reaches its own renderer.

**The emitter cannot do this today, and that is measured, not suspected.**
`renderApiModule()` in `scripts/build-api-types.mjs` quotes **every** enum value
unconditionally — `type.values.map((v) => `'${v}'`)` — so `CatSlot` would emit
`export type CatSlot = '1' | '2' | … | '8';`, a union of *strings*. The React `.d.ts` says
`1 | 2 | … | 8`, so `check:api` would then report a values mismatch, and a reader trusting the
generated module would be told the slot is a string. **Fix the emitter before writing the type**,
as a step of its own with its own test:

- [ ] **Step 2a: Teach the emitter numeric enum values**

Write the failing test first, in `scripts/build-api-types.test.mjs`:

```js
/* An enum's values are rendered as TypeScript literals, and a NUMBER is not a
 * string. Every enum in api/types/ was a string set until CatSlot, so the
 * emitter quoted unconditionally and nothing noticed. A quoted numeric set is
 * worse than a build error: it emits a union of strings that compiles, and the
 * layer's own `1 | 2 | 3` then disagrees with it in a way only check:api sees. */
test('renderApiModule emits a numeric enum unquoted', () => {
  const out = renderApiModule([{ name: 'CatSlot', kind: 'enum', description: 'x', values: [1, 2, 3] }]);
  assert.match(out, /export type CatSlot = 1 \| 2 \| 3;/);
});

test('renderApiModule still quotes a string enum', () => {
  const out = renderApiModule([{ name: 'Dir', kind: 'enum', description: 'x', values: ['up', 'down'] }]);
  assert.match(out, /export type Dir = 'up' \| 'down';/);
});
```

Run it, watch the first fail, then make the literal depend on the value's type — a number renders
bare, anything else quotes. Run `bun run build:api` afterwards and confirm the **existing** modules
are byte-unchanged: every enum shipped today is a string set, so a correct fix moves nothing.

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/build-api-types.test.mjs
bun run build:api
git diff --stat frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts   # EMPTY before CatSlot exists
```

Only then write `cat-slot.json` and regenerate:

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
git diff frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

Read the emitted `CatSlot` and confirm it is unquoted.

- [ ] **Step 3: The contract**

```json
{
  "component": "Calendar",
  "description": "Week or day schedule on a time grid. Colour is identity, never state.",
  "api": {
    "events": { "form": "array", "of": "CalendarEvent", "required": true, "description": "The events to place." },
    "timeZone": { "form": "primitive", "type": "string", "required": true, "description": "IANA zone name. Required: a schedule rendered in the reader's zone is wrong by hours, not by style." },
    "anchorDate": { "form": "primitive", "type": "string", "description": "ISO date the view opens on. Defaults to today in `timeZone`; pass and change it to drive the date yourself." },
    "view": { "form": "enum", "type": "CalendarView", "description": "Omit to derive from the CONTAINER width: day below --bp-md, else week." },
    "dayStart": { "form": "primitive", "type": "string", "description": "HH:MM the grid starts at. Defaults to the earliest visible event's hour, floored." },
    "dayEnd": { "form": "primitive", "type": "string", "default": "23:00", "description": "HH:MM the grid ends at." },
    "weekStartsOn": { "form": "primitive", "type": "number", "default": 1, "description": "0 = Sunday … 6 = Saturday." },
    "hideEmptyWeekend": { "form": "primitive", "type": "boolean", "default": true, "description": "Drop Sunday from the week unless an event falls on it." },
    "eventClick": { "form": "event", "payload": "CalendarEvent", "description": "An event chip was activated; carries the event." },
    "dateClick": { "form": "event", "payload": "string", "description": "A day header or column background was activated; carries the ISO date." },
    "rangeChange": { "form": "event", "payload": "string", "description": "The anchor moved via prev/Today/next; carries the new ISO date. A date rather than a delta, because Today is not a delta." },
    "actions": { "form": "slot", "description": "Right-aligned in the toolbar, beside the range title." }
  }
}
```

`view` names a `CalendarView` enum (`week day`) — **write `api/types/calendar-view.json` too**; the
inline union `'week' | 'day'` in the `.d.ts` is an R5-adjacent shape the batch is removing everywhere
else and must not survive here.

- [ ] **Step 4: Migrate the quartet.** Constraint 9: `Calendar.d.ts` exported `CatSlot` **and**
  `CalendarEvent` locally, so both keep a re-export. **`renderEvent` leaves the `.d.ts` and the
  `.jsx`** — delete the parameter, the destructuring and the branch that calls it, so the default
  chip body is the only body. Drop
  `style`. Rename the three handlers to `onEventClick`/`onDateClick`/`onRangeChange`, which the binding
  table already produces from `eventClick`/`dateClick`/`rangeChange` — verify with `bindingName()`
  rather than assuming.

- [ ] **Step 5: The two removals at the call site.** `calendar.card.entry.jsx` passes neither
  `renderEvent` nor `meta` today — Task 1 measured `meta` as appearing only in `Calendar.jsx`'s own
  doc comment, and no call site passes a custom renderer. **Verify both claims yourself** and report
  what you found; if either is wrong, the removal has an in-tree cost this plan did not price.

- [ ] **Step 6: Suite, the R4 proofs (induced `{...rest}`), prompt, README, gates, commit.**

The suite must prove the REMOVAL rather than the shape — the inverse of what this plan originally
asked for, and this task's headline:

```jsx
/* renderEvent is gone, removed by the per-item convention that had already
 * removed ActivityFeed.renderItem -- not because it broke R3 (it filled the chip
 * rather than replacing it, which R3 permits) but because per-item projection has
 * no Angular answer short of ngTemplateOutlet. The chip body is Arena's alone
 * now, so the assertion is that the default body renders and a stray renderEvent
 * reaches nothing. A removal nothing asserts is a removal that can come back:
 * check:api reads the .d.ts and would stay green if the .jsx kept honouring it. */
test('the chip body is Arena own, and a consumer renderer reaches nothing', () => {
  const html = renderToStaticMarkup(
    <Calendar events={EVENTS} timeZone="UTC" anchorDate="2026-07-20"
      renderEvent={(e) => <em>{e.title.toUpperCase()}</em>} />,
  );
  assert.match(html, /Standup/, 'the default chip body did not render');
  assert.doesNotMatch(html, /<em>/, 'a consumer renderer still reaches the chip -- renderEvent is not gone');
  assert.doesNotMatch(html, /STANDUP/, 'the consumer renderer ran');
});
```


Expected: `check-api: 38 … across 58`; behaviour diff **empty** (Task 10 already moved it). 37/57 → 38/58.

---

## Task 11b: `CalendarEvent` becomes a component, and gains an action panel

**Added during execution, 2026-07-25, on the maintainer's proposal.** Task 11 shipped `CalendarEvent`
as a predefined object in `api/types/`. This task moves it to `api/components/` and gives it the
per-event administrative panel Task 11 could not express. **+1/+1 -> 39/59**, which pushes Task 13
to 40/60; Constraint 3's ladder is amended accordingly.

**Why it is a task and not an amendment to Task 11.** The maintainer asked for a per-event action
panel — a group of buttons, top-right of the chip, acting on that event. Three shapes were examined
and the third was taken:

1. **A slot as a FIELD of the `CalendarEvent` object — refused twice over.** `validateTypes` in
   `scripts/check-api.mjs` accepts only `primitive` and `enum` as a field of a predefined object, so
   R1 rejects it with its own message and `check:api` carries no exception map. Independently, a
   per-event slot IS per-item projection, which the convention removed from `ActivityFeed.renderItem`
   and `Calendar.renderEvent` — and the reason is neither R1 nor R3 but that **Angular has no answer
   short of a structural directive and `ngTemplateOutlet`**.
2. **Arena draws the buttons from declared data.** Legal today only with the action set at COMPONENT
   level, because an array cannot be a field of an object either — which loses the per-event
   variation that was the point. Widening R1's *nesting* rule was proposed and **not taken**; it is
   recorded below as a live question rather than dismissed.
3. **`CalendarEvent` becomes a component.** Taken. It needs **no gate change at all**: a component
   may declare a slot, and per-item projection stops applying because the consumer instantiates
   `<CalendarEvent>` once per event instead of handing `Calendar` a render function.

**The precedent is exact, contracted, and from this same plan cycle.** `api/components/RadioGroup.json`
declares `"content": {"form": "slot", "description": "The Radios. RadioGroup injects each one's
selected state."}`; `RadioGroup.jsx` reads `child.props.value` and `cloneElement`s `name`, `checked`
and `onSelect` into each child; and `Radio.json` declares only `value`/`label`/`hint`/`disabled`, so
**the injected props are deliberately not contract members**. That is the shape `Calendar` needs in
order to inject position and colour into each `CalendarEvent`. Angular already uses the same pattern:
`error-state`, `page-head`, `empty-state`, `unauth-card` and `chart-card` all query `contentChild()`.

**The hazard this task must not create.** If the consumer places real Arena `Button`s inside the chip,
they are page-level tab stops — and Task 10 retired `focus.roving`, which requires ONE tab stop into
the grid. Arena cannot set `tabIndex` on markup it does not own. The resolution is the maintainer's
kebab: an Arena-drawn `IconButton` (`tabIndex={-1}`, reachable through Task 10's Enter step-in) whose
panel puts the consumer's buttons in the DOM **only while it is open**, with focus managed there.
A task that ships permanent consumer tab stops inside the grid has silently re-broken a requirement
that was verified one commit earlier, and `grid-keyboard.test.jsx` must be extended to catch it.

- [ ] **Step 1: Confirm and STOP.** Report the shape, and confirm against the tree — not this
  document — that `RadioGroup`/`Radio` really is the precedent described, including that the injected
  props are absent from `Radio.json`.
- [ ] **Step 2:** delete `api/types/calendar-event.json`; create `api/components/CalendarEvent.json`
  with `id`, `title`, `start`, `end`, `colorId` (enum `CatSlot`) — migrated unchanged from the type —
  plus the panel members. `CatSlot` stays a type.
- [ ] **Step 3:** `Calendar.events` stops being an array member and becomes the `content` slot,
  exactly as `RadioGroup` does. Every member the plan's Task 11 contracted otherwise stays.
- [ ] **Step 4:** the `CalendarEvent` quartet — `.jsx`, `.d.ts`, `.prompt.md`, a card entry — plus
  `CalendarEvent.behaviour.json`, because `check:behaviour` requires **every** component to declare.
- [ ] **Step 5:** `Calendar` reads `React.Children`, extracts props, and feeds the SAME
  `placeEvents`/`layoutDay` pipeline. **`calendar-internals.js` must not change** — that is the test
  that this is a projection change and not a rewrite. Position and colour are injected with
  `cloneElement`; `forwardRef` is needed so Task 10's `eventRefs` still reaches a DOM node.
- [ ] **Step 6:** the panel. `eventActionsEnabled`, the Arena-drawn kebab, the slot, focus managed
  while open. Extend `grid-keyboard.test.jsx` to assert the tab-stop count with a panel present, both
  closed and open.
- [ ] **Step 7:** both call sites (`calendar.card.entry.jsx`, `grid-keyboard.test.jsx`), gates, commit.

**Left open deliberately, and worth a decision of its own some day:** whether a field of a predefined
object may be an **array of a declared object**. R1's stated principle is "no functions, no slots, no
unknown bags", and an array of a declared object is none of the three, while `form: "array"` with an
object `of` already works at member level (`Tabs.tabs`, `SegmentedControl.options`). The restriction
is on NESTING alone and is plausibly an omission rather than a rule. This task routes around it
rather than answering it, and nothing else in the tree needs it today.

---

## What changed under this plan while it was being executed

**Read this before Task 12.** Three things landed between Task 11b and here that the tasks below
were written without, and two of them invalidate steps as written. Dated 2026-07-25.

### 1. A component that binds `grid` is DOM-tested BY HAND — and `Table` is one

`frameworks/react/test-dom/` was deleted for its RAM cost and then restored **minus its grid suite**,
under a standing rule adopted in its own spec and plan
(`docs/superpowers/specs/2026-07-25-tabstop-and-the-grid-testing-rule-design.md`):

> A component whose behaviour binding names the `grid` pattern is DOM-tested by hand — `bun run
> demos`, then operate the component on its own `*.card.html` page.

The rule is tied to the binding rather than to a judgement about what looks like a grid, so `Table`
inherits it with nobody having to remember. The measurement behind it: `grid-keyboard.test.jsx` alone
peaked at **164 MiB** while the other six suites together peaked at **109** — the grid cost more than
everything else combined, because its fixture was 84 cells per mount, eight mounts, 160 dispatched
keys.

**What this voids in Task 12:** its Step 2 extends `grid-keyboard.test.jsx`, which no longer exists
and must not come back; its Step 4 registers `'Table:react'` in `COVERED`, which the rule forbids.
Both are rewritten below.

**What replaces them, and it is not nothing.** Two precedents came out of `Calendar`'s half and
Task 12 should use both:

- **The static tab-stop count.** `grid-keyboard.test.jsx` opened with "a grid is ONE tab stop", and
  that assertion needs no DOM at all: a roving cursor initialises to a known cell, so a static render
  carries exactly one `tabindex="0"`. It now lives in `frameworks/react/test/calendar.test.jsx` and
  is the only automatic guard `Calendar`'s exceptionless binding has. `Table` gets the same.
- **A non-grid sub-component may still have a render suite.** `CalendarEvent` binds `button`, not
  `grid`, so its keyboard route is pinned in
  `frameworks/react/test-dom/placement-and-branches.test.jsx` — a chip mounted alone costs none of
  the RAM the rule exists to avoid. The rule excludes grids, not everything near one. `Table` has no
  such sub-component today, which is worth stating in the report rather than leaving implicit.

**One warning carried from `Calendar`, because it cost two Critical defects there.** The static
tab-stop count is satisfied by a control that has NO `tabindex` at all — removing one makes the count
*more* correct while making the control unreachable. And happy-dom's `focus()` focuses non-focusable
elements, so a render suite would not have caught that either. If `Table` gains any focusable element
that is not a cell, assert its `tagName` and its `tabindex` rather than calling `focus()` and
believing `activeElement`.

### 2. `check:api` is at 39/59, not 37/57

Task 11b — `CalendarEvent` became a component and `Calendar.events` became the `content` slot — added
a contract this plan did not originally schedule. Constraint 3's ladder is already amended. **Task 12
contracts nothing and holds at 39/59; Task 13 is +1/+1 to 40/60.**

### 3. `Button` has a `tabStop` member, and Task 13 is about to remove its only consumer

`tabStop` was added to `Button` and `IconButton`: a boolean that writes `tabindex="-1"`, and only the
second global HTML attribute Arena admits as a contract member after `id`. Its spec names **this
plan's Task 12** as the reason `Button` has it at all:

> `Table`'s actions column draws `Button`s; it is what the removed `TableColumn.render` drew at its
> call site. The moment `Table` is a grid with a roving stop, a `Button` inside a row is exactly this
> case.

**That claim and Task 13 contradict each other, and the contradiction is live.** Task 13 removes
`TableColumn.render` under the per-item convention, and its own Step 1 says an actions column then
has "no expression in the contract at all" — so after this batch no `Button` sits inside a `Table`
cell and `Button.tabStop` has no in-tree consumer whatsoever. One of three things has to be true, and
it is the maintainer's call:

- **`Table` gains a contracted way to put Arena's own controls in a cell**, and Task 11b established
  the shape: make the item a component. `RadioGroup`/`Radio` and now `Calendar`/`CalendarEvent` are
  two shipped precedents for a parent whose items are a sibling component projected as a slot. It
  needs no gate change, because a component may declare a slot and per-item projection stops applying
  the moment the consumer instantiates one element per item.
- **`Button.tabStop` stays with no consumer**, and the `tabStop` spec's justification is corrected to
  say so rather than naming a task that removed it.
- **The actions column is out of scope**, and both facts are recorded as they are.

**Task 13's Step 1 must lead with this**, beside the cost it already leads with.

---

## Task 12: Table — keyboard navigation and compliance

**Files:** modify `frameworks/react/components/display/Table.jsx`,
`frameworks/react/components/display/Table.behaviour.json`,
`frameworks/react/components/display/Table.prompt.md` (the by-hand checklist);
create `frameworks/react/test/table.test.jsx` (the DOM-FREE suite); regenerate the `.js` sibling.
**`scripts/check-compliance.mjs` is NOT in this list any more** — see *What changed under this plan*.

**Interfaces:** produces the settled markup Task 13 contracts. **Contracts nothing** — `check:api`
stays **39/59**.

> **Constraint 33 governs this task.** `Table` has two layouts. The wide one is a real `<table>` and
> the `grid` pattern is about it. Below `--bp-md` it is one card per row — a list, not a grid — and
> the binding cannot say "this requirement applies in one variant", which is the limit `Skeleton`
> already proves and this plan does not fix. The narrow layout keeps an exception whose reason names
> the variant, and the suite asserts against the wide layout specifically, the way `Skeleton`'s does
> against `circle`.

- [ ] **Step 1: Confirm and STOP.** Report which of the eight `grid` requirements the wide layout will
  satisfy, which keep a variant-named exception, and how the suite forces the wide layout (`Table`
  chooses by measuring its **container**; `useContainerWidth` returns `null` before measurement and
  `null` means the wide branch, so a bare mount in happy-dom already gets it — verify that rather than
  assuming, and if it does not hold, pass `responsive={false}`).

- [ ] **Step 2: Write what a STATIC render can prove**

`Table` binds `grid`, so it gets no render suite: the rule in *What changed under this plan* is
absolute and `COVERED` cannot list it. What is left is a DOM-free suite plus a person, and the split
is not arbitrary — `frameworks/react/test/table.test.jsx` takes everything that is a property of the
MARKUP, the checklist takes everything that is a property of BEHAVIOUR.

Static, and therefore automatic:

```jsx
/* A grid is ONE tab stop, and that count needs no DOM: the cursor initialises to
 * a known cell, so a static render carries exactly one tabindex="0". This is the
 * assertion recovered from the deleted grid-keyboard suite, and for Table as for
 * Calendar it is the ONLY automatic guard behind a binding that claims the grid
 * pattern. Assert it on the WIDE layout, which is what the pattern is about. */
test('a Table renders exactly one tab stop', () => {
  const html = renderToStaticMarkup(<Table columns={COLUMNS} rows={ROWS} responsive={false} />);
  assert.equal((html.match(/tabindex="0"/g) || []).length, 1, 'a Table is not one tab stop');
});
```

Plus, in the same file: `role="grid"` is present and carries a name; every `<th>` is a
`columnheader` and every `<td>` a `gridcell`; and the narrow layout renders no `role="grid"` at all,
which is what makes Step 4's variant-scoped exception verifiable rather than merely asserted in prose.

**Do not call `assertPattern` here.** It lives in `frameworks/react/test-dom/assert-pattern.jsx` and
needs a rendered tree; a DOM-free suite cannot use it, and `Table` may not have a DOM suite.

- [ ] **Step 2a: Write the by-hand checklist into `Table.prompt.md`**

Model it on `CalendarEvent.prompt.md`'s "Verifying the panel by hand" section, which exists and is
the house shape. Name at minimum: Tab reaches the table once and one more Tab leaves it; arrows move
by cell and clamp at all four edges; Home/End within a row; Enter activates a row when `rowClick` is
wired; and the narrow layout, which is a list and must answer none of it. **A rule that says "tested
by hand" and produces no written checklist is a rule that says "not tested".**

- [ ] **Step 3: Run it and watch it fail**, then implement in `Table.jsx`: `role="grid"` and an
  `aria-label` on the `<table>` (the binding's `roles.label` exception records that the file has zero
  `aria-` attributes of any kind — that becomes false here, and a `Table` with no caption needs a name
  from somewhere; decide whether it comes from a new member and, if so, say so, because **a new member
  is Task 13's contract and must be reported to the maintainer before this task adds it**).
  `role="row"` on each `<tr>`, `role="columnheader"` on each `<th>`, `role="gridcell"` on each `<td>`,
  the same cursor-state roving `tabIndex` Task 10 uses, and an `onKeyDown` handling the arrows plus
  `Home`/`End` plus `Enter` when `onRowClick` is set.

- [ ] **Step 4: Retire only what is true. Do NOT touch `COVERED`.**

Delete from `Table.behaviour.json` only the exceptions the wide layout now satisfies; a requirement
met in one layout and not the other keeps its exception with a reason NAMING THE VARIANT (Constraint
33). `'Table:react'` cannot be registered — `check:compliance` requires a suite in a directory
`Table` is barred from — so its binding, like `Calendar`'s, will claim what only a person has
checked. Say that plainly in the report, and expect `check:compliance` to stay at **6 of 64**.

- [ ] **Step 5: Gates and commit**, same list as Task 10, plus the Constraint 31 statement about
  `table-avatar.card.html`'s box — that card renders the table twice, once in a 340px container, so
  the narrow layout is on screen and any change to it is visible.

---

## Task 13: Table — the API contract

> **SUPERSEDED, AND EXECUTED DIFFERENTLY. Read this before the steps below.** Dated 2026-07-25,
> shipped as commits `6ab8d7e` + `5f0ebea`. The steps that follow are kept for the four fixes they
> diagnose, which were all real; what changed is the answer to the largest of them.
>
> The maintainer refused the loss this task's Step 1 asks them to confirm — *"an actions column has
> no expression in the contract at all"* — and chose the shape **Task 11b** established for
> `Calendar`/`CalendarEvent` instead: **make the item a component.** `Table` is now a compound
> component. The consumer writes one `<TableRow>` per row and one `<TableCell>` per cell, and a
> cell's content may be a value **or one of Arena's own components**. Per-item projection stops
> applying for the same reason it stopped for `CalendarEvent` — the consumer instantiates one
> element per item rather than handing Arena a render function — so this needed **no gate change and
> no new form**. `Badge` and `Button` stay in their cells; the Console's Details button was never
> deleted.
>
> What that changes against the steps below:
> - **Three contracts, not one: `Table`, `TableRow`, `TableCell`. The ladder is +3/+3 → 42/62**,
>   not +1/+1 → 40/60. Task 15's register must say so.
> - **`TableColumn` keeps only configuration** — `header`, `align`, `width`, `mono`, `mobileLayout`.
>   Step 2's `key` is gone as well as its `render`: a column no longer reads a field of a row object,
>   because there is no row object.
> - **`rows` is gone entirely**, so Step 3's `"rows": {"form": "array", "of": "consumerData"}` was
>   never written, and `Table` takes no consumer data at all.
> - **`getRowKey` is removed rather than kept.** The maintainer had answered `functionInput`, before
>   the compound shape was chosen; under it the consumer writes `key` on their own `<TableRow>`,
>   which is React's reconciliation and no member of any contract. Keeping it would have needed
>   `Table` to declare `"kind": "input"` — false — or `check:api`'s rule widened.
> - **`onRowClick` does not shed its index; it is replaced.** Row activation is `TableRow`'s `click`,
>   with **no payload**, for the reason `CalendarEvent.click` already records: the consumer wrote the
>   element, so they hold the row in a closure.
> - **`check:compliance` reads 6 of 66, not 6 of 64.** `TableRow` and `TableCell` are React
>   components, so they declare, and the denominator counts declarations. Nothing entered `COVERED`;
>   `Table` is still barred from a render suite by the grid rule.
> - Two gates needed a line each and both were the right kind of break: `check:states`'
>   `SOURCE_OVERRIDES` (the row hover moved to `TableRow.jsx`) and `behaviour-contracts.test.mjs`'
>   literal React inventory count, 44 → 46.
>
> Verified in real Chromium after the rewrite, since the whole DOM changed: one tab stop, all four
> edges clamping, `Home`/`End` inside the row, `Enter` firing the row's own `click`, a control in a
> cell reachable in ONE Tab press in both directions, a row carrying **fewer cells than there are
> columns** clamping against what is really there, and the Delivery Console rendering four `Details`
> buttons inside cells with no page errors.

**Files:** create `api/types/table-column.json`, `api/components/Table.json`,
`frameworks/react/test/table.test.jsx`; modify the quartet,
`frameworks/react/components/display/table-avatar.card.entry.jsx`,
`frameworks/react/ui_kits/console/ProjectScreen.jsx`; regenerate.

**Interfaces:** consumes Task 6's R3. Produces `TableColumn`. **+1/+1 → 40/60. This completes the
batch.** (39/59, not 38/58, is the starting pair — Task 11b added a contract this plan did not
originally schedule.)

> **Table needs four fixes, in this order, and the first three are invisible until the one before it
> lands.** (1) the `<T>` generic is erased — `TableColumn<T>` throws `unreadable type annotation` and
> nothing else in the file is even reached; (2) `TableColumn.render` is **removed** under the
> per-item convention (Task 6); (3) `getRowKey` returns `React.Key`, an R4 platform type;
> (4) `onRowClick` is `(row: T, i: number) => void`, and an event takes **one** payload.

- [ ] **Step 1: Confirm and STOP.** Report all four; **lead with the two things the maintainer must
  decide before anything is written** — the cost below, and the `Button.tabStop` contradiction set out
  in *What changed under this plan*, item 3, which this task is what makes live. Lead with the cost
  because
  this is where the batch's largest capability loss lands and the maintainer must see it priced
  before it ships rather than after:

  > **Removing `TableColumn.render` removes the badge from every status cell and the button from
  > every actions cell.** Measured in the tree: `ProjectScreen.jsx` uses it twice — once for
  > `<Badge tone dot>` and once for `<Button variant="ghost" size="sm">Details</Button>` — and
  > `table-avatar.card.entry.jsx` once more for a `Badge`. Those are the two commonest things anyone
  > puts in a table cell, and the Delivery Console uses both. A status column now needs a member
  > Arena draws from, and **an actions column has no expression in the contract at all**. The
  > decision is settled — the convention that removed `ActivityFeed.renderItem`, whose reason is
  > Angular rather than R3 — and the maintainer confirmed it. Confirm it once more here, because the
  > earlier confirmation was given before this cost had been measured.

  Two member decisions the four fixes force:

  - **`getRowKey` — recommend removing it entirely.** Its return is a platform type; narrowing it to
    `string` keeps a member whose only job is to compute React's reconciliation key, which is a React
    concern and not an API capability. The component already falls back to the row index. If it stays,
    it is `(row: consumerData) => string`, a `functionInput` — **which `Table` may not carry**
    (Constraint 29, not a data-entry control). So it is remove, or it is a contract-vocabulary problem
    with no legal shape. **This is a real decision and it is the maintainer's.**
  - **`onRowClick` sheds its index.** An event carries one payload; the payload is the row
    (`consumerData`). A consumer needing the index reads it from the row.

  Also confirm whether Task 12 added an `aria-label`-bearing member and, if so, that it is contracted
  here.

- [ ] **Step 2: `TableColumn`, non-generic and with no renderer**

```json
{ "name": "TableColumn", "kind": "object",
  "description": "One column of a Table. Arena draws every cell: a column says which field it reads and how the value is set, never what markup goes in it.",
  "fields": {
    "key": { "form": "primitive", "type": "string", "required": true, "description": "Which field of the row this column reads." },
    "header": { "form": "primitive", "type": "string", "required": true, "description": "The column's label." },
    "align": { "form": "enum", "type": "CellAlign", "default": "left", "description": "How the cell's content aligns." },
    "width": { "form": "primitive", "type": "string", "description": "A CSS width for the column. Omit to let the table distribute." },
    "mono": { "form": "primitive", "type": "boolean", "default": false, "description": "Draw the value in the mono face and the gold ink — for identifiers and figures." },
    "mobileLayout": { "form": "enum", "type": "TableCellLayout", "default": "row", "description": "How the column renders in card mode: a label/value pair, or full width with no label." }
  } }
```

**`render` is absent, and its absence is the point.** R1 makes a predefined object pure data with
known fields, so a renderer could never have been a field of one — the same reason `ToastAction`'s
`onClick` is decomposed in Task 8. This plan once offered two ways to keep per-column rendering
anyway; **both are withdrawn**, because the per-item convention removes the member rather than
relocating it. **Do not reintroduce it as a `cell` slot on `Table` itself** — that is the same shape
one level up, and it would make `Table` the exception that reopens per-item projection for the whole
library.

`width` also narrows from `number | string` to `string` — a union between two primitives is still a
union (R5). `CellAlign` (`left center right`) and `TableCellLayout` (`row block`) are two more new
enums; write them.

- [ ] **Step 2a: Rewrite the three call sites BEFORE writing the contract**, because until they stop
  passing `render` the demos draw nothing where a badge and a button used to be, and a later step
  would be judging a broken page. For each, decide and record what replaces it: a status column
  becomes a value Arena draws (the row already carries the status string; `mono` and `align` are the
  only levers a column has left), and the actions column has **no contracted expression at all** —
  say plainly in the report what the Console's Details button became, because that is the loss made
  concrete and Task 15's CHANGELOG must name it.


- [ ] **Step 3: The contract**, reflecting Step 1's decisions:

```json
{
  "component": "Table",
  "description": "Data table on the density tokens. Below --bp-md it becomes one card per row, measured on its own container rather than the viewport.",
  "api": {
    "columns": { "form": "array", "of": "TableColumn", "required": true, "description": "The columns, in order." },
    "rows": { "form": "array", "of": "consumerData", "required": true, "description": "The rows. Arena routes each one and never inspects it." },
    "empty": { "form": "slot", "description": "What shows when there are no rows." },
    "responsive": { "form": "primitive", "type": "boolean", "default": true, "description": "Card mode below --bp-md. Set false only when the columns are meaningless apart." },
    "rowClick": { "form": "event", "payload": "consumerData", "description": "A row was activated by click or Enter; carries the row." }
  }
}
```

Plus whichever of Step 2's (A) or (B) won. Note `rows` is `array of consumerData` — the eighth form's
original motivating case, and `rowClick`'s payload plus the `cell`/`render` slot parameter are the
routes back out the gate requires (a contract taking consumer data in with no route is rejected).

- [ ] **Step 4: Migrate the quartet.** The `.d.ts` loses `<T = any>` from both interfaces and the
  function; Constraint 9 keeps `TableColumn`'s re-export (now non-generic — a breaking change for any
  consumer writing `TableColumn<Deploy>`, and there is none in-tree). Drop `style`.

- [ ] **Step 5: Fix both call sites**, which each pass `columns` arrays carrying `render` and both pass
  `getRowKey`. `ProjectScreen.jsx` has two `render` functions. Then
  `bun run build:demos && bun run check:demos` — the Console is covered.

- [ ] **Step 6: Suite, R4 proofs, prompt, README, gates, commit.**

The suite must prove the REMOVAL, exactly as Task 11's does for `renderEvent`: a column carrying a
`render` function reaches nothing and the cell draws the row's own value instead. A removal nothing
asserts is a removal that can come back — `check:api` reads the `.d.ts` and would stay green if the
`.jsx` quietly kept honouring it.

Expected: `check-api: 40 … across 60`; behaviour diff empty. 39/59 → 40/60. **This completes the seven
migrations of batch 8C3** — eight contracts in all, once Task 11b's `CalendarEvent` is counted.

---

## Task 14: Divergences and the citation sweep

**Files:** modify `components-divergences.md` (read first).

- [ ] **Step 1: Re-read and classify.** `wc -l components-divergences.md`; find headings naming the
  seven. Classify each API (delete) / rendering (keep) / behaviour (keep). Task 7 of 8C2 found the
  form controls appeared only in the box-model table; **this batch is different** — `Table` and
  `SideNav` have real per-component sections there. Read them.

- [ ] **Step 2: Check citations.** `grep -rn "components-divergences" --include='*.json' --include='*.ts'
  --include='*.md' --include='*.jsx' . | grep -v node_modules`. Three bindings and one Angular
  primitive cite it by section name; a deletion that orphans a citation breaks it.

- [ ] **Step 3: Sweep for dead references** (Constraint 21) to every removed or renamed member: the
  bare-string `tabs`/`options` arms, `ToastAction`, `TableColumn<T>`, `TableColumn.key`,
  `TableColumn.render`, `Table.rows`, `getRowKey`, `onRowClick` (removed outright, not narrowed —
  see Task 13's superseded note), `CalendarEvent.meta`, `React.CSSProperties` on the seven, and
  `Tooltip`'s renamed slots.
  **Add everything Task 11b moved, which this list predates:** `Calendar.events` (an array member
  that became the `content` slot, so every `events={...}` in prose is now wrong), `Calendar.eventClick`
  and its `onEventClick` binding (removed — `CalendarEvent.click` replaced it, with no payload), and
  `renderEvent`. Also sweep for `Calendar` prose asserting a required `timeZone`: it is optional now
  and defaults to the reader's resolved zone.
  A hit in a **contracted** component is this task's to fix; a hit in an **uncontracted** one
  (`Dialog`, `Menu`, `Pagination`, `SideNav`) is expected — record which is which.

- [ ] **Step 4: Commit only if something changed.** Otherwise record "no change" in the ledger.

---

## Task 15: Close-out

**Files:** modify the spec, `CHANGELOG.md`, `CLAUDE.md`; delete the executed 8C2 plan.

- [ ] **Step 1: Full sweep once**

```bash
cd /home/juan/Dravensoft/Identity
export CHROME_PATH=/usr/bin/chromium
bun run check
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun run test:react-dom 2>&1 | tail -3   # NOT `bun test <dir>` — it needs the --preload
```

Expected: all 23 steps PASS. Reconcile both counts against the per-task deltas in the ledger.

**The isolated DOM process no longer reconciles against this plan's deltas alone, and that is
expected rather than a defect.** It was deleted outright and then restored minus its grid suite,
under the rule in *What changed under this plan* — so its count reflects that round trip plus
`CalendarEvent`'s keyboard route, none of which is a task in this plan. Reconcile it against the
ledger's own entries for those, not against Tasks 5/10/12. Task 10's `grid-keyboard.test.jsx` is
GONE and Task 12 adds nothing to that directory; if either appears there, something has re-broken the
rule. If a delta does not reconcile, stop and find out why.

- [ ] **Step 2: Whole-branch review** (Constraint 23). Read `git diff main...HEAD` against: do the
  seven agree on how a tone enum is named and when a size enum is shared rather than declared?; is
  every member `description` consistent across contract / `.d.ts` / `.prompt.md`?; is any new enum
  value-identical to an existing one?; did any suite weaken a title?; does the climb reconcile
  32 → 34 → 36 → 37 → 38 → 39 (Task 11b) → 40?; is `functionInput` still only in `Input`?; is every parameterised slot
  a `slot` with `params` and never the ninth form? Fix findings in their own commits.

- [ ] **Step 3: Spec.** Add the 8C3 running-count row (**both** processes — the isolated one moves for
  the first time, so the row's second column is no longer `26 across 5`). Add a register paragraph:
  what was contracted, **32/52 → 42/62** (39/59 of it by Task 12, since Task 11b added one this
  plan did not schedule, and Task 13 landing as three contracts rather than one — see its superseded
  note), the four debts paid, R3 made readable, and the two components
  that gained keyboard navigation. Recount Plan C's remaining subjects rather than trusting a figure
  here: `TableRow` and `TableCell` are two new React components with delegated Angular entries, so
  the subject set moved under this very sentence.

- [ ] **Step 4: CHANGELOG**, under `## [Unreleased]` only. **Read what is already there first** —
  several of this batch's changes were written into it as they landed (`tabStop`, `CalendarEvent`'s
  action panel, the DOM-suite round trip and the grid rule), so this step is completing a record
  rather than starting one, and a duplicated entry is worse than a missing one. Two known-stale
  lines the ledger carries for this step: `CHANGELOG.md`'s 1.x entry still says a Calendar event's
  state goes on a non-chromatic channel *via `renderEvent`*, and that member no longer exists. **Added:** the parameterised slot readable;
  `id` a member of `Input` and `Textarea`; keyboard navigation on `Calendar` and `Table`.
  **Changed:** the seven contracted, with every breaking change spelled out — the bare-string `tabs`
  and `options` arms gone; `ToastAction` decomposed to `actionLabel` + `action`; `TableColumn` no
  longer generic and reduced to configuration (`key` and `render` gone); `Table.rows` gone and the
  rows written as `TableRow`/`TableCell` children; `getRowKey` gone; `onRowClick` replaced by
  `TableRow`'s payload-free `click`; `Table.label` a new REQUIRED member; `CalendarEvent.meta` gone;
  `Tooltip`'s slots renamed; `style` gone from all seven. **Fixed:** the enum event payload; the
  Angular `functionInput` parse.

- [ ] **Step 5: `CLAUDE.md`.** Record what this batch established. **Retire the debt entries this plan
  actually paid** — verify each before deleting, and narrow rather than delete any that is only partly
  paid. `Calendar`'s half of the "implement no keyboard navigation at all" entry has already been rewritten
  — Task 10 satisfied all eight requirements and the entry now records the opposite problem, that its
  exceptionless binding has no suite behind it. What is left for this step is `Table`'s half, narrowed
  to whatever Task 12 leaves unmet. **Also owed here, from the ledger:** `CLAUDE.md` still names
  `Calendar`'s per-event `meta` as one of the two cases that motivated consumer data, and that member
  is gone — `Table`'s rows remain the case that named the form, so drop the `meta` half rather than
  rewriting the paragraph, exactly as `api/README.md` was fixed in Task 11. Add any new debt: whatever Tasks 10 and 12 left unmet, and the `Tabs` binding's eight
  untouched exceptions (Appendix A). **Move any debt living only in the 8C2 plan into Known debt
  before deleting it** — check, do not assume; 8C2's own close-out found none in 8C1's.

- [ ] **Step 6: Delete the executed 8C2 plan**

```bash
cd /home/juan/Dravensoft/Identity
git rm docs/superpowers/plans/2026-07-24-8c2-api-contracts-the-six-form-controls.md
```

- [ ] **Step 7: Commit** (here-doc), append the batch summary to the ledger, report, **do not merge,
  do not push.**

---

## Appendix A: what this plan deliberately does not do

- **It does not touch Angular.** The seven are React-only until Plan D. Task 4 changes a shared reader
  and records the spelling Plan D must write; it implements nothing in Angular.
- **It does not contract the last four Plan C subjects** — `Dialog`, `Menu`, `Pagination`, `SideNav`
  are C4's.
- **It does not fix `Tabs`' behaviour binding**, which excepts all eight of the `tabs` pattern's
  requirements exactly as `Calendar` and `Table` did. Task 7 contracts its API and leaves its
  accessibility exactly as it was. **This is the plan's sharpest asymmetry** and Task 15 must record
  it: two of the three total-exception bindings are paid down here and the third is not even
  mentioned by the tasks that touch its component.
- **It does not make `Tooltip` keyboard-reachable.** Task 9 contracts it; `focus.never` stays
  excepted. `CLAUDE.md` already records that when it is fixed the focus path must reveal
  **immediately** rather than waiting `--delay-open`.
- **It does not teach the binding schema to scope an exception to a variant**, which `Table`'s two
  layouts need and `Skeleton` already proves is missing. Task 12 works around it the way `Skeleton`'s
  suite does — by asserting against one variant — and the limit stays open.
- **It does not make R3's own claim checkable, and it no longer teaches the reader R3 at all.**
  Whether a parameterised slot fills rather than replaces is a fact about the rendered tree, and the
  only gate that sees one does not read contracts. Task 6 shrank to making the reader's refusal state
  the per-item convention; should a member ever genuinely need a parameterised slot, that throw is
  where the work starts.
- **It does not close the `check:api`-reads-the-`.d.ts` hole.** Restoring `{...rest}` to any migrated
  `.jsx` would still leave the gate green; the per-component R4 suites are the only guard, which is
  why Constraint 17 insists both runs are induced separately.
- **It does not cut a release.**
