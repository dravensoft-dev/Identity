Arena text field — label above, hint or error below, and a validation state the field wears.
Standalone, `OnPush`, signal I/O. Styling is the sibling `Input.variants.ts` recipe; the host binds
the root slot, so `<arena-input>` is itself the column its parent lays out. The control is a real
`<input>`, named by a real `<label for>`.

```html
<arena-input label="Project name" [value]="name()" (change)="name.set($event)"
             hint="Lowercase, no spaces" required />

<arena-input label="Repository" icon="ph-bold ph-git-branch" prefix="git@"
             [value]="repo()" (change)="repo.set($event)" />

<arena-input label="Contact email" type="email" [value]="email()" (change)="email.set($event)"
             [validate]="notEmpty" validateOn="change" />

<arena-input label="Slug" [value]="slug()" [error]="serverError()" (change)="slug.set($event)" />
<arena-input label="Created" type="date" [value]="created()" readOnly />
```

**This is the repository's only `functionInput`.** `validate` is a function the consumer supplies
and the component calls on the value; its signature is modelled in the contract
(`params { value: string }`, `returns string`) and `check:api` compares it against this class
member, so the type is written as the bare arrow with required-ness carried by `input()` rather
than by a `| undefined` in the type:

```ts
readonly validate = input<(value: string) => string>();
```

Return the message, or the empty string when the value is good.

**Do / Don't**
- It is **controlled**. `value` is what the consumer owns; `change` fires on every keystroke and
  carries the text. **Angular will not force the DOM back**: ignore `change` and the box keeps
  what the user typed. Wire the signal.
- `error` **wins over `validate`**, and it wins even when it is the empty string: a controlled
  error that is present-and-blank suppresses the validator and shows the hint. Every use of the
  resolved error reads its truthiness rather than its nullness, which is what
  `Input.json` contracts. Pass `undefined`, not `''`, to mean "no controlled error".
- `validate` runs on blur by default. Its message appears only once the field is **touched**, so
  an untouched form never accuses the user of anything. `validateOn="change"` touches on the
  first keystroke instead — reach for it on a field with a cheap, obvious rule.
- The valid state (green ring, check) is either `valid` set by the consumer, or a touched field
  whose validator returned nothing. It is not "the field has a value".
- The focus ring is the recipe's, not the component's: the `field` slot carries `focus-within:`,
  so there is no focus signal to keep in sync with the DOM.
- `id` is derived from `label` as `in-<slug>` when you do not pass one — the derivation
  `Input.json` states, so the same markup gets the same id in every layer. Pass `id` when two
  fields share a label.
- `required` and `readOnly` land on the native attributes rather than on `aria-required` and
  `aria-readonly`. Those are what a native control's accessibility tree already reports, and
  writing both would be two claims that can disagree.
- `icon`, `prefix` and the status glyphs are decoration and all four are `aria-hidden`. The error
  message beside the glyph is what carries the state, so nothing announces a Phosphor
  ligature beside the message it duplicates.
- The error line **replaces** the hint rather than stacking under it. Two lines of guidance under
  one field is one too many.
- `type` is the `InputType` enum. `checkbox` and `radio` are not among them — those are
  `<arena-checkbox>` and `Radio`, their own components.
- Don't reach for `change` to run an expensive query. It fires per keystroke by design; debounce
  in the consumer, where the interval is a decision about that query rather than about the field.

**By hand, in real Chromium** — none of these is provable in happy-dom. Run `bun run demos` and
open `/frameworks/angular/components/forms/input/Input.card.html`:
- `type="date"`: the picker indicator is **visible** on the dark field and brightens on hover.
  That is the shared manifest's `[&::-webkit-calendar-picker-indicator]:` block reading
  `--picker-invert`; without it the browser draws a black glyph on a dark surface. Toggle
  `.arena-light` on `<html>` and it must invert with the theme.
- The gold focus ring appears on the field group, not on the input, and a valid field keeps its
  green border while showing that ring.
- The error border and ring appear at rest, with no focus needed.
- Typing into the validated field and leaving it produces the message on blur, and the
  `validateOn="change"` one produces it while typing and clears it again.
