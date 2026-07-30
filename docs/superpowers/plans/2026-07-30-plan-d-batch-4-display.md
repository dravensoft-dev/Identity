# Plan D — Batch 4: display (`Badge`, `Card`, `Table`/`TableRow`/`TableCell`)

## Context

Plan D gives Angular a real Arena primitive for every control it delegates to Material, so all
three contracts (design, behaviour, API) reach the layer and `@angular/material` can eventually
leave the tree. Batches 1–3 landed the CDK foundation, the form controls and the choice/navigation
controls; they are merged to `main` at `26a86c2`. Batch 4 is the `display` group.

Measured on this tree today: **33** Angular primitives, **17** delegated entries, `bun run check`
is **29 steps, all green**, `CLAUDE.md` is **59,946** characters (54 of margin).

This batch is different from batch 3 in three ways, and each is a task rather than a note:

1. **`Table` is the worst-behaved declaration in the repo.** Its delegated entry binds `grid` with
   **eight** exceptions — four roles (`MatTable` renders `role="table"`) and four keyboard/focus
   (Material's own docs: changing the role *"does not add keyboard input handling or focus
   management"*). React's `Table` binds the `wide` case to `grid` with `"exceptions": []`. A real
   primitive **clears all eight**; it does not port them.
2. **`responsive` is a contracted member**, so the card shape below `--bp-md` is not optional, and
   it must be measured on the **container** (`ContainerSize.ts`), never the viewport and never a
   media query.
3. **There is dressing to retire**, unlike Pagination: `.mat-mdc-card`, `.mat-mdc-table` and
   `.mat-mdc-header-cell` are cited by this batch's entries and by no other (verified by reading
   every `dressedBy` and every prose citation in `BehaviourDelegated.json`). `Badge` is *not*
   dressed — no `.mat-badge-content` rule exists — and its entry already says so.

---

## The decision that shapes three of the five components

**Angular cannot render two `<ng-content>` with the same selector.** `ɵɵprojectionDef` indexes the
slots in template order and `matchingProjectionSlotIndex` returns the **first** match, so a second
bare `<ng-content/>` receives nothing. A `wide` branch and a `card` branch each carrying their own
`<ng-content/>` would leave one of the two shapes permanently empty. The same applies to the
`empty` slot.

**Resolved (approved): `arena-table` renders a role-based grid on `display:table` boxes, not a
`<table>` element.** One `<ng-content/>`, always rendered; the shape switches by swapping classes,
roles and attributes on elements that already exist. This also means **all five roots are
host-bound** — no carve-out, no `display: contents` inside table internals.

What is lost is smaller than it looks: React already puts `role="grid"` on its `<table>`, so the
native table role was **already** being overridden in both layers. What is lost is `colspan` for the
empty row (replaced by a full-width box) and DOM shape parity with React — a real divergence, and
it gets its own `DOUBTS.md` entry rather than being left implicit.

---

## Task 1 — `arena-badge`

`frameworks/angular/components/display/badge/`

- `Badge.ts` — host-bound root, `readonly tone = input<Tone>('neutral')`,
  `readonly dot = input(false, { transform: booleanAttribute })`, template
  `@if (dot()) { <span [class]="styles().dot()"></span> } <ng-content />`.
- `Badge.variants.ts` — `tv(Badge.manifest)`. The manifest already exists and its `root` carries
  `inline-flex`, so `HostClassBinding.test.ts` is satisfied with no `HOST_SLOT` entry.
- `Badge.behaviour.json` — `{ "component": "Badge", "pattern": "none", "reason": …,
  "exceptions": [] }`, mirroring React's reason (a chip a user can read and cannot act on).
- `Badge.compliance.test.ts` + `Badge.variants.test.ts`, in the component's own directory.
- `index.ts` barrel; delete the `Badge` entry from `BehaviourDelegated.json`.
- `Badge.prompt.md`.

Reference shape: `components/display/tag/` (the closest existing display primitive) and
`components/navigation/pagination/` for the simple-primitive quartet.

## Task 2 — `arena-card`

