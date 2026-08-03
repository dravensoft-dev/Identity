Data table for dense surfaces. Headers in mono/uppercase, rows separated by hairline. Wrap it in `.arena-compact` for expert density without touching props.

It is a **compound** component: `columns` says how each column is headed and set, and you write one `<TableRow>` per row with one `<TableCell>` per cell inside it. Cells are **positional**: the nth `TableCell` takes the nth column.

```tsx
<Table
  label="Recent deployments"
  columns={[
    { header:'Build', mono:true },
    { header:'Project' },
    { header:'Status' },
    { header:'p95', align:'right', mono:true },
  ]}>
  {deploys.map((d) => (
    <TableRow key={d.build} onClick={() => openDeploy(d)}>
      <TableCell>{d.build}</TableCell>
      <TableCell>{d.project}</TableCell>
      <TableCell><Badge tone={d.ok ? 'success' : 'danger'} dot>{d.status}</Badge></TableCell>
      <TableCell>{d.p95}</TableCell>
    </TableRow>
  ))}
</Table>
```

<!-- @api GENERATED from contracts/api/components/Table.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `label*` | primitive | `string` |  | Names the grid for assistive technology. Required, and guarded at runtime: nothing can derive it; Calendar names its grid from the range it is showing, and a data table's subject is editorial. Say what the rows are, never "Table". |
| `columns*` | array | `readonly TableColumn[]` |  | The columns, in order. A column heads and sets its cells; it never says what goes in them. |
| `children` | slot |  |  | The rows. One TableRow per row. Where a row sits, the columns its cells are set against and how the keyboard reaches them are Table's to decide and no row's to declare; how that reaches a row is each layer's own idiom. |
| `empty` | slot |  |  | What shows when no row is written. In that state NO grid is drawn at all, header row included: a column head over a "no results" sentence describes a table that is not there, and a role="grid" holding neither a header nor a row is a degenerate render, the same judgement Tabs makes when it draws no panel for a tab that does not exist. Every layer falls back to the string 'No data.' when nothing is given, each in its own idiom for a default. Unlike Table.label this one IS derivable: 'No data.' states what happened rather than what the component is, which is the distinction that makes a fallback useful here and useless there. A consumer with a better sentence, what to do next or why the list is empty, projects it. |
| `sort` | object | `TableSort` |  | Which column the rows are ordered by and which way. Controlled: Table draws the caret and the aria-sort, and the consumer does the ordering, because Table does not hold the rows. Absent, no header is a sort target. |
| `onSortChange` | event | `TableSort` |  | A sortable header was activated, carrying the column and the direction it should become: the same column flips, a different one starts ascending. Table never reorders anything itself, so a consumer who ignores this event gets a caret that moves and rows that do not, which is why the member is controlled rather than a starting value. |
| `page` | object | `TablePage` |  | Which page of a longer list is on screen. Present, Table draws its own Pagination below the grid and names it from `label`, which is what gives that required name its uniqueness on a page with two paged tables. Absent, no pager is drawn and the projected rows are the whole list. |
| `onPageChange` | event | `number` |  | A page was chosen, carrying the new 1-based page. It also fires with 1 when the current page has gone PAST THE END, which is the only reset Table performs; a filter that leaves the page in range is silent, so returning the reader to page one on a change of criterion stays the consumer's, beside the criterion they hold. |
| `sortControl` | enum | `TableSortControl` | `"auto"` | How the sort affordance is reached in CARD MODE, where there is no header row to activate and a `sortable` column therefore has no control under it at all. 'auto' draws one compact select above the cards, listing every sortable column in each direction, which is the shape a phone has room for; 'none' leaves card mode unsorted by hand, for a table whose order is the document's rather than the reader's. Above --bp-md the header row is the control and this member draws nothing. The header row does NOT come back below the breakpoint, because card mode exists for the one reason a grid does not fit. It is a member rather than something a consumer draws for themselves because the state it edits, TableSort, is Arena's: left to each consumer, the label, the option order and the way a direction is worded are invented once per project over a model they did not define. |
| `responsive` | primitive | `boolean` | `true` | Card mode below --bp-md. Set false only when the columns are meaningless apart. |

<!-- @api end -->

