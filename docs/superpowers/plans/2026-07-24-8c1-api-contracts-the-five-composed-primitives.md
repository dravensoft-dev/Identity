# Plan 8C1 — API capability contracts, the five composed primitives

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `Spinner`, `Badge`, `Card`, `IconButton` and `Button` under the API capability
contract, taking `check:api` from 21 contracts / 41 layer implementations to **26 / 46**, and settle
in one blocking audit the seven cross-cutting decisions that govern the rest of Plan C.

**Architecture:** Plan C's subjects are the twenty-two controls Angular delegates to Material, minus
`Switch`, which 8B1 already contracted — **twenty-one components, every one React-only**. So every
contract this plan writes is a **single-layer** contract, the shape `Switch` established, and each
adds one contract and one layer implementation rather than two. There is **no Angular component work
anywhere in this plan**: no primitive, no `.variants.ts`, no NG0950, no `host-class-binding.test.ts`.
The one Angular file that moves is the generated `frameworks/angular/api.generated.ts`, because
`api/types/` emits per layer.

This batch is first among Plan C's five because its members are the ones **other components
compose**: `Button` has twelve importers including `ConfirmDialog.jsx` and `ErrorState.jsx`, `Card`
is composed by `UnauthCard.jsx`, and the Delivery Console consumes all five. Reshaping them before
C2–C5 means every later batch rewrites its call sites once rather than twice. Within the batch the
order is inverted — easiest and least-referenced first, `Button` last — so the R4 removal technique
and the single-layer contract shape are both proven on `Spinner` before they are applied to the
component twelve files import.

**Tech Stack:** Bun (build, test, gates), plain-node-portable `scripts/`, React 18 with inline
token-valued styles and no CSS classes. Angular 22 is untouched except for regenerated output.

**Spec:** `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` — *Plan C*, including its
two "Re-measured after Plan 8B4" annotations. **Normative vocabulary:** `api/README.md`.

**Branch:** `api-contracts-8c1`, cut from `main` at `7df7dc1` (the 8B4 merge). Tree clean, no commits
of its own at plan time.

---

## What this plan measured, and where it corrects the spec

Every figure below was measured against `HEAD` on 2026-07-24 while writing this plan. Where it
disagrees with the spec, the measurement wins and Task 8 corrects the spec.

- **`check:api` reads `21 contract(s) hold across 41 layer implementation(s)`.** Confirmed by
  running it. `Switch` has no `frameworks/angular/primitives/switch/` directory, which is why 21
  contracts yield 41 layers rather than 42.
- **The four unreadable subjects are confirmed, with their exact messages.** `Calendar`
  (`renderEvent`), `Input` (`validate`), `SideNav` (`onNav`, *"an event takes one payload, and this
  declares more than one parameter"*), `Table` (*"unreadable type annotation: TableColumn<T>"*).
  **None of the four is in this batch.**
- **There are NINE heritage clauses in React's `.d.ts` files, not six.** `Badge`, `Button`, `Card`,
  `Checkbox`, `IconButton`, `Input`, `Select`, `SideNav`, `Textarea`. The spec's "6" counted only
  bare `extends React.*Attributes`; the other three are wrapped in `Omit<>` (`Checkbox`, `Textarea`,
  `Input`) and `scripts/check-api.mjs` reports **any** heritage clause as the R4 `{...rest}` escape —
  which 8B4's decision D6 established with `LineChartProps extends Omit<BarChartProps, 'slots'>`.
  All nine are Plan C subjects; **four of them are in this batch** (`Badge`, `Button`, `Card`,
  `IconButton`).
- **Thirteen `.d.ts` files declare `style?: React.CSSProperties`**, matching the spec, and all
  thirteen are Plan C subjects. Taking the two sets together, **twenty of the twenty-one Plan C
  subjects carry at least one R4 escape; `Dialog` is the only clean one.** In this batch, `Spinner`
  carries `style` alone; `Badge`, `Card` and `IconButton` carry heritage alone; `Button` carries
  heritage alone. Every one of the five spreads `{...rest}` in its `.jsx`.
- **The heritage clause is not a formality — for four of the nine it is the component's real API.**
  `Input.jsx` destructures `disabled, id, className, onChange, onBlur`; `Select.jsx` destructures
  `value, onChange, disabled`; `Checkbox.jsx` and `Textarea.jsx` do the same. **None of those members
  is declared in the interface's own body** — they arrive through the heritage clause and are
  therefore invisible to the reader, which reads only the body. Flattening is not a deletion, it is
  an **enumeration decision**, and it is Task 1's D1. In *this* batch the bite is smaller and that is
  deliberate: `Badge`'s and `Card`'s heritage is `React.HTMLAttributes`, which contributes only
  global attributes, so flattening them adds **zero** members; `Button`'s and `IconButton`'s is
  `React.ButtonHTMLAttributes`, which contributes a short, enumerable element-specific set.
- **Every one of the five spreads `{...rest}` onto its root element** — verified by reading each
  `.jsx`. `Badge.jsx:11`, `Card.jsx:2`, `Spinner.jsx:45`, `IconButton.jsx:8`, `Button.jsx:32-34`.
- **`Badge.tone` is value-identical to the existing `Tone` enum** — `neutral`, `accent`, `gold`,
  `success`, `warning`, `danger`, `info`, in that order. Under 8B1's reuse rule (reuse only on an
  *identical* value set) it reuses `Tone` and declares nothing.
- **`sm | md | lg` occurs four times across Plan C** (`Spinner.size`, `ProgressBar.size`,
  `IconButton.size`, `Button.size`) and is value-identical in all four. It becomes one shared enum,
  created in this batch. It is **not** value-identical to `LogoSize` (`sm|md|lg|xl`), `AvatarSize`
  (`xs|sm|md|lg`) or `SwitchSize` (`sm|md|lg|xl|2xl`), so none of those is reusable.
- **Two `COVERED` entries are Plan C subjects, and neither is in this batch** — `Dialog:react`
  (C4) and `Menu:react` (C3). Recorded here because each shares its test file with an
  **already-contracted Plan B** component (`dialog-modal.test.jsx` also holds `ConfirmDialog:react`;
  `placement-and-branches.test.jsx` also holds `Skeleton:react`), so those batches carry a firm-contract
  risk this one does not. **None of this batch's five components is in `COVERED`.**
- **All five bind their behaviour pattern with `"exceptions": []`** — `Button` and `IconButton` bind
  `button`, `Spinner` binds `status`, `Badge` and `Card` bind `none` with a `reason`. That is the
  strongest binding shape in the repository. Global Constraint 6 requires all five to leave the
  branch with an empty diff.
- **`components-divergences.md` is 906 lines**, and only three of its headings name a subject of this
  batch or of Plan C at all: `:246` *"The Angular layer has no Button primitive"*, `:840`
  *"UnauthCard's `panel` hand-duplicates Card's surface classes"*, `:868` *"SideNav is described
  three times"*. **None of the three is an API divergence**, so unlike every Plan B batch this one
  deletes no entry. Do not write a figure derived from this file into `CLAUDE.md` or the spec — it
  has drifted every time a batch touched it.
- **`.superpowers/` exists and is EMPTY.** There is no `sdd/` directory and no ledger to archive.
  Task 0 creates both from nothing; the archive step every Plan B batch opened with does not apply.
- **The merged-process baseline is 958 tests across 85 files; the isolated DOM process is 26 across
  5.** Measured by running both. This matches the spec's Plan B4 row exactly.
- **The discriminating assertions in this plan's worked tests were run against real renders before
  being written down**, which is 8B4's clearest self-inflicted lesson — it shipped three plan-supplied
  tests that did not discriminate. Verified on 2026-07-24 by rendering each component at `HEAD`:
  `renderToStaticMarkup(<Button variant="danger">…)` serialises `…;background:transparent`, so the
  substring matches literally; `50%` appears in `Badge` **only** when `dot` is set, because the root
  uses `--r-pill`; `var(--bone-dim)` is absent from a `danger` badge, so the tone assertion cannot be
  satisfied by the neutral default; `var(--fs-h4)` is absent from an action-only `Card`, so it
  discriminates the header's title branch from the header itself; `Spinner`'s `sm` and `lg` emit
  `var(--icon-sm)` and `var(--sp-8)` respectively. **And both R4 escapes reach the root today** — a
  consumer `style` and a stray attribute both survive into the rendered markup on every one of the
  five — so each R4 test genuinely goes red before it goes green. This does **not** exempt any task
  from Global Constraint 18: run them anyway, and fix the test rather than the title.
- **`frameworks/react/test-dom/tooltip-timer.test.jsx` exists** and its header reads *"This file is
  that debt paid"*. `CLAUDE.md`'s first *Known debt* bullet — *"`Tooltip`'s timer … has no test"* —
  is therefore stale. Task 8 retires it. This is not this batch's work in any other sense; it is
  recorded because Task 8 edits `CLAUDE.md` anyway and a stale debt entry is the exact failure that
  section exists to prevent.

---

## Global Constraints

Every task's requirements implicitly include this section. Constraints 1–13 are 8B4's, carried
forward in substance because each was earned. 14–24 are new to this plan and each names the
measurement or the lesson that produced it.

1. **English only.** All code, comments, docs, contract `description`s and UI copy in the repo are
   English. Conversation with the maintainer is Spanish; the repo is not.
2. **Task 1 is a single blocking audit and it STOPS.** It presents, in one exchange, the seven
   decisions D1–D7 with their costs, and **the decision is the maintainer's**. No source file is
   written until they answer. Tasks 2–6 each open with a short **confirmation** step that also
   blocks but must not re-litigate a Task 1 decision.
3. **`check:api` climbs and never drops:** 21/41 → **22/42** (Task 2) → **23/43** (Task 3) →
   **24/44** (Task 4) → **25/45** (Task 5) → **26/46** (Task 6). Record the measured pair in
   `.superpowers/sdd/progress.md` at the end of every task. **Each step is +1/+1, not +1/+2** —
   every contract in this plan is single-layer, because Angular implements none of the five.
4. **`check:api` carries no exception map.** An API divergence is a defect. There is nowhere to
   record one, by design.
5. **`api/README.md` is the normative vocabulary and this plan may extend it, never contradict it.**
   Task 1 writes into it the decisions that govern C2–C5, the way Plan 8B0 wrote the single-icon and
   per-item conventions into it, so a later batch cites rather than re-derives.
6. **The other two contracts are firm** (`api/README.md`). Bringing a component under contract may
   not weaken, remove or contradict its behaviour binding or the tokens it renders from. **All five
   `*.behaviour.json` files come out of this branch with an empty diff.** Verify per task with
   `git diff --stat -- '*.behaviour.json'`. Two of the five bindings state a *reason* that this
   plan's reshapes must keep true: `Badge`'s says *"There is no onClick, no focusable element and no
   role anywhere in the file"* — so Badge gains **no** event; `Card`'s says its interactive content
   comes from *"`children` or `action`, both caller-supplied content"* — so both stay slots.
7. **The binding table is mechanical** (`api/README.md`, `bindingName()` in `scripts/check-api.mjs`):
   a primitive/enum/object/array member `x` is a React prop `x`; the slot named `content` is React's
   `children`; a slot named `x` is a node-valued prop `x`; an event named `x` is a function prop
   `onX`. **The Angular column of that table is not exercised anywhere in this plan.**
8. **Required-ness is contracted** for the four inbound non-slot forms only, and **it also governs
   runtime**: a required member must fail hard when absent rather than render with a missing value.
   The established React idiom is `frameworks/react/components/feedback/EmptyState.jsx:4` —
   `if (!title) throw new Error('EmptyState: \`title\` is required');`. The gate cannot see the
   runtime half; the audit enforces it. Slot and event required-ness are **not** compared.
9. **`react/.d.ts` re-export rule.** A migrated `.d.ts` re-exports **exactly** the named types the
   pre-migration file declared and exported locally — no more, no less. Measured for this batch:
   **none of the five declares a named exported type today** (all five spell their unions inline in
   the interface body), so **no file in this plan re-exports anything**. Verify per task rather than
   trusting this sentence.
10. **A contract type is imported with `import type`**, specifier `'../../api.generated'` from
    `frameworks/react/components/<group>/`.
11. **Any `.jsx` or `.entry.jsx` edit is followed by `bun run build:demos`, and the regenerated `.js`
    sibling is committed in the same commit.** Verified with `bun run check:demos`. **`build:demos`
    covers `frameworks/react/ui_kits/console/` as well as `frameworks/react/components/`** —
    `scripts/build-demos.mjs:64` declares both roots — and the Console consumes all five of this
    batch's components, so every task in this plan touches it.
12. **`bun run check` runs exactly ONCE**, in Task 8, when implementation is finished. Individual
    gates run per task, listed in each task's gate step.
