Tabla de datos para superficies densas. Encabezados en mono/mayúsculas, filas separadas por hairline. Envuélvela en `.arena-compact` para densidad experta sin tocar props.

```jsx
<Table
  columns={[
    { key:'build', header:'Build', mono:true },
    { key:'proyecto', header:'Proyecto' },
    { key:'estado', header:'Estado', render:(v)=><Badge tone={v==='ok'?'success':'danger'} dot>{v}</Badge> },
    { key:'p95', header:'p95', align:'right', mono:true },
  ]}
  rows={deploys} getRowKey={r=>r.build} onRowClick={openDeploy} />
```

**Hacer / No hacer**
- Datos numéricos y códigos en columnas `mono` y `align:'right'`.
- Estados con `Badge`, no texto suelto.
- No la uses para maquetar; es para datos tabulares reales.
