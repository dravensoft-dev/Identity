One row of an `arena-table`. Write one per row, with one `arena-table-cell` inside it per
cell. It only makes sense inside a table: it injects the shared `TableState`, and outside one
that is a DI error rather than a silently inert row.

```html
<arena-table-row (click)="openDeploy(d)">
  <arena-table-cell>{{ d.build }}</arena-table-cell>
  <arena-table-cell>{{ d.project }}</arena-table-cell>
  <arena-table-cell><arena-badge tone="success" dot>Deployed</arena-badge></arena-table-cell>
</arena-table-row>
```

**Do / Don't**
- `(click)` takes no payload. You wrote this element inside your own `@for`, so you already
  hold the row it is about; a payload would hand you back what you just had.
- Cells are **positional**: the nth `arena-table-cell` reads the nth entry of the table's
  `columns`. Keep them in the same order.
- Don't write a bare element as a child. A row's cells are read as `arena-table-cell`
  components, and anything else renders but takes no column, no alignment and no place in
  the keyboard order.
- Don't reach for the row to style a cell — alignment, width and the mono/gold treatment are
  the **column's**, so they stay the same all the way down.
- `disabled` draws the row and refuses to activate it, by either route: the pointer and the
  grid's `Enter`. It reflects through `aria-disabled` rather than the native attribute, so a
  locked row still announces itself. With no `(click)` there is nothing to disable and the
  row is inert already.
- Wire `(click)` only when the whole row means something to activate. A row with one
  actionable thing in it wants an `arena-button` in a cell instead — see the keyboard note
  below.

### Why this one is not host-bound

Every other primitive in this family binds its root slot onto the host. This one renders a
real element inside a bare host, for the same reason `arena-button` does: an Angular output
named after a native DOM event is delivered **twice** — once as the output and once as the
bubbled DOM event Angular also listens for. Measured on this component rather than inherited:
with the inner element's `stopPropagation()` removed, one pointer click reaches the consumer
**2** times, and a `disabled` row activates, because the native path never passes the guard.
The inner element is where that event is stopped, which is what makes both routes single and
both refusable — and `Table.cases.test.ts` asserts the count so it cannot drift back.

### Card mode is pointer-only here, and that is a divergence

Below `--bp-md` the row renders as a card with **no role and no tab stop**, so a row carrying
`(click)` is reachable by pointer and not by keyboard. React makes that card a
`role="button"` because it can see whether `onClick` was passed; Angular cannot ask whether
an output has subscribers — `OutputEmitterRef.listeners` is private, and an `interactive`
input would be a member no contract declares. Making every card row a button instead would
put a dead tab stop on every row of every table that is not clickable. The binding declares
`divergesFrom: "button"` and `DOUBTS.md` carries the consequence.

### What is shared, and therefore not yours

Where the row sits, which columns its cells are set against, and where the grid's cursor is
all live on `TableState`, which the table provides and this component injects. None of it is
a member of `contracts/api/components/TableRow.json`, and a consumer never writes one — the
same shape as `arena-radio` pulling its group's state, and the opposite direction from
React, where the parent pushes into each child instead.
