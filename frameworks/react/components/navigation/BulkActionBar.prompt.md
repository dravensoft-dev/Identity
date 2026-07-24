Bulk actions (H7). Appears when there's a selection and operates on the set. Combine it with `ConfirmDialog` for destructive actions. `actions` is an array of `{ label, icon?, destructive? }`, where `icon` is a Phosphor class name Arena draws — never a node. Activating one fires `onRun` with the action; there is no per-action `onClick`.

```jsx
<BulkActionBar count={selected.length} noun="deployments" onRun={(action) => run(action)} onClear={() => setSelected([])}
  actions={[
    { label: 'Retry', icon: 'ph-bold ph-arrow-clockwise' },
    { label: 'Archive', icon: 'ph-bold ph-archive' },
    { label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
  ]} />
```

`clearable` (default `true`) gates the Clear control; pass `clearable={false}` to hide it entirely.

**Do / Don't**
- Mark `destructive` on irreversible actions and chain it with `ConfirmDialog`.
- Don't fire bulk actions without confirmation or without leaving `onClear` to undo the selection.
- Don't reach for `clearable={false}` casually — a selection whose edges the user cannot see is one they act on by accident.
