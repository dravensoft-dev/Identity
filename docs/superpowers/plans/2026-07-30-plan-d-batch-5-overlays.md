# Plan D — batch 5: the remaining overlays (Dialog, Menu, Select, Toast)

## Context

Plan D gives Angular a real Arena primitive for every control it delegates to Angular
Material, so that all three contracts — design, behaviour, API — reach those controls, and
so Material can be deleted from the tree in batch 7. Batches 1–4 landed the CDK foundation,
the form controls, the choice/navigation controls and the display family. This batch takes
the four remaining overlays.

Measured on `29340ed`, branch `plan-d-batch-5-overlays`, clean:

- 38 Angular primitives; 12 `BehaviourDelegated.json` entries (10 delegated + 2 `absent`).
- `check:api`: `50 contract(s) and 40 type(s) hold across 88 layer implementation(s)`.
- `CLAUDE.md` is 59,946 chars (`readFileSync(…,'utf8').length`) — 54 of margin.
- `scripts/behaviour-contracts.test.mjs:161` asserts `angularPrimitives('.').length === 38`.

### Four things the brief inherited that measurement corrected

1. **`Select` needs no CDK, and the CDK count goes 1 → 2, not 1 → 3.** The contract calls it
   a *"styled native dropdown selector"*, `options` are *"drawn as native options"*, it
   declares `multiple`, and `change` carries a single `string` — all of which only a native
   `<select>` satisfies. `Select.manifest.json` is the styled-native shape (`appearance-none`
   + an absolutely-positioned `caret` span). So `arena-select` is a native `<select>`, binds
   `select`, and the `divergesFrom: "select"` on the delegated entry dies with it. After this
   batch the CDK-overlay primitives are **Tooltip and Menu**.

2. **The hanging-attribute set gains three components, not one.**
   `HostClassBinding.test.ts:852` guards `GLOBAL_ATTRIBUTE_INPUTS = ['title', 'name']`, not
   `title` alone. `Dialog.title`, `Toast.title` **and `Select.name`** are contracted inputs, so
   all three hosts need the clearing binding. There is **no literal 17 to move**: the guard
   tallies at runtime and asserts only `declared > 0`, so it extends itself. (17 today = 9
   `title` + 8 `name`; this batch makes it 20.)

3. **`Dialog` and `Toast` genuinely need no overlay — verified, not inherited.** `Dialog.jsx`
   renders a `position: fixed; inset: 0` scrim in place with no portal, exactly as
   `ConfirmDialog`/`Onboarding`/`CommandPalette` already do in Angular. `Toast.jsx` does not
   position itself at all — it is an in-flow card of fixed width whose placement and clock
   belong to the host, as `Toast`'s contract already says. The spec's clause holds.

4. **The CDK container sits below every in-flow Arena overlay, and that is a live defect.**
   `arena-cdk.css` pins `.cdk-overlay-container` to `--z-dropdown` (900), while
   `--z-modal` is 1000, `--z-modal-nested` 1050, `--z-palette` 1100, `--z-onboarding` 1200.
   A Tooltip inside a `ConfirmDialog` already paints *behind* it today; this batch adds Menu
   and Dialog, which makes the common case (an overflow menu inside a dialog) hit it. Fixed
   here, in step 1.

## Approach

Four self-contained component commits, each landing its primitive together with everything
that would otherwise go red: `check:behaviour` fails the instant a primitive exists while its
delegated entry survives, so the deletion, the new binding, the counter bump, the `COVERED`
entry, the dressing-block removal and the demo page all belong to that component's own commit.
The counter literal therefore moves four times (38→39→40→41→42).

Order runs lowest-risk-first: the shared z fix, then the three primitives that need no CDK,
then Menu.

---

### Step 1 — the CDK layer's z slot (commit 1)

`frameworks/angular/theme/arena-cdk.css`:

- `.cdk-overlay-container { z-index: calc(var(--z-toast) - 10); }`. A CDK overlay is always
  anchored to a trigger that already lives inside whatever is on top, so there is no case
  where it should paint below an in-flow overlay; it must still stay below `--z-toast`, which
  the layering token's own `$description` says floats above everything. The
  derive-at-the-point-of-use idiom is the one `--z-onboarding`'s scrim already uses
  (`calc(var(--z-onboarding) - 10)` — "one slot, two uses"), so no new token is introduced.
