# 10 — Angular gains the Calendar family: implementation plan

Executes `docs/superpowers/specs/2026-07-30-10-angular-calendar-parity-design.md`. Read it
first; this file states the order of work and the gate to watch at each step, not the reasons.

Branch: `angular-calendar-parity`, from `ff0c596`.

## Task 1 — the shared arithmetic and the state

**New** `frameworks/angular/components/display/calendar/CalendarInternals.ts` — a port of
`frameworks/react/components/display/calendar/CalendarInternals.js` with no Angular imports:
`showsTime`, `stacksActions`, `zonedParts`, `isoDateOf`, `minutesOf`, `formatHM`, `parseHM`,
`addDays`, `weekdayOf`, `startOfWeek`, `todayIso`, `nowMinutes`, `placeEvents`, `layoutDay`,
`defaultDayStart`, `formatDate`, `rangeTitle`. The `Intl` formatter caches stay module-level
`Map`s — they are pure functions of their key, which is what makes a process-wide cache safe
across the whole shared Angular run.

**New** `.../calendar/CalendarState.ts` — `@Injectable()`, the `TableState` idiom: reassignable
`Signal<T>` slots pre-seeded with dummy `signal()`s, filled by `Calendar`'s **constructor**.

```
zone, days, startMin, endMin, columnWidth      Signal slots
chips           Signal<readonly object[]>      contentChildren(CalendarEvent)
placements      Signal<ReadonlyMap<object, ChipPlacement>>   keyed by INSTANCE
cursor / clamped / isStop(day, hour)           roving focus, TableState shape
focusCursorCell: () => void                    Escape target, SideNavState.activate shape
register(chip, {domId, focus}) / release(chip) registerRow/releaseRow + DestroyRef.onDestroy
placementOf(chip) / slotWidth(cols) / ownedIds(dayIso)
focusOverlapping(dayIndex, from, to): boolean  Enter target
```

Both files sit in `calendar/` and not in `display/`: narrowest level containing all consumers,
and a compound family counts as its parent. `TableState.ts` in `display/table/`, imported from
`table-row/` and `table-cell/`, is the precedent.

The generated DOM ids come from a module-level `let seq = 0`. It must be a `let`:
`check:duplicate-constants` matches `const NAME = <number>;` and would otherwise pair it with
anything the React layer names the same.

**Gate:** `bun run check:duplicate-constants`, `bun run build:angular-tests`.

## Task 2 — the shared Tailwind manifest

**New** `frameworks/tailwind/components/display/calendar/Calendar.manifest.json` with slots for
the whole family — the chrome (`root`, `toolbar`, `nav`, `today`, `heading`, `actions`,
`headStrip`, `dayHead`, `weekday`, `dayNumber`, `dayNumberToday`, `scroll`, `body`, `gutter`,
`hourLabel`, `rule`, `grid`, `column`, `cell`, `now`, `nowDot`) and the chip (`chip`, `body`,
`title`, `time`, `kebabWrap`, `panel`).

Three constraints on its contents:

- **`chip` carries `min-h-6.5`.** React writes `height: max(calc(var(--sp-1) * 6.5), …)`;
  Angular writes `[style.height.px]` and lets `min-height` win on an absolutely-positioned box.
  Same rendered result. 26px is the value `DOUBTS.md` records as leaving the shortest chip
  exactly as it rendered before — do not lower it, and it is an **outer** height under this
  layer's global `border-box`.
- **`gutter` carries `w-[var(--calendar-gutter-w)]`**, which keeps
  `check:check-tailwind-coverage`'s `EXCLUDED` reason for that token true. Do **not** render
  `--calendar-hour-h` from the manifest; its reason says script-readable only.
- **No `hover:` anywhere.** `check:states` maps the manifest to its mirrored React sources and
  flags a state family the source does not implement. `Calendar.jsx` has `onFocus`/`onBlur`, so
  `focus:`/`focus-visible:` are permitted and the cell's ring belongs on the manifest — which
  lets the Angular component drop React's `gridFocused` state entirely. Neither React file
  implements hover.
- **The chip's padding must match React's exactly** (`calc(var(--sp-1) * 1) calc(var(--sp-1) *
  1.5)`). `showsTime`'s threshold is not independent of it, and `stacksActions`' is a sum of
  measured parts — one step of difference makes both quietly wrong with nothing checking.

**New** `.../calendar/Calendar.card.html` specimen. Hand-place a few chips with literal inline
`style` attributes and say in the subtitle that the geometry is asserted rather than derived.
Declare a viewport and let `check:cards` tell you the size to declare — do not compute it.

