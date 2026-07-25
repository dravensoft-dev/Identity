# Plan 8C4 — the `dialog-modal` family, and Plan C's last four contracts

Design, 2026-07-25. Branch `api-contracts-8c4`, cut from `8bd6388` (main; the 8C3 merge).

This spec covers two halves that belong in one plan because the first settles the markup
the second describes. **Half B is new design work and is why this spec exists**; Half A
derives from `2026-07-23-8-api-contracts-design.md` and adds no design of its own.

- **Half A — the API contract.** `Dialog`, `Menu`, `Pagination`, `SideNav`: the four
  subjects Plan C has left. `check:api` **42/62 → 46/66**.
- **Half B — accessibility.** The `dialog-modal` pattern, met in React for the first time,
  across `Dialog`, `ConfirmDialog` and `Onboarding`.

## What this measured before proposing anything

Every figure below was read off the tree at `8bd6388`, not recalled.

### Plan C's remaining set is exactly four

46 `.jsx` under `frameworks/react/components/` (excluding `*.card.entry.jsx`), 20 with a
matching directory under `frameworks/angular/primitives/`, which is the 26-key set of
`behaviour-delegated.json` minus `Switch` — twenty-five subjects, twenty-one contracted.
`Dialog`, `Menu`, `Pagination` and `SideNav` remain. All four are single-layer, for the
reason 8C1's, 8C2's and 8C3's were: Angular delegates the control to Material.

### The `dialog-modal` family is broken in React and sound in Angular

`dialog-modal` has seven requirements. Read from the bindings:

| component | layer | exceptions |
|---|---|---|
| `Dialog` | React | `roles.label`, `focus.onOpen`, `focus.onClose`, `focus.trap`, `keyboard.Escape` |
| `ConfirmDialog` | React | the same five, plus `roles.element` |
| `Onboarding` | React | the same five |
| `arena-confirm-dialog` | Angular | `roles.element` alone |
| `arena-onboarding` | Angular | **none** |

**This is one defect written three times, not three defects.** The same five requirements
fail in the same way in all three React components, and the Angular layer has already
solved it. That asymmetry is the largest live structural divergence between the layers,
and it is what makes a single shared fix the right shape rather than a convenience.

### The verification for Half B already exists, and it is pointed the right way

`frameworks/react/test-dom/behavioural.test.jsx` asserts, today, that each of these
defects **is still present** — seven tests whose whole purpose is to fail the day someone
fixes the component without retiring the exception. Its own header prescribes the handoff:
*"flip the assertion to `assert.equal(closed, true)`. The record stays true."*

`dialog-modal.test.jsx` sits beside it, declares the four behavioural verdicts, and calls
`assertPattern`, which refuses to let a binding, a declared verdict and an assertion
disagree. `Dialog:react` and `ConfirmDialog:react` are already in `COVERED`.

**So Half B cannot be half-done.** The exception, the verdict and the assertion move
together or the gate fails. This is the compliance layer finally being exercised in the
direction that justifies it: *an exception can expire.*

`Onboarding:react` is **not** in `COVERED` and has no suite. It gains both.

### Angular's focus trap is a shared module, and the React fix mirrors it

`frameworks/angular/primitives/focus-trap.ts` exports `handleOpenTransition` and
`trapTabKey`; `arena-onboarding` and `arena-confirm-dialog` both consume it, and
`frameworks/angular/test/onboarding-focus-trap.test.ts` proves it. The React side has no
equivalent and three components that each need one.

## Half B — the design

### A shared hook, not three implementations

`frameworks/react/use-dialog-modal.js`, beside `use-container-width.js` — the repo's
existing precedent for a shared React runtime helper, and the direct mirror of Angular's
`focus-trap.ts`. It provides the four behaviours as one unit:

