Protects irreversible actions (H3, H5). Does not close on click-outside. For the most destructive actions, require typing a word with `requireText`.

```jsx
<ConfirmDialog open={o} destructive requireText="DELETE"
  title="Delete project" confirmLabel="Delete permanently"
  onCancel={close} onConfirm={remove}>
  This action cannot be undone. 4 deployments and their history will be deleted.
</ConfirmDialog>
```