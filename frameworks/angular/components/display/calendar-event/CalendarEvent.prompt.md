One event on an `arena-calendar`'s schedule. It is content of a calendar and nothing else: its top, its height, the column it shares with its overlaps, its ramp colour and its place in the grid's keyboard order all come from the calendar it pulls them out of. **Outside one it throws `NG0201`** — `CalendarState` is not optional, and an unplaced chip is not a thing worth rendering.

```html
<arena-calendar timeZone="Europe/Madrid">
  @for (c of classes(); track c.id) {
    <arena-calendar-event [id]="c.id" [title]="c.name" [start]="c.start" [end]="c.end"
                          [colorId]="c.room" (click)="open(c)" />
  }
</arena-calendar>
```

`id`, `title`, `start` and `end` are all required and **throw** when blank — `input.required` proves only that something was bound. `start` and `end` are ISO datetimes, read in the calendar's `timeZone` and never the reader's.

**`click` carries no payload, deliberately.** You wrote this element, so your handler already closes over the record it came from.

**The chip is always a button here, and React's is not.** React renders an inert `<div>` when no `onClick` was passed; Angular cannot ask whether an output has subscribers, so the interactive shape is unconditional. The consequence is bounded — a chip nobody listens to is announced as a button that does nothing — and it is the deliberate opposite of the call `arena-table-row` made, because a chip is `tabindex="-1"` and never a page tab stop, where always-a-div here would delete Enter-into-the-chip. `CalendarEvent.behaviour.json` records it as a `divergesFrom`.

**An interactive chip is not a page-level tab stop, and that is on purpose.** The schedule is one tab stop; Enter from the hour cell an event overlaps steps into the chip, Escape steps back out to the cell.

What "into the chip" means depends on the shape. A chip with no action panel *is* the button. A chip with one cannot be — a kebab nested inside a button is invalid HTML — so the chip is a `<div>`, the title and time move into a body `<button>` inside it, and that body is what Enter focuses. The focus target registered with the calendar has to follow that element; when it did not, in React, Enter on a paneled chip moved focus nowhere at all.

**The kebab is reachable by arrows rather than Tab.** With focus on a chip, `ArrowRight` steps to its kebab and `ArrowLeft` steps back. Tab has to *leave* a composite, and a tabbable kebab is precisely what would stop the calendar being the single tab stop its `grid` binding claims. Activating the kebab opens the panel and moves focus into it; `Escape` closes the panel and returns focus to the kebab, and stops there rather than also returning focus to the hour cell.

**`actionsEnabled` draws a kebab; `[actions]` is what the panel behind it holds.**

```html
<arena-calendar-event [id]="c.id" [title]="c.name" [start]="c.start" [end]="c.end"
                      (click)="open(c)" actionsEnabled>
  <arena-button actions size="sm" variant="ghost" icon="ph-bold ph-pencil">Edit</arena-button>
  <arena-button actions size="sm" variant="ghost" icon="ph-bold ph-trash">Delete</arena-button>
</arena-calendar-event>
```

**The boolean is what draws the kebab, not the slot being filled**, and unlike the calendar's toolbar this slot needs no marker directive: `select="[actions]"` is a plain CSS selector, and only `contentChild` detection would need `ArenaActions` imported. `actionsEnabled` with nothing projected draws a kebab over an empty panel; that is a consumer mistake rather than a state Arena hides, and it is the same call `arena-alert`'s and `arena-toast`'s `dismissible` already record.

**The panel's content is in the tree only while the panel is open.** That is what keeps the schedule at one tab stop. It also means the panel is not a place to keep state — it is created and destroyed with every open.

**Do**
- Give the same entity the same `colorId` everywhere it appears.
- Preformat the `title`. Arena does no locale formatting and no truncation beyond the chip's own ellipsis.
- Keep the panel to a couple of controls. It opens over the schedule at the chip's own width.
- Project `[actions]` whenever you set `actionsEnabled`. The two travel together.
- Reach for `disabled` when the event is drawn but must not be opened — one already past, or one owned by someone else. It reflects through `aria-disabled`, so the chip keeps its place in the grid's roving sequence and is announced as unavailable instead of disappearing from it, and `click` never fires while it is set.

**Don't**
- Don't project content into it other than `[actions]`. The title and the time line are the chip body, and Arena draws both.
- Don't render one outside an `arena-calendar`. It has no position of its own and will throw.
- Don't use `disabled` to make a chip inert. In this layer nothing does — see the divergence above — and `disabled` means "a button that announces it cannot be pressed right now", which reads differently to a screen reader.
- Don't reach past `colorId: 8`. There are eight ramp slots and they never cycle.
- Don't reach for `style` or `class` to place it. Its geometry is the calendar's, and a `class` on the host lands on an element that declares `display: contents`.
