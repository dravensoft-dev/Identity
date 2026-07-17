Week or day schedule on a time grid: a toolbar, one column per day, events positioned by their wall-clock span. Use it for an agenda someone reads against the clock — bookings, classes, shifts. It is not a date picker (use `Input type="date"`) and not a month planner (Arena ships no month grid).

`timeZone` is required and is an IANA name. Events carry ISO datetimes and are read *in that zone*, not the reader's — a class at 09:00 in Madrid stays at 09:00 for a student loading the page from Lima.

Copy `components/charts/chart-internals.js` and `use-container-width.js` alongside it: `Calendar` reads the categorical ramp through the same `catColor` the charts use, and measures its container to pick the view.

```jsx
<Calendar
  timeZone="Europe/Madrid"
  events={[
    { id: 'a', title: 'Ballet I',   start: '2026-07-13T09:00:00+02:00', end: '2026-07-13T10:30:00+02:00', slot: 1 },
    { id: 'b', title: 'Contemporary', start: '2026-07-13T09:30:00+02:00', end: '2026-07-13T11:00:00+02:00', slot: 2 },
  ]}
  onEventClick={(e) => open(e.id)}
  onRangeChange={(iso) => refetch(iso)}
  actions={<Button size="sm" variant="secondary">New class</Button>}
/>
```

The anchor is internal, so prev/Today/next work with nothing wired. `onRangeChange` reports the new anchor date — take it as the cue to refetch. Pass `anchorDate` only when you want to drive the date yourself; it wins whenever it changes.

State goes on a non-chromatic channel, because color is spoken for:

```jsx
<Calendar
  timeZone="Europe/Madrid"
  events={events}
  renderEvent={(e) => (
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-strong)',
      textDecoration: e.meta?.cancelled ? 'line-through' : 'none',
      opacity: e.meta?.cancelled ? 0.6 : 1 }}>{e.title}</span>
  )}
/>
```

**Do**
- Give an entity a stable `slot` and reuse it everywhere that entity appears — that is what makes the ramp identity rather than decoration.
- Let `dayStart` default. It follows the earliest event, so a schedule that begins at 16:00 does not open on eight empty morning rows.
- Set `weekStartsOn` and `hideEmptyWeekend` to your locale and product. The defaults (Monday, Sunday hidden until used) are defaults, not the system's opinion.
- Preformat everything you put in `renderEvent`. The calendar does no locale and no rounding.

**Don't**
- Don't paint an event `--danger` to mean cancelled. Identity and meaning in one palette makes both unreadable — this is the same rule the charts enforce, and here it has no runtime warning to catch you.
- Don't reach past slot 8. There are eight slots and they never cycle; a ninth entity wrapping to slot 1 claims two different things are the same thing. Group the tail instead.
- Don't feed it multi-day or all-day events. There is no all-day row: an event running past midnight is clamped to the end of the day it started on.
- Don't wrap it to add a month view or a mini datepicker and call it Arena. Both are real components with real specs; a hand-rolled one in your product is exactly the `fullcalendar-overrides.css` story that put this component here.