13. **Do not merge and do not push.** The branch stays local until the maintainer asks.
14. **`export CHROME_PATH=/usr/bin/chromium` before running `bun run check`.** Measured on this
    machine: Chromium is installed there and `CHROME_PATH` is unset, so without it `check:cards`
    reports SKIP and the whole run reports INCOMPLETE — which reads as a failure of whatever was just
    changed and is not. Any "all 23 steps PASS" this plan claims must be obtained with it exported.
15. **Test the layer you changed.** Of the five, only `Card` has a React suite today
    (`frameworks/react/test/card.test.jsx`, two tests). Tasks 2, 3, 5 and 6 each create one; Task 4
    extends the existing one.
16. **A task that removes an R4 escape ships a test proving the escape is gone, and it must
    DISCRIMINATE.** `check:api` reads React's `.d.ts` and never opens the `.jsx`, so restoring
    `style` and `{...rest}` leaves the gate green. **All five components in this batch carry
    `{...rest}` in the `.jsx`, and `Spinner` also carries `style` in its `.d.ts`; the other four
    inherit `style` through their heritage clause and merge it anyway** (`Badge.jsx:16`,
    `Card.jsx:7`, `IconButton.jsx:22` all end their root style object with `...style`; `Button.jsx`
    does at line ~78; `Spinner.jsx:45` does). So the two-assertion test applies to **all five**.
    Render the component passing an unexpected `style` **and** an unexpected attribute, and assert
    each is absent **in its own assertion**.
    `style={{ color: '#ff00ff' }}` is safe for `check:dimensions`: `color` is not in that gate's
    `PROPS` set (`scripts/check-dimension-literals.mjs:69-80`). **Note that `check:dimensions` walks
    all of `frameworks/`, test directories included, skipping only `.d.ts`** (`walk()` at
    `scripts/check-dimension-literals.mjs:761`), so a test asserting on a governed property with a
    bare number would fail the gate. Assert on `color` and on attribute names, never on a length.
17. **The non-vacuity proof needs TWO separate runs, induced asymmetrically.** This is 8B4's
    Constraint 17 as corrected in its own Task 2, and the correction is the point: `node:assert`
    throws on the first failing assertion, so one run exercises exactly one; and restoring `{...rest}`
    *alone* also fails the **style** assertion, because with `style` no longer destructured it falls
    into `rest` and reaches the root anyway. So:
    1. `style` destructured **and merged** into the root's style object, no `{...rest}`. Expect a
       failure on *"a consumer style reached the rendered root"*.
    2. `style` destructured and **not** merged, `{...rest}` spread onto the root. Expect a failure on
       *"a consumer attribute reached the rendered root"*.

    Then restore and confirm the file is **byte-identical** with `sha256sum` before and after — not a
    visual check — and the suite green again.
18. **A test title states exactly what the body asserts, and the worked test code in this plan is a
    starting point, not a verified artifact.** Run it; if it does not discriminate, fix the test
    rather than narrowing the title. 8B4's own retrospective names three defects it shipped this way
    — an assertion the sibling markup also satisfied, arithmetic computed in the head, and comments
    describing a harness that had already changed.
19. **`README.md` is the normative design specification and moves in the same change as the
    component** (`CLAUDE.md`). Its Button/Card/Badge prose must be read before a task claims it needs
    no edit. Find it with `grep -n 'Button\|Badge\|Card\|Spinner\|IconButton' README.md` and **report
    the check either way**, in every one of Tasks 2–6.
20. **A member `description` lives in the contract only.** Nothing generates from
    `api/components/*.json`. Each layer's doc comment and the component's `.prompt.md` restate it by
    hand and nothing holds the three in step. Restate it anyway; do not leave a `.prompt.md`
    describing `icon={<i …/>}` after the member became a string.
21. **A citation sweep uses a broad `--include`, not `.ts` and `.html` alone.** Plan 8B3 left a dead
    citation in a `.md` and only the final whole-branch review caught it. When a member name changes,
    sweep with
    `grep -rn '<oldName>' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.json' --include='*.md' --include='*.html' .`
    and read every hit.
22. **Do not write a derived figure into a normative document.** Line counts, test counts and file
    counts belong in this plan and in the ledger, which are deleted; `CLAUDE.md` and the spec get the
    *method of measuring*. 8B4 had to correct three such figures, one of them inside a paragraph
    warning against writing them.
23. **Budget the final whole-branch review as real work, not a formality.** Plan 8B3's found four
    findings and 8B4's found three, and in both cases **every one was a comparison BETWEEN tasks that
    no per-task review could have made**. This batch's specific cross-task risk is named: five
    components each independently decide how to render an icon, how to name a default slot, and which
    native attributes survive, and only a whole-branch pass can see whether the five answers agree.
24. **No Angular component work exists in this plan, and a task that finds itself editing one has
    gone wrong.** The only Angular file that changes is the generated
    `frameworks/angular/api.generated.ts`. `bun run check:angular` still runs per task, because
    `frameworks/angular/index.ts` re-exports `api.generated.ts` and `tsconfig.check.json` pulls it
    into `ngc`'s program — so a contract type that fails to resolve breaks that gate even with no
    hand-written Angular change.

---

## File Structure

Created by this plan:

| Path | Responsibility |
|---|---|
| `api/types/control-size.json` | The `ControlSize` enum — `sm`/`md`/`lg`, shared by Spinner, IconButton, Button, and by ProgressBar in C4 |
| `api/types/spinner-tone.json` | The `SpinnerTone` enum — `accent`/`gold`/`neutral`/`on-accent` |
| `api/types/button-type.json` | The `ButtonType` enum — `button`/`submit`/`reset`, shared by IconButton and Button |
| `api/types/icon-button-variant.json` | The `IconButtonVariant` enum — `ghost`/`solid` |
| `api/types/button-variant.json` | The `ButtonVariant` enum — `primary`/`secondary`/`ghost`/`danger` |
| `api/components/Spinner.json` | Task 2's neutral contract |
| `api/components/Badge.json` | Task 3's neutral contract |
| `api/components/Card.json` | Task 4's neutral contract |
| `api/components/IconButton.json` | Task 5's neutral contract |
| `api/components/Button.json` | Task 6's neutral contract |
| `frameworks/react/test/spinner.test.jsx` | React render proof for Task 2 |
| `frameworks/react/test/badge.test.jsx` | React render proof for Task 3 |
| `frameworks/react/test/icon-button.test.jsx` | React render proof for Task 5 |
| `frameworks/react/test/button.test.jsx` | React render proof for Task 6 |

