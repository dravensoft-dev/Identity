Bulk actions (H7). Appears when there's a selection and operates on the set. Combine it with `ConfirmDialog` for destructive actions. `actions` is an array of `{ id, label, icon?, destructive? }`, where `id` is a stable identity so a host can switch on it rather than on the label, and `icon` is a Phosphor class name Arena draws, never a node. Activating one fires `onRun` with the action; there is no per-action `onClick`.

```tsx
<BulkActionBar count={selected.length} noun="deployments" onRun={(action) => run(action)} onClear={() => setSelected([])}
  actions={[
    { id: 'retry', label: 'Retry', icon: 'ph-bold ph-arrow-clockwise' },
    { id: 'archive', label: 'Archive', icon: 'ph-bold ph-archive' },
    { id: 'delete', label: 'Delete', icon: 'ph-bold ph-trash', destructive: true },
  ]} />
```

`clearable` (default `true`) gates the Clear control; pass `clearable={false}` to hide it entirely.

### It stacks when its own container is narrow

`layout` defaults to `auto`, which measures **the bar's own container** rather than the viewport
and drops the count, the actions and Clear onto separate rows below `--bp-sm`. Set `inline` when
the bar sits somewhere you know is wide.

**Stacking reorders nothing**, and that is the whole reason the member exists rather than a
consumer reaching in with CSS. Reordering the bar's children by position moves what is on screen
and leaves the tab sequence where it was, so the focus order and the reading order stop matching,
and it breaks again the next time anything inside the bar moves. Both layers assert that the
control order is identical in the two shapes.

**Do / Don't**
- Mark `destructive` on irreversible actions and chain it with `ConfirmDialog`.
- Don't fire bulk actions without confirmation or without leaving `onClear` to undo the selection.
- Don't reach for `clearable={false}` casually: a selection whose edges the user cannot see is one they act on by accident.