- Rewrite the header comment's two wrong clauses: the users list becomes **Tooltip, Menu**
  (Select is native and never reaches the CDK), and the Toast consequence is replaced —
  `arena-toast` stays in flow at `--z-toast`, and a toast outranking a CDK overlay is the
  intended order rather than a consequence awaiting resolution.
- The remaining recorded consequence stands: every CDK overlay still shares one slot, so a
  tooltip over a menu item wins by DOM order rather than by `--z-tooltip`.

`contracts/design/layering.json`: `--z-dropdown`'s `$description` reads *"Menu, Select's
popover layer"* and Select has no popover layer in either layer. Correct it to name the
anchored-panel slot neutrally, then `bun run build:tokens` and `check:tokens` / `check:dtcg`.

`frameworks/angular/components/feedback/tooltip/Tooltip.card.html` inlines
`.cdk-overlay-container{z-index:var(--z-dropdown)}` rather than importing the bridge — it
must carry the same new value, and so must the four card pages added below.

`DOUBTS.md`'s *"`arena-cdk.css` — one selector, and why the other four are left alone"* entry
is rewritten around the new value, keeping the measured four-1000s rationale intact.

Gates: `check:cdk` (it validates that every `.cdk-*` class named exists in the prebuilt sheet
and that the bridge references a real Arena token — confirm `calc(var(--z-toast) - 10)`
satisfies the token check), `check:tokens`, `check:dtcg`, `check:cards`.

---

### Step 2 — `arena-dialog` (commit 2)

`frameworks/angular/components/feedback/dialog/` — the quartet plus binding and suites.
The reference shape is `components/feedback/confirm-dialog/ConfirmDialog.ts`, which is the
same component one pattern over.

- **Host is the scrim**: `'[class]': 'styles().scrim()'`, `'(click)': 'onScrimClick()'`,
  `'(keydown)': 'onKeydown($event)'`, `'[attr.title]': 'null'`.
- **`HOST_SLOT` gains `dialog: { slot: 'scrim' }`** in `HostClassBinding.test.ts:759`.
  `Dialog.manifest.json` names its root slot `scrim`, and the manifest-driven assertion at
  `:809` otherwise fails with *"no manifest named …"* / *"has no slots.root string"*. The map
  is staleness-guarded both ways, so the entry must name a real directory.
- **Template**: `@if (open()) { <div #panel role="dialog" aria-modal="true" tabindex="-1"
  [attr.aria-labelledby]="titleId" [style.width]="width()"
  (click)="$event.stopPropagation()"> … }`. The panel's `stopPropagation` is the scrim
  rationale, not the name-collision one — it is what keeps a click inside the panel from being
  read as a dismissal, and `Onboarding.ts:33` and `CommandPalette.ts:58` are the precedent.
- **The optional `footer` slot follows `UnauthCard`**: `contentChild(ArenaFooter)` from
  `frameworks/angular/ProjectionMarkers.ts` gates an `@if` around the `foot` wrapper, with the
  single `<ng-content select="[footer]" />` inside it. One selector, one `<ng-content>` — two
  with the same selector is the batch-4 trap where the second receives nothing.
- **Focus** is Arena's, not the CDK's: `FocusTrapState` + `afterRenderEffect` +
  `handleOpenTransition` + `trapTabKey`, copied from `ConfirmDialog`. Escape
  `preventDefault()`s and reports through `close`, so meeting `dialog-modal` adds no member.
- **Members** (`readonly x = input/output` only — `check:api`'s reader throws on any other
  public shape, and on a constructor parameter property): `open` and `title` are
  `input.required`, `eyebrow`/`width` are `input<string>()`, `close = output<void>()`.
  Two required inputs is the NG0950 hazard — the suites use `componentRef.setInput` or a
  wrapper host, per `HostClassBinding.test.ts`'s six worked examples.
- **`ConfirmDialog.ts:27-28` re-exports the whole `FocusTrap` module.** Delete it here: a real
  `Dialog` makes it a second public path to the same functions that no gate can see.
