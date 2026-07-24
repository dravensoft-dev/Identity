# Plan 8B4 — API capability contracts, the three SVG charts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `BarChart`, `LineChart` and `DoughnutChart` under the API capability contract,
taking `check:api` from 18 contracts / 35 layer implementations to **21 / 41** with no API
divergence left between React and Angular for any of the three. That closes Plan B: 3 from Plan A
plus 18 from Plan B, all twenty-one contracted.

**Architecture:** The three charts are **one reshape applied three times** (Plan 8B3, Appendix A).
They share `valueFormatter → valueSuffix`, they share `CatSlot`, and `LineChart.d.ts` and
`DoughnutChart.d.ts` both re-export types from `BarChart.d.ts`. So this plan opens with **one
combined blocking audit over all three surfaces at once** (Task 1) rather than three separate ones,
because a decision taken while looking at `BarChart` alone is a decision *discovered* in
`DoughnutChart`'s audit — the exact failure `api/README.md`'s audit protocol exists to prevent.
Only then do the three migrate, one task each, hardest first: BarChart (creates the shared enum,
carries the whole NG0950 rework and the batch's one firm compliance suite) → LineChart (flattens
the `Omit<>` heritage) → DoughnutChart (gains a `seriesLabel` it never had).

**Tech Stack:** Bun (build, test, gates), plain-node-portable `scripts/`, React 18 with inline
token-valued styles, Angular 22 standalone `OnPush` signal primitives. The three charts are the
framework layer's **declared styling exception**: no Tailwind manifest, no `.variants.ts`,
token-valued camelCase `[style]` objects. `check:tailwind`, `check:states`, `check:coverage` and
`check:arbitrary` therefore have nothing to say about them, and no manifest or recipe work appears
anywhere in this plan.

**Spec:** `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` — *Plan B*, and
specifically *"What Plan B3 measured about the three charts, for 8B4"*. **Normative vocabulary:**
`api/README.md`.

**Branch:** `api-contracts-8b4`, cut from `main` at `0205cfc` (the B3 merge `2bdc2a9` plus the
running-count correction). Tree clean, no commits of its own at plan time.

---

## Global Constraints

Every task's requirements implicitly include this section. Constraints 1–17 are Plan 8B3's, carried
forward verbatim in substance because every one of them was earned; 18–24 are new to this plan and
each names the measurement that produced it.

1. **English only.** All code, comments, docs, contract `description`s and UI copy in the repo are
   English. (Conversation with the maintainer is Spanish; the repo is not.)
2. **Task 1 is a single blocking audit covering all three charts, and it STOPS.** It presents, in
   one exchange: each chart's current API measured in both layers; which member breaks which rule,
   cited to R1–R5 or to the seven forms; and the reshapes with their costs. **The decision is the
   maintainer's.** No file is written until they answer. Tasks 2, 3 and 4 each open with a short
   **confirmation** step — re-measure that chart's own surface and raise only its own open
   question — which also blocks, but must not re-litigate a Task 1 decision.
3. **`check:api` climbs and never drops:** 18/35 → **19/37** (Task 2) → **20/39** (Task 3) →
   **21/41** (Task 4). Record the measured pair in `.superpowers/sdd/progress.md` at the end of
   every task.
4. **`check:api` carries no exception map.** An API divergence is a defect. There is nowhere to
   record one, by design.
5. **The other two contracts are firm** (`api/README.md`). Bringing a component under contract may
   not weaken, remove or contradict its behaviour binding or the tokens it renders from. All three
   charts bind `figure-with-data-table` **with `"exceptions": []`** in both layers — every
   requirement claimed met, nothing excused. That is the strongest binding shape in the repository
   and it must survive this plan untouched: **every `*.behaviour.json` in this batch comes out of
   the branch with an empty diff.** Verify per task with
   `git diff --stat -- '*.behaviour.json'`.
6. **The binding table is mechanical** (`api/README.md`, implemented by `bindingName()` in
   `scripts/check-api.mjs`): a primitive/enum/object/array member `x` is a React prop `x` and an
   Angular `input()` named `x`. **No member in this plan is a slot or an event** — all three charts
   are pure data-in components — so the slot and event rows of that table are not exercised here.
7. **Required-ness is contracted** for the four inbound non-slot forms only. **It also governs
   runtime:** React throws from its render, Angular uses `input.required<T>()`. The established
   React idiom is `frameworks/react/components/feedback/EmptyState.jsx:4`:
   `if (!title) throw new Error('EmptyState: \`title\` is required');`. The gate cannot see the
   runtime half; the audit enforces it.
8. **NG0950 is REAL in this plan, unlike the last three tasks of 8B3.** Measured, not estimated:
   **13 tests** in `frameworks/angular/test/host-class-binding.test.ts` render the three charts
   through `TestBed.createComponent(<X>ChartHost)` where the host fixture is
   `` @Component({ template: `<arena-bar-chart />` }) class BarChartHost {} `` — **no bindings at
   all**. The moment `labels`/`values` become `input.required`, all 13 throw NG0950. The bypass is
   established four times in that same file (`createAppLogoMarkHost`, `createBreadcrumbsHost`,
   `createBulkActionBarHost`, and PageHead's): query the real child through
   `By.directive(<Component>)` and overwrite the instance field **before the first
   `detectChanges()`**. Task 2 carries the bar-chart third, Task 3 the line-chart third, Task 4 the
   doughnut-chart third.
9. **`chart-data-table.test.ts` needs no NG0950 rework, and that was verified rather than assumed.**
   Its `renderBarChart()` already overwrites `instance['labels']` / `instance['values']` /
   `instance['seriesLabel']` before `detectChanges()` — the same bypass under a different name. It
   is the only suite in the tree that pins a chart's behaviour contract (`BarChart:angular` in
   `COVERED`), so it is also where Task 2 proves `valueSuffix` reaches the accessible table.
10. **The three `*-geometry.test.ts` suites are untouched by required-ness.** `bar-chart-geometry`,
    `line-chart-geometry` and `doughnut-chart-geometry` contain **zero** `TestBed` and zero
    `createComponent` — they exercise plain exported functions (`barColumns`, `nearestPointIndex`,
    `doughnutSlices`, `doughnutRadii`…). Do not modify them for NG0950; if one needs a change, that
    is a signal something else went wrong.
11. **`react/.d.ts` re-export rule.** A migrated React `.d.ts` re-exports **exactly** the named
    types the pre-migration file declared and exported locally — no more, no less. `SeriesTone` was
    a named exported type and becomes a contract enum, so it keeps a re-export. `CatSlot` was a
    named exported type that **dissolves into `number`** and moves nowhere, so there is nothing to
    re-export and it is deleted outright (Task 1, decision D2).
12. **A contract type is imported with `import type`, in both layers**, specifier
    `'../../api.generated'` from `frameworks/react/components/<group>/` and from
    `frameworks/angular/primitives/<name>/`. Angular's `chart-internals.ts` is one directory
    shallower and uses `'../api.generated'` — verified against its existing
    `from '../tokens.generated'` import at line 13.
13. **Any `.jsx` or `.entry.jsx` edit is followed by `bun run build:demos`, and the regenerated
    `.js` sibling is committed in the same commit.** Verified with `bun run check:demos`.
