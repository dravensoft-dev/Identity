Arena data table for dense surfaces — headers in mono/uppercase, rows separated by a
hairline. Standalone, `OnPush`, signal inputs. Styling is the sibling `Table.variants.ts`
recipe, shared with `arena-table-row` and `arena-table-cell`; the component carries no CSS
classes of its own.

It is a **compound** primitive: `columns` says how each column is headed and set, and you
write one `<arena-table-row>` per row with one `<arena-table-cell>` per cell inside it.
Cells are **positional** — the nth cell takes the nth column.

```html
<arena-table [label]="'Recent deployments'" [columns]="columns">
  @for (d of deploys(); track d.build) {
    <arena-table-row (click)="openDeploy(d)">
      <arena-table-cell>{{ d.build }}</arena-table-cell>
      <arena-table-cell>{{ d.project }}</arena-table-cell>
      <arena-table-cell><arena-badge [tone]="d.tone" dot>{{ d.status }}</arena-badge></arena-table-cell>
    </arena-table-row>
  }
  <span empty>No deployments in this range.</span>
</arena-table>
```

**Do / Don't**
- `label` is required and names the grid for a screen reader. Say what the rows *are* —
  "Recent deployments", "Team members" — never "Table". Nothing can derive it, which is why
  it **throws** rather than falling back, and why `input.required` alone is not the guard:
  that only proves something was bound, and `[label]="row.title"` with an empty title
  satisfies it.
- Put your own components in a cell — an `arena-badge` for a status, an `arena-button` for
  an action. That is what the compound shape is for; a column carries no render function.
- Numeric data and codes in `mono` columns with `align: 'right'`.
- Mark the actions column `mobileLayout: 'block'`. Its buttons name themselves, and pairing
  them with an "ACTIONS" label reads as a mistake.
- Don't set `responsive="false"` to "keep it looking like a table" on a phone. A table
  narrower than its content is unreadable; card mode is the honest fallback.
- Row activation is `(click)` on the row, and it carries no payload — you wrote that
  element inside your own `@for`, so you already hold the row it is about.

### Responsive

Below `--bp-md` the table renders one card per row. The threshold is measured on the
table's **container**, never the viewport and never a media query — a table inside a narrow
panel goes card-mode on a wide monitor, which is what you want. Before anything has been
measured the wide shape renders, so the card shape never flashes on first paint.

### Keyboard

The wide shape is a `role="grid"` with **one** tab stop. Tab reaches the grid, arrows move
by cell — the header row is row 0 and is navigable, as APG prescribes — `Home` and `End` go
to the first and last cell of the **current row**, and `Enter` activates the cursor's row by
emitting that row's `click`. There is no step-in: a control you drew inside a cell keeps its
own place in the page Tab sequence, so nothing you own is silenced.

The grid is **not assumed rectangular**. A row may carry fewer or more cells than there are
columns, and the cursor is clamped against the row it is actually in.

Card mode answers none of this, and this layer answers less of it than React does: a card
row here carries no role and no tab stop, so a row with `(click)` is pointer-only below
`--bp-md`. That is not a choice — Angular cannot ask whether an output has subscribers, and
making every card row a button would put a dead tab stop on every row of every table that is
not clickable. `TableRow.behaviour.json` states it and `DOUBTS.md` carries the consequence.

### Why the wide shape is not a `<table>` element

Angular indexes projection slots in template order and hands the content to the **first**
matching one, so a `wide` branch and a `card` branch cannot each carry their own
`<ng-content>` — one of the two would always render empty. The rows are therefore projected
once, into a box whose display and role change with the shape, and the wide box is a
`display: table` with `role="grid"` rather than a `<table>`. React's `<table>` already
carries `role="grid"`, so the native table role was overridden in both layers; what differs
is the element and `colspan`. `DOUBTS.md` records it.

**By hand, in a real browser** (`bun run build:angular-demo && bun run demos`, then
`frameworks/angular/components/display/table/Table.card.html`):
1. Tab reaches the grid ONCE, and one more Tab leaves it. No cell is a stop of its own.
2. From a cell, Tab reaches a control inside a cell in **one** press, not two. Two means the
   grid pulled focus back onto the cell — `focusin` bubbles, and this is the failure mode
   React hit and only a real browser showed.
3. Arrows clamp at all four edges and focus never leaves the grid. `Home`/`End` stay inside
   the current row — walk a middle row, not only the first.
4. `Enter` activates a row with `(click)` and does nothing on the header row or on the
   disabled row; the page logs what was activated.
5. The squeezed container is already in card mode on load. Confirm nothing there took a
   role, a tabindex or a key handler by accident.
6. The measured width does not oscillate between the two shapes — narrow the window slowly
   across the threshold and watch it settle rather than flicker.
