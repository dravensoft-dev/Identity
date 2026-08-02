Week or day schedule on a time grid: a toolbar, one column per day, events positioned by their wall-clock span. Use it for an agenda someone reads against the clock: bookings, classes, shifts. It is not a date picker (use `Input type="date"`) and not a month planner (Arena ships no month grid).

**The events are its children.** Write one `<CalendarEvent>` per event; `Calendar` reads each one's `start`, `end` and `colorId`, works out where the chip goes and injects that back into the element. There is no `events` array, and no throw for omitting one: a `Calendar` with no children is a legitimately empty schedule, a week with nothing booked in it, rather than a caller's mistake.

`timeZone` is optional and defaults to the reader's own resolved zone, which is right whenever the schedule belongs to whoever is looking at it. **Pass it when the calendar has a zone of its own**: a class at 09:00 in Madrid must stay at 09:00 for a student loading the page from Lima, and only an explicit `timeZone="Europe/Madrid"` says so. Events carry ISO datetimes and are read in that zone.

Two things this default is not. It is not a `'UTC'` fallback, which would be arbitrary, wrong for almost every reader, and would produce silently the very defect the member exists to prevent. And it is **not safe under server rendering**: on a server it resolves to the *server's* zone and then to the client's on hydration, so a server-rendered calendar must pass `timeZone` explicitly. Same shape as `useContainerWidth` reporting `null` before it has measured.

`Calendar` reads the categorical ramp through the same `catColor` the charts use, and measures its container to pick the view, so both travel with it: importing from `@dravensoft/arena-react` brings them, and both are exported for a legend or a responsive panel of your own.

```tsx
<Calendar
  timeZone="Europe/Madrid"
  onRangeChange={(iso) => refetch(iso)}
  actions={<Button size="sm" variant="secondary">New class</Button>}
>
  {classes.map((c) => (
    <CalendarEvent key={c.id} id={c.id} title={c.name} start={c.start} end={c.end}
      colorId={c.room} onClick={() => open(c)} />
  ))}
</Calendar>
```

The anchor is internal, so prev/Today/next work with nothing wired. `onRangeChange` reports the new anchor date; take it as the cue to refetch. Pass `anchorDate` only when you want to drive the date yourself; it wins whenever it changes.

