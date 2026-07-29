# Calendar: a chip wider than its column, a title under the kebab, and a gap that fights the first hour line

**Status:** design, pending — **no plan yet.** Three defects found by hand on
`Calendar.card.html` during the structure refactor's batch 3 close-out. All three
are **pre-existing**: the refactor changed only import specifiers in
`Calendar.jsx` and `CalendarEvent.jsx`, verified by diffing the batch's whole
range over both files. Nothing here was caused by that work and nothing here was
in its scope, which forbade behaviour changes.

Every figure below was measured in headless Chromium against the real page at
1100×620, not derived by reading. The probe is not committed — it was a
throwaway, and the numbers it produced are recorded here so the plan does not
have to re-derive them.

## Defect 1: a full-width chip overruns its day column by 12px

`Release window` renders with its right edge at **755.7px** while its own day
column ends at **743.7px**.

**The mechanism is `box-sizing`, and it is not local to `Calendar`.** There is no
`box-sizing` reset anywhere in the repo — not in `styles.css`, not in
`contracts/design/` or `contracts/design-generated/`, not in any card page — so
every element in the React layer is `content-box`.
`Calendar.jsx` injects

```js
width: `calc(${(1 / p.cols) * 100}% - var(--sp-1))`,
left:  `calc(${(p.col / p.cols) * 100}% + calc(var(--sp-1) * 0.5))`,
```

which reads as *"the column, less a gutter"* — a statement about the chip's outer
edge. Under `content-box` the browser adds the chip's own padding and border on
top of that width. `CalendarEvent.jsx` sets `padding: … calc(var(--sp-1) * 1.5)`
(6px each side) and `borderLeft: var(--bw-strong)` (2px).

Measured on the overflowing chip: `computedWidth` **161.17px**, `offsetWidth`
**175px**, containing block **165.17px**. The 14px difference is exactly
12px of horizontal padding plus the 2px left border. So the calc subtracts 4 and
the box model adds 14, and the +2px `left` offset carries the remaining 12 past
the column edge.

**It is not the kebab.** The kebab is 32px wide, `position: absolute; right: 0`,
and out of flow — it cannot grow its parent. The defect reproduces on any chip
whose `cols` is 1; a half-width chip (`calc(50% - var(--sp-1))`, content 78.58px,
border box 93px in a 165px column) has enough slack to absorb the same 14px and
so does not visibly overrun. That the two chips a reader notices happen to be the
ones with kebabs is a coincidence of this demo's data, and the plan must not
encode the kebab as the cause.

**Two candidate fixes, and they are not equivalent.** Setting `boxSizing:
'border-box'` on the chip makes the injected `width` mean what it already says,
in one property. Subtracting the padding and border inside the calc would work
too and is wrong: it re-encodes `CalendarEvent`'s padding inside `Calendar`, so
the two would have to move together forever — and the division of labour those
two components are built around is precisely that `Calendar` owns *where* a chip
goes and `CalendarEvent` owns what it *looks like*.

**One question this opens and the plan should answer, not inherit:** whether any
other component in the layer sets a percentage `width` on a padded box and has
the same latent overrun. Answering it is cheap; fixing whatever it finds may not
be in this scope.

## Defect 2: the title runs under the kebab

On both chips that carry one, the title's right edge crosses the kebab's left
edge by exactly **26px** — the kebab is 32px wide at `right: 0`, and the title
span is as wide as the chip's content box because the body button is
`align-items: stretch`.

Nothing reserves room for the kebab. The stretch is deliberate and must stay:
`CalendarEvent.jsx` carries a long comment recording that it is what makes the
title's own `text-overflow: ellipsis` engage at all, and that removing it
regressed a title into a hard cut. So the fix reserves space rather than changing
the layout mode.

The two chips differ in a way the plan should keep: `Client review — Northwind`
reports `clipped: true` (its text genuinely exceeds the box, so the ellipsis is
doing work and merely lands in the wrong place), while `Release window` reports
`clipped: false` — it fits, and is simply drawn beneath the button. A fix that
only moves the ellipsis leaves the second case as it is.

## Defect 3: the gap under the day headers fights the first hour line

Measured: each day header cell has `padding-bottom: 8px`, the scroll area below
has `padding-top: 8px`, and the first hour label's top sits **4px** below the
header's bottom border.

**Only one of those two is removable.** The scroll area's `padding-top` has a
recorded reason — the hour labels are centred on their own line, so the first one
is clipped by the header without it, and `Calendar.jsx` says so in place. The day
cell's `padding-bottom` has no such constraint. The plan removes or reduces the
header's, keeps the scroller's, and confirms by measurement that the first hour
label is still fully drawn.

## Constraints

- **Every dimension is a token or a derivation of tokens.** `check:dimensions`
  scans `.jsx` and fails a bare literal, so a reserved gutter for the kebab is
  expressed against `--sp-*` or as a `calc()` over one, never as `32px`.
- **`Calendar` and `CalendarEvent` bind the `grid` pattern, so they are DOM-tested
  by hand.** Neither can appear in `COVERED`, and no render suite can be added for
  them — that rule is tied to the binding rather than to a judgement, and it is why
  these three defects were found by a person rather than by a gate. The plan closes
  with `bun run demos` and a human pass on `Calendar.card.html`.
- **No API change.** None of the three needs a new member: the box model, the
  reserved gutter and the header padding are all internal. A fix that adds a
  contract member has misread the problem.
- **The DOM-free suites still assert the tab-stop count** (`Calendar.test.jsx`),
  and `check:cards` renders the page at its declared viewport. Both must stay
  green, and neither can see any of these three defects — which is worth stating
  so nobody reads their green as coverage.

## Out of scope

A repo-wide `box-sizing: border-box` reset. It would fix defect 1 and probably
several things nobody has measured, and it would silently change the rendered
width of every padded, explicitly-sized box in three framework layers. That is a
system change with its own spec, not a rider on a Calendar fix.
