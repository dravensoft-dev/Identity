Persistent message on the page (status notice, system condition, context). Stays until the condition is resolved, unlike `Toast`, which is ephemeral.

```tsx
<Alert tone="warning" title="Staging environment"
  actionLabel="Go to production" onAction={goProd}>
  Changes here don't affect real users.
</Alert>

<Alert tone="danger" title="Certificate expired" dismissible onClose={hide}>
  Renew the TLS within 48 h to avoid outages.
</Alert>
```

<!-- @api GENERATED from contracts/api/components/Alert.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `tone` | enum | `ArenaAlertTone` | `"info"` | The severity: colour, default icon, and (for danger) the alert role. |
| `title` | primitive | `string` |  | An optional bold lead line above the message. |
| `children` | slot |  |  | The message body. |
| `icon` | primitive | `string` |  | A Phosphor class name overriding the tone's default glyph. Arena draws it. |
| `actionLabel` | primitive | `string` |  | The label of a single inline action button. Absent renders no action. |
| `onAction` | event |  |  | The inline action button was activated. |
| `dismissible` | primitive | `boolean` | `false` | Whether the × is shown. Every layer gates the × on this member and never on whether anything listens for `close`, because Arena never derives what it draws from what a consumer listens for. |
| `onClose` | event |  |  | The × was activated. |

<!-- @api end -->

**Do / Don't**
- Alert = persistent and inline; Toast = ephemeral and floating. Don't swap them.
- If dismissible, the close is the standard `ph-x` icon (H4). `dismissible` gates the
  ×, pass it explicitly; `onClose` alone (with `dismissible` absent) renders no ×.
- Reserve `danger` for blocking conditions; for full-page errors use `ErrorState`.
