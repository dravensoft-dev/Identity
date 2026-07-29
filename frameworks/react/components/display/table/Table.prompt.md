Data table for dense surfaces. Headers in mono/uppercase, rows separated by hairline. Wrap it in `.arena-compact` for expert density without touching props.

It is a **compound** component: `columns` says how each column is headed and set, and you write one `<TableRow>` per row with one `<TableCell>` per cell inside it. Cells are **positional** — the nth `TableCell` takes the nth column.

```jsx
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

**Do / Don't**
- `label` is required and names the grid for a screen reader. Say what the rows *are* — "Recent deployments", "Team members" — never "Table". There is nothing to derive it from, which is why it throws when omitted rather than falling back.
- Put your own components in a cell — a `Badge` for a status, a `Button` for an action. That is what the compound shape is for. A column carries **no** `render`, and passing one does nothing.
- `key` goes on the `TableRow`. It is React's own reconciliation, not an Arena member; there is no `getRowKey`.
- Numeric data and codes in `mono` columns with `align:'right'`.
- Statuses with `Badge`, not loose text.
- Don't use it for layout; it's for real tabular data.
- Mark the actions column `mobileLayout:'block'`. Its buttons name themselves, and pairing them with an "ACTIONS" label reads as a mistake.
- Don't set `responsive={false}` to "keep it looking like a table" on a phone. A table narrower than its content is unreadable; card mode is the honest fallback.
- Row activation is `onClick` on the `TableRow`, and it carries no payload — you wrote that element, so you already hold the row it is about.

### Responsive

Below `--bp-md` the table renders one card per row. The threshold is measured on the table's **container**, not the viewport — a table inside a narrow panel goes card-mode on a wide monitor, which is what you want. Set `responsive={false}` to keep the table shape at every size.

Each column picks its card-mode layout with `mobileLayout`:

```jsx
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

The wide layout is a `role="grid"` with **one** tab stop. Tab reaches the grid, arrows move by cell — the header row is row 0 and is navigable, as APG prescribes — `Home` and `End` go to the first and last cell of the **current row**, and `Enter` activates the cursor's row by calling that `TableRow`'s `onClick`. There is no step-in: a control you drew inside a cell keeps its own place in the page Tab sequence, so nothing you own is silenced.

The grid is **not assumed rectangular**. A row may carry fewer or more cells than there are columns, and the empty state is a single cell spanning the width; the cursor is clamped against the row it is actually in.

Card mode answers none of this. A card is a list item, and a list is traversed with Tab — but a card whose row has `onClick` has no keyboard route at all, which is the one exception `Table.behaviour.json` still carries.

## Verifying the grid by hand

`Table` binds the `grid` pattern, so by Arena's rule it is DOM-tested by hand rather
than by a render suite — the measured RAM cost of a grid fixture is why. What is
automatic is in `frameworks/react/components/display/table/Table.test.jsx` and covers the markup only:
the roles, the name, the `label` guard, the tab-stop count, and that the removed
members reach nothing. Everything below is behaviour and only a person checks it.

Serve the tree with `bun run demos`, open
`frameworks/react/components/display/TableAvatar.card.html`, and check all of:

1. Tab reaches the table ONCE, and one more Tab leaves it. No cell is a stop of its
   own. Controls YOU drew inside a cell are the exception and are meant to be: they
   are yours, Arena cannot silence markup it does not own, and taking them out of the
   Tab sequence would remove a route a keyboard user has today.
2. From a cell, Tab reaches a control inside a cell in **ONE** press, not two. A
   second press means the grid pulled focus back onto the cell — which it did, once,
   and only a real browser showed it: `focusin` bubbles, so a control inside a `<td>`
   fired that cell's focus handler, moved the roving cursor, and the focus effect
   took the focus back. Nothing automatic can hold this. `renderToStaticMarkup` runs
   no effects and dispatches no focus, and a component binding `grid` may not have a
   render suite, so this step IS the guard. It matters MORE under the compound shape
   than before: a control in a cell is now the expected way to build a status or an
   actions column, not an edge case. The demo page's own cells hold a `Badge`, which
   is not focusable — check this one on the Delivery Console's Deployments tab
   (`frameworks/react/ui-kits/console/index.html`), whose actions column draws a real
   `Button`.
3. Arrow keys move by cell and clamp at all four edges — the first column, the last
   column, the header row at the top, the last body row at the bottom. Focus never
   leaves the grid. Try it on a table whose rows carry a different number of cells
   than there are columns: the cursor must clamp against the row it is in, not
   against `columns.length`.
4. `Home` and `End` stay INSIDE the current row: its first and last cell, never the
   first row of the table. Walk a middle row, not only the first.
5. `Enter` activates the row when the `TableRow` has `onClick`, and does nothing on
   the header row.
6. Card mode answers none of it, and it is the surviving exception. That page renders
   the SAME table twice, the second time in a 340px container, so card mode is
   already on screen — check that a card whose row has `onClick` is still mouse-only,
   and that nothing there took a `role`, a `tabindex` or a key handler by accident.
