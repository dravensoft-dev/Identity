Icon-only button for toolbars and rows. Always pass `label` (accessible name in all states). Where there's room, use `showLabel` so you don't rely only on the hover tooltip (H6).

```tsx
<IconButton label="More options" icon="ph-bold ph-dots-three-vertical" />
<IconButton variant="solid" showLabel label="New project" icon="ph-bold ph-plus" />
<IconButton label="Pin this view" icon="ph-bold ph-push-pin" pressed={pinned} onClick={() => setPinned(!pinned)} />
```

- **`pressed` is what makes it a toggle, and leaving it off is a state of its own.** Passed, Arena writes `aria-pressed` and draws the on state with the accent tint a current `SideNav` item takes; omitted, the control is not a toggle at all. Never default it to `false`: on a plain button `aria-pressed="false"` announces a toggle that is off rather than a button, so every icon button in the app would read as an unpressed toggle.
- **A toggle keeps its `label` in both states.** Changing the name to carry the state is the workaround `pressed` exists to end: a screen reader then announces a different control instead of the same one in another state. Name what it does, not what pressing it will do next.
- Pass `icon` as a Phosphor class name: `icon="ph-bold ph-plus"`. Arena draws the `<i>` and hides it; `label` is what a screen reader announces.
- Don't pass an element as the icon. A single icon is a class name in Arena, which keeps the glyph inside `check:compliance`'s reach and inside Arena's own iconography.
