# Plan 8B3 — API capability contracts, the third batch of five components

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `UnauthCard`, `BulkActionBar`, `CommandPalette`, `ActivityFeed` and `Onboarding`
under the API capability contract, taking `check:api` from 13 contracts / 25 layer
implementations to 18 / 35 with no API divergence left between React and Angular for any of the
five.

**Architecture:** Each component gets one neutral contract at `api/components/<Name>.json`,
shared objects and enums at `api/types/`, regenerated per layer into the committed
`frameworks/react/api.generated.d.ts` and `frameworks/angular/api.generated.ts`. Every task opens
with a blocking maintainer audit and only then migrates both layers, their tests, their
`prompt.md`s, their manifests and their demos. The five are ordered mechanical → difficult:
UnauthCard (pure R4 plus a narrowing B2 already precedented) → BulkActionBar (the clean
R1-in-array case) → CommandPalette (the same shape, larger internals) → ActivityFeed (five
fields to narrow plus a capability removal) → Onboarding (the batch's one genuinely open R4+R5
question).

**Tech Stack:** Bun (build, test, gates), plain-node-portable `scripts/`, React 18 with inline
token-valued styles, Angular 22 standalone `OnPush` signal primitives, `tailwind-variants`
recipes driven by `frameworks/tailwind/components/*.manifest.json`.

**Spec:** `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`, *Plan B — the eighteen
remaining shared components*. **Normative vocabulary:** `api/README.md`.

**Branch:** `api-contracts-8b3`, cut from `main` at `b9df473` (the B2 merge) plus `2ab6d52`
(deletion of the executed 8a/8b0/8b2 plans).

**Not in this plan:** `BarChart`, `LineChart` and `DoughnutChart`. They are Plan **8B4**, a
separate plan written after B3 merges — see *Task 7, Step 4* for the findings this plan records
for it, and *Appendix A* for why they were split out.

---

## Global Constraints

Every task's requirements implicitly include this section.

1. **English only.** All code, comments, docs, contract `description`s and UI copy in the repo
   are English. (Conversation with the maintainer is Spanish; the repo is not.)
2. **Every execution task OPENS with a blocking maintainer audit (Step 1) and STOPS there.**
   The audit presents, in one exchange: the component's current API measured in every layer that
   implements it; which member breaks which rule, cited to R1–R5 or to the seven forms; and two
   or three concrete reshapes, each with its cost. **The decision is the maintainer's.** No file
   is written until they answer. This overrides any continuous-execution default in the
   executing skill. It is `api/README.md`'s *audit protocol* and an explicit maintainer
   instruction.
3. **`check:api` climbs and never drops:** 13/25 → 14/27 → 15/29 → 16/31 → 17/33 → **18/35**.
   Record the measured pair in `.superpowers/sdd/progress.md` at the end of every task.
4. **`check:api` carries no exception map.** An API divergence is a defect. There is nowhere to
   record one, by design.
