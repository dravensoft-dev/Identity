Brand lock-up: a mark paired with a product name. `mark` and `name` are required —
nothing defaults, so the first render is either your brand or a type error, never
Dravensoft's by accident.

```jsx
<AppLogo size="sm"
  mark={<img src="../../../assets/rotor-crimson.svg" alt="" />}
  name="Draven" dim="soft" />
```

`size` picks both halves at once — the mark's slot and the wordmark's size. It is a
fixed repertoire, not a ratio: `sm` (30/17) sits beside a product name in an
application frame, `md` (40/24) heads a signed-out panel, `lg` (54/34) is the brand
manual's Primary · horizontal, and `xl` (124/78) is the hero case, where the lock-up
is the only thing on the screen. All eight numbers are `--logo-*` tokens.

The manual's three variants are expressible without a `variant` prop, because they
are two decisions and not three:

| Manual variant | mark | wordmark |
|---|---|---|
| Primary · horizontal | `rotor-crimson.svg` | `name="Draven" dim="soft"` |
| Vertical · stacked | `rotor-crimson.svg` | same, `orientation="vertical"` |
| Monochrome · single ink | `rotor-bone.svg` | `name="Dravensoft"`, no `dim` |

## Do / Don't

- **Do** pass the mark as an asset, so the call site names which brand it renders.
- **Do** give the mark an empty `alt` — the wordmark beside it is the accessible name,
  and a mark announced separately reads the brand twice.
- **Don't** put a `width` or `height` on the node you pass as `mark`. `AppLogo` sizes
  the slot and the mark fills it; a mark that sizes itself fights the lock-up.
- **Don't** look for a component that renders the mark on its own. Arena ships none:
  the mark is a brand asset (`assets/rotor-*.svg`), and the lock-up is this component,
  which takes that asset as `mark` alongside a product `name`.
- **Don't** mix the variants. A crimson mark beside an undivided `DRAVENSOFT` is half
  of Primary and half of Monochrome — no variant at all, and precisely the defect that
  existed in the console before this component held the rule.