- Binding: `dialog-modal`, flat, `exceptions: []` — matching React exactly.
- Suites: `Dialog.compliance.test.ts` (the `COVERED` one; the four `focus.*`/`keyboard.Escape`
  requirements are behavioural and must be asserted by acting on the tree) and
  `Dialog.focusTrap.test.ts` over the pure functions with `ensureDom()` only, on the
  precedent of the three existing `*.focusTrap.test.ts`, plus `Dialog.variants.test.ts`.

Bookkeeping in the same commit: delete `BehaviourDelegated.json`'s `Dialog`; delete
`arena-material.css`'s `.mat-mdc-dialog-surface` block; counter 38→39; `'Dialog:angular':
'Dialog.compliance.test.ts'` in `COVERED`; `Dialog` into `PAGED` with its
`Dialog.card.html` + `Dialog.card.entry.ts`.

---

### Step 3 — `arena-select` (commit 3)

`frameworks/angular/components/forms/select/`. A native `<select>`, mirroring `Select.jsx`.

- Host binds `root` (`flex flex-col gap-1.5` — a real display utility, so no `HOST_SLOT`
  entry), plus **`'[attr.name]': 'null'`**, because `name` is a contracted input.
- Template: the optional `<label [for]>`, the `wrap` div, the native `<select #field>` with
  `[disabled] [required] [name] [multiple]` and `[selected]` per option, and the `caret` span.
- **`change` is the acute output**, and the fix is measured rather than argued. The inner
  `<select>`'s native `change` bubbles out of `<arena-select>` under the same name as the
  contracted output, so `onNativeChange` calls `event.stopPropagation()` before
  `this.change.emit(target.value)` — the shape `Input.ts:117` and `Textarea.ts:114` already
  use for exactly this reason. The suite proves it: a `change` listener on an **ancestor** of
  `<arena-select>` must fire zero times while the output fires once.
  Dialog's `close`, Menu's `select` and Toast's `close`/`action` have no native source that
  can reach their hosts, so none of them needs one.
- Binding: `select`, flat, `exceptions: []`. Both its requirements (`roles.element` →
  `combobox`, `roles.label`) are DOM-decidable, so the compliance suite is small.
- **The `multiple` gap is recorded, not fixed**: the contract declares `multiple` while
  `change` carries a single `string`, which does not model a multi-selection. React has the
  identical gap. Angular ports React's behaviour verbatim and the defect goes into `DOUBTS.md`
  as a contract-level one; changing a contract is not this batch's authority.

Bookkeeping: delete `BehaviourDelegated.json`'s `Select`, **including its
`divergesFrom: "select"`** — with a native `<select>` in both layers there is no divergence
left. Delete `arena-material.css`'s
`.mat-mdc-form-field.mat-form-field-appearance-outline` block: Input and Textarea are
primitives already, so Select was its last delegated consumer and the block dies by the
batch-1 rule (verify no remaining delegated entry cites it before deleting). Counter 39→40;
`COVERED`; `PAGED` + card page.

---

### Step 4 — `arena-toast` (commit 4)

`frameworks/angular/components/feedback/toast/`. An in-flow card that positions nothing.

- Host binds `root`, plus `'[attr.title]': 'null'`, plus the tone-driven live region:
  `'[attr.role]': "tone() === 'danger' ? 'alert' : 'status'"` and the matching
  `[attr.aria-live]` — the exact idiom `Alert.ts` already uses, and the thing that closes the
  divergence. `[attr.data-persist]` mirrors React's.
- `pinned = computed(() => this.persist() || this.tone() === 'danger')` — the contract's
  *"implied by `tone: danger`, which ignores false"* rule. `dismissible` gates the ×.
- **Binding declares `cases`, with React's exact case names**: `danger` → `alert`,
  `advisory` → `status`, `exceptions: []` in both. `crossLayerAgrees` compares the sorted case
  *names* first and returns false on any mismatch, then compares per-name patterns — so the
  names are load-bearing, not descriptive.
- The suite drives `assertPatternCases` with a `{ danger, advisory }` map of **thunks**; the
  wrapper compares that key set against the declared names *before anything mounts*.
  `alert`'s `content.noAutoDismiss` and `focus.unaffected`, and `status`'s `focus.unaffected`,
  are behavioural and must be named in the `behavioural` map and asserted by acting.
