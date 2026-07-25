Jumps between pages of a large set (accompanies `Table` or long lists). Collapses with "…" when there are many pages.

```jsx
<Pagination page={p} pageCount={12} ariaLabel="Deployments" onChange={setP} />
```

`page` and `pageCount` are both required and both throw when absent — neither had
a default worth keeping, since a `Pagination` that assumes page 1 of 1 draws a
one-page control over a set whose size nobody told it.

`ariaLabel` names the landmark and defaults to `"Pagination"`. Pass it whenever a
page carries more than one of these — two paginated tables in one dashboard is a
routine layout, and two landmarks called "Pagination" are not distinguishable to
a screen-reader user moving between them. Name what is being paged
("Deployments"), never the widget ("Pages").

**Do / Don't**
- Place it under the table/list, aligned to the right or centered.
- For continuous feeds use "load more" or infinite scroll, not Pagination.
- Don't reach for `style` to place it. It takes none; wrap it in a `<div>` that owns the margin.
