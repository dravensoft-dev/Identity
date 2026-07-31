# 10 — Angular gains the Calendar family

**Status:** design, approved 2026-07-30. Its implementation plan is
`docs/superpowers/plans/2026-07-30-10-angular-calendar-parity.md`.

## The problem

`frameworks/angular/BehaviourDelegated.json` holds two entries, `Calendar` and
`CalendarEvent`, both binding `absent`. Their reasons are unusually careful about what they
do and do not claim:

> Whether Angular should gain a schedule view is a separate, open question this entry does
> not answer: it records that React has one and Angular does not, not a decision that Angular
> never will. **Nothing has decided either way.**

This design is that decision, taken in the affirmative. Angular gains `arena-calendar` and
`arena-calendar-event`, and the file that recorded their absence is deleted.

It is not a batch of Plan D. Plan D ended when Angular Material left the repository and
Angular had a primitive for every control it once delegated; these two were never delegated
to anything, because nothing in Material solves the problem they solve — `mat-calendar` is a
month/date-selection grid, and Arena's `Calendar` is a day/hour schedule with
absolutely-positioned event blocks.

### What it closes

Measured on `ff0c596`:

| | before | after |
|---|---|---|
| React component directories | 50 | 50 |
| Angular component directories | 48 | **50** |
| `check:api` layer implementations | 98 | **100** |
| `BehaviourDelegated.json` entries | 2 | **file deleted** |

Both API contracts already exist and are normative — `contracts/api/components/Calendar.json`
and `CalendarEvent.json` were settled before Angular had an implementation to defend, which
is exactly what that arrangement is for. Nothing in the contract layer changes.

The five `calendar-*` script tokens are likewise already emitted to both layers:
`frameworks/angular/Tokens.generated.ts` exports `calendarHourH`, `calendarGutterW`,
`calendarTimeMinH`, `calendarTimeMinW` and `calendarActionsBelowMinH`. Nothing in the token
layer changes either. What was missing was only the layer that consumes them.

## The architecture, and the one thing React does that Angular cannot

React distributes chips with `cloneElement`, nesting each `CalendarEvent` **inside its day's
`role="row"` element** and injecting its `box`, `color`, `timeLabel`, `showTime` and
`actionsBelow` on the way down. Angular has no `cloneElement`, and — more decisively — no way
to project one set of children into several structural positions. `<ng-content/>` projects
once, in one place; two with the same selector is rejected by `ɵɵprojectionDef`.

**So the coordination inverts.** `arena-calendar` renders the day columns and their hour
cells and places one bare `<ng-content />` directly inside the `role="grid"` element. Each
`arena-calendar-event` host declares `display: contents`, so it generates no box of its own;
its single absolutely-positioned root resolves its containing block against the grid's padding
box — the same box the day columns divide. Each chip injects `CalendarState` and computes its
own placement, colour, time label, `showTime` and `actionsBelow`. Nothing is pushed.

This is the layer's existing idiom rather than a new one. `TableState` and `SideNavState` both
work this way: a plain `@Injectable()` in the parent's `providers:`, holding reassignable
`Signal<T>` slots pre-seeded with dummy `signal()`s, which the parent fills **in its
constructor**; children `inject()` it and read. The calendar is that shape one axis over.

### The precondition the inversion creates, and why it is load-bearing

React's day columns are `flex: 1; min-width: 0` with `border-left` on every column but the
first. Under `flex-basis: 0%`, free space is `W − (N−1)·bw`, so column 0's outer width is
`(W−(N−1)bw)/N` and every other column is that plus `bw`. **The columns are not equal.**
React does not care: a chip's `left`/`width` are percentages *of its own column*, whatever
that column turned out to be.

The moment the chip is no longer inside its column, those percentages must be taken *of the
whole grid*, and equal columns stop being incidental and become a correctness precondition.
With six columns and `--bw: 1px`, the last day's chips would land up to 5px left of their
column.

