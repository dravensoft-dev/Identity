Data table for dense surfaces. Headers in mono/uppercase, rows separated by hairline. Wrap it in `.arena-compact` for expert density without touching props.

```jsx
<Table
  label="Recent deployments"
  columns={[
    { key:'build', header:'Build', mono:true },
    { key:'project', header:'Project' },
    { key:'status', header:'Status', render:(v)=><Badge tone={v==='ok'?'success':'danger'} dot>{v}</Badge> },
    { key:'p95', header:'p95', align:'right', mono:true },
  ]}
  rows={deploys} getRowKey={r=>r.build} onRowClick={openDeploy} />
```

**Do / Don't**
- `label` is required and names the grid for a screen reader. Say what the rows *are* — "Recent deployments", "Team members" — never "Table". There is nothing to derive it from, which is why it throws when omitted rather than falling back.
- Numeric data and codes in `mono` columns with `align:'right'`.
- Statuses with `Badge`, not loose text.
- Don't use it for layout; it's for real tabular data.
- Mark the actions column `mobileLayout="block"`. Its buttons name themselves, and pairing them with an "ACTIONS" label reads as a mistake.
- Don't set `responsive={false}` to "keep it looking like a table" on a phone. A table narrower than its content is unreadable; card mode is the honest fallback.

### Responsive

Below `--bp-md` the table renders one card per row. The threshold is measured on the table's **container**, not the viewport — a table inside a narrow panel goes card-mode on a wide monitor, which is what you want. Set `responsive={false}` to keep the table shape at every size.

Each column picks its card-mode layout with `mobileLayout`:

```jsx
<Table
  label="Active projects"
  columns={[
    { key: 'name', header: 'Project' },
    { key: 'build', header: 'Build', mono: true },
    { key: 'status', header: 'Status', render: (v) => <Badge tone="success" dot>{v}</Badge> },
    { key: 'actions', header: 'Actions', mobileLayout: 'block', render: () => <Button size="sm" variant="secondary">Open</Button> },
  ]}
  rows={rows}
/>
```

### Keyboard

The wide layout is a `role="grid"` with **one** tab stop. Tab reaches the grid, arrows move by cell — the header row is row 0 and is navigable, as APG prescribes — `Home` and `End` go to the first and last cell of the **current row**, and `Enter` activates the row when `onRowClick` is wired. There is no step-in: a control you drew inside a cell keeps its own place in the page Tab sequence, so nothing you own is silenced.

Card mode answers none of this. A card is a list item, and a list is traversed with Tab — but a card with `onRowClick` has no keyboard route at all, which is the one exception `Table.behaviour.json` still carries.

## Verifying the grid by hand

`Table` binds the `grid` pattern, so by Arena's rule it is DOM-tested by hand rather
than by a render suite — the measured RAM cost of a grid fixture is why. What is
automatic is in `frameworks/react/test/table.test.jsx` and covers the markup only:
the roles, the name, the `label` guard, and the tab-stop count. Everything below is
behaviour and only a person checks it.

Serve the tree with `bun run demos`, open
`frameworks/react/components/display/table-avatar.card.html`, and check all of:

1. Tab reaches the table ONCE, and one more Tab leaves it. No cell is a stop of its
   own. Controls YOU drew inside a cell are the exception and are meant to be: they
   are yours, Arena cannot silence markup it does not own, and taking them out of the
   Tab sequence would remove a route a keyboard user has today.
2. Arrow keys move by cell and clamp at all four edges — the first column, the last
   column, the header row at the top, the last body row at the bottom. Focus never
   leaves the grid.
3. `Home` and `End` stay INSIDE the current row: its first and last cell, never the
   first row of the table. Walk a middle row, not only the first.
4. `Enter` activates the row when `onRowClick` is wired, and does nothing on the
   header row.
5. Card mode answers none of it, and it is the surviving exception. That page renders
   the SAME table twice, the second time in a 340px container, so card mode is
   already on screen — check that a card with `onRowClick` is still mouse-only, and
   that nothing there took a `role`, a `tabindex` or a key handler by accident.