**Do / Don't**
- `label` is required and names the grid for a screen reader. Say what the rows *are*, as in "Recent deployments" or "Team members", and never "Table". There is nothing to derive it from, which is why it throws when omitted rather than falling back.
- Put your own components in a cell: a `Badge` for a status, a `Button` for an action. That is what the compound shape is for. A column carries **no** `render`, and passing one does nothing.
- `key` goes on the `TableRow`. It is React's own reconciliation, not an Arena member; there is no `getRowKey`.
- Numeric data and codes in `mono` columns with `align:'right'`. `mono` is the mono face and the gold ink together, and the ink is the half that does not travel: gold reads as an identifier, so a total in gold inside a card says the wrong thing. For a figure you draw outside a table, take the face alone: `style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}`, which aligns a column of figures by digit the way the table does.
- Statuses with `Badge`, not loose text.
- Don't use it for layout; it's for real tabular data.
- Mark the actions column `mobileLayout:'block'`. Its buttons name themselves, and pairing them with an "ACTIONS" label reads as a mistake.
- Don't set `responsive={false}` to "keep it looking like a table" on a phone. A table narrower than its content is unreadable; card mode is the honest fallback.
- Row activation is `onClick` on the `TableRow`, and it carries no payload, because you wrote that element and already hold the row it is about.
- Pass `empty` whenever the table can legitimately have no rows. With nothing passed React falls back to the string **`No data.`**, which is a placeholder rather than an answer: it says the query returned nothing and never says what was being asked for. The fallback is this layer's own convenience and nothing contracts it, because a table's empty state is editorial the way `label` is, and a layer that renders nothing instead is equally correct.

### Responsive

Below `--bp-md` the table renders one card per row. The threshold is measured on the table's **container**, not the viewport, so a table inside a narrow panel goes card-mode on a wide monitor, which is what you want. Set `responsive={false}` to keep the table shape at every size.

Each column picks its card-mode layout with `mobileLayout`:

```tsx
<Table
  label="Active projects"
  columns={[
    { header: 'Project' },
    { header: 'Build', mono: true },
    { header: 'Status' },
    { header: '', mobileLayout: 'block' },
  ]}>
  {rows.map((r) => (
    <TableRow key={r.id}>
      <TableCell>{r.name}</TableCell>
      <TableCell>{r.build}</TableCell>
      <TableCell><Badge tone="success" dot>{r.status}</Badge></TableCell>
      <TableCell><Button size="sm" variant="secondary">Open</Button></TableCell>
    </TableRow>
  ))}
</Table>
```

### Keyboard

The wide layout is a `role="grid"` with **one** tab stop. Tab reaches the grid, arrows move by cell (the header row is row 0 and is navigable, as APG prescribes), `Home` and `End` go to the first and last cell of the **current row**, and `Enter` activates the cursor's row by calling that `TableRow`'s `onClick`. There is no step-in: a control you drew inside a cell keeps its own place in the page Tab sequence, so nothing you own is silenced.

The grid is **not assumed rectangular**. A row may carry fewer or more cells than there are columns, and the cursor is clamped against the row it is actually in. With no rows there is no grid at all: no header row, no `role="grid"`, only the `empty` block, because a column head standing over a "no results" sentence describes a table that is not there.

Card mode answers none of this. A card is a list item, and a list is traversed with Tab, and a card whose row has `onClick` becomes a `role="button"` tab stop of its own, which is `TableRow`'s `card-interactive` case, not a clause of this component's binding, which carries no exception in either shape.

## Verifying the grid by hand

`Table` has render suites: one walks the grid cell by cell and renders both declared shapes,
and another covers the markup: the roles, the name, the `label` guard, the tab-stop count, and
that the removed members reach nothing.
The rule that a `grid` component was hand-tested *instead* is retired: a grid suite asserts at
every cell that focus landed where the arrow should take it and that exactly one `tabindex="0"`
exists and is that cell, with each edge clamp one extra press. **The bill is the press count**,
since every press re-renders the grid through `act()`, which is why the fixture stays small and
explicitly sized. What is below is what no suite can reach, since happy-dom
implements no layout and no native sequential focus navigation, and only a person checks it.

Serve the tree with `bun run demos`, open
`frameworks/react/components/display/table/Table.demo.generated.html`, and check all of:

1. Tab reaches the table ONCE, and one more Tab leaves it. No cell is a stop of its
   own. Controls YOU drew inside a cell are the exception and are meant to be: they
   are yours, Arena cannot silence markup it does not own, and taking them out of the
   Tab sequence would remove a route a keyboard user has today.