14. **`bun run check` runs exactly ONCE**, in Task 6, when implementation is finished. Individual
    gates run per task (listed in each task's gate step).
15. **Do not merge and do not push.** The branch stays local until the maintainer asks.
16. **Test the layer you changed.** React has **no** suite for any of the three charts today
    (`frameworks/react/test/` holds `chart-card.test.jsx` and nothing else from this group), so
    each of Tasks 2, 3 and 4 creates one.
17. **A task that removes an R4 escape ships a test proving the escape is gone, and it must
    DISCRIMINATE.** `check:api` reads React's `.d.ts` and never opens the `.jsx`, so restoring
    `style` and `{...rest}` leaves the gate green. All three React charts carry **both** escapes
    (`style?: React.CSSProperties` in the `.d.ts`, `...rest` in the `.jsx`), so this applies to
    Tasks 2, 3 **and** 4. Render the component passing an unexpected `style` **and** an unexpected
    attribute, and assert each is absent **in its own assertion** — a component that stopped
    spreading `...rest` but still merged `...style` must fail.
    `style={{ color: '#ff00ff' }}` is safe for `check:dimensions`: `color` is not in that gate's
    `PROPS` set (`scripts/check-dimension-literals.mjs:69-80`).
18. **A test title states exactly what the body asserts.** Three of Plan 8B3's five plan-supplied
    tests were its weak point. **The worked test code in this plan is a starting point, not a
    verified artifact** — run it, and if it does not discriminate, fix the test rather than
    narrowing the title.
19. **Do not reformat `BarChart.jsx`'s or `LineChart.jsx`'s tooltip `top:` line.**
    `scripts/check-dimension-literals.mjs`'s `EXEMPT` map is keyed by the literal site string:
    `` 'frameworks/react/components/charts/BarChart.jsx:top:`calc(${yOf(values[hover])}px - var(--sp-2))`' ``
    and
    `` 'frameworks/react/components/charts/LineChart.jsx:top:`calc(${yOf(values[hover])}px - calc(var(--sp-1) * 2.5))`' ``.
    A stale `EXEMPT` entry — one that no longer matches a real violation — **fails the gate itself**.
    `valueSuffix` does not touch `yOf(values[hover])`, so both keys survive if the lines are left
    alone. If either must change, `scripts/check-dimension-literals.test.mjs` asserts on `EXEMPT`
    by name and changes with it.
20. **Do not touch `check:duplicate-constants` debt.** `CLAUDE.md` records that `600`
    (`ASSUMED_WIDTH`), the axis-label `8`, `0.34`, `0.62`, `900` and `220` are duplicated verbatim
    across the layers and that the gate catches none of them. This plan edits those files and must
    not make it worse — but tokenising them is token work, not API work, and is out of scope.
21. **The `valueSuffix` semantics are raw concatenation** (Task 1, decision D1):
    `` `${value}${valueSuffix ?? ''}` ``. The consumer writes the space if they want one —
    `valueSuffix=" ms"` versus `valueSuffix="%"`. Arena never inserts a separator. This is
    `Breadcrumbs.separator`'s shape: a raw string Arena draws.
22. **The suffix reaches every number Arena draws, and nothing else.** `api/README.md`: "the axis
    tick, the tooltip and the accessible data table alike". Concretely: BarChart and LineChart —
    the value-axis tick labels, the hover tooltip's value line, and the `<td>` of every table row.
    DoughnutChart — the legend row's value and the `<td>`, and **not** the centre label, which
    renders a *percentage* (`{{ segment.percent }}%`), not a value.
23. **`README.md` is the normative design specification and moves in the same change as the
    component** (`CLAUDE.md`). No task in Plan 8B3 listed it and one task had to add it
    unprompted. It is listed in Tasks 2, 3, 4 and 6 here. Its charts prose is at
    `README.md:52`, `:319`, `:323`, `:325` and `:373` — read them before deciding a task needs no
    edit, and say so in the report either way.
24. **A member `description` lives in the contract only.** Nothing generates from
    `api/components/*.json`. Each layer's doc comment and `prompt.md` restate it by hand and
    nothing holds the three in step. Restate it anyway; do not leave a layer's prose describing
    `valueFormatter` after the member is gone.

---

## File Structure

Created by this plan:

| Path | Responsibility |
|---|---|
| `api/types/series-tone.json` | The `SeriesTone` enum — four values, replacing React's local `SeriesTone` union and Angular's `ArenaChartTone` |
| `api/components/BarChart.json` | Task 2's neutral contract |
| `api/components/LineChart.json` | Task 3's neutral contract |
| `api/components/DoughnutChart.json` | Task 4's neutral contract |
| `frameworks/react/test/bar-chart.test.jsx` | React render proof for Task 2 |
| `frameworks/react/test/line-chart.test.jsx` | React render proof for Task 3 |
| `frameworks/react/test/doughnut-chart.test.jsx` | React render proof for Task 4 |

Regenerated (committed generated output, guarded by `check:api`'s drift assertion):
`frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`.
Regenerated by `bun run build:demos` (guarded by `check:demos`):
`frameworks/react/components/charts/*.js` and `charts.card.entry.js`.

Modified, per chart:

| Layer | Files |
|---|---|
| React | `frameworks/react/components/charts/<Name>.d.ts`, `<Name>.jsx`, `<Name>.prompt.md` |
| Angular | `frameworks/angular/primitives/<name>/<name>.ts`, `<name>.prompt.md` |
| Shared | `frameworks/react/components/charts/charts.card.entry.jsx`, `frameworks/angular/test/host-class-binding.test.ts` |

Modified once, in Task 2 only: `frameworks/angular/primitives/chart-internals.ts` (deletes
`ArenaChartTone`), `frameworks/angular/test/chart-internals.test.ts` (its three references),
`frameworks/angular/test/chart-data-table.test.ts` (gains the `valueSuffix` pin).

Modified in Task 5: `components-divergences.md`.
Modified in Task 6: `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`, `CHANGELOG.md`,
`CLAUDE.md`, `README.md` if any task deferred it. **Deleted in Task 6:**
`docs/superpowers/plans/2026-07-24-8b3-api-contracts-third-batch.md`.

---

## Task 0: Pre-flight

**Files:**
- Rename: `.superpowers/sdd/progress.md` → `.superpowers/sdd/progress-8b3-archived.md`
- Create: `.superpowers/sdd/progress.md`

**Interfaces:**
- Produces: a fresh B4 ledger every later task appends to, and a verified `18 / 35` baseline every
  later task's climb is measured against.

> **`.superpowers/` is git-ignored scratch** — the root `.gitignore:37` ignores the whole
> directory and `progress.md` is untracked. So this task uses plain `mv`, **not `git mv`** (which
> fails with *"not under version control"*), and it **produces no commit**. Every later task's
> `git add -A` picks up its source changes and silently leaves the ledger behind, which is correct
> and is what B1, B2 and B3 all did. Do not try to force the ledger into a commit.

- [ ] **Step 1: Archive B3's ledger**

`.superpowers/sdd/progress.md` currently holds Plan 8B3 in full — its seven tasks, its final
whole-branch review with six findings, its rolled-up Minors and its maintainer decisions, 599
lines. It must be preserved, not overwritten.

```bash
cd /home/juan/Dravensoft/Identity
mv .superpowers/sdd/progress.md .superpowers/sdd/progress-8b3-archived.md
```

Verify both the archive and the absence:

```bash
cd /home/juan/Dravensoft/Identity
wc -l .superpowers/sdd/progress-8b3-archived.md
test ! -e .superpowers/sdd/progress.md && echo "progress.md cleared, ready for Step 2"
```

Expected: `599 .superpowers/sdd/progress-8b3-archived.md` and the cleared message.

- [ ] **Step 2: Open the B4 ledger**

Create `.superpowers/sdd/progress.md` with exactly this content:

```markdown
# Plan 8B4 — API capability contracts, the three SVG charts

Plan: docs/superpowers/plans/2026-07-24-8b4-api-contracts-the-three-charts.md
Branch: api-contracts-8b4
Base commit before Task 1: 0205cfc (main; B3 merge 2bdc2a9 + the running-count correction)
(Plan 8B3's ledger is archived beside this one as progress-8b3-archived.md, 599 lines.)

Subjects: BarChart, LineChart, DoughnutChart — one reshape applied three times. This is the LAST
batch of Plan B; when it lands, all 21 of Plan A + Plan B are contracted.

Task 1 is a SINGLE blocking audit over all three surfaces, because the decisions are shared.
Tasks 2-4 each open with a per-chart CONFIRMATION that also blocks but must not re-litigate Task 1.
Task 5 is the divergences pass, Task 6 is close-out.

check:api must climb 18/35 → 19/37 → 20/39 → 21/41, never dropping.

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
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -5
bun test frameworks/react/test-dom 2>&1 | tail -5
```

Expected: clean tree at `0205cfc`; `check-api: 18 contract(s) hold across 35 layer
implementation(s)`; 932 tests across 82 files in the merged process; 26 across 5 in the isolated
DOM process. **If `check:api` does not read exactly 18/35, stop and report** — the whole plan's
arithmetic is measured against it. The test counts are informational; the spec's own Plan B3 row
records 932/82, and a small drift there is not a blocker (that table already carries a documented
2-test undercount from B2), but record what you actually measured rather than the expected value.

- [ ] **Step 4: Record it and stop**

Fill the ledger's `## Pre-flight` section with the four measured values. **No commit.** Report to
the maintainer and move to Task 1.

---

## Task 1: The combined blocking audit

**Files:** none. This task writes no source file. It writes the ledger's
`## Maintainer decisions taken` section and nothing else.

**Interfaces:**
- Consumes: Task 0's verified 18/35 baseline.
- Produces: the seven decisions D1–D7 below, recorded in the ledger, that Tasks 2, 3 and 4
  implement without re-opening.

> This task exists because `BarChart`, `LineChart` and `DoughnutChart` share three types and one
> reshape. `api/README.md`'s audit protocol says a component is not migrated by inference; Plan
> 8B3's spec adds that a shared decision "should be decided deliberately in `BulkActionBar`'s audit
> rather than discovered in `CommandPalette`'s". With three components sharing every hard question,
> the only way to honour both is to audit all three together, once.

- [ ] **Step 1: Re-measure all six surfaces at HEAD**

Do not trust this plan's transcription. Read the six files and confirm each member:

```bash
cd /home/juan/Dravensoft/Identity
cat frameworks/react/components/charts/BarChart.d.ts
cat frameworks/react/components/charts/LineChart.d.ts
cat frameworks/react/components/charts/DoughnutChart.d.ts
sed -n '179,190p' frameworks/angular/primitives/bar-chart/bar-chart.ts
sed -n '205,213p' frameworks/angular/primitives/line-chart/line-chart.ts
sed -n '242,247p' frameworks/angular/primitives/doughnut-chart/doughnut-chart.ts
```

The measured state at plan time, to check against:

| Member | React BarChart | Angular BarChart | React LineChart | Angular LineChart | React Doughnut | Angular Doughnut |
|---|---|---|---|---|---|---|
| `labels` | `string[]` **required** | `input<string[]>([])` optional | inherited | `input<string[]>([])` | `string[]` **required** | `input<string[]>([])` |
| `values` | `number[]` **required** | `input<number[]>([])` optional | inherited | `input<number[]>([])` | `number[]` **required** | `input<number[]>([])` |
| `seriesLabel` | `string?` | `input<string>()` | inherited | `input<string>()` | **absent** | **absent** |
| `slot` | `CatSlot?` | `input<number>()` | inherited | `input<number>()` | absent | absent |
| `slots` | `CatSlot[]?` | `input<number[]>()` | **Omit'ed away** | absent | `CatSlot[]?` | `input<number[]>()` |
| `tone` | `SeriesTone?` | `input<ArenaChartTone>()` | inherited | `input<ArenaChartTone>()` | absent (by design) | absent (by design) |
| `area` | — | — | `boolean?` | `input(false, {transform: booleanAttribute})` | — | — |
| `valueFormatter` | `(number)=>string` | `input<(value:number)=>string>(…)` | inherited | same | `(number)=>string` | same |
| `style` | `React.CSSProperties?` | — | inherited | — | `React.CSSProperties?` | — |
| `{...rest}` | in `.jsx` only | — | in `.jsx` only | — | in `.jsx` only | — |

- [ ] **Step 2: Confirm what the gate says today, and how it says it**

```bash
cd /home/juan/Dravensoft/Identity
cat > /tmp/arena-probe-8b4.mjs <<'EOF'
import { readFileSync } from 'node:fs';
import { reactSurface, angularSurface } from './scripts/lib/api-surface.mjs';
const probes = [
  ['react/BarChart', 'frameworks/react/components/charts/BarChart.d.ts', reactSurface, 'BarChartProps'],
  ['react/LineChart', 'frameworks/react/components/charts/LineChart.d.ts', reactSurface, 'LineChartProps'],
  ['react/DoughnutChart', 'frameworks/react/components/charts/DoughnutChart.d.ts', reactSurface, 'DoughnutChartProps'],
  ['angular/BarChart', 'frameworks/angular/primitives/bar-chart/bar-chart.ts', angularSurface, 'BarChart'],
  ['angular/LineChart', 'frameworks/angular/primitives/line-chart/line-chart.ts', angularSurface, 'LineChart'],
  ['angular/DoughnutChart', 'frameworks/angular/primitives/doughnut-chart/doughnut-chart.ts', angularSurface, 'DoughnutChart'],
];
for (const [label, path, read, symbol] of probes) {
  try {
    const s = read(readFileSync(path, 'utf8'), symbol);
    console.log(label, JSON.stringify(s));
  } catch (e) {
    console.log(label, 'THREW', e.name + ':', e.message);
  }
}
EOF
bun /tmp/arena-probe-8b4.mjs
```

**Expected — and this was MEASURED on 2026-07-24, correcting an earlier draft of this plan that
predicted six throws:** **five** of the six lines read `THREW UnrecognisedShape: an inbound function
that returns "string" is none of the seven forms…`. `classify()` throws on `valueFormatter`, and a
throw aborts the **whole surface**, so for those five the pre-migration `check:api` produces one
*"the reader could not read this surface"* message per layer, **not** an itemised list of R4/R5
violations the way every earlier batch did.

**`react/LineChart` is the exception and reads cleanly**, returning
`{"heritage":["Omit<BarChartProps, 'slots'>"],"members":[{"name":"area","required":false,"form":"primitive","type":"boolean"}]}`.
The reason matters for Task 3's expectations: **the reader does not resolve heritage.**
`reactSurface()` reports the `extends` clause and then reads only the interface's OWN body, and
`LineChartProps`' body contains nothing but `area?: boolean`. `valueFormatter`, `style`,
`labels`, `values`, `seriesLabel`, `slot` and `tone` all live in `BarChartProps` and are never
seen. So `react/LineChart` fails the gate with an **itemised list** — the heritage clause as R4,
plus one *"does not declare X"* per contract member it inherits rather than declares — while
`angular/LineChart` fails with the throw.

Record what the probe actually prints. Any deviation from the above is the audit's finding.

Delete the probe when done: `rm /tmp/arena-probe-8b4.mjs`.

- [ ] **Step 3: Present the audit to the maintainer, and STOP**

Present, in one message: the table from Step 1, the throw from Step 2, and the seven decisions
below. **These seven were already taken by the maintainer during this plan's own design session and
are recorded in Appendix A.** Task 1's job is therefore to *confirm them against the re-measured
tree* and surface anything the measurement contradicts — not to ask them again from scratch. If
Step 1 or Step 2 disagrees with anything in Appendix A, that disagreement is the audit's finding
and blocks.

- **D1 — `valueFormatter` → `valueSuffix`.** Forced by the vocabulary (an inbound function that
  returns a value is none of the seven forms) and named by `api/README.md:58`. **Raw
  concatenation:** `` `${value}${valueSuffix ?? ''}` ``. **Capability loss, stated plainly:** a
  formatter could round, insert thousands separators and format currency; a suffix cannot. Same
  shape as `ActivityFeed.renderItem`'s removal in 8B3.
- **D2 — `CatSlot` is deleted outright**, not kept as an alias of `number`. R5 plus
  `api/README.md`'s worked example ("the charts' categorical ramp slot … is declared a bare
  `number` on both layers, not an `api/types/` enum"). No back-compat alias: the repository's
  standing rule is to delete dead API and ship the breaking change rather than leave a tombstone.
  **`Calendar.d.ts:5` declares its OWN local `CatSlot` and imports nothing from `BarChart`** —
  it is untouched by this plan and belongs to Plan C.
- **D3 — `SeriesTone` becomes a contract enum**, four values, declared once at
  `api/types/series-tone.json`. It cannot reuse `Tone` (seven values), `AlertTone` (five) or
  `TagTone` (five) — 8B1's condition for reuse is an *identical* value set. Angular's
  `ArenaChartTone` is deleted from `chart-internals.ts` in favour of the generated type. React's
  `BarChart.d.ts` keeps a re-export of the name (Global Constraint 11).
- **D4 — `labels` and `values` are REQUIRED in both layers.** This settles a real, pre-existing
  divergence: React declares them required today, Angular optional with a `[]` default. Required
  matches the four consecutive decisions of 8B3 (`count`/`actions`, `commands`, `items`, `steps`).
  **Cost, measured:** 13 tests in `host-class-binding.test.ts` throw NG0950 and need the
  `By.directive` bypass. `chart-data-table.test.ts` and the three `*-geometry.test.ts` suites do
  not.
- **D5 — `style` and `{...rest}` leave all three React charts** (R4). Both must be removed from
  the `.jsx` as well as the `.d.ts`, and each removal ships its own discriminating test (Global
  Constraint 17).
- **D6 — `LineChartProps extends Omit<BarChartProps, 'slots'>` is flattened** into a full member
  list. `scripts/check-api.mjs:412` reports *any* heritage clause as the `{...rest}` R4 escape,
  with no special case for `Omit`. Source work, not gate work. Cost: the doc comments on
  `labels`/`values`/`seriesLabel`/`slot`/`tone` are restated in `LineChart.d.ts` rather than
  inherited — that duplication is the price of R4 and is not a defect.
- **D7 — `DoughnutChart` GAINS a `seriesLabel`.** A deliberate scope addition, approved by the
  maintainer. Today its `aria-label` is the literal `"Doughnut chart"` with **no consumer-supplied
  path at all** — the worst case of the aria-label debt `CLAUDE.md` records — and its table header
  is a bare `"Value"`. Adding `seriesLabel` brings it level with the other two: a name when one is
  given, the type-only fallback when it is not. Precedent: 8B2 decomposed `PageHead`'s `style`
  escape into a real `align` member at the maintainer's direction rather than merely dropping it.
  **It does NOT gain `tone` or `slot`** — a slice IS a category, and both layers document that.

- [ ] **Step 4: Record the decisions in the ledger**

Write the `## Maintainer decisions taken` section with D1–D7 as answered, including any correction
the re-measurement produced. This section is what a reviewer reads to check the judgement, not only
the diff.

**No commit.** Move to Task 2.

---

## Task 2: BarChart

**Files:**
- Create: `api/types/series-tone.json`
- Create: `api/components/BarChart.json`
- Create: `frameworks/react/test/bar-chart.test.jsx`
- Modify: `frameworks/react/components/charts/BarChart.d.ts`
- Modify: `frameworks/react/components/charts/BarChart.jsx`
- Modify: `frameworks/react/components/charts/BarChart.prompt.md`
- Modify (coherence only, minimum edit — see Step 5):
  `frameworks/react/components/charts/LineChart.d.ts` (drops `CatSlot` from its re-export),
  `frameworks/react/components/charts/DoughnutChart.d.ts` (drops the `CatSlot` import and
  re-export, `slots` becomes `number[]`),
  `frameworks/angular/primitives/line-chart/line-chart.ts` (`ArenaChartTone` → `SeriesTone`, see
  Step 7). **None of these three is migrated here** — deleting a type while a sibling still
  imports it is what forces each edit, nothing more.
- Modify: `frameworks/angular/primitives/bar-chart/bar-chart.ts`
- Modify: `frameworks/angular/primitives/bar-chart/bar-chart.prompt.md`
- Modify: `frameworks/angular/primitives/chart-internals.ts` (delete `ArenaChartTone`)
- Modify: `frameworks/angular/test/chart-internals.test.ts` (3 references)
- Modify: `frameworks/angular/test/chart-data-table.test.ts` (NG0950-safe already; gains the
  `valueSuffix` pin)
- Modify: `frameworks/angular/test/host-class-binding.test.ts` (the 4 bar-chart tests)
- Modify: `frameworks/react/components/charts/charts.card.entry.jsx` (2 `<BarChart>` call sites)
- Regenerate: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`,
  `frameworks/react/components/charts/BarChart.js`, `charts.card.entry.js`
- Check: `README.md` charts prose (Global Constraint 23)

**Interfaces:**
- Consumes: Task 1's decisions D1–D6.
- Produces: `api/types/series-tone.json` declaring `SeriesTone` with values
  `["success", "warning", "danger", "info"]`, emitted into both `api.generated.*` modules — Tasks 3
  and 4 import it rather than declaring anything. Also produces the `createBarChartHost()` helper
  shape that Tasks 3 and 4 copy for their own charts.

- [ ] **Step 1: Confirm BarChart's own surface, and STOP**

Re-read `frameworks/react/components/charts/BarChart.d.ts`, `BarChart.jsx` and
`frameworks/angular/primitives/bar-chart/bar-chart.ts`. Report to the maintainer:

- the member list of each layer as measured;
- the contract this task will write (Step 3 below), member by member;
- confirmation that BarChart is the **only** chart with both `slot` and `slots`, so it is the one
  place both ramp members are exercised;
- confirmation that `BarChart:angular` is in `COVERED` (`scripts/check-compliance.mjs:79`) and that
  `chart-data-table.test.ts` is therefore the firm suite this task must not weaken.

This blocks. It must not re-open D1–D6.

- [ ] **Step 2: Write the shared enum and regenerate**

Create `api/types/series-tone.json`:

```json
{
  "name": "SeriesTone",
  "kind": "enum",
  "description": "For a series that IS a state (error rate, pass/fail) rather than an identity. A chart carries identity or meaning, never both — passing tone alongside slot/slots warns in development and tone wins.",
  "values": ["success", "warning", "danger", "info"]
}
```

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api
git diff --stat frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

Expected: both modules gain a `SeriesTone` type, inserted alphabetically. Confirm by reading the
diff that it landed between `PageHeadAlign` and `SkeletonVariant` (or wherever the generator's own
sort places it) and that **no other type moved**.

- [ ] **Step 3: Write the contract**

Create `api/components/BarChart.json`:

```json
{
  "component": "BarChart",
  "description": "Categorical bars on one axis. Dependency-free SVG that reads the token layer directly, with a visually-hidden table of the same numbers.",
  "api": {
    "labels": { "form": "array", "of": "string", "required": true,
                "description": "One label per bar, in the same order as `values`. A label with no value at its index is dropped." },
    "values": { "form": "array", "of": "number", "required": true,
                "description": "The plotted data. One bar per entry; a negative value clamps to the baseline." },
    "seriesLabel": { "form": "primitive", "type": "string",
                     "description": "Names the series for the accessible name, the table caption and its value column. Absent falls back to the chart type alone." },
    "slot": { "form": "primitive", "type": "number",
              "default": 1,
              "description": "One identity colour from the categorical ramp for the whole series. 1-based, clamped to the ramp, never cycled." },
    "slots": { "form": "array", "of": "number",
               "description": "Per-bar identity override, one ramp slot each. Wins over `slot`." },
    "tone": { "form": "enum", "type": "SeriesTone",
              "description": "Semantic colour, for a series that IS a state. Mutually exclusive with slot/slots — passing both warns in development and tone wins." },
    "valueSuffix": { "form": "primitive", "type": "string",
                     "description": "Appended verbatim to every number the chart draws — the axis ticks, the tooltip and the accessible table. Carries its own leading space if one is wanted." }
  }
}
```

- [ ] **Step 4: Run `check:api` and watch it fail with the right message**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
```

Expected: **FAIL**, and specifically with two *"the reader could not read this surface — an inbound
function that returns \"string\" is none of the seven forms"* messages, one for `react/BarChart`
and one for `angular/BarChart` — **not** an itemised member list (Task 1, Step 2 established why).
If you see an itemised list instead, something changed since the audit; stop and report.

- [ ] **Step 5: Migrate React's `.d.ts`**

Replace `frameworks/react/components/charts/BarChart.d.ts` entirely with:

```ts
import type { SeriesTone } from '../../api.generated';

export type { SeriesTone };

export interface BarChartProps {
  /** One label per bar, in the same order as `values`. */
  labels: string[];
  /** The plotted data. One bar per entry. */
  values: number[];
  /** Names the series for the accessible name, the table caption and its value column. */
  seriesLabel?: string;
  /** @startingPoint One identity color for every bar. Defaults to ramp slot 1. */
  slot?: number;
  /** Per-bar identity override, one ramp slot each. Wins over `slot`. */
  slots?: number[];
  /** Semantic override. Mutually exclusive with slot/slots — passing both warns
   *  in development and `tone` wins. A chart carries identity or meaning, never both. */
  tone?: SeriesTone;
  /** Appended verbatim to every number drawn: the axis ticks, the tooltip and the
   *  accessible table. Carries its own leading space if one is wanted (`' ms'` vs `'%'`). */
  valueSuffix?: string;
}
export function BarChart(props: BarChartProps): JSX.Element;
```

Three things left the file and each is deliberate: `import * as React from 'react'` (its only
consumer was `React.CSSProperties`), `export type CatSlot = 1 | … | 8` (D2), and
`style?: React.CSSProperties` (D5, R4).

**`CatSlot` has two consumers in other files, and both must be fixed in THIS task** — for the same
reason `line-chart.ts` is renamed here in Step 7, and it is not scope creep. Deleting a type while
two sibling files still import it leaves broken source for two whole tasks. **Nothing catches it:**
there is no `tsc` over React's `.d.ts` files anywhere in `package.json`, so unlike the Angular side
(where `check:angular` fails loudly) this would sit silently until Tasks 3 and 4. Apply the minimum
that keeps the tree coherent, and nothing more:

In `frameworks/react/components/charts/LineChart.d.ts`, change the re-export line only:

```ts
export type { SeriesTone } from './BarChart';
```

(`CatSlot` drops out of it. The `extends Omit<…>` heritage, `area`, and everything else in that
file stay exactly as they are — flattening it is Task 3's, and doing it here would migrate a
component with no contract to satisfy.)

In `frameworks/react/components/charts/DoughnutChart.d.ts`, three lines change:

```ts
// the `import { CatSlot } from './BarChart';` line is DELETED outright
// the `export type { CatSlot } from './BarChart';` line is DELETED outright
  slots?: number[];   // was: slots?: CatSlot[];
```

Everything else in `DoughnutChart.d.ts` — `valueFormatter`, `style`, the missing `seriesLabel` —
stays untouched; those are Task 4's. Verify no consumer is left:

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "CatSlot" frameworks/react/components/charts/
```

Expected: **no output.** (`frameworks/react/components/display/Calendar.d.ts:5` will still match a
repo-wide grep — that is its own local declaration, it imports nothing from `BarChart`, and it
belongs to Plan C. Scope the grep to the charts directory, as above.)

- [ ] **Step 6: Migrate React's `.jsx`**

In `frameworks/react/components/charts/BarChart.jsx`, change **only** lines 6–16 and line 30. Every
other line, and in particular the tooltip's `top:` template literal on line 70, stays byte-identical
(Global Constraint 19).

Signature (lines 6–9) becomes:

```jsx
export function BarChart({
  labels, values, seriesLabel, slot, slots, tone, valueSuffix,
}) {
  if (!labels) throw new Error('BarChart: `labels` is required');
  if (!values) throw new Error('BarChart: `values` is required');
```

The formatter (line 16) becomes:

```jsx
  const fmt = (v) => `${v}${valueSuffix ?? ''}`;
```

The root element (line 30) becomes:

```jsx
    <div ref={ref} style={{ position: 'relative', width: '100%', height }}>
```

Then re-read the file and confirm by grep that neither escape survives — `check:api` never opens
the `.jsx`:

```bash
cd /home/juan/Dravensoft/Identity
grep -n "style\b\|\.\.\.rest\|valueFormatter\|CatSlot" frameworks/react/components/charts/BarChart.jsx
```

Expected: hits **only** on the inline `style={{ … }}` objects that are the component's own token
styling (the `<line>`, `<text>`, `<path>`, tooltip and table elements), and **zero** hits on
`...rest`, `valueFormatter` or `CatSlot`.

- [ ] **Step 7: Delete `ArenaChartTone` from Angular's chart-internals**

In `frameworks/angular/primitives/chart-internals.ts`:

- add to the imports at the top: `import type { SeriesTone } from '../api.generated';`
- delete lines 16–17 (`/** A series that IS a state rather than an identity. */` and
  `export type ArenaChartTone = …`);
- change `const TONE_VARS: Record<ArenaChartTone, string>` to
  `const TONE_VARS: Record<SeriesTone, string>`;
- change `export function toneColor(tone: ArenaChartTone): string` to
  `export function toneColor(tone: SeriesTone): string`;
- change the `tone?: ArenaChartTone;` field of `resolveColors`' parameter type (line ~84) to
  `tone?: SeriesTone;`.

Then fix its suite. In `frameworks/angular/test/chart-internals.test.ts`, three references change:

- line ~9, the `type ArenaChartTone,` entry in the import list from `../primitives/chart-internals`
  — **delete it** and add `import type { SeriesTone } from '../api.generated';`
- line ~90, `const tones: ArenaChartTone[] = [...]` → `const tones: SeriesTone[] = [...]`
- line ~178, `const rogue = 'critical' as unknown as ArenaChartTone;` →
  `... as unknown as SeriesTone;`

**`line-chart.ts` must be renamed in THIS task too, and the reason is not scope creep.**
`frameworks/angular/primitives/line-chart/line-chart.ts` references `ArenaChartTone` at line 3 (its
import from `../chart-internals`) and line 210 (`readonly tone = input<ArenaChartTone>();`). Once
`chart-internals.ts` stops exporting the name, those two references do not resolve and
`check:angular` fails — so leaving them for Task 3 would ship a branch that does not typecheck
between two commits. Apply the rename here, and **only** the rename:

```ts
// line 3, split into a value import and a type import
import { CHART_HEIGHT, PAD, SR_ONLY, niceMax, resolveColors, ticks } from '../chart-internals';
import type { SeriesTone } from '../../api.generated';
```

```ts
// line 210
  readonly tone = input<SeriesTone>();
```

Nothing else in `line-chart.ts` changes in this task. Its contract, its `valueFormatter`, its
`labels`/`values` required-ness and its `.d.ts` are all Task 3's, and Task 3's Step 1 confirms this
rename already landed rather than redoing it.

Now verify nothing is left:

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "ArenaChartTone" frameworks/ ; echo "grep exit=$?"
```

Expected: no output, `grep exit=1`.

- [ ] **Step 8: Migrate Angular's `bar-chart.ts`**

Line 3's import loses `ArenaChartTone`:

```ts
import { CHART_HEIGHT, PAD, SR_ONLY, barPath, niceMax, resolveColors, ticks } from '../chart-internals';
import type { SeriesTone } from '../../api.generated';
```

The input block (lines 180–186) becomes:

```ts
  readonly labels = input.required<string[]>();
  readonly values = input.required<number[]>();
  readonly seriesLabel = input<string>();
  readonly slot = input<number>();
  readonly slots = input<number[]>();
  readonly tone = input<SeriesTone>();
  readonly valueSuffix = input<string>();
```

Add a private suffix computed beside the other privates (a `private` member is skipped by the
reader, so it never reaches the contract):

```ts
  private readonly suffix = computed(() => this.valueSuffix() ?? '');
```

Then replace the two `const format = this.valueFormatter();` reads. In `gridLines` (line ~220):

```ts
  protected readonly gridLines = computed(() => {
    const max = this.max();
    const innerHeight = this.innerHeight();
    const suffix = this.suffix();
    return ticks(max).map((value) => ({ value, y: barValueY(value, max, innerHeight), label: `${value}${suffix}` }));
  });
```

In `bars` (line ~231), replace `const format = this.valueFormatter();` with
`const suffix = this.suffix();` and the `value: format(value),` entry with
`` value: `${value}${suffix}`, ``.

- [ ] **Step 9: Rework the four bar-chart tests in `host-class-binding.test.ts`**

`labels` and `values` are now `input.required`, so `TestBed.createComponent(BarChartHost)` followed
by `detectChanges()` throws NG0950 for all four tests. Add a helper next to the existing
`createBulkActionBarHost()` (around line 277), following its exact shape:

```ts
/* `arena-bar-chart`'s `labels` and `values` are required signal inputs, which
 * this JIT harness cannot drive through a template binding (NG0303) or a
 * literal attribute (a silent no-op). Query the real child `BarChart` instance
 * via `By.directive` and overwrite both fields before the first
 * `detectChanges()`, the same bypass createBreadcrumbsHost() and
 * createBulkActionBarHost() already use. The values are deliberately EMPTY
 * arrays: these four tests assert host box, style-object binding and the
 * fallback accessible name, all of which render with no data at all (`ticks`
 * always yields five grid lines), so driving real data here would test
 * something else. */
function createBarChartHost() {
  const fixture = TestBed.createComponent(BarChartHost);
  const instance = fixture.debugElement.query(By.directive(BarChart)).componentInstance as unknown as Record<string, unknown>;
  instance['labels'] = () => [];
  instance['values'] = () => [];
  fixture.detectChanges();
  return fixture;
}
```

Then in each of the four tests at lines ~1304, ~1321, ~1342 and ~1358, replace

```ts
  const fixture = TestBed.createComponent(BarChartHost);
  fixture.detectChanges();
  await fixture.whenStable();
```

with

```ts
  const fixture = createBarChartHost();
  await fixture.whenStable();
```

**Change nothing else in those four tests.** Every assertion stays byte-identical — the fallback
`aria-label` is still `'Bar chart'` and the caption still `'Bar chart'`, because `seriesLabel` is
still unset. A reviewer must be able to confirm from the diff that only fixture construction moved.

Also update the block comment above line 1297 (`They render with DEFAULT inputs only — no
`[values]` binding…`), which is now false: they render with **empty** inputs driven through the
bypass. Rewrite it rather than leaving prose that describes a harness that no longer exists.

- [ ] **Step 10: Pin `valueSuffix` in the firm compliance suite**

`frameworks/angular/test/chart-data-table.test.ts` is the only suite pinning `BarChart:angular`'s
behaviour contract. Its existing `renderBarChart()` already overwrites instance fields, so it needs
**no** NG0950 rework — verify that, do not assume it. Its existing assertion
`assert.deepEqual(pairs, LABELS.map((label, i) => [label, String(VALUES[i])]))` still passes,
because with no `valueSuffix` the drawn text is `` `${value}${''}` `` — identical.

Add one test at the end of the file:

```ts
/* `valueSuffix` replaced `valueFormatter` when the charts came under the API
 * contract: an inbound function that RETURNS a value is none of the seven forms
 * (api/README.md), so the unit is data the chart appends rather than a callback
 * it calls. The requirement this pins is `alternative.table`'s -- the hidden
 * table must carry the numbers a sighted reader sees, and a sighted reader sees
 * "12 ms", not "12". A suffix that reached the axis and the tooltip but not the
 * table would leave the two disagreeing, which is exactly the failure the
 * pairing assertion above exists to catch. */
test('arena-bar-chart appends valueSuffix to the numbers in the accessible table, not only to the picture', () => {
  const fixture = TestBed.createComponent(BarChart);
  const instance = fixture.componentInstance as unknown as Record<string, unknown>;
  instance['labels'] = () => LABELS;
  instance['values'] = () => VALUES;
  instance['seriesLabel'] = () => SERIES;
  instance['valueSuffix'] = () => ' ms';
  fixture.detectChanges();
  try {
    const table = (fixture.nativeElement as Element).querySelector('table') as HTMLTableElement;
    const pairs = [...table.querySelectorAll('tbody tr')]
      .map((row) => [...row.querySelectorAll('th, td')].map((c) => (c.textContent ?? '').trim()));
    assert.deepEqual(pairs, LABELS.map((label, i) => [label, `${VALUES[i]} ms`]));

    // Raw concatenation, never an inserted separator: the caller owns the space.
    // A component that joined with ' ' would render "12  ms" here and fail.
    assert.ok(!pairs.some(([, value]) => value.includes('  ')), 'the suffix was joined with an inserted separator');
  } finally {
    fixture.destroy();
  }
});
```

- [ ] **Step 11: Write the React suite**

Create `frameworks/react/test/bar-chart.test.jsx`:

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { BarChart } from '../components/charts/BarChart.jsx';

const LABELS = ['Mon', 'Tue', 'Wed'];
const VALUES = [12, 30, 7];

test('BarChart appends valueSuffix to the axis ticks and to the accessible table', () => {
  const html = renderToStaticMarkup(
    <BarChart labels={LABELS} values={VALUES} seriesLabel="Deploys" valueSuffix=" ms" />
  );
  /* The value axis: niceMax(30) rounds UP to 50 (its `norm` of 3 falls in the
   * `<= 5` bucket, so the axis top is 5 x 10), and ticks() then yields
   * 0, 12.5, 25, 37.5, 50. The two asserted here are 12.5 and 37.5, chosen
   * because NEITHER is a member of VALUES -- a tick assertion naming 30 would
   * also be satisfied by the table's own `<td>30 ms</td>`, so it would pass
   * against a component that suffixed the table and left the axis bare.
   * Verify these by running the test; niceMax's rounding is not obvious and an
   * earlier draft of this plan got it wrong. */
  assert.match(html, />12\.5 ms</, 'the axis tick carries the suffix');
  assert.match(html, />37\.5 ms</, 'the axis tick carries the suffix');
  // The hidden table: one <td> per value, each suffixed.
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v} ms</td>`), `the ${v} row carries the suffix`);
});

test('BarChart with no valueSuffix draws bare numbers, so the suffix is genuinely optional', () => {
  const html = renderToStaticMarkup(<BarChart labels={LABELS} values={VALUES} />);
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v}</td>`));
  assert.doesNotMatch(html, /undefined/, 'an absent suffix must not render the string "undefined"');
});