- **This closes a real divergence, so the record retires**: drop `divergesFrom` and
  `divergesFromReason` from
  `frameworks/react/components/feedback/toast/Toast.behaviour.json`, and retire `DOUBTS.md`'s
  *"Toast — a critical error interrupts in React and is queued in Angular"* entry on the
  precedent of the closed `Skeleton` one. That leaves **zero** `divergesFromReason` instances
  repo-wide (`TableRow`'s `divergesFrom` carries a plain `reason`), so `DOUBTS.md`'s note
  about that novel field must say so.
- `DOUBTS.md`'s *"`dismiss` is still unpaid"* clause becomes payable: the card page can run
  its clock off `dismissDefault`/`dismissActionable` from `Tokens.generated`, which satisfies
  the script-token orphan rule from more than one layer. Do it if the page needs a clock
  anyway; otherwise update the clause to say the seam is now a consumer's `setTimeout`, as
  `Toast`'s contract already states.

Bookkeeping: delete `BehaviourDelegated.json`'s `Toast` and
`arena-material.css`'s `.mat-mdc-snack-bar-container` block; counter 40→41; `COVERED`;
`PAGED` + card page.

---

### Step 5 — `arena-menu` (commit 5)

`frameworks/angular/components/navigation/menu/`. The only CDK primitive in the batch;
`Tooltip.ts` is the template to copy, method for method.

- **Why the CDK and not React's `position: absolute`**: Menu's canonical use is an overflow
  menu inside a table row or card, where an absolutely-positioned panel is clipped by an
  `overflow: hidden` ancestor. React has that defect; the spec is explicit that Plan D repairs
  behaviour rather than porting a known-deficient one.
- **`Menu.manifest.json` gains an `anchored` variant**, on `Tooltip.manifest.json`'s exact
  precedent: `anchored: false` keeps `panel`'s `absolute top-full left-0 mt-1.5` and the
  additive `panelEnd`, so the existing Tailwind specimen is unchanged; `anchored: true`
  empties them, because the CDK positions `.cdk-overlay-pane`. Angular passes `true`.
  Re-run `bun run build:tailwind` for `Menu.manifest.ts`, then `check:tailwind`,
  `check:arbitrary`, `check:coverage` and **`check:states`** — the manifest carries `hover:`
  on `itemDefault`/`itemDestructive`, which resolves against the mirrored *React* component,
  so adding no new state modifier keeps it green.
- **Position offsets must be token-derived**, since `check:dimensions` fails a bare literal and
  `check:duplicate-constants` fails a constant declared in both layers. `Tokens.generated`
  exports `sp2`/`sp3`/`sp4` but **no `sp1`**, and the manifest's `mt-1.5` is 6px. Flag
  `--sp-1` with `$extensions["com.dravensoft.arena"].script: true` so `sp1` emits per layer,
  and write the offset as `sp1 * 1.5`; that keeps Angular geometrically identical to React.
  Re-run `build:tokens`, then `check:script-tokens` and `check:duplicate-constants`. (Fallback
  if flagging is judged too wide: derive from `sp2` and record the reasoning — but do not
  write `6`.)
- **`align` maps to `ConnectedPosition`s**, not classes: export a `MENU_POSITIONS` table the
  way `Tooltip.ts` exports `TOOLTIP_POSITIONS`, one pair per `MenuAlign` value.
- **The trigger is projected content the primitive must decorate.** `<ng-content
  select="[trigger]" />` (bare attribute selector — `templateSlots()` refuses any other form),
  and `aria-haspopup="menu"` / `aria-expanded` go onto `host.nativeElement.firstElementChild`
  by DOM mutation, which is exactly how `Tooltip` attaches `aria-describedby`. Factor the
  join/strip logic as pure exported functions so it is unit-testable without a DOM, as
  `joinDescribedBy`/`stripDescribedBy` are. The delegated entry's own reason names the thing
  to preserve: the attributes land on the **real focusable element, not a wrapping node**.
- Escape and outside-click are `document` listeners with stored teardowns (Tooltip's
  `listenForEscape` shape), and the outside test must accept both the host and the overlay
  pane, since the panel is no longer a descendant of the host. Focus moves to the first
  enabled `[role="menuitem"]` on open and returns to the trigger on close.
- Binding: `menu-button`, flat, `exceptions: []`. Its three DOM requirements
  (`roles.element` → `button`, `roles.haspopup`, `roles.expanded`) are evaluated against the
  **trigger**, so the fixture projects a real `<button trigger>`; the other four are
  behavioural.
- Suites must `disposeOverlays()` from `frameworks/angular/test/Overlays.ts` in a `finally`,
  and must **never** `assert.equal` a connected node — use `assertSameNode`/`assertNoNode`
  from `NodeAssert.ts`. Every fixture gets `destroy()`d. The document is shared for the whole
  Angular run, so anything left behind breaks an unrelated later file.

Bookkeeping: delete `BehaviourDelegated.json`'s `Menu` (it has no `dressedBy`, so no
`arena-material.css` block to remove); counter 41→42; `COVERED`; `PAGED` + card page.

