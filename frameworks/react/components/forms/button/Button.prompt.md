Action button. The main action uses `variant="primary"` (crimson), maximum one per view.

```tsx
<Button variant="primary" onClick={deploy}>Deploy</Button>
<Button variant="secondary" icon="ph-bold ph-arrow-counter-clockwise">Roll back</Button>
<Button variant="secondary" iconRight="ph-bold ph-caret-down">Actions</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger" loading>Deleting…</Button>
```

<!-- @api GENERATED from contracts/api/components/Button.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `children` | slot |  |  | The button's label. Sits between the two icons when both are given. |
| `variant` | enum | `ArenaButtonVariant` | `"primary"` | Which action this is. Danger is outline, never filled. |
| `size` | enum | `ArenaControlSize` | `"md"` | Height, from the density tokens, so the button re-densifies inside .arena-compact. |
| `icon` | primitive | `string` |  | Phosphor class name drawn before the label. Replaced by the spinner while loading. |
| `iconRight` | primitive | `string` |  | Phosphor class name drawn after the label: a caret on a menu trigger, an arrow on a next action. |
| `loading` | primitive | `boolean` | `false` | Replaces the leading icon with a spinner and blocks activation. The spin slows under reduced motion rather than stopping: a frozen spinner reads as a hung process. |
| `full` | primitive | `boolean` | `false` | Stretches to the container's width. |
| `disabled` | primitive | `boolean` | `false` | Blocks activation and dims the control. Implied by loading. |
| `type` | enum | `ArenaButtonType` | `"button"` | Native button behaviour. Defaults to 'button' so a button inside a form does not submit it by accident. |
| `name` | primitive | `string` |  | Submitted with the form, when the button submits one. |
| `value` | primitive | `string` |  | The value submitted under `name`. |
| `autoFocus` | primitive | `boolean` | `false` | Focused on mount. |
| `form` | primitive | `string` |  | The id of the form this button belongs to, when it is not a descendant of it. |
| `tabStop` | primitive | `boolean` | `true` | Whether the control is reached from the page's Tab sequence. Set false when it lives inside a composite that manages its own focus (a grid with a roving tab stop, a menu), where reaching it by Tab would be a second way in. Arena writes tabindex="-1" and the control stays programmatically focusable; a positive tab order is not expressible and never should be. Table's actions column is where this one is needed: a Button inside a row of a grid. |
| `onClick` | event |  |  | The button was activated, by pointer or by keyboard. |

<!-- @api end -->
Variants: primary · secondary · ghost · danger. Sizes sm/md/lg. Props: icon, iconRight, loading, full, disabled.

- Pass `icon` and `iconRight` as Phosphor class names: `icon="ph-bold ph-plus"`. Arena draws each `<i>` and hides it from assistive technology; `icon` sits before the label, `iconRight` after it. While `loading`, the spinner replaces the leading icon.
- Don't pass an element as `icon` or `iconRight`. A single icon is a class name in Arena, which keeps the glyph inside Arena's own iconography and inside the markup Arena is answerable for.
