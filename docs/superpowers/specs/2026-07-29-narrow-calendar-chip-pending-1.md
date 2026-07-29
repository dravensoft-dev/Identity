# Calendar: a chip too narrow for the time label it draws

**Status:** design, pending — **no plan yet.** Found by measuring every chip on
`Calendar.card.html` after the chip box-model fix landed, while ruling on a
question that fix left open. The question was about the kebab; the measurement
says the kebab is the smaller half of it.

Every figure below was measured in headless Chromium against the real page at
1100×620, driven through `scripts/lib/chromium.mjs` and `scripts/lib/cdp.mjs`.
The probes are not committed — they were throwaways, and their numbers are
recorded here so the plan does not have to re-derive them.

## What the measurement says

A chip's time label needs **78.02px** on one line. It is drawn at
`--dz-text-2xs`, and that token is **10px in both densities** — `density.compact.json`
restates the same 10 — so the figure does not move with density. `10:00 – 11:30`
and `09:00 – 09:30` both measure 78.02px; the mono digits make every time range
the same width.

At 1100×620 a day column is 166px, so a chip is **161.2px** wide at `cols: 1` and
**78.6px** at `cols: 2`. Subtracting the chip's own 6px of padding a side and its
2px left border leaves a content box of 147.2px and **64.6px**. With a kebab, the
34px reserve comes out too, leaving **36.6px**.

Every chip on the page:

| Chip | cols | Content box | Kebab | Title truncated | Time label lines |
|---|---|---|---|---|---|
| `Client review — Northwind` | 2 | 36.6px | yes | **74%** | **3** |
| `Design critique` | 2 | 64.6px | no | 18% | **2** |
| `Onsite — Acme` | 2 | 64.6px | no | 18% | **2** |
| `Retro` | 2 | 64.6px | no | 0% | **2** |
| `Security sync` | 2 | 64.6px | no | 7% | — (too short) |
| `Release window` | 1 | 119.2px | yes | 0% | 1 |
| `Migration planning`, `Demo day`, `On-call handover` | 1 | 147.2px | no | 0% | 1 |
| `Standup` ×5 | 1 | 147.2px | no | 0% | — (too short) |

**So the wrapping is not the kebab's doing.** Every `cols: 2` chip that draws a
time label wraps it, kebab or no kebab: 64.6px of content against a label that
needs 78.02px. The kebab makes its one chip worse — three lines instead of two —
but the defect is already there on the three chips that carry no kebab at all.
A spec that treated this as a kebab problem would fix one chip out of four.

**Titles were already truncating at `cols: 2` before any kebab**, at 18%. That is
an ellipsis doing its job on a narrow column, and it is not a defect.

## The rule

**A chip draws its time label only when it has room for it in both axes.**

`Calendar` already makes half of this decision. `Calendar.jsx:255` computes

```js
showTime: rawH >= 32,
```

and injects it into every chip: a chip shorter than 32px does not draw a time
label, because there is no room for a second line. There is no width counterpart,
so a chip 78.6px wide draws a label needing 78.02px into a 64.6px box and lets it
wrap. The change is to add the term that was never there.

**Suppressing the label is right rather than a concession, and the reason is that
the label is redundant.** A chip's position on an hour grid already states when the
event is; the label is a convenience for reading it without tracing across to the
gutter. That is why the vertical threshold was acceptable when it was written, and
it is the same argument one axis over. Nothing else on the chip is redundant: the
title is the only thing that says *what*, and the ramp colour is the only thing that
says *which entity*.

## Where the width comes from

`Calendar` already measures its own container — `useContainerWidth` at
`Calendar.jsx:19`, which it uses at line 30 to choose the day or week view — and it
already knows each placement's `cols`. A chip's outer width follows with no second
measurement and no new hook:

```
gridWidth  = containerWidth − GUTTER            (GUTTER is calc(var(--sp-1) * 14) = 56px)
dayColumn  = gridWidth / days.length
chipWidth  = dayColumn / cols − sp1
```

Checked against the measurement: 1100 minus the card's 24px body padding a side
gives a 1052px container; 1052 − 56 = 996; 996 / 6 days = 166; 166 − 4 = **162**
against a measured **161.2**, and 166 / 2 − 4 = **79** against a measured **78.6**.
The derivation runs about a pixel high because each day row after the first carries
a 1px left border the arithmetic does not model. The threshold below is chosen with
enough slack that a one-pixel error cannot change its verdict.