Regenerated (committed generated output, guarded by `check:api`'s drift assertion):
`frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`.
Regenerated by `bun run build:demos` (guarded by `check:demos`): the `.js` sibling of every `.jsx`
touched, under both `frameworks/react/components/` and `frameworks/react/ui_kits/console/`.

Modified, per component:

| Layer | Files |
|---|---|
| React | `frameworks/react/components/<group>/<Name>.d.ts`, `<Name>.jsx`, `<Name>.prompt.md` |
| Demos | the `*.card.entry.jsx` files that call it (measured per task) |
| Console | `frameworks/react/ui_kits/console/*.jsx` that call it (measured per task) |

Modified in Task 1: `api/README.md`.
Modified in Task 7: `components-divergences.md` (re-read, likely unchanged — see the task).
Modified in Task 8: `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`, `CHANGELOG.md`,
`CLAUDE.md`, `README.md` if any task deferred it. **Deleted in Task 8:**
`docs/superpowers/plans/2026-07-24-8b4-api-contracts-the-three-charts.md`.

---

## Task 0: Pre-flight

**Files:**
- Create: `.superpowers/sdd/progress.md`

**Interfaces:**
- Produces: a fresh 8C1 ledger every later task appends to, and a verified `21 / 41` baseline every
  later task's climb is measured against.

> **`.superpowers/` is git-ignored scratch** — the root `.gitignore:37` ignores the whole directory.
> This task **produces no commit**, and every later task's `git add -A` silently leaves the ledger
> behind, which is correct. Do not try to force it into a commit.
>
> **Unlike every Plan B batch, there is nothing to archive.** `.superpowers/` was measured on
> 2026-07-24 and is **empty** — no `sdd/` directory, no `progress.md`. The `mv` step that opened
> 8B1 through 8B4 does not apply. If a `progress.md` *is* present when this task runs, stop and
> report rather than overwriting it.

- [ ] **Step 1: Confirm there is nothing to archive, then create the directory**

```bash
cd /home/juan/Dravensoft/Identity
ls -la .superpowers/
test ! -e .superpowers/sdd/progress.md && echo "no ledger present, creating fresh" || echo "STOP: a ledger exists, report before overwriting"
mkdir -p .superpowers/sdd
```

- [ ] **Step 2: Open the 8C1 ledger**

Create `.superpowers/sdd/progress.md` with exactly this content:

```markdown
# Plan 8C1 — API capability contracts, the five composed primitives

Plan: docs/superpowers/plans/2026-07-24-8c1-api-contracts-the-five-composed-primitives.md
Branch: api-contracts-8c1
Base commit before Task 1: 7df7dc1 (main; the 8B4 merge)
(.superpowers/ was empty at plan time — no earlier ledger was archived.)

Subjects: Spinner, Badge, Card, IconButton, Button — the five primitives other components compose.
This is the FIRST batch of Plan C. Every contract is SINGLE-LAYER: Angular implements none of the
twenty-one Plan C subjects, so check:api climbs +1 contract / +1 layer per task, not +1/+2.

Task 1 is a SINGLE blocking audit whose decisions govern C2-C5 as well as this batch; the ones that
outlive it are written into api/README.md so later batches cite rather than re-derive.
Tasks 2-6 each open with a per-component CONFIRMATION that also blocks but must not re-litigate
Task 1. Task 7 is the divergences and citation pass, Task 8 is close-out.

check:api must climb 21/41 -> 22/42 -> 23/43 -> 24/44 -> 25/45 -> 26/46, never dropping.

## Pre-flight

(fill in from Step 3)

## Progress

## Maintainer decisions taken
```

- [ ] **Step 3: Measure the baseline**

```bash
cd /home/juan/Dravensoft/Identity
git status --short
git log --oneline -1
bun run check:api
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun test frameworks/react/test-dom 2>&1 | tail -3
```

Expected: clean tree at `7df7dc1`; `check-api: 21 contract(s) hold across 41 layer
implementation(s)`; 958 tests across 85 files in the merged process; 26 across 5 in the isolated DOM
process. **If `check:api` does not read exactly 21/41, stop and report** — this plan's whole
arithmetic is measured against it. The test counts are informational; record what you actually
measured rather than the expected value.

- [ ] **Step 4: Record it and stop**

Fill the ledger's `## Pre-flight` section with the four measured values. **No commit.** Report to the
maintainer and move to Task 1.

---

## Task 1: The cross-cutting blocking audit

**Files:**
- Modify: `api/README.md` (only after the decisions are taken — see Step 5)

**Interfaces:**
- Consumes: Task 0's verified 21/41 baseline.
- Produces: decisions **D1–D7** below, recorded in the ledger, that Tasks 2–6 implement without
  re-opening, and that batches C2–C5 inherit. D1, D2, D4, D5 and D6 govern components **outside**
  this batch and are therefore written into `api/README.md`.

> This task exists because five of Plan C's seven hard questions are shared across batches. Plan 8B3's
> spec states the rule it enforces: a shared decision *"should be decided deliberately in
> `BulkActionBar`'s audit rather than discovered in `CommandPalette`'s"*. With nine components sharing
> the heritage question and three sharing the union question, the only way to honour that is to decide
> them once, before any of them is contracted — which is what 8B0 did for Plan B and 8B4's Task 1 did
> for the three charts.

- [ ] **Step 1: Re-measure the five surfaces at HEAD**

Do not trust this plan's transcription. Read all ten files and confirm each member:

```bash
cd /home/juan/Dravensoft/Identity
for f in feedback/Spinner display/Badge display/Card forms/IconButton forms/Button; do
  echo "════════ $f ════════"
  cat "frameworks/react/components/$f.d.ts"
  grep -n "^export function\|\.\.\.rest\|\.\.\.style" "frameworks/react/components/$f.jsx"
done
```

The measured state at plan time, to check against. **"body" means declared in the interface's own
body and therefore visible to the reader; "heritage" means reachable only through the `extends`
clause and therefore invisible to it.**

| Component | Heritage clause | Declared in body | Reached via heritage / `{...rest}` |
|---|---|---|---|
| `Spinner` | none | `size?`, `tone?`, `label?`, `style?` | `{...rest}` in `.jsx` only |
| `Badge` | `React.HTMLAttributes<HTMLSpanElement>` | `tone?`, `dot?` | `children`, `style`, all global attrs |
| `Card` | `React.HTMLAttributes<HTMLDivElement>` | `title?`, `eyebrow?`, `action?`, `floating?`, `accent?` | `children`, `style`, all global attrs |
| `IconButton` | `React.ButtonHTMLAttributes<HTMLButtonElement>` | `size?`, `variant?`, `label!`, `showLabel?` | `children`, `disabled`, `style`, `onClick`, `type`, all global attrs |
| `Button` | `React.ButtonHTMLAttributes<HTMLButtonElement>` | `variant?`, `size?`, `icon?`, `iconRight?`, `loading?`, `full?` | `children`, `disabled`, `style`, `onClick`, `type`, all global attrs |

- [ ] **Step 2: Confirm what the gate says today, and how it says it**

```bash
cd /home/juan/Dravensoft/Identity
cat > /tmp/arena-probe-8c1.mjs <<'EOF'
import { readFileSync } from 'node:fs';
import { reactSurface } from '/home/juan/Dravensoft/Identity/scripts/lib/api-surface.mjs';
const probes = [
  ['Spinner', 'feedback/Spinner'], ['Badge', 'display/Badge'], ['Card', 'display/Card'],
  ['IconButton', 'forms/IconButton'], ['Button', 'forms/Button'],
];
for (const [name, path] of probes) {
  const src = readFileSync(`/home/juan/Dravensoft/Identity/frameworks/react/components/${path}.d.ts`, 'utf8');
  try {
    const s = reactSurface(src, `${name}Props`);
    console.log(name, JSON.stringify(s));
  } catch (e) {
    console.log(name, 'THREW', e.name + ':', e.message);
  }
}
EOF
bun /tmp/arena-probe-8c1.mjs
rm /tmp/arena-probe-8c1.mjs
```

**Expected — measured on 2026-07-24: none of the five throws.** All five read cleanly, which is why
this batch is first. Four of the five report a non-empty `heritage` array; `Spinner` reports
`heritage: []` and a `style` member of form `platform`. So unlike 8B4 — where five of six surfaces
threw and the pre-migration gate produced one opaque *"could not read this surface"* per layer — this
batch's first failing `check:api` run gives an **itemised** list per component: the heritage clause as
the R4 escape, plus one *"does not declare X"* per contract member the interface inherits rather than
declares. That itemised list is a diagnostic every task should read rather than skip past.

Record what the probe actually prints. Any deviation is the audit's finding and blocks.

- [ ] **Step 3: Present D1–D7 to the maintainer, and STOP**

Present, in one message: the table from Step 1, the probe output from Step 2, and the seven decisions
below, each with its cost. **The decision is the maintainer's.** Where this plan states a
recommendation, it is a starting proposal to react to, not a decision already taken.

**D1 — What replaces a heritage clause: the enumeration rule.** Governs nine components across C1,
C2 and C3. The maintainer's stated posture, given while this plan was written, is **enumerate the
full native set per control** — a control's contract declares what that element genuinely accepts,
rather than the subset today's call sites happen to use, so nothing is silently lost and Plan D has a
complete target.

The bound this plan proposes for that posture, because `React.ButtonHTMLAttributes` and
`React.InputHTMLAttributes` both extend `React.HTMLAttributes` and would otherwise pull in every
global attribute, every ARIA attribute and every DOM handler — roughly fifty members per control:

> **An attribute that changes what the control IS or DOES is a member. A global attribute a
> consumer writes on the host is not.**

This is not a new principle. It is the argument `components-divergences.md:681` and `:989` already
record for why `style` and `{...rest}` were *deliberately not ported* to Angular: in Angular a
consumer writes those on the host directly. `id`, `className`, `dir`, `lang`, `tabIndex`, `hidden`,
`role`, `aria-*`, `data-*` and the generic DOM handlers fall on the host side of that line; `value`,
`checked`, `disabled`, `required`, `readOnly`, `placeholder`, `name`, `autoComplete`, `min`, `max`,
`step`, `maxLength`, `pattern`, `multiple`, `rows` and `type` fall on the member side.

**Applied to this batch, measured:** `Badge` and `Card` extend `React.HTMLAttributes`, which
contributes **only** global attributes, so flattening them adds **zero** members beyond the
`children` slot they already accept in practice. `IconButton` and `Button` extend
`React.ButtonHTMLAttributes`, whose element-specific set is short and fully enumerable: `type`,
`disabled`, `name`, `value`, `form`, `formAction`, `formEncType`, `formMethod`, `formNoValidate`,
`formTarget`, `autoFocus` — plus `onClick`, which is universal but is the reason a button exists.

The concrete proposal for `Button` and `IconButton`, to accept or amend: **`type`, `disabled`,
`name`, `autoFocus` become members and `onClick` becomes the event `click`; the six `form*` override
attributes and `value` do not.** The cost of that cut, stated plainly: a consumer cannot today make
an Arena `Button` submit a *different* form than the one it sits in, and after this they still
cannot — but the capability was reachable through `{...rest}` and after this it is gone. If the
maintainer wants the full eleven, say so here and Tasks 5 and 6 declare all of them.

**D2 — The single-icon convention applies, and one piece of prose contradicting it is retired.**
`api/README.md` already declares it settled: *"A single icon is a primitive `string` carrying a
Phosphor class name, never a slot."* So `Button.icon` and `Button.iconRight` — slots today — become
primitive strings, and `IconButton`'s icon, which arrives as `children` through the heritage clause,
becomes a primitive `icon` string. `IconButton` therefore ends this plan with **no slot at all**.

**Capability loss, measured rather than assumed.** Every call site in the tree was read: the demos
pass `<i className="ph-bold ph-plus"/>` and the Console passes its own
`<Icon name="plus" size="var(--icon-md)"/>` wrapper. **None passes a Spinner, a badge, or any
non-glyph node.** So the measured loss is one thing only: the Console currently overrides the icon
size per call site through that wrapper's `size` prop, and after this Arena chooses the size. There
is a precedent in the same file — `<Switch iconOn="ph-bold ph-sun" …>`, already contracted in 8B1 —
and two more in already-contracted components: `<EmptyState icon="ph-duotone ph-folder-open">` and
`<ErrorState icon="ph-fill ph-warning-octagon">`.

**And the prose that must be retired:** `SideNav.d.ts`'s `SideNavItem.icon` carries the doc comment
*"A node, not a name. The library ships no Icon component, and a SideNav that took strings would
couple it to one it does not have."* That argument was superseded by the convention. It is C3's
component to migrate, but the *decision* is taken here so C3 does not re-derive the opposite answer
from prose still sitting in the file.

**D3 — The default slot is named `content`, mechanically.** `api/README.md`'s binding table already
says so and `bindingName()` implements it. In this batch that means `Badge`, `Card` and `Button`
each declare a `content` slot, bound to React's `children`, and each `.d.ts` gains an explicit
`children?: React.ReactNode` it does not have today — because `children` reaches all three through
the heritage clause, and an inherited member is not a declared member.

**The collision this rule creates outside this batch, decided here so C4 does not discover it.**
`Tooltip` declares **both** `content` (the bubble text) and `children` (the trigger).
`bindingName('content', 'slot', 'react')` returns `children`, so a contract naming its default slot
`content` binds to React's `children` — and React's literal `content` prop becomes a member no
contract governs, which the agreement assertion fails on. One of the two must be renamed. Two
reshapes, both defensible: rename React's `content` to something the contract can carry as a
non-default slot; or, applying R2 exactly as the icon convention applies it, make the bubble text a
**primitive `string`** that Arena draws — which is also the only shape Plan D's `matTooltip` can
consume. **Recommendation: the second.** Decide it now; C4 implements it.

**D4 — The `(string | X)[]` union answer, decided once for three components.** `Tabs.tabs`,
`Select.options` and `SegmentedControl.options` are the three R5 violations the spec names, and the
reader already classifies each as `union`. All three are the same shape: a convenience form where a
bare string means *"value and label are the same"*. R5 forces one form. **Recommendation: the array
of predefined objects** (`TabItem`, `SelectOption`, `SegmentOption` are already declared, inline, in
their own `.d.ts` files), because the object form carries strictly more information and the string
form is expressible as `{ value: x, label: x }` at the call site. Cost: every call site passing bare
strings is rewritten, and the convenience is gone. None of the three is in this batch; the decision
is recorded so C2 and C3 apply the same answer.

**D5 — `Table`'s generic, and whether it changes the vocabulary.** `Table.d.ts` declares
`TableColumn<T = any>` and `TableProps<T = any>` with `rows: T[]`, and the reader throws
*"unreadable type annotation: TableColumn<T>"*. The seven forms have no word for a type parameter,
and `rows` is not an array of an Arena predefined object — it is an array of *the consumer's* data,
which is a thing the vocabulary genuinely cannot name. The spec says to expect the answer to be
either *"the row type is not parameterised in the contract"* or *"a change to the vocabulary
itself"*, and the maintainer has directed that it be decided here rather than five batches from now,
because the second branch would move `api/README.md` under nineteen contracts written against it.

Three reshapes to weigh:

  - **A — drop the parameter.** `TableColumn` and `TableProps` lose `<T>`; `rows` becomes an array of
    an opaque row. The cost is that `render(value, row)` loses its typed `row`, and `Record<string,
    unknown>` is explicitly named in R4 as *not* one of the seven forms, so the opaque row needs a
    name the vocabulary accepts or the vocabulary needs an eighth thing.
  - **B — an eighth form, "consumer data".** Names honestly what `rows` is: a homogeneous list whose
    element type the contract does not describe. This is a change to `api/README.md`'s vocabulary
    table and to the reader, and it must be decided **before** the other nineteen contracts, which is
    why it is here.
  - **C — `Table` leaves Plan C** and is contracted in its own plan with `Calendar`, the two
    components `CLAUDE.md` records as implementing no keyboard navigation at all.

**No recommendation is offered.** This is the one decision in this plan where the plan's author has
no measured basis to prefer an answer, and saying so is better than manufacturing one.

**D6 — The inbound function that returns a value, twice, decided separately.** `Calendar.renderEvent`
returns a `React.ReactNode` and `Input.validate` returns `string | null | undefined`. Both are the
shape 8B4 already answered for the charts' `valueFormatter`, and `api/README.md` records the *rule* —
the member is replaced by data the component renders itself, and the capability loss is stated rather
than hidden. **The rule is settled; neither answer is.** `Input.validate` returning an error message
is a genuinely different problem from a number formatter: the likely reshape is an event plus an
`error` primitive rather than a suffix, and `Input.d.ts` already declares an `error?: string`, which
makes the shape half-built already. Both belong to later batches (C2 and C5); the decision recorded
here is only that each gets its own audit rather than inheriting the charts' answer by default.

**And the fourth unreadable shape, which is not a function-returns-a-value at all.** `SideNav.onNav`
is `(id: string, event: React.MouseEvent) => void` and the reader throws *"an event takes one
payload, and this declares more than one parameter"*. `Breadcrumbs` answered this exact shape in Plan
A and `api/README.md` records the answer as settled: **the DOM event leaves the payload — a platform
event type is an R4 violation inside one — and the item alone travels**, with interception moving to
the router. Applying it here needs no reader change and no vocabulary change. **The decision recorded
here is that C3 applies that precedent rather than re-deriving it**, and the cost is the one
`Breadcrumbs` already paid and documented: `preventDefault()` is no longer reachable from the
handler, which matters because `SideNav`'s own doc comment says an item with `href` is a real anchor
whose default navigation reloads the page. C3 states that consequence in `SideNav.prompt.md` rather
than discovering it at a call site. If the maintainer wants the convention changed instead, that is a
change to `api/README.md` and not to `SideNav`, and it must be taken here rather than in C3.

**D7 — The five enums this batch declares, and the one it reuses.** Measured against `api/types/`:

  - `Badge.tone` is value-identical to the existing **`Tone`** — seven values, same order. Under
    8B1's rule (reuse only on an identical value set) it **reuses `Tone` and declares nothing**.
  - `sm | md | lg` appears in `Spinner.size`, `IconButton.size`, `Button.size` and — in C4 —
    `ProgressBar.size`, value-identical in all four. One new shared enum, **`ControlSize`**, created
    in Task 2. It is *not* identical to `LogoSize`, `AvatarSize` or `SwitchSize`, so none is reusable.
  - **`SpinnerTone`** — `accent`, `gold`, `neutral`, `on-accent` (Task 2). Not identical to `Tone`,
    `AlertTone`, `TagTone` or `SeriesTone`.
  - **`ButtonType`** — `button`, `submit`, `reset` (Task 5), shared with `Button`. Conditional on
    D1 admitting `type` as a member.
  - **`IconButtonVariant`** — `ghost`, `solid` (Task 5).
  - **`ButtonVariant`** — `primary`, `secondary`, `ghost`, `danger` (Task 6).

- [ ] **Step 4: Record the decisions in the ledger**

Write the `## Maintainer decisions taken` section with D1–D7 as answered, including every correction
the re-measurement produced and every amendment the maintainer made to a recommendation. **This
section is what a reviewer reads to check the judgement, not only the diff.**

- [ ] **Step 5: Write the durable decisions into `api/README.md`, and commit**

Only the decisions that govern components **outside** this batch belong here — D1's enumeration rule,
D2's retirement of the SideNav prose, D3's `Tooltip` resolution, D4's union answer, D5's `Table`
answer and D6's "each gets its own audit". D7 is this batch's own bookkeeping and stays in the ledger.

Add them under the existing `## Conventions the audits settled` heading, in that section's register:
a stated rule, the reason that decided it, and the consequence stated rather than hidden. Follow the
shape of the two conventions already there. Do **not** restate anything already in that section.

D5 has two answers that make this step bigger than a documentation edit, and both **stop and report
before writing anything**:

- **Reshape B (an eighth form)** changes `api/README.md`'s *"The vocabulary: seven forms"* table, and
  `scripts/lib/api-surface.mjs` plus `scripts/api-surface.test.mjs` gain the new form. That is a
  larger piece of work than this task and probably its own task in this plan.
- **Reshape C (`Table` leaves Plan C)** changes the spec's Plan C subject list and this plan's own
  Appendix A, and means a later plan inherits `Table` alongside `Calendar`. Record it in the ledger
  and let Task 8 carry it into the spec; do not edit the spec from here.

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
git add -A
git commit -m "docs(api): record the cross-cutting decisions Plan C's batches share

The heritage-flattening enumeration rule (nine components), the single-icon
convention's application to Button/IconButton/SideNav, Tooltip's content-slot
collision with the binding table, the (string | X)[] union answer for Tabs,
Select and SegmentedControl, Table's generic, and the inbound-function-returns-a-
value rule applied to Calendar.renderEvent and Input.validate.

No component is contracted by this commit; check:api stays at 21/41.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Expected: `check-api: 21 contract(s) hold across 41 layer implementation(s)` — unchanged, because
this commit contracts nothing.

---

## Task 2: Spinner

**Files:**
- Create: `api/types/control-size.json`
- Create: `api/types/spinner-tone.json`
- Create: `api/components/Spinner.json`
- Create: `frameworks/react/test/spinner.test.jsx`
- Modify: `frameworks/react/components/feedback/Spinner.d.ts`
- Modify: `frameworks/react/components/feedback/Spinner.jsx`
- Modify: `frameworks/react/components/feedback/Spinner.prompt.md`
- Regenerate: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`,
  `frameworks/react/components/feedback/Spinner.js`
- Check: `README.md` prose (Global Constraint 19), and the demo/Console call sites (Step 7)

**Interfaces:**
- Consumes: Task 1's decisions D1, D3 and D7.
- Produces: `ControlSize` (`sm`/`md`/`lg`) and `SpinnerTone`, both emitted into both `api.generated.*`
  modules. **Tasks 5 and 6 import `ControlSize` rather than declaring anything**, and C4's
  `ProgressBar` will too. Also produces the single-layer contract shape and the R4 non-vacuity
  technique that Tasks 3–6 copy.

> `Spinner` is first because it is the only one of the five with **no heritage clause**. Its whole R4
> exposure is `style?: React.CSSProperties` in the `.d.ts` and `{...rest}` in the `.jsx`, so it proves
> the removal technique and the single-layer arithmetic without the enumeration question on top.

- [ ] **Step 1: Confirm Spinner's own surface, and STOP**

Re-read `frameworks/react/components/feedback/Spinner.d.ts` and `Spinner.jsx`. Report to the
maintainer:

- the member list as measured, and confirmation that the interface declares no named exported type,
  so Global Constraint 9 means this file re-exports nothing;
- the contract this task will write (Step 3), member by member;
- confirmation that `Spinner` binds `status` with `"exceptions": []` and that nothing in this task
  changes a role, an `aria-*` attribute or a rendered element — only which props reach the root;
- confirmation that `Spinner` is **not** in `COVERED` (`scripts/check-compliance.mjs`), so no
  compliance suite pins it.

This blocks. It must not re-open D1–D7.

- [ ] **Step 2: Write the two shared enums and regenerate**

Create `api/types/control-size.json`:

```json
{
  "name": "ControlSize",
  "kind": "enum",
  "description": "The three-step size scale shared by Arena's controls. Heights come from the density tokens, so a control inside .arena-compact re-densifies with the rows around it.",
  "values": ["sm", "md", "lg"]
}
```

Create `api/types/spinner-tone.json`:

```json
{
  "name": "SpinnerTone",
  "kind": "enum",
  "description": "Colour for an indeterminate wait. 'accent' on a page surface, 'on-accent' inside a filled button. There is deliberately no success/warning/danger: a wait has no state to report, and a spinner tinted --danger would read as a failure that has not happened.",
  "values": ["accent", "gold", "neutral", "on-accent"]
}
```

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
git diff --stat frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

Expected: both modules gain `ControlSize` and `SpinnerTone`, inserted in the generator's own sort
order. Read the diff and confirm **no other type moved**.

- [ ] **Step 3: Write the contract**

Create `api/components/Spinner.json`:

```json
{
  "component": "Spinner",
  "description": "Indeterminate wait indicator. For a measurable process use ProgressBar instead.",
  "api": {
    "size": { "form": "enum", "type": "ControlSize", "default": "md",
              "description": "Diameter. 'sm' is --icon-sm exactly, so a spinner at that size sits inline with control text." },
    "tone": { "form": "enum", "type": "SpinnerTone", "default": "accent",
              "description": "Colour of the ring. 'on-accent' inside a filled button; 'accent' on a page surface." },
    "label": { "form": "primitive", "type": "string", "default": "Loading",
               "description": "Accessible name, announced by the status role. Say what is loading when you can." }
  }
}
```

- [ ] **Step 4: Run `check:api` and read the failure**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
```

Expected: **FAIL**, with an itemised message for `react/Spinner` naming `style` as the R4 platform
type. Unlike 8B4, this is a readable list rather than an opaque *"could not read this surface"* —
Task 1, Step 2 established why. If you see a throw instead, something changed since the audit; stop
and report.

- [ ] **Step 5: Migrate the `.d.ts`**

Replace `frameworks/react/components/feedback/Spinner.d.ts` entirely with:

```ts
import type { ControlSize, SpinnerTone } from '../../api.generated';

/** Indeterminate wait indicator. For a measurable process use ProgressBar instead. */
export interface SpinnerProps {
  /** `--icon-sm` (14px) / `--sp-5` (20px) / `--sp-8` (32px). */
  size?: ControlSize;
  /**
   * @startingPoint 'accent' on a page surface, 'on-accent' inside a filled button.
   * `accent` and `gold` are the same tokens ProgressBar uses. There is deliberately
   * no success/warning/danger tone: an indeterminate wait has no state to report.
   */
  tone?: SpinnerTone;
  /** Accessible name. Defaults to "Loading". Say what is loading when you can. */
  label?: string;
}
export function Spinner(props: SpinnerProps): JSX.Element;
```

Two things left the file and each is deliberate: `import * as React from 'react'`, whose only
consumer was `React.CSSProperties`, and `style?: React.CSSProperties` itself (D1's escape half, R4).

- [ ] **Step 6: Migrate the `.jsx`**

In `frameworks/react/components/feedback/Spinner.jsx`, change **only** the signature at line 45 and
the root `<span>` at line 48. Every comment block and the `SIZES`/`TONES` maps stay byte-identical.

The signature becomes:

```jsx
export function Spinner({ size = 'md', tone = 'accent', label = 'Loading' }) {
```

The root element becomes:

```jsx
    <span role="status" aria-label={label} style={{ display: 'inline-flex', color }}>
```

Then confirm by grep that neither escape survives — `check:api` never opens the `.jsx`:

```bash
cd /home/juan/Dravensoft/Identity
grep -n "\.\.\.rest\|\.\.\.style" frameworks/react/components/feedback/Spinner.jsx
```

Expected: **no output.**

- [ ] **Step 7: Find and fix every call site**

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "<Spinner" --include='*.jsx' --include='*.html' --include='*.md' .
```

Read every hit. A call site passing `style` or a stray attribute must lose it; one passing only
`size`, `tone` or `label` is unchanged. **Report what you found either way** — "no call site changed"
is a finding, not a non-answer.

- [ ] **Step 8: Write the React suite**

Create `frameworks/react/test/spinner.test.jsx`. **This code is a starting point, not a verified
artifact (Global Constraint 18) — run it and fix what does not discriminate.**

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Spinner } from '../components/feedback/Spinner.jsx';

test('Spinner announces its label through the status role', () => {
  const html = renderToStaticMarkup(<Spinner label="Loading deploys" />);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-label="Loading deploys"/);
});

test('Spinner falls back to "Loading" when no label is given', () => {
  assert.match(renderToStaticMarkup(<Spinner />), /aria-label="Loading"/);
});

/* The size map is read through member access, so the rendered diameter is the
 * only place the chosen entry is observable. --icon-sm belongs to `sm` alone
 * and --sp-8 to `lg` alone, so each assertion names a token the other two
 * sizes never emit -- an assertion on --sp-5 would also be satisfied by the
 * default, and would pass against a component that ignored `size` entirely. */
test('Spinner renders the diameter token its size names, not the default', () => {
  assert.match(renderToStaticMarkup(<Spinner size="sm" />), /var\(--icon-sm\)/);
  assert.match(renderToStaticMarkup(<Spinner size="lg" />), /var\(--sp-8\)/);
});

test('Spinner renders the colour token its tone names', () => {
  assert.match(renderToStaticMarkup(<Spinner tone="on-accent" />), /var\(--on-accent\)/);
  assert.match(renderToStaticMarkup(<Spinner tone="gold" />), /var\(--gold\)/);
});

/* R4: `style?: React.CSSProperties` and the `{...rest}` spread both left this
 * component. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. The two are asserted SEPARATELY on purpose: a
 * component that stopped spreading ...rest but still merged ...style would
 * pass a single combined assertion. `color` is deliberately the property
 * carried here -- it is not in check-dimension-literals' PROPS set, and that
 * gate walks test directories too. */
test('Spinner drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <Spinner style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

- [ ] **Step 9: Run the suite and prove the R4 test is not vacuous**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/spinner.test.jsx
sha256sum frameworks/react/components/feedback/Spinner.jsx
```

Expected: 5 pass. Then run **both** induced regressions from Global Constraint 17, separately:

1. Restore `style` to the signature and merge it (`..., label = 'Loading', style })` and
   `style={{ display: 'inline-flex', color, ...style }}`), leave `{...rest}` out. Re-run. Expect
   the **style** assertion to fail. Revert.
2. Restore `...rest` to the signature and spread it on the root (`{...rest}`), leave `style`
   destructured but **not** merged. Re-run. Expect the **attribute** assertion to fail. Revert.

Then confirm the file is byte-identical to the recorded hash and the suite is green again:

```bash
cd /home/juan/Dravensoft/Identity
sha256sum frameworks/react/components/feedback/Spinner.jsx
bun test frameworks/react/test/spinner.test.jsx
```

- [ ] **Step 10: Rebuild the demos**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos
bun run check:demos
```

Expected: `Spinner.js` regenerated to match the new `.jsx`; `check:demos` PASS. If an `.entry.jsx` or
a Console `.jsx` changed in Step 7, its `.js` sibling regenerates here too.

- [ ] **Step 11: Update `Spinner.prompt.md` and check `README.md`**

Read `frameworks/react/components/feedback/Spinner.prompt.md` and remove any mention of `style` or of
passing arbitrary attributes; the three remaining members keep their prose. Add a Don't bullet:

```markdown
- Don't pass `style` or stray DOM attributes. Spinner declares three members and renders nothing else — wrap it in your own element if you need to position it.
```

Then, per Global Constraint 19:

```bash
cd /home/juan/Dravensoft/Identity
grep -n "Spinner" README.md
```

Read every hit and confirm none describes a member this task removed. **Report the check either way.**

- [ ] **Step 12: Run the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun test frameworks/react/test/
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 22 contract(s) hold across 42 layer implementation(s)`; every other gate PASS;
React **+5** against Task 0's measured baseline; the behaviour diff **empty**. Assert the delta, not
an absolute count.

- [ ] **Step 13: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api)!: bring Spinner under the API capability contract

Spinner loses style and the {...rest} spread (R4). size and tone become the
shared ControlSize and the new SpinnerTone enums; label stays a primitive.
ControlSize is declared here because sm/md/lg is value-identical across
Spinner, IconButton, Button and ProgressBar.

First single-layer contract of Plan C: Angular implements none of the
twenty-one React-only components, so check:api climbs 21/41 -> 22/42.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 14: Record and report**

Append a `## Task 2: complete` section to `.superpowers/sdd/progress.md`: the measured `check:api`
pair, the test count, whether **both** R4 non-vacuity runs were performed and what each failed on,
what Step 7 found at the call sites, and the `README.md` verdict. Report and stop for review.

---

## Task 3: Badge

**Files:**
- Create: `api/components/Badge.json`
- Create: `frameworks/react/test/badge.test.jsx`
- Modify: `frameworks/react/components/display/Badge.d.ts`
- Modify: `frameworks/react/components/display/Badge.jsx`
- Modify: `frameworks/react/components/display/Badge.prompt.md`
- Modify: the call sites Step 6 finds — at plan time `frameworks/react/components/display/display.card.entry.jsx`,
  `frameworks/react/components/display/table-avatar.card.entry.jsx`, and Console files
- Regenerate: `frameworks/react/components/display/Badge.js` and the `.js` sibling of every file
  touched
- Check: `README.md` prose

**Interfaces:**
- Consumes: Task 1's D1, D3 and D7. **Declares no new type** — `Badge.tone` reuses the existing
  `Tone`.
- Produces: the first flattened heritage clause in this plan, and the `content`-slot shape Tasks 4
  and 6 copy.

> `Badge` is the cheapest possible application of D1: its heritage is `React.HTMLAttributes`, which
> contributes **only** global attributes, so under D1's rule flattening it adds **zero** members
> beyond the `content` slot it already accepts through `children`.

- [ ] **Step 1: Confirm Badge's own surface, and STOP**

Report to the maintainer:

- the member list as measured, and that `BadgeProps`' body declares only `tone` and `dot` — `children`
  and `style` arrive through `extends React.HTMLAttributes<HTMLSpanElement>`;
- that `Badge.tone`'s inline union is **value-identical** to `api/types/tone.json`, verified by
  reading both, so this task declares no type (D7);
- that `Badge` binds pattern `none` with a `reason` stating *"There is no onClick, no focusable
  element and no role anywhere in the file"*, so this contract declares **no event** and the binding
  comes out with an empty diff (Global Constraint 6);
- the contract this task will write (Step 2), member by member.

This blocks.

- [ ] **Step 2: Write the contract**

Create `api/components/Badge.json`:

```json
{
  "component": "Badge",
  "description": "Status label: mono, uppercase, short. Carries an object's actual state or an editorial emphasis, never decoration.",
  "api": {
    "content": { "form": "slot",
                 "description": "The label text. Short — a badge is a chip, not a sentence." },
    "tone": { "form": "enum", "type": "Tone", "default": "neutral",
              "description": "System status (success/warning/danger/info) reflects an object's actual state; emphasis (accent, gold) is editorial; neutral carries no semantic weight." },
    "dot": { "form": "primitive", "type": "boolean", "default": false,
             "description": "Draws a filled dot in the tone colour before the label." }
  }
}
```

- [ ] **Step 3: Run `check:api` and read the failure**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
```

Expected: **FAIL**, itemised — the heritage clause reported as the R4 `{...rest}` escape, plus a
*"does not declare content"* for the slot the interface reaches only through `children`.

- [ ] **Step 4: Migrate the `.d.ts`**

Replace `frameworks/react/components/display/Badge.d.ts` entirely with:

```ts
import type { ReactNode } from 'react';
import type { Tone } from '../../api.generated';

/** Status label (mono uppercase, short). Taxonomy of `tone` (H4):
 *  · System STATUS tones — success / warning / danger / info: reflect the actual state of
 *    an object (deploy, service, version). Don't use them for decoration.
 *  · EMPHASIS tones — accent (new/featured) and gold (priority/distinction): editorial,
 *    they don't represent status. `neutral` = no semantic weight (draft, count). */
export interface BadgeProps {
  /** The label text. Short — a badge is a chip, not a sentence. */
  children?: ReactNode;
  tone?: Tone;
  /** Draws a filled dot in the tone colour before the label. */
  dot?: boolean;
}
export function Badge(props: BadgeProps): JSX.Element;
```

Note the import shape: `import type { ReactNode } from 'react'` rather than
`import * as React from 'react'`. A `children` slot needs the node type and nothing else, and the
namespace import is what carried `React.CSSProperties` in.

- [ ] **Step 5: Migrate the `.jsx`**

In `frameworks/react/components/display/Badge.jsx`, change **only** the signature at line 11 and the
root `<span>`'s style object at line 16. The `TONES` map and the dot `<span>` stay byte-identical.

```jsx
export function Badge({ children, tone = 'neutral', dot = false }) {
```

and the root's style object loses its trailing `...style` and the element loses `{...rest}` — so the
opening tag ends `textTransform: 'uppercase' }}>` rather than `textTransform: 'uppercase', ...style }} {...rest}>`.

```bash
cd /home/juan/Dravensoft/Identity
grep -n "\.\.\.rest\|\.\.\.style" frameworks/react/components/display/Badge.jsx
```

Expected: **no output.**

- [ ] **Step 6: Find and fix every call site**

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "<Badge" --include='*.jsx' --include='*.html' --include='*.md' .
```