`frameworks/angular/components/display/card/`

- `Card.ts` — host-bound root. Members: `title`, `eyebrow` (`input<string>()`), `floating`,
  `accent` (`input(false, { transform: booleanAttribute })`), slots `content` (bare `<ng-content/>`)
  and `action` (`<ng-content select="[action]"/>` — `ArenaAction` already exists in
  `ProjectionMarkers.ts`). Header block renders only when `title() || eyebrow() || action()`, the
  same guard React applies; `action()` comes from `contentChild(ArenaAction)`, the `PageHead`
  idiom.
- **`Card.manifest.json` needs one change**: its `root` slot carries no display utility, and
  `HostClassBinding.test.ts` reads every primitive's `slots.root` regardless of whether it is
  host-bound. Add `block`. (This is a latent hole in the manifest, not a workaround: an
  `<arena-card>` with no display utility renders a zero-area host.)
- Binding `none` + reason; `Card.compliance.test.ts`, `Card.variants.test.ts`, `index.ts`,
  `Card.prompt.md`; delete the delegated entry.
- **Retire the `.mat-mdc-card` block from `arena-material.css`** in this commit — no other
  delegated entry cites it.

## Task 3 — the `Table` family (one commit; the three cannot land apart)

`components/display/table/`, `table-row/`, `table-cell/`. They land together because
`Table.cases.test.ts` cannot render a grid without rows and cells, and `check:behaviour` fails a
delegated entry whose primitive exists.

### Shape

```
<arena-table [class]="styles().root()"           ← host-bound; block w-full in card,
             [attr.role]="narrow() ? null : 'grid'"   table w-full + frame in wide
             [attr.aria-label]="narrow() ? null : gridLabel()"
             (keydown)="onKeydown($event)" (focusin)=… (focusout)=…>
  @if (!narrow()) {
    <div role="row" [class]="styles().headRow()">
      @for (column of columns(); track $index) {
        <div role="columnheader" [class]="headerClass(column)" [attr.tabindex]=…
             [style.width]="column.width">{{ column.header }}</div>
      }
    </div>
  }
  <ng-content />                                  ← exactly once, always rendered
  @if (rows().length === 0) { …<ng-content select="[empty]"/>… }   ← exactly once
</arena-table>

<arena-table-row  [class]="styles().row(…)"  [attr.role]=…>  host-bound
<arena-table-cell [class]="styles().cell(…)" [attr.role]=…>  host-bound
```

### Coordination — the state objects

`check:api` reads the real class and only understands `readonly x = input/output(...)` and
`<ng-content>`; **any other public member throws `UnrecognisedShape` and fails the gate.** So the
coordination lives on provided services, as `TabsState.ts` and `RadioGroupState.ts` already
establish, and every component field that touches it is `protected` or `private`.

- **`TableState.ts`** (provided by `Table`): `columns`, `narrow`, `cursor` (`{row, col}`),
  `gridFocused`, `rowIndexOf(row: object)`, `registerRow(row: object, cells: Signal<number>)`,
  and `lengths` — `[columns().length, ...rows().map(r => count(r)())]`. Registration is by
  instance into a plain `Map`; the **order** comes from `Table`'s own `contentChildren(TableRow)`,
  so nothing depends on construction order, and the inner signal reads keep the `computed`
  reactive.
- **`TableRowState.ts`** (provided by `TableRow`): the row's own index and `columnIndexOf(cell)`,
  from the row's `contentChildren(TableCell)`.
- Neither state file imports a component, so there is no cycle: `Table.ts → TableRow.ts →
  TableCell.ts`, each importing the state modules only.

### Keyboard — hand-written, not `cdk/a11y`

The CDK has no two-dimensional grid manager (`ListKeyManager` is 1-D), so `Table` implements
React's cursor algorithm: Arrow keys clamp at the edges, `Home`/`End` clamp to the current row's
real length, `Enter` activates the row. **Consequence worth stating: because no CDK key manager is
involved, the `keyCode` trap does not apply here** — happy-dom leaves `keyCode` at `0` and the CDK
switches on it, but nothing in this component reads it. Focus follows the cursor from an
`afterRenderEffect` that focuses the single cell carrying `tabindex="0"`.

