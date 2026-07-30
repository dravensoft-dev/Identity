Arena's Angular Material bridge — maps Arena tokens onto Angular Material's
`--mat-*` custom properties (zero `--mdc-*` names remain; Material renamed them all
upstream) so the components it actually carries rules for render in Arena without
being ported: the outlined form field, cards, dialogs, tables
(plus the header cell), tabs, the snackbar, the progress spinner and bar, and
SideNav's nav list. The rest of Material's components still render with Material's
own defaults — see `frameworks/angular/README.md`'s "What Material provides, and
what Arena does" for the full dressed/undressed partition.

**Import order (load-bearing):** import `arena-material.css` **after** Angular
Material's own theme, so these token bindings win the cascade.

```css
@import 'path/to/@angular/material/prebuilt-themes/…';  /* or your material-theme.scss */
@import '.../frameworks/angular/theme/arena-material.css';
```

**What Arena maps vs. what you still own.** Arena maps *tokens* — colors, radii,
the table micro-label. It does **not** replace Material's SCSS palette: you keep
`material-theme.scss` and rebind its primary/secondary palette to Arena's brand
(`--color-primary` / `--color-secondary`). Density and typography config stay yours.

**One scope is narrower than it looks, and one is gone.** No Material button is dressed
at all any more: `arena-button` and `arena-icon-button` are primitives, so the
`.mat-mdc-unelevated-button`, `.mat-mdc-outlined-button` and `.arena-danger` blocks went
with the last delegated entry that cited them. Use the primitives, and note that the form
field's remaining consumer is `MatSelect` alone -- `arena-input` and `arena-textarea` are
primitives too, so the outlined-field block survives only for `Select`. It is dressed
only under `.mat-form-field-appearance-outline`; `fill` is Material's default appearance,
not `outline`, so an app that never opts into the outline appearance gets no theming for
its selects from this bridge at all.

**The bridge is verified, not rendered.** `bun run check:material` asserts every
custom property the bridge sets is a name the installed Angular Material package
actually reads, and that every Arena token it references exists. That checks a
name EXISTS, not that it is the right name for the element being styled, and it
never looks at the selectors those properties sit in — see the header of
`scripts/check-material.mjs` for the gate's disclosed limits in full. There is no
Angular Material application in this repo, so this has been verified name-by-name
against the installed package, not visually confirmed in a running app.

**Do / Don't**
- Reach for `<arena-button variant="danger">` for a destructive action — it renders as
  an outline (border + text in `--color-error`). Never make a filled danger button; the
  only filled danger surface is `ConfirmDialog`'s final confirmation. There is no longer
  an `arena-danger` class on a `mat-button`: this bridge dresses no button.
- Set `appearance="outline"` on `<mat-form-field>` — the bridge does not style the
  `fill` appearance, so an outlined form field is the one that actually wears Arena.
  Bind the input, not the class: `mat-form-field-appearance-outline` is what Material
  generates from it, and hand-adding the class yields the outline CSS hooks without
  the outline template.
- Don't add a value here that isn't a `var()` into a token. If a control needs a
  colour Arena doesn't have, add the token first.