test('BarChart throws when labels is absent, matching Angular input.required', () => {
  assert.throws(
    () => renderToStaticMarkup(<BarChart values={VALUES} />),
    /BarChart: `labels` is required/,
  );
});

test('BarChart throws when values is absent, matching Angular input.required', () => {
  assert.throws(
    () => renderToStaticMarkup(<BarChart labels={LABELS} />),
    /BarChart: `values` is required/,
  );
});

/* R4: `style?: React.CSSProperties` and the `{...rest}` spread both left this
 * component. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard -- restoring either to the implementation leaves
 * the gate green. The two are asserted SEPARATELY on purpose: a component that
 * stopped spreading ...rest but still merged ...style would pass a single
 * combined assertion. */
test('BarChart drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <BarChart labels={LABELS} values={VALUES} style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

- [ ] **Step 12: Run the new suite and watch each test pass for the right reason**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/bar-chart.test.jsx
```

Expected: 5 pass. Then **prove the R4 test is not vacuous** — temporarily restore `style` and
`...rest` to `BarChart.jsx`'s signature and root `<div>`, re-run, confirm the last test **fails on
both assertions**, then restore the file byte-identically and re-run to green. This is the step
Plan 8B3's Task 1 review found missing; do not skip it.

- [ ] **Step 13: Update the demo and rebuild**

In `frameworks/react/components/charts/charts.card.entry.jsx` the two `<BarChart>` call sites carry
no `valueFormatter`, so neither changes. Confirm that by reading them — do not assume. Then:

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos
bun run check:demos
```

Expected: `BarChart.js` regenerated to match the new `.jsx`; `check:demos` PASS.

- [ ] **Step 14: Update both `prompt.md`s and check README**

`frameworks/react/components/charts/BarChart.prompt.md` — in the third example replace
``valueFormatter={(v) => `${v} builds`}`` with `valueSuffix=" builds"`, and replace the Do bullet
*"Pass `valueFormatter` for units; the axis and the tooltip both use it."* with:

```markdown
- Pass `valueSuffix` for units — the axis, the tooltip and the accessible table all carry it. It is appended verbatim, so write the space yourself: `" ms"`, but `"%"`.
```

Add a Don't bullet recording the capability loss:

```markdown
- Don't expect `valueSuffix` to format. It appends a unit and nothing else — no rounding, no thousands separator, no currency. Format the numbers before you pass them.
```

`frameworks/angular/primitives/bar-chart/bar-chart.prompt.md` — replace the `valueFormatter`
paragraph and its code block with:

```markdown
`valueSuffix` is appended to the tick labels, the tooltip and the numbers table together, so a
unit written once appears everywhere. It is appended verbatim — write the space yourself:

```html
<arena-bar-chart [labels]="regions" [values]="latency" seriesLabel="p95" valueSuffix=" ms" />
```

It appends and does not format: no rounding, no thousands separator, no currency. Format the
numbers before binding them.
```

Also add to its Do / Don't list:

```markdown
- Don't omit `labels` or `values`. Both are required inputs — Angular throws NG0950 on the first
  read rather than drawing an empty box, and React throws from its render for the same reason.
```

Then check `README.md` per Global Constraint 23: read lines 52, 319, 323, 325 and 373 and confirm
none of them names `valueFormatter`, `CatSlot` or `style`. At plan time none does — line 325 names
`catColor(slot)` which is unchanged, and line 373 is a file inventory. **Report the check either
way.**

- [ ] **Step 15: Run the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun test frameworks/react/test/
bun test frameworks/angular/test
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 19 contract(s) hold across 37 layer implementation(s)`; every other gate
PASS; React **+5** and Angular **+1** (Step 10's pin) against Task 0's measured baseline; the
behaviour diff **empty**. Assert the deltas, not absolute counts — the baseline is whatever Task 0
measured, and this plan does not restate it.

- [ ] **Step 16: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api)!: bring BarChart under the API capability contract

valueFormatter becomes valueSuffix, a primitive Arena appends to every number it
draws -- an inbound function that returns a value is none of the seven forms
(api/README.md). CatSlot dissolves into a bare number (R5, and the ramp's bound
is derived from the palette, not authored in a contract). SeriesTone becomes a
shared contract enum, replacing Angular's ArenaChartTone. labels and values
become required in both layers, settling a pre-existing divergence. React loses
style and the {...rest} spread (R4).

check:api 18/35 -> 19/37.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 17: Record and report**

Append a `## Task 2: complete` section to `.superpowers/sdd/progress.md`: the measured `check:api`
pair, both test counts, whether the R4 non-vacuity proof was run, and anything the confirmation
step surfaced. Report and stop for review.

---

## Task 3: LineChart

**Files:**
- Create: `api/components/LineChart.json`
- Create: `frameworks/react/test/line-chart.test.jsx`
- Modify: `frameworks/react/components/charts/LineChart.d.ts`
- Modify: `frameworks/react/components/charts/LineChart.jsx`
- Modify: `frameworks/react/components/charts/LineChart.prompt.md`
- Modify: `frameworks/angular/primitives/line-chart/line-chart.ts`
- Modify: `frameworks/angular/primitives/line-chart/line-chart.prompt.md`
- Modify: `frameworks/angular/test/host-class-binding.test.ts` (the 4 line-chart tests)
- Modify: `frameworks/react/components/charts/charts.card.entry.jsx` (2 `<LineChart>` call sites)
- Regenerate: `frameworks/react/components/charts/LineChart.js`, `charts.card.entry.js`
- Check: `README.md` charts prose

**Interfaces:**
- Consumes: `SeriesTone` from Task 2's `api/types/series-tone.json`, already emitted into both
  `api.generated.*` modules. **This task declares no new type.** Also consumes Task 2's
  `createBarChartHost()` as the shape to copy.
- Produces: nothing Task 4 depends on.

- [ ] **Step 1: Confirm LineChart's own surface, and STOP**

Report to the maintainer:

- that `LineChartProps extends Omit<BarChartProps, 'slots'>` is being flattened, and the exact
  member list that replaces it;
- that Task 2 **already** made two coherence edits this task builds on, and both should be visible
  when it opens — verify, do not assume: `line-chart.ts`'s `tone` input already reads
  `input<SeriesTone>()` (Task 2, Step 7), and `LineChart.d.ts`'s re-export line already reads
  `export type { SeriesTone } from './BarChart';` with `CatSlot` gone (Task 2, Step 5). Neither is
  this task's to redo. **`LineChart.d.ts` still carries its `extends Omit<…>` heritage at this
  point** — that is what this task removes;
- that `area` is Angular's one `input(false, { transform: booleanAttribute })` among the three
  charts, which the reader classifies through its **bare** branch (`literalType('false')` →
  `boolean`, `required: false`) and which must therefore keep its transform. `api/README.md`
  governs the member surface "and not the syntax by which a platform expresses it", and dropping
  the transform would create a real divergence the gate cannot see: React's `<LineChart area />`
  is JSX sugar for `area={true}` while Angular's bare attribute would stop coercing. This was
  settled in 8B3 Task 3b and is cited here, not re-derived.

This blocks. It must not re-open D1–D6.

- [ ] **Step 2: Write the contract**

Create `api/components/LineChart.json`:

```json
{
  "component": "LineChart",
  "description": "One series over an ordered sequence, on one axis. Dependency-free SVG with a crosshair that snaps to the nearest point, and a visually-hidden table of the same numbers.",
  "api": {
    "labels": { "form": "array", "of": "string", "required": true,
                "description": "One label per point, in the same order as `values`. A label with no value at its index is dropped." },
    "values": { "form": "array", "of": "number", "required": true,
                "description": "The plotted data, in order. One point per entry; a negative value clamps to the baseline." },
    "seriesLabel": { "form": "primitive", "type": "string",
                     "description": "Names the series for the accessible name, the table caption and its value column. Absent falls back to the chart type alone." },
    "slot": { "form": "primitive", "type": "number",
              "default": 1,
              "description": "The identity colour from the categorical ramp. A line is one series, so there is no per-mark override." },
    "tone": { "form": "enum", "type": "SeriesTone",
              "description": "Semantic colour, for a series that IS a state. Mutually exclusive with slot — passing both warns in development and tone wins." },
    "area": { "form": "primitive", "type": "boolean", "default": false,
              "description": "Fill under the line at 18% of the series colour — a tint, never a gradient. For a single series; two fills occlude each other." },
    "valueSuffix": { "form": "primitive", "type": "string",
                     "description": "Appended verbatim to every number the chart draws — the axis ticks, the tooltip and the accessible table. Carries its own leading space if one is wanted." }
  }
}
```

Note there is no `slots`: a line is one series, so per-mark colours have no meaning. That is why
the pre-migration `.d.ts` `Omit`'ed it, and the flattened list simply does not declare it.

- [ ] **Step 3: Run `check:api` and watch it fail with the right message**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
```

Expected: **FAIL, and the two layers fail differently.** This was measured in Task 1 and is not a
prediction.

**`angular/LineChart` fails with the throw** — one *"the reader could not read this surface — an
inbound function that returns \"string\" is none of the seven forms"* message, because
`valueFormatter` is declared on the class itself.

**`react/LineChart` fails with an itemised list**, because **the reader does not resolve
heritage**. `reactSurface()` reports the `extends` clause and then reads only the interface's OWN
body, which contains nothing but `area?: boolean` — `valueFormatter` lives in `BarChartProps` and
is never seen, so nothing throws. Expect roughly seven problems: the heritage clause reported as
the `{...rest}` R4 escape (`check-api.mjs:412`), plus one *"does not declare X"* for each of
`labels`, `values`, `seriesLabel`, `slot`, `tone` and `valueSuffix` — every member the contract
names and the interface inherits rather than declares.

That asymmetry is the whole reason this member list must be flattened: **an inherited member is
not a declared member as far as this gate is concerned**, and a contract cannot be satisfied by
inheritance. Record what you actually see; a throw from the React side would mean Task 2 changed
`LineChart.d.ts` more than its brief allows.

- [ ] **Step 4: Migrate React's `.d.ts`**

Replace `frameworks/react/components/charts/LineChart.d.ts` entirely with:

```ts
import type { SeriesTone } from '../../api.generated';

export type { SeriesTone };

/** A line is ONE series, so `slots` (per-mark colors) has no meaning here — the
 *  member list below is flat rather than inherited, because a heritage clause is
 *  the `{...rest}` escape and R4 forbids it. */
export interface LineChartProps {
  /** One label per point, in the same order as `values`. */
  labels: string[];
  /** The plotted data, in order. One point per entry. */
  values: number[];
  /** Names the series for the accessible name, the table caption and its value column. */
  seriesLabel?: string;
  /** @startingPoint The identity color from the categorical ramp. Defaults to slot 1. */
  slot?: number;
  /** Semantic override. Mutually exclusive with slot — passing both warns in
   *  development and `tone` wins. A chart carries identity or meaning, never both. */
  tone?: SeriesTone;
  /** @startingPoint Fill under the line at 18% of the series color — a tint, never a gradient.
   *  Use it for a single series; with two lines the fills occlude each other. */
  area?: boolean;
  /** Appended verbatim to every number drawn: the axis ticks, the tooltip and the
   *  accessible table. Carries its own leading space if one is wanted (`' ms'` vs `'%'`). */
  valueSuffix?: string;
}
export function LineChart(props: LineChartProps): JSX.Element;
```

`CatSlot` is gone from the re-export line: it no longer exists in `BarChart.d.ts` to re-export
(D2). `SeriesTone` stays, because the pre-migration file re-exported it and it survives as a
contract enum (Global Constraint 11).

- [ ] **Step 5: Migrate React's `.jsx`**

In `frameworks/react/components/charts/LineChart.jsx`, change **only** lines 6–16 and line 46. Line
88's tooltip `top:` template literal stays byte-identical (Global Constraint 19).

```jsx
export function LineChart({
  labels, values, seriesLabel, slot, tone, area = false, valueSuffix,
}) {
  if (!labels) throw new Error('LineChart: `labels` is required');
  if (!values) throw new Error('LineChart: `values` is required');
```

Line 16:

```jsx
  const fmt = (v) => `${v}${valueSuffix ?? ''}`;
```

Line 46:

```jsx
    <div ref={ref} style={{ position: 'relative', width: '100%', height }}>
```

Then verify:

```bash
cd /home/juan/Dravensoft/Identity
grep -n "\.\.\.rest\|valueFormatter\|CatSlot" frameworks/react/components/charts/LineChart.jsx
```

Expected: no output.

- [ ] **Step 6: Migrate Angular's `line-chart.ts`**

Its `tone` input already reads `input<SeriesTone>()` (Task 2, Step 7). The remaining changes to the
input block (lines ~206–212):

```ts
  readonly labels = input.required<string[]>();
  readonly values = input.required<number[]>();
  readonly seriesLabel = input<string>();
  readonly slot = input<number>();
  readonly tone = input<SeriesTone>();
  readonly area = input(false, { transform: booleanAttribute });
  readonly valueSuffix = input<string>();
```

`area` is unchanged — keep the transform (Step 1). Add the private suffix beside the other
privates:

```ts
  private readonly suffix = computed(() => this.valueSuffix() ?? '');
```

Then replace the two `const format = this.valueFormatter();` reads. In `gridLines` (line ~252):

```ts
    const suffix = this.suffix();
    return ticks(max).map((value) => ({ value, y: lineValueY(value, max, innerHeight), label: `${value}${suffix}` }));
```

In `points` (line ~261): replace `const format = this.valueFormatter();` with
`const suffix = this.suffix();` and `formatted: format(value),` with
`` formatted: `${value}${suffix}`, ``.

- [ ] **Step 7: Rework the four line-chart tests in `host-class-binding.test.ts`**

Add, beside `createBarChartHost()`:

```ts
/* `arena-line-chart`'s required `labels`/`values`, driven the same way
 * createBarChartHost() drives the bar chart's -- see its comment for why a
 * template binding and a literal attribute both fail under this JIT harness.
 * Empty arrays on purpose: these four tests assert host box, style-object
 * binding and the fallback accessible name, none of which needs data. */
function createLineChartHost() {
  const fixture = TestBed.createComponent(LineChartHost);
  const instance = fixture.debugElement.query(By.directive(LineChart)).componentInstance as unknown as Record<string, unknown>;
  instance['labels'] = () => [];
  instance['values'] = () => [];
  fixture.detectChanges();
  return fixture;
}
```

Then in the four tests at lines ~1378, ~1394, ~1415 and ~1430, replace the three-line
create/detect/whenStable preamble with `const fixture = createLineChartHost(); await
fixture.whenStable();`. **Change no assertion.** Update the block comment above line ~1371 that
claims they render with default inputs.

- [ ] **Step 8: Write the React suite**

Create `frameworks/react/test/line-chart.test.jsx`:

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { LineChart } from '../components/charts/LineChart.jsx';

const LABELS = ['Mon', 'Tue', 'Wed'];
const VALUES = [120, 138, 131];

test('LineChart appends valueSuffix to the axis ticks and to the accessible table', () => {
  const html = renderToStaticMarkup(
    <LineChart labels={LABELS} values={VALUES} seriesLabel="p95" valueSuffix=" ms" />
  );
  /* niceMax(138) rounds to 200, so ticks() yields 0, 50, 100, 150, 200 -- none
   * of which is a member of VALUES. That is deliberate: a tick assertion naming
   * a number the table also renders would pass against a component that
   * suffixed the table and left the axis bare. Verify the tick values by
   * running the test before trusting them; niceMax's rounding is not obvious. */
  assert.match(html, />50 ms</, 'the axis tick carries the suffix');
  assert.match(html, />200 ms</, 'the top axis tick carries the suffix');
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v} ms</td>`), `the ${v} row carries the suffix`);
});

