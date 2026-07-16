Bulk actions (H7). Appears when there's a selection and operates on the set. Combine it with `ConfirmDialog` for destructive actions.

```jsx
<BulkActionBar count={selected.length} noun="deployments" onClear={() => setSelected([])}
  actions={[
    { label: 'Retry', icon: <i className="ph-bold ph-arrow-clockwise"/>, onClick: retryAll },
    { label: 'Archive', icon: <i className="ph-bold ph-archive"/>, onClick: archiveAll },
    { label: 'Delete', icon: <i className="ph-bold ph-trash"/>, onClick: () => setConfirm(true), destructive: true },
  ]} />
```

**Do / Don't**
- Mark `destructive` on irreversible actions and chain it with `ConfirmDialog`.
- Don't fire bulk actions without confirmation or without leaving `onClear` to undo the selection.
