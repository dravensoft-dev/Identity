# Tabs, Tooltip, and the primitive-type gate

Three parts, in this order: a cleanup that costs minutes, a gate ratchet that costs a clause,
and the accessibility work the first two clear the ground for.

The batch's subject is the sharpest asymmetry the repo currently records. `Tabs` excepts **every
one** of the `tabs` pattern's eight requirements, and `Tooltip` excepts three of `tooltip`'s four.
Neither is inside the grid hand-check rule, so unlike `Calendar` and `Table` both can be held by a
render suite the day they are fixed — which is what makes them the right subjects rather than the
loudest ones.

---

## What this measured before it was written

Read off the tree at `ef5dd6e` on 2026-07-26. Do not re-derive; do verify anything you are about
to depend on.

| measure | value |
|---|---|
| `bun run check:api` | `49 contract(s) hold across 69 layer implementation(s)` |
| `bun run check:compliance` | `8 of 69 bindings verified by a render suite` |
| `bun run check:behaviour` | `21 pattern(s); 49 react + 20 angular + 29 delegated` |
| `bun run check:dimensions` | clean, no stale exemptions |
| `bun run check:states` | clean, 15 state-modifier sites, 3 exempted |
| `bun test scripts` | 547 pass, 0 fail across 32 files |
| `scripts/behaviour-contracts.test.mjs`'s React inventory | asserts `reactComponents('.').length` by literal |

The full `bun run check` sweep was **not** re-run for this spec. It was measured at this commit
before the batch began — `all 23 step(s) passed` — and CLAUDE.md's rule is that the sweep is a
completion gate rather than a per-step toll. The plan runs it once, at close-out.

### The subjects, measured

| fact | value |
|---|---|
| `Tabs.jsx` / `Tabs.d.ts` | 24 / 14 lines |
| `Tabs.behaviour.json` | **8 exceptions against 8 requirements** — the pattern is entirely unmet |
| `behaviour/patterns/tabs.json` requires | `roles.tablist`, `roles.tab`, `roles.tabpanel`, `roles.controls`, `states.selected`, `focus.roving`, `keyboard.ArrowLeft`, `keyboard.ArrowRight` |
| `Tooltip.behaviour.json` | **3 exceptions against 4** — `roles.element` is met, `roles.describedby` / `keyboard.Escape` / `focus.never` are not |
| `behaviour/patterns/tooltip.json` requires | `roles.element`, `roles.describedby`, `keyboard.Escape`, `focus.never` |
| `Tabs` call sites | `frameworks/react/ui_kits/console/ProjectScreen.jsx`, `frameworks/react/components/navigation/navigation.card.entry.jsx`, plus `frameworks/react/test/tabs.test.jsx` |
| `ProjectScreen.jsx` | 133 lines, with four consumer-rendered panel blocks at lines 78, 95, 99, 115 |
| `navigation.card.html` | declares `viewport="700x703"` |
| `Tabs.manifest.json` | slots `root` and `tab`; one `selected` variant; **no hover/focus state modifier at all** |
| `api/types/tab-item.json` | `TabItem { value, label }`, both required strings |
| `delayOpen` / `delayClose` | 400 / 120, from `frameworks/react/tokens.generated.js` |
| Angular | `Tabs` delegates to `MatTabGroup`, `Tooltip` to `matTooltip`; both already meet their patterns |

### The C1 blast radius, probed rather than assumed

A read-only probe compared every contract `primitive` member against every layer's declared type,
reusing the gate's own exported readers rather than re-implementing the parsing:

- **238 contract↔layer primitive comparisons** across 45 contracts that declare a primitive member.
- **0 mismatches. 0 undecidable. 0 absent.**
- The two live examples CLAUDE.md names, `Dialog.width` and `SideNav.indentStep`, **both agree
  today**. They are cited there as examples of an *unguarded surface* — reverting either `.d.ts` by
  one word leaves the gate green — not as current divergences.