**Therefore the Angular grid is a real CSS grid with `repeat(N, minmax(0, 1fr))` tracks**, not
a flex row, with the same computed track string bound on the day-header strip so headers stay
aligned. Track sizing distributes container width equally regardless of item borders, and the
Tailwind layer is `border-box` throughout, so each column's outer box is exactly `W/N` and the
whole-grid percentages land on the track boundaries.

**No gate can see this defect.** `check:dimensions` cannot read Angular's `[style.x]` binding
form, and the grid suite asserts the keyboard rather than the geometry of a chip. It is
verified by measuring rendered `getBoundingClientRect()` against the track boundaries in real
Chromium over CDP — the same route that confirmed the side nav's geometry in Plan D's batch 6.

### What the inversion costs, and how it is paid

In React a chip is a DOM child of its day's `role="row"`. In Angular it cannot be. Each day
column therefore carries `aria-owns` — the space-separated DOM ids of that day's chips, read
from the state's registry — which restores the same accessibility tree: a chip is a child of a
row without being a cell, in both layers.

Those ids are **generated**, never the consumer's `CalendarEvent.id`. The contract calls that
member "stable identity, so a host can switch on it rather than on the title" and never
promises document-uniqueness; two calendars on one page would collide.

## The five things this design had to resolve

### 1. Both bindings are demanding, and the exception lists stay empty

`Calendar` binds `grid` with **zero** exceptions — all eight clauses (`roles.grid`,
`roles.row`, `roles.cell`, `roles.label`, `focus.roving`, `keyboard.ArrowKeys`,
`keyboard.Home`, `keyboard.End`) hold per render, and there is a suite that proves it. The
Angular primitive meets all eight the same way. The last four are behavioural — the shared
evaluator returns `null` for them, so the suite names each in its `behavioural` map and
asserts it by acting on the tree.

`CalendarEvent` is where a real divergence lands, and it is forced rather than chosen.
React declares **three** cases and derives them from whether `onClick` was passed:
`clickable` (the chip root is a `<button>`), `clickable-with-actions` (a kebab cannot nest
inside a button, so the root becomes a `<div>` and the interactive attributes move down to a
descendant `<button>` chip body), and `inert` (no `onClick` at all, pattern `none`).

**Angular cannot ask whether an `output()` has subscribers.** `OutputEmitterRef.listeners` is
private, and an `interactive` input would be a member no contract declares. This is not a new
finding: it is verbatim the reason already recorded in
`frameworks/angular/components/display/table-row/TableRow.behaviour.json`, the layer's only
`divergesFrom` before this one.

So the Angular chip always renders the interactive shape and declares **two** cases,
`clickable` and `clickable-with-actions`, with `divergesFrom: "none"`. `crossLayerAgrees`
checks `divergesFrom` before comparing sorted case names, and React's case patterns are
`{button, none}`, so the declaration is coherent.

**The resolution goes the opposite way from `TableRow`'s, and the asymmetry is principled.**
`TableRow` chose the non-interactive shape because always-a-button would have put a dead tab
stop on every row of every table. A chip is `tabindex="-1"` and is never a page tab stop, so
always-a-button costs no dead stop here — whereas always-a-div would delete Enter-into-the-chip,
which is the entire keyboard story `Calendar`'s `grid` binding leans on. The bounded
consequence: an Angular chip whose consumer bound no `(click)` is announced as a button that
does nothing, reachable only by Enter from the hour cell it overlaps.

### 2. The manifest question: one shared family manifest

Neither component has a Tailwind manifest today, and
`frameworks/angular/test/HostClassBinding.test.ts` forces a choice: every Angular primitive
directory not named in `NO_MANIFEST` must have a manifest with a display utility on the slot it
host-binds.

**Both get one, and it is a single shared manifest** at
`frameworks/tailwind/components/display/calendar/`, with `calendar-event` routed to it through
`HOST_SLOT` — the exact arrangement `table-row` and `table-cell` already have against
`Table.manifest.json`. The guard is bidirectional, so it also asserts that
`CalendarEvent.manifest.json` does not exist, which keeps the family from quietly forking.