Read every hit. Any passing `style` or a stray attribute loses it. **Report what you found either
way**, and name the files changed.

- [ ] **Step 7: Write the React suite**

Create `frameworks/react/test/badge.test.jsx`. **Starting point, not verified — run it.**

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Badge } from '../components/display/Badge.jsx';

test('Badge renders its content slot', () => {
  assert.match(renderToStaticMarkup(<Badge>DRAFT</Badge>), /DRAFT/);
});

/* Each tone maps to a distinct token PAIR, and the assertion names the
 * foreground token, which appears in no other tone -- an assertion on the
 * shared --r-pill or on the neutral default would pass against a component
 * that ignored `tone`. */
test('Badge renders the token pair its tone names, not the neutral default', () => {
  assert.match(renderToStaticMarkup(<Badge tone="danger">X</Badge>), /var\(--danger\)/);
  assert.match(renderToStaticMarkup(<Badge tone="gold">X</Badge>), /var\(--gold\)/);
  assert.doesNotMatch(renderToStaticMarkup(<Badge tone="danger">X</Badge>), /var\(--bone-dim\)/);
});

/* The dot is a bare <span> with no text, so its presence is only observable
 * through border-radius: 50% -- which the badge's own root does NOT carry (it
 * uses --r-pill). That makes the assertion discriminate between the two. */
