Icon-only button for toolbars and rows. Always pass `label` (accessible name in all states). Where there's room, use `showLabel` so you don't rely only on the hover tooltip (H6).

```jsx
<IconButton label="More options"><i className="ph-bold ph-dots-three-vertical"/></IconButton>
<IconButton variant="solid" showLabel label="New project"><i className="ph-bold ph-plus"/></IconButton>
```