**Then** `bun run build:tailwind` to emit `Calendar.manifest.ts`.

**Also** add `Calendar` to `SOURCE_OVERRIDES` in `scripts/check/arena/check-manifest-states.mjs`, mapping to
both React sources (`display/calendar/Calendar.jsx` and
`display/calendar-event/CalendarEvent.jsx`) — the `Table` entry is the shape.

**Gates:** `check:tailwind`, `check:tailwind-generated`, `check:coverage`, `check:arbitrary`,
`check:radius`, `check:states`, `check:cards`.

## Task 3 — `arena-calendar`

**New** `.../calendar/Calendar.ts`, `Calendar.variants.ts`, `Calendar.behaviour.json`,
`Calendar.prompt.md`, `index.ts`.

Host bare, `host: { style: 'display: contents' }`: the root must be a real `<section>` landmark,
which is the same carve-out `activity-feed` takes for its `<ul>`. A bare host still declares a
display or it collapses to the UA-default inline box.

Template order: `<section>` → toolbar (`nav`/`Today`/`nav`/`<h2>`/`<ng-content
select="[actions]"/>`) → day-header strip → scroll box → body → hour gutter + `role="grid"`.
Inside the grid: hour rules, then `@for` day columns (`role="row"`, `aria-label`, `aria-owns`)
each holding its `@for` of `role="gridcell"`, then the bare `<ng-content />`, then the now line.

The grid and the header strip both bind `[style.gridTemplateColumns]` to the same computed
`repeat(N, minmax(0, 1fr))` string. **There is no overlay wrapper element** — the chips'
containing block is the grid itself, which is the box the tracks divide; a wrapper would be a
second box to keep in step. An out-of-flow child of a grid container occupies no track.

Keyboard, on the grid's `(keydown)`, mirroring `Table.onKeydown`:

- target `role` is not `gridcell` → fall through to the Escape clause.
- Arrow keys move and clamp; `Home`/`End` move within the day; `Enter` calls
  `state.focusOverlapping(...)` for the cursor cell's hour range.
- `Escape` on **any** non-`gridcell` target calls `state.focusCursorCell()`, with **no identity
  guard against the registry**. Read `DOUBTS.md` around line 3941 before touching that clause —
  narrowing it is how the only defect this handler has ever had was introduced, because the
  kebab is not in the registry. The `gridcell` branch returns first, so nothing else reaches it.

Cursor re-focus is an `afterRenderEffect` that reads `state.clamped()` first, exactly as
`Table.ts` does — `afterNextRender` would not re-run on a cursor change.

The 60-second tick is `afterNextRender(() => { const id = setInterval(…);
destroyRef.onDestroy(() => clearInterval(id)); })`. The `onDestroy` is not optional: the whole
Angular suite shares one process, and a leaked interval outlives the file that made it.

There is no required-content guard. `Calendar`'s content slot is optional by the compound-root
rule — a calendar with no children is a legitimately empty schedule.

`angularSurface` (which `check:api` uses) throws on any public class member that is not
`input`/`output`/`model` and on any method without `protected`/`private`. Every internal signal,
every handler and the `inject(CalendarState)` field carries a modifier. `Table.ts` is the model.

**Gates:** `check:structure`, `check:api`, `check:behaviour`, `check:dimensions`.

## Task 4 — `arena-calendar-event`

**New** `.../calendar-event/CalendarEvent.ts`, `CalendarEvent.variants.ts` (importing the
family manifest, as `TableRow.variants.ts` imports `Table.manifest`),
`CalendarEvent.behaviour.json`, `CalendarEvent.prompt.md`, `index.ts`.

Host bare, `display: contents` — the root is a `<button>` in one case and a `<div>` in the
other, and a host cannot change tag. `IconButton.ts` is the precedent.

| case | root | interactive element |
|---|---|---|
| `clickable` | `<button type="button">` | itself: `aria-label="title, date, time"`, `aria-disabled` when disabled, `tabindex="-1"` |
| `clickable-with-actions` | `<div>` | descendant `<button>` body; kebab is `<arena-icon-button icon="ph-bold ph-dots-three-vertical" label="Actions" size="sm" [tabStop]="false">` inside an absolutely-positioned `<span>` |

Geometry, from a `computed()` returning an object literal with the governed key names so
`check:dimensions` really scans it:

