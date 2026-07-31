One cell of a `TableRow`. It draws the cell box, the padding, the alignment and the mono/gold treatment its column asks for, and in card mode either a label/value pair or a full-width block, and shows whatever you put in it.

```jsx
<TableCell>{d.p95}</TableCell>
<TableCell><Badge tone="danger" dot>Failed</Badge></TableCell>
<TableCell><Button variant="ghost" size="sm">Details</Button></TableCell>
```

**Do / Don't**
- Put a value in it, or one of Arena's own components: a `Badge` for a status, a `Button` for an action. This member is why `Table` is a compound component at all: a column-level `render` function would be per-item projection, which the library does not do, where a cell **you** instantiate is just an element you wrote.
- Don't set alignment, width or the mono face here. Those are the column's, so a column stays consistent down its whole length; a cell that styled itself would drift from its header.
- Don't add a `role` or a `tabIndex`. `role="gridcell"` and the roving tab stop belong to the enclosing `Table`'s grid and are injected; adding your own would put a second tab stop inside a composite that must have one.
- A control you put in a cell **is** a page-level tab stop, and that is deliberate. Arena cannot silence markup it does not own, and silencing it would take away a route a keyboard user has. Reaching it must cost exactly one Tab; step 2 of "Verifying the grid by hand" in `Table.prompt.md` is the standing check.
- Don't use it outside a `TableRow`. It renders, but with no column it has no alignment, no header to pair with in card mode, and no place in the keyboard order.

### What is injected, and therefore not yours

`column`, `layout`, `tabIndex`, `focused` and `onCellFocus` arrive from `TableRow` (fed by `Table`) through `cloneElement`. They are not part of this component's API, are not in `contracts/api/components/TableCell.json`, and a consumer never writes one, in the same shape as `RadioGroup` injecting `name`/`checked`/`onSelect` into each `Radio`.