test('Badge draws the dot only when asked', () => {
  assert.doesNotMatch(renderToStaticMarkup(<Badge>X</Badge>), /50%/);
  assert.match(renderToStaticMarkup(<Badge dot>X</Badge>), /50%/);
});

/* R4: the `extends React.HTMLAttributes<HTMLSpanElement>` heritage clause and
 * the `{...rest}` spread both left this component, and `style` went with the
 * heritage. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. Asserted separately -- see Spinner. */
test('Badge drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(<Badge style={{ color: '#ff00ff' }} data-stray="x">X</Badge>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

- [ ] **Step 8: Run the suite and prove the R4 test is not vacuous**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/badge.test.jsx
sha256sum frameworks/react/components/display/Badge.jsx
```

Expected: 4 pass. Then run **both** induced regressions from Global Constraint 17 separately, exactly
as Task 2, Step 9 describes, and confirm the byte-identical restore with `sha256sum`.

- [ ] **Step 9: Rebuild the demos**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos
bun run check:demos
```

- [ ] **Step 10: Update `Badge.prompt.md` and check `README.md`**

Remove any mention of `style` or arbitrary attributes; add the Don't bullet in Spinner's shape,
naming Badge's three members. Then `grep -n "Badge" README.md`, read every hit, and **report the
check either way** — Badge's tone taxonomy is design prose that lives in `README.md`'s H4 section and
this task must not silently contradict it.

- [ ] **Step 11: Run the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun run check:tailwind
bun run check:states
bun test frameworks/react/test/
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 23 contract(s) hold across 43 layer implementation(s)`; every other gate PASS;
React **+4** against Task 2's count; behaviour diff empty. `check:tailwind` and `check:states` join
the list from here on because the remaining four components all have a Tailwind manifest whose
variants mirror the members being reshaped.

- [ ] **Step 12: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api)!: bring Badge under the API capability contract

The extends React.HTMLAttributes heritage clause and the {...rest} spread both
leave (R4); style went with the heritage. children becomes the contract's
content slot, declared explicitly rather than inherited. tone reuses the
existing Tone enum -- its inline union was value-identical, so no type is
declared here.

check:api 22/42 -> 23/43.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 13: Record and report**

Append `## Task 3: complete` to the ledger, in Task 2's shape. Report and stop for review.

---

## Task 4: Card

**Files:**
- Create: `api/components/Card.json`
- Modify: `frameworks/react/components/display/Card.d.ts`
- Modify: `frameworks/react/components/display/Card.jsx`
- Modify: `frameworks/react/components/display/Card.prompt.md`
- Modify: `frameworks/react/test/card.test.jsx` (extend the existing two tests)
- Modify: the call sites Step 5 finds, including `frameworks/react/components/brand/UnauthCard.jsx`
  if it passes anything the contract removes
- Regenerate: `frameworks/react/components/display/Card.js` and every touched file's `.js` sibling
- Check: `README.md` prose

**Interfaces:**
- Consumes: Task 1's D1 and D3. **Declares no new type.**
- Produces: nothing later tasks depend on.

> `Card` is the second zero-cost application of D1 — `React.HTMLAttributes<HTMLDivElement>`
> contributes only global attributes — and the first component in this plan that an
> **already-contracted Plan B component composes**: `UnauthCard.jsx` renders a `<Card>`. Its contract
> does not change, but its call site might.

- [ ] **Step 1: Confirm Card's own surface, and STOP**

Report to the maintainer:

- the member list as measured, and that `CardProps`' body declares five members while `children` and
  `style` arrive through the heritage clause;
- that `Card` binds pattern `none` with a `reason` reading *"any button or control inside comes from
  `children` or `action`, both caller-supplied content"* — so **both stay slots** and the binding
  comes out with an empty diff. A reshape making `action` anything but a slot would falsify that
  reason, which Global Constraint 6 forbids;
- that `Card` already has a React suite (`frameworks/react/test/card.test.jsx`, two tests) which this
  task extends rather than replaces;
- that `UnauthCard.jsx` composes `Card` and that `components-divergences.md:840` records
  *"UnauthCard's `panel` hand-duplicates Card's surface classes"* — a **rendering** divergence, not an
  API one, so Task 7 keeps it.

This blocks.

- [ ] **Step 2: Write the contract**

Create `api/components/Card.json`:

```json
{
  "component": "Card",
  "description": "Surface container. Hairline border on the base surface scale; depth comes from the shadow, never a gradient.",
  "api": {
    "content": { "form": "slot",
                 "description": "The card's body, below the optional header." },
    "action": { "form": "slot",
                "description": "Right-aligned in the header, beside the title. Arena draws the header row; the consumer draws what sits in it." },
    "title": { "form": "primitive", "type": "string",
               "description": "Header title. Absent, along with eyebrow and action, renders no header block at all." },
    "eyebrow": { "form": "primitive", "type": "string",
                 "description": "Mono uppercase label above the title, in the accent colour." },
    "floating": { "form": "primitive", "type": "boolean", "default": false,
                  "description": "Adds the warm shadow. Depth comes from the shadow and the surface scale, never a gradient." },
    "accent": { "form": "primitive", "type": "boolean", "default": false,
                "description": "Draws the border in the accent colour instead of the surface hairline." }
  }
}
```

- [ ] **Step 3: Run `check:api` and read the failure**

Expected: **FAIL**, itemised — the heritage clause as the R4 escape plus *"does not declare content"*.

- [ ] **Step 4: Migrate the `.d.ts` and the `.jsx`**

Replace `frameworks/react/components/display/Card.d.ts` entirely with:

```ts
import type { ReactNode } from 'react';

/** Surface container. Hairline border; `floating` adds shadow; `accent` crimson border.
 * @startingPoint section="Display" subtitle="Surface card with header" viewport="700x220" */
export interface CardProps {
  /** The card's body, below the optional header. */
  children?: ReactNode;
  title?: string;
  eyebrow?: string;
  /** Right-aligned in the header, beside the title. */
  action?: ReactNode;
  floating?: boolean;
  accent?: boolean;
}
export function Card(props: CardProps): JSX.Element;
```

In `frameworks/react/components/display/Card.jsx`, change **only** the signature at line 2 and the
root `<div>`'s style object at line 7. The header block and the body `<div>` stay byte-identical.

```jsx
export function Card({ children, title, eyebrow, action, floating = false, accent = false }) {
```

and the root's style object ends `overflow: 'hidden' }}>` rather than
`overflow: 'hidden', ...style }} {...rest}>`.

```bash
cd /home/juan/Dravensoft/Identity
grep -n "\.\.\.rest\|\.\.\.style" frameworks/react/components/display/Card.jsx
```

Expected: **no output.**

- [ ] **Step 5: Find and fix every call site**

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "<Card" --include='*.jsx' --include='*.html' --include='*.md' . | grep -v "ChartCard\|StatCard\|UnauthCard\b.*component"
```

The filter drops `ChartCard`, `StatCard` and `UnauthCard` name matches, all three of them separate
contracted components — but **read `UnauthCard.jsx` itself anyway**, because it *renders* a `<Card>`.
Report every file changed.

- [ ] **Step 6: Extend the existing React suite**

Append to `frameworks/react/test/card.test.jsx`. Do not rewrite its two existing tests or its header
comment. **Starting point — run it.**

```jsx
/* The action slot renders inside the header row, so it must appear when it is
 * the ONLY header member -- a card with an action but no title still draws a
 * header. --fs-h4 is the title's own size and is the header's title branch, so
 * asserting the action's own text alongside its absence discriminates the two
 * branches rather than merely proving a header exists. */
test('Card renders its action slot even with no title or eyebrow', () => {
  const html = renderToStaticMarkup(<Card action={<span>ACT</span>}>x</Card>);
  assert.match(html, /ACT/);
  assert.doesNotMatch(html, /var\(--fs-h4\)/);
});

/* R4: the `extends React.HTMLAttributes<HTMLDivElement>` heritage clause and
 * the `{...rest}` spread both left this component, and `style` went with the
 * heritage. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. Asserted separately -- see Spinner. */
test('Card drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(<Card style={{ color: '#ff00ff' }} data-stray="x">x</Card>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

- [ ] **Step 7: Run the suite and prove the R4 test is not vacuous**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/card.test.jsx
sha256sum frameworks/react/components/display/Card.jsx
```

Expected: 4 pass (2 pre-existing + 2 new). Then both induced regressions, separately, per Global
Constraint 17, with the `sha256sum` restore check.

- [ ] **Step 8: Rebuild the demos, update the prompt, check `README.md`**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos
bun run check:demos
grep -n "Card" README.md
```

Update `Card.prompt.md` per Global Constraint 20 and add the Don't bullet in Spinner's shape. Read
every `README.md` hit and **report the check either way**.

- [ ] **Step 9: Run the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun run check:tailwind
bun run check:states
bun test frameworks/react/test/
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 24 contract(s) hold across 44 layer implementation(s)`; React **+2** against
Task 3's count; behaviour diff empty.

- [ ] **Step 10: Commit and record**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api)!: bring Card under the API capability contract

The extends React.HTMLAttributes heritage clause and the {...rest} spread both
leave (R4); style went with the heritage. children becomes the contract's
content slot, declared explicitly. action stays a slot -- Card's behaviour
binding states that its interactive content is caller-supplied, and a reshape
making it anything else would falsify that reason.

check:api 23/43 -> 24/44.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Append `## Task 4: complete` to the ledger. Report and stop for review.

---

## Task 5: IconButton

**Files:**
- Create: `api/types/button-type.json`
- Create: `api/types/icon-button-variant.json`
- Create: `api/components/IconButton.json`
- Create: `frameworks/react/test/icon-button.test.jsx`
- Modify: `frameworks/react/components/forms/IconButton.d.ts`
- Modify: `frameworks/react/components/forms/IconButton.jsx`
- Modify: `frameworks/react/components/forms/IconButton.prompt.md`
- Modify: the call sites Step 5 finds — at plan time
  `frameworks/react/components/forms/forms.card.entry.jsx`,
  `frameworks/react/components/navigation/menu-pagination.card.entry.jsx`, and Console files
- Regenerate: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`, and every
  touched file's `.js` sibling
- Check: `README.md` prose

**Interfaces:**
- Consumes: Task 1's D1, D2 and D7, plus `ControlSize` from Task 2.
- Produces: `ButtonType` (`button`/`submit`/`reset`) and `IconButtonVariant` (`ghost`/`solid`).
  **Task 6 imports `ButtonType` rather than declaring it.**

> This is where D2 first bites. `IconButton`'s icon arrives as `children` through the heritage clause;
> under the single-icon convention it becomes a primitive `icon` string carrying a Phosphor class
> name, so **`IconButton` ends this task with no slot at all** and every call site changes shape from
> `<IconButton label="X"><i className="ph-bold ph-y"/></IconButton>` to
> `<IconButton label="X" icon="ph-bold ph-y" />`.
>
> **`ButtonType` and the `click` event are conditional on D1.** If the maintainer amended D1's
> proposed cut, implement what they decided and say so in the confirmation step rather than following
> the code below verbatim.

- [ ] **Step 1: Confirm IconButton's own surface, and STOP**

Report to the maintainer:

- the member list as measured, and that `IconButtonProps`' body declares four members while
  `children`, `disabled`, `style`, `onClick` and `type` all arrive through
  `extends React.ButtonHTMLAttributes<HTMLButtonElement>`;
- **exactly which members D1 admitted**, restated from the ledger — this task must not re-derive the
  cut;
- that `IconButton` binds `button` with `"exceptions": []`, and that turning `children` into a string
  changes what Arena renders inside the `<button>` but changes **no** role, `aria-label`, `title` or
  focusability, so the binding comes out with an empty diff;
- that `IconButton.manifest.json` declares slots `root` and `label` and variants `variant`, `size`,
  `showLabel` — none of which is the icon, so the manifest needs no change. **Verify this by reading
  the manifest**, because `check:states` and `check:tailwind` run in Step 9.

This blocks.

- [ ] **Step 2: Write the two enums and the contract, then regenerate**

Create `api/types/button-type.json`:

```json
{
  "name": "ButtonType",
  "kind": "enum",
  "description": "The native button behaviour. 'button' does nothing on its own and is the right default outside a form; 'submit' is what a bare <button> silently defaults to inside one, which is the footgun this member exists to make explicit.",
  "values": ["button", "submit", "reset"]
}
```

Create `api/types/icon-button-variant.json`:

```json
{
  "name": "IconButtonVariant",
  "kind": "enum",
  "description": "'ghost' sits on a surface and shows its hairline border; 'solid' is the filled accent treatment. Danger is not among them — Arena's danger convention is outline, and an icon-only danger control has no room to say what it destroys.",
  "values": ["ghost", "solid"]
}
```

Create `api/components/IconButton.json`:

```json
{
  "component": "IconButton",
  "description": "Icon-only button. Carries an accessible name in every state, not only on hover.",
  "api": {
    "icon": { "form": "primitive", "type": "string", "required": true,
              "description": "Phosphor class name, e.g. 'ph-bold ph-plus'. Arena draws the <i> and hides it from assistive technology; `label` is the accessible name." },
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "The accessible name, present in every state. Also the visible text when showLabel is set, and the title attribute when it is not." },
    "size": { "form": "enum", "type": "ControlSize", "default": "md",
              "description": "Height, from the density tokens — the same scale Button uses, so the two re-densify together in a toolbar." },
    "variant": { "form": "enum", "type": "IconButtonVariant", "default": "ghost",
                 "description": "Visual treatment." },
    "showLabel": { "form": "primitive", "type": "boolean", "default": false,
                   "description": "Shows the label as text beside the icon (H6). Don't rely on the title alone on touch or keyboard surfaces." },
    "disabled": { "form": "primitive", "type": "boolean", "default": false,
                  "description": "Blocks activation and dims the control." },
    "type": { "form": "enum", "type": "ButtonType", "default": "button",
              "description": "Native button behaviour. Defaults to 'button' so an icon button inside a form does not submit it by accident." },
    "click": { "form": "event",
               "description": "The button was activated, by pointer or by keyboard." }
  }
}
```

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
bun run check:api
```

Expected from `check:api`: **FAIL**, itemised — the heritage clause as the R4 escape, plus a
*"does not declare X"* for `icon`, `disabled`, `type` and `onClick`.

- [ ] **Step 3: Migrate the `.d.ts`**

Replace `frameworks/react/components/forms/IconButton.d.ts` entirely with:

```ts
import type { ButtonType, ControlSize, IconButtonVariant } from '../../api.generated';

/** Icon-only button. Requires `label` for accessibility. */
export interface IconButtonProps {
  /** Phosphor class name, e.g. `'ph-bold ph-plus'`. Arena draws the `<i>`. */
  icon: string;
  /** Accessible name in ALL states, not just hover. */
  label: string;
  size?: ControlSize;
  variant?: IconButtonVariant;
  /** Shows the `label` as text next to the icon (H6). Don't rely on the title alone. */
  showLabel?: boolean;
  disabled?: boolean;
  /** Defaults to `'button'` so an icon button inside a form does not submit it. */
  type?: ButtonType;
  /** The button was activated, by pointer or by keyboard. */
  onClick?: () => void;
}
export function IconButton(props: IconButtonProps): JSX.Element;
```

- [ ] **Step 4: Migrate the `.jsx`**

In `frameworks/react/components/forms/IconButton.jsx`:

The signature becomes — note `children` is gone and `icon`, `type` and `onClick` are in:

```jsx
export function IconButton({ icon, label, size = 'md', variant = 'ghost', showLabel = false, disabled = false, type = 'button', onClick }) {
  if (!icon) throw new Error('IconButton: `icon` is required');
  if (!label) throw new Error('IconButton: `label` is required');
```

The two throws are Global Constraint 8's runtime half: `icon` and `label` are `required: true` in the
contract, and the established idiom is `EmptyState.jsx:4`.

The `<button>` gains `type` and `onClick` and loses `{...rest}`; its style object loses `...style`:

```jsx
    <button type={type} onClick={onClick} aria-label={label} title={showLabel ? undefined : label} disabled={disabled}
```

and the style object ends `transition: 'background var(--dur-fast) var(--ease-out)' }}>`.

The body's `{children}` becomes the drawn icon:

```jsx
      <i className={icon} aria-hidden="true" />
```

`aria-hidden` is what keeps `label` the single accessible name — the same shape `EmptyState.jsx:8`
uses for its own icon.

```bash
cd /home/juan/Dravensoft/Identity
grep -n "\.\.\.rest\|\.\.\.style\|children" frameworks/react/components/forms/IconButton.jsx
```

Expected: **no output.**

- [ ] **Step 5: Find and fix every call site**

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "IconButton" --include='*.jsx' --include='*.html' --include='*.md' .
```

Every `<IconButton …><i className="ph-…"/></IconButton>` becomes
`<IconButton … icon="ph-…" />`. **The Console's `<Icon name="search" />` wrapper cases need the
Phosphor class name it resolves to** — read `frameworks/react/ui_kits/console/Icon.jsx` to find the
mapping rather than guessing it, and record in the ledger that the per-call `size` override D2
identified as the batch's one measured capability loss is now gone from those sites.

- [ ] **Step 6: Write the React suite**

Create `frameworks/react/test/icon-button.test.jsx`. **Starting point — run it.**

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { IconButton } from '../components/forms/IconButton.jsx';

test('IconButton draws the Phosphor class it is given and hides it from assistive technology', () => {
  const html = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="New" />);
  assert.match(html, /class="ph-bold ph-plus"/);
  assert.match(html, /aria-hidden="true"/);
});

/* `label` must be the single accessible name. With showLabel unset the title
 * carries it too; with showLabel set the title is dropped, because a visible
 * label plus a title announces twice. Both branches are asserted because a
 * component that always rendered the title would pass the first alone. */
test('IconButton names itself with label, and drops the title once the label is visible', () => {
  const hidden = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="New" />);
  assert.match(hidden, /aria-label="New"/);
  assert.match(hidden, /title="New"/);
  const shown = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="New" showLabel />);
  assert.match(shown, /aria-label="New"/);
  assert.doesNotMatch(shown, /title="New"/);
});

/* Defaults to type="button" so an icon button inside a form does not submit
 * it -- the footgun ButtonType exists to make explicit. */
test('IconButton defaults its native type to button and honours an override', () => {
  assert.match(renderToStaticMarkup(<IconButton icon="ph-x" label="L" />), /type="button"/);
  assert.match(renderToStaticMarkup(<IconButton icon="ph-x" label="L" type="submit" />), /type="submit"/);
});

test('IconButton throws when icon is absent, matching the contract required flag', () => {
  assert.throws(
    () => renderToStaticMarkup(<IconButton label="New" />),
    /IconButton: `icon` is required/,
  );
});

test('IconButton throws when label is absent, matching the contract required flag', () => {
  assert.throws(
    () => renderToStaticMarkup(<IconButton icon="ph-x" />),
    /IconButton: `label` is required/,
  );
});

/* R4: the extends React.ButtonHTMLAttributes heritage clause and the {...rest}
 * spread both left this component, and `style` went with the heritage.
 * check:api reads the .d.ts and never opens the .jsx, so a test is the ONLY
 * regression guard. Asserted separately -- see Spinner. */
test('IconButton drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <IconButton icon="ph-x" label="L" style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

- [ ] **Step 7: Run the suite and prove the R4 test is not vacuous**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/icon-button.test.jsx
sha256sum frameworks/react/components/forms/IconButton.jsx
```

Expected: 6 pass. Then both induced regressions, separately, per Global Constraint 17, with the
`sha256sum` restore check.

- [ ] **Step 8: Rebuild the demos, update the prompt, check `README.md`**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos
bun run check:demos
grep -n "IconButton" README.md
```

`IconButton.prompt.md` needs real work here, not a Don't bullet: every example passing a child `<i>`
becomes `icon="…"`. Add:

```markdown
- Pass `icon` as a Phosphor class name — `icon="ph-bold ph-plus"`. Arena draws the `<i>` and hides it; `label` is what a screen reader announces.
- Don't pass an element as the icon. A single icon is a class name in Arena, which keeps the glyph inside `check:compliance`'s reach and inside Arena's own iconography.
```

Read every `README.md` hit and **report the check either way** — `README.md`'s iconography section is
normative and now has one more component obeying it.

- [ ] **Step 9: Run the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun run check:tailwind
bun run check:states
bun test frameworks/react/test/
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 25 contract(s) hold across 45 layer implementation(s)`; React **+6** against
Task 4's count; behaviour diff empty.

- [ ] **Step 10: Commit and record**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api)!: bring IconButton under the API capability contract