**The threshold compares against the chip's OUTER width, not its content box, and
that is deliberate.** Computing the content box would require `Calendar` to know
`CalendarEvent`'s padding, its border and its kebab reserve — the same re-encoding
that was rejected when the box-model defect was fixed, and for the same reason:
`Calendar` owns *where* a chip goes and how big it is, `CalendarEvent` owns what it
looks like. An outer-width threshold is a statement `Calendar` is entitled to make.

**While the width is unknown, the label draws.** `useContainerWidth` reports `null`
until it has measured — on a server, and on the first client frame — and in that
state the width term is treated as satisfied. This keeps `renderToStaticMarkup`
output identical to today's, so the DOM-free suites and any consumer that renders on
a server see no change, and it matches the posture the component already takes
elsewhere: draw, then correct. The correction after measuring removes a line from
the four narrow chips.

## The thresholds become tokens

`rawH >= 32` is a bare literal. It passes `check:dimensions` because that gate reads
governed CSS properties and never a comparison, so the number sits in the source with
nothing holding it to the design layer — and that is part of why this defect was hard
to see: half the decision was invisible to the token system, and the other half did
not exist.

Both thresholds move into `contracts/design/component.json`, into the existing
`calendar` group beside `hour-h`, flagged `$extensions["com.dravensoft.arena"].script`
so they emit as bare numbers into each layer's `Tokens.generated.*` — the mechanism
`calendarHourH` already uses, and the one `check:script-tokens` already holds.

- **`calendar.time-min-h`** — the existing 32, moved rather than changed.
- **`calendar.time-min-w`** — **96px**, derived: the label needs 78.02px, the chip
  adds 14px of padding and border around it, giving 92.02px, rounded up to the next
  step of the 4px spacing scale. At 96px outer the content box is 82px, four pixels
  clear of the label. Below it: 78.6px, which is the case this spec exists for.

Neither token carries a compact-density override, because neither needs one: the
`calendar` group has none today, and the label's width does not move with density.

## Constraints

- **No API change.** `showTime` is injected by `Calendar` and appears in no contract
  and in no `.d.ts` — `CalendarEvent.d.ts` declares `colorId` and the consumer-facing
  members, never the injected ones. A fix that adds a contract member has misread the
  problem.
- **Every dimension is a token or a derivation of tokens.** The two thresholds are
  script-flagged DTCG tokens; `check:script-tokens` asserts the emitted modules match
  the source and the CSS, and `check:duplicate-constants` fails a number declared in
  both layers.
- **`Calendar` binds the `grid` pattern, so it is DOM-tested by hand.** It cannot
  appear in `COVERED`, no render suite can be added for it, and the retired
  grid-keyboard suite is not coming back at its measured 164 MiB. Verification is the
  checklist in `CalendarEvent.prompt.md`, driven in a real browser, plus a throwaway
  CDP probe reproducing the table above.
- **The DOM-free suites assert on `renderToStaticMarkup`**, where the container width
  is `null`. They must stay green unchanged, which the unmeasured-draws rule
  guarantees; a plan that finds itself editing those assertions has broken that rule.
- **Editing a component `.jsx` means running `bun run build:demos` in the same tree**,
  or `bun run demos` shows the pre-fix component while the suites prove the fix.

## What this does not fix, and why

**The title in a `cols: 2` chip that carries a kebab stays truncated at 74%.** Its
content box is 36.6px, and no text is legible in 36.6px. Dropping the time label
gives that chip back a line of height, not a pixel of width.

Every way of buying it width takes something away:

- **Hiding the kebab until hover or focus** removes a control from a touch reader
  entirely, and the chip sits inside a grid where hover is not a given.
- **Not reserving the kebab's band below some width** puts the title back underneath
  an opaque button, which is the defect the reserve was added to fix.
- **Not rendering the kebab below some width** makes `actionsEnabled` a request
  rather than a guarantee, and silently removes the only route to the consumer's
  actions.
- **Moving the kebab to its own row below the title** does return the full 64.6px,
  and it works only while the chip is tall enough for two rows — so a 26px chip
  still needs the reserve, and the chip gains a second layout mode conditioned on a
  width it does not measure.

The last is the only one that does not remove something, and it is a larger change
than this spec: it is a second layout inside `CalendarEvent`, driven by a threshold
`Calendar` would have to inject, with its own by-hand verification. **It is a
candidate for its own spec, not a rider on this one.** Until then the trade is
recorded rather than hidden: a narrow chip with actions shows a truncated title, and
the panel behind the kebab is where the detail lives.

## Out of scope

Any change to how overlapping events are placed. `cols: 2` at a 166px column is
what produces a 78.6px chip, and widening chips by placing overlaps differently —
cascading them, or letting them overlap visually — is a different component
decision with different consequences for readability and hit targets.
