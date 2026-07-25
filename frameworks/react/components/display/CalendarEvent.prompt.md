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

What "into the chip" means depends on the shape. A chip with no action panel *is* the button, and focus lands on it. A chip with one cannot be — a kebab nested inside a button is invalid HTML — so the chip is a `<div>`, the title and time move into a body `<button>` inside it, and that body is what Enter focuses. The distinction is invisible to a consumer and is written down because getting it wrong was a real defect: the ref `Calendar` focuses has to follow the focusable element, and when it did not, Enter on a paneled chip moved focus nowhere at all.

**`actionsEnabled` draws a kebab on the chip; `actions` is what the panel behind it holds.**

```jsx
<CalendarEvent id={c.id} title={c.name} start={c.start} end={c.end} onClick={() => open(c)}
  actionsEnabled
  actions={<>
    <Button size="sm" variant="ghost" icon="ph-bold ph-pencil">Edit</Button>
    <Button size="sm" variant="ghost" icon="ph-bold ph-trash">Delete</Button>
  </>} />
```

**The boolean is what draws the kebab, not the slot being filled.** `actionsEnabled` with an empty `actions` draws a kebab over an empty panel; that is a consumer mistake rather than a state Arena hides, and it is deliberate. Angular cannot detect whether an `<ng-content>` was filled, so a React that quietly withheld the kebab when the slot was empty would behave differently from an Angular that could not — the same reason `Alert.dismissible` and `Toast.dismissible` are booleans.

**The panel's content is in the tree only while the panel is open.** That is what keeps the schedule at one tab stop: your buttons are yours, Arena cannot silence them, and a permanently rendered row of them would be a permanent set of tab stops inside a grid that is supposed to have one. It also means the panel is not a place to keep state — it is unmounted and remounted with every open.

**Do**
- Give the same entity the same `colorId` everywhere it appears. That is what makes the ramp identity rather than decoration.
- Preformat the `title`. Arena does no locale formatting and no truncation of your text beyond the chip's own ellipsis.
- Let the chip be inert when nothing happens on activation. An interactive-looking chip that does nothing is worse than a plain one.
- Keep the panel to a couple of controls. It opens over the schedule at the chip's own width, and a panel wider than the day column it hangs from covers the events beside it.
- Pass `actions` whenever you pass `actionsEnabled`. The two travel together; the boolean alone draws a button onto an empty panel.

**Don't**
- Don't put children inside it. It takes none: the title and the time line are the chip body, and Arena draws both.
- Don't render one outside a `Calendar`. It has no position of its own and no useful meaning without the grid around it.
- Don't reach past `colorId: 8`. There are eight ramp slots and they never cycle; a ninth entity wrapping to slot 1 claims two different things are the same thing.
- Don't reach for `style` or `className`. It takes neither, the same as every other Arena component under the API contract.
- Don't write `defaultPanelOpen`. It is reachable and it is not API: it exists so a static render can assert the open branch, since `renderToStaticMarkup` cannot click. It is in no contract and no `.d.ts`, and it can be removed without a major.

## Verifying the panel by hand

`Calendar` binds the `grid` pattern, so by Arena's rule it is DOM-tested by hand
rather than by a render suite — the measured RAM cost of a grid fixture is why.
Serve the tree with `bun run demos`, open
`frameworks/react/components/display/calendar.card.html`, and check all of:

1. Tab reaches the schedule ONCE. One more Tab leaves it — no chip, kebab or
   panel button is a stop of its own.
2. From an hour cell, Enter steps into an event chip; Escape steps back out.
   Walk a chip with a panel as well as one without: they are different elements
   and only the browser tells them apart.
3. On a chip with a panel, clicking the kebab opens the panel below the chip,
   and every control in it is clickable — check a SHORT event, 30 minutes or
   less, not only a long one. **The kebab has no keyboard route today**: it is
   out of the Tab sequence by design and nothing inside the chip moves focus to
   it, so the panel is pointer-only. That is recorded in CLAUDE.md's *Known
   debt*; this step checks the pointer path and the geometry, not a keyboard
   one.
4. Escape with the panel open CLOSES the panel and leaves focus on the chip. A
   second Escape returns focus to the hour cell.
5. Arrow keys still move by day and hour from an hour cell, and clamp at all
   four edges — the first day, the last day, the first hour and the last.
