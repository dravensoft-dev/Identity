One row of a `Table`. Write one per row, with one `TableCell` inside it per cell. It only makes sense as a child of `Table`, which injects where the row sits, which columns its cells are set against, and how the keyboard reaches them.

```tsx
<TableRow key={d.build} interactive onClick={() => openDeploy(d)}>
  <TableCell>{d.build}</TableCell>
  <TableCell>{d.project}</TableCell>
  <TableCell><Badge tone="success" dot>Deployed</Badge></TableCell>
</TableRow>
```

**Do / Don't**
- Put `key` on the row. It is React's own reconciliation, not an Arena member; `Table` has no `getRowKey`.
- `onClick` takes no argument. You wrote this element inside your own `.map()`, so you already hold the row it is about; a payload would hand you back what you just had.
- Cells are **positional**: the nth `TableCell` reads the nth entry of `Table`'s `columns`. Keep them in the same order.
- Don't write a bare `<td>` or a `<div>` as a child. `TableRow` injects a cell's column, layout and keyboard props into each child, and only `TableCell` knows what to do with them.
- Don't reach for the row to style a cell: alignment, width and the mono/gold treatment are the **column's**, so they stay the same all the way down.
- **Pass `interactive` alongside `onClick`, or the row is inert.** The flag is what makes the card shape a `role="button"` tab stop with an Enter/Space handler; without it the row draws and activates nothing. It is a member rather than "is `onClick` bound?" because R6 in `contracts/api/README.md` forbids deriving a render from whether a listener is bound: derived that way, a clickable card row renders pointer-only in a layer that cannot ask the question, and nothing says so.
- Wire it only when the whole row means something to activate. A row with one actionable thing in it wants a `Button` in a cell instead, and a table whose rows are all `interactive` puts a tab stop on every one of them.

### What is injected, and therefore not yours

`rowIndex`, `columns`, `layout`, `cursorCol`, `gridFocused` and `onCellFocus` arrive from `Table` through `cloneElement`. They are not part of this component's API, are not in `contracts/api/components/TableRow.json`, and a consumer never writes one, in the same shape as `RadioGroup` injecting `name`/`checked`/`onSelect` into each `Radio`.
