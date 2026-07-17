Arena's Angular Material bridge — maps Arena tokens onto Material's `--mdc-*` /
`--mat-*` custom properties so every Material-backed control (button, form-field,
card, dialog, table, tabs, snackbar, progress) wears Arena without being ported.

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

**Do / Don't**
- Use `class="arena-danger"` on a `mat-button` / `mat-stroked-button` for a
  destructive action — it renders as an outline (border + text in `--color-error`).
  Never make a filled danger button; the only filled danger surface is
  `ConfirmDialog`'s final confirmation.
- Don't add a value here that isn't a `var()` into a token. If a control needs a
  colour Arena doesn't have, add the token first.