test('LineChart with no valueSuffix draws bare numbers', () => {
  const html = renderToStaticMarkup(<LineChart labels={LABELS} values={VALUES} />);
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v}</td>`));
  assert.doesNotMatch(html, /undefined/, 'an absent suffix must not render the string "undefined"');
});

test('LineChart throws when labels is absent, matching Angular input.required', () => {
  assert.throws(() => renderToStaticMarkup(<LineChart values={VALUES} />), /LineChart: `labels` is required/);
});

test('LineChart throws when values is absent, matching Angular input.required', () => {
  assert.throws(() => renderToStaticMarkup(<LineChart labels={LABELS} />), /LineChart: `values` is required/);
});

/* `area` survived the migration as a real contracted member, and it is the one
 * member of the three charts whose two layers bind it differently in syntax
 * (React a boolean prop, Angular input(false, {transform: booleanAttribute})).
 * This asserts the React half actually draws the fill, so a flattening that
 * dropped the member would fail here rather than only in the type declaration. */
test('LineChart draws the area fill only when area is set', () => {
  const withArea = renderToStaticMarkup(<LineChart labels={LABELS} values={VALUES} area />);
  const without = renderToStaticMarkup(<LineChart labels={LABELS} values={VALUES} />);
  assert.match(withArea, /color-mix\(in oklab/, 'the 18% tint did not render');
  assert.doesNotMatch(without, /color-mix\(in oklab/, 'the tint rendered without area being set');
});

/* R4: `style?: React.CSSProperties` and the `{...rest}` spread both left this
 * component. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. Asserted SEPARATELY: a component that stopped
 * spreading ...rest but still merged ...style would pass a combined assertion. */
test('LineChart drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <LineChart labels={LABELS} values={VALUES} style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

- [ ] **Step 9: Run it, and prove the R4 test is not vacuous**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/line-chart.test.jsx
```

Expected: 6 pass. Then temporarily restore `style` and `...rest` to `LineChart.jsx`, re-run,
confirm the last test fails **on both assertions**, restore byte-identically, re-run to green.

- [ ] **Step 10: Update the demo and rebuild**

In `frameworks/react/components/charts/charts.card.entry.jsx`, two `<LineChart>` call sites carry a
formatter. Line 18:

```jsx
      <LineChart labels={days} values={[120,138,131,142,180,164,150]} seriesLabel="p95" slot={5} area valueSuffix=" ms" />
```

Line 30:

```jsx
      <LineChart labels={days} values={[0.4,0.3,1.2,0.6,2.1,0.5,0.4]} tone="danger" seriesLabel="Error rate" area valueSuffix="%" />
```

Note the two differ deliberately: `" ms"` carries its space, `"%"` does not. That is the
raw-concatenation rule made visible in the demo.

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos
bun run check:demos
```

- [ ] **Step 11: Update both `prompt.md`s and check README**

`frameworks/react/components/charts/LineChart.prompt.md` — the two examples become
`valueSuffix=" ms"` and `valueSuffix="%"`; the Do bullet *"Pass `valueFormatter` so the axis and
the tooltip both carry the unit."* becomes:

```markdown
- Pass `valueSuffix` so the axis, the tooltip and the accessible table all carry the unit. It is appended verbatim, so write the space yourself: `" ms"`, but `"%"`.
```

Add a Don't bullet:

```markdown
- Don't expect `valueSuffix` to format. It appends a unit and nothing else — no rounding, no thousands separator, no currency. Format the numbers before you pass them.
```

`frameworks/angular/primitives/line-chart/line-chart.prompt.md` — replace the `valueFormatter`
paragraph and its code block with:

```markdown
`valueSuffix` is appended to the tick labels, the tooltip and the numbers table together, so a
unit written once appears everywhere. It is appended verbatim — write the space yourself:

```html
<arena-line-chart [labels]="days" [values]="latency" seriesLabel="p95" valueSuffix=" ms" />
```

It appends and does not format: no rounding, no thousands separator, no currency. Format the
numbers before binding them.
```

Add to its Do / Don't list:

```markdown
- Don't omit `labels` or `values`. Both are required inputs — Angular throws NG0950 on the first
  read rather than drawing an empty box, and React throws from its render for the same reason.
```

Leave the existing `booleanAttribute` bullet exactly as it is: `area` keeps its transform, so that
warning is still true.

Then check `README.md` per Global Constraint 23 and report either way.

- [ ] **Step 12: Run the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun test frameworks/react/test/
bun test frameworks/angular/test
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 20 contract(s) hold across 39 layer implementation(s)`; every other gate
PASS; React **+6** against Task 2's count; Angular **unchanged** — the four reworked tests are the
same four, so a change here means an assertion was added or lost; behaviour diff empty.

- [ ] **Step 13: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api)!: bring LineChart under the API capability contract