The icon stops being children and becomes a required primitive carrying a
Phosphor class name -- api/README.md's settled single-icon convention, which
keeps the glyph inside check:compliance's reach. IconButton now declares no
slot at all. The extends React.ButtonHTMLAttributes heritage clause and the
{...rest} spread leave (R4); disabled, type and the click event become declared
members rather than inherited ones. icon and label fail hard when absent.

Declares ButtonType and IconButtonVariant; reuses ControlSize.

check:api 24/44 -> 25/45.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Append `## Task 5: complete` to the ledger, including what the Console's `Icon.jsx` mapping turned
out to be. Report and stop for review.

---

## Task 6: Button

**Files:**
- Create: `api/types/button-variant.json`
- Create: `api/components/Button.json`
- Create: `frameworks/react/test/button.test.jsx`
- Modify: `frameworks/react/components/forms/Button.d.ts`
- Modify: `frameworks/react/components/forms/Button.jsx`
- Modify: `frameworks/react/components/forms/Button.prompt.md`
- Modify: the call sites Step 5 finds. Measured at plan time, `<Button>` is reached from **twelve**
  files: `frameworks/react/components/feedback/ConfirmDialog.jsx`,
  `frameworks/react/components/feedback/ErrorState.jsx`, and ten `*.card.entry.jsx` demos
  (`calendar`, `unauth-card`, `command-palette`, `confirm-dialog`, `onboarding`, `feedback`, `forms`,
  `empty-error-state`, `navigation`, `menu-pagination`), plus Console files. **Re-measure; do not
  trust this list.**
