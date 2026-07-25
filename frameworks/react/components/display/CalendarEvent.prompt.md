One event on a `Calendar`'s schedule. It is a child of `Calendar` and nothing else: everything about where the chip lands — its top, its height, the column it shares with its overlaps, its ramp colour, its place in the grid's keyboard order — is worked out by `Calendar` and injected into this element. On its own it renders an unplaced chip and means nothing.

```jsx
<Calendar timeZone="Europe/Madrid">
  {classes.map((c) => (
    <CalendarEvent key={c.id} id={c.id} title={c.name} start={c.start} end={c.end}
      colorId={c.room} onClick={() => open(c)} />
  ))}
</Calendar>
```

`id`, `title`, `start` and `end` are all required and **throw** when absent. `start` and `end` are ISO datetimes, read in the calendar's `timeZone` and never the reader's.

**`onClick` carries no payload, deliberately.** You wrote this element, so your handler already closes over the record it came from — `onClick={() => open(c)}` reaches the whole of `c` with no id-to-object lookup. A payload would have handed back the five fields you had just passed in.

**Passing `onClick` is what makes the chip interactive.** With it the chip renders as a real `<button>` with an accessible name of "title, date, time range"; without it, it is an inert `<div>` and there is nothing for a keyboard or a screen reader to act on. That is the same conditional shape `Tag` has, and it is recorded as a limitation of the behaviour layer rather than hidden: the binding claims the `button` pattern unconditionally because the schema cannot say "only when `onClick` is passed".

**An interactive chip is not a page-level tab stop, and that is on purpose.** The schedule is one tab stop; Enter from the hour cell an event overlaps steps into the chip, Escape steps back out to the cell. Do not try to restore a `tabIndex` — `Calendar` injects `-1` and would overwrite it anyway, and a chip per tab stop is what the grid pattern exists to prevent.

**Do**
- Give the same entity the same `colorId` everywhere it appears. That is what makes the ramp identity rather than decoration.
- Preformat the `title`. Arena does no locale formatting and no truncation of your text beyond the chip's own ellipsis.
- Let the chip be inert when nothing happens on activation. An interactive-looking chip that does nothing is worse than a plain one.

**Don't**
- Don't put children inside it. It takes none: the title and the time line are the chip body, and Arena draws both.
- Don't render one outside a `Calendar`. It has no position of its own and no useful meaning without the grid around it.
- Don't reach past `colorId: 8`. There are eight ramp slots and they never cycle; a ninth entity wrapping to slot 1 claims two different things are the same thing.
- Don't reach for `style` or `className`. It takes neither, the same as every other Arena component under the API contract.

## Verifying the panel by hand

`Calendar` binds the `grid` pattern, so by Arena's rule it is DOM-tested by hand
rather than by a render suite — the measured RAM cost of a grid fixture is why.
Serve the tree with `bun run demos`, open
`frameworks/react/components/display/calendar.card.html`, and check all of:

1. Tab reaches the schedule ONCE. One more Tab leaves it — no chip, kebab or
   panel button is a stop of its own.
2. From an hour cell, Enter steps into an event chip; Escape steps back out.
3. On a chip with a panel, the kebab is reachable and activating it opens the
   panel below the chip.
4. Escape with the panel open CLOSES the panel and leaves focus on the chip. A
   second Escape returns focus to the hour cell.
5. Arrow keys still move by day and hour from an hour cell, and clamp at all
   four edges.
