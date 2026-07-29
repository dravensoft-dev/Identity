Week or day schedule on a time grid: a toolbar, one column per day, events positioned by their wall-clock span. Use it for an agenda someone reads against the clock — bookings, classes, shifts. It is not a date picker (use `Input type="date"`) and not a month planner (Arena ships no month grid).

**The events are its children.** Write one `<CalendarEvent>` per event; `Calendar` reads each one's `start`, `end` and `colorId`, works out where the chip goes and injects that back into the element. There is no `events` array any more, and no throw for omitting one: a `Calendar` with no children is a legitimately empty schedule — a week with nothing booked in it — not a caller's mistake.

`timeZone` is optional and defaults to the reader's own resolved zone, which is right whenever the schedule belongs to whoever is looking at it. **Pass it when the calendar has a zone of its own**: a class at 09:00 in Madrid must stay at 09:00 for a student loading the page from Lima, and only an explicit `timeZone="Europe/Madrid"` says so. Events carry ISO datetimes and are read in that zone.

Two things this default is not. It is not the old `'UTC'` fallback — that one was arbitrary, wrong for almost every reader, and produced silently the very defect the member exists to prevent. And it is **not safe under server rendering**: on a server it resolves to the *server's* zone and then to the client's on hydration, so a server-rendered calendar must pass `timeZone` explicitly. Same shape as `useContainerWidth` reporting `null` before it has measured.

Copy `components/charts/chart-internals.js` and `use-container-width.js` alongside it: `Calendar` reads the categorical ramp through the same `catColor` the charts use, and measures its container to pick the view.

```jsx
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

The anchor is internal, so prev/Today/next work with nothing wired. `onRangeChange` reports the new anchor date — take it as the cue to refetch. Pass `anchorDate` only when you want to drive the date yourself; it wins whenever it changes.

**Keyboard.** The schedule is one tab stop, not one per event. Tab lands on a single hour cell; a *row is a day*, so Left/Right move a day and Up/Down move an hour, Home/End jump to the first/last hour of the focused day, and focus clamps at every edge. Enter steps into the first event overlapping the focused hour, Escape steps back out to the cell.

**The chip body is Arena's, and there is nothing you can put inside it.** A `CalendarEvent` carries `id`, `title`, `start`, `end` and `colorId`, and Arena draws all of it: the title, the time range and the identity colour. There is no per-event renderer — a function returning markup is not a member of any Arena contract, because per-item projection has no answer on every layer Arena targets. Writing `<CalendarEvent>` as an element does not change that: it is the element Arena draws, not a wrapper around markup of yours.

**Activation moved onto the event.** There is no `onEventClick` on `Calendar`; each `CalendarEvent` takes its own `onClick`, and it carries no payload. It does not need one — you wrote the element, so the handler already closes over whatever the event is in your data, with no id-to-object lookup in between.

**So a consumer cannot mark an event cancelled or tentative at all.** Colour is spoken for by identity, and the non-chromatic channel a strikethrough or a dashed border would have used is no longer reachable. What is left: say it in the `title` (`'Ballet I — cancelled'`), which is text Arena draws and a screen reader announces; or do not render a `CalendarEvent` for it at all and show it somewhere that is not the schedule. Neither is a styling hook, and that is deliberate rather than pending.

**Do**
- Give an entity a stable `colorId` and reuse it everywhere that entity appears — that is what makes the ramp identity rather than decoration.
- Let `dayStart` default. It follows the earliest event, so a schedule that begins at 16:00 does not open on eight empty morning rows.
- Set `weekStartsOn` and `hideEmptyWeekend` to your locale and product. The defaults (Monday, Sunday hidden until used) are defaults, not the system's opinion.
- Preformat every `title` you pass. The calendar does no locale and no truncation of your own text beyond the chip's ellipsis.

**Don't**
- Don't try to paint an event `--danger` to mean cancelled. You cannot — `colorId` picks a ramp slot and nothing else — and the reason it is closed is that identity and meaning in one palette makes both unreadable. Same rule the charts enforce.
- Don't reach past `colorId: 8`. There are eight slots and they never cycle; a ninth entity wrapping to slot 1 claims two different things are the same thing. Group the tail instead.
- Don't feed it multi-day or all-day events. There is no all-day row: an event running past midnight is clamped to the end of the day it started on.
- Don't reach for `style` to place it. It takes none; wrap it in a `<div>` that owns the margin and the width.
- Don't put anything but `CalendarEvent`s in it. Children are the event list, not a content area — anything else is skipped by the placement pipeline and never renders.
- Don't wrap it to add a month view or a mini datepicker and call it Arena. Both are real components with real specs; a hand-rolled one in your product is exactly the `fullcalendar-overrides.css` story that put this component here.