Three claims of that probe were re-verified by hand before this spec depended on them:
`scripts/lib/api-surface.mjs:127` already returns `{form:'primitive', type}`;
`scripts/api-surface.test.mjs:21` already pins that; and `compareSurface` already `continue`s on a
form mismatch (`scripts/check-api.mjs:369`) before reaching the enum/object type comparison at
line 432, which is exactly where the new clause belongs.

So C1 is a **pure ratchet**: it forbids a future defect, retroactively excuses nothing, and needs
no exception map — which matters, because this is the one gate in the repo that deliberately has
none.

---

## Part 1 — E, the cleanup

`git rm` three files, nothing else:

- `docs/superpowers/plans/2026-07-25-8c5-sidenav-sections-and-collapsibles.md` — executed. Its
  three surviving learnings were rescued to permanent homes first (CLAUDE.md's quartet rule,
  CLAUDE.md's D1 debt entry, and `scripts/check-dimension-literals.mjs`'s own header), so nothing
  unique dies with it.
- `docs/superpowers/specs/2026-07-25-8c4-dialog-modal-and-the-last-four-contracts-design.md`
- `docs/superpowers/specs/2026-07-25-tabstop-and-the-grid-testing-rule-design.md`

Both specs outlived plans that have been executed and deleted. The repo's rule is that a spec is
deleted when its plan has been executed; 8C5's branch review read both and confirmed no debt dies
with either.

This part exists first because it is free and because it removes two documents a reader of
`specs/` would otherwise take for work in flight.

---

## Part 2 — C1, the primitive-type gate

**One clause**, beside the existing enum/object comparison in `compareSurface`:

```js
if (spec.form === 'primitive' && m.type !== spec.type) { … }
```

It can only run when both sides are already `primitive`, because the form guard above it
`continue`s otherwise. Neither side can be `undefined`: `validateContract()` already asserts a
contract primitive's `type` is one of `string | number | boolean`, and `classify()` returns a
`type` for exactly those three.

`scripts/check-api.test.mjs` gains a case in **both** directions — a contract/layer type
divergence must fail, and an agreeing pair must not. `scripts/api-surface.test.mjs` needs nothing:
the reader already does its half and is already pinned.

**What this does not close, stated so nobody thinks otherwise.** `spec.default` is still read by
nothing, React's checked surface is still its `.d.ts` and never its `.jsx`, and R2 and R3 remain
unmachine-checkable. Bundling `spec.default` in here is explicitly rejected: React's defaults live
in a destructuring pattern this gate never opens, so the comparison could only run against
Angular, which is worse than not claiming it.

The gate's own header and CLAUDE.md's Known debt entry both currently state that a primitive's
`type` is uncompared. Both become false in this change and are rewritten in it. The `indentStep`
half of that entry keeps its *other* point — that `check:dimensions` cannot police a value a
caller passes in — because that stays true.

---

## Part 3 — Tabs becomes a compound component

### The shape

```jsx
<Tabs value={tab} onChange={setTab}>
  <Tab value="Overview" label="Overview"><Summary/></Tab>
  <Tab value="Deployments" label="Deployments"><DeployTable/></Tab>
</Tabs>
```

`Tab` renders its own tab button. `Tabs` renders the tablist and, as its **sibling**, the one
tabpanel, filled with the active `Tab`'s `children`:

```
Tabs  ->  <div role="tablist">{cloned children}</div>
          <div role="tabpanel" id aria-labelledby>{active tab's children}</div>
Tab   ->  <button type="button" role="tab" id aria-selected aria-controls tabindex>{label}</button>
```

Injection is **direct children only, one hop**, with no React context — the family rule since
`RadioGroup`, and the rule `SideNav` extended to arbitrary depth. `Tabs` is not recursive: a tab
list does not nest, so the depth machinery `side-nav-inject.jsx` carries has no counterpart here.

`Tabs` injects `selected`, `onSelect`, `tabId` and `panelId` into each `Tab`. **None of the four
is a member of any contract**, exactly as `Radio.json` declares none of what `RadioGroup` injects.