The Omit<BarChartProps, 'slots'> heritage is flattened into a full member list --
check-api.mjs reports any heritage clause as the {...rest} escape (R4), with no
special case for Omit. valueFormatter becomes valueSuffix; labels and values
become required in both layers; React loses style and the {...rest} spread. The
area input keeps its booleanAttribute transform: the contract governs the member
surface, not the syntax a platform expresses it in.

check:api 19/37 -> 20/39.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 14: Record and report**

Append `## Task 3: complete` to the ledger and stop for review.

---

## Task 4: DoughnutChart

**Files:**
- Create: `api/components/DoughnutChart.json`
- Create: `frameworks/react/test/doughnut-chart.test.jsx`
- Modify: `frameworks/react/components/charts/DoughnutChart.d.ts`
- Modify: `frameworks/react/components/charts/DoughnutChart.jsx`
- Modify: `frameworks/react/components/charts/DoughnutChart.prompt.md`
- Modify: `frameworks/angular/primitives/doughnut-chart/doughnut-chart.ts`
- Modify: `frameworks/angular/primitives/doughnut-chart/doughnut-chart.prompt.md`
- Modify: `frameworks/angular/test/host-class-binding.test.ts` (the 5 doughnut-chart tests)
- Modify: `frameworks/react/components/charts/charts.card.entry.jsx` (1 `<DoughnutChart>` call site)
- Regenerate: `frameworks/react/components/charts/DoughnutChart.js`, `charts.card.entry.js`
- Check: `README.md` charts prose

