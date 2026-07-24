Arena loading placeholder. It reserves the layout the real content will occupy, so a
table or a dashboard fills in rather than jumping. `variant="text"` with `lines`
renders a stack whose last line is short, the way a paragraph ends; `line`, `block`
and `circle` are single shapes. `width`, `height` and `radius` are CSS strings that
override the recipe's per-variant defaults; each applies only where the shape has
something to override — see the table below. Styling is the sibling
`skeleton.variants.ts` recipe.

```html
<arena-skeleton variant="text" [lines]="3" />
<arena-skeleton variant="circle" />
<arena-skeleton variant="block" />
<arena-skeleton variant="block" width="12rem" height="72px" radius="var(--r-lg)" />
<arena-skeleton variant="circle" width="40px" />
```

| variant | `width`        | `height`       | `radius`             |
|---------|----------------|----------------|-----------------------|
| `text`  | applies (stack)| — (rows fixed) | — (rows fixed)        |
| `line`  | applies        | applies        | — (fixed small radius)|
| `block` | applies        | applies        | applies                |
| `circle`| diameter (`height` wins if both are set) | same diameter | — (always a perfect circle) |

**Do / Don't**
- Match the placeholder to the shape of what is loading — a circle for an avatar, a
  block for a card. A placeholder that does not match the content is a layout jump
  with extra steps.
- `radius` only affects `variant="block"`. Passing it to `circle`, `line` or `text`
  has no effect — a circle is always a perfect circle, and the rows stay a fixed
  small radius.
- Don't animate a skeleton that will be on screen for more than a moment or two: the
  shimmer stops entirely under `prefers-reduced-motion`, and it is decoration, not a
  progress report. Use `mat-progress-bar` when there is real progress to report.
- Don't wrap a skeleton in a live region of your own — it already carries
  `role="status"`.
