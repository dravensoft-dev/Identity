Persistent message on the page (status notice, system condition, context). Stays until the condition is resolved — unlike `Toast`, which is ephemeral.

```jsx
<Alert tone="warning" title="Staging environment"
  actionLabel="Go to production" onAction={goProd}>
  Changes here don't affect real users.
</Alert>

<Alert tone="danger" title="Certificate expired" dismissible onClose={hide}>
  Renew the TLS within 48 h to avoid outages.
</Alert>
```

**Do / Don't**
- Alert = persistent and inline; Toast = ephemeral and floating. Don't swap them.
- If dismissible, the close is the standard `ph-x` icon (H4). `dismissible` gates the
  × — pass it explicitly; `onClose` alone (with `dismissible` absent) renders no ×.
- Reserve `danger` for blocking conditions; for full-page errors use `ErrorState`.