`NO_MANIFEST` is the wrong answer for both. That exemption exists for the three SVG charts,
which have no styleable slots at all and pay for it by writing camelCase `[style]` objects that
`check:dimensions` then judges as themselves. A calendar is the opposite shape: toolbar row,
nav buttons, heading, day-header cells, weekday labels, day numbers, scroll box, hour gutter,
hour labels, hour rules, day columns, cell focus ring, now line, chip, chip body, chip title,
chip time label, kebab wrapper, action panel — twenty-odd slots of ordinary paint, of which
only `top`, `height`, `left`, `width` and `grid-template-columns` are data-driven. `Skeleton`
already settles that division: it has a manifest **and** `[style.width]`/`[style.height]` host
bindings. Recipe owns paint; binding owns position.

**What it costs, stated rather than hidden.** The specimen page is the one page in the Tailwind
layer that cannot be derived from its recipe alone — a schedule's positions are data, so the
`.card.html` hand-places a few chips with literal inline `style` attributes. That is legal
(`check:dimensions` scans `.jsx`/`.ts`/`.tsx`, never `.html`; `check:arbitrary` fails on
brackets holding raw literals, and an inline `style` attribute is not a bracket), but it means
the specimen proves the recipe and merely *asserts* the geometry. The page says so.

### 3. `check:dimensions`' worst case, and what verifies it instead

This component pair is the worst case of the gate's documented `[style.x]` blind spot: the
chips' entire geometry is computed from hour arithmetic. Two in-layer precedents exist and
**mean different things** — `Onboarding.ts` imports script tokens and emits `[style.top.px]`,
a number frozen at the generated value; the chart tooltips emit `calc()` strings against
`var(--sp-1)`, still live against the custom property.

The two axes take different answers, for reasons rather than by preference.

**Horizontal is live.** `left` and `width` are `calc()` strings carrying `var(--sp-1)` gutter
terms, identical to React's. `--sp-1` deliberately never enters JS as a number — Arena refused
to bring it in when `showsTime` needed it, folding the 18px into `calendar.time-min-w` instead
— and keeping it live means the chip gutter re-densifies with the spacing scale.

**Vertical is frozen.** `top` and `height` are `px` numbers computed from `calendarHourH`,
because they must agree *to the pixel* with the hour cells and hour rules, and JS computes
those from the same constant — `y(min)` is arithmetic on a minute-of-day and cannot be
anything else. A chip whose `top` read `calc(var(--calendar-hour-h) * k)` while its cell's came
from a JS number would slide off it under an override, with nothing failing.

**What checks it, since the gate cannot.** The geometry is built as a TS object literal using
the governed key names and returned from a `computed()`. `check-dimension-literals.mjs` scans
`top:`/`height:`/`left:`/`width:` in `.ts` object literals and resolves a bare identifier back
to its `const`, so `left` and `width` fall under the **real gate** for free, and a raw `px`
sneaking in there fails the build. On top of that, the placement suite dynamically imports the
gate's own `scanValue` and asserts it returns clean for the chip's rendered inline values, with
a small local exempt map for the two `px` projections, worded like the real one — so a stale
local entry fails its own test. That closes a documented blind spot with the gate's own code
rather than a hand-rolled regex.

### 4. The grid suite's bill is the press count, and the method is inherited

`DOUBTS.md` §1 records the measurement: mounting an 84-cell fixture costs +15 MiB over
baseline and walking it costs +60 more, because each press re-renders the grid through change
detection and the garbage is not collected during the run. What makes a grid suite affordable
is a small, explicitly-sized fixture.