2. From a cell, Tab reaches a control inside a cell in **ONE** press, not two. A
   second press means the grid pulled focus back onto the cell, and only a real browser
   shows it: `focusin` bubbles, so a control inside a `<td>` fires that cell's focus
   handler, moves the roving cursor, and the focus effect takes the focus back. Nothing automatic can hold this. `renderToStaticMarkup` runs
   no effects and dispatches no focus, and a component binding `grid` may not have a
   render suite, so this step IS the guard. It matters MORE under the compound shape
   than before: a control in a cell is now the expected way to build a status or an
   actions column, not an edge case. The demo page's own cells hold a `Badge`, which
   is not focusable. Check this one on the Delivery Console's Deployments tab
   (`frameworks/react/ui-kits/console/index.html`), whose actions column draws a real
   `Button`.
3. Arrow keys move by cell and clamp at all four edges: the first column, the last
   column, the header row at the top, the last body row at the bottom. Focus never
   leaves the grid. Try it on a table whose rows carry a different number of cells
   than there are columns: the cursor must clamp against the row it is in, not
   against `columns.length`.
4. `Home` and `End` stay INSIDE the current row: its first and last cell, never the
   first row of the table. Walk a middle row, not only the first.
5. `Enter` activates the row when the `TableRow` has `onClick`, and does nothing on
   the header row.
6. Card mode answers none of the grid keyboard, and it is not supposed to. That page
   renders the SAME table twice, the second time in a 340px container, so card mode is
   already on screen. Check that a card whose row has `onClick` is a single tab stop
   that announces itself as a button and activates on Enter and Space, and that a card
   whose row has none took no `role`, `tabindex` or key handler by accident. `interactive`
   is what decides that, never whether `onClick` was passed: Arena derives no render from a bound listener.

### Sorting and paging

Both are **controlled**, and for the same reason: `Table` does not hold the rows, so it
cannot order them and cannot cut them. It draws the affordance and tells you what was asked.

```html
<Table label="Recent deployments" [columns]="columns"
             [sort]="sort()" (sortChange)="sort.set($event)"
             [page]="page()" (pageChange)="goTo($event)">
```

Mark a column `sortable: true` and pass `sort`. Without `sort` no header is a target however
many columns declare it, because a control drawing a direction it does not know is worse than
no control. Activating the sorted column flips it; activating a different one starts it
ascending. It costs **no tab stop**: the header row is already row 0 of the grid's roving
cursor, so Enter and Space act on the cell the reader is already on, and `aria-sort` says which
column and which way.

**Below `--bp-md` the header row is gone, so `sortControl` is the affordance.** With `sort`
bound and at least one `sortable` column, card mode draws one compact select above the cards,
listing every sortable column in each direction, and it reports through the same `sortChange`
the header does. Set it to `none` for a table whose order is the document's rather than the
reader's. The header row does **not** come back below the breakpoint: card mode exists for the
one reason a grid does not fit.

### `TableSort.column` is an index, and a column that moves takes the order with it

The cells are already positional, so a key would be a second identity for a thing that has one,
and that is the right trade. The price is that moving a column silently reorders the rows,
because the index now names a different column. **Keep the sort field inside the column entry it
belongs to and the two move together:**

```ts
const COLUMNS = [
  { header: 'Customer', sortable: true, field: (s: Sale) => s.customer },
  { header: 'Status' },
  { header: 'Total', sortable: true, field: (s: Sale) => s.total },
];
```

Arena cannot check that, but it does catch the loudest way to get it wrong: a `sort.column`
aimed at a column that declares no `sortable` **warns once**, naming the column it landed on,
instead of drawing no caret and saying nothing.

`page` is `{ index, size, total }`. `total` is the count across every page and is required,
because the rows you project are one page and nothing about the whole list can be read from
them. Table draws its own `Pagination` below the grid and names it from `label`, which is
what makes two paged tables on one dashboard tellable apart.

The one thing Table emits on its own is `pageChange` with 1, when the total drops far enough
that the current page is **past the end**. It is bounded: a filter that leaves the page valid is
silent, so nothing loops.

**That is not the reset you write beside a filter, and expecting it to be is the mistake this
paragraph exists to stop.** Filter ten pages down to five while the reader is on the third and
the page is still in range, so Table says nothing and the reader is left on page three of
results they never asked for. Table cannot tell that from removing one row from page three of
ten, which must move nobody, because a count is all it has. **Whether a change of criterion
returns the reader to page one is yours**, and it belongs beside the criterion:

```tsx
const applyStatus = (next: string) => { setStatus(next); setPage(1); };
```
