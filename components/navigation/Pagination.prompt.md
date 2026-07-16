Jumps between pages of a large set (accompanies `Table` or long lists). Collapses with "…" when there are many pages.

```jsx
<Pagination page={p} pageCount={12} onChange={setP} />
```

**Do / Don't**
- Place it under the table/list, aligned to the right or centered.
- For continuous feeds use "load more" or infinite scroll, not Pagination.