```
left   = `calc(${((di + col/cols) / N) * 100}% + calc(var(--sp-1) * 0.5))`
width  = `calc(${(1 / (cols * N)) * 100}% - var(--sp-1))`
top    = y(startMin)                 // px number
height = y(endMin) - y(startMin)     // px number
```

`showTime`/`actionsBelow` are computed by the chip from its **pre-floor** `rawH` and
`state.slotWidth(cols)`. Preserve `showsTime`' `slotWidth === null` → wide-enough branch:
happy-dom ships no `ResizeObserver` that fires, so every suite renders in that branch.

Out of window, `placementOf` returns `null` and `@if (box(); as box)` renders **nothing at
all** — no element, no id, no `aria-owns` entry.

The registered `focus()` must point at the **focusable element**, not the root, or Enter on a
paneled chip moves focus nowhere.

The chip's own click handler calls `stopPropagation()`, or a chip click also fires the day
column's `dateClick`. `arena-icon-button` already stops its own.

Escape while the panel is open must `stopPropagation()`, or one Escape closes the panel **and**
sends focus back to the cursor cell.

**No `defaultPanelOpen`.** React needs it because `renderToStaticMarkup` cannot click, and
`check:api` never sees it (it reads the `.d.ts`). `angularSurface` reads the real class, so it
would be an undeclared member. TestBed can click the kebab.

The non-empty `id`/`title`/`start`/`end` guard is a `computed` read by the template, the
`Table.gridLabel` shape — `input.required` proves only that something was bound.

`CalendarEvent.behaviour.json` declares `component`, `divergesFrom: "none"` and the two cases,
with a `reason` stating the bounded consequence.

**Also** add `./calendar` and `./calendar-event` to
`frameworks/angular/components/display/index.ts`. Do **not** also add the five primitives
missing from that barrel — file them in `DOUBTS.md` §1 instead.

**Gates:** `check:structure`, `check:api`, `check:behaviour`, `check:dimensions`,
`check:duplicate-constants`.

## Task 5 — the suites

Watch each fail before it passes.

**`.../calendar/Calendar.grid.test.ts`** — 6 columns × 2 slots, 17 presses.
`view="week" anchorDate="2027-03-15" timeZone="UTC" dayStart="09:00" dayEnd="11:00"`, two
chips. Budget: 2 clamps, 11 walk, 3 (`End`, right clamp, down clamp), 1 `Home`. One mount,
`destroy()` in a `finally`. At each step assert focus landed **and** exactly one `[tabindex="0"]`
exists and is that cell, through `assertSameNode` — never `assert.equal` on a node
(`check:assertions`). Close with `assertPattern` and the four behavioural keys;
`assertPatternCases` throws on a binding with no cases.

**Do not touch `--bp-md` in that file.** `readBreakpoint` caches by name in a module-level Map
shared by the whole run; `Table.cases.test.ts` caches `768` and `PageHead.variants.test.ts`
asserts it on a cache hit. If a derived day view is needed, copy `stubResize` from
`Table.cases.test.ts` and set `--bp-md` to exactly `'768px'`, restoring both in a `finally`.

Header comment: one block, at most ten lines, recording the transposition (a `role="row"` is a
day column) and the fixture-size rule.

**`.../calendar/Calendar.placement.test.ts`** — 0 presses. Whole-grid `left`/`width` for a
`cols: 2` chip in day 3 of 6; `top`/`height` against `calendarHourH`; an out-of-window chip
renders no element; `showTime` across `calendarTimeMinH` and a stubbed narrow container;
`actionsBelow`; `aria-owns` matching the rendered ids; day view and week view. Plus the
dimension guard: dynamically import `scanValue` from `scripts/check/arena/check-dimension-literals.mjs` by
file URL — the way `frameworks/angular/test/Compliance.ts` already imports `.mjs` — and assert
it returns clean for the chip's rendered `style.left/width/top/height`, with a small local
exempt map for the two px projections.

For the now-line, derive `dayStart`/`dayEnd` from `nowMinutes('UTC')` at test time and anchor on
`todayIso('UTC')`.

**`.../calendar-event/CalendarEvent.cases.test.ts`** — `assertPatternCases` with exactly the two
declared names, each mounted **inside** a minimal `arena-calendar`. Mirror
`TagAndChipCases.dom.test.jsx` beat for beat: Enter/Space not intercepted, no `aria-disabled`
when available, one click reaches the output exactly once, `disabled` sets `aria-disabled="true"`
and not the native attribute and swallows the click. Then the panel round trip React can only
check by hand: kebab click → panel in the tree and focus inside it; `ArrowRight` → kebab,
`ArrowLeft` → back; `Escape` → closed, focus on the kebab, and the event did **not** reach the
grid.