- **`focus.onOpen`** — focus moves to the first focusable element inside the panel on open.
- **`focus.trap`** — Tab and Shift+Tab cycle within the panel and cannot leave it.
- **`keyboard.Escape`** — Escape reports dismissal through the component's own existing
  dismissal channel, never through a new member. `Dialog` has `onClose`; `ConfirmDialog`
  has `cancel`; `Onboarding` has `skip`, which is exactly what Angular routes Escape to.
- **`focus.onClose`** — focus returns to the element that held it when the panel opened.

The alternative — three implementations — was rejected: it triples the defect surface and
guarantees the drift `components-divergences.md` exists to record. `CLAUDE.md`'s rule that
components are self-contained is about **CSS classes**, not about JS helpers, and
`use-container-width.js` already settles that reading.

### `title` becomes required, in both layers where the component has two

`roles.label` needs **no new member**: `Dialog` and `ConfirmDialog` both already declare
`title`, and the defect is only that it renders as a plain div with no `id`, so nothing
points an `aria-labelledby` at it. Wiring that is markup.

But `title` is **optional** in both, so a dialog that omits it still has no accessible
name. `title` therefore becomes **required, with a runtime guard**, following
`SegmentedControl.ariaLabel` and `Table.label`.

**The cost is stated rather than buried.** `ConfirmDialog` is already contracted and is a
**two-layer** component, so this is a breaking change to a shipped contract that moves
`arena-confirm-dialog` and its suite as well. **8C4 is therefore the first Plan C batch to
touch an Angular component**, and that must be sequenced inside a single task so
`check:api` never observes a half-moved pair.

`Onboarding` is one level down and costs **a second shipped two-layer contract**, which is
worth seeing before agreeing to it. Its `aria-label` is `step.title`, and
`api/types/onboarding-step.json` declares all three of `eyebrow`, `title` and `body`
optional — so the requirement is met when the caller titles the current step and unmet
when they do not. Making the step's `title` required is a change to `OnboardingStep`, a
type both layers share, and `arena-onboarding` moves with it. So the batch's Angular work
is **two components, not one**: `arena-confirm-dialog` and `arena-onboarding`.

That is the honest reading, and it is the plan's first blocking decision rather than this
spec's: either both step titles and dialog titles become required and the batch carries two
two-layer breaking changes, or `Onboarding`'s `roles.label` keeps an exception whose reason
names the untitled-step case — the variant limit `Skeleton` and `Table` already carry, for
the third and fourth time. **The other four `dialog-modal` requirements are unaffected
either way** and are retired for all three components regardless, which is the bulk of the
value.

### What is deliberately *not* fixed

**`ConfirmDialog`'s `roles.element` exception stays.** It renders `role="alertdialog"`
rather than `role="dialog"`, and the exception's own reason argues that is *more* correct
for a destructive confirmation, APG treating `alertdialog` as a specialisation. That is a
decision the pattern cannot express, not a defect — and the Angular primitive makes the
same choice, so the layers agree. Retiring it would be a regression dressed as progress.

## Half A — the four contracts

Measured with `reactSurface()` at `8bd6388`. Three read; one throws.

- **`Dialog`** — 7 members, no heritage, no platform type: `open` (required boolean),
  `onClose` (event, no payload), `title`, `eyebrow`, `children` and `footer` (slots),
  `width` (number). The cleanest of the four. `title` becomes required here by Half B, and
  since `Dialog` is uncontracted the change costs nothing beyond its own call sites.
- **`Pagination`** — `page` and `pageCount` (required numbers), `onChange` (event carrying
  a number), and `style`, an R4 platform type to drop.
- **`Menu`** — `trigger` (required slot), `items` (required array of `MenuItemDef`),
  `align` (an inline enum to declare), and `style` to drop. **`MenuItemDef` is the hardest
  object in the batch**: it declares `icon?: React.ReactNode` and `onClick?: () => void`,
  and R1 admits only primitives and enums as fields of a predefined object. The icon
  follows the single-icon convention already applied to `Button` and `IconButton` — a
  Phosphor class-name string Arena draws. The per-item `onClick` is the `ToastAction`
  problem at array level and the plan must choose its shape explicitly.
