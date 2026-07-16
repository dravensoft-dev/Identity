Persistent message on the page (status notice, system condition, context). Stays until the condition is resolved — unlike `Toast`, which is ephemeral.

```jsx
<Alert tone="warning" title="Staging environment"
  action={{ label:'Go to production', onClick:goProd }}>
  Changes here don't affect real users.
</Alert>
```

**Do / Don't**
- Alert = persistent and inline; Toast = ephemeral and floating. Don't swap them.
- If dismissible, the close is the standard `ph-x` icon (H4).
- Reserve `danger` for blocking conditions; for full-page errors use `ErrorState`.
