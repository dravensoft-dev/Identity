Acciones masivas (H7). Aparece cuando hay selección y opera sobre el conjunto. Combínalo con `ConfirmDialog` para las acciones destructivas.

```jsx
<BulkActionBar count={selected.length} noun="despliegues" onClear={() => setSelected([])}
  actions={[
    { label: 'Reintentar', icon: <i className="ph-bold ph-arrow-clockwise"/>, onClick: retryAll },
    { label: 'Archivar', icon: <i className="ph-bold ph-archive"/>, onClick: archiveAll },
    { label: 'Eliminar', icon: <i className="ph-bold ph-trash"/>, onClick: () => setConfirm(true), destructive: true },
  ]} />
```

**Hacer / No hacer**
- Marca `destructive` en lo irreversible y encadénalo con `ConfirmDialog`.
- No dispares acciones masivas sin confirmación ni sin dejar `onClear` para deshacer la selección.
