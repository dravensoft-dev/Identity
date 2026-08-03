Jumps between pages of a large set (accompanies `Table` or long lists). Collapses with "…" when there are many pages.

```tsx
<Pagination page={p} pageCount={12} ariaLabel="Deployments" onChange={setP} />
```

<!-- @api GENERATED from contracts/api/components/Pagination.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `page*` | primitive | `number` |  | The current page, 1-based. |
| `pageCount*` | primitive | `number` |  | How many pages there are. Required, and guarded at runtime: a Pagination with no page count renders a window over nothing. |
| `ariaLabel*` | primitive | `string` |  | Names this navigation landmark. Required, and guarded at runtime: two paginated tables in one dashboard is a routine layout, and a shared constant name leaves them indistinguishable while satisfying the requirement mechanically. It was optional with a "Pagination" default for one batch, which narrowed the gap rather than closing it: a name the caller omits is still the constant. Say what is being paged: "Deployments", not "Pages". |
| `onChange` | event | `number` |  | A page was chosen; carries the new 1-based page. Never fires for the current page, nor for a page outside 1..pageCount. |

<!-- @api end -->

`page` and `pageCount` are both required and both throw when absent. Neither has
a default worth having, since a `Pagination` that assumes page 1 of 1 draws a
one-page control over a set whose size nobody told it.

`ariaLabel` names the landmark and is **required**, throwing when absent, in the
same shape as `Table.label` and `SegmentedControl.ariaLabel`. A `"Pagination"`
default narrows the gap rather than closing it: two paginated tables in one
dashboard is a routine layout, and a caller who omits the name still leaves two
landmarks called "Pagination" that a screen-reader user cannot tell apart.
Nothing can derive it, so nothing
defaults it. Name what is being paged ("Deployments"), never the widget
("Pages").

**Do / Don't**
- Place it under the table/list, aligned to the right or centered.
- For continuous feeds use "load more" or infinite scroll, not Pagination.
- Don't reach for `style` to place it. It takes none; wrap it in a `<div>` that owns the margin.
