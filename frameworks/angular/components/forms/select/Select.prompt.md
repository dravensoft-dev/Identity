Arena select — a styled **native** `<select>`. Standalone, `OnPush`, signal I/O. Styling is the
sibling `Select.variants.ts` recipe; the component carries no CSS classes of its own. The host is
the field's column — label above, control below — so put `<arena-select>` straight into a form
row.

Native is the whole design, not a shortcut. The browser draws the popup, runs its keyboard and
gives a phone its own platform picker; Arena supplies the surface, the caret and the focus ring.
That is why it binds the `select` pattern rather than `combobox`, and why `aria-expanded`,
`aria-controls` and `aria-activedescendant` are absent — authoring them would be a claim about a
popup this component does not own.

```html
<arena-select label="Environment" [options]="environments" [value]="env()" name="env"
              (change)="env.set($event)" />
```

```ts
protected readonly environments: SelectOption[] = [
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];
```

`label` is what names the control for assistive technology — Arena renders a real `<label for>`
pointing at the control's own generated id. It is optional in the contract, but a select with no
label and no surrounding `<label>` has no accessible name at all, so supply one or name it from
outside.

`change` carries the chosen **value**, not the event. The native `change` a `<select>` fires
shares that name, so Arena stops it inside the host: a consumer listening on an ancestor is told
once, by the output, and never by the raw DOM event. `Select.compliance.test.ts` measures that
rather than asserting it in prose.

**Do / Don't**
- **Do** give every option a `value` distinct from its `label`. `value` is what submits and what
  `value` is matched against; `label` is free to read differently.
- **Do** pair it with `name` when the control is inside a real form. The attribute lands on the
  control, never on `<arena-select>`.
- **Don't** reach for `multiple` expecting a multi-selection to arrive. The contract's `change`
  carries a single `string`, which cannot express one — the attribute reaches the element and the
  event reports the first selected option, in **both** layers. `DOUBTS.md` records it as a
  contract-level gap rather than an implementation one.
- **Don't** put more than a handful of options in it. A long or searchable list is
  `arena-command-palette`'s job, and a set of three or four mutually exclusive choices already
  visible on the page is `arena-segmented-control`'s.

**By hand, in real Chromium** — the popup is the browser's and happy-dom has none, so nothing
below is provable by a suite. Run `bun run demos` and open
`/frameworks/angular/components/forms/select/Select.card.html`:
- The popup opens on click and on Space, walks with the arrow keys and type-ahead, and commits on
  Enter — all of it the platform's, none of it Arena's.
- The caret sits inside the field's right padding and swallows no click: pressing it opens the
  control beneath it.
- The focus ring is Arena's `--focus-width` in `--color-secondary`, and the platform outline is
  gone.
- Disabled dims the whole column, label included, and the control refuses the pointer.
