Icon-only button for toolbars and rows. Always pass `label` (accessible name in all states). Where there's room, use `showLabel` so you don't rely only on the hover tooltip (H6).

```jsx
<IconButton label="More options" icon="ph-bold ph-dots-three-vertical" />
<IconButton variant="solid" showLabel label="New project" icon="ph-bold ph-plus" />
```

- Pass `icon` as a Phosphor class name — `icon="ph-bold ph-plus"`. Arena draws the `<i>` and hides it; `label` is what a screen reader announces.
- Don't pass an element as the icon. A single icon is a class name in Arena, which keeps the glyph inside `check:compliance`'s reach and inside Arena's own iconography.