5. **The other two contracts are firm** (`api/README.md`, *"The other two contracts are firm;
   this layer is additive"*). Bringing a component under contract may not weaken, remove or
   contradict its behaviour binding or the tokens it renders from. If a reshape appears to
   require dropping something a binding depends on, **the reshape is what is wrong.** The five
   live bindings in this batch: `ActivityFeed`→`feed`, `BulkActionBar`→`toolbar`,
   `CommandPalette`→`combobox`, `Onboarding`→`dialog-modal`, `UnauthCard`→`none`, each declared
   in both layers. None of the five is in `COVERED` in `scripts/check-compliance.mjs` (verified:
   the six entries are `Dialog:react`, `ConfirmDialog:react`, `Menu:react`, `Skeleton:react`,
   `Alert:angular`, `BarChart:angular`), so no compliance suite pins them — `check:behaviour`
   must still stay green and every `*.behaviour.json` in this batch must come out of the branch
   with an **empty diff** unless the maintainer explicitly directs otherwise.
6. **The binding table is mechanical** (`api/README.md`, implemented by `bindingName()` in
   `scripts/check-api.mjs`): a primitive/enum/object/array member `x` is a React prop `x` and an
   Angular `input()` named `x`; the slot named `content` is React's `children` and a bare
   `<ng-content />`; a slot named `x` is a React node-valued prop `x` and
   `<ng-content select="[x]" />`; an event named `x` is React's `onX` and an Angular `output()`
   named `x`.
7. **Required-ness is contracted** for the four inbound non-slot forms only (primitive, enum,
   object, array). Slots and events are not compared — a platform-expression limit, not an
   exception. **Required-ness also governs runtime:** React throws from its render
   (`if (!title) throw new Error('EmptyState: \`title\` is required');` is the established
   idiom — see `frameworks/react/components/feedback/EmptyState.jsx:4` and
   `frameworks/react/components/navigation/PageHead.jsx:9`), Angular uses `input.required<T>()`.
   The gate cannot see the runtime half; the audit enforces it.
8. **NG0950 hazard.** Under the Angular JIT test harness a required signal input throws NG0950
   when read through `detectChanges()` if its value never routes through a template — and a
   literal attribute (`title="x"`) does *not* reach a signal input. The established bypass:
   construct the component directly via `TestBed.createComponent`, overwrite
   `instance['<member>']` before the first `detectChanges()`, or reach the child through
   `By.directive(<Component>)` and set it there. See `frameworks/angular/test/host-class-binding.test.ts`.
   Any member this plan makes required in Angular must be checked against every suite that
   renders that primitive.
9. **`react/.d.ts` re-export rule.** A migrated React `.d.ts` re-exports **exactly** the named
   types the pre-migration file declared and exported locally — no more, no less. A type spelled
   as a bare inline union had no name to import and gets no re-export. Mechanical: read the
   pre-migration file, re-export whatever it named.
10. **A contract type is imported with `import type`, in both layers.** The specifier is
    `'../../api.generated'` from `frameworks/react/components/<group>/` and from
    `frameworks/angular/primitives/<name>/` alike — verified against `Breadcrumbs.d.ts:1` and
    `breadcrumbs.ts:2`. B2's final review recorded `page-head.ts` using a value import as a
    non-blocking Minor and left it; do not add a third exception to that list.
11. **Any `.jsx` or `.entry.jsx` edit is followed by `bun run build:demos`, and the regenerated
    `.js` sibling is committed in the same commit.** Verified with `bun run check:demos`.
12. **`bun run check` runs exactly ONCE**, in Task 7, when implementation is finished. Individual
    gates run per task (listed in each task's gate step). This is the repository's
    completion-gate rule; the full sweep is not a per-commit toll.
13. **Do not merge and do not push.** The branch stays local until the maintainer asks. This is
    an explicit standing instruction.
14. **Test the layer you changed.** Plan A's recorded lesson: it fixed a React defect and shipped
    a render test on the Angular side only. `frameworks/react/test/` is DOM-free
    `renderToStaticMarkup` and costs a few lines; a migration that changes rendered output writes
    one.
15. **A task that removes an R4 escape ships a test proving the escape is gone.** `check:api`
    reads React's `.d.ts` and never opens the `.jsx`, so restoring `style` and `{...rest}` to an
    implementation leaves the gate green — `api/README.md` says so in *"What the gate asserts, and
    what it cannot"*. A test is therefore the only possible regression guard, and it must
    **discriminate**: render the component passing both an unexpected `style` (a literal colour no
    token resolves to) and an unexpected attribute, and assert neither reaches the rendered HTML.
    Testing the two separately matters — a component that spread `...style` but not `{...rest}`
    must still fail. **This applies to Tasks 1, 2 and 4** (Task 3 is R4-clean already; Task 5's R4
    violation is a platform *type*, not a spread, and is caught by the gate). Added after Task 1's
    review found its own plan-supplied test titled *"the root carries no consumer style"* while
    asserting nothing about style.
16. **A test title states exactly what the body asserts.** The same review found the overclaiming
    title above; a title that promises more than the assertions deliver is worse than no test,
    because it reads as coverage that does not exist.
17. **A member `description` lives in the contract only.** Nothing generates from
    `api/components/*.json`. Each layer's own doc comment and `prompt.md` restate it by hand and
    nothing holds the three in step — a known limit, recorded in `api/README.md`. Restate it
    anyway; do not leave a layer's prose describing the pre-migration member.

---

## File Structure

Created by this plan:

| Path | Responsibility |
|---|---|
| `api/components/UnauthCard.json` | Task 1's neutral contract |
| `api/components/BulkActionBar.json` | Task 2's neutral contract |
| `api/types/bulk-action.json` | The `BulkAction` predefined object |
| `api/components/CommandPalette.json` | Task 3's neutral contract |
| `api/types/command.json` | The `Command` predefined object |
| `api/components/ActivityFeed.json` | Task 4's neutral contract |
| `api/types/activity-item.json` | The `ActivityItem` predefined object |
| `api/components/Onboarding.json` | Task 5's neutral contract |
| `api/types/onboarding-step.json` | The `OnboardingStep` predefined object |
| `api/types/onboarding-anchor.json` | The `OnboardingAnchor` predefined object (replaces `DOMRect`) |
| `frameworks/react/test/bulk-action-bar.test.jsx` | React render proof for Task 2 |
| `frameworks/react/test/command-palette.test.jsx` | React render proof for Task 3 |
| `frameworks/react/test/onboarding.test.jsx` | React render proof for Task 5 |

Regenerated (committed generated output, guarded by `check:api`'s drift assertion):
`frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts`.

Modified per task — the set every migration in this repository touches: the React `.jsx` and
`.d.ts`, the Angular `.ts` (and its `.variants.ts` and Tailwind manifest **if slots move**), both
layers' test suites, both layers' `*.prompt.md`, the group's `*.card.html` demo and its
`.entry.jsx` plus the compiled `.js`, and `components-divergences.md` (batched into Task 6).

---

## Task 0: Pre-flight

**Files:**
- Rename: `.superpowers/sdd/progress.md` → `.superpowers/sdd/progress-8b2-archived.md`
- Create: `.superpowers/sdd/progress.md`

**Interfaces:**
- Produces: a fresh B3 ledger every later task appends to, and a verified `13 / 25` baseline
  every later task's climb is measured against.

> **`.superpowers/` is git-ignored scratch** — the root `.gitignore:37` ignores the whole
> directory, `progress.md` is untracked, and plan 8B2 committed none of its own ledger. So this
> task uses plain `mv`, not `git mv` (which fails with *"not under version control"*), and it
> **produces no commit**. Every later task's `git add -A` likewise picks up its source changes and
> silently leaves the ledger behind, which is correct and is what B2 did. Do not try to force the
> ledger into a commit.

- [ ] **Step 1: Archive B2's ledger**

`.superpowers/sdd/progress.md` currently holds Plan 8B2 in full (its six tasks, its final
whole-branch review, and its maintainer decisions). It must be preserved, not overwritten.

```bash
cd /home/juan/Dravensoft/Identity
mv .superpowers/sdd/progress.md .superpowers/sdd/progress-8b2-archived.md
```

Verify both the archive and the absence:

```bash
ls -l .superpowers/sdd/progress-8b2-archived.md
test ! -e .superpowers/sdd/progress.md && echo "progress.md cleared, ready for Step 2"
```

- [ ] **Step 2: Open the B3 ledger**

Create `.superpowers/sdd/progress.md` with exactly this content:

```markdown
# Plan 8B3 — API capability contracts, the third batch of five components

Plan: docs/superpowers/plans/2026-07-24-8b3-api-contracts-third-batch.md
Branch: api-contracts-8b3
Base commit before Task 1: aba49b1 (the commit recording this plan; main + the executed-plan deletion + the plan)
(Plan 8B2's ledger is archived beside this one as progress-8b2-archived.md.)

Subjects, mechanical→hard, one document: UnauthCard, BulkActionBar, CommandPalette, ActivityFeed,
Onboarding. The three SVG charts are NOT in this plan — they are 8B4, written after B3 merges.

Each task OPENS with a maintainer audit decision (Step 1) that BLOCKS before any code is
written — a Global Constraint of the plan and an explicit user instruction; it overrides the
skill's continuous-execution default. Task 6 is the divergences pass, Task 7 is close-out.

check:api must climb 13 → 14 → 15 → 16 → 17 → 18 contracts (25 → 35 layers), never dropping.

## Pre-flight

(fill in Step 3's measured baseline here)

## Progress

## Maintainer decisions taken
```

- [ ] **Step 3: Measure and record the baseline**

Run:

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api
```

Expected: `check-api: 13 contract(s) hold across 25 layer implementation(s)`

Write the exact line under `## Pre-flight` in the new `progress.md`. **If the number differs,
stop and report it** — every later task's climb is measured against this pair, and a plan whose
baseline is wrong reports a false gain.

- [ ] **Step 4: Confirm the tree is untouched — this task produces no commit**

Both files are git-ignored scratch, so nothing is staged and nothing is committed. Prove it:

```bash
cd /home/juan/Dravensoft/Identity
git status --short
git log --oneline -1
```

Expected: `git status --short` prints **nothing** (the two ledger files are ignored, and no
tracked file was touched), and `git log --oneline -1` still shows the plan commit
`aba49b1 docs(api): record Plan B3 — five more contracts, check:api 18/35`.

**If `git status --short` shows any tracked file, stop and report it** — this task must not modify
source, and anything staged here would land in Task 1's commit under Task 1's message.

---

## Task 1: UnauthCard

The most mechanical of the five. No arrays, no events, no per-item anything: two R4 escapes leave
React, and `eyebrow`/`title` narrow from `React.ReactNode` to `string` — the exact narrowing B2
shipped for `EmptyState.icon` and `PageHead.title`. Angular is expected to come out unchanged.

**Files:**
- Create: `api/components/UnauthCard.json`
- Modify: `frameworks/react/components/display/UnauthCard.d.ts`
- Modify: `frameworks/react/components/display/UnauthCard.jsx` (+ regenerated `UnauthCard.js`)
- Modify: `frameworks/react/components/display/unauth-card.card.entry.jsx` (+ regenerated `.js`)
- Modify: `frameworks/react/ui_kits/console/LoginScreen.jsx` (+ regenerated `.js`) — *if it passes `style`/rest*
- Modify: `frameworks/react/components/display/UnauthCard.prompt.md`
- Modify: `frameworks/angular/primitives/unauth-card/unauth-card.prompt.md` — *only if a member's prose changed*
- Test: `frameworks/react/test/unauth-card.test.jsx`
- Test: `frameworks/angular/test/unauth-card-variants.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: no shared type. `api.generated.*` is expected to be **byte-unchanged** by this task —
  if `bun run build:api` produces a diff, something declared a type it should not have.

- [ ] **Step 1: BLOCKING maintainer audit — present and STOP**

Present exactly this, then **wait for the maintainer's answer**. Write nothing until they reply.

**Current API, measured.**

| Layer | Members as declared |
|---|---|
| React `UnauthCard.d.ts` | `interface UnauthCardProps extends React.HTMLAttributes<HTMLDivElement>` — `brand?: React.ReactNode`, `eyebrow?: React.ReactNode`, `title?: React.ReactNode`, `footer?: React.ReactNode`, `children?: React.ReactNode`, `style?: React.CSSProperties` |
| React `UnauthCard.jsx:16` | `({ brand, eyebrow, title, footer, children, style, ...rest })`; `style` spreads into the root div's inline style and `{...rest}` onto the root div (`:23`) |
| Angular `unauth-card.ts` | `eyebrow = input<string>()`, `title = input<string>()`; template slots `<ng-content select="[brand]" />`, bare `<ng-content />`, `<ng-content select="[footer]" />`, gated by `contentChild(ArenaBrand)` / `contentChild(ArenaFooter)` |

**What breaks which rule.**

- **R4**, twice, React only: `style?: React.CSSProperties` is a platform type, and
  `extends React.HTMLAttributes<HTMLDivElement>` is the `{...rest}` escape. `check-api.mjs:412`
  reports *any* heritage clause as this violation.
- **R2** decides `eyebrow` and `title`, and the two layers currently disagree — React accepts a
  node, Angular accepts a string. This is the only real question in the task.

**Reshapes.**

| | Shape | Cost |
|---|---|---|
| **A** *(recommended)* | `eyebrow`/`title` become `primitive string`; `brand`/`footer`/`content` stay slots | React narrows; Angular byte-unchanged; consumers passing markup into `eyebrow`/`title` break. Consistent with B2's `EmptyState.title`, `PageHead.title` and `ErrorState.icon` narrowings, and with R2 — Arena owns the mono-crimson microlabel's and the heading's markup entirely (`UnauthCard.jsx:32-33`) |
| **B** | `eyebrow`/`title` become slots in both layers | Angular gains two `<ng-content select>` plus two marker directives and two `contentChild` queries, and loses the `@if (eyebrow(); as label)` gate that keeps an empty wrapper out of the DOM. Reverses the single-icon precedent's own reasoning |
| **C** | Keep the divergence | Not available. `check:api` has no exception map — that is the point of the layer |

**Also for decision:** the pre-migration `.d.ts` exports no named type but `UnauthCardProps`, so
under the re-export rule the migrated file re-exports **nothing**. Confirm.

- [ ] **Step 2: Write the contract**

Assuming Reshape A. Create `api/components/UnauthCard.json`:

```json
{
  "component": "UnauthCard",
  "description": "The panel a signed-out screen needs — sign in, check your inbox, this link expired, a two-factor code. It knows nothing about credentials on purpose; the fields are composed inside it.",
  "api": {
    "brand": { "form": "slot",
               "description": "The brand lock-up above the panel's content. An AppLogo, in practice." },
    "eyebrow": { "form": "primitive", "type": "string",
                 "description": "Mono crimson microlabel — the product, not the task." },
    "title": { "form": "primitive", "type": "string",
               "description": "The task. \"Welcome back\", \"Check your inbox\"." },
    "content": { "form": "slot",
                 "description": "The fields, composed from Input and Button." },
    "footer": { "form": "slot",
                "description": "Centred muted line below the content — a recovery link, a legal note." }
  }
}
```

- [ ] **Step 3: Run the gate and watch it fail with the divergences named**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api && bun run check:api
```

Expected: **FAIL**, naming at least `react/UnauthCard: extends "React.HTMLAttributes<HTMLDivElement>"
— the {...rest} escape is none of the seven forms, R4`, and a form mismatch on `eyebrow` and
`title` (declared `slot` by the reader, `primitive` by the contract).

`build:api` must produce **no diff** to `api.generated.*` — this task declares no new type. Verify:

```bash
git diff --stat frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

Expected: empty output.

- [ ] **Step 4: Migrate the React `.d.ts`**

Replace `frameworks/react/components/display/UnauthCard.d.ts` with:

```ts
import * as React from 'react';
/** The panel a signed-out screen needs — sign in, check your inbox,
 *  this link expired, enter your two-factor code.
 *
 *  It knows nothing about credentials on purpose: the moment it knew about a
 *  password field it would stop serving the other three. Fields are composed
 *  from Input and Button.
 * @startingPoint section="Display" subtitle="Signed-out panel" viewport="700x560" */
export interface UnauthCardProps {
  /** The brand lock-up above the panel's content. An <AppLogo>, in practice. */
  brand?: React.ReactNode;
  /** Mono crimson microlabel — the product, not the task. */
  eyebrow?: string;
  /** The task. "Welcome back", "Check your inbox". */
  title?: string;
  /** Centred muted line below the content — a recovery link, a legal note. */
  footer?: React.ReactNode;
  /** The fields, composed from Input and Button. */
  children?: React.ReactNode;
}
export function UnauthCard(props: UnauthCardProps): JSX.Element;
```

- [ ] **Step 5: Migrate the React `.jsx`**

In `frameworks/react/components/display/UnauthCard.jsx`, change line 16 from:

```jsx
export function UnauthCard({ brand, eyebrow, title, footer, children, style, ...rest }) {
```

to:

```jsx
export function UnauthCard({ brand, eyebrow, title, footer, children }) {
```

and line 23 from:

```jsx
    <div style={{ width: '100%', maxWidth: 'calc(var(--sp-1) * 95 + var(--sp-1) * 18 + var(--bw) * 2)', ...style }} {...rest}>
```

to:

```jsx
    <div style={{ width: '100%', maxWidth: 'calc(var(--sp-1) * 95 + var(--sp-1) * 18 + var(--bw) * 2)' }}>
```

Leave every other line untouched — the comment block at `:18-22` explaining the 454px width
arithmetic, and the flex-not-block comment at `:26-30`, both stay.

- [ ] **Step 6: Find and fix every consumer**

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "UnauthCard" frameworks/react --include=*.jsx --include=*.html | grep -v "components/display/UnauthCard.jsx"
```

Known sites: `frameworks/react/ui_kits/console/LoginScreen.jsx`,
`frameworks/react/components/display/unauth-card.card.entry.jsx`,
`frameworks/react/test/unauth-card.test.jsx`.

For each: if it passes `style={{...}}` or any spread attribute to `<UnauthCard>`, move that
styling to a wrapper `<div>` around it (the pattern B2 used for `EmptyState` and `ErrorState` in
their demo entries). If it passes JSX into `eyebrow` or `title`, replace with the plain string.

- [ ] **Step 7: Rebuild the demos**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos && bun run check:demos
```

Expected: `check:demos` PASS. `git status` must show a regenerated `.js` sibling for every
`.jsx`/`.entry.jsx` touched in Steps 5 and 6.

- [ ] **Step 8: Prove the React render, and the throw-free path**

`frameworks/react/test/unauth-card.test.jsx` already exists. Add one test asserting the narrowed
members render as text and that no `style` attribute survives on the root. Follow the file's
existing import and `renderToStaticMarkup` idiom rather than introducing a new one — read it
first.

Two tests, per Global Constraints 15 and 16 — one for the narrowing, one for the escape removal.
The second is the only guard that exists: `check:api` never opens the `.jsx`.

```jsx
test('eyebrow and title render as plain text', () => {
  const html = renderToStaticMarkup(
    <UnauthCard eyebrow="ARENA" title="Welcome back">
      <span>fields</span>
    </UnauthCard>,
  );
  assert.ok(html.includes('ARENA'), 'the eyebrow string is rendered');
  assert.ok(html.includes('Welcome back'), 'the title string is rendered');
  assert.ok(html.includes('fields'), 'children are rendered');
});

test('a consumer style prop and stray attributes are dropped, not spread onto the root', () => {
  const html = renderToStaticMarkup(
    <UnauthCard style={{ color: 'rgb(255, 0, 0)' }} data-escape="leaked">
      <span>fields</span>
    </UnauthCard>,
  );
  assert.ok(!html.includes('rgb(255, 0, 0)'), 'a consumer style never reaches the root (R4)');
  assert.ok(!html.includes('data-escape'), 'a stray attribute never reaches the root (R4)');
});
```

The two assertions must stay separate: a component that spread `...style` but not `{...rest}`
— or the reverse — must still fail. The colour literal is deliberately one no Arena token
resolves to, so the component's own `var(--crimson)` eyebrow cannot satisfy it by accident.

- [ ] **Step 9: Run the tests**

```bash
cd /home/juan/Dravensoft/Identity
bun run test:react && bun run test:angular
```

Expected: PASS on both. Record the counts — B2 left them at 79 (React) and 332 (Angular).

- [ ] **Step 10: Restate the member prose**

Update `frameworks/react/components/display/UnauthCard.prompt.md` so no example passes `style`
or JSX into `eyebrow`/`title`, and its Do/Don't reflects the narrowing. Read
`frameworks/angular/primitives/unauth-card/unauth-card.prompt.md` and change it **only if** its
prose describes a member this task moved — Angular is expected unchanged, so most likely it is not
touched.

- [ ] **Step 11: Run the task's gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:api && bun run check:behaviour && bun run check:demos && bun run check:dimensions
```

Expected: `check-api: 14 contract(s) hold across 27 layer implementation(s)`, and PASS on the
other three. Then confirm the binding did not move:

```bash
git diff --stat -- '*.behaviour.json'
```

Expected: empty output.

- [ ] **Step 12: Commit and record**

Append a Task 1 line to `.superpowers/sdd/progress.md` recording: the members contracted, that
both R4 escapes left React, that Angular was unchanged (or what changed), the measured
`check:api` pair, and the two test counts.

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api): bring UnauthCard under the API contract

Five members: brand/content/footer slots, eyebrow and title narrowed to
primitive strings per R2. React loses style and the {...rest} spread (R4).
check:api 14 contracts / 27 layers.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: BulkActionBar

The batch's cleanest R1-in-array case, and `Breadcrumbs` already answered it in Plan A: a
per-item callback inside an object becomes a component-level event carrying the item. Angular's
`ArenaBulkAction` is **already** the target shape — this migration is unilateral, React moving to
where Angular stands.

**Files:**
- Create: `api/components/BulkActionBar.json`
- Create: `api/types/bulk-action.json`
- Create: `frameworks/react/test/bulk-action-bar.test.jsx`
- Modify: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts` (regenerated)
- Modify: `frameworks/react/components/navigation/BulkActionBar.d.ts`
- Modify: `frameworks/react/components/navigation/BulkActionBar.jsx` (+ regenerated `.js`)
- Modify: `frameworks/react/components/navigation/navigation.card.entry.jsx` (+ regenerated `.js`)
- Modify: `frameworks/angular/primitives/bulk-action-bar/bulk-action-bar.ts`
- Modify: `frameworks/react/components/navigation/BulkActionBar.prompt.md`
- Modify: `frameworks/angular/primitives/bulk-action-bar/bulk-action-bar.prompt.md`
- Test: `frameworks/angular/test/bulk-action-bar-variants.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `BulkAction` in `api/types/`, emitted into both `api.generated.*` modules as an
  interface with fields `label: string` (required), `icon?: string`, `destructive?: boolean`.

- [ ] **Step 1: BLOCKING maintainer audit — present and STOP**

**Current API, measured.**

| Layer | Members as declared |
|---|---|
| React `BulkActionBar.d.ts` | `count: number` (required), `noun?: string`, `actions: BulkAction[]` (required), `onClear?: () => void`, `style?: React.CSSProperties`. `interface BulkAction { label: string; icon?: React.ReactNode; onClick: () => void; destructive?: boolean }` |
| React `BulkActionBar.jsx:5` | `({ count = 0, noun = 'items', actions = [], onClear, style })`; returns `null` at `count === 0`; each action's `a.onClick` is wired per button (`:18`); **the Clear button renders only when `onClear` is passed** (`:30`) |
| Angular `bulk-action-bar.ts` | `count = input(0)`, `noun = input('items')`, `actions = input<ArenaBulkAction[]>([])`, `run = output<ArenaBulkAction>()`, `cleared = output<void>()`. `interface ArenaBulkAction { label: string; icon?: string; destructive?: boolean }` — already the target shape. **The Clear button is unconditional**; the class doc comment argues for it explicitly and cites `components-divergences.md` |

**What breaks which rule.**

- **R1**: `BulkAction.onClick` is a function inside a predefined object. Remedy is fixed by the
  rule and by `Breadcrumbs`' precedent: it becomes a component-level event carrying the action.
- **Convention** (`api/README.md`, *"a field inside an array of predefined objects can only be a
  primitive"*): `BulkAction.icon` is `React.ReactNode` and becomes a primitive `string` carrying a
  Phosphor class name. A component-level slot cannot vary per item, so R1's slot remedy is
  unavailable here. Angular already does this.
- **R4**: `style?: React.CSSProperties` on React.
- **Event naming** (binding table): the contract event `clear` binds to React's `onClear` and an
  Angular `output()` named `clear`. Angular's is named `cleared` today and must be renamed —
  the same one-word rename B2 made for `Alert`'s `closed` → `close`.

**The one real question: who decides whether Clear is drawn?**

React gates it on `onClear` being passed; Angular always draws it. **Angular cannot detect a
listener**, which is the same constraint that produced `Alert.dismissible` and
`ErrorState.retryLabel` in B2 — an unobservable piece of state has to become a detectable input,
or the behaviour has to become unconditional.

| | Shape | Cost |
|---|---|---|
| **A** | Clear is unconditional in both layers. No member for it; `clear` fires always | React loses the ability to hide Clear. Adopts a design argument Angular's source already makes and records (*"a selection the user cannot see the edges of is one they act on by accident"*). Deletes a `components-divergences.md` entry outright. Smallest contract |
| **B** | A `clearable` primitive boolean (default?) gates it in both layers | Preserves React's capability and matches the `Alert.dismissible` precedent exactly. Angular gains an input and an `@if`; every Angular consumer relying on the current unconditional Clear must now pass `clearable` (or the default is `true`, which makes the member near-decorative) |
| **C** | Keep the divergence | Not available |

**Also for decision:** `count` and `actions` are required in React and defaulted in Angular
(`input(0)`, `input([])`); `noun` is undefined-by-default in React and `'items'` in Angular. The
contract governs required-ness, so pick one per member. Making either required in Angular triggers
the **NG0950 hazard** (Global Constraint 8) in `bulk-action-bar-variants.test.ts` and
`host-class-binding.test.ts`.

**Also for decision:** the pre-migration `.d.ts` exported `BulkAction` as a named interface, so
under the re-export rule the migrated file **must** re-export it
(`export type { BulkAction };`) for an existing consumer's import to keep resolving.

- [ ] **Step 2: Write the shared type**

Create `api/types/bulk-action.json`:

```json
{
  "name": "BulkAction",
  "kind": "object",
  "description": "One action a BulkActionBar offers for the current selection. A destructive action stays outline in --error — transparent at rest, the soft --danger-soft tint only on hover — never the filled danger surface, which is ConfirmDialog's alone.",
  "fields": {
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "The button's text." },
    "icon": { "form": "primitive", "type": "string",
              "description": "A Phosphor class name for the leading glyph Arena draws." },
    "destructive": { "form": "primitive", "type": "boolean",
                     "description": "Renders the action outline in --error rather than in --bone-dim." }
  }
}
```

- [ ] **Step 3: Write the contract**

Assuming Reshape A (Clear unconditional) and `count`/`actions` required. Create
`api/components/BulkActionBar.json`:

```json
{
  "component": "BulkActionBar",
  "description": "Appears when rows are selected and operates on the selection as a set. Renders nothing at a count of zero.",
  "api": {
    "count": { "form": "primitive", "type": "number", "required": true,
               "description": "How many rows are selected. Zero renders no bar at all." },
    "noun": { "form": "primitive", "type": "string", "default": "items",
              "description": "What is being counted, plural — \"items\", \"projects\"." },
    "actions": { "form": "array", "of": "BulkAction", "required": true,
                 "description": "The actions offered for the current selection." },
    "run": { "form": "event", "payload": "BulkAction",
             "description": "An action was activated, carrying which one." },
    "clear": { "form": "event",
               "description": "The Clear control was activated. Arena always draws it." }
  }
}
```

**If the maintainer picks Reshape B**, add one member and gate the button on it in both layers:

```json
    "clearable": { "form": "primitive", "type": "boolean", "default": true,
                   "description": "Whether the Clear control is drawn. Both layers gate on this — Angular cannot detect a `clear` listener." },
```

- [ ] **Step 4: Regenerate and watch the gate fail**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api && bun run check:api
```

Expected: `api.generated.d.ts` and `api.generated.ts` each gain a `BulkAction` interface, and
`check:api` **FAILS** naming React's `style` (R4), React's `onClick`-carrying `BulkAction` (R1),
and Angular's `cleared` (a member the contract does not declare) alongside a missing `clear`.

Confirm the generated modules are the only generated diff:

```bash
git diff --stat frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts
```

- [ ] **Step 5: Migrate the React `.d.ts`**

Replace `frameworks/react/components/navigation/BulkActionBar.d.ts` with:

```ts
import type { BulkAction } from '../../api.generated';

export type { BulkAction };

/** Bulk actions bar (H7). Shown when rows are selected; renders nothing at count 0. */
export interface BulkActionBarProps {
  /** How many rows are selected. Zero renders no bar at all. */
  count: number;
  /** What is being counted, plural — "items", "projects". */
  noun?: string;
  /** The actions offered for the current selection. */
  actions: BulkAction[];
  /** An action was activated, carrying which one. */
  onRun?: (action: BulkAction) => void;
  /** The Clear control was activated. Arena always draws it. */
  onClear?: () => void;
}
export function BulkActionBar(props: BulkActionBarProps): JSX.Element | null;
```

Note the import path: `../../api.generated` from `frameworks/react/components/navigation/`.
Verify it against a migrated sibling (`frameworks/react/components/navigation/Breadcrumbs.d.ts`)
before writing it — same directory depth, so the same specifier.

- [ ] **Step 6: Migrate the React `.jsx`**

In `frameworks/react/components/navigation/BulkActionBar.jsx`:

Line 3-5 — replace the signature and doc comment:

```jsx
/** Bulk actions bar (H7). Appears when rows are selected and offers to operate on the set.
 * `count`: number of selected items (does not render if 0). `actions`: [{ label, icon?, destructive? }],
 * where `icon` is a Phosphor class name Arena draws. Activating one emits `onRun` with the action. */
export function BulkActionBar({ count, noun = 'items', actions, onRun, onClear }) {
  if (count == null) throw new Error('BulkActionBar: `count` is required');
  if (actions == null) throw new Error('BulkActionBar: `actions` is required');
  if (!count) return null;
```

Line 11 — drop `...style` from the root's inline style object, leaving:

```jsx
        boxShadow: 'var(--shadow-2)' }}>
```

Lines 17-28 — the action button emits the component event and draws the icon from a class name:

```jsx
        {actions.map((a, i) => (
          <button key={i} onClick={() => onRun && onRun(a)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', height: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 3)',
              background: 'transparent', border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text-md)',
              color: a.destructive ? 'var(--danger)' : 'var(--bone-dim)',
              transition: 'background var(--dur-fast) var(--ease-out)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            {a.icon && <span style={{ fontSize: 'var(--icon-md)', display: 'inline-flex' }}><i className={a.icon} aria-hidden="true" /></span>}{a.label}
          </button>
        ))}
```

Lines 30-36 — under Reshape A the Clear button is unconditional, so remove the `{onClear && (`
wrapper and its closing `)}`, leaving the `<button>` rendered directly with
`onClick={() => onClear && onClear()}`.

The `<i className={a.icon} aria-hidden="true" />` shape is the one B2 established for
`EmptyState`/`ErrorState`; match it exactly rather than inventing a variant.

- [ ] **Step 7: Migrate the Angular primitive**

In `frameworks/angular/primitives/bulk-action-bar/bulk-action-bar.ts`:

1. Replace the local `ArenaBulkAction` interface with an import from the generated module:
   `import type { BulkAction } from '../../api.generated';`. **Check whether anything else imports
   `ArenaBulkAction`** before deleting it:

   ```bash
   grep -rn "ArenaBulkAction" frameworks/ --include=*.ts --include=*.html
   ```

   Every hit must be updated in this task. Angular has no re-export rule (`api/README.md`: *"a
   component's own file imports straight from `../../api.generated` and there is no prior local
   declaration to preserve"*), so the local interface goes.
2. Rename the output: `readonly cleared = output<void>();` → `readonly clear = output<void>();`,
   and in the template `(click)="cleared.emit()"` → `(click)="clear.emit()"`.
3. Retype `actions`, `run` and `classesFor` to `BulkAction`.
4. Apply the maintainer's required-ness decision — e.g. `input.required<number>()` for `count`.
   **If any member becomes required, work the NG0950 hazard** (Global Constraint 8).
5. Update the class doc comment: the paragraph explaining that Clear is unconditional *unlike
   React's optional `onClear`* is now false under Reshape A — both layers draw it. Rewrite it to
   state the contract, and **do not** delete the `components-divergences.md` citation silently;
   Task 6 owns that file and needs to know the claim moved.

- [ ] **Step 8: Update the demo and rebuild**

`frameworks/react/components/navigation/navigation.card.entry.jsx` composes `BulkActionBar`.
Change every `actions={[{ label, icon: <i .../>, onClick: ... }]}` to
`actions={[{ label, icon: 'ph-bold ph-x' }]}` (a real Phosphor class name) plus a single
`onRun={...}` on the component, and move any `style` to a wrapper `<div>`.

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos && bun run check:demos
```

- [ ] **Step 9: Write the React render proof**

Create `frameworks/react/test/bulk-action-bar.test.jsx`. Read
`frameworks/react/test/alert.test.jsx` first and copy its imports and idiom exactly.

```jsx
test('an action renders its icon as a Phosphor class and its label as text', () => {
  const html = renderToStaticMarkup(
    <BulkActionBar count={3} actions={[{ label: 'Archive', icon: 'ph-bold ph-archive' }]} />,
  );
  assert.ok(html.includes('class="ph-bold ph-archive"'), 'the icon is drawn from the class name');
  assert.ok(html.includes('Archive'), 'the label is rendered');
  assert.ok(html.includes('3 items selected'), 'the count and default noun are rendered');
});

test('a count of zero renders nothing', () => {
  assert.equal(renderToStaticMarkup(<BulkActionBar count={0} actions={[]} />), '');
});

test('an absent required member throws rather than rendering', () => {
  assert.throws(() => renderToStaticMarkup(<BulkActionBar actions={[]} />), /`count` is required/);
});

test('a consumer style prop is dropped, not spread onto the root', () => {
  const html = renderToStaticMarkup(
    <BulkActionBar count={1} actions={[]} style={{ color: 'rgb(255, 0, 0)' }} />,
  );
  assert.ok(!html.includes('rgb(255, 0, 0)'), 'a consumer style never reaches the root (R4)');
});
```

The last test is required by Global Constraint 15 and is the only guard on this task's R4
removal — `check:api` reads `BulkActionBar.d.ts` and never opens `BulkActionBar.jsx`.
`BulkActionBar` carries no `{...rest}`, so one assertion covers it; the colour literal is one
no Arena token resolves to, so the bar's own `var(--danger)` cannot satisfy it by accident.

- [ ] **Step 10: Extend the Angular suite**

In `frameworks/angular/test/bulk-action-bar-variants.test.ts`, add an assertion that the renamed
output exists and that `classesFor` still resolves a destructive action's classes. Read the file's
existing idiom first — it is a recipe suite, not a render suite, so assert against
`bulkActionBarStyles` unless it already renders.

- [ ] **Step 11: Restate the member prose**

Update both `prompt.md`s: React's must stop showing a per-item `onClick` and must show `onRun`;
Angular's must say `clear`, not `cleared`. Every example in both files uses a Phosphor class
string for `icon`.

- [ ] **Step 12: Run the tests and the task's gates**

```bash
cd /home/juan/Dravensoft/Identity
bun run test:react && bun run test:angular
bun run check:api && bun run check:behaviour && bun run check:demos && bun run check:dimensions && bun run check:states
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 15 contract(s) hold across 29 layer implementation(s)`, all gates PASS,
empty behaviour diff.

- [ ] **Step 13: Commit and record**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api): bring BulkActionBar under the API contract

Five members: count, noun, actions (array of the new BulkAction type), and the
run/clear events. BulkAction.onClick leaves the object and becomes run(BulkAction)
per R1 and the Breadcrumbs precedent; BulkAction.icon narrows to a Phosphor class
name; React loses style (R4); Angular renames the cleared output to clear.
check:api 15 contracts / 29 layers.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Append the Task 2 line to `.superpowers/sdd/progress.md`.

---

## Task 3: CommandPalette

The same shape as Task 2 — an array of predefined objects carrying a per-item callback and a
per-item icon — applied a second time, with the decision already made. What makes it heavier is
what sits behind it: 270 lines of Angular with a focus trap and keyboard navigation, three Angular
suites, and a behaviour binding that **cites `components-divergences.md`**.

**Files:**
- Create: `api/components/CommandPalette.json`
- Create: `api/types/command.json`
- Create: `frameworks/react/test/command-palette.test.jsx`
- Modify: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts` (regenerated)
- Modify: `frameworks/react/components/navigation/CommandPalette.d.ts`
- Modify: `frameworks/react/components/navigation/CommandPalette.jsx` (+ regenerated `.js`)
- Modify: `frameworks/react/components/navigation/command-palette.card.entry.jsx` (+ regenerated `.js`)
- Modify: `frameworks/angular/primitives/command-palette/command-palette.ts`
- Modify: both `*.prompt.md`
- Test: `frameworks/angular/test/command-palette-variants.test.ts`,
  `command-palette-keyboard.test.ts`, `command-palette-focus-trap.test.ts`

**Interfaces:**
- Consumes: the `BulkAction` precedent from Task 2 — the same per-item resolution, cited rather
  than re-derived.
- Produces: `Command` in `api/types/`, emitted as an interface with `id?: string`,
  `label: string` (required), `hint?: string`, `icon?: string`, `shortcut?: string`.

- [ ] **Step 1: BLOCKING maintainer audit — present and STOP**

**Current API, measured.**

| Layer | Members as declared |
|---|---|
| React `CommandPalette.d.ts` | `open: boolean` (required), `onClose?: () => void`, `commands?: Command[]`, `placeholder?: string`. `interface Command { id?: string; label: string; hint?: string; icon?: React.ReactNode; shortcut?: string; onRun?: () => void }` |
| React `CommandPalette.jsx:3` | `({ open, onClose, commands = [], placeholder = 'Search for an action or project…' })`. `run(c)` at `:11` calls `onClose()` **then** `c.onRun()`. **No `style`, no `{...rest}` — R4-clean already** |
| Angular `command-palette.ts` | `open = input(false, { transform: booleanAttribute })`, `commands = input<ArenaCommand[]>([])`, `placeholder = input('Search for an action or project…')`, `closed = output<void>()`, `run = output<ArenaCommand>()`. `interface ArenaCommand { id?: string; label: string; hint?: string; icon?: string; shortcut?: string }` — already the target shape |

**What breaks which rule.**

- **R1**: `Command.onRun` is a function inside a predefined object → a component-level `run` event
  carrying the command. Task 2 just made this call for `BulkAction.onClick`; this is its second
  application, not a new decision.
- **Convention**: `Command.icon` is `React.ReactNode` → primitive `string`. Angular already does.
- **Event naming**: the contract event `close` binds to React's `onClose` and an Angular
  `output()` named `close`. Angular's is `closed` and must be renamed — third occurrence of this
  rename (`Alert` in B2, `BulkActionBar` in Task 2).
- **R4**: nothing. This is the one component in the batch with no platform escape.

**Behavioural ordering to preserve.** React's `run(c)` closes first and runs second
(`CommandPalette.jsx:11`). Under the contract that becomes `onClose(); onRun(c);` — the same
order. State explicitly whether that ordering is being preserved; the maintainer should not have
to infer it.

**Reshapes.**

| | Shape | Cost |
|---|---|---|
| **A** *(the Task 2 shape)* | `Command.onRun` → `run(Command)`; `icon` → string; Angular `closed` → `close` | React consumers move a per-item callback to one component-level handler and must switch on the command. Consistent with `Breadcrumbs`, `BulkActionBar` |
| **B** | Keep `id` required so a consumer can switch on it | Narrows the type more than the current React or Angular declaration; a real capability constraint on consumers who identify commands by label |

**Also for decision:** `commands` is optional in React (`commands?`) and defaulted in Angular
(`input([])`); `open` is required in React and defaulted `false` in Angular. Pick one per member.
`open` becoming `input.required` in Angular hits the **NG0950 hazard** in all three
`command-palette-*.test.ts` suites — that is the largest single risk in this task.

**Also for decision:** the pre-migration `.d.ts` exported `Command` as a named interface, so the
migrated file re-exports it.

- [ ] **Step 2: Write the shared type**

Create `api/types/command.json`:

```json
{
  "name": "Command",
  "kind": "object",
  "description": "One entry in a CommandPalette. `hint` is searched but never shown, so a command can be found by a synonym that never appears in its label.",
  "fields": {
    "id": { "form": "primitive", "type": "string",
            "description": "A stable identity for the command, so a host can switch on it rather than on the label." },
    "label": { "form": "primitive", "type": "string", "required": true,
               "description": "What the command is called, and the primary text searched." },
    "hint": { "form": "primitive", "type": "string",
              "description": "Searched but never shown — a synonym that finds the command." },
    "icon": { "form": "primitive", "type": "string",
              "description": "A Phosphor class name for the leading glyph Arena draws." },
    "shortcut": { "form": "primitive", "type": "string",
                  "description": "The keystroke shown at the row's trailing edge, monospaced. Display only — the palette does not bind it." }
  }
}
```

- [ ] **Step 3: Write the contract**

Create `api/components/CommandPalette.json`:

```json
{
  "component": "CommandPalette",
  "description": "Power-user accelerator (Cmd/Ctrl+K): search and run actions without a mouse. Controlled — the host owns whether it is open.",
  "api": {
    "open": { "form": "primitive", "type": "boolean", "required": true,
              "description": "Whether the palette is shown. Closed renders nothing." },
    "commands": { "form": "array", "of": "Command", "required": true,
                  "description": "Every command the palette can find. Filtered by label and hint as the user types." },
    "placeholder": { "form": "primitive", "type": "string", "default": "Search for an action or project…",
                     "description": "The search field's placeholder." },
    "close": { "form": "event",
               "description": "The palette asked to be closed — Escape, the scrim, or a command having been run." },
    "run": { "form": "event", "payload": "Command",
             "description": "A command was activated, carrying which one. Emitted after close." }
  }
}
```

- [ ] **Step 4: Regenerate and watch the gate fail**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api && bun run check:api
```

Expected: FAIL naming React's `Command.onRun` (R1) and Angular's `closed`/missing `close`.

- [ ] **Step 5: Migrate the React `.d.ts`**

```ts
import type { Command } from '../../api.generated';

export type { Command };

/** Command palette (Cmd/Ctrl+K). Arrow-key navigation, Enter runs, Esc closes. */
export interface CommandPaletteProps {
  /** Whether the palette is shown. Closed renders nothing. */
  open: boolean;
  /** Every command the palette can find. Filtered by label and hint as the user types. */
  commands: Command[];
  /** The search field's placeholder. */
  placeholder?: string;
  /** The palette asked to be closed — Escape, the scrim, or a command having been run. */
  onClose?: () => void;
  /** A command was activated, carrying which one. Emitted after onClose. */
  onRun?: (command: Command) => void;
}
export function CommandPalette(props: CommandPaletteProps): JSX.Element | null;
```

- [ ] **Step 6: Migrate the React `.jsx`**

In `frameworks/react/components/navigation/CommandPalette.jsx`:

Line 3 — the signature gains `onRun` and, if `commands` became required, its guard:

```jsx
export function CommandPalette({ open, commands, placeholder = 'Search for an action or project…', onClose, onRun }) {
  if (commands == null) throw new Error('CommandPalette: `commands` is required');
```

Line 11 — the per-item callback becomes the component event, preserving the close-then-run order:

```jsx
  const run = (c) => { onClose && onClose(); c && onRun && onRun(c); };
```

Line 35 — the icon is drawn from a class name:

```jsx
              {c.icon && <span style={{ fontSize: 'var(--icon-lg)', display: 'inline-flex' }}><i className={c.icon} aria-hidden="true" /></span>}
```

Everything else — the filter at `:7`, the two `useEffect`s, the whole `onKey` handler, the
`role="dialog" aria-modal="true"` at `:21` — is untouched. **The `combobox` binding depends on
that markup; it must not move.**

- [ ] **Step 7: Migrate the Angular primitive**

In `frameworks/angular/primitives/command-palette/command-palette.ts`:

1. Delete the local `ArenaCommand` interface and import `Command` from `../../api.generated`.
   First find every consumer:

   ```bash
   grep -rn "ArenaCommand" frameworks/ --include=*.ts --include=*.html
   ```

   `filterCommands`'s signature (`command-palette.ts:~44`) is one of them and is exported and
   directly tested — retype it to `Command` and update `command-palette-keyboard.test.ts`.
2. Rename `closed` → `close` on the field and at every `.emit()` site in the template and class.
3. Apply the required-ness decision; if `open` or `commands` becomes required, rework the three
   `command-palette-*.test.ts` suites through the NG0950 bypass.
4. Leave the focus trap and the key handling alone.

- [ ] **Step 8: Update the demo and rebuild**

`frameworks/react/components/navigation/command-palette.card.entry.jsx` — per-item
`icon: <i .../>` becomes a class string, per-item `onRun` becomes one component-level `onRun`.

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos && bun run check:demos
```

- [ ] **Step 9: Write the React render proof**

Create `frameworks/react/test/command-palette.test.jsx`:

```jsx
test('a closed palette renders nothing', () => {
  assert.equal(renderToStaticMarkup(<CommandPalette open={false} commands={[]} />), '');
});

test('an open palette draws each command with its icon class, label and shortcut', () => {
  const html = renderToStaticMarkup(
    <CommandPalette open commands={[{ label: 'New project', icon: 'ph-bold ph-plus', shortcut: 'N' }]} />,
  );
  assert.ok(html.includes('class="ph-bold ph-plus"'), 'the icon is drawn from the class name');
  assert.ok(html.includes('New project'), 'the label is rendered');
  assert.ok(html.includes('role="dialog"'), 'the combobox binding\'s dialog element is intact');
});
```

- [ ] **Step 10: Restate the member prose, run the tests and the gates**

Update both `prompt.md`s (React drops per-item `onRun`, gains component-level `onRun`; Angular
says `close`, not `closed`; both use icon class strings).

```bash
cd /home/juan/Dravensoft/Identity
bun run test:react && bun run test:angular
bun run check:api && bun run check:behaviour && bun run check:demos && bun run check:dimensions && bun run check:states
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 16 contract(s) hold across 31 layer implementation(s)`, all gates PASS,
empty behaviour diff. **`command-palette.behaviour.json` cites `components-divergences.md`** — do
not touch that citation here; Task 6 owns it.

- [ ] **Step 11: Commit and record**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api): bring CommandPalette under the API contract

Five members: open, commands (array of the new Command type), placeholder, and
the close/run events. Command.onRun leaves the object and becomes run(Command)
per R1; Command.icon narrows to a Phosphor class name; Angular renames the
closed output to close. The close-then-run ordering and the combobox binding's
markup are unchanged. check:api 16 contracts / 31 layers.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Append the Task 3 line to `.superpowers/sdd/progress.md`.

---

## Task 3b: Teach the reader `input.required<T, TransformT>()`

**Added mid-execution, after Task 3 measured the problem.** This is gate work, not component
work, and it is the only task in this plan that changes `scripts/`.

**Why.** Task 3 made Angular's `open` required and discovered that `input.required` and
`booleanAttribute` are mutually exclusive under the current reader: `classMember`'s regex
(`api-surface.mjs:333`) captures everything between `<` and `>` as the type, so
`input.required<boolean, unknown>({ transform: booleanAttribute })` yields the string
`"boolean, unknown"`, which `classify()` throws on. The implementer therefore shipped
`open = input.required<boolean>()` with **no coercion**, and `<arena-command-palette open>` — the
bare-attribute form — stopped meaning `true`.

**Why that is a defect and not a trade.** Verified against `angular.dev/api/core/input`: the
signature is `input.required<T, TransformT>(opts)`, where **`T` is what the signal returns** and
`TransformT` is what the binding *accepts*. The contract declares `type: "boolean"`, which is `T`.
So reading the first generic is reading exactly the type the contract governs — not a shortcut.
`api/README.md` is explicit that the contract governs the member surface "and not the syntax by
which a platform expresses it", and the tree already agrees: `Alert.dismissible`,
`Tag.removable`, `ConfirmDialog.open`, `ConfirmDialog.destructive` and `LineChart.area` all carry
`booleanAttribute` today, are all already under contract from B1/B2, and all pass `check:api`
green through the reader's `bare` branch. Dropping the transform is what *creates* a divergence:
React's `<CommandPalette open />` is JSX sugar for `open={true}`, so without the transform the
bare-attribute form works in one layer and not the other — and `check:api` cannot see it.

**Files:**
- Modify: `scripts/lib/api-surface.mjs` (`classMember`)
- Modify: `scripts/api-surface.test.mjs`
- Modify: `frameworks/angular/primitives/command-palette/command-palette.ts`
- Modify: `frameworks/angular/primitives/command-palette/command-palette.prompt.md`

**Interfaces:**
- Produces: a reader that accepts the two-generic form, which **Task 5 depends on** —
  `onboarding.ts:98` is `open = input(false, { transform: booleanAttribute })` and hits the
  identical wall the moment Task 5 makes `open` required.

- [ ] **Step 1: Write the failing reader tests**

In `scripts/api-surface.test.mjs`, beside the existing `classMember`/`angularSurface` cases:

```js
test('a required input with a transform reads its FIRST generic, which is the member type', () => {
  const { members } = angularSurface(
    'export class X {\n  readonly open = input.required<boolean, unknown>({ transform: booleanAttribute });\n}',
    'X',
  );
  assert.deepEqual(members, [{ name: 'open', required: true, form: 'primitive', type: 'boolean' }]);
});

test('a required input with a transform and NO generics declares no type and is refused', () => {
  assert.throws(
    () => angularSurface(
      'export class X {\n  readonly open = input.required({ transform: booleanAttribute });\n}',
      'X',
    ),
    /UnrecognisedShape|unreadable/,
  );
});
```

The second test is as important as the first. `angular.dev` shows
`input.required({transform: booleanAttribute})` as idiomatic, and the reader must keep **refusing**
it: it declares no type at all, and this module's standing rule is to fail loudly rather than
infer one — the same rule `literalType` applies to `input(arg)` with no inferable type.

- [ ] **Step 2: Run them and watch the first fail**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/api-surface.test.mjs
```

Expected: the first new test FAILS with an `UnrecognisedShape` naming `boolean, unknown`; the
second already passes (for the wrong reason — the initialiser matches neither branch — which is
fine, it is pinning behaviour that must survive).

- [ ] **Step 3: Split the generic list in `classMember`**

In `scripts/lib/api-surface.mjs`, inside the `if (generic)` branch, the captured `type` is a
generic *list*, not one annotation. Classify only its first entry, using the module's own
depth-aware splitter so a generic argument carrying its own comma (`Record<string, number>`) is
not cut in half:

```js
    return { name, required: Boolean(required), ...classify(splitTopLevel(type, ',')[0]) };
```

Write the reason on the line above it, in this module's register — it explains *why* the first
entry is the right one, which a reader six months from now cannot recover from the code:

```js
    /* Angular's signature is input.required<T, TransformT>(opts): T is what the signal
     * RETURNS and TransformT is what the binding ACCEPTS. The contract governs the member's
     * declared type, which is T, so only the first generic is classified. Splitting depth-
     * aware rather than on the first comma keeps a generic argument that carries its own
     * comma (Record<string, number>) intact. A single-generic list splits to one entry, so
     * this is a no-op for every declaration in the tree that has no transform. */
```

Leave the `output` path above it untouched — an `output<T>()` takes one generic and has no
transform form.

- [ ] **Step 4: Run the reader tests and the gate**

```bash
cd /home/juan/Dravensoft/Identity
bun test scripts/api-surface.test.mjs && bun run check:api
```

Expected: all reader tests PASS, and `check:api` still reports **16 contracts across 31 layer
implementations** — this step changes no contract and no component, so the number must not move.

- [ ] **Step 5: Restore the transform on CommandPalette**

In `frameworks/angular/primitives/command-palette/command-palette.ts`, restore the coercion that
Task 3 had to drop, and re-add `booleanAttribute` to the `@angular/core` import if it was removed:

```ts
  readonly open = input.required<boolean, unknown>({ transform: booleanAttribute });
```

`booleanAttribute` is `(value: unknown) => boolean`, so `unknown` is the correct `TransformT`.

- [ ] **Step 6: Prove it compiles and the gate still holds**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:angular && bun run check:api && bun run test:angular
```

`check:angular` runs `ngc --strictTemplates` and is the authority that the two-generic form really
typechecks — this step is the reason it is in the list rather than the usual per-task set.
Expected: PASS, `check:api` still 16/31, Angular tests still passing.

- [ ] **Step 7: Restate the prose**

`command-palette.prompt.md` regains the sentence its siblings carry — that a bare `open` and
`[open]="true"` both mean true, thanks to the `booleanAttribute` transform. Copy the wording from
`frameworks/angular/primitives/alert/alert.prompt.md:26` or
`frameworks/angular/primitives/confirm-dialog/confirm-dialog.prompt.md:28` rather than inventing a
third phrasing.

- [ ] **Step 8: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "fix(api): teach the reader input.required<T, TransformT>()

Task 3 found that input.required and booleanAttribute were mutually exclusive
under the reader: the generic capture returned \"boolean, unknown\", which
classify() throws on, so making a boolean member required silently cost its
bare-attribute coercion. Per angular.dev/api/core/input, T is what the signal
returns and TransformT is what the binding accepts, so the contract's declared
type is the first generic. Restores CommandPalette's transform and unblocks
Onboarding, which has the identical shape.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: ActivityFeed

One member in the contract, five reshapes behind it. This is where the batch stops being
mechanical: four node-valued fields narrow to strings, `id` breaks a *different* rule in each
layer, `tone` reuses an existing enum, and `renderItem` — a real capability — is removed.

**Files:**
- Create: `api/components/ActivityFeed.json`
- Create: `api/types/activity-item.json`
- Modify: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts` (regenerated)
- Modify: `frameworks/react/components/display/ActivityFeed.d.ts`
- Modify: `frameworks/react/components/display/ActivityFeed.jsx` (+ regenerated `.js`)
- Modify: `frameworks/react/components/display/activity-feed.card.entry.jsx` (+ regenerated `.js`)
- Modify: `frameworks/react/ui_kits/console/ProjectScreen.jsx` (+ regenerated `.js`) — *if it uses `renderItem` or `style`*
- Modify: `frameworks/angular/primitives/activity-feed/activity-feed.ts`
- Modify: both `*.prompt.md`
- Test: `frameworks/react/test/activity-feed.test.jsx`,
  `frameworks/angular/test/activity-feed-variants.test.ts`

**Interfaces:**
- Consumes: the `Tone` enum, already in `api/types/tone.json` and already emitted into both
  `api.generated.*` modules — declared by Plan A for `StatCard`, reused here, not redeclared.
- Produces: `ActivityItem` in `api/types/`.

- [ ] **Step 1: BLOCKING maintainer audit — present and STOP**

**Current API, measured.**

| Layer | Members as declared |
|---|---|
| React `ActivityFeed.d.ts` | `interface ActivityFeedProps extends React.HTMLAttributes<HTMLUListElement>` — `items: ActivityItem[]` (required), `renderItem?: (item: ActivityItem) => React.ReactNode`, `style?: React.CSSProperties`. `interface ActivityItem { id?: React.Key; actor?: React.ReactNode; action?: React.ReactNode; target?: React.ReactNode; time?: React.ReactNode; tone?: 'neutral' \| 'accent' \| 'gold' \| 'success' \| 'warning' \| 'danger' \| 'info' }` |
| React `ActivityFeed.jsx:15` | `({ items = [], renderItem, style, ...rest })`; the row is `<li>{renderItem ? renderItem(item) : <>…</>}</li>` (`:23`); a module-level `TONES` map holds the same seven names |
| Angular `activity-feed.ts` | `items = input<readonly ActivityItem[]>([])` — the only member. `export type ActivityTone = 'neutral' \| 'accent' \| 'gold' \| 'success' \| 'warning' \| 'danger' \| 'info'`; `interface ActivityItem { id?: string \| number; actor: string; action: string; target?: string; time?: string; tone?: ActivityTone }` |

**What breaks which rule.**

- **R4**, three times on React: `style?: React.CSSProperties`, `extends React.HTMLAttributes<…>`,
  and `ActivityItem.id?: React.Key`.
- **R5**, on **Angular**: `ActivityItem.id?: string | number` is a union between two primitive
  types. This is not in any prior list and was found by measuring — both layers' `id` is wrong,
  for different reasons.
- **Convention** (`api/README.md`): `actor`, `action`, `target` and `time` are `React.ReactNode`
  fields inside an array of predefined objects and can only be primitives. Angular already
  declares all four as `string`.
- **`renderItem` is removed.** Not by R3 — measured against the source it *fills* the `<li>` Arena
  renders rather than replacing it, exactly as `TableColumn.render` fills a `<td>`, so R3 permits
  it. It goes because Angular has no binding for per-item projection (it would need a structural
  directive and `ngTemplateOutlet`, which no row of the binding table covers and no reader
  function reads). **`api/README.md` already commits to this removal by name**, so it is a
  citation, not a fresh decision — but state the capability loss plainly: *a consumer can no
  longer place their own markup inside one row of a feed Arena renders.*

**Reshapes.**

| | Question | Options |
|---|---|---|
| **`id`** | Both layers are wrong | **(a)** `string` — narrows Angular (a consumer passing a numeric id must `String()` it) and narrows React from `React.Key`. **(b)** `number`. **(c)** drop `id` and let Arena key by index — cheapest contract, but React's `key={item.id != null ? item.id : i}` at `:19` exists precisely because index keys reorder badly |
| **`actor`/`action`** | Required in Angular, optional in React | **(a)** required — matches Angular and matches the grammar (*someone did something*); breaks any React consumer omitting either. **(b)** optional — matches React; Angular's `activity-feed.ts` and `resolveActivityFeedRows` relax |
| **`items`** | Required in React, defaulted `[]` in Angular | Pick one; required in Angular is an NG0950 site in `activity-feed-variants.test.ts` and `host-class-binding.test.ts` |
| **`tone`** | Two identical 7-value sets | Reuse `api/types/tone.json`'s `Tone` — the sets are byte-identical (`neutral, accent, gold, success, warning, danger, info`), which is B1's stated condition for reuse. Angular's exported `ActivityTone` is then deleted; **grep for its consumers first** |

- [ ] **Step 2: Confirm the two enums really are identical before reusing `Tone`**

```bash
cd /home/juan/Dravensoft/Identity
cat api/types/tone.json
grep -n "ActivityTone" frameworks/angular/primitives/activity-feed/activity-feed.ts
grep -n "tone?:" frameworks/react/components/display/ActivityFeed.d.ts
grep -rn "ActivityTone" frameworks/ --include=*.ts --include=*.html
```

All three value lists must be the same seven names in any order. **If they differ by even one
value, do not reuse `Tone`** — declare a component-specific enum, the way B2 declared `AlertTone`
when `Alert`'s five did not match `Tone`'s seven.

- [ ] **Step 3: Write the shared type**

Assuming `id: string`, `actor`/`action` required, `tone` reusing `Tone`. Create
`api/types/activity-item.json`:

```json
{
  "name": "ActivityItem",
  "kind": "object",
  "description": "One event in a feed: someone did something to something, then. Arena draws every field — a consumer cannot place their own markup inside a row.",
  "fields": {
    "id": { "form": "primitive", "type": "string",
            "description": "A stable identity for the row, so a reordered feed does not re-key by index." },
    "actor": { "form": "primitive", "type": "string", "required": true,
               "description": "Who. Drawn bold in --bone." },
    "action": { "form": "primitive", "type": "string", "required": true,
                "description": "What they did. Drawn in --bone-dim." },
    "target": { "form": "primitive", "type": "string",
                "description": "What they did it to. Drawn monospaced in --gold — it is an identifier." },
    "time": { "form": "primitive", "type": "string",
              "description": "When. Monospaced --mute, pushed to the trailing edge. Preformatted — ActivityFeed never formats." },
    "tone": { "form": "enum", "type": "Tone",
              "description": "Badge's vocabulary, driving the leading dot. Defaults to accent." }
  }
}
```

- [ ] **Step 4: Write the contract**

Create `api/components/ActivityFeed.json`:

```json
{
  "component": "ActivityFeed",
  "description": "An event feed — someone did something to something, then. Arena draws every row.",
  "api": {
    "items": { "form": "array", "of": "ActivityItem", "required": true,
               "description": "The events, newest first by convention. Each row is drawn by Arena; there is no per-item projection." }
  }
}
```

- [ ] **Step 5: Regenerate and watch the gate fail**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api && bun run check:api
```

Expected: FAIL naming React's heritage (R4), `style` (R4), and `renderItem` (a member the
contract does not declare).

- [ ] **Step 6: Migrate the React `.d.ts`**

```ts
import type { ActivityItem } from '../../api.generated';

export type { ActivityItem };

/** Event feed — someone did something to something, then.
 * @startingPoint section="Display" subtitle="Event feed" viewport="560x440" */
export interface ActivityFeedProps {
  /** The events, newest first by convention. Each row is drawn by Arena. */
  items: ActivityItem[];
}
export function ActivityFeed(props: ActivityFeedProps): JSX.Element;
```

The pre-migration file exported `ActivityItem` as a named interface, so it is re-exported. It did
**not** name the tone union — that was a bare inline union with no name for a consumer to import —
so nothing is re-exported for `Tone`.

- [ ] **Step 7: Migrate the React `.jsx`**

In `frameworks/react/components/display/ActivityFeed.jsx`:

Lines 12-17 — the doc comment loses its `renderItem` sentence, the signature loses three
parameters, and the root loses `...style` and `{...rest}`:

```jsx
/** An event feed: someone did something to something, then. Arena draws every
 *  row — there is no per-item projection, because Angular has no binding for one. */
export function ActivityFeed({ items }) {
  if (items == null) throw new Error('ActivityFeed: `items` is required');
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', listStyle: 'none', margin: 0, padding: 0 }}>
```

Lines 23-34 — the ternary collapses to its else branch. The fragment `<>…</>` is no longer needed;
its three children become the `<li>`'s direct children:

```jsx
          <span style={{ flex: 'none', width: 'calc(var(--sp-1) * 2)', height: 'calc(var(--sp-1) * 2)',
            borderRadius: 'var(--r-pill)', background: TONES[item.tone] || TONES.accent }} />
          <span style={{ fontSize: 'var(--dz-text)', color: 'var(--bone-dim)' }}>
            <b style={{ color: 'var(--bone)' }}>{item.actor}</b> {item.action}
            {item.target && ' '}
            {item.target && <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)' }}>{item.target}</span>}
          </span>
          {item.time && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{item.time}</span>}
```

The `TONES` map at `:7-10` and its comment stay — it maps tone names to token values for the dot,
which is rendering, not API.

- [ ] **Step 8: Migrate the Angular primitive**

In `frameworks/angular/primitives/activity-feed/activity-feed.ts`:

1. Delete the local `ActivityItem` interface and `ActivityTone` type; import `ActivityItem` from
   `../../api.generated`. Update every consumer found by the Step 2 grep — `resolveActivityFeedRows`
   and `ActivityFeedRow` both reference `ActivityItem`, and `activity-feed-variants.test.ts`
   imports at least one of them.
2. Apply the `items` required-ness decision. **`activity-feed` is the one host-bound-root
   carve-out in the layer** (its root must be a real `<ul>` with `<li>` rows) — leave that
   structure alone.
3. If `id` narrows to `string`, nothing in the Angular template changes: it does not key by `id`.

- [ ] **Step 9: Update the demo and the console, then rebuild**

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "renderItem\|ActivityFeed" frameworks/react --include=*.jsx --include=*.html | grep -v "components/display/ActivityFeed.jsx"
```

Every `renderItem={...}` must be removed and its content expressed through the four string fields
— or, if it genuinely cannot be, **stop and report it to the maintainer**: that is a real
capability loss the audit should have surfaced, and discovering it here means the audit was
incomplete. Move any `style` to a wrapper. Convert node-valued `actor`/`action`/`target`/`time` to
plain strings.

```bash
bun run build:demos && bun run check:demos
```

- [ ] **Step 10: Extend the React suite**

`frameworks/react/test/activity-feed.test.jsx` already exists. Read it first — any test asserting
on `renderItem` must be **deleted**, not adapted, and one new test replaces it:

```jsx
test('every field is drawn by Arena, and there is no per-item projection', () => {
  const html = renderToStaticMarkup(
    <ActivityFeed items={[{ id: 'a1', actor: 'Ada', action: 'deployed', target: 'api-7', time: '2m' }]} />,
  );
  assert.ok(html.includes('Ada'), 'the actor is rendered');
  assert.ok(html.includes('deployed'), 'the action is rendered');
  assert.ok(html.includes('api-7'), 'the target is rendered');
  assert.ok(html.includes('2m'), 'the time is rendered');
});

test('an absent items array throws rather than rendering an empty feed', () => {
  assert.throws(() => renderToStaticMarkup(<ActivityFeed />), /`items` is required/);
});

test('a consumer style prop and stray attributes are dropped, not spread onto the <ul>', () => {
  const html = renderToStaticMarkup(
    <ActivityFeed items={[]} style={{ color: 'rgb(255, 0, 0)' }} data-escape="leaked" />,
  );
  assert.ok(!html.includes('rgb(255, 0, 0)'), 'a consumer style never reaches the <ul> (R4)');
  assert.ok(!html.includes('data-escape'), 'a stray attribute never reaches the <ul> (R4)');
});
```

The last test is required by Global Constraint 15 and is the only guard on this task's R4
removals — `check:api` reads `ActivityFeed.d.ts` and never opens `ActivityFeed.jsx`. Both
assertions stay separate: `ActivityFeed` sheds *both* `style` and `extends React.HTMLAttributes`,
and a component that dropped one while keeping the other must still fail.

- [ ] **Step 11: Restate the member prose, run the tests and the gates**

Both `prompt.md`s: React's loses every `renderItem` example and its Do/Don't entry, and gains a
line stating the capability is gone and why (Angular has no per-item projection binding).

```bash
cd /home/juan/Dravensoft/Identity
bun run test:react && bun run test:angular
bun run check:api && bun run check:behaviour && bun run check:demos && bun run check:dimensions && bun run check:states
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 17 contract(s) hold across 33 layer implementation(s)`, all gates PASS,
empty behaviour diff. The `feed` binding's `posinset` and `busy` exceptions are claims about the
`<li>` Arena renders; removing `renderItem` makes them *more* true, never less, because every row
is now Arena's. Confirm the binding file is untouched.

- [ ] **Step 12: Commit and record**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api): bring ActivityFeed under the API contract

One member, items, an array of the new ActivityItem type. Four node-valued
fields narrow to strings and id narrows to string, which was React.Key (R4) on
one layer and string|number (R5) on the other; tone reuses the existing Tone
enum, its seven values being identical. React loses style and {...rest} (R4)
and loses renderItem, which R3 permitted but Angular has no binding for.
check:api 17 contracts / 33 layers.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Append the Task 4 line to `.superpowers/sdd/progress.md`.

---

## Task 5: Onboarding

> **DECIDED BY THE MAINTAINER (2026-07-24): Reshape A′.** The member is a predefined object
> `OnboardingAnchor { left, bottom }` **and it is renamed from `anchorRect` to `anchor`** in both
> layers. Wherever the steps below still write `anchorRect` as the member name, read `anchor`.
> Measured rename sites, all of them: `Onboarding.d.ts:13`; `Onboarding.jsx:6,7,18,28,29`;
> `onboarding.ts:31,101,124,133`; `onboarding.prompt.md:10,18` (its template example writes
> `[anchorRect]=`). React's own `Onboarding.prompt.md` does **not** mention it, and
> **`onboarding.card.entry.jsx` does not anchor at all**, so the demo costs nothing. `open` and
> `steps` both become required.

Last, because it carries the batch's one genuinely open question. `anchorRect` breaks **two**
rules at once on React and one on Angular, and no precedent in Plans A, B0, B1 or B2 answers it.

**Files:**
- Create: `api/components/Onboarding.json`
- Create: `api/types/onboarding-step.json`
- Create: `api/types/onboarding-anchor.json`
- Create: `frameworks/react/test/onboarding.test.jsx`
- Modify: `frameworks/react/api.generated.d.ts`, `frameworks/angular/api.generated.ts` (regenerated)
- Modify: `frameworks/react/components/feedback/Onboarding.d.ts`
- Modify: `frameworks/react/components/feedback/Onboarding.jsx` (+ regenerated `.js`)
- Modify: `frameworks/react/components/feedback/onboarding.card.entry.jsx` (+ regenerated `.js`)
- Modify: `frameworks/angular/primitives/onboarding/onboarding.ts`
- Modify: both `*.prompt.md`
- Test: `frameworks/angular/test/onboarding-variants.test.ts`, `onboarding-focus-trap.test.ts`

**Interfaces:**
- Consumes: nothing from Tasks 1–4.
- Produces: `OnboardingStep` and `OnboardingAnchor` in `api/types/`. These are the last two types
  Plan B3 declares; after this task `api/types/` holds 20 files.

- [ ] **Step 1: BLOCKING maintainer audit — present and STOP**

**Current API, measured.**

| Layer | Members as declared |
|---|---|
| React `Onboarding.d.ts` | `open: boolean` (required), `steps: OnboardingStep[]` (required), `index?: number`, `onNext?`, `onBack?`, `onSkip?`, `onDone?` (all `() => void`), `anchorRect?: DOMRect \| { left: number; bottom: number }`. `interface OnboardingStep { eyebrow?: string; title?: string; body?: React.ReactNode }` |
| React `Onboarding.jsx:7` | `({ open, steps = [], index = 0, onNext, onBack, onSkip, onDone, anchorRect })`. **It reads exactly two fields off `anchorRect`**: `.bottom` (`:28`) and `.left` (`:29`). No `style`, no `{...rest}` — R4-clean apart from `anchorRect` |
| Angular `onboarding.ts` | `open = input(false, { transform: booleanAttribute })`, `steps = input<ArenaOnboardingStep[]>([])`, `index = input(0)`, `anchorRect = input<DOMRect>()`, and `next`/`back`/`skip`/`done` as `output<void>()`. `interface ArenaOnboardingStep { eyebrow?: string; title?: string; body?: string }` — already the target shape. **The class doc comment cites `components-divergences.md`** |

**What breaks which rule.**

- **R4**, both layers: `DOMRect` is on R4's named list of platform types
  (`api-surface.mjs:PLATFORM_TYPES`). React declares it in a union, Angular declares it bare.
- **R5**, React only: `DOMRect | { left: number; bottom: number }` is a union between forms — and
  its second branch is an anonymous inline object type, which the reader also reports as
  `platform` because a predefined object is declared in `api/types/` and has a name.
- **Convention**: `OnboardingStep.body` is `React.ReactNode` inside an array of predefined
  objects → primitive `string`. Angular already declares it so.

**The measured fact that shapes the answer:** `Onboarding.jsx` reads **only** `.bottom` and
`.left`. It never touches `top`, `right`, `width`, `height`, `x` or `y`. The union's second branch
is not a fallback — it is a precise statement of the two fields the component actually needs.

**Reshapes.**

| | Shape | Cost |
|---|---|---|
| **A** *(recommended)* | A predefined object `OnboardingAnchor { left: number; bottom: number }`, both fields required. The member keeps the name `anchorRect` | A `DOMRect` is **structurally assignable** to `{ left: number; bottom: number }` in TypeScript, so every existing React and Angular consumer passing `el.getBoundingClientRect()` compiles unchanged. Zero call-site churn. The member name `anchorRect` now names something that is not a Rect — mildly off |
| **A′** | Same object, member renamed `anchor` | Same as A, plus a rename that reads correctly, at the cost of breaking every call site in both layers and both `prompt.md`s |
| **B** | Two primitives, `anchorLeft?: number` and `anchorBottom?: number` | No new type. But it splits one positioning concept across two members that are meaningless apart, and every consumer must destructure the rect by hand. It also makes "anchored or not" express as two optional numbers instead of one optional object |
| **C** | Drop the anchoring capability | Smallest contract, and a genuine product regression — the coachmark becomes bottom-right-only. Not recommended, listed so the option is on the record |

**Also for decision:** `steps` is required in React and defaulted `[]` in Angular; `open` is
required in React and defaulted `false` in Angular; `index` is `0` in both. Making `open` or
`steps` required in Angular hits the **NG0950 hazard** in `onboarding-variants.test.ts` and
`onboarding-focus-trap.test.ts`.

**Also for decision:** the pre-migration `.d.ts` exported `OnboardingStep` as a named interface →
re-exported. It did not name the anchor's inline union branch → nothing re-exported for
`OnboardingAnchor`.

- [ ] **Step 2: Write the two shared types**

Assuming Reshape A. Create `api/types/onboarding-step.json`:

```json
{
  "name": "OnboardingStep",
  "kind": "object",
  "description": "One step of a guided tour. All three fields are optional so a step can carry only the ones it needs; Arena renders each conditionally.",
  "fields": {
    "eyebrow": { "form": "primitive", "type": "string",
                 "description": "Mono crimson microlabel above the title." },
    "title": { "form": "primitive", "type": "string",
               "description": "The step's headline, and the coachmark's accessible name." },
    "body": { "form": "primitive", "type": "string",
              "description": "A sentence or two explaining the feature this step presents." }
  }
}
```

Create `api/types/onboarding-anchor.json`:

```json
{
  "name": "OnboardingAnchor",
  "kind": "object",
  "description": "Where the coachmark attaches: the two viewport coordinates it positions from. A DOMRect is structurally assignable to it, so a consumer passes getBoundingClientRect() directly. Declared as its own object rather than taken as a DOMRect because a platform type is none of the seven forms (R4), and because these are the only two fields Onboarding reads.",
  "fields": {
    "left": { "form": "primitive", "type": "number", "required": true,
              "description": "The anchored element's left edge, in viewport pixels. Clamped inside the viewport before use." },
    "bottom": { "form": "primitive", "type": "number", "required": true,
                "description": "The anchored element's bottom edge, in viewport pixels. The coachmark sits below it." }
  }
}
```

- [ ] **Step 3: Write the contract**

Create `api/components/Onboarding.json`:

```json
{
  "component": "Onboarding",
  "description": "Guided coachmark tour (H10) — presents features within the product with progress dots, Skip and Next. Controlled: the host owns index and answers the four events.",
  "api": {
    "open": { "form": "primitive", "type": "boolean", "required": true,
              "description": "Whether the tour is shown. Closed renders nothing, scrim included." },
    "steps": { "form": "array", "of": "OnboardingStep", "required": true,
               "description": "The tour, in order. An empty tour renders nothing." },
    "index": { "form": "primitive", "type": "number", "default": 0,
               "description": "Which step is current. The host owns it and answers next/back." },
    "anchor": { "form": "object", "type": "OnboardingAnchor",
                "description": "Where to attach the coachmark, as the two viewport coordinates it positions from. Absent floats it bottom-right." },
    "next": { "form": "event",
              "description": "Next was activated on a step that is not the last." },
    "back": { "form": "event",
              "description": "Back was activated on a step that is not the first." },
    "skip": { "form": "event",
              "description": "Skip was activated, or the scrim was clicked." },
    "done": { "form": "event",
              "description": "The final step's confirming control was activated." }
  }
}
```

- [ ] **Step 4: Regenerate and watch the gate fail**

```bash
cd /home/juan/Dravensoft/Identity
bun run build:api && bun run check:api
```

Expected: FAIL naming React's `anchorRect` as a platform type / union and Angular's `anchorRect`
as `DOMRect`.

- [ ] **Step 5: Migrate the React `.d.ts`**

```ts
import type { OnboardingStep, OnboardingAnchor } from '../../api.generated';

export type { OnboardingStep };

/** Step-by-step guided onboarding (H10). Controlled coachmark with progress and an exit ("Skip"). */
export interface OnboardingProps {
  /** Whether the tour is shown. Closed renders nothing, scrim included. */
  open: boolean;
  /** The tour, in order. An empty tour renders nothing. */
  steps: OnboardingStep[];
  /** Which step is current. The host owns it and answers onNext/onBack. */
  index?: number;
  /** Where to attach the coachmark. Absent floats it bottom-right.
   *  A DOMRect is structurally assignable, so getBoundingClientRect() passes directly. */
  anchor?: OnboardingAnchor;
  /** Next was activated on a step that is not the last. */
  onNext?: () => void;
  /** Back was activated on a step that is not the first. */
  onBack?: () => void;
  /** Skip was activated, or the scrim was clicked. */
  onSkip?: () => void;
  /** The final step's confirming control was activated. */
  onDone?: () => void;
}
export function Onboarding(props: OnboardingProps): JSX.Element | null;
```

- [ ] **Step 6: Migrate the React `.jsx`**

In `frameworks/react/components/feedback/Onboarding.jsx` the *logic* does not change at all —
`.bottom` and `.left` are already the only two fields read. Two edits:

Line 6 — the doc comment stops naming a `DOMRect`:

```jsx
 * `anchor` (optional) anchors the callout next to an element by its left and bottom
 * viewport coordinates; a DOMRect satisfies it. Without it the coachmark floats bottom-right. */
```

Line 8 — if `steps` stays required, add its guard beside the existing early return:

```jsx
export function Onboarding({ open, steps, index = 0, onNext, onBack, onSkip, onDone, anchor }) {
  if (steps == null) throw new Error('Onboarding: `steps` is required');
  if (!open || !steps.length) return null;
```

**Leave lines 11-32 exactly as they are.** The `220` and `900` literals carry a written rationale
and are `check:dimensions` `EXEMPT` entries — a runtime projection of data onto a screen position.
Touching them changes what that gate's `EXEMPT` map matches, and a stale exemption fails the gate
itself.

- [ ] **Step 7: Migrate the Angular primitive**

In `frameworks/angular/primitives/onboarding/onboarding.ts`:

1. Delete the local `ArenaOnboardingStep` interface; import `OnboardingStep` and
   `OnboardingAnchor` from `../../api.generated`. Find every consumer first:

   ```bash
   grep -rn "ArenaOnboardingStep" frameworks/ --include=*.ts --include=*.html
   ```
2. `anchorRect = input<DOMRect>()` → `anchor = input<OnboardingAnchor>()`, renaming every `this.anchorRect()` read. Then check every
   field the positioning logic reads off it:

   ```bash
   grep -n "anchorRect()" frameworks/angular/primitives/onboarding/onboarding.ts
   ```

   **If Angular reads any field other than `left` and `bottom`, stop and report it** — the
   contract must then carry that field too, and the audit's Reshape A was measured on React
   alone.
3. Apply the required-ness decision; rework the two `onboarding-*.test.ts` suites through the
   NG0950 bypass if `open` or `steps` becomes required.
4. The class doc comment says the anchor is *"a `DOMRect`, usually from
   `getBoundingClientRect()`"*. Rewrite it to name `OnboardingAnchor` and keep the
   `getBoundingClientRect()` guidance, which is still true. **Do not remove its
   `components-divergences.md` citation** — Task 6 owns that file and must know the citation
   exists.

- [ ] **Step 8: Update the demo and rebuild**

`frameworks/react/components/feedback/onboarding.card.entry.jsx` — any `body:` field carrying JSX
becomes a plain string.

```bash
cd /home/juan/Dravensoft/Identity
bun run build:demos && bun run check:demos
```

- [ ] **Step 9: Write the React render proof**

Create `frameworks/react/test/onboarding.test.jsx`:

```jsx
test('a closed tour renders nothing', () => {
  assert.equal(renderToStaticMarkup(<Onboarding open={false} steps={[{ title: 'One' }]} />), '');
});

test('a step draws its eyebrow, title and body as text, and names the dialog', () => {
  const html = renderToStaticMarkup(
    <Onboarding open steps={[{ eyebrow: 'TOUR', title: 'Projects', body: 'Everything lives here.' }]} />,
  );
  assert.ok(html.includes('TOUR'), 'the eyebrow is rendered');
  assert.ok(html.includes('Everything lives here.'), 'the body renders as plain text');
  assert.ok(html.includes('aria-label="Projects"'), 'the dialog-modal binding\'s accessible name is intact');
});

test('an anchor of two plain numbers positions the coachmark', () => {
  const html = renderToStaticMarkup(
    <Onboarding open steps={[{ title: 'One' }]} anchor={{ left: 40, bottom: 120 }} />,
  );
  assert.ok(html.includes('position:fixed'), 'the anchored branch renders a fixed-position coachmark');
});
```

- [ ] **Step 10: Restate the member prose, run the tests and the gates**

Both `prompt.md`s: neither may describe `anchor` as a `DOMRect`; both state that a
`getBoundingClientRect()` result still satisfies it. React's drops any JSX `body` example.

```bash
cd /home/juan/Dravensoft/Identity
bun run test:react && bun run test:angular
bun run check:api && bun run check:behaviour && bun run check:demos && bun run check:dimensions && bun run check:states
git diff --stat -- '*.behaviour.json'
```

Expected: `check-api: 18 contract(s) hold across 35 layer implementation(s)` — **the plan's
target** — all gates PASS, empty behaviour diff. `Onboarding` binds `dialog-modal`, whose
requirements depend on the `role="dialog" aria-modal="true" aria-label={step.title}` element at
`Onboarding.jsx:41`; confirm it is byte-unchanged.

- [ ] **Step 11: Commit and record**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "feat(api): bring Onboarding under the API contract

Eight members: open, steps (array of the new OnboardingStep type), index,
anchor (the new OnboardingAnchor object, renamed from anchorRect), and the
next/back/skip/done events. It stops being a DOMRect union — a platform type (R4) in a
union between forms (R5) — and becomes a two-field object naming exactly the
left and bottom coordinates the component reads; a DOMRect stays structurally
assignable, so no call site changes. OnboardingStep.body narrows to a string.
check:api 18 contracts / 35 layers.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Append the Task 5 line to `.superpowers/sdd/progress.md`.

---

## Task 6: The `components-divergences.md` pass

Batched deliberately, and B2 recorded why: three separate API-staleness cleanups deferred into one
task produced a coherent pass, where three drive-by edits would have left the file describing a
tree nobody had. **Two of the repository's three citations into this file live in this batch**, so
this task is also the only one that can verify them.

**Files:**
- Modify: `components-divergences.md`
- Verify (do not modify): `frameworks/react/components/navigation/CommandPalette.behaviour.json`
  or its Angular sibling, `frameworks/angular/behaviour-delegated.json`'s `SideNav` entry,
  `frameworks/angular/primitives/onboarding/onboarding.ts`

**Interfaces:**
- Consumes: every contract Tasks 1–5 landed. This task cannot run before Task 5.
- Produces: a divergences document with no false API claim about the five contracted components.

- [ ] **Step 1: Measure the file and find every entry this branch falsified**

```bash
cd /home/juan/Dravensoft/Identity
wc -l components-divergences.md
grep -n "UnauthCard\|BulkActionBar\|CommandPalette\|ActivityFeed\|Onboarding" components-divergences.md
```

`CLAUDE.md` records this file at 1127 lines and the spec at 1089 as of Plan A's merge; **both are
stale by construction and the measured number is the only one to cite.** Record it.

Known-false-as-of-this-branch, to check by reading each hit:

- **UnauthCard's `style`/`{...rest}` entry.** B2's Task 5b explicitly did *not* touch it
  (*"NO UnauthCard edit (still has style/rest, uncontracted)"*) — Task 1 makes it false.
- **BulkActionBar's Clear divergence.** Angular's own source comment cites this file for the
  unconditional-Clear rationale. Under Task 2's Reshape A the divergence no longer exists.
- **CommandPalette's entry**, whatever part of it is API.
- **ActivityFeed's `renderItem`**, if the file records it as a React-only capability.
- **Onboarding's `anchorRect`**, if the file records the `DOMRect` shape (the member is now `anchor`).

- [ ] **Step 2: Apply the rule, entry by entry**

`api/README.md`, *"What happens to `components-divergences.md`"*: **an entry whose entire content
is an API divergence is deleted**, not migrated — the contract replaces it. **Entries covering
rendering or behaviour stay.** Where an entry mixes both, edit surgically and keep the true half.
B2's PageHead entry is the worked example: its `style`/`{...rest}` sentences went, its
still-true measurement-helper prose stayed.

For each hit from Step 1, decide delete-whole / edit-surgically / leave-alone, and **write the
decision into `.superpowers/sdd/progress.md`** so a reviewer can check the judgement rather than
only the diff.

- [ ] **Step 3: Redirect every citation into a section this task moved**

Three files cite this document. Find them:

```bash
cd /home/juan/Dravensoft/Identity
grep -rn "components-divergences" frameworks/ behaviour/ --include=*.json --include=*.ts
```

Expected three: a `CommandPalette` behaviour binding, the `SideNav` entry in
`frameworks/angular/behaviour-delegated.json`, and
`frameworks/angular/primitives/onboarding/onboarding.ts`. Plus the in-source citation Task 2 was
told to leave in `bulk-action-bar.ts`.

For each: open the section it points at. If Step 2 deleted or rewrote that section, **redirect the
citation in this same change** — the spec makes this a hard requirement, not a courtesy. If the
section survived, leave the citation alone.

- [ ] **Step 4: Prove no citation dangles**

```bash
cd /home/juan/Dravensoft/Identity
bun run check:behaviour
grep -rn "components-divergences" frameworks/ behaviour/ --include=*.json --include=*.ts
```

For every hit, read the cited section in the current file and confirm it exists and still says
what the citing file claims. `check:behaviour` must PASS — it verifies the pattern and requirement
names, never the citations, so the manual read is the only check there is.

- [ ] **Step 5: Commit**

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "docs: retire the API divergences the B3 contracts settle

UnauthCard's style/{...rest}, BulkActionBar's conditional Clear,
CommandPalette's and ActivityFeed's and Onboarding's API paragraphs are
replaced by their contracts. Rendering and behaviour prose kept; every
citation into a moved section redirected in the same change.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Close-out

**Files:**
- Modify: `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`
- Modify: `CHANGELOG.md`
- Modify: `.superpowers/sdd/progress.md`

- [ ] **Step 1: Run the full sweep — once**

```bash
cd /home/juan/Dravensoft/Identity
bun run check
```

Expected: every step PASS, and `check:api` reporting **18 contracts across 35 layer
implementations**. Record the exact test counts the run prints for both processes (the merged
process and the isolated `frameworks/react/test-dom` process) — Step 3 needs them, and Plan E's
restore check is a delta against them.

This is the first full run in the plan. Expect it to catch what per-task gates cannot: `check:cards`
needs a real browser and re-measures every `@dsCard` viewport, and B2's close-out found two
browser-only regressions there that no per-task gate could see. If a card over-runs its declared
viewport, fix the viewport (measure by running the gate — declaring it by arithmetic was tried and
does not work).

- [ ] **Step 2: Fix whatever the sweep caught, then re-run it**

If Step 1 was not clean, fix and re-run `bun run check` until it is. Commit each fix separately
with a message naming what the sweep caught.

- [ ] **Step 3: Update the spec's running count**

In `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`, under *Plan E → The running
count*, add a row after Plan B2's:

```markdown
| **Plan B3** (2026-07-24) | **NNN across NN files** | 26 across 5 files |
```

using the counts measured in Step 1, and write the paragraph beneath it accounting for the delta
— which components, which types, how many tests each suite gained. A plan that cannot account for
its own delta is exactly what that table exists to catch.

- [ ] **Step 4: Record the 8B4 findings in the spec**

Add a short subsection under *Plan B* recording what this plan measured about the three charts, so
8B4 does not rediscover it. State these as measured facts:

- `valueFormatter` is declared in all three components in both layers
  (`bar-chart.ts:186`, `line-chart.ts:212`, `doughnut-chart.ts:246`, and each React `.d.ts`) as an
  inbound function returning `string`. `classify()` in `scripts/lib/api-surface.mjs` **throws**
  `UnrecognisedShape` on exactly that shape, so no chart contract can be written until it becomes
  `valueSuffix`, per `api/README.md`.
- React's `CatSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8` reaches `classify()`'s union branch with
  unquoted parts and is returned as `{ form: 'union' }` — an R5 violation. It becomes a bare
  `number`, per `api/README.md`'s worked example. **Open for 8B4's audit:** `LineChart.d.ts` and
  `DoughnutChart.d.ts` both `export type { CatSlot } from './BarChart'`, so whether the *name*
  survives as a back-compat alias is a decision, not a mechanical step.
- **`LineChartProps extends Omit<BarChartProps, 'slots'>` must be flattened.**
  `scripts/check-api.mjs:412` reports *any* heritage clause as the `{...rest}` R4 escape, with no
  special case for `Omit`. This is source work, not gate work — no reader change is needed.
- **`BarChart:angular` is the only one of Plan B's remaining eighteen in `COVERED`**
  (`chart-data-table.test.ts`). That suite asserts the accessible table pairs each category with
  its plotted value, which is the text `valueSuffix` changes. All of the batch's firm-contract
  risk is concentrated there.
- The three charts are the layer's declared styling exception: no manifest, no `.variants.ts`,
  token-valued camelCase `[style]` objects. They are reviewed against React's `charts.card.html`
  rather than a specimen of their own, so `check:tailwind`, `check:states` and `check:coverage`
  have nothing to say about them.

- [ ] **Step 5: Update the CHANGELOG**

Under `## [Unreleased]` — never under the last version, since the plugin is served from the tag
and a released tree is frozen — add one breaking-change note per component: UnauthCard's narrowed
`eyebrow`/`title` and lost `style`/rest; BulkActionBar's `run` event and per-item `onClick`
removal, its icon narrowing and Angular's `cleared`→`clear`; CommandPalette's `run` event and
`closed`→`close`; ActivityFeed's removed `renderItem` and five narrowed fields; Onboarding's
`anchorRect` reshape.

```bash
cd /home/juan/Dravensoft/Identity
bun scripts/check-release.mjs
```

Expected: PASS. `[Unreleased]` sitting on top is expected and never a failure — the gate reads the
first *versioned* entry.

- [ ] **Step 6: Close the ledger and commit**

Write the final `.superpowers/sdd/progress.md` section: every task's outcome, the measured
`check:api` climb, the two test counts, the divergences decisions from Task 6, and every maintainer
decision taken across the five audits (the `## Maintainer decisions taken` section — B2's is the
model, and a reviewer reads it to check the judgement, not only the diff).

```bash
cd /home/juan/Dravensoft/Identity
git add -A
git commit -m "docs: close out plan 8B3 — five more components under contract, check:api 18/35

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 7: Report, and stop**

Report to the maintainer: the branch range, the commit count, the final `check:api` pair, the full
`bun run check` result, and any non-blocking findings rolled up for a final whole-branch review.

**Do not merge and do not push.** Wait for the instruction.

---

## Appendix A: Why the charts are a separate plan

Recorded so 8B4's author does not re-litigate it, and so a reader of this plan is not left
wondering where three of Plan B's eighteen went.

`BarChart`, `LineChart` and `DoughnutChart` are not three components that happen to be similar —
they are **one reshape applied three times**. They share `valueFormatter → valueSuffix`; they
share `CatSlot`; `LineChart.d.ts` and `DoughnutChart.d.ts` both import and re-export types from
`BarChart.d.ts`, so migrating one half-migrates the others. They are the framework layer's
**declared styling exception** — no Tailwind manifest, no `.variants.ts`, token-valued camelCase
`[style]` objects — so the manifest, recipe and specimen work that dominates every other task in
this plan does not apply to them at all. And they carry the batch's only firm compliance suite.

Splitting them out gives each plan one shape of work. Folding them in would have produced a
nine-task plan with two, and one shared type decision spread across three tasks that cannot see
each other.

---

## Appendix B: Self-review

Run against the spec, `api/README.md` and this plan.

**Spec coverage.** Plan B names eighteen subjects; A landed 3, B1 five, B2 five, this plan five,
8B4 the last three — 21 contracts total when B4 merges, which is the spec's arithmetic. Plan B's
*"Four things Plan A discovered"* are all resolved by B0 and cited rather than reopened: the slot
selector convention (`projection-markers.ts`' bare-attribute rule, used by Task 1's `[brand]` and
`[footer]`), the two icon idioms (settled — a single icon is a primitive string, used by Tasks 2,
3 and 4), the per-item icon (settled as a primitive, Tasks 2 and 3), and the `style`/`{...rest}`
count (re-measured per task rather than inherited). Plan B's *"Test the layer you changed"*
instruction is Global Constraint 14 and produces three new React suites.

**Placeholder scan.** No TBD, no "implement later", no "add appropriate error handling", no
"similar to Task N". Every code step carries the code. The one deliberate conditional is each
task's Step 1 audit, whose outcome is the maintainer's to decide — the implementation steps are
written against the recommended reshape and name the delta for each alternative, which is how B2's
plan was structured and what its progress ledger verified against.

**Type consistency.** `BulkAction` is spelled identically in `api/types/bulk-action.json`, the
React `.d.ts` import, the Angular import and both commit messages. Likewise `Command`,
`ActivityItem`, `OnboardingStep`, `OnboardingAnchor`. `Tone` is consumed by Task 4 and declared
nowhere in this plan — it already exists in `api/types/tone.json`. The event names in the contracts
(`run`, `clear`, `close`, `next`, `back`, `skip`, `done`) match their React `onX` bindings and their
Angular `output()` names in every step that writes them.

**Known gap carried, not closed.** `check:api` still does not read React's `.jsx` — its checked
surface is the hand-written `.d.ts`. Every task in this plan therefore has a step that edits the
`.jsx` and a gate that cannot verify it. Each task's reviewer must read the `.jsx` and confirm no
`style`, no `...style` and no `{...rest}` survived, exactly as B2's Task 1 reviewer did. This is
`api/README.md`'s own recorded limit, and this plan does not fix it.
