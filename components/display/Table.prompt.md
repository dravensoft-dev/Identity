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
