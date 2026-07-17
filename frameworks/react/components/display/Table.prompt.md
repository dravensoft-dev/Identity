Data table for dense surfaces. Headers in mono/uppercase, rows separated by hairline. Wrap it in `.arena-compact` for expert density without touching props.

```jsx
<Table
  columns={[
    { key:'build', header:'Build', mono:true },
    { key:'project', header:'Project' },
    { key:'status', header:'Status', render:(v)=><Badge tone={v==='ok'?'success':'danger'} dot>{v}</Badge> },
    { key:'p95', header:'p95', align:'right', mono:true },
  ]}
  rows={deploys} getRowKey={r=>r.build} onRowClick={openDeploy} />
```

**Do / Don't**
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
  columns={[
    { key: 'name', header: 'Project' },
    { key: 'build', header: 'Build', mono: true },
    { key: 'status', header: 'Status', render: (v) => <Badge tone="success" dot>{v}</Badge> },
    { key: 'actions', header: 'Actions', mobileLayout: 'block', render: () => <Button size="sm" variant="secondary">Open</Button> },
  ]}
  rows={rows}
/>
```