The family's limit is inherited unchanged and goes in the `.prompt.md` as a Don't: a consumer's
own wrapper component between `Tabs` and its `Tab`s breaks the chain, and so does a fragment —
`React.Children.toArray` flattens a nested array and does not flatten `<>…</>`.

### Why the alternatives are not open

- **Putting panel content inside `TabItem` is dead by rule, not by taste.** `TabItem` is a
  predefined object, and R1 says an object is pure data with known fields; a React node in one is
  precisely the escape R4 closed. This is not a judgement the plan may revisit.
- **Leaving the consumer to render the panel** — Arena wiring ids only — keeps `roles.tabpanel`
  excepted permanently, since Arena would render no tabpanel at all. That fails the batch's own
  purpose, and it is what the component does today.
- **Tabs drawing the buttons from a `label` prop while `Tab` renders only the panel** was
  considered and rejected: every item component in the repo draws its own visible element
  (`Radio`, `TableCell`, `CalendarEvent`, `SideNavItem`), and breaking that for one family would
  make the idiom something a reader has to check rather than know.

### No new `id` member

`value` is already required and unique per tab, so both ids derive from one `useId()` on `Tabs`
plus the tab's `value` — `${base}-tab-${value}` and `${base}-panel-${value}`. The tab's
`aria-controls` and the panel's `aria-labelledby` both resolve with **no member added to either
contract**.

This is deliberately the shape `SideNavCollapsible.id` did not take. That member's required-ness
is recorded in Known debt as measured against the wrong alternative, and this batch does not
reopen it — but where a new component can derive its ids, it derives them.

### The `content` slot, and a contradiction this does not resolve

`Tabs` gains a `content` slot for its `Tab` children. The repo splits two-and-two on whether a
required slot is guarded at runtime — `AppLogo.mark` and `SideNavSection.content` are, and
`Tooltip.content` and `Menu.trigger` are not, with `compareSurface` excluding slots from
required-ness comparison so that both camps pass.