**Keyboard.** The grid is one tab stop, not one per event (`dayInteractive` adds the header strip's, above it). Tab lands on a single hour cell; a *row is a day*, so Left/Right move a day and Up/Down move an hour, Home/End jump to the first/last hour of the focused day, and focus clamps at every edge. Enter steps into the first event overlapping the focused hour, Escape steps back out to the cell.

**A day is activable only if you say so.** `onDateClick` reports the ISO date of the day a reader picked, and it fires for nothing unless `dayInteractive` is also set. The boolean is not ceremony: what a component draws may never be derived from whether a listener is bound, because at least one platform cannot ask that question, so the day's cursor, which is a render, follows the boolean and not your handler. Bind one without the other and you get exactly half of what you asked for, in every layer alike.

```tsx
<Calendar dayInteractive onDateClick={(iso) => openDay(iso)}>
```

**With it on, the day headers become their own tab stops, and that is the point.** Each header is a `<button>` carrying the full date as its label, so a keyboard reaches a day at the one element that already names it. The column background takes the same click but stays pointer-only, because it is the same date, reachable above. The grid below is still a single roving tab stop, and the header strip is separate.

**The chip body is Arena's, and there is nothing you can put inside it.** A `CalendarEvent` carries `id`, `title`, `start`, `end` and `colorId`, and Arena draws all of it: the title, the time range and the identity colour. There is no per-event renderer, because a function returning markup is not a member of any Arena contract, because per-item projection has no answer on every layer Arena targets. Writing `<CalendarEvent>` as an element does not change that: it is the element Arena draws, not a wrapper around markup of yours.

**Activation lives on the event, and it is declared.** There is no `onEventClick` on `Calendar`; each `CalendarEvent` takes its own `onClick` and its own `interactive`. The handler carries no payload and needs none: you wrote the element, so it already closes over whatever the event is in your data, with no id-to-object lookup in between. **Pass `interactive` alongside `onClick` or the chip is inert**: a read-only schedule leaves it off and announces events rather than a screenful of buttons that do nothing.

**So a consumer cannot mark an event cancelled or tentative at all.** Colour is spoken for by identity, and the non-chromatic channel a strikethrough or a dashed border would have used is no longer reachable. What is left: say it in the `title` (`'Ballet I, cancelled'`), which is text Arena draws and a screen reader announces; or do not render a `CalendarEvent` for it at all and show it somewhere that is not the schedule. Neither is a styling hook, and that is deliberate rather than pending.

**Do**
- Give an entity a stable `colorId` and reuse it everywhere that entity appears, which is what makes the ramp identity rather than decoration.
- Let `dayStart` default. It follows the earliest event, so a schedule that begins at 16:00 does not open on eight empty morning rows.
- Set `weekStartsOn` and `hideEmptyWeekend` to your locale and product. The defaults (Monday, Sunday hidden until used) are defaults, not the system's opinion.
- Preformat every `title` you pass. The calendar does no locale and no truncation of your own text beyond the chip's ellipsis.

**Don't**
- Don't try to paint an event `--danger` to mean cancelled. You cannot: `colorId` picks a ramp slot and nothing else, and the reason it is closed is that identity and meaning in one palette makes both unreadable. Same rule the charts enforce.
- Don't reach past `colorId: 8`. There are eight slots and they never cycle; a ninth entity wrapping to slot 1 claims two different things are the same thing. Group the tail instead.
- Don't feed it multi-day or all-day events. There is no all-day row: an event running past midnight is clamped to the end of the day it started on.
- Don't reach for `style` to place it. It takes none; wrap it in a `<div>` that owns the margin and the width.
- Don't put anything but `CalendarEvent`s in it. Children are the event list, not a content area, and anything else is skipped by the placement pipeline and never renders.
- Don't wrap it to add a month view or a mini datepicker and call it Arena. Both are real components with real specs; a hand-rolled one in your product is exactly the `fullcalendar-overrides.css` story that put this component here.

**Two accepted limits, both measured rather than argued.**

`showsTime()` compares a chip's column share against **one** threshold and never asks whether the
chip has a kebab. A chip without actions has a content box of its share less 18px; one with them
has its share less 46px, because the kebab's 34px reserve comes out too. So the kebab-safe
threshold is 124.02px where the plain one is 96.02px, and `--calendar-time-min-w` is set at the
plain one. **In a band of roughly a 768px to an 800px container, in week view, a chip that has
actions can still wrap its time label onto two lines**, measured on `Calendar.card.html` by
driving the viewport and reading the container beneath it, which is the viewport less the card's
24px body padding a side, and `--bp-md` is compared against the *container*. At an 812px container
the label fits on one line. Both alternatives are worse: the kebab-safe threshold suppresses the
label on every ordinary chip through that band and well past it, and a kebab-aware threshold puts
`CalendarEvent`'s 34px reserve back inside `Calendar`, laundered through a second token but still
a number that silently goes wrong if the reserve changes.

**A chip is a DOM child of its day's `role="row"` here**, distributed with `cloneElement`, so
its `left`/`width` are percentages of its own column. The `grid` pattern constrains the
accessibility tree and not the DOM, so a layer that cannot distribute children may put every chip
in the grid and have each column claim its own through `aria-owns` and meet the same pattern,
which is worth knowing before assuming this component's DOM shape is the contracted one. Two
things follow from the shape here: `flex: 1` columns may differ by one border width without
consequence, because a chip's percentages are of its own column; and anything projected that is
not a chip is silently skipped by the placement lookup. **No gate sees either**: `check:dimensions` is blind to `[style.x]` and
the grid suite asserts the keyboard rather than the geometry.
