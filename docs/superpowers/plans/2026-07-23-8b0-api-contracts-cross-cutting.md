# Plan 8B0 — API capability contracts, the five cross-cutting decisions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Settle, once and durably, the five decisions that block more than one of Plan B's
eighteen components, and land the machinery each decision implies — so that plans B1 through
B4 are component migrations with no shared-machinery churn left in them.

**Architecture:** Five audits, each presented in a single exchange and each blocking on the
maintainer's answer, per `api/README.md`'s audit protocol. Each audit's answer is then
recorded somewhere **durable and preferably machine-checked** — `api/README.md` for anything
normative about the vocabulary or the binding table, `frameworks/angular/primitives/projection-markers.ts`
for the Angular selector rule, `scripts/lib/api-surface.mjs` and `scripts/build-api-types.mjs`
for anything a gate can enforce. No decision is left living only in this document: this
document is deleted once executed.

**Tech Stack:** Bun (with plain-node portability for everything under `scripts/`),
`node:test` + `node:assert/strict`, ESM `.mjs`, React 18 hand-written `.d.ts`, Angular 22
standalone signal components, `tailwind-variants` recipes.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **The closed decisions stay closed.** The seven forms, R1–R5, the contract format, the
  hybrid mechanism (generate the types, verify the members), the binding table, and the rule
  that the contract governs required-ness with slots and events carved out — all settled by
  Plan A, all recorded in `api/README.md`. **`api/README.md` is more recent than the spec and
  wins wherever the two disagree.** Implement them; do not reopen or propose alternatives to
  them. Two of this plan's five audits (Tasks 4 and 5) sit close to the vocabulary's edge and
  each has an answer *inside* the closed vocabulary; if the maintainer's answer would require
  changing the seven forms themselves, **stop and escalate to a spec amendment before writing
  any code** — do not absorb a vocabulary change into a task.
- **The audit protocol is binding, and it blocks.** For each of the five decisions the
  implementer presents (1) the current state in every layer that has one, (2) which member or
  selector breaks which rule, cited to the rule, and (3) two or three concrete reshapes each
  with its cost — and then **stops and waits for the maintainer's decision**. Do not decide a
  shape by inference where more than one reading is reasonable. This is the explicit remedy
  for the failure `components-divergences.md` records.
- **Measure, never infer.** Every number in this plan was counted against the tree at
  `3f354cd`. Any number a task needs that is not already in it gets counted again before it is
  written down. The spec's own figures have drifted twice (it says `style` is on 20 React
  components; it is on 26).
- **Do not touch the suspended tests.** `grep -rn PLAN-E-SUSPENDED scripts/` finds two
  commented blocks (`scripts/check-card-viewports.test.mjs`, `scripts/check-angular.test.mjs`).
  They stay commented for the whole of plans A–D. Do not restore them, do not "repair" them,
  do not edit inside them. The gates `check:cards` and `check:angular` themselves still run
  and must still pass.