**Constant names:** not `DAYS` and not `SLOTS` — `Calendar.gridKeyboard.dom.test.jsx:24-25`
owns both names with those values, and `check:duplicate-constants` walks test files. Use
`DAY_COLUMNS` and `HOUR_SLOTS`.

Every fixture `destroy()`ed; every document mutation undone in a `finally`.

Cap the run:

```bash
systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=0 \
  bun test build/angular-test/angular > /tmp/angular.log 2>&1   # a file, never a pipe
```

**Gates:** `check:compliance`, `check:assertions`, and the suites themselves.

## Task 6 — the demo page

**New** `.../calendar/Calendar.card.html` + `Calendar.card.entry.ts`, built by
`bun run build:angular-demo`. **No `@dsCard`** — the bundle is git-ignored and a blank page
passes a viewport check by having nothing to overflow.

Add `'Calendar'` to `PAGED` in `scripts/check/angular/check-angular-demos.mjs` (19 → 20), and
`'calendar-event': { manifest: 'Calendar.manifest.json', slot: 'chip' }` to `HOST_SLOT` in
`frameworks/angular/test/HostClassBinding.test.ts`.

Everything the two `.prompt.md` checklists verify — the panel over a short chip, the kebab
moving below the title at ≥56px, the title ellipsising before the kebab, chips not crossing a
column border — is invisible to happy-dom, and this page is now the only place a person can
drive the Angular pair.

**Gates:** `check:angular-demos`.

## Task 7 — the bookkeeping

- Delete `frameworks/angular/BehaviourDelegated.json`. Leave the reading loop and its message in
  `check-behaviour.mjs` alone, and leave the `delegatedTo` branch in
  `scripts/lib/behaviour-contracts.mjs` alone — it runs for every binding, not only delegated
  ones.
- `scripts/lib/behaviour-contracts.test.mjs:161` — `48` → `50`.
- `scripts/check/arena/check-compliance.mjs` `COVERED` — add `'Calendar:angular'` and
  `'CalendarEvent:angular'`.
- `scripts/check/tailwind/check-tailwind-coverage.mjs` — the five `calendar-*` `EXCLUDED` reasons are written
  about React alone; make them name both layers.
- Prose, each read as a claim that may now be false:
  - `CLAUDE.md` — the `BehaviourDelegated.json` sentences, and "The only components with no
    manifest are `Calendar` and `CalendarEvent`", which becomes false. Measure the file with
    `.length`, never `wc -m`; it stood at 59,922 of 60,000 and these edits should return
    characters rather than spend them.
  - `frameworks/angular/README.md` — the "two exceptions are absent rather than delegated"
    section, including the `python3` count command that reads the deleted file.
  - `contracts/behaviour/README.md` — the "Angular, absent" bullet.
  - `DOUBTS.md` §3 — mark the `DataVisuals` placement entry converged, and file the five new
    divergences the spec names.
  - `DOUBTS.md` §1 — file the `display/index.ts` barrel gap as found-not-fixed.
  - `CHANGELOG.md` under `[Unreleased]` — added, plus the removal of `BehaviourDelegated.json`.
    The existing `[Unreleased]` line claiming the file "holds only `Calendar` and
    `CalendarEvent`" describes a tree that will no longer exist; it must be corrected in the
    same edit, because `[Unreleased]` is not frozen.
- Run the cross-file grep `CLAUDE.md` prescribes, once for `Calendar` and once for
  `CalendarEvent`, and read every hit.

## Verification

```bash
bun run check          # 28 steps, all green
```

The counter at `behaviour-contracts.test.mjs:161` must be verified through the **merged**
invocation — the args array in `testStep()` — never `bun test build/angular-test/angular`,
which never matches `scripts/` and would report green over a red run.

Then, by hand: `bun run build:angular-demo && bun run demos`, and walk both `.prompt.md`
checklists in real Chromium (`/usr/bin/chromium`, driven over CDP with
`scripts/lib/{chromium,cdp,static-server}`).

**One measurement is mandatory and no suite can make it:** read the day-column track
boundaries and each chip's `getBoundingClientRect().left` from the live page and confirm the
chips land inside their columns. happy-dom does no layout, so the equal-track precondition the
whole inversion rests on is only ever checked here.