---

### Step 6 — close the batch (commit 6)

- **`BehaviourDelegated.json` is down to 8 entries** — `Calendar` and `CalendarEvent`
  (`absent`), `ProgressBar`, `Spinner`, and the four `SideNav*`, which batch 6 takes.
- **`arena-material.css` is down to 4 blocks** — spinner, progress-bar and the two side-nav
  ones. Re-read `check:material` if the file is close to empty.
- **The spec's batch-5 clause is rewritten in place**, on the model batch 4 set at
  `docs/superpowers/specs/2026-07-23-8-api-contracts-design.md:818-826`: keep the original
  sentence and append what the batch actually found — that `Select` is native and takes no
  CDK, that the CDK count went to two rather than three, and that the container's z slot was
  wrong for every in-flow overlay. Do not rewrite history in the `>` blocks.
- **`CLAUDE.md` has 54 characters of margin.** Measure with
  `readFileSync('CLAUDE.md','utf8').length`, never `wc -m`. Most of its Angular prose is
  method-based ("count them rather than trusting a figure") and needs no edit; batch 4 needed
  none. If an edit is genuinely required, pay for it by deleting obsolete text of at least
  equal length in the same edit. `check:docs` holds the 60,000 ceiling.
- `frameworks/angular/README.md`, `DOUBTS.md`, and `CHANGELOG.md` under `## [Unreleased]`.
- **The cross-file grep `CLAUDE.md` prescribes, run for all four**, reading every hit as a
  claim that may have just gone false — `--include`s over `CLAUDE.md DOUBTS.md contracts/api/
  contracts/behaviour/ docs/ frameworks/ scripts/`, dropping only the component's own files
  and `CHANGELOG.md`. `Select` and `Toast` will have the most hits, since both are named in
  divergence prose that this batch retires.

## Verification

Individual gates per commit — `check:behaviour`, `check:compliance`, `check:api`,
`check:dimensions`, `check:structure`, `check:angular`, `check:angular-demos` after each
component; `check:cdk`/`check:tokens`/`check:dtcg` after step 1; `check:tailwind` family
after Menu's manifest.

Suites are run through the merged process — the args array in `testStep()` in
`scripts/check-all.mjs` — never `bun test frameworks/angular`, which never matches
`scripts/` and would report green over the counter assertion it just falsified. Angular
suites need `bun run build:angular-tests` first; a template diagnostic fails the *build* and
no test runs at all. Anything that could run away goes in a bounded scope, redirected to a
file rather than a pipe:

```
systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 bun test … > out.txt 2>&1
```

`bun run check` once, at the end — 29 steps, all 29 green today, and the expected deltas are
`check:api` at 92 implementations and `check:compliance` up by four bindings.

Then the look no gate has: `bun run build:angular-demo && bun run demos`, and walk each of the
four card pages against its `.prompt.md` checklist — the menu's flip at the viewport edge and
its escape from an `overflow: hidden` ancestor, a menu opened **inside** a dialog (the z fix's
whole point), the dialog's Tab-around-the-interior, the native select's popup and caret, and a
danger toast's pinned marker. If `/usr/bin/chromium` is present, drive it over CDP with
`scripts/lib/{chromium,cdp,static-server}` to assert real geometry and real focus, the way
batch 4 confirmed the grid.

## Out of scope

`--panel` and `--surface-card` both resolve to `var(--color-base-200)`, so `Table`'s two
surfaces paint the colour they sit on in both layers. It is in `DOUBTS.md` section 1 with the
browser measurement, the fix is a token decision about what `--panel` is, and it is not this
batch's.
