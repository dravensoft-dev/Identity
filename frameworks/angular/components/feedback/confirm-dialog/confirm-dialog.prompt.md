Arena confirmation for a high-consequence action. It does not close on click-outside —
losing a half-finished decision to a stray click is the failure this component exists
to prevent. `requireText` makes the user type a word before the confirm button
enables. `destructive` turns the eyebrow red and gives the confirm button Arena's
**only filled danger surface**. Styling is the sibling `confirm-dialog.variants.ts`
recipe.

```html
<arena-confirm-dialog [open]="confirming()" [destructive]="true"
                      [title]="'Delete project Ardennes?'"
                      eyebrow="Irreversible" confirmLabel="Delete project"
                      requireText="Ardennes"
                      (cancel)="confirming.set(false)" (confirm)="destroy()">
  Every deployment, log and artifact under this project is removed. This cannot be
  undone.
</arena-confirm-dialog>
```

`title` is **required**: the panel's `aria-labelledby` points at it, and nothing can
derive a name for a confirmation because its subject is editorial. Escape dismisses
through `(cancel)`, focus moves into the panel on open and returns to the invoker on
close, and Tab wraps at the panel's edges.

**Do / Don't**
- Say what will be destroyed, in the body, in plain words. "Are you sure?" is not a
  confirmation, it is a speed bump.
- **Bind `title`, never write it as a static attribute.** `title="Delete project X"`
  compiles and does set the input — and it also lands on the host as the native HTML
  `title` attribute, whose host here is the fixed full-viewport scrim, so the browser
  paints a tooltip over the **entire viewport** for as long as the dialog is open.
  `[title]="'Delete project X'"` or `[title]="projectName()"` sets the input alone.
  This is a live defect of nine primitives, recorded in `components-divergences.md`;
  the spelling above is the workaround until `'[attr.title]': 'null'` is applied
  across all of them.
- Use `requireText` when the action is genuinely irreversible, and use the name of the
  thing being destroyed as the word.
- Don't reach for `destructive` on a merely inconvenient action. The filled red is the
  system's loudest surface and it stops working once it is common.
- Don't use this for a routine question — that is `MatDialog` wearing Arena.
- Don't express a condition as an attribute string. `destructive` carries the
  `booleanAttribute` transform, so a bare `destructive` and `[destructive]="true"` both
  mean true, and the one literal string `"false"` means false. Every *other* string is
  true — `"0"`, `"off"` and `"no"` all give you the destructive button. Whether an
  action is irreversible is a computed fact, so bind it:
  `[destructive]="isIrreversible"`. Keep the bare attribute for a constant true.