### `label` is required *and* guarded at runtime

`input.required` proves only that something was bound. Follow the idiom batch 3 established across
`Pagination`, `Breadcrumbs`, `ActivityFeed` and `RadioGroup`: a `computed` that `trim()`s and
throws, read from the place the template already reads it (`[attr.aria-label]`), so it fires on the
first change detection. `columns` gets **no** extra guard — `Table.json` attaches the
"guarded at runtime" phrase to `label` alone, and inventing a second guard would diverge from
React for no contracted reason.

### Bindings — mirrored case-for-case

`crossLayerAgrees` compares the **case names and their patterns**, so these must match React
exactly or carry a `divergesFrom`. Both existing `divergesFrom` fields disappear:

- `Table.behaviour.json` — `wide` → `grid` `"exceptions": []`; `card` → `none` with a reason.
  **All eight Material exceptions are gone.**
- `TableRow.behaviour.json` — `row` → `none`, `card-interactive` → `button`, `card-inert` → `none`.
- `TableCell.behaviour.json` — flat `none`.

### Manifest changes (`Table.manifest.json`)

It already carries the card-mode slots (`cards`, `card`, `cardRow`, `cardLabel`, `cardValue`,
`cardBlock`), which is most of the work. What it needs:

- a display utility on `root` (it is `w-full` today), plus a `narrow` variant flipping the root
  between the wide frame (`table`, border, radius, `overflow-hidden`, `border-separate
  border-spacing-0` so the radius clips cleanly) and `flex flex-col gap-4`;
- `table-row` / `table-cell` display utilities on the `row` / `td` / `th` slots, since those
  classes now land on `<arena-table-row>` / `<arena-table-cell>` hosts, which default to
  `display: inline`;
- **before compiling, read the whole file for boolean `defaultVariants` written as the strings
  `"true"`/`"false"`** — the delegated components' manifests have never been driven through `tv()`,
  and that is the class of bug each batch surfaces. (`Card`'s are real booleans and are fine;
  `Table` has no `defaultVariants` today.)

### `HOST_SLOT` — the trap a grep does not find

`table-row` and `table-cell` have **no manifest of their own**; they share `Table.manifest.json`.
`HostClassBinding.test.ts` resolves `<Pascal>.manifest.json` by default and will fail with *"no
manifest named TableRow.manifest.json found"*. Both need entries:

```ts
'table-row':  { manifest: 'Table.manifest.json', slot: 'row' },
'table-cell': { manifest: 'Table.manifest.json', slot: 'td'  },
```

That assertion is **bidirectional**: if a `TableRow.manifest.json` is ever created, the entry
becomes stale and the gate fails. Say so in the entry's own vicinity.

### Suites

`Table.cases.test.ts` (in `table/`) covers all three bindings, via `assertPatternCases`, which
compares the declared case-name set **before anything mounts**.