**Interfaces:**
- Consumes: nothing from Task 3. `SeriesTone` is **not** used here — a doughnut has no `tone`.
- Produces: the last of the three contracts; `check:api` reaches its final 21/41.

- [ ] **Step 1: Confirm DoughnutChart's own surface, and STOP**

Report to the maintainer:

- that this is the one task adding a member that does not exist today, `seriesLabel` (decision D7),
  and exactly what it changes: the SVG's `aria-label` goes from the literal `"Doughnut chart"` to
  `` `${seriesLabel} — doughnut chart` `` when given and the literal fallback when not; the table
  `<caption>` follows the same rule; the table's second `<th>` goes from the bare `"Value"` to
  `seriesLabel ?? 'Value'`, matching what `bar-chart.ts:170` already does;
- that `host-class-binding.test.ts:1530` and `:1532` pin exactly the two fallback strings, and both
  **survive unchanged** because the fixtures set no `seriesLabel` — verify that rather than assume
  it;
- that the doughnut deliberately gains **no** `tone` and **no** `slot`: a slice IS a category, and
  both layers' prose says so (`DoughnutChart.jsx:14-15`, `doughnut-chart.prompt.md`);
- that Task 2 already made one coherence edit here — `DoughnutChart.d.ts`'s `CatSlot` import and
  re-export are gone and `slots` already reads `number[]`. Verify that, then note that Step 4 below
  replaces the whole file anyway, so the edit is confirmed rather than built on.

This blocks.

- [ ] **Step 2: Write the contract**

Create `api/components/DoughnutChart.json`:

```json
{
  "component": "DoughnutChart",
  "description": "Parts of one whole, as a ring with a legend beside it. Identity only — a slice is a category by definition, so there is no tone. Dependency-free SVG with a visually-hidden table of the same numbers.",
  "api": {
    "labels": { "form": "array", "of": "string", "required": true,
                "description": "One label per slice, in the same order as `values`. A label with no value at its index is dropped." },
    "values": { "form": "array", "of": "number", "required": true,
                "description": "The parts, which are read as shares of their own total. A negative value floors at zero; a total of zero paints nothing." },
    "seriesLabel": { "form": "primitive", "type": "string",
                     "description": "Names the chart for the accessible name, the table caption and its value column. Absent falls back to the chart type alone." },
    "slots": { "form": "array", "of": "number",
               "description": "Per-slice identity override, one ramp slot each. Absent assigns 1..N in order, which is the rule rather than a starting point." },
    "valueSuffix": { "form": "primitive", "type": "string",
                     "description": "Appended verbatim to every number the chart draws — the legend value and the accessible table. Not the centre label, which is a percentage rather than a value." }
  }
}
```

- [ ] **Step 3: Run `check:api` and watch it fail**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
```

Expected: **FAIL** with the unreadable-surface throw for `react/DoughnutChart` and
`angular/DoughnutChart`. `check:api` still reports 20 holding contracts is **not** what you will
see — the run exits 1 and prints problems; the count line only prints on success.

- [ ] **Step 4: Migrate React's `.d.ts`**

Replace `frameworks/react/components/charts/DoughnutChart.d.ts` entirely with:

```ts
export interface DoughnutChartProps {
  /** One label per slice, in the same order as `values`. */
  labels: string[];
  /** The parts, read as shares of their own total. */
  values: number[];
  /** Names the chart for the accessible name, the table caption and its value column. */
  seriesLabel?: string;
  /** @startingPoint Omit it — slots default to 1..N in order, which is the rule. */
  slots?: number[];
  /** Appended verbatim to every number drawn: the legend value and the accessible
   *  table. Not the centre label, which is a percentage. Carries its own leading
   *  space if one is wanted (`' rps'` vs `'%'`). */
  valueSuffix?: string;
}
/** Parts of one whole. Identity only — a slice is a category by definition,
 *  so there is deliberately no `tone`. Always draws its legend. */
export function DoughnutChart(props: DoughnutChartProps): JSX.Element;
```

The `import * as React` line, the `import { CatSlot }` line and the `export type { CatSlot }`
re-export all leave: the pre-migration file re-exported `CatSlot` alone, and `CatSlot` dissolves
into `number` and moves nowhere, so there is nothing to re-export (Global Constraint 11, D2). The
file now imports nothing at all.

- [ ] **Step 5: Migrate React's `.jsx`**

In `frameworks/react/components/charts/DoughnutChart.jsx`:

Line 6 becomes:

```jsx
export function DoughnutChart({ labels, values, seriesLabel, slots, valueSuffix }) {
  if (!labels) throw new Error('DoughnutChart: `labels` is required');
  if (!values) throw new Error('DoughnutChart: `values` is required');
```

Line 13 becomes:

```jsx
  const fmt = (v) => `${v}${valueSuffix ?? ''}`;
```

Add the accessible name beside the other derived values, after line 21's `plotW`:

```jsx
  const name = seriesLabel ? `${seriesLabel} — doughnut chart` : 'Doughnut chart';
```

Line 37 (the root) loses `...style` and `{...rest}`:

```jsx
    <div ref={ref} style={{ position: 'relative', width: '100%', height, display: 'flex', gap: 'var(--chart-legend-gap)' }}>
```

Line 38's `aria-label="Doughnut chart"` becomes `aria-label={name}`.

Line 71's `<caption>Doughnut chart</caption>` becomes `<caption>{name}</caption>`.

Line 72's header row becomes:

```jsx
        <thead><tr><th>Category</th><th>{seriesLabel || 'Value'}</th></tr></thead>
```

Then verify:

```bash
cd /home/juan/Dravensoft/Identity
grep -n "\.\.\.rest\|valueFormatter\|CatSlot" frameworks/react/components/charts/DoughnutChart.jsx
```

Expected: no output.

- [ ] **Step 6: Migrate Angular's `doughnut-chart.ts`**

The input block (lines 243–246) becomes:

```ts
  readonly labels = input.required<string[]>();
  readonly values = input.required<number[]>();
  readonly seriesLabel = input<string>();
  readonly slots = input<number[]>();
  readonly valueSuffix = input<string>();
```

Add beside the other privates:

```ts
  private readonly suffix = computed(() => this.valueSuffix() ?? '');
```

Add the accessible name as a `protected` computed, mirroring `bar-chart.ts:206`:

```ts
  protected readonly name = computed(() => {
    const series = this.seriesLabel();
    return series ? `${series} — doughnut chart` : 'Doughnut chart';
  });
```

> **A `protected` member is skipped by the reader** (`api-surface.mjs:323`), so `name` never
> reaches the contract — which is correct, it is derived state and not a member.

In `segments` (line ~277), replace `const format = this.valueFormatter();` with
`const suffix = this.suffix();` and `formatted: format(values[slice.index]),` with
`` formatted: `${values[slice.index]}${suffix}`, ``.

In the template: line 203's `aria-label="Doughnut chart"` becomes `[attr.aria-label]="name()"`;
line 232's `<caption>Doughnut chart</caption>` becomes `<caption>{{ name() }}</caption>`; line
233's `<th>Value</th>` becomes `<th>{{ seriesLabel() ?? 'Value' }}</th>`.

Leave `aria-label="Doughnut chart legend"` on line 219 **unchanged** — it names the legend region,
not the chart, and `doughnut-chart.prompt.md` documents that exact string at length.

- [ ] **Step 7: Rework the five doughnut-chart tests in `host-class-binding.test.ts`**

Add, beside the other two helpers:

```ts
/* `arena-doughnut-chart`'s required `labels`/`values`, driven the same way
 * createBarChartHost() drives the bar chart's. Empty arrays on purpose: four of
 * these five tests assert host box, style-object binding and the fallback
 * accessible name; the fifth asserts that NO data draws NO slice, which needs
 * the empty array to be the real, driven value rather than an untouched
 * default. */
function createDoughnutChartHost() {
  const fixture = TestBed.createComponent(DoughnutChartHost);
  const instance = fixture.debugElement.query(By.directive(DoughnutChart)).componentInstance as unknown as Record<string, unknown>;
  instance['labels'] = () => [];
  instance['values'] = () => [];
  fixture.detectChanges();
  return fixture;
}
```

Then in the five tests at lines ~1461, ~1482, ~1503, ~1521 and ~1535, replace the
create/detect/whenStable preamble with `const fixture = createDoughnutChartHost(); await
fixture.whenStable();`. **Change no assertion** — in particular lines 1530 and 1532 still expect
`'Doughnut chart'`, which is now the *fallback* rather than a constant, and that is exactly what
should be pinned. Update the block comment above those tests that claims they render with default
inputs.

- [ ] **Step 8: Write the React suite**

Create `frameworks/react/test/doughnut-chart.test.jsx`:

```jsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { DoughnutChart } from '../components/charts/DoughnutChart.jsx';

const LABELS = ['Web', 'API', 'Worker'];
const VALUES = [420, 310, 140];

test('DoughnutChart appends valueSuffix to the legend value and to the accessible table', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} valueSuffix=" rps" />
  );
  for (const v of VALUES) {
    assert.match(html, new RegExp(`<td>${v} rps</td>`), `the ${v} table row carries the suffix`);
    // The legend renders the same formatted value in its own <span>, so each
    // number appears twice. A suffix reaching only the table would fail here.
    assert.equal((html.match(new RegExp(`${v} rps`, 'g')) ?? []).length, 2, `${v} should appear in both the legend and the table`);
  }
});

/* The centre label is a PERCENTAGE, not a value, so it must never take the
 * suffix (api/README.md: the suffix is appended to every number the chart
 * DRAWS as a value). It only renders on hover, so static markup cannot show
 * it -- what this pins instead is that the suffix has not leaked into the
 * share arithmetic, which would surface as a stray suffix anywhere a percent
 * is computed. */
test('DoughnutChart does not append valueSuffix to anything that is not a plotted value', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} valueSuffix=" rps" />
  );
  // Six occurrences total: three legend values and three table cells. Any
  // seventh means the suffix reached something that is not a drawn value.
  assert.equal((html.match(/ rps/g) ?? []).length, 6);
});

