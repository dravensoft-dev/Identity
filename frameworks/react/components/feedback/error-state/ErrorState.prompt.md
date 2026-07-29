Error state with a recovery path (H9). Arena draws the retry button itself from
`retryLabel` (absent renders no retry); `onRetry` handles the click. `secondaryAction`
is a slot beside it for a consumer-supplied extra control, and `code` is a diagnostic
exposed as a mono chip.

```jsx
<ErrorState icon="ph-fill ph-warning-octagon" title="Couldn't load the panel"
  message="No connection to the metrics service." code="ERR_UPSTREAM_504"
  retryLabel="Retry" onRetry={reload}
  secondaryAction={<Button variant="secondary">View logs</Button>} />
```

**Do / Don't**
- Always pass `retryLabel` when a retry could work. An error state with no retry is a
  dead end the user has to navigate out of.
- `icon` is a Phosphor class name (a string), never a JSX node — Arena draws the glyph.
- Don't put the raw exception in `message`. The code chip is where a machine-readable
  detail goes; the message is for a person.
- Don't use this for a validation failure on a field — that belongs on the field.