- **`wide`** — walk the grid cell by cell, one press per step, asserting at each that focus landed
  where the arrow sends it **and** that exactly one `tabindex="0"` exists and is that cell. Edge
  clamps are one extra press each, never a loop. **The bill is the press count**, so the fixture is
  small and explicitly sized (2 columns × 2 rows + header, as React's is).
- **`card`** — stub `ResizeObserver` to report a narrow width and restore it in a `finally`.
  ⚠ **`readBreakpoint` caches per name in a module-level `Map`, and every Angular suite shares one
  process**, so a value this suite caches for `md` outlives the file. `PageHead.variants.test.ts`
  asserts `readBreakpoint('md') === 768` on a cache hit. Cache **768** or nothing — never a
  different number — and confirm by running the merged process, not the file alone.
- **Never `assert.equal` on a DOM node.** Use `assertSameNode` / `assertNotSameNode` /
  `assertNoNode` from `test/NodeAssert.ts`. `check:assertions` watches this but **does not see a
  comparison made through a local variable**, and a connected node drags the whole shared document
  into the diff (518,563 characters, measured).
- Every directly-created fixture is `destroy()`-ed in a `finally`; zoneless change detection sweeps
  all attached views and a dirty fixture throws out of an unrelated later file.

Plus `Table.variants.test.ts` for the recipe (both branches mutually exclusive, the way
`PageHead.variants.test.ts` asserts its own).

### Demo page (`Table` only)

`Table.card.html` + `Table.card.entry.ts` beside the component, `'Table'` added to `PAGED` in
`check-angular-demos.mjs` (11 → 12). It is the only one of the five whose behaviour needs a
browser: the container-measured responsive cut, the grid walk, the row hover. Angular demo pages
carry **no `@dsCard`**. Badge and Card get none — they show nothing happy-dom does not already
prove. The page should drive the container width explicitly so both shapes are reachable, and it
is where to confirm there is **no measurement feedback loop** between the host's own `display:table`
box and the width it reports.

### Dressing

Retire `.mat-mdc-table` and `.mat-mdc-header-cell` in this commit. The `TableRow` hairline comes
from `--mat-table-row-item-outline-color` **inside** the `.mat-mdc-table` block, so it dies with it
and needs no separate step.

---

## Task 4 — close the batch

**Counters and records**

- `scripts/behaviour-contracts.test.mjs:~161` — `angularPrimitives('.').length` **33 → 38**.
  `reactComponents` is unchanged: all five already exist in React. Verify with the **merged**
  process from `testStep()` in `scripts/check-all.mjs` — `bun test frameworks/angular` never
  matches `scripts/` and reports green over a red tree.
- `COVERED` in `check-compliance.mjs`, five keys: `Badge:angular` → `Badge.compliance.test.ts`,
  `Card:angular` → `Card.compliance.test.ts`, and `Table:angular` / `TableRow:angular` /
  `TableCell:angular` → `Table.cases.test.ts` (the `Tabs`/`Tab` shape, where one suite covers a
  family).
- `PAGED` += `Table`.
- `HOST_SLOT` += `table-row`, `table-cell`.
- `BehaviourDelegated.json`: 17 → **12** entries.

**The two contracts that lie, and the DOUBTS claim about them that is also wrong**

`DOUBTS.md` records that several `content` descriptions were written in React's mechanism and left
"for the batches that implement them". This is that batch:

- `contracts/api/components/Table.json` — `description` and `content` say *"Table injects where the
  row sits"* twice. Reword to what is true of both layers: **Table decides where each row sits and
  which columns its cells are set against; how that reaches the row is each layer's idiom.**
- `contracts/api/components/TableRow.json` — same verb, plus the word **`props`**, which is React's
  vocabulary and is exactly the defect the contract layer exists to avoid.
- **Correct the `DOUBTS.md` entry itself.** It claims *"`TableRow`'s and `TableCell`'s prose even
  names `cloneElement`"*. Verified false — `grep -l cloneElement contracts/api/components/*.json`
  returns **nothing**, for either file. `TableCell.json` carries one *"injected"* and no React
  vocabulary at all, so it needs at most a light touch. `SideNavItem` keeps its "injects" and stays
  for batch 6.

**Other `DOUBTS.md` movement**

- The runtime-guard entry: *"The remaining three contracts with the phrase — `SideNav`,
  `SideNavSection`, `Table` — are still delegated and arrive with batches 4 and 6"* → `Table` is no
  longer one of them.
- The compound-direction entry: `Table`/`TableRow`/`TableCell` are no longer "in batch 4"; they are
  implemented, and the list of contracts still saying "injects" shrinks to `SideNavItem`.
- **New divergence entry**: React's `Table` renders a real `<table>`; Angular's renders a role-based
  grid on `display:table` boxes, because two `<ng-content>` with one selector cannot both receive
  content. State that `role="grid"` was already overriding the native table role in both layers, so
  what actually diverges is the element and `colspan`, not the accessibility tree.
- **Check and, if real, record**: React's `Table` defaults `empty` to the string `"No data."`; a
  slot cannot carry a default in Angular, so an unprojected `[empty]` renders an empty box.
- Re-run the carve-out entry's own command — this batch adds **no** carve-out, so it should be
  unchanged; confirm rather than assume.

**Spec**

Rewrite the batch-4 clause in the "Plan D" header blockquote of
`docs/superpowers/specs/2026-07-23-8-api-contracts-design.md`, the way closing batch 3 rewrote its
own. The current clause — *"display — `Badge`, `Card`, `Table`/`TableRow`/`TableCell`, where Table
carries eight exceptions a real primitive should clear rather than port"* — is true as far as it
goes and silent on the three things that actually shaped the batch: `responsive` as a contracted
member, the family being compound, and the two contracts written in React's verb.

**Documents**

- `CHANGELOG.md` under `## [Unreleased]`.
- `CLAUDE.md`: **verify, do not assume.** Batch 3 needed no change; every count in it is stated as
  a method rather than a figure, and this batch adds no manifest and no category. **There are 54
  characters of margin**, so if a sentence does need to move, something else must shrink in the
  same edit. Measure with `readFileSync(...).length`, never `wc -m` (which reports 60,282 bytes and
  reads as 282 over).
- `frameworks/angular/README.md` (16,342 chars, ample room): check whether it enumerates anything
  this batch moves.

**The cross-file grep, run once per component — five times**

```bash
X=Table   # then TableRow, TableCell, Badge, Card
grep -rn --binary-files=without-match "\b$X\b" \
    --include='*.md' --include='*.json' --include='*.mjs' --include='*.jsx' --include='*.ts' \
    CLAUDE.md DOUBTS.md contracts/api/ contracts/behaviour/ docs/ frameworks/ scripts/
```

Read every hit as a claim you may have just falsified. Drop the hits under `X`'s own files and
under `CHANGELOG.md`. This is the one class of rot no gate catches.

---

## Commits

1. `arena-badge` — counter 33 → 34.
2. `arena-card` — counter → 35, `.mat-mdc-card` retired, `Card.manifest.json` gains `block`.
3. The `Table` family — counter → 38, `.mat-mdc-table` + `.mat-mdc-header-cell` retired, `PAGED`,
   `HOST_SLOT`, `COVERED`.
4. Close-out — contracts, `DOUBTS.md`, spec clause, `CHANGELOG.md`, doc verification.

A commit message containing a backtick uses `git commit -q -F - <<'MSG' … MSG`; verify with
`git log -1 --format=%B`.

Copy this plan to `docs/superpowers/plans/2026-07-30-plan-d-batch-4-display.md` and commit it
first, per the repo's convention; delete it when the batch lands.

---

## Verification

**Per commit — the cheap gates, and watch each widened gate fail before it passes:**

```bash
bun run check:behaviour      # bindings, delegated staleness, cross-layer agreement
bun run check:api            # the Angular class surface against the contract
bun run check:structure      # Components.json vs the directories
bun run check:dimensions     # after any framework-layer edit
bun run check:tailwind       # every manifest class resolves
bun run check:states check:assertions check:angular-demos
bun run check:material       # after each arena-material.css block is retired
bun run build:angular-tests && bun test build/angular-test/angular
```

**Suites that can run away are capped**, redirected to a file rather than a pipe:

```bash
systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 \
  timeout -s KILL 300 bun test build/angular-test/angular > /tmp/out.txt 2>&1
```

**The counter is verified through the merged process only** — the args array in `testStep()`,
never `bun test frameworks/angular`.

**Once, when the batch is finished:** `bun run check` — 29 steps, all green.

**Then the only look no gate has.** Build and serve the demos, and walk the by-hand checklist in
each of the five `.prompt.md` files in a real browser:

```bash
bun run build:angular-demo && bun run demos
```

On `Table.card.html` specifically: narrow the container and watch the grid become cards on the
**container's** width; Tab once into the grid and confirm it is **one** tab stop; walk it with the
arrows, `Home`, `End`; press `Enter` on a row with a `click`; confirm the focus ring, the row
hover and the radius on the frame; and confirm the width the host reports does not oscillate
between the two shapes.
