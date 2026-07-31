One cell of an `arena-table-row`. It draws the cell box, the padding, the alignment and the
mono/gold treatment its column asks for, and in card mode either a label/value pair or a
full-width block, and shows whatever you put in it.

```html
<arena-table-cell>{{ d.p95 }}</arena-table-cell>
<arena-table-cell><arena-badge tone="danger" dot>Failed</arena-badge></arena-table-cell>
<arena-table-cell><arena-button variant="ghost" size="sm">Details</arena-button></arena-table-cell>
```

**Do / Don't**
- Put a value in it, or one of Arena's own components: an `arena-badge` for a status, an
  `arena-button` for an action. This is why the table is a compound primitive at all: a
  column's render function would be per-item projection, which this library does not do, but
  a cell **you** instantiate is just an element you wrote.
- Don't set alignment, width or the mono face here. Those are the column's, so a column stays
  consistent down its whole length; a cell that styled itself would drift from its header.
- Don't add a `role` or a `tabindex`. `role="gridcell"` and the roving tab stop belong to the
  enclosing grid and are read from the shared state; adding your own would put a second tab
  stop inside a composite that must have exactly one.
- A control you put in a cell **is** a page-level tab stop, and that is deliberate. Arena
  cannot silence markup it does not own, and silencing it would take away a route a keyboard
  user has. Reaching it must cost exactly one Tab; step 2 of the by-hand checklist in
  `Table.prompt.md` is the standing check.
- Don't use it outside an `arena-table-row`. It injects that row's state, so outside one it
  is a DI error rather than a cell that quietly renders wrong.

### What is shared, and therefore not yours

Its column, its layout and its place in the grid's keyboard order come from `TableState` and
`TableRowState`, which the table and the row provide and this component injects. None of it
is a member of `contracts/api/components/TableCell.json`, and a consumer never writes one.
The cell's whole API is what you project into it.
