Error state with a recovery path (H9). Offers Retry and, if applicable, View logs + the diagnostic code.

```jsx
<ErrorState icon={<i className="ph-fill ph-warning-octagon" />} title="Couldn't load the panel"
  message="No connection to the metrics service." code="ERR_UPSTREAM_504"
  onRetry={reload} secondaryAction={<Button variant="secondary">View logs</Button>} />
```