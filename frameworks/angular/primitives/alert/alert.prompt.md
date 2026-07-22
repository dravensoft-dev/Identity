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
             (action)="retry()" (closed)="hide()">
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
- Don't write `dismissible="false"` expecting it to suppress the close control. A bare
  `dismissible` and `[dismissible]="true"` both mean true — that much now matches a
  native HTML boolean attribute, because `dismissible` carries the `booleanAttribute`
  transform. But unlike a native attribute, the literal string `"false"` also reads as
  **false**, since `booleanAttribute` special-cases that one value rather than treating
  any present value as true. A condition belongs in a binding: `[dismissible]="cond"`.