test('DoughnutChart names itself from seriesLabel, and falls back to the type when none is given', () => {
  const named = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} seriesLabel="Traffic" />
  );
  assert.match(named, /aria-label="Traffic — doughnut chart"/);
  assert.match(named, /<caption>Traffic — doughnut chart<\/caption>/);
  assert.match(named, /<th>Traffic<\/th>/, 'the value column takes the series name');

  const unnamed = renderToStaticMarkup(<DoughnutChart labels={LABELS} values={VALUES} />);
  assert.match(unnamed, /aria-label="Doughnut chart"/);
  assert.match(unnamed, /<caption>Doughnut chart<\/caption>/);
  assert.match(unnamed, /<th>Value<\/th>/, 'with no series name the column falls back to "Value"');
});

test('DoughnutChart throws when labels is absent, matching Angular input.required', () => {
  assert.throws(() => renderToStaticMarkup(<DoughnutChart values={VALUES} />), /DoughnutChart: `labels` is required/);
});

test('DoughnutChart throws when values is absent, matching Angular input.required', () => {
  assert.throws(() => renderToStaticMarkup(<DoughnutChart labels={LABELS} />), /DoughnutChart: `values` is required/);
});

/* R4: `style?: React.CSSProperties` and the `{...rest}` spread both left this
 * component. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. Asserted SEPARATELY: a component that stopped
 * spreading ...rest but still merged ...style would pass a combined assertion. */