- **`SideNav`** — **throws**, on `onNav?: (id: string, event: React.MouseEvent) => void`:
  an event takes one payload, and this declares two parameters, one of them a platform
  type. It also carries `extends React.HTMLAttributes<HTMLElement>`, so it is the batch's
  only **D1 flatten**. `SideNavItem` has the same R1 problem as `MenuItemDef`
  (`icon`/`label` are `React.ReactNode`), and `ariaLabel` is declared optional while its
  own doc comment says *"Required in practice"* — the `SegmentedControl.ariaLabel` shape,
  and the plan should settle it the same way.

**The `onNav` second parameter is a real capability, not an oversight**, and the plan must
price it before removing it: its doc comment records that an item with `href` is a real
anchor, so a single-page app calls `event.preventDefault()` and routes itself. Dropping
the event object removes that. Whatever replaces it is a decision for the plan's blocking
first task, not for this spec.

## Ordering

**Half B first, Half A second.** Half B changes `Dialog`'s markup — an `id` on the title,
`aria-labelledby`, focus handling — and a contract must describe settled markup. This is
the lesson 8C3 paid for with `Calendar` and `Table`, where keyboard navigation and the
contract were split into two tasks each in that order.

Neither `ConfirmDialog` nor `Onboarding` is a Plan C subject — both are already contracted
and both have an Angular primitive. They add no contract to the ladder, which stays
**46/66**; what they add is a member's required-ness in a contract that already ships, and
the Angular work that comes with it.

## Testing

- Half B's React work is verified by **inverting** the assertions in `behavioural.test.jsx`
  and flipping the verdicts in `dialog-modal.test.jsx`, with the exceptions retired in the
  same change. `assertPattern` enforces that they move together.
- `Onboarding:react` joins `COVERED` with a new suite. None of the three binds `grid`, so
  the standing hand-test rule does not apply and render suites are permitted.
- **Real-browser verification is required for the focus trap and is not optional.**
  happy-dom's `focus()` focuses non-focusable elements, so a DOM stub cannot prove a trap
  — it will report success against a component that traps nothing. Plan 8C3 was bitten by
  exactly this twice, and both times only Chromium driven through CDP
  (`scripts/lib/chromium.mjs` + `cdp.mjs` + `static-server.mjs`) found the truth. One
  probe gotcha carried forward: a raw `Input.dispatchKeyEvent` for Enter does not fire a
  button's activation; the keyDown needs `text: '\r'`.
- Half A follows the established contract-task shape: R4 proofs induced asymmetrically
  with sha256 verified byte-identical after restore, and a suite per component.

## Costs accepted

1. **Breaking changes to shipped, two-layer contracts — up to two of them.**
   `ConfirmDialog.title` required moves React, Angular and the Angular suite together, and
   `OnboardingStep.title` required would move a second pair. The plan's first blocking
   decision is whether to pay the second or keep `Onboarding`'s `roles.label` excepted.
2. **Angular work in a Plan C batch**, which no previous batch had — one component, or two
   depending on that decision.
3. **The isolated DOM process grows**, from `Onboarding`'s new suite.
4. **`SideNav.onNav` loses its event object** unless the plan finds a shape that keeps it,
   and with it the single-page-app `preventDefault()` route.
5. **`Menu` and `SideNav` lose per-item nodes** — `icon` and `label` become strings under
   R1 and the single-icon convention, exactly as every migrated component before them.

## What this plan does not do

- It does not cut a release. `[Unreleased]` already carries 972 lines from plans B through
  8C3, and cutting is a separate decision.
- It does not start Plan D. Touching `arena-confirm-dialog` is one component moving with
  its contract, not the Angular layer being built.
- It does not fix `Tabs`, which still binds `tabs` with all eight requirements excepted and
  is the largest untouched accessibility gap once this batch lands.
- It does not make `Tooltip` keyboard-reachable.
