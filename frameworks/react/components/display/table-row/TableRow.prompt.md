One row of a `Table`. Write one per row, with one `TableCell` inside it per cell. It only makes sense as a child of `Table`, which injects where the row sits, which columns its cells are set against, and how the keyboard reaches them.

```jsx
<TableRow key={d.build} onClick={() => openDeploy(d)}>
  <TableCell>{d.build}</TableCell>
  <TableCell>{d.project}</TableCell>
  <TableCell><Badge tone="success" dot>Deployed</Badge></TableCell>
</TableRow>
```

**Do / Don't**
- Put `key` on the row. It is React's own reconciliation, not an Arena member — `Table` has no `getRowKey`.
- `onClick` takes no argument. You wrote this element inside your own `.map()`, so you already hold the row it is about; a payload would hand you back what you just had.
- Cells are **positional**: the nth `TableCell` reads the nth entry of `Table`'s `columns`. Keep them in the same order.
- Don't write a bare `<td>` or a `<div>` as a child. `TableRow` injects a cell's column, layout and keyboard props into each child, and only `TableCell` knows what to do with them.
- Don't reach for the row to style a cell — alignment, width and the mono/gold treatment are the **column's**, so they stay the same all the way down.
- Wire `onClick` only when the whole row means something to activate. A row with one actionable thing in it wants a `Button` in a cell instead — a `TableRow` with `onClick` is mouse-only in card mode, and that is a recorded exception rather than a feature.

### What is injected, and therefore not yours

`rowIndex`, `columns`, `layout`, `cursorCol`, `gridFocused` and `onCellFocus` arrive from `Table` through `cloneElement`. They are not part of this component's API, are not in `api/components/TableRow.json`, and a consumer never writes one — the same shape as `RadioGroup` injecting `name`/`checked`/`onSelect` into each `Radio`.