- **Test the layer you changed.** Plan A's clearest self-inflicted lesson: it fixed a real
  React defect (`StatCard`'s empty delta pill) and shipped it with a render test on the
  *Angular* side only. `frameworks/react/test/` is DOM-free `renderToStaticMarkup` and costs a
  few lines; a change that alters rendered output writes a test **in the layer whose output
  changed**, not in whichever layer already had a suite.
- **English only** in every file in the repository — code, comments, docs, UI copy. (The
  conversation with the maintainer is in Spanish; nothing written into the tree is.)
- **`bun run check` runs once, when this plan's implementation is finished** — not per commit.
  Individual gates during the work: `check:api` after any change to the reader, the generator
  or a contract; `check:angular` and `test:angular` after any Angular template or selector
  change; `check:behaviour` after touching a `reason` string; `check:demos` after touching an
  `.entry.jsx`.
- **Runtime portability.** Everything under `scripts/` must run under plain `node` as well as
  `bun` — no `Bun.*` API, and no `scripts/` test may import a framework layer's `.ts`/`.jsx`.
- **No new debt filed in a plan or spec document.** Those get deleted once executed. Debt goes
  in `CLAUDE.md`'s *Known debt* section or in the owning script's own record map.
- **What the gate does not assert, and this plan must not claim it does.**
  `api/README.md`'s *"What the gate asserts, and what it cannot"* is the authority: R2 and R3
  are authoring rules no gate checks; `default` is in the contract format and read by nothing;
  and **React's checked surface is its hand-written `.d.ts`, never its `.jsx`**. No step in
  this plan may treat any of those as verified.

---

## What this plan is not

- **It contracts no component.** `api/components/` still holds exactly `AppLogo.json`,
  `Breadcrumbs.json` and `StatCard.json` when this plan finishes. The eighteen are B1–B4.
- **It migrates no component to a new contract, and it revises exactly one already-contracted
  member.** Task 2's Reshape B was chosen, so `StatCard.icon` changes from `slot` to a
  primitive `string` here, in both layers, with the React render test that change requires —
  that is the one member surface this plan touches, and it touches it because the convention
  Task 2 settles would otherwise be false of a contract already in the tree. Everything else is
  templates, prompt files, docs and `scripts/`. **`EmptyState` and `ErrorState` narrow their
  React `icon` from `ReactNode` to `string` in B2, not here** — their whole contract lands
  there, and narrowing one member ahead of it would leave a `.d.ts` no contract governs.
- It does not touch `tokens/`, `behaviour/patterns/`, the divergences-document migration plan
  7d owns, or any published version or the plugin manifest.

---

## The measured baseline

Counted at `3f354cd`. Any task restating one of these re-counts it first.

| Fact | Value |
|---|---|
| `bun run check:api` | `3 contract(s) hold across 6 layer implementation(s)` |
| React `.d.ts` files | 43 |
| Angular primitives | 21 |
| `style?: React.CSSProperties` in a React `.d.ts` | **26** files; **13** of them Plan B subjects (Alert, ActivityFeed, Avatar, BarChart, BulkActionBar, ChartCard, DoughnutChart, EmptyState, ErrorState, PageHead, Skeleton, ThemeToggle, UnauthCard), the other 13 Plan C |
| `extends React.HTMLAttributes`/`SVGAttributes` (the `{...rest}` escape) | **6** files; **3** of them Plan B subjects (ActivityFeed, Tag, UnauthCard), the other 3 (Badge, Card, SideNav) Plan C |
| `components-divergences.md` | **1089** lines; `## Per-component divergences` at line **329** |
| merged test process (`scripts` + `frameworks/react/test` + `frameworks/angular/test`) | **856** tests across **68** files, 8.1s |
| isolated DOM process (`frameworks/react/test-dom`) | 26 across 5 files |
| `COVERED` in `scripts/check-compliance.mjs` | 6 entries: Dialog, ConfirmDialog, Menu, Skeleton, Alert, BarChart |

**The reader parses all thirty-six of the eighteen subjects' surfaces without throwing.** This
is the one place Plan B is structurally easier than Plan C: no `UnrecognisedShape` blocks a
contract here. Everything that is wrong is wrong *reported*, with a rule named.

---

## File Structure

**Modified**

| Path | Change |
|---|---|
| `api/README.md` | A new *Conventions the audits settled* section (Tasks 2, 3); the binding-table row and/or the enum-literal sentence, if Tasks 1 and 5 decide so; the "an inbound function is none of the seven forms" sentence (Task 4). |
| `frameworks/angular/primitives/projection-markers.ts` | The naming rule in its header, and the two marker selectors, per Task 1. |
| `frameworks/angular/primitives/{chart-card,empty-state,error-state,page-head}/*.ts` | `ng-content select` per Task 1. |
| `frameworks/angular/primitives/{chart-card,empty-state,error-state,page-head}/*.prompt.md` | Call-shape samples and prose per Task 1. |
| `frameworks/angular/primitives/{chart-card,empty-state,page-head}/*.behaviour.json` | The `reason` strings that quote the selector. |
| `frameworks/angular/README.md` | Lines ~68–69, which name the four marker selectors. |
| `frameworks/angular/test/host-class-binding.test.ts` | Five sites naming the selector (~901, 947, 982, 1016, 1101). |
| `components-divergences.md` | Lines ~321 and ~687, which quote the selector. |
| `scripts/lib/api-surface.mjs` | `classify`'s arrow branch (Task 4); its numeric-enum branch and `templateSlots` (Tasks 5, 1). |
| `scripts/api-surface.test.mjs` | A test per reader change. |
| `scripts/build-api-types.mjs` | `enumLiteral` (Task 5). |
| `scripts/build-api-types.test.mjs` | A test per generator change. |
| `scripts/check-api.mjs` | `validateTypes`' mixed-literal rule (Task 5). |
| `scripts/check-api.test.mjs` | Its test. |
| `scripts/check-compliance.mjs` | Task 6, if the maintainer chooses the compound key. |
| `CLAUDE.md` | The *Known debt* correction (Task 6) and any new limit a task lands. |
| `CHANGELOG.md` | One entry under `## [Unreleased]`. |
| `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` | One row in Plan E's running-count table. |

**Created:** nothing. This plan adds no file. That is the point of it: it is the shared
machinery B1–B4 need, and shared machinery already has homes.

---

## Task 1: The Angular slot-selector convention

Blocks `ChartCard`, `EmptyState`, `ErrorState`, `PageHead` (B2) — and, whichever way it goes,
every `<ng-content select>` Plan D writes for twenty-two new primitives.

**Files:**
- Modify: `frameworks/angular/primitives/projection-markers.ts`
- Modify: `frameworks/angular/primitives/chart-card/chart-card.ts:27`,
  `empty-state/empty-state.ts:26`, `error-state/error-state.ts:27`, `page-head/page-head.ts:29`
- Modify: `frameworks/angular/primitives/{chart-card,empty-state,error-state,page-head}/*.prompt.md`
- Modify: `frameworks/angular/primitives/{chart-card,empty-state,page-head}/*.behaviour.json`
- Modify: `frameworks/angular/README.md`, `components-divergences.md`
- Modify: `frameworks/angular/test/host-class-binding.test.ts`
- Modify (Reshape B only): `api/README.md`, `scripts/lib/api-surface.mjs`,
  `scripts/api-surface.test.mjs`,
  `frameworks/angular/primitives/{app-logo,stat-card,unauth-card}/*.ts` and their prompts

**Interfaces:**
- Consumes: `api/README.md`'s binding table; `templateSlots()` in `scripts/lib/api-surface.mjs`.
- Produces: one convention, recorded in `projection-markers.ts`'s header rule and — under
  Reshape B only — in `api/README.md`'s binding table and in `templateSlots()`. B2's five
  contracts and every Plan D primitive name their slots by it.

- [ ] **Step 1: Present the audit and STOP**

Do not write a line before the maintainer answers. Present exactly this, and wait.

**Current state, measured**

| Primitive | Selector | Marker directive | Member name the reader reports |
|---|---|---|---|
| `app-logo` | `[mark]` | none | `mark` |
| `stat-card` | `[icon]` | none | `icon` |
| `unauth-card` | `[brand]`, `[footer]`, bare `<ng-content />` | `ArenaBrand`, `ArenaFooter` | `brand`, `footer`, `content` |
| `chart-card` | `[arena-actions]`, bare `<ng-content />` | `ArenaActions` | **`arena-actions`**, `content` |
| `page-head` | `[arena-actions]` | `ArenaActions` | **`arena-actions`** |
| `empty-state` | `[arena-action]` | `ArenaAction` | **`arena-action`** |
| `error-state` | `[arena-action]` | `ArenaAction` | **`arena-action`** |
| `alert`, `confirm-dialog`, `tag` | bare `<ng-content />` | none | `content` |

**What breaks what**

1. **The binding table.** `api/README.md` says a slot named `x` is `<ng-content select="[x]" />`.
   So `[arena-actions]` declares a member literally named `arena-actions`, which is not a member
   name any contract should carry and does not match React's `actions` prop. No R-rule decides
   this — the binding table does, and the binding table is normative and already shipped.
2. **The layer has a competing rule, in writing.** `projection-markers.ts`'s header states:
   *"prefix the attribute with `arena-` (`[arena-action]`, `[arena-actions]`) by default, and
   depart from that only when a brief's own projection interface fixes the bare attribute
   name, as `ArenaBrand`/`ArenaFooter`'s `[brand]`/`[footer]` did."* This is not drift; it is
   two rules, and one of them has to go.
3. **The selectors are not just selectors.** `ArenaAction`, `ArenaActions`, `ArenaBrand` and
   `ArenaFooter` are real standalone directives, because `contentChild()` accepts a directive
   type and not a CSS selector — they are how `chart-card`, `empty-state`, `error-state`,
   `page-head` and `unauth-card` decide whether to render the wrapper at all. Renaming a
   selector renames the attribute a *consumer* writes, and a consumer who keeps the old
   attribute gets no error: the attribute is inert and the content silently fails to project.
   Both `empty-state.prompt.md:31` and `error-state.prompt.md:35` already warn about exactly
   this failure mode for a forgotten import.

**Blast radius, counted**

| | Reshape A (bare wins) | Reshape B (prefix wins) |
|---|---|---|
| marker selectors changed | 2 (`ArenaAction`, `ArenaActions`) | 2 (`ArenaBrand`, `ArenaFooter`) + 2 new for `mark`/`icon` only if they ever need `contentChild` (they do not today) |
| `ng-content select` sites changed | 4 | 4 (`app-logo`, `stat-card`, `unauth-card` ×2) |
| `.prompt.md` files changed | 4 | 3 |
| `.behaviour.json` `reason` strings changed | 3 | 0 |
| `host-class-binding.test.ts` sites | 5 | 0 |
| `frameworks/angular/README.md` | 1 paragraph | 1 paragraph |
| `components-divergences.md` | 2 lines | 0 |
| `api/README.md` binding table | unchanged | **changed** — a normative table, shipped |
| `scripts/lib/api-surface.mjs` | unchanged | **`templateSlots()` must strip the prefix** |
| contracts already shipped | unchanged | unchanged (member names stay `mark`, `icon`) |

**Reshape A — bare selectors everywhere; the binding table stays mechanical**

- `[arena-action]` → `[action]`, `[arena-actions]` → `[actions]`. The directive *classes* keep
  their `Arena…` names; only their selectors change.
- `projection-markers.ts`'s naming rule is rewritten to the opposite rule: *the attribute is
  the contract member's name, with no prefix, because `api/README.md`'s binding table says a
  slot named `x` is `select="[x]"`.*
- Contract members become `actions` (ChartCard, PageHead) and `action` (EmptyState, ErrorState),
  which is what React already calls them.
- **Cost:** `[action]` and `[actions]` are very generic global attribute names on a consumer's
  own element. Arena has no way to namespace them back, and a consumer using another library
  that matches a bare `[action]` attribute now has two directives on one node. Nothing in this
  repository collides today, and nothing checks that it stays true.

**Reshape B — the `arena-` prefix everywhere; the binding table gains a row**

- `[mark]` → `[arena-mark]`, `[icon]` → `[arena-icon]`, `[brand]` → `[arena-brand]`,
  `[footer]` → `[arena-footer]`. `[arena-action]`/`[arena-actions]` stay.
- `api/README.md`'s binding table changes its slot row to: *a slot named `x` binds as a React
  node-valued prop `x` and `<ng-content select="[arena-x]" />`*; the `content` slot's bare
  `<ng-content />` row is unchanged.
- `templateSlots()` strips a leading `arena-` from an attribute selector before reporting the
  member name, and **throws on an attribute selector without the prefix**, so the convention is
  machine-enforced rather than hoped for.
- **Cost:** it edits a normative table that shipped eleven days ago and the reader that
  implements it, and it renames four selectors in three primitives Plan A just migrated —
  including `stat-card`'s `[icon]`, whose prompt and demo were written this week. It keeps the
  namespacing the layer's own rule was written for, and it means the twenty-two Plan D
  primitives inherit a prefix nobody has to argue about again.

**Reshape C — per-component, contract member name decided case by case**

- Recorded for completeness and **not recommended**: it needs a map from contract member to
  Angular selector, and `check:api` carries no exception map by charter — adding one to hold a
  naming preference is the exact thing `api/README.md` says this layer exists to remove.

**Recommendation to weigh, not to assume:** A, on the ground that the binding table is
normative, shipped, and mechanical, and that A leaves the reader and the README untouched. The
honest counterweight is the collision risk on a bare global attribute, which B removes and
nothing else does.

**Question for the maintainer:** A or B — and if A, does the naming rule in
`projection-markers.ts` get rewritten as the inverse rule, or deleted in favour of a pointer at
`api/README.md`'s binding table?

- [ ] **Step 2: Rename the marker selectors (Reshape A)**

In `frameworks/angular/primitives/projection-markers.ts`, replace the header comment and both
`@Directive` selectors:

```ts
/** Projection marker directives. Naming rule for a new one: **the attribute IS the contract
 *  member's name, with no prefix.** `api/README.md`'s binding table is normative and
 *  mechanical -- a slot named `x` binds to `<ng-content select="[x]" />` -- so a prefixed
 *  attribute would declare a member literally named `arena-x`, which is not a member name any
 *  contract can carry. (This inverts the rule that stood until plan 8B0: the prefix was the
 *  default and a bare name the exception. The API contract layer decided it the other way,
 *  and `[brand]`/`[footer]` -- the two that were already bare -- are now the pattern rather
 *  than the departure from it.) */
import { Directive } from '@angular/core';
```

then, on the two directives:

```ts
@Directive({ selector: '[action]', standalone: true })
export class ArenaAction {}
```

```ts
@Directive({ selector: '[actions]', standalone: true })
export class ArenaActions {}
```

Leave each directive's own doc comment in place, editing only the attribute it quotes
(`[arena-action]` → `[action]`, `[arena-actions]` → `[actions]`).

> **If Reshape B won instead:** leave `ArenaAction`/`ArenaActions` untouched, change
> `ArenaBrand`'s selector to `'[arena-brand]'` and `ArenaFooter`'s to `'[arena-footer]'`, and
> rewrite the header rule to state the prefix as normative and cite the binding table's new
> slot row.

- [ ] **Step 3: Rename the four `ng-content select` sites**

```
frameworks/angular/primitives/chart-card/chart-card.ts:27    [arena-actions] -> [actions]
frameworks/angular/primitives/page-head/page-head.ts:29      [arena-actions] -> [actions]
frameworks/angular/primitives/empty-state/empty-state.ts:26  [arena-action]  -> [action]
frameworks/angular/primitives/error-state/error-state.ts:27  [arena-action]  -> [action]
```

Each is one attribute inside one template line, e.g. in `page-head.ts`:

```html
      <div [class]="styles().actions()"><ng-content select="[actions]" /></div>
```

Nothing else in those four files moves: the `contentChild(ArenaActions)` / `contentChild(ArenaAction)`
queries bind the directive *type*, which did not change.

> **If Reshape B won instead:** the four sites here are
> `app-logo/app-logo.ts:18` (`[mark]` → `[arena-mark]`),
> `stat-card/stat-card.ts:53` (`[icon]` → `[arena-icon]`, **and the doc comment at `:31` that
> quotes it** — the reader's `componentTemplate()` no longer reads doc comments, but a comment
> that lies is worse than one that does not compile),
> `unauth-card/unauth-card.ts:23` and `:33`.

- [ ] **Step 4: Run the Angular gates and watch them still pass**

Run: `bun run check:angular && bun run test:angular`
Expected: both PASS. `check:angular` is `ngc --strictTemplates` over the whole layer and is the
authority that the templates still compile; `test:angular` is the render suite.

If `test:angular` fails, it is `host-class-binding.test.ts` — it projects real elements carrying
the old attribute. Fix it in the next step rather than here.

- [ ] **Step 5: Follow the rename through the tests**

`frameworks/angular/test/host-class-binding.test.ts` names the selector at five places
(≈901, 947, 982, 1016, 1101 — re-grep rather than trusting the line numbers):

Run: `grep -n 'arena-action' frameworks/angular/test/host-class-binding.test.ts`

Each hit is either a projected element's attribute (`<button arena-action>` → `<button action>`)
or a test name / comment quoting the selector. Change the attribute and the prose together; a
test title that says `[arena-action]` while projecting `[action]` passes and lies.

Run: `bun run test:angular`
Expected: PASS, with the same test count as before this task. A **changed** count means an
assertion was dropped rather than renamed.

- [ ] **Step 6: Follow the rename through the prose**

Four `.prompt.md` files carry both a code sample and an explanation:

```
frameworks/angular/primitives/empty-state/empty-state.prompt.md   :12 :18 :20 :31
frameworks/angular/primitives/error-state/error-state.prompt.md   :15 :21 :24 :35
frameworks/angular/primitives/page-head/page-head.prompt.md       :8  :17 :35
frameworks/angular/primitives/chart-card/chart-card.prompt.md     :8  :15
```

The code sample changes attribute only, e.g. `page-head.prompt.md:8`:

```html
  <div actions>
```

The explanation sentence — *"`arena-actions` is a directive, not a plain attribute, because it
is how the page head detects…"* — keeps its whole argument and changes the attribute it names.
`empty-state.prompt.md:20`'s list of primitives sharing the marker stays accurate as written.

Three `.behaviour.json` `reason` strings quote the selector:

```
frameworks/angular/primitives/empty-state/empty-state.behaviour.json:4
frameworks/angular/primitives/page-head/page-head.behaviour.json:4
frameworks/angular/primitives/chart-card/chart-card.behaviour.json:4
```

Change the quoted attribute in each; change nothing else in those files.

Run: `bun run check:behaviour`
Expected: PASS. The gate reads `pattern` and `exceptions`, not `reason`, so this cannot break
it — running it is how you prove the edit stayed inside the string.

- [ ] **Step 7: Follow the rename through the two documents that quote it**

`frameworks/angular/README.md` ≈68–69 lists the four marker selectors. Rewrite the parenthetical
to the new set and, in one added clause, say why: *the attribute is the contract member's name,
per `api/README.md`'s binding table.*

`components-divergences.md` ≈321 and ≈687 each quote the selector inside a longer sentence about
wrapper collapsing. Change the attribute; leave the sentences otherwise alone. Neither section is
one of the three cited by a behaviour binding (`command-palette.behaviour.json`, the `SideNav`
delegated entry, `onboarding.ts`), so no citation needs redirecting — confirm it:

Run: `grep -rn 'components-divergences' frameworks/ behaviour/ | sed 's/:.*divergences/ -> divergences/'`
Expected: exactly the three known citations, none naming a section this task edited.

- [ ] **Step 8: Prove the reader now reports the member names a contract can carry**

Run:

```bash
node -e "
import('./scripts/lib/api-surface.mjs').then(async (m) => {
  const { readFileSync } = await import('node:fs');
  for (const [n, p] of [['ChartCard','chart-card'],['PageHead','page-head'],['EmptyState','empty-state'],['ErrorState','error-state']]) {
    const s = m.angularSurface(readFileSync('frameworks/angular/primitives/'+p+'/'+p+'.ts','utf8'), n);
    console.log(n, s.members.filter((x) => x.form === 'slot').map((x) => x.name));
  }
});
"
```

Expected: `ChartCard [ 'actions', 'content' ]`, `PageHead [ 'actions' ]`,
`EmptyState [ 'action' ]`, `ErrorState [ 'action' ]` — member names a B2 contract can name.
Before this task the first three read `arena-actions` / `arena-action`.

- [ ] **Step 9: Commit**

```bash
git add frameworks/angular/primitives frameworks/angular/README.md \
  frameworks/angular/test/host-class-binding.test.ts components-divergences.md
git commit -m "refactor(angular): a projection selector is the contract member's name"
```

---

## Task 2: The single-icon idiom

Blocks `Alert`, `EmptyState`, `ErrorState` (B2), and reaches back to `StatCard`, already
contracted.

**Files:**
- Modify: `api/README.md` (a new *Conventions the audits settled* section)
- Modify (only if Reshape B wins): `api/components/StatCard.json` and every file its `icon`
  member touches — see Step 3

**Interfaces:**
- Consumes: R2 (`api/README.md`), and Plan A's shipped `StatCard.json`.
- Produces: one sentence in `api/README.md` that B2's `Alert`, `EmptyState` and `ErrorState`
  contracts cite rather than re-derive.

- [ ] **Step 1: Present the audit and STOP**

**Current state, measured — and it is a three-way split, not the two-way one the spec describes**

| Component | React | Angular | Agree? |
|---|---|---|---|
| `StatCard` | slot (`icon`, contracted) | slot, `<ng-content select="[icon]">` | **yes — slot** |
| `Alert` | `icon?: string` | `icon = input<string>()` | **yes — string** |
| `EmptyState` | `icon?: React.ReactNode` | `icon = input<string>()` | no |
| `ErrorState` | `icon?: React.ReactNode` | `icon = input<string>()` | no |

The spec states that `Alert` is blocked on this decision. **It is not blocked; it already
agrees.** What `Alert` is, is *evidence*: it is the one component where both layers
independently chose the string, and it is one of the four `COVERED` compliance entries.

**What breaks which rule**

Nothing breaks a rule. **R2 describes, it does not arbitrate** — the spec says so explicitly,
and both shapes are legal under it:

- With `icon="ph-bold ph-warning"`, Arena draws the `<i class="…">`. Arena owns the markup and
  the consumer names the glyph → by R2's test, **data**, a primitive.
- With a slot, the consumer draws the whole glyph node and Arena draws only the wrapper → by
  R2's test, **a slot**.

Both are true statements about two different designs. The decision is which one Arena offers,
and it must be one, because a reader of the contracts cannot be asked to remember which
components are which.

**A second thing the decision settles, and it is a rendering one.** Angular cannot know whether
a slot was filled without a `contentChild` query on a marker directive. `stat-card` has no such
directive, so its icon wrapper **renders unconditionally** — a zero-area empty span, recorded by
Plan A as a rendering divergence in `components-divergences.md:1053`. `alert`, `empty-state` and
`error-state` all gate their icon on `@if (icon(); as glyph)` today and ship no empty wrapper.
Reshape A repeats StatCard's empty span three more times, or pays for three marker directives.

**Reshape A — a single icon is always a slot**

- `Alert`, `EmptyState`, `ErrorState` gain `<ng-content select="[icon]" />` and lose
  `icon = input<string>()`. React's `Alert.icon` widens from `string` to a node; React's
  `EmptyState`/`ErrorState` keep their `ReactNode` unchanged.
- **Cost:** three more unconditional empty wrappers, or three more marker directives and three
  more `contentChild` queries and three more things a consumer must import or silently lose the
  icon. `Alert`'s DOM changes, and `Alert` is in `COVERED` — `alert-role-tones.test.ts` must be
  re-read in the same change. Arena stops constraining the icon to the Phosphor set, so a
  consumer can put anything in the slot, including something that breaks the size grammar.
- **Gains:** consistent with StatCard as shipped; nothing already contracted is revised.

**Reshape B — a single icon is always a Phosphor class-name string**

- `StatCard.json`'s `icon` changes from `slot` to `{ "form": "primitive", "type": "string" }`.
  React's `EmptyState`/`ErrorState` narrow from `ReactNode` to `string`. `Alert` is already
  correct in both layers. `stat-card`'s template goes back to drawing its own `<i>` gated on
  `@if`, and the empty-wrapper divergence Plan A *added* to `components-divergences.md` is
  deleted because it stops being true.
- **Cost:** it revises a Plan A contract eleven days after it shipped, and with it
  `StatCard.jsx`, `StatCard.d.ts`, `StatCard.prompt.md`, `display.card.entry.jsx` + its compiled
  `.js`, `stat-card.ts`, `stat-card.prompt.md`, `frameworks/angular/test/stat-card-variants.test.ts`,
  possibly `StatCard.manifest.json`, and the divergences entry at `:1053`. React's
  `EmptyState`/`ErrorState` consumers lose the ability to pass an `<img>` or an inline SVG.
- **Gains:** Arena keeps drawing every decorative glyph, so the icon stays inside what
  `check:compliance` can judge; no empty wrapper anywhere; and the four components read
  identically.

**Reshape C — split by role: a *decorative status glyph* is a string, a *consumer asset* is a slot**

- `Alert`, `EmptyState`, `ErrorState` are string (a status glyph out of Arena's own iconography);
  `StatCard` stays a slot (a metric's mark, which is closer to a brand asset).
- **Cost:** the rule a future author has to apply is "is this glyph decorative-status or
  consumer-asset?", which is not mechanical and is exactly the kind of per-component judgement
  the contract layer exists to remove. It also leaves the empty-wrapper divergence in place for
  one component and not the other three, with no rule explaining the asymmetry.
- **Gains:** nothing already shipped is revised, and no empty wrapper is added.

**Recommendation to weigh, not to assume:** B or C — both keep Arena drawing the three status
glyphs, which is the shape three of the four components already have in both layers and the
shape that ships no empty wrapper. B pays a one-time cost to make the rule mechanical; C pays
nothing now and leaves a judgement call for every future component. A is the only option that
adds empty wrappers, and it adds three.

**Question for the maintainer:** A, B or C — and if B, is revising `StatCard.json` inside this
plan's scope, or does it become the first task of B1?

- [ ] **Step 2: Record the decision in `api/README.md`**

Add a new section immediately **after** *"### Re-exporting a shared type from React's `.d.ts`"*
and before *"## Contract format"*. Write only the paragraph the decision produced; the heading
is shared with Task 3, which appends its own paragraph to it.

For Reshape B:

```markdown
## Conventions the audits settled

R2 decides data-versus-slot by asking who draws the content, and there are shapes where both
answers are true of two different designs. These are the ones the audits settled, so a later
contract cites the convention rather than re-deriving it — and so a reader of the contracts is
never asked to remember which components are which.

**A single icon is a primitive `string` carrying a Phosphor class name, never a slot.** Arena
draws the `<i class="…">`; the consumer names the glyph. This keeps the glyph inside what
`check:compliance` can judge, keeps the icon inside Arena's own iconography, and — the reason
that decided it — lets each layer gate the wrapper on the value's presence. Angular cannot
detect a filled slot without a `contentChild` query on a marker directive, so an icon *slot*
either ships an unconditional zero-area wrapper or costs a directive a consumer must remember
to import. `Alert` had already reached this answer independently in both layers.
```

> **If Reshape A won instead**, the paragraph states the opposite and must also state the price
> it accepted — the unconditional wrapper or the marker directive, named, for each of the three
> components that gained a slot. **If Reshape C won**, the paragraph must state the *test* a
> future author applies, in one sentence, or the convention is not a convention.

- [ ] **Step 3: If Reshape B won, revise `StatCard` in every layer**

Skip this step entirely for A and C. Under B the work is, in order:

1. `api/components/StatCard.json` — `"icon": { "form": "primitive", "type": "string",
   "description": "A Phosphor class name for a small glyph beside the label, drawn muted.
   Arena renders the aria-hidden wrapper and the `<i>`." }`
2. `frameworks/angular/primitives/stat-card/stat-card.ts` — restore `readonly icon = input<string>();`,
   put the wrapper back behind `@if (icon(); as glyph)`, and delete the `<ng-content select="[icon]" />`
   and the doc-comment paragraph at `:31` that explains why it is a slot.
3. `frameworks/react/components/display/StatCard.{jsx,d.ts,prompt.md}` — `icon?: string`, and
   the `<i className={icon}>` Arena draws.
4. `frameworks/angular/primitives/stat-card/stat-card.prompt.md` and the demo entry
   `frameworks/react/components/display/display.card.entry.jsx`, then `bun run build:demos`.
5. `frameworks/angular/test/stat-card-variants.test.ts` — the icon assertions.
6. `components-divergences.md:1053` — delete the whole `### StatCard — the icon wrapper renders
   unconditionally in Angular…` entry: with a string on both sides the divergence does not exist.
7. **A React render test**, because React's rendered output changes. `frameworks/react/test/stat-card.test.jsx`
   exists; add to it:

```jsx
test('an icon renders the glyph Arena draws, inside the aria-hidden wrapper', () => {
  const html = renderToStaticMarkup(<StatCard label="Deploys" value="128" icon="ph-bold ph-rocket" />);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /class="[^"]*ph-rocket/);
});

test('no icon renders no wrapper at all -- not an empty one', () => {
  const html = renderToStaticMarkup(<StatCard label="Deploys" value="128" />);
  assert.doesNotMatch(html, /aria-hidden="true"/);
});
```

Run: `bun run check:api && bun run test:react && bun run test:angular && bun run check:demos`
Expected: all PASS, `check:api` still reporting 3 contracts across 6 layer implementations.

- [ ] **Step 4: Commit**

```bash
git add api/README.md
git commit -m "docs(api): a single icon is one form across the layer"
```

Under Reshape B, add the StatCard files to the same commit and use
`-m "refactor(api): StatCard's icon is a Phosphor class name, not a slot"`.

---

## Task 3: A node-valued field inside an array of predefined objects

Blocks `ActivityFeed`, `BulkActionBar`, `CommandPalette`, `Onboarding` (B3).

**Files:**
- Modify: `api/README.md` (a paragraph appended to the section Task 2 opened)

**Interfaces:**
- Consumes: R1 and R3 (`api/README.md`); Task 2's decision, which this one must not contradict.
- Produces: one paragraph B3's four contracts cite.

- [ ] **Step 1: Present the audit and STOP**

**Current state, measured — the spec calls this "a per-item icon"; it is wider than the icon**

| Object type | React field(s) typed `React.ReactNode` | Angular's counterpart |
|---|---|---|
| `BulkAction` | `icon` | `icon?: string` |
| `Command` | `icon` | `icon?: string` |
| `ActivityItem` | `actor`, `action`, `target`, `time` | all four `string` (`actor` and `action` **required** in Angular, optional in React) |
| `OnboardingStep` | `body` | `body?: string` |

Also measured, and settled by the same decision or by nothing: `ActivityItem.id` is
`React.Key` in React (an R4 platform type) and `string | number` in Angular (an R5 union).

**What breaks which rule**

1. **R1** — *"a field that is a node becomes a slot of the component, or a primitive if Arena
   draws it."* A **component-level slot cannot vary per item**, so for a field inside an *array*
   of objects the first half of R1's remedy is not available. The only in-vocabulary answer is
   the second half: a primitive, with Arena drawing it.
2. **This contradicts nothing in Task 2 if Task 2 chose the string, and contradicts Task 2's
   own precedent if it chose the slot** — under Reshape A of Task 2, Arena would *not* draw a
   single icon but *would* draw a per-item one. That is a defensible split, but it is a split,
   and the spec's own instruction is that it be decided deliberately here rather than
   discovered in `CommandPalette`'s migration.
3. **R3** — separately: `ActivityFeed.renderItem?: (item) => React.ReactNode` replaces the whole
   `<li>`, and that `<li>` is what carries `posinset` and `busy` in `ActivityFeed`'s behaviour
   binding. R3 says a parameterised slot may fill an element Arena renders and never substitute
   it, so `renderItem` **does not survive as it stands**. Angular has no counterpart at all.
   Whatever this task decides about per-item data, `renderItem`'s fate is part of it, because
   it is the escape hatch that exists precisely for what the fields cannot express.

**Reshape A — every per-item field is a primitive; `renderItem` is deleted**

- All four object types become records of primitives and enums, exactly what R1 requires of a
  predefined object. React's `ActivityItem.actor`/`action`/`target`/`time` narrow to `string`;
  `BulkAction.icon` and `Command.icon` narrow to `string`; `OnboardingStep.body` narrows to
  `string`. `ActivityItem.id` becomes `string` (Angular's `string | number` also loses its
  union, R5). `ActivityFeed.renderItem` is removed with nothing in its place.
- **Cost, stated plainly:** React loses the ability to put an `<Avatar>`, a `<Tag>` or a link
  inside an activity row or a command, and loses the documented escape hatch its own `.d.ts`
  describes as *"the same escape hatch Table gives through columns[].render"*. A consumer with
  an event the grammar does not fit composes their own list. This is the largest capability loss
  in Plan B and should be chosen knowingly.
- **Gains:** every one of the four rows above becomes agreement rather than divergence, in the
  direction Angular already implements; the `<li>` keeps its behaviour contract; nothing new is
  added to the vocabulary, the reader or the binding table.

**Reshape B — primitives, plus one parameterised per-item slot that fills and never replaces**

- Fields become primitives as in A, and `ActivityFeed` (and, by the same shape, `CommandPalette`)
  gains a parameterised slot that paints **inside** the `<li>` Arena keeps, never instead of it —
  the `TableColumn.render` shape R3 was written for.
- **Cost:** Angular has no per-item content projection. Expressing this needs a structural
  directive with `ngTemplateOutlet`, which is **a binding no row of `api/README.md`'s table
  covers and no reader function reads**. So this reshape is a change to the binding table plus
  a `templateSlots()`-sized addition to the reader plus its tests — and it lands that machinery
  for exactly one or two members. R3 is also not machine-checkable, so nothing would catch an
  implementation that replaced the `<li>` anyway.
- **Gains:** the escape hatch survives, in a form that keeps the behaviour contract intact, and
  Angular gains a capability it does not have.

**Reshape C — primitives, `renderItem` deleted, and the object types gain the fields that make it unnecessary**

- As A, plus: each object type gains the primitives its React callers were reaching for through
  nodes. Measured against the real call sites before writing any of them — e.g. an
  `ActivityItem.targetHref` if the demo's `target` is a link, a `Command.iconTone` if the
  palette's icon carries meaning. **Count the actual call sites first**: the six `.entry.jsx`
  and `ui_kits/console/*.jsx` uses of the four components are the whole population, and a field
  nobody passes is speculative, not recovered capability.
- **Cost:** the object types grow, and every field added is one more thing both layers must
  implement identically forever. Some node usages simply cannot be recovered as data.
- **Gains:** the capability loss in A is paid down where it is real and not where it is not,
  with no new machinery.

**Recommendation to weigh, not to assume:** A or C. B lands binding-table and reader machinery
for one or two members and buys a rule no gate can enforce; if the escape hatch matters enough
to keep, it is worth building deliberately in a plan of its own rather than as a side effect
here. Between A and C, C is A plus evidence — and the evidence is cheap to gather.

**Question for the maintainer:** A, B or C — and, if C, do you want the call-site survey
presented as its own exchange before the fields are chosen?

- [ ] **Step 2: Record the decision in `api/README.md`**

Append to the *Conventions the audits settled* section Task 2 opened. For Reshape A:

```markdown
**A field inside a predefined object is never a node, and inside an *array* of predefined
objects it can only be a primitive.** R1 offers two remedies for a node-valued field — make it a
slot of the component, or make it a primitive Arena draws — and the first is unavailable per
item, because a component-level slot cannot vary across a list. So `BulkAction.icon`,
`Command.icon`, `ActivityItem`'s text fields and `OnboardingStep.body` are all primitives, and
Arena draws them. The consequence is stated rather than hidden: a consumer cannot place their
own markup inside one row of a list Arena renders, and `ActivityFeed.renderItem` — which
replaced the whole `<li>` that carries `posinset` and `busy` — does not survive R3 and was
removed rather than reshaped.
```

> **If Reshape B won instead**, this paragraph states the per-item slot form *and*
> `api/README.md`'s binding table gains a row for it, and `scripts/lib/api-surface.mjs` gains
> the reader for it with its own tests — that machinery lands in this task, not in B3.
> **If Reshape C won**, the paragraph is the A text plus one sentence naming the fields added
> and the call sites that justified each.

- [ ] **Step 3: Commit**

```bash
git add api/README.md
git commit -m "docs(api): a per-item field is a primitive, and why the escape hatch does not survive"
```

---

## Task 4: An inbound function that returns a value

**Not in the spec — found by running the reader against the tree.** Blocks `BarChart`,
`LineChart`, `DoughnutChart` (B4) and `ThemeToggle` (B1).

**Files:**
- Modify: `scripts/lib/api-surface.mjs` (`classify`'s arrow branch)
- Modify: `scripts/api-surface.test.mjs`
- Modify: `api/README.md`

**Interfaces:**
- Consumes: the seven forms and R4 (`api/README.md`).
- Produces: `classify()` refusing a non-`void` arrow with `UnrecognisedShape`, so a formatter can
  never be silently contracted as an event; and one sentence in `api/README.md` saying why.

- [ ] **Step 1: Present the audit and STOP**

**Current state, measured**

| Member | React | Angular |
|---|---|---|
| `BarChart.valueFormatter` | `(value: number) => string` | `input<(value: number) => string>((value) => String(value))` |
| `LineChart.valueFormatter` | inherited via `Omit<BarChartProps, 'slots'>` | same as BarChart |
| `DoughnutChart.valueFormatter` | `(value: number) => string` | same as BarChart |
| `ThemeToggle.label` | `(isDark: boolean) => string` | **absent** — Angular computes both strings internally |

**What breaks which rule**

1. **None of the seven forms is an inbound function.** `event` is *"an outbound member: a name
   plus a declared payload"*, and there are six inbound forms, none of which is a function. A
   formatter is inbound and it *returns* — the component calls it and uses the result.
2. **The reader currently misreads it, and the gate would agree with the misreading.**
   `classify('(value: number) => string')` returns `{ form: 'event', payload: 'number' }` today,
   because the arrow branch never looks at the return type. So a B4 contract could declare
   `valueFormatter` as an event with payload `number`, both layers would match, and
   `check:api` would report a green contract for a member that is not in the vocabulary at all.
   This is a form-level version of exactly the silent agreement `api/README.md` already warns
   about for R2 — and unlike R2 it is fixable, because a return type is visible in a
   declaration.
3. **Whatever the reshape, the reader tightening is safe and should land here.** All three
   in-vocabulary reshapes below remove the member, and no currently-contracted component
   declares a non-`void` arrow (`Breadcrumbs.onNavigate` is `(crumb: Crumb) => void`), so
   tightening `classify()` breaks nothing today and makes the wrong answer impossible tomorrow.

**Measured, and it decides more than it looks:** every `valueFormatter` in the repository —
every demo, every prompt sample, both layers — is a **unit suffix**.

```
charts.card.entry.jsx:18   (v) => v + ' ms'
charts.card.entry.jsx:21   (v) => v + ' rps'
charts.card.entry.jsx:30   (v) => v + '%'
BarChart.prompt.md:12      (v) => `${v} builds`
LineChart.prompt.md:8,12   (v) => `${v} ms`, (v) => `${v}%`
DoughnutChart.prompt.md:6  (v) => `${v} rps`
```

Not one call site formats the number itself. Six of six append a unit.

**Reshape A — delete the member; the chart renders `String(value)`**

- Both layers drop `valueFormatter`. The axis ticks, the tooltip and the accessible `<table>`
  all carry a bare number.
- **Cost:** a chart of milliseconds and a chart of requests-per-second become indistinguishable
  to a screen-reader user reading the data table — and that table is `figure-with-data-table`'s
  whole reason for existing. `CLAUDE.md` already records that a chart's `aria-label` falls back
  to its type; this would remove the last thing carrying the unit. Not recommended, recorded so
  the floor is visible.

**Reshape B — replace it with an Arena enum `valueFormat`**

- `valueFormat?: ValueFormat` where `ValueFormat` is a closed set — e.g.
  `'plain' | 'compact' | 'percent' | 'currency'`. Squarely inside the vocabulary; one new
  `api/types/value-format.json`.
- **Cost:** Arena has to implement each value in both layers *identically*, and nothing checks
  that it does — a formatter is behaviour, and `check:api` says nothing about behaviour.
  `'currency'` drags in locale and symbol, which is a product decision, not a transcription. And
  it covers **none** of the six real call sites: not one of them wants compact, percent or
  currency; they want ` ms`, ` rps`, `%` and ` builds`.

**Reshape C — replace it with a primitive `valueSuffix` (and, if wanted, `valuePrefix`)**

- `valueSuffix?: string`, appended by Arena to every rendered number — tick, tooltip and table
  alike, which is what the current formatter does. `<BarChart … valueSuffix=" ms" />`.
- **Cost:** it cannot do thousands separators, currency, or per-value logic. A consumer who
  needs `1,284` has to preformat, and values are numbers the chart plots, so they cannot.
- **Gains:** it covers **six of the six** call sites in the tree exactly, it is one primitive
  with no new type, no new machinery and no new behaviour to keep in step across layers, and
  Arena keeps owning the number's rendering, which is what R2 wants for content Arena draws.

**`ThemeToggle.label` is the same form and a separate answer.** Its own options are: delete it
(Angular already computes both strings and has no member at all — the contract becomes empty),
or replace it with two primitives (`labelDark`, `labelLight`). **That choice belongs to
`ThemeToggle`'s own audit in B1**; what this task settles is only the rule that makes the
function form illegal. Say so in the exchange so nothing is decided twice.

**Recommendation to weigh, not to assume:** C, because it is the only option measured against
what the tree actually passes, and it is the only one that adds no behaviour for two layers to
keep in step. B is the answer if Arena should own number formatting as a design decision — which
is a real position, and a bigger one than this member.

**Question for the maintainer:** A, B or C for the charts — and do you agree that `classify()`
should refuse a non-`void` arrow regardless of which one wins?

- [ ] **Step 2: Write the failing test**

Add to `scripts/api-surface.test.mjs`, immediately after the existing
*"a function type is an event, and its single parameter is the payload"* test:

```js
test('an inbound function that RETURNS a value is refused -- no form in the vocabulary is one', () => {
  /* `event` is the only outbound form and it is a name plus a payload; the six
   * inbound forms are all data. A formatter -- `(value: number) => string`, which
   * BarChart, LineChart, DoughnutChart and ThemeToggle all declared before plan
   * 8B0 -- is inbound AND returns, so it is none of the seven. Before this rule
   * classify() read it as an event with payload `number`, which would have let a
   * contract declare it, both layers match it, and check:api report it green. */
  assert.throws(() => classify('(value: number) => string'), UnrecognisedShape);
  assert.throws(() => classify('(isDark: boolean) => string'), UnrecognisedShape);
  assert.throws(() => classify('() => string'), UnrecognisedShape);
});

test('an event still reads as an event -- the rule is the return type, not the arrow', () => {
  assert.deepEqual(classify('(crumb: Crumb) => void'), { form: 'event', payload: 'Crumb' });
  assert.deepEqual(classify('() => void'), { form: 'event', payload: null });
});
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `bun test scripts/api-surface.test.mjs`
Expected: FAIL on the first new test — `classify('(value: number) => string')` returns
`{ form: 'event', payload: 'number' }` instead of throwing.

- [ ] **Step 4: Tighten `classify`'s arrow branch**

In `scripts/lib/api-surface.mjs`, replace the arrow branch's opening lines. It currently reads:

```js
  const arrow = /^\(([\s\S]*)\)\s*=>\s*[\s\S]+$/.exec(ts);
  if (arrow) {
    const params = arrow[1].trim();
```

Change it to capture and judge the return type:

```js
  const arrow = /^\(([\s\S]*)\)\s*=>\s*([\s\S]+)$/.exec(ts);
  if (arrow) {
    /* An arrow is an EVENT only if it returns void. `event` is the vocabulary's
     * one outbound form -- a name plus a payload -- and the six inbound forms
     * are all data; an inbound function that RETURNS a value is none of the
     * seven. Judging the arrow by its parameter alone read
     * `(value: number) => string` as an event with payload `number`, which
     * would have let a contract declare a formatter, both layers agree with it,
     * and check:api call it green. The return type is right there in the
     * declaration, so this is one of the few vocabulary edges the reader can
     * actually hold. See api/README.md, "The vocabulary: seven forms". */
    const returns = arrow[2].trim();
    if (returns !== 'void') {
      throw new UnrecognisedShape(
        `an inbound function that returns "${returns}" is none of the seven forms — `
        + `only an event (returning void) is a function member: ${ts}`,
      );
    }
    const params = arrow[1].trim();
```

The rest of the branch is unchanged.

- [ ] **Step 5: Run the tests, and prove nothing else regressed**

Run: `bun test scripts/api-surface.test.mjs scripts/check-api.test.mjs && bun run check:api`
Expected: all PASS; `check:api` still `3 contract(s) hold across 6 layer implementation(s)`.

Run: `node --test scripts/api-surface.test.mjs`
Expected: PASS, same count — the reader stays runnable under plain node.

- [ ] **Step 6: Record the rule in `api/README.md`**

In the *"The vocabulary: seven forms"* section, immediately after the paragraph that begins
*"Six of the seven are inbound; **event** is the only outbound one."* (`api/README.md:30`, which
runs on to the two array forms — insert after the whole paragraph, not inside it), add:

```markdown
**An inbound function is none of the seven.** `event` is the only function-shaped member, it is
outbound, and it returns nothing. A member the component *calls* and whose result it uses — a
formatter, a label producer — has no form here, and `classify()` in
`scripts/lib/api-surface.mjs` refuses one rather than reading it as an event with the parameter
as its payload. Where such a member existed it was replaced by data the component renders
itself: the charts' `valueFormatter` became a primitive suffix Arena appends.
```

Adjust the last sentence to name whatever Reshape won.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/api-surface.mjs scripts/api-surface.test.mjs api/README.md
git commit -m "feat(api): the reader refuses an inbound function that returns a value"
```

---

## Task 5: An enum whose literals are numbers

**Not in the spec — found by running the generator against what the charts declare.** Blocks
`BarChart`, `LineChart`, `DoughnutChart` (B4).

**Files:**
- Modify: `scripts/build-api-types.mjs`, `scripts/build-api-types.test.mjs`
- Modify: `scripts/lib/api-surface.mjs`, `scripts/api-surface.test.mjs`
- Modify: `scripts/check-api.mjs`, `scripts/check-api.test.mjs`
- Modify: `api/README.md`

**Interfaces:**
- Consumes: the enum form (*"a closed, named set of literals"*).
- Produces: `enumLiteral()` exported from `scripts/build-api-types.mjs`; a numeric branch in
  `classify()`; a mixed-literal rule in `validateTypes()`. B4 declares `api/types/cat-slot.json`
  against them.

- [ ] **Step 1: Present the audit and STOP**

**Current state, measured**

| | React | Angular |
|---|---|---|
| `BarChart.slot` | `CatSlot`, where `export type CatSlot = 1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 7 \| 8` | `input<number>()` |
| `BarChart.slots`, `DoughnutChart.slots` | `CatSlot[]` | `input<number[]>()` |
| `LineChart.slot` | inherited | `input<number>()` |

Call sites, all of them: `slots={[1,2,3,4]}`, `slot={5}` in `charts.card.entry.jsx`;
`[slot]="1"`, `[slot]="3"`, `[slots]="[3, 1, 5]"` in the three Angular prompts;
`slot={5}`, `slots={[1,2,3]}` in three React prompts. Every one is a bare integer.

**What breaks what**

1. **A divergence, no rule.** React constrains the slot to eight values at compile time; Angular
   does not constrain it at all. `CLAUDE.md`'s charts rule — *"the `--color-cat-*` ramp, in
   order, never cycled"* — is a real invariant, and React's type is the only thing holding it.
2. **The generator cannot emit a numeric enum today.** `scripts/build-api-types.mjs` renders every
   enum value as `` `'${v}'` ``, so `values: [1,2,3]` would emit `'1' | '2' | '3'` — a string
   union that no call site satisfies and `ngc` would reject. This is a generator limit, not a
   vocabulary one: the form is *"a closed, named set of literals"*, and a number is a literal.
3. **The reader has a matching gap, and it is latent rather than live.** `classify()`'s union
   branch reads an enum only when every part is `'quoted'`. A layer spelling a numeric enum
   *inline* (`1 | 2 | 3`) would classify as `{ form: 'union' }` and be reported as an R5
   violation. No layer does that today — both spell it as a named type — but `Skeleton.variant`
   and `Avatar.size` prove the inline spelling is normal in this tree, so the gap will be
   reached the first time someone writes one.

**Reshape A — declare a numeric enum; teach the generator and the reader**

- `api/types/cat-slot.json` declares `"values": [1,2,3,4,5,6,7,8]`. `enumLiteral()` emits a number
  unquoted and a string quoted. `classify()` reads an all-numeric union as an enum with numeric
  values. `validateTypes()` refuses an enum mixing string and number literals — that mixture is
  a union between two kinds of literal and belongs to no single form.
- Angular narrows `slot = input<number>()` to `input<CatSlot>()` (B4's work, not this task's).
- **Cost:** three scripts and three test files, all in the machinery layer where a test is cheap.
- **Gains:** the invariant becomes a type on both sides; no call site changes anywhere; nothing
  in the vocabulary moves — the form already said "literals".

**Reshape B — the slot is a plain `number` on both sides**

- React drops `CatSlot` entirely; both layers say `number`; the eight-slot invariant lives in
  prose plus a runtime clamp.
- **Cost:** React loses compile-time safety it has today, and the one machine-held statement of
  `CLAUDE.md`'s ramp rule disappears. `slot={9}` compiles.
- **Gains:** no machinery at all; the two layers agree immediately.

**Reshape C — the slot is a *string* enum, `'cat-1' … 'cat-8'`**

- Fits the vocabulary and the generator exactly as they stand. No script changes.
- **Cost:** every call site in the repository changes (`slot={5}` → `slot="cat-5"`), and the
  value stops being an index into the ramp — `slots={[1,2,3,4]}` reads as an order today, and
  `['cat-1','cat-2','cat-3','cat-4']` reads as a list of names. It also puts the token name into
  the API surface, which is the one place the design layer's naming has so far stayed out of.

**Recommendation to weigh, not to assume:** A. It is the only option that keeps the invariant
machine-held *and* leaves every call site alone, and the cost is confined to the machinery layer
where it is testable. C's real objection is not the churn but that it leaks a token name into
the contract.

**Question for the maintainer:** A, B or C?

- [ ] **Step 2: Write the failing tests**

Add to `scripts/build-api-types.test.mjs`:

```js
test('an enum of numeric literals emits them unquoted -- a number is a literal', () => {
  const out = renderApiModule([{ name: 'CatSlot', kind: 'enum', values: [1, 2, 3] }]);
  assert.match(out, /export type CatSlot = 1 \| 2 \| 3;/);
});

test('a string enum is unchanged by the numeric branch', () => {
  const out = renderApiModule([{ name: 'Direction', kind: 'enum', values: ['up', 'down'] }]);
  assert.match(out, /export type Direction = 'up' \| 'down';/);
});

test('a literal that is neither a string nor a number is refused rather than emitted', () => {
  assert.throws(() => enumLiteral(true), /neither a string nor a number/);
  assert.throws(() => enumLiteral(null), /neither a string nor a number/);
});
```

and extend that file's import to `import { renderApiModule, docComment, fieldType, enumLiteral, API_TARGETS, buildApiModules } from './build-api-types.mjs';`.

Add to `scripts/api-surface.test.mjs`:

```js
test('an all-numeric literal union is an enum, with its values as numbers', () => {
  assert.deepEqual(classify('1 | 2 | 3'), { form: 'enum', values: [1, 2, 3] });
});

test('a union mixing a number and a string literal stays a union -- R5', () => {
  assert.equal(classify("1 | 'two'").form, 'union');
});
```

Add to `scripts/check-api.test.mjs`:

```js
test('an enum mixing string and numeric literals is refused -- one closed set, one kind of literal', () => {
  const problems = validateTypes([{ name: 'Mixed', kind: 'enum', values: [1, 'two'] }]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Mixed/);
  assert.match(problems[0], /literal/);
});
```

- [ ] **Step 3: Run them to make sure they fail**

Run: `bun test scripts/build-api-types.test.mjs scripts/api-surface.test.mjs scripts/check-api.test.mjs`
Expected: FAIL — `enumLiteral is not a function`; the numeric union classifies as `union`; the
mixed enum produces no problem.

- [ ] **Step 4: Teach the generator**

In `scripts/build-api-types.mjs`, add beside `fieldType`:

```js
/** One enum value, as a TypeScript literal. The form is "a closed, named set of
 *  literals", and a number is a literal -- `CatSlot = 1 | ... | 8` is the ramp
 *  slot, and quoting it would emit a string union no call site satisfies and
 *  ngc would reject. Anything that is neither is refused here rather than
 *  emitted and diagnosed downstream. */
export function enumLiteral(value) {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `'${value}'`;
  throw new Error(`enumLiteral: ${JSON.stringify(value)} is neither a string nor a number — an enum is a closed set of literals`);
}
```

and in `renderApiModule`, replace the enum line:

```js
      out.push(`export type ${type.name} = ${type.values.map(enumLiteral).join(' | ')};`);
```

- [ ] **Step 5: Teach the reader**

In `scripts/lib/api-surface.mjs`, inside `classify`'s union branch, add the numeric case beside
the string one:

```js
  if (ts.includes('|')) {
    const parts = ts.split('|').map((p) => p.trim());
    if (parts.every((p) => /^'[^']*'$/.test(p))) {
      return { form: 'enum', values: parts.map((p) => p.slice(1, -1)) };
    }
    /* The numeric twin of the branch above. An enum is a closed set of
     * LITERALS, and a number is one -- CatSlot is `1 | ... | 8`. Values come
     * back as numbers, not as their source text, so compareSurface's value-set
     * comparison matches an api/types/ declaration whose JSON holds numbers.
     * A union MIXING the two kinds falls through to `union` on purpose: two
     * kinds of literal in one member is R5's own shape. */
    if (parts.every((p) => /^-?\d+(\.\d+)?$/.test(p))) {
      return { form: 'enum', values: parts.map(Number) };
    }
    return { form: 'union', parts };
  }
```

- [ ] **Step 6: Teach the gate's type validator**

In `scripts/check-api.mjs`, inside `validateTypes`, replace the enum branch:

```js
    if (type.kind === 'enum') {
      if (!Array.isArray(type.values) || !type.values.length) {
        problems.push(`${type.name}: an enum is a closed set and this declares no values`);
        continue;
      }
      /* One closed set, one kind of literal. A string and a number in the same
       * enum is two forms in one member, which is R5's own shape one level
       * down -- and it would emit `'a' | 1`, which no layer's declaration can
       * be compared against as a single set. */
      const kinds = new Set(type.values.map((v) => typeof v));
      if (kinds.size > 1 || (!kinds.has('string') && !kinds.has('number'))) {
        problems.push(`${type.name}: an enum's values must all be one kind of literal — string or number, not [${[...kinds].join(', ')}]`);
      }
      continue;
    }
```

- [ ] **Step 7: Run everything**

Run: `bun test scripts/build-api-types.test.mjs scripts/api-surface.test.mjs scripts/check-api.test.mjs`
Expected: PASS.

Run: `bun run build:api && git diff --stat frameworks/react/api.generated.d.ts frameworks/angular/api.generated.ts`
Expected: **no diff.** Every enum declared today is a string enum, so `enumLiteral` reproduces the
committed output byte for byte. A diff here means the refactor changed existing output, which it
must not.

Run: `bun run check:api && node --test scripts/api-surface.test.mjs`
Expected: PASS; `3 contract(s) hold across 6 layer implementation(s)`.

- [ ] **Step 8: Record it in `api/README.md`**

In the *"## Types"* section (`api/README.md:164`), after the `Tone` example block and before the
paragraph beginning *"A `description` on a type…"*, add:

```markdown
An enum's values are **literals of one kind** — all strings, or all numbers. A numeric enum is
how the charts' ramp slot is declared (`CatSlot`, `1 | … | 8`): the slot is an index into
`--color-cat-*`, in order and never cycled, and a string spelling would put a token name in the
API surface. `check:api` refuses an enum mixing the two, because two kinds of literal in one
member is R5's shape one level down.
```

- [ ] **Step 9: Commit**

```bash
git add scripts/build-api-types.mjs scripts/build-api-types.test.mjs \
  scripts/lib/api-surface.mjs scripts/api-surface.test.mjs \
  scripts/check-api.mjs scripts/check-api.test.mjs api/README.md
git commit -m "feat(api): an enum's literals may be numbers"
```

---

## Task 6: The `COVERED` dual-layer claim is already false

Found while measuring this plan's subjects, not sought. It is in scope because four of the six
`COVERED` entries are Plan B subjects, and B1–B4 will change their rendered DOM.

**Files:**
- Modify: `CLAUDE.md` (*Known debt*)
- Modify (only if the maintainer chooses the fix): `scripts/check-compliance.mjs`,
  `scripts/check-compliance.test.mjs`

**Interfaces:**
- Consumes: `COVERED` and `validateCoverage()` in `scripts/check-compliance.mjs`.
- Produces: either a corrected debt entry, or a compound `<component>:<layer>` key. B1–B4's
  `ConfirmDialog`, `Skeleton`, `Alert` and `BarChart` migrations depend on which.

- [ ] **Step 1: Present the finding and STOP**

`CLAUDE.md`'s *Known debt* says, of `check:compliance`:

> **A component bound in both layers is satisfied by either layer's suite**: `COVERED` maps a
> component name to one suite file, so the day a dual-bound component's entry points at (say)
> the React suite, the Angular contract goes unverified while the claim reads satisfied.
> **No `COVERED` entry is dual-layer today, so this is latent, not live** — the fix is a compound
> `<component>:<layer>` key, and it must be made before a dual-bound component is added to
> `COVERED`.

Measured against the tree:

| `COVERED` entry | Suite it names | Layer that suite is in | React binding | Angular binding |
|---|---|---|---|---|
| `Dialog` | `dialog-modal.test.jsx` | React | yes | — |
| `Menu` | `placement-and-branches.test.jsx` | React | yes | — |
| `ConfirmDialog` | `dialog-modal.test.jsx` | React | yes | **yes** |
| `Skeleton` | `placement-and-branches.test.jsx` | React | yes | **yes** |
| `Alert` | `alert-role-tones.test.ts` | Angular | **yes** | yes |
| `BarChart` | `chart-data-table.test.ts` | Angular | **yes** | yes |

**Four of the six are dual-bound.** The claim "no `COVERED` entry is dual-layer today" is false,
and the condition the debt sets — *"the fix must be made before a dual-bound component is added
to `COVERED`"* — was already missed when it was written. Today: React's `Alert` and `BarChart`
bindings and Angular's `ConfirmDialog` and `Skeleton` bindings are unverified while
`check:compliance` reports them satisfied.

**Reshape A — correct the record, do not change the gate**

- Rewrite the debt bullet to say the hole is live, name the four, and say which layer goes
  unverified for each.
- **Cost:** the hole stays open, and B1–B4 migrate all four components with the gate reporting a
  coverage claim that is half true. **Gains:** one line; no gate change inside a plan whose
  subject is a different contract layer.

**Reshape B — fix it: compound `<component>:<layer>` keys**

- `COVERED` becomes `{ 'ConfirmDialog:react': 'dialog-modal.test.jsx', … }`;
  `validateCoverage()` splits the key and resolves the binding for that layer only; the four
  dual-bound entries each declare the one layer they actually verify, and the other layer
  becomes visibly uncovered — which is honest and is what the record is for.
- **Cost:** a gate change plus its tests, inside a plan about the API contract. **Gains:** the
  stale-claim rule the whole compliance layer is built on starts holding for these six, and
  B1–B4 can add an entry per layer as they write render tests.

**Question for the maintainer:** A or B — and if B, does it stay in this plan or become its own?

- [ ] **Step 2: Correct the debt entry (Reshape A)**

In `CLAUDE.md`, in the bullet beginning *"**Compliance coverage is 6 of 64 bindings…**"*, replace
the final sentence — *"No `COVERED` entry is dual-layer today, so this is latent, not live — the
fix is a compound `<component>:<layer>` key, and it must be made before a dual-bound component is
added to `COVERED`."* — with:

```markdown
  **This is live, not latent, and has been since the entries were written.** Four of the six —
  `ConfirmDialog`, `Skeleton`, `Alert` and `BarChart` — are bound in *both* layers, and each
  entry names one suite: `ConfirmDialog` and `Skeleton` point at React suites, so their Angular
  bindings go unverified; `Alert` and `BarChart` point at Angular suites, so their React
  bindings do. `check:compliance` reports all six satisfied. The fix is a compound
  `<component>:<layer>` key in `COVERED`, splitting each dual-bound entry into the layer it
  really verifies and leaving the other visibly uncovered.
```

> **If Reshape B won instead**, this step is the gate change and its tests, and the debt bullet
> loses the whole paragraph rather than gaining a correction.

- [ ] **Step 3: Verify**

Run: `bun run check:compliance`
Expected: PASS, unchanged — Reshape A edits prose only, and this run proves the edit did not
stray into the script.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(debt): COVERED's dual-layer hole is live, and four entries are in it"
```

---

## Task 7: Close the plan out

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` (Plan E's running-count
  table)

**Interfaces:**
- Consumes: everything Tasks 1–6 landed.
- Produces: the baseline B1 measures itself against, and the row Plan E's restore check
  compares to.

- [ ] **Step 1: Count the suite**

Run: `bun test scripts frameworks/react/test/ frameworks/angular/test 2>&1 | tail -3`
Record the exact `Ran N tests across M files` line. It was **856 across 68** before this plan.

Run: `bun test frameworks/react/test-dom 2>&1 | tail -3`
Expected: **26 across 5**, unchanged — this plan adds no DOM test.

- [ ] **Step 2: Add the row to Plan E's running-count table**

In `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`, under
*"## The running count"*, append after the Plan A row:

```markdown
| **Plan B0** (2026-07-23) | **<N> across <M> files** | 26 across 5 files |
```

with the measured values, and add one sentence below the table accounting for the delta —
which tests, in which file, from which task. The spec says plainly that a plan which cannot
account for its own delta is the thing the table exists to catch.

- [ ] **Step 3: Write the CHANGELOG entry**

Under `## [Unreleased]` → `### Changed`, add one entry naming what actually landed. Write it from
the decisions taken, not from this plan's options; a template:

```markdown
- **The API contract layer's five cross-cutting conventions are settled.** An Angular projection
  selector is now the contract member's own name (`[action]`, `[actions]`), so a slot's member
  name and its selector are the same string in every primitive and `api/README.md`'s binding
  table needs no special case. A single icon is <the decision>; a field inside an array of
  predefined objects is <the decision>. Two limits the reader could not see are closed:
  `classify()` refuses an inbound function that returns a value — the shape the charts'
  `valueFormatter` had, which it previously read as an event and a contract could have declared
  — and an enum's literals may now be numbers, so the charts' ramp slot can be a real closed set
  on both sides instead of `number`. **Breaking for an Angular consumer:** an element projected
  into an `EmptyState`, `ErrorState`, `ChartCard` or `PageHead` action slot carries `action` /
  `actions` instead of `arena-action` / `arena-actions`; the old attribute is inert and the
  content silently fails to project.
```

- [ ] **Step 4: Run the full check once**

Run: `bun run check`
Expected: every step PASS. `check:cards`, `check:vendor` and `check:demos` may report SKIP under
plain node or without a browser — under `bun` on a machine with Chromium they must PASS, and the
run must not report INCOMPLETE. If it does, that is the answer, not a caveat to write down.

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md docs/superpowers/specs/2026-07-23-8-api-contracts-design.md
git commit -m "docs: record plan 8B0's decisions and its test delta"
```

---

## What B1 through B4 inherit

Stated here so the next plan's author does not re-derive it, and so this document can be
deleted without losing it. Every one of these is already written into a durable file by the
tasks above — this list is a map, not a second copy.

| Decision | Durable home | Plans that consume it |
|---|---|---|
| Slot selector = member name | `projection-markers.ts` header; `api/README.md` binding table | B2, and every Plan D primitive |
| The single-icon idiom | `api/README.md`, *Conventions the audits settled* | B1 (`StatCard` revision, if any), B2 |
| A per-item field is a primitive | `api/README.md`, same section | B3 |
| An inbound function is no form | `api/README.md`; `classify()` throws | B1 (`ThemeToggle`), B4 |
| A token-derived closed numeric set is a bare `number`, not an enum | `api/README.md`, *Types* | B4 |
| `COVERED` is keyed `<component>:<layer>` | `scripts/check-compliance.mjs`; `CLAUDE.md` *Known debt* | B1 (`ConfirmDialog`, `Skeleton`), B2 (`Alert`), B4 (`BarChart`) |

> **Two rows above changed from the plan-as-written, and B4's author must not miss it.** Task 5
> chose Reshape B (a bare `number`), *not* the plan's recommended A, so **no numeric-enum
> machinery was built**: `enumLiteral()` does not exist, `classify()` gained no numeric branch,
> `validateTypes()` gained no mixed-literal rule. B4 needs none — the ramp `slot` is a `number`
> the reader already reads, and `SeriesTone`/`ArenaChartTone` are *string* enums the generator
> already emits. And Task 6 chose to fix `COVERED` rather than only record the hole, so the
> compound key already exists; B1 and B4 add a per-layer entry as they write render tests, they
> do not build the mechanism.

**The batches, and why each is a batch:**

- **B1 — Avatar, ConfirmDialog, Skeleton, Tag, ThemeToggle.** The five with no cross-cutting
  coupling left after this plan. `Tag` is the hard one: React's is `extends React.HTMLAttributes`
  plus `onRemove` and nothing else, Angular's is `tone` plus a default slot — two different
  components sharing a name. `Skeleton` carries the tree's other R5 unions (`width`/`height` are
  `number | string`) and three members Angular does not have at all.
- **B2 — Alert, ChartCard, EmptyState, ErrorState, PageHead, UnauthCard.** The composition
  surfaces: everything gated on Tasks 1 and 2. `UnauthCard` is where R2 decides four slots
  against two primitives, the same question `AppLogo`'s `name`/`dim` answered in Plan A.
- **B3 — ActivityFeed, BulkActionBar, CommandPalette, Onboarding.** The item-list surfaces,
  gated on Task 3, plus `Onboarding.anchorRect` (an R4 platform type in Angular and an R4+R5
  union in React) and the per-item callbacks `Breadcrumbs` already set the precedent for.
- **B4 — BarChart, LineChart, DoughnutChart.** Gated on Tasks 4 and 5, and the layer's declared
  styling exception: no manifest, no `.variants.ts`, reviewed against React's `charts.card.html`.
  `LineChartProps extends Omit<BarChartProps, 'slots'>`, which the gate reports as the `{...rest}`
  escape, so its surface must be flattened before it can be contracted at all.