**Decision: declared required and guarded**, following the most recent precedent
(`SideNavSection.content`, which 8C5's close-out review corrected into exactly this shape) rather
than the older `RadioGroup.content`, which is optional and unguarded. A `Tabs` with no tabs
renders an empty tablist and a panel labelled by nothing; that is the defect, not a caller saying
"no tabs right now".

The guard counts with **`React.Children.toArray(children).length`, never `count()`** — CLAUDE.md
carries the reason and 8C5 shipped the bug: `count()` counts a bare `false` that the render path
drops, so `{isAdmin && <Tab …/>}` with a false condition walks straight through a `count()` guard
into the empty render the guard exists to refuse.

This settles the batch's own case and **decides nothing about the four-way split**, which stays
open and stays recorded.

### Keyboard, and what "retired" means here

All eight requirements are met for real:

- `roles.tablist` / `roles.tab` / `roles.tabpanel` — rendered.
- `roles.controls` — each tab's `aria-controls` resolves to the panel's id.
- `states.selected` — `aria-selected` true on the active tab, **false on the rest**, which is what
  the requirement says and is stricter than omitting it.
- `focus.roving` — one tab stop: the active tab is `tabIndex={0}`, every other `tabIndex={-1}`.
- `keyboard.ArrowLeft` / `keyboard.ArrowRight` — move focus to the previous/next tab, **wrapping**,
  and call `.focus()` on the destination.

**Activation is automatic**: an arrow key moves focus and selects in the same step. It is what APG
recommends when the panel displays instantly, and it is the only variant this repo can assert
honestly — a keydown on a native `<button>` does not synthesise a click in happy-dom, so a manual
activation model's Enter/Space path could only ever be established indirectly.

**Home/End are not added.** The pattern does not require them and this batch does not invent
requirements to meet.

### `Tab`'s own binding

`Tab` binds `none`, with the reason in prose, on `SideNavItem`'s precedent: every requirement that
applies to a tab is a clause of the `tabs` pattern, and that pattern is bound on `Tabs` — the
component that renders the tablist, the panel, the roving tab stop and the arrow keys. A binding
of `tabs` on `Tab` would claim a tablist and a tabpanel it does not render.

This is one more instance of the schema limitation already recorded four times over: a binding
cannot say "this pattern applies to me only as part of my parent". Count the `none` bindings with
`grep -rho '"pattern": "none"' --include='*.json' frameworks/ | wc -l` rather than writing an
ordinal — this file has had three ordinals about that limit go stale, one inside the batch that
wrote it.

### The migration, which is real work rather than a rename

Both call sites currently use `Tabs` as a bare strip and render the panel themselves:

- `ProjectScreen.jsx` holds four `{tab === '…' && (…)}` blocks. They become the four `Tab`
  children. The file gets **smaller**: the conditionals go, and so does the reason the `tab` state
  had to be read four times.
- `navigation.card.entry.jsx` renders an "Active view" line rather than a panel. It gains real
  panel content per tab, which is also what makes the demo show the pattern it now implements.

`api/types/tab-item.json` is deleted with the `tabs` member. Measured: `TabItem` is referenced by
`Tabs.json`, `Tabs.d.ts` and the two generated modules and **by nothing else**, so the deletion is
clean — but `Tabs.d.ts` currently **re-exports** it (`export type { TabItem }`), so a consumer
importing the type from there breaks too. That is part of the breaking change and belongs in the
`.prompt.md`, not in a compatibility alias: this repo ships breaking majors rather than
deprecation windows. Rebuild `api.generated.*` in the same change.

### What this breaks beyond code

- **`navigation.card.html`'s declared viewport.** It is `700x703` today and the card now renders a
  panel. **Measure it by running `check:cards`** — declaring it by arithmetic was tried in an
  earlier batch and the page clipped in both axes anyway.
- **`scripts/check-compliance.mjs`'s header uses `Tabs` as its worked example** of "a green run is
  never an accessibility claim", naming its eight exceptions one by one. That paragraph becomes
  **false** in this change. It must be rewritten around a subject that is still true, not deleted:
  the point it makes is the gate's whole charter.
- **CLAUDE.md's `Tabs` Known debt entry** retires, and its `Tooltip` entry retires with Part 4.
- **`SOURCE_OVERRIDES` in `scripts/check-manifest-states.mjs`** must map `Tabs` to **both**
  `Tabs.jsx` and `Tab.jsx`, the compound-component rule that map already applies to `Table` and
  `SideNav`.
- **`Tabs.manifest.json`** should gain the focus ring the new `Tab` draws. Nothing gates the
  manifest against the component it mirrors — that is the open problem CLAUDE.md records — so this
  is honesty rather than compliance, and `check:states` only fires in the other direction.
- **`scripts/behaviour-contracts.test.mjs`'s React inventory count moves by one** for `Tab`, in
  the same commit, verified with the **merged** process (`bun test scripts frameworks/react/test/
  frameworks/angular/test`). `bun test frameworks/react/test/` never matches `scripts/` and reports
  green over a red run; this cost 8C5 a red commit and is now written in CLAUDE.md.
- **`frameworks/angular/behaviour-delegated.json` gains a `Tab` entry**, delegated to `mat-tab`.
  `MatTabGroup` already provides the whole pattern, so no Angular primitive is grown and the
  existing `Tabs` entry's claim stays true.

---

## Part 4 — Tooltip retires all three exceptions

Adding focus alone was considered and rejected as half a repair: a keyboard user would reach the
tooltip visually while a screen-reader user still gets no association between trigger and bubble.

- **`focus.never`** — `onFocus`/`onBlur` on the wrapper. The reveal is **immediate**, never routed
  through `--delay-open`: the token's own `$description` says so, `Tooltip.jsx`'s existing comment
  anticipates it, and CLAUDE.md's debt entry states that routing focus through the delay would make
  a control that is already hard to reach also feel broken. `delayClose` on blur is equally wrong —
  a blur is a decision, not a pointer leaving a hit box — so focus dismisses immediately too.
- **`roles.describedby`** — a `useId()`-derived id on the bubble, and `aria-describedby` added to
  the trigger by `cloneElement`. The bubble is rendered only while shown, so the association is
  present exactly when the description is.
- **`keyboard.Escape`** — a keydown on the wrapper hides it and clears the pending timer.

No API change: `label` and `content` are untouched, and no member is added.

**Two limits to write down rather than discover.** The `cloneElement` requires the trigger to be a
single element that accepts props — the same family limit, one level down; a fragment or a
component that swallows its props breaks the wiring, and the `.prompt.md` must say so. And the
existing single-timer rule is load-bearing: the focus path must not queue behind a pending pointer
close, so it clears the timer rather than scheduling against it.

`Tooltip.content` stays an unguarded required slot. That is one arm of the four-way contradiction
in Part 3, and this batch deliberately does not resolve it in passing.

---

## Part 5 — Verification

Two new render suites under `frameworks/react/test-dom/`, and two new `COVERED` entries keyed by
layer: `Tabs:react` and `Tooltip:react`. `check:compliance` moves from 8 of 69 to **10 of 69** —
run the gate for the live figure rather than trusting that one.

The shared evaluator returns `null` for every `focus.*` and `keyboard.*` requirement, because no
single element can decide them. So both suites must name each of those in their `behavioural` map
and assert it by **acting on the tree**; `assert-pattern.jsx` throws if one is silently skipped.
For `Tabs` that is `focus.roving`, `keyboard.ArrowLeft` and `keyboard.ArrowRight`; for `Tooltip`,
`keyboard.Escape` and `focus.never`.

**What a suite may and may not claim here**, since this is where suites in this repo go wrong:

- happy-dom honours **our own** `.focus()` call, so asserting that ArrowRight moved
  `document.activeElement` to the next tab is a real assertion — the arrow handler calls `.focus()`
  itself.
- happy-dom has **no sequential focus navigation**, so no assertion may claim that pressing Tab
  moved focus. The roving tab stop is asserted structurally instead: exactly one element inside the
  tablist has `tabindex="0"`, every other has `tabindex="-1"`, and that moves with selection.
- A keydown on a native `<button>` does **not** synthesise a click. Nothing in either suite may
  depend on it.

`Tabs`'s DOM-free suite keeps its place: shape, guards, the `content` guard counting with
`toArray().length`, and **two R4 tests per new component** — one for `style`, one for a stray
attribute, in separate bodies because `node:assert` aborts on the first failure. When inducing them
to prove they work, the induction must be **disjoint**: a bare `{...rest}` swallows `style` and
correctly fails both, which is the escapes overlapping rather than the tests failing to be
independent. CLAUDE.md carries the two-step recipe.

Finally, the real-browser check. `Tabs` is **not** inside the grid hand-check rule — it binds
`tabs`, not `grid` — so a suite is the authority and no hand check is owed. The `.prompt.md`
checklist still gets the one thing a suite provably cannot hold: that Tab from a tab reaches the
panel and not the next tab, which is the browser's native sequential navigation.

---

## Part 6 — What this batch does not do

- It does not touch `Calendar` or `Table`. Both are inside the grid hand-check rule and both stay
  outside `COVERED`.
- It does not resolve the four-way required-slot split, `SideNavCollapsible.id`, or
  `ConfirmDialog.open`.
- It does not start Plan D. Angular gains one delegated declaration and no primitive.
- It does not migrate `components-divergences.md`. That is sequenced last by Plan 7's own
  instruction, and its `Tabs`-adjacent entries are not touched here.
- It does not close `spec.default`, R2, R3, or the logical border/inset hole in
  `check:dimensions`' `PROPS`.

## Part 7 — Success criteria

1. `Tabs.behaviour.json` and `Tooltip.behaviour.json` each carry `"exceptions": []`, and a render
   suite proves it in both directions — a requirement met with no exception declared, or failed
   with one declared.
2. `check:api` fails a primitive-type divergence in either direction, proven by inducing one
   against the old code and watching it go red before the clause lands.
3. `bun run check` is green, once, at close-out — including `check:cards` with a browser
   available, since the demo card's height moved.
4. Three files are gone from `docs/superpowers/`, and this spec's own `-pending-1` suffix is
   dropped when its plan lands.