- Regenerate: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`, and every
  touched file's `.js` sibling
- Check: `README.md` prose

**Interfaces:**
- Consumes: Task 1's D1, D2, D3 and D7, plus `ControlSize` from Task 2 and `ButtonType` from Task 5.
- Produces: `ButtonVariant`. Nothing later in this plan depends on it.

> `Button` is last because it is the most-referenced component in the tree and because it exercises
> every decision at once: D1's enumeration, D2's icon convention on **two** members, and D3's content
> slot. Two of its twelve importers — `ConfirmDialog.jsx` and `ErrorState.jsx` — are **already
> contracted Plan B components**; their own contracts do not change, but their call sites do, and
> `scripts/check-manifest-states.mjs`'s `EXEMPT` map carries entries whose reason names
> *"ConfirmDialog's confirm/cancel buttons are React's own `<Button>`"*. Read that map before
> assuming `check:states` is unaffected.

- [ ] **Step 1: Confirm Button's own surface, and STOP**

Report to the maintainer:

- the member list as measured, and that `ButtonProps`' body declares six members while `children`,
  `disabled`, `style`, `onClick` and `type` arrive through the heritage clause;
- **exactly which members D1 admitted**, restated from the ledger;
- that `icon` and `iconRight` are **slots today** and become primitive strings under D2, and the
  measured call-site consequence: every `icon={<i className="ph-…"/>}` and every
  `icon={<Icon name="…"/>}` changes shape;
- that `Button` binds `button` with `"exceptions": []` and that nothing in this task changes a role,
  a disabled state or focusability;
- that `Button.manifest.json` declares slots `root` and `spinner` and variants `variant`, `size`,
  `full` — **no icon slot**, so the manifest needs no change. Verify by reading it;
- the re-measured importer list from the Files block above.

This blocks.

- [ ] **Step 2: Write the enum and the contract, then regenerate**

Create `api/types/button-variant.json`:

```json
{
  "name": "ButtonVariant",
  "kind": "enum",
  "description": "Primary for the one main action in a view; secondary for neutral actions; ghost for tertiary ones; danger for destructive ones. Danger is outline and never filled — Arena's only filled danger surface is the final confirmation inside ConfirmDialog.",
  "values": ["primary", "secondary", "ghost", "danger"]
}
```

Create `api/components/Button.json`:

```json
{
  "component": "Button",
  "description": "Action button. One primary per view; danger stays outline.",
  "api": {
    "content": { "form": "slot",
                 "description": "The button's label. Sits between the two icons when both are given." },
    "variant": { "form": "enum", "type": "ButtonVariant", "default": "primary",
                 "description": "Which action this is. Danger is outline, never filled." },
    "size": { "form": "enum", "type": "ControlSize", "default": "md",
              "description": "Height, from the density tokens, so the button re-densifies inside .arena-compact." },
    "icon": { "form": "primitive", "type": "string",
              "description": "Phosphor class name drawn before the label. Replaced by the spinner while loading." },
    "iconRight": { "form": "primitive", "type": "string",
                   "description": "Phosphor class name drawn after the label — a caret on a menu trigger, an arrow on a next action." },
    "loading": { "form": "primitive", "type": "boolean", "default": false,
                 "description": "Replaces the leading icon with a spinner and blocks activation. The spin slows under reduced motion rather than stopping — a frozen spinner reads as a hung process." },
    "full": { "form": "primitive", "type": "boolean", "default": false,
              "description": "Stretches to the container's width." },
    "disabled": { "form": "primitive", "type": "boolean", "default": false,
                  "description": "Blocks activation and dims the control. Implied by loading." },
    "type": { "form": "enum", "type": "ButtonType", "default": "button",
              "description": "Native button behaviour. Defaults to 'button' so a button inside a form does not submit it by accident." },
    "click": { "form": "event",
               "description": "The button was activated, by pointer or by keyboard." }
  }
}
```

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
bun run check:api
```

Expected from `check:api`: **FAIL**, itemised — the heritage clause plus one *"does not declare X"*
per inherited member, and a **form mismatch** on `icon` and `iconRight`, which the contract calls
`primitive` and the `.d.ts` still declares as slots.

- [ ] **Step 3: Migrate the `.d.ts`**

Replace `frameworks/react/components/forms/Button.d.ts` entirely with:

```ts
import type { ReactNode } from 'react';
import type { ButtonType, ButtonVariant, ControlSize } from '../../api.generated';

/**
 * Arena action button. Primary crimson for the main action (one per view);
 * secondary for neutral actions, ghost for tertiary ones, danger for destructive actions.
 * @startingPoint section="Forms" subtitle="Button with variants and states" viewport="700x160"
 */
export interface ButtonProps {
  /** The button's label. Sits between the two icons when both are given. */
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ControlSize;
  /** Phosphor class name drawn before the label, e.g. `'ph-bold ph-plus'`. */
  icon?: string;
  /** Phosphor class name drawn after the label. */
  iconRight?: string;
  /** Replaces the leading icon with a spinner and blocks activation. */
  loading?: boolean;
  /** Stretches to the container's width. */
  full?: boolean;
  disabled?: boolean;
  /** Defaults to `'button'` so a button inside a form does not submit it. */
  type?: ButtonType;
  /** The button was activated, by pointer or by keyboard. */
  onClick?: () => void;
}
export function Button(props: ButtonProps): JSX.Element;
```

- [ ] **Step 4: Migrate the `.jsx`**

In `frameworks/react/components/forms/Button.jsx`, the signature at lines 32–35 becomes:

```jsx
export function Button({
  children, variant = 'primary', size = 'md', icon, iconRight,
  disabled = false, loading = false, full = false, type = 'button', onClick,
}) {
```

The `<button>` gains `type` and `onClick`, loses `{...rest}`, and its style object loses `...style` —
so the object's last entry is the `transition` line and the tag closes `}}>` with no spread after it:

```jsx
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
```

The two icon slots become drawn glyphs. The body's first line, which today reads
`{loading ? <span className="arena-btn-spin" … /> : icon}`, becomes:

```jsx
      {loading
        ? <span className="arena-btn-spin" aria-hidden="true" style={{ width: 'calc(var(--sp-1) * 3.5)', height: 'calc(var(--sp-1) * 3.5)', boxSizing: 'border-box', border: 'var(--bw-strong) solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
        : icon && <i className={icon} aria-hidden="true" />}
      {children}
      {iconRight && <i className={iconRight} aria-hidden="true" />}
```

The spinner `<span>`'s style object is **byte-identical** to the one already there — it is reproduced
here only because the surrounding expression changed shape. Do not retype it; keep the existing text.

```bash
cd /home/juan/Dravensoft/Identity
grep -n "\.\.\.rest\|\.\.\.style" frameworks/react/components/forms/Button.jsx
```

Expected: **no output.**

- [ ] **Step 5: Find and fix every call site**

```bash
cd /home/juan/Dravensoft/Identity
grep -rln "<Button" --include='*.jsx' --include='*.html' --include='*.md' .
```

Twelve `.jsx` files at plan time plus prompt and demo prose. For each: `icon={<i className="X"/>}`
becomes `icon="X"`; `icon={<Icon name="rocket" size="var(--icon-md)" />}` becomes the Phosphor class
`Icon.jsx` resolves `rocket` to — **read that file, do not guess**; a `style` or stray attribute is
removed. `ConfirmDialog.jsx` and `ErrorState.jsx` are contracted components whose own contracts do
**not** change; only their call sites do. Report every file changed and confirm no contract file
outside `api/components/Button.json` was touched.

- [ ] **Step 6: Write the React suite**

Create `frameworks/react/test/button.test.jsx`. **Starting point — run it.**

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Button } from '../components/forms/Button.jsx';

test('Button renders its content slot', () => {
  assert.match(renderToStaticMarkup(<Button>Deploy</Button>), /Deploy/);
});

/* Both icons are drawn from Phosphor class names now, and they must land on
 * DIFFERENT sides of the label. Asserting only that both classes appear would
 * pass against a component that rendered both leading, so the order of the
 * three fragments is what is asserted. */
test('Button draws icon before the label and iconRight after it', () => {
  const html = renderToStaticMarkup(
    <Button icon="ph-bold ph-plus" iconRight="ph-bold ph-caret-down">Deploy</Button>
  );
  assert.match(html, /ph-bold ph-plus[\s\S]*Deploy[\s\S]*ph-bold ph-caret-down/);
});

/* loading REPLACES the leading icon rather than sitting beside it, and the
 * spinner is the only element carrying the arena-btn-spin class. Asserting the
 * icon's absence is what discriminates replacement from addition. */
test('Button replaces the leading icon with the spinner while loading', () => {
  const html = renderToStaticMarkup(<Button icon="ph-bold ph-plus" loading>Deploy</Button>);
  assert.match(html, /arena-btn-spin/);
  assert.doesNotMatch(html, /ph-bold ph-plus/);
});

test('Button is disabled while loading, without being passed disabled', () => {
  assert.match(renderToStaticMarkup(<Button loading>Deploy</Button>), /disabled/);
});

test('Button defaults its native type to button and honours an override', () => {
  assert.match(renderToStaticMarkup(<Button>x</Button>), /type="button"/);
  assert.match(renderToStaticMarkup(<Button type="submit">x</Button>), /type="submit"/);
});

/* Danger is outline, never filled -- README's normative convention. The
 * assertion names the transparent background specifically, because asserting
 * only that --danger appears would also be satisfied by a filled danger
 * button, which is the exact thing the convention forbids. */
test('Button renders danger as outline, never filled', () => {
  const html = renderToStaticMarkup(<Button variant="danger">Delete</Button>);
  assert.match(html, /background:transparent/);
  assert.match(html, /var\(--danger\)/);
});

/* R4: the extends React.ButtonHTMLAttributes heritage clause and the {...rest}
 * spread both left this component, and `style` went with the heritage.
 * check:api reads the .d.ts and never opens the .jsx, so a test is the ONLY
 * regression guard. Asserted separately -- see Spinner. */
