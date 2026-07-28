Arena in-page message. Unlike a snackbar it is persistent: it belongs where the
condition it reports lives, and it stays until that condition is resolved. `tone`
carries the severity and picks the Phosphor Fill icon; `actionLabel` adds one
uppercase mono action; `dismissible` adds the single `ph-x` close control. Styling is
the sibling `alert.variants.ts` recipe.

```html
<arena-alert tone="warning" title="Deploy window closes in 20 minutes">
  Merge or park the release before 18:00 UTC.
</arena-alert>

<arena-alert tone="danger" title="Sync failed" actionLabel="Retry" [dismissible]="true"
             (action)="retry()" (close)="hide()">
  Three records could not be written.
</arena-alert>
```

**Do / Don't**
- Use `tone="danger"` only for a condition the user must act on. It renders
  `role="alert"`, which interrupts a screen reader; every other tone renders
  `role="status"`, which does not.
- Don't use an alert for something transient — that is `MatSnackBar` wearing Arena.
- Don't stack more than one alert in the same region. Two competing alerts read as
  one broken page; summarise instead.
- Don't express a condition as an attribute string. `dismissible` carries the
  `booleanAttribute` transform, so a bare `dismissible` and `[dismissible]="true"` both
  mean true, and the one literal string `"false"` means false. Every *other* string is
  true — `"0"`, `"off"` and `"no"` all suppress nothing. Bind the expression
  (`[dismissible]="canDismiss"`) and keep the bare attribute for a constant true.
