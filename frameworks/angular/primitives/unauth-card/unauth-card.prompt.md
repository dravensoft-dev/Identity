Arena's signed-out panel. A frame: the lock-up, an eyebrow, a title, whatever the screen
is actually for, and a footer. It knows nothing about credentials, so one component
serves sign-in, "check your inbox", "this link expired" and two-factor entry. Styling is
the sibling `unauth-card.variants.ts` recipe.

```html
<div class="flex min-h-screen items-center justify-center p-gutter">
  <arena-unauth-card eyebrow="Delivery Console" title="Sign in">
    <arena-app-logo brand name="Draven" dim="soft" size="md">
      <img src="/assets/your-mark.svg" alt="" />
    </arena-app-logo>

    <mat-form-field appearance="outline">
      <mat-label>Email</mat-label>
      <input matInput type="email" />
    </mat-form-field>

    <span footer>Trouble signing in? Contact your administrator.</span>
  </arena-unauth-card>
</div>
```

Import `ArenaBrand` and `ArenaFooter` from `frameworks/angular/primitives/projection-markers`
(or the primitives barrel) alongside `UnauthCard` in the host component's `imports` —
`brand` and `footer` are directives, not plain attributes, because they are how the panel
detects that something was actually projected into each slot. Both wrappers carry their
own margin, so a card that omits one ships no dead space for it.

**Do / Don't**
- Centre it yourself. The three-line wrapper above is the whole job, and keeping it out
  of the component is what lets the panel sit in a split layout or inside a dialog.
- Don't put auth logic here. Submit handlers, validation and provider buttons belong to
  the screen; this is the frame around them.
- Don't override the width. 454px is the figure this panel has always rendered at, and it
  is arithmetic — content, padding and both hairlines added back together.
- Don't forget to import `ArenaBrand` / `ArenaFooter` when projecting into `[brand]` /
  `[footer]` — without them, the attribute is inert and the content silently fails to
  render inside its wrapper.