test('Button drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <Button style={{ color: '#ff00ff' }} data-stray="x">x</Button>
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

> **The `background:transparent` assertion was verified against a real render while this plan was
> written** — `renderToStaticMarkup(<Button variant="danger">Delete</Button>)` serialises the inline
> style object as `…;color:var(--danger);background:transparent…`, so the substring matches
> literally. It is named here because it is the one assertion in this plan whose form depends on
> React's serialiser rather than on Arena's source. If it ever stops matching, print the rendered
> HTML and assert on what is actually there — **do not weaken the title** (Global Constraint 18).
> The claim being pinned is that danger is not filled, and it must stay that.

- [ ] **Step 7: Run the suite and prove the R4 test is not vacuous**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/button.test.jsx
sha256sum frameworks/react/components/forms/Button.jsx
```

Expected: 7 pass. Then both induced regressions, separately, per Global Constraint 17, with the
`sha256sum` restore check.

- [ ] **Step 8: Rebuild the demos, update the prompt, check `README.md`**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos
bun run check:demos
grep -n "Button" README.md
```

`Button.prompt.md` needs the same real work `IconButton.prompt.md` needed: every example passing an
element as `icon` or `iconRight` becomes a class name. Add the two bullets from Task 5, Step 8,
adapted to Button's two icon members. Read every `README.md` hit — Button appears in the danger
convention prose and in the H-rules — and **report the check either way**.

- [ ] **Step 9: Run the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun run check:tailwind
bun run check:states
bun run check:compliance
bun test frameworks/react/test/
bun test frameworks/react/test-dom
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 26 contract(s) hold across 46 layer implementation(s)`; every other gate PASS;
React **+7** in the merged process against Task 5's count and the isolated DOM process **unchanged at
26/5**; behaviour diff empty. `check:compliance` and the DOM suite join the list here because
`ConfirmDialog:react`'s compliance suite renders a tree containing Arena `<Button>`s — it is a Plan B
claim this task can break from the outside, which no earlier task in this plan could.

- [ ] **Step 10: Commit and record**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api)!: bring Button under the API capability contract

icon and iconRight stop being slots and become primitives carrying Phosphor
class names -- api/README.md's settled single-icon convention. children becomes
the contract's content slot, declared explicitly. The extends
React.ButtonHTMLAttributes heritage clause and the {...rest} spread leave (R4);
disabled, type and the click event become declared members. variant becomes the
new ButtonVariant enum; size reuses ControlSize and type reuses ButtonType.

Twelve files call <Button>, including the already-contracted ConfirmDialog and
ErrorState; their contracts are unchanged and only their call sites moved.

check:api 25/45 -> 26/46. That completes Plan C's first batch.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Append `## Task 6: complete` to the ledger. Report and stop for review.

---

## Task 7: Divergences and the citation sweep

**Files:**
- Modify: `components-divergences.md` (read first; it may come out unchanged)

**Interfaces:**
- Consumes: the five contracts from Tasks 2–6.
- Produces: a tree with no dead reference to a member this batch removed or renamed.

> **This task will probably delete nothing, and that is the finding, not a failure.** Measured at plan
> time, `components-divergences.md` is 906 lines and only three of its headings name a Plan C subject:
> `:246` *"The Angular layer has no Button primitive"*, `:840` *"UnauthCard's `panel` hand-duplicates
> Card's surface classes"*, `:868` *"SideNav is described three times, and only the colours agree"*.
> **None of the three is an API divergence** — the first is a statement about Material delegation, the
> second and third are rendering divergences — so `api/README.md`'s rule (*"An entry whose entire
> content is an API divergence is deleted"*) does not fire for any of them. Every Plan B batch deleted
> entries; this one is expected not to. Re-measure rather than trusting the paragraph.

- [ ] **Step 1: Re-read the three sections and decide**

```bash
cd /home/juan/Dravensoft/Identity
wc -l components-divergences.md
grep -n "^#\+ " components-divergences.md | grep -i "button\|card\|sidenav\|badge\|spinner"
```

Read each section in full. For each, state in the ledger which of the three it is — API (delete),
rendering (keep), or behaviour (keep) — and why. If one turns out to contain an API paragraph mixed
into a rendering entry, delete **that paragraph only**, as Plan A did for `Breadcrumbs` and
`AppLogo`.

- [ ] **Step 2: Check the three citations before touching anything**

Three files cite this document as supporting evidence, and deleting a cited section without
redirecting the citation breaks it:

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "components-divergences" --include='*.json' --include='*.ts' --include='*.md' --include='*.jsx' .
```

Expected at plan time: `frameworks/angular/primitives/command-palette/command-palette.behaviour.json`,
the `SideNav` entry in `frameworks/angular/behaviour-delegated.json`, and
`frameworks/angular/primitives/onboarding/onboarding.ts`. **The `SideNav` one matters here**: if Step
1 decides to touch `:868`, that citation must be redirected in the same change.

- [ ] **Step 3: Sweep for dead references to every removed or renamed member**

Per Global Constraint 21, broad `--include`, and read every hit rather than counting them:

```bash
cd /home/juan/Dravensoft/Identity
for term in "iconRight={<" "icon={<" "IconButton>" "React.CSSProperties" "ButtonHTMLAttributes" "HTMLAttributes<HTMLSpanElement>" "HTMLAttributes<HTMLDivElement>"; do
  echo "──── $term ────"
  grep -rn "$term" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.json' --include='*.md' --include='*.html' . | grep -v node_modules
done
```

A hit in a **contracted** component is a defect this task fixes. A hit in an **uncontracted** one —
`Input`, `Select`, `Checkbox`, `Textarea`, `SideNav` all still carry a heritage clause — is expected
and belongs to C2 and C3. Say which is which in the ledger rather than fixing what is not yours.

- [ ] **Step 4: Commit if anything changed**

If Steps 1–3 changed no file, record that in the ledger and **make no commit** — an empty commit
claiming a divergences pass happened is worse than none. Otherwise:

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "docs(divergences): reconcile the five contracted primitives

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 5: Record and report**

Append `## Task 7: complete` to the ledger, naming each of the three sections and the verdict given.
Report and stop for review.

---

## Task 8: Close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`
- Modify: `CHANGELOG.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`, if any of Tasks 2–6 deferred an edit
- Delete: `docs/superpowers/plans/2026-07-24-8b4-api-contracts-the-three-charts.md`

**Interfaces:**
- Consumes: everything Tasks 1–7 produced.
- Produces: a branch ready for the maintainer to review as a whole. **It does not merge and does not
  push** (Global Constraint 13).

- [ ] **Step 1: Run the full gate sweep, once**

```bash
cd /home/juan/Dravensoft/Identity
export CHROME_PATH=/usr/bin/chromium
bun run check
```

Expected: **all 23 steps PASS**, not INCOMPLETE. Global Constraint 14 explains why the export is not
optional on this machine. If any step SKIPs, fix the environment and re-run rather than reporting a
skip as a pass.

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3
bun test frameworks/react/test-dom 2>&1 | tail -3
```

Record both counts. The merged process should be Task 0's baseline plus the sum of the five tasks'
deltas; the isolated DOM process should be **unchanged at 26 across 5 files**, because this plan
creates no `test-dom` suite. **If the merged delta does not reconcile with the per-task numbers in
the ledger, stop and find out why** — a plan that cannot account for its own delta is exactly what
the spec's running-count table exists to catch.

- [ ] **Step 2: Update the spec**

In `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`:

- Add a **Plan 8C1** row to the running-count table under *Plan E*, with both measured counts.
- Write the accompanying paragraph in the register of the Plan B4 paragraph above it: what the batch
  contracted, the `check:api` movement (**21/41 → 26/46**), which types it declared and which it
  reused, and where its tests came from, reconciled per file. **State plainly that every contract in
  this batch is single-layer**, so the layer count moved by five rather than ten — a reader deriving
  the arithmetic from Plan B's rows would get it wrong otherwise.
- In the *Plan C* section, correct **"Two subjects the reader cannot parse today"**'s heritage figure:
  the annotation says *"Six React `.d.ts` files still carry a heritage clause"* and the measured
  number is **nine**, because three are `Omit<>`-wrapped and `check-api.mjs` reports any heritage
  clause. Do not write the new number as a bare figure — that paragraph has already been wrong three
  times. Write **how to measure it**:
  `grep -c '^export interface .*Props extends' frameworks/react/components/*/*.d.ts`.
- Record that the twenty-two named Plan C subjects are **twenty-one to contract**, `Switch` having
  been contracted by 8B1, and that this makes every Plan C contract single-layer.
- Record which of Plan C's cross-cutting decisions Task 1 settled and that they now live in
  `api/README.md`, so C2–C5 cite rather than re-derive.

- [ ] **Step 3: Update `CHANGELOG.md`**

Add entries under `## [Unreleased]` — never under the last version, per `CLAUDE.md`'s release rule.
One entry per contracted component plus one for the shared decisions, in the file's existing voice.
Note the breaking changes explicitly: `Button.icon`/`iconRight` and `IconButton`'s child icon now
take Phosphor class names, and all five components stop accepting `style` and arbitrary attributes.

- [ ] **Step 4: Update `CLAUDE.md`**

Three things, and Global Constraint 22 governs all of them — write methods, not derived figures:

1. **Move into *Known debt* anything recorded only in a plan document.** The 8B4 plan is deleted in
   Step 5; before deleting it, read its close-out and Appendix A and carry forward anything that is
   still true and lives nowhere else. This is the failure mode that section's own preamble names.
2. **Retire the stale `Tooltip` timer entry.** *Known debt*'s first bullet says
   *"`Tooltip`'s timer … has no test"*. `frameworks/react/test-dom/tooltip-timer.test.jsx` exists and
   its header reads *"This file is that debt paid"*. Verify that before deleting the bullet, then
   delete it. A debt record that outlives the debt is the exact thing every gate in this repository
   rejects.
3. **Record what this batch newly established**, in the *Architecture* API paragraph: that Plan C's
   contracts are single-layer, and that the single-icon convention now reaches `Button` and
   `IconButton`. Add any new debt this batch created — in particular whatever D1's enumeration cut
   deliberately dropped, which is a capability loss with no gate behind it.

- [ ] **Step 5: Delete the executed 8B4 plan**

```bash
cd /home/juan/Dravensoft/Identity
git rm docs/superpowers/plans/2026-07-24-8b4-api-contracts-the-three-charts.md
```

Executed plans do not stay in the tree (`24f250b`). Step 4.1 is what makes this safe.

- [ ] **Step 6: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "docs: close out plan 8C1 -- the five composed primitives under contract

check:api 21/41 -> 26/46. Every contract in Plan C is single-layer: Angular
implements none of the twenty-one React-only components, so a batch moves the
layer count by as many contracts as it writes.

Corrects the spec's heritage-clause figure from six to nine and replaces it
with the command that measures it. Retires the Tooltip timer debt entry, which
tooltip-timer.test.jsx already paid. Deletes the executed 8B4 plan.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 7: The whole-branch review**

Budget this as real work (Global Constraint 23). Read the branch's full diff — `git diff main...HEAD`
— against these questions, which per-task review structurally could not answer:

- **Do the five agree with each other?** Each task independently named a default slot, decided how an
  icon renders, and chose which native attributes survive. Five defensible answers that disagree is
  the `StatCard` failure the whole contract layer exists to prevent.
- **Is every `description` consistent across its three homes?** Contract, `.d.ts` JSDoc and
  `.prompt.md`, with nothing holding them in step (Global Constraint 20).
- **Did any task weaken a test to make it pass?** Compare each suite's titles against what its bodies
  assert.
- **Are the enums minimal?** Five new types were declared. Is any of them value-identical to another,
  or to an existing one — which would mean 8B1's reuse rule was missed?
- **Does the `check:api` climb reconcile?** 21/41 → 22/42 → 23/43 → 24/44 → 25/45 → 26/46, each step
  exactly +1/+1.

Fix what it finds, in its own commits, and record every finding in the ledger. Then report to the
maintainer with the branch summary and **stop** — no merge, no push.

---

## Appendix A: what this plan deliberately does not do

- **It does not touch Angular.** No primitive, no `.variants.ts`, no manifest, no
  `host-class-binding.test.ts`, no NG0950 bypass. The twenty-two controls Angular delegates to
  Material are Plan D's, and Plan C exists precisely so their APIs are settled before Angular has an
  implementation to defend.
- **It does not contract the other sixteen Plan C subjects.** `Calendar`, `Checkbox`, `Dialog`,
  `Input`, `Menu`, `Pagination`, `ProgressBar`, `Radio`, `SegmentedControl`, `Select`, `SideNav`,
  `Table`, `Tabs`, `Textarea`, `Toast` and `Tooltip` belong to C2–C5. Task 1 decides what they share;
  it does not migrate them.
- **It does not fix `Calendar`'s or `Table`'s missing keyboard navigation**, or make `Tooltip`
  keyboard-reachable. `CLAUDE.md` records all three, the spec's own risk section repeats that Plan C
  defines contracts from components with known behavioural debt, and an API for a component that does
  not yet trap focus is not thereby wrong.
- **It does not touch the `check:duplicate-constants` debt** or any of the chart-token exclusions.
- **It does not cut a release.** No version string moves, no tag, no `marketplace.json` edit.
- **It does not restore the Plan E suspended tests.** Those are Plan E's, after Plan D.