The Angular suite inherits the method rather than re-deriving it: **6 day columns × 2 hour
slots, 17 presses** — `view`, `dayStart` and `dayEnd` all explicit, because a fixture whose
shape comes from a container width flips the meaning of every assertion. That is the floor at
which every invariant still means something: `hideEmptyWeekend` only ever drops Sunday, so six
columns is the minimum week, and one hour slot would make `Home`, `End`, `ArrowUp` and
`ArrowDown` vacuous. One mount, destroyed in a `finally`. At every step the suite asserts both
that focus landed where the arrow should take it and that exactly one `tabindex="0"` exists and
is that cell. Each edge clamp is one extra press.

Half of React's press count against a twelve-cell grid.

### 5. `BehaviourDelegated.json` is deleted, and the mechanism stays

With both components built, the file has nothing left to declare. It is deleted rather than
left as `{}`: a record with nothing to look at is precisely the failure mode that retired
`check:material` in Plan D's batch 6.

What stays is the mechanism. `check-behaviour.mjs` already tolerates an absent file
(`existsSync(p) ? read(p) : {}`), and its loop and its message — *"no primitive and no entry in
`BehaviourDelegated.json` — build the primitive, or record it there binding `absent`"* — are
untouched, so the first future absence fails loudly again and the file is recreated by whoever
needs it.

**The `delegatedTo` validation branch does not go with it.** It lives in `validateBinding`,
which runs for every binding in both layers, not only for delegated entries, so it survives
intact and still stands ready for the first entry that names a third-party control.

`check:compliance` never read the file at all.

## What this contradicts, on purpose

`docs/superpowers/specs/2026-07-23-8-api-contracts-design.md` states that
`BehaviourDelegated.json` *"survives holding exactly `Calendar` and `CalendarEvent`"*, and its
Plan D section repeats that the file did not go because it holds those two. That was true of
the tree Plan D produced and is the correct reading of the decision available then: nothing
had decided whether Angular should have a schedule view, so the file recorded the open
question.

This design closes the question, which removes the file's last content and therefore the file.
The earlier spec is not wrong; it is superseded on the one point it could not have settled. It
is recorded here the way batches 5 and 6 recorded their own reversals, so that a reader who
finds the older sentence knows which document is later.

## What converges, and what newly diverges

**Converges.** `DOUBTS.md` §3 carries *"DataVisuals sits at both layer roots, and only one
layer's consumers put it there"*: Angular's copy is at the layer root **by decision**, because
its narrower consumer set — the three charts alone — is an artifact of Angular having no
`Calendar` rather than a real difference. Its `Converges:` line reads *"it would converge only
if Angular ever grew a schedule view, which nothing has decided."* Angular's `Calendar` imports
`catColor`, so both layers' consumer sets now match and the entry converges.

**Newly diverges**, each to be filed in §3 with its reason:

- The projection inversion itself — React nests chips inside their day row, Angular places them
  in the grid and restores the accessibility tree with `aria-owns`.
- CSS-grid tracks in Angular against flex columns in React, and why the inversion requires it.
- `divergesFrom: "none"` on `CalendarEvent`, with the bounded consequence stated.
- The toolbar's `[actions]` wrapper always renders in Angular, which cannot detect a filled
  slot — the same class of divergence `actionsEnabled` already records.
- A chip mounted outside a calendar throws `NG0201` in Angular where React renders an unplaced
  chip. The Angular error is the better one and the injection is not weakened to match.

## What this does not do

- It does not touch the API contracts, the behaviour patterns, or the token layer.
- It does not fix `frameworks/angular/components/display/index.ts`, which exports six of the
  eleven `display` primitives — `badge`, `card`, `table`, `table-row` and `table-cell` are
  missing from it, and the layer README says a primitive missing from its barrels is not
  typechecked. Found while reading; filed in `DOUBTS.md` §1; out of scope here.
- It does not touch the open debt in §1 that neighbours this work: `--panel` and
  `--surface-card` both resolving to `var(--color-base-200)`, `Select.multi`'s `change: string`
  contract defect, or an unimported projection marker resolving to null.