test('DoughnutChart drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
```

- [ ] **Step 9: Run it, and prove the R4 test is not vacuous**

```bash
cd /home/juan/Dravensoft/Identity
bun test frameworks/react/test/doughnut-chart.test.jsx
```

Expected: 6 pass. The em-dash in the `aria-label` assertions is the same character the component
writes (`—`, U+2014) — if those two assertions fail, check the character before changing the
component. Then run the R4 non-vacuity proof: restore `style` and `...rest`, watch the last test
fail on both assertions, restore byte-identically, re-run to green.

- [ ] **Step 10: Update the demo and rebuild**

`frameworks/react/components/charts/charts.card.entry.jsx` line 21:

```jsx
      <DoughnutChart labels={['Web','API','Worker','Static']} values={[420,310,140,90]} valueSuffix=" rps" />
```

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos
bun run check:demos
```

- [ ] **Step 11: Update both `prompt.md`s and check README**

`frameworks/react/components/charts/DoughnutChart.prompt.md` — the example becomes
`valueSuffix=" rps"`, and add two Do bullets and one Don't:

```markdown
- Pass `seriesLabel` — it names the chart for a screen reader, titles the numbers table and names its value column. Without it the chart announces as "Doughnut chart", which identifies the chart *type* and not the chart.
- Pass `valueSuffix` for units. It reaches the legend and the accessible table, and never the centre percentage.
```

```markdown
- Don't expect `valueSuffix` to format. It appends a unit and nothing else — no rounding, no thousands separator, no currency. Format the numbers before you pass them.
```

`frameworks/angular/primitives/doughnut-chart/doughnut-chart.prompt.md` — replace the
`[valueFormatter]="currency"` example with:

```html
<arena-doughnut-chart [labels]="regions" [values]="revenue" seriesLabel="Revenue" valueSuffix=" €" />
```

and add, after it:

```markdown
`valueSuffix` is appended verbatim to the legend value and to the numbers table — write the space
yourself. It appends and does not format: no rounding, no thousands separator, no currency. Format
the numbers before binding them.

`seriesLabel` names the chart for a screen reader, titles the numbers table and names its value
column; without it the chart announces as "Doughnut chart", which identifies the chart type and
not the chart.
```

Add to its Do / Don't list:

```markdown
- Don't omit `labels` or `values`. Both are required inputs — Angular throws NG0950 on the first
  read rather than drawing an empty ring, and React throws from its render for the same reason.
```

**Leave the whole "The legend is keyboard-reachable" section alone.** It cites
`components-divergences.md`, and Task 5 owns that file; verify in Task 5 that the section it cites
survives.

Then check `README.md` per Global Constraint 23 and report either way.

- [ ] **Step 12: Run the gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun run check:angular
bun run check:behaviour
bun run check:dimensions
bun run check:demos
bun test frameworks/react/test/
bun test frameworks/angular/test
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 21 contract(s) hold across 41 layer implementation(s)` — **the plan's
target**; every other gate PASS; React **+6** against Task 3's count; Angular **unchanged** (the
five reworked tests are the same five); behaviour diff empty. Cumulative React delta over the whole
plan: **+17**.

- [ ] **Step 13: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api)!: bring DoughnutChart under the API capability contract

valueFormatter becomes valueSuffix; labels and values become required in both
layers; React loses style and the {...rest} spread; CatSlot dissolves into a
bare number. The chart also GAINS seriesLabel, a deliberate addition: its
aria-label was the literal 'Doughnut chart' with no consumer-supplied path at
all, the worst case of the aria-label debt CLAUDE.md records. It still has no
tone -- a slice IS a category.

check:api 20/39 -> 21/41. Plan B is complete: all 21 components contracted.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 14: Record and report**

Append `## Task 4: complete` to the ledger and stop for review.

---

## Task 5: The `components-divergences.md` and citations pass

**Files:**
- Modify: `components-divergences.md`
- Possibly modify: any file whose citation of it is broken by this task

**Interfaces:**
- Consumes: the three completed migrations.
- Produces: a divergences document with no false claim about the charts, and no dangling citation.

> `api/README.md`'s rule: *an entry whose entire content is an API divergence is **deleted**, not
> migrated. Entries covering rendering or behaviour stay.* Plan 8B3's Task 6 applied it to fifteen
> sections and deleted exactly one.
>
> **This task's expected outcome is different from 8B3's, and that is the finding, not a
> shortfall.** `CLAUDE.md` already records that the per-component chart entries are *rendering*
> divergences — "BarChart's per-bar category axis, DoughnutChart's per-slice legend,
> `chart-internals`' units — which are neither behaviour nor API and have no destination". So the
> likely correct outcome is **zero deletions and two surgical edits.** Verify that; do not assume
> it, and do not manufacture a deletion to look productive.

- [ ] **Step 1: Enumerate the chart sections**

```bash
cd /home/juan/Dravensoft/Identity
wc -l components-divergences.md
grep -n "^### " components-divergences.md | grep -i "chart"
```

Expected at plan time: 8 sections —
`chart-internals — the visually-hidden style carries its units in Angular` (~623),
`BarChart — the category axis is drawn per bar, not per label` (~650),
`BarChart — the charts are the layer's styling exception, and they state it in objects` (~670),
`LineChart — the crosshair measures against the SVG, not against the overlay rect` (~709),
`LineChart — the point axis is drawn per point, not per label` (~729),
`DoughnutChart — the legend is drawn per slice, not per label` (~746),
`DoughnutChart — the host IS the flex row, where React wraps one inside` (~770),
`DoughnutChart — the legend is keyboard-reachable in Angular, not yet in React` (~802).
Line numbers will have drifted; the headings are the anchors.

- [ ] **Step 2: Classify each of the eight in full context**

Read each section whole. For each, decide and record: DELETE (the entire content is an API
divergence the contract now settles), EDIT (part of it is, the rest is rendering or behaviour), or
LEAVE.

The two known EDITs, measured at plan time:

- the `BarChart — the charts are the layer's styling exception` section carries a
  **`**Not ported:** React's `style` prop and `{...rest}` spread`** paragraph (~line 705). That
  sentence is now **false**: React does not have them either. Delete that paragraph and keep every
  other word — the whole rest of the section is the camelCase-`[style]`-object rationale, which is
  rendering prose and still true.
- the `DoughnutChart — the host IS the flex row` section carries the identical
  **`**Not ported:** React's `style` prop and `{...rest}` spread`** paragraph (~line 798). Same
  treatment.

This is the shape 8B3's Task 6 applied to the `ActivityFeed` host-bind and `UnauthCard` entries:
surgical paragraph removal, not a section deletion.

The six others are expected to be LEAVE. Read each and confirm; in particular check whether the
per-label sections (`the category axis is drawn per bar, not per label` and its two siblings)
describe a **rendering** difference — they do at plan time: both layers accept the same
`labels`/`values` members, and the difference is which collection each draws the axis from. A
member-surface difference would be a deletion; a difference in what each layer *does* with the
same members is rendering, and stays.

- [ ] **Step 3: Sweep for stale references, including the file types 8B3's sweep missed**

Plan 8B3's citation sweep used `--include=*.ts --include=*.html` and **missed a dead
`renderItem` citation in `ActivityFeed.behaviour.json`**, which only the final whole-branch review
caught. Do not repeat that.

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "valueFormatter\|CatSlot\|ArenaChartTone" \
  --include=*.ts --include=*.tsx --include=*.jsx --include=*.js \
  --include=*.json --include=*.md --include=*.html \
  . 2>/dev/null | grep -v node_modules | grep -v "^./docs/superpowers/" | grep -v "^./CHANGELOG.md"
```

Expected: **no hits** outside `docs/superpowers/` (which Task 6 handles) and `CHANGELOG.md` (which
records history and legitimately names the old member — read the hit and confirm it is historical
prose about the reader's refusal, not a live claim). A hit anywhere else is a missed rename.

Then the citation sweep proper:

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "components-divergences" \
  --include=*.ts --include=*.tsx --include=*.jsx --include=*.js \
  --include=*.json --include=*.md --include=*.html \
  . 2>/dev/null | grep -v node_modules | grep -v "^./components-divergences.md"
```

For every hit, check whether the section it points at survived Step 2. At plan time there are 17
citing files and exactly one is chart-related: `doughnut-chart.prompt.md:56`, which cites the file
for React's legend keyboard gap — the section at ~802, expected to be LEAVE. Confirm it survived.

- [ ] **Step 4: Run the gates and commit**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:behaviour
wc -l components-divergences.md
git diff --stat
git add -A
git commit -m "docs: retire the two false 'Not ported: style/{...rest}' claims from the chart divergences

Both React charts that carried the escape lost it under the API contract, so the
paragraph asserting Angular did not port it describes a difference that no longer
exists. Every other word of both sections is rendering prose and stays: no chart
section is an API divergence in its entirety, which is what CLAUDE.md already
records about this part of the file.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

If Step 2 found no edit at all to make, **say so and make no commit** — an empty pass is a valid
outcome here and forcing a change would be worse.

- [ ] **Step 5: Record and report**

Append `## Task 5: complete` to the ledger, naming every one of the eight sections and its verdict.

---

## Task 6: Close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`
- Modify: `CHANGELOG.md`
- Modify: `CLAUDE.md`
- **Delete:** `docs/superpowers/plans/2026-07-24-8b3-api-contracts-third-batch.md`
- Modify: `.superpowers/sdd/progress.md` (no commit — git-ignored)

**Interfaces:**
- Consumes: every earlier task.
- Produces: a branch ready for the maintainer's merge instruction.

- [ ] **Step 1: The one full check of the plan**

```bash
cd /home/juan/Dravensoft/Identity
bun run check 2>&1 | tail -40
```

Expected: ALL steps PASS, and the run reported complete rather than **INCOMPLETE**. If any of
`check:cards`, `check:vendor` or `check:demos` reports SKIP, the run is INCOMPLETE and must be
re-run with the missing dependency available (`CHROME_PATH` for cards; Bun for the other two) —
`CLAUDE.md` records that a skipped gate is never green.

Record the exact `check:api` line, and both test counts:

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -5
bun test frameworks/react/test-dom 2>&1 | tail -5
```

Expected: `check-api: 21 contract(s) hold across 41 layer implementation(s)`. Merged process:
932 + 17 + 1 = **950 across 85 files** — 17 new React tests across 3 new files (bar 5, line 6,
doughnut 6) plus 1 Angular test folded into the existing `chart-data-table.test.ts`, and `scripts/`
unchanged because this plan needs no reader change. Isolated DOM process: 26 across 5, unchanged.
**Measure it; do not transcribe this arithmetic.** If it disagrees, the measured number is the
truth and the spec row in Step 3 must reconcile against it explicitly, the way 8B3's row
reconciled against B2's 2-test undercount.

- [ ] **Step 2: Re-measure the demo card viewport**

`charts.card.html` declares `viewport="900x1345"`. Nothing in this plan removed a card from the
demo — the four `<ChartCard>`s and the two below them all survive — so the height should be
unchanged. But `check:cards` only *warns* on an over-declared height, so a silent shrink is
possible.

```bash
cd /home/juan/Dravensoft/Identity
bun run check:cards 2>&1 | grep -i "chart\|warn" || echo "no chart warning"
```

If it warns, **re-measure by running the gate**, not by arithmetic — `CLAUDE.md` records that
arithmetic was tried and the page clipped anyway — and fix the declared viewport in its own commit.
If `menu-pagination.card.html` warns, that is pre-existing debt rolled up from 8B3 and **out of
scope**; confirm with `git diff 0205cfc HEAD -- frameworks/react/components/navigation/menu-pagination.*`
returning empty, and leave it.

- [ ] **Step 3: Update the spec**

Two edits to `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`.

**(a)** Add a `Plan B4` row to *The running count* table (~line 729):

```markdown
| **Plan B4** (2026-07-24) | **950 across 85 files** | 26 across 5 files |
```

followed by a paragraph in the style of the B3 one immediately below it, stating: that B4 put the
last three components of Plan B under contract, taking `check:api` from 18/35 to **21/41**, which
**completes Plan B** — 3 from Plan A plus 18 from Plan B, all twenty-one; that it added one shared
enum (`SeriesTone`) and declared no object type at all, the first batch with none; that the net
gain is 17 React tests across 3 new files plus 1 Angular test folded into
`chart-data-table.test.ts`; and that `scripts/` gained none, because no reader change was needed —
`valueFormatter`'s refusal was already shipped by 8B0 and 8B3 Task 3b's extension was untouched.
Reconcile against the number Step 1 actually measured.

**(b)** The subsection *"What Plan B3 measured about the three charts, for 8B4"* (~line 532) is now
a historical record of a pre-migration state, not a live claim. Annotate it rather than deleting
it, in the style the spec already uses for R3's `renderItem` correction: add one line at the top of
the subsection reading

```markdown
> **Resolved by Plan 8B4 (2026-07-24).** All five findings below are the pre-migration state and
> are recorded as history. `valueFormatter` is now `valueSuffix`; `CatSlot` is deleted rather than
> aliased; `LineChartProps`' heritage is flattened; `chart-data-table.test.ts` gained a
> `valueSuffix` pin and needed no NG0950 rework, while `host-class-binding.test.ts` needed it for
> all thirteen of its chart tests — the reverse of what that plan expected.
```

- [ ] **Step 4: Update the CHANGELOG**

Under `## [Unreleased]` — never under the last version — add one breaking-change bullet per chart,
in the batch's established style, plus one bullet for the shared reshape. Verify every claim
against the live `api/components/*.json` rather than transcribing from the ledger. Cover:

- `valueFormatter` → `valueSuffix` on all three, with the **capability loss stated plainly**: no
  rounding, no thousands separator, no currency. A consumer passing `(v) => v.toLocaleString()`
  has no replacement and must format before passing.
- `CatSlot` deleted from the public surface of all three; `slot`/`slots` are bare `number`. An
  existing `import type { CatSlot } from '.../BarChart'` stops resolving. (Note that
  `Calendar.d.ts`'s own local `CatSlot` is untouched.)
- `SeriesTone` is now a contract enum in `api.generated`; Angular's `ArenaChartTone` is deleted.
- `labels` and `values` are required in both layers; Angular loses its `[]` default and throws
  NG0950, React throws from its render.
- React loses `style` and `{...rest}` on all three (R4).
- `LineChartProps` no longer extends `Omit<BarChartProps, 'slots'>`; its members are declared flat.
- `DoughnutChart` **gains** `seriesLabel`, which changes its `aria-label`, its table caption and
  its value column header when supplied.

```bash
cd /home/juan/Dravensoft/Identity
bun scripts/check-release.mjs
```

Expected: PASS. `[Unreleased]` on top is expected and never a failure.

- [ ] **Step 5: Move Plan 8B3's debt into `CLAUDE.md`, THEN delete the plan**

**Order matters.** `CLAUDE.md`'s own Known-debt preamble records that plan 5.5 filed three
follow-ups into its own plan document, which was deleted the same week: *"a plan borrado se lleva
consigo lo que sólo estaba escrito ahí"*.

First, read the plan being deleted and identify anything recorded **only** there:

```bash
cd /home/juan/Dravensoft/Identity
grep -n "debt\|deferred\|not fixed\|out of scope\|known gap\|Known gap" \
  docs/superpowers/plans/2026-07-24-8b3-api-contracts-third-batch.md
```

At plan time the candidates are its Appendix B *"Known gap carried, not closed"* (that `check:api`
never reads React's `.jsx`) and its Appendix A (why the charts were split out). Both are **already**
in `CLAUDE.md` and `api/README.md` — the `.jsx` gap is the last bullet of `CLAUDE.md`'s Known debt,
and Appendix A's reasoning is now spent, since the split has happened. **Verify that** rather than
assuming it; anything genuinely unique moves to `CLAUDE.md`'s Known debt section first, in its own
commit.

Then update `CLAUDE.md` for what this plan changed. Three edits are expected:

- the `check:api` Known-debt bullet says *"`Table.render` in plan C is where R3 first matters"* —
  still true, leave it;
- the aria-label debt bullet says *"`doughnut-chart.ts` is worse — its `aria-label="Doughnut
  chart"` is a literal with no caller-supplied path at all"*. That is now **false**. Rewrite it:
  the doughnut has a `seriesLabel` path as of this plan, so all three charts now fall back to a
  type-only name when none is given, and the remaining debt is that a *present* name is still never
  checked for usefulness. Keep the rest of the bullet — the React charts still have no suite
  covering this, and `chart-data-table.test.ts` still cannot judge a name's quality;
- the *Architecture* paragraph naming the Angular chart exception mentions no API detail and needs
  no edit — confirm rather than assume.

Then, and only then:

```bash
cd /home/juan/Dravensoft/Identity
git rm docs/superpowers/plans/2026-07-24-8b3-api-contracts-third-batch.md
ls docs/superpowers/plans/
```

Expected: only this plan's own file remains.

- [ ] **Step 6: Close the ledger and commit**

Write the final `.superpowers/sdd/progress.md`: every task's outcome, the measured `check:api`
climb 18/35 → 21/41, both test counts, Task 5's eight verdicts, and the
`## Maintainer decisions taken` section carrying D1–D7 as answered.

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "docs: close out plan 8B4 — the three charts under contract, check:api 21/41

Plan B is complete: 3 components from Plan A plus 18 from Plan B, all twenty-one
under the API capability contract. Deletes the executed 8B3 plan after confirming
nothing was recorded only there.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 7: Report, and stop**

Report to the maintainer: the branch range, the commit count, the final `check:api` pair, the full
`bun run check` result, both test counts, and any non-blocking findings rolled up for the final
whole-branch review.

**Do not merge and do not push.** Wait for the instruction.

---

## Task 7: Final whole-branch review

**Files:** none — this is a review task.

> Plan 8B3's own close-out recorded that its final whole-branch review returned **NOT READY with
> four cross-task findings, every one of them a comparison between tasks that no per-task reviewer
> could have made**. Budget for it. It is not a formality.

- [ ] **Step 1: Dispatch a fresh reviewer over the whole branch**

Give the reviewer the branch range (`0205cfc..HEAD`), this plan, `api/README.md` and
`CLAUDE.md`. Ask specifically for the comparisons a per-task reviewer structurally cannot make:

- **Do the three components fail identically when a required member is absent?** 8B3's review
  found `Onboarding.jsx` silently rendering where `CommandPalette.jsx` threw, for the identical
  contract member. Check all three charts' throw guards against each other and against Angular's
  `input.required`.
- **Do the three contracts describe the same member identically?** `labels`, `values`,
  `seriesLabel` and `valueSuffix` appear in all three; their `description` strings should agree in
  substance, and any difference should be a real difference (the doughnut's suffix genuinely
  excludes the centre label).
- **Is any member required in one contract and optional in another for no stated reason?**
- **Did all three React suites get the same R4 discrimination, and was each proved non-vacuous?**
  8B3's review found one of four new suites missing its throw test precisely because no single
  reviewer compared the four.
- **Does any `prompt.md` still describe `valueFormatter`, or any doc comment still say
  `ArenaChartTone`?** Sweep all six plus both `README.md`s.
- **Do the thirteen reworked `host-class-binding` tests still assert exactly what they asserted
  before?** Compare each against `git show 0205cfc:frameworks/angular/test/host-class-binding.test.ts`.

- [ ] **Step 2: Triage, fix, and commit each fix separately**

Apply `superpowers:receiving-code-review`. Verify each finding technically before implementing it;
a reviewer can be wrong. Commit each fix on its own so the wave is readable.

- [ ] **Step 3: Re-run the full check and record the final state**

```bash
cd /home/juan/Dravensoft/Identity
bun run check 2>&1 | tail -20
bun run check:api
git log --oneline 0205cfc..HEAD | wc -l
git diff --stat 0205cfc..HEAD | tail -1
git status --short
```

Append the final state to the ledger. **Do not merge and do not push.**

---

## Appendix A: Decisions already taken

Recorded so Task 1 confirms rather than re-asks, and so a reviewer can check the judgement. All
seven were taken by the maintainer during this plan's design session, on the measurements quoted.

- **D1 — `valueFormatter` → `valueSuffix`, raw concatenation.** Forced by the vocabulary; the
  *semantics* were the decision. `` `${value}${valueSuffix ?? ''}` ``: the consumer writes the
  space. Rejected: Arena inserting a space, which makes `"2.1 %"` unavoidable without a
  "don't separate before a symbol" special case that nothing would enforce. Capability loss
  accepted and to be stated in all six `prompt.md`s and the CHANGELOG.
- **D2 — `CatSlot` deleted outright, no back-compat alias.** The repository's standing rule is to
  delete dead API and ship the breaking change rather than leave a tombstone. `api/README.md`'s
  re-export rule exists so an import keeps resolving against a type that **moves** to
  `api.generated`; `CatSlot` moves nowhere, it dissolves. `Calendar.d.ts:5`'s own local copy is
  untouched — measured, it imports nothing from `BarChart`.
- **D3 — a new `SeriesTone` enum, four values.** Cannot reuse `Tone` (7 values), `AlertTone` (5) or
  `TagTone` (5); 8B1's condition for reuse is an identical set. React's name wins over Angular's
  `ArenaChartTone` because it is already the public one, so the re-export rule is satisfied for
  free, and because it names the right thing: a *series* is a state, not the chart.
- **D4 — `labels`/`values` required in both layers.** Settles a real pre-existing divergence
  (React required, Angular optional). Consistent with 8B3's four consecutive required decisions.
  Cost accepted: 13 NG0950 reworks in `host-class-binding.test.ts`, measured exactly.
- **D5 — `style` and `{...rest}` out of all three React charts** (R4), from the `.jsx` as well as
  the `.d.ts`, each with its own discriminating test.
- **D6 — `LineChartProps`' `Omit<>` heritage flattened.** `check-api.mjs:412` reports any heritage
  clause as the `{...rest}` escape. Source work, not gate work.
- **D7 — `DoughnutChart` gains `seriesLabel`.** A deliberate scope addition, on the 8B2
  `PageHead.align` precedent. It closes the worst case of the aria-label debt: a literal with no
  consumer path at all. It gains no `tone` and no `slot`.

---

## Appendix B: Self-review

Run against the spec, `api/README.md`, `CLAUDE.md` and this plan.

**Spec coverage.** The spec's *"What Plan B3 measured about the three charts, for 8B4"* lists five
findings. All five have a task: `valueFormatter` (D1, Tasks 2–4), `CatSlot` (D2, Tasks 2–4),
`LineChartProps`' heritage (D6, Task 3), `BarChart:angular` in `COVERED` (Task 2 Step 10), and the
no-manifest styling exception (stated in the plan header; no manifest work appears anywhere).
The spec's Plan B arithmetic — "A landed 3, B1 five, B2 five, B3 five, 8B4 the last three — 21
contracts total when B4 merges" — is this plan's target and is checked at every task boundary.

**Placeholder scan.** No TBD, no "implement later", no "add appropriate error handling", no
"similar to Task N" — Tasks 3 and 4 repeat the helper and test code in full rather than pointing at
Task 2, because a task's implementer sees only their own task. The one deliberate conditional is
Task 1's audit and each later task's confirmation step, whose outcome is the maintainer's; the
implementation steps are written against the decided reshape.

**Type consistency.** `SeriesTone` is spelled identically in `api/types/series-tone.json`, both
`api.generated` modules, all three React `.d.ts` files that reference it, `chart-internals.ts`,
`bar-chart.ts`, `line-chart.ts` and every commit message. `valueSuffix` is spelled identically in
all three contracts, all six sources, all six `prompt.md`s and the demo. The helper names
`createBarChartHost` / `createLineChartHost` / `createDoughnutChartHost` are used consistently in
Tasks 2, 3 and 4 and match the existing `createBulkActionBarHost` convention. No task references a
type or function no task defines.

**Two things this plan does NOT fix, named rather than discovered.** `check:api` still never reads
React's `.jsx` — every task here edits one and the gate cannot verify it, which is why Global
Constraint 17 exists and why each task has a grep step and a non-vacuity proof. And the aria-label
debt is only half closed: after D7 all three charts have a consumer-supplied name path, and no
assertion anywhere can tell a *useful* name from a merely present one. That half stays debt, and
Task 6 Step 5 rewrites `CLAUDE.md`'s bullet to say exactly that rather than deleting it.
