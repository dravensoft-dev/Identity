Action button. The main action uses `variant="primary"` (crimson), maximum one per view.

```jsx
<Button variant="primary" onClick={deploy}>Deploy</Button>
<Button variant="secondary" icon="ph-bold ph-arrow-counter-clockwise">Roll back</Button>
<Button variant="secondary" iconRight="ph-bold ph-caret-down">Actions</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger" loading>Deleting…</Button>
```
Variants: primary · secondary · ghost · danger. Sizes sm/md/lg. Props: icon, iconRight, loading, full, disabled.

- Pass `icon` and `iconRight` as Phosphor class names: `icon="ph-bold ph-plus"`. Arena draws each `<i>` and hides it from assistive technology; `icon` sits before the label, `iconRight` after it. While `loading`, the spinner replaces the leading icon.
- Don't pass an element as `icon` or `iconRight`. A single icon is a class name in Arena, which keeps the glyph inside `check:compliance`'s reach and inside Arena's own iconography.
