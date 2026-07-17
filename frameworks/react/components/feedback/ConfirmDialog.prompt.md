Protects irreversible actions (H3, H5). Does not close on click-outside. For the most destructive actions, require typing a word with `requireText`.

```jsx
<ConfirmDialog open={o} destructive requireText="DELETE"
  title="Delete project" confirmLabel="Delete permanently"
  onCancel={close} onConfirm={remove}>
  This action cannot be undone. 4 deployments and their history will be deleted.
</ConfirmDialog>
```

`destructive` fills the confirm button with `--danger-fill`, and this is the only place in Arena where danger is filled. Everywhere else danger is an outline — see the danger convention in the README.

### Do / Don't

- **Do** let `destructive` paint the button. The fill is `--danger-fill` over `--color-error-content`, and it is the only surface entitled to it.
- **Don't** rebuild the filled button yourself with `--danger`. That token is tuned to be read *as text* on the base surfaces, so it is too light to carry white: you get 3.67:1 in the dark theme, under WCAG AA. `--danger-fill` exists precisely for this.
- **Don't** reach for `destructive` on a merely important action. A filled red competes with the primary button; if it is not a point of no return, an ordinary `<Button variant="danger">` outline is the right shape.
- **Do** add `requireText` when the action destroys data that cannot be rebuilt.