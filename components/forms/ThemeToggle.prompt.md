Dark/light toggle, built on `IconButton`. Sun when dark is active, moon when light. It owns no theme state — the `arena-light` class on `<html>` is the truth and this reads it, so several toggles on one page stay in sync, as does the one in `theme.js`.

```jsx
<ThemeToggle />

{/* custom accessible name */}
<ThemeToggle label={(isDark) => (isDark ? 'Dark theme is on' : 'Light theme is on')} />
```

**Do**
- Put it where a global control belongs: the app bar or the settings row, once per app.
- Let it sit beside `theme.js` if the page loads it — the toggle delegates to it, so preference persistence keeps working.

**Don't**
- Don't mirror the theme into React state of your own and pass it down. The class on `<html>` already is the state; a second copy will drift.
- Don't swap the icons around. The icon shows the theme you are **in**, and `aria-pressed` reports the current dark state — that pairing is what makes it announce correctly.
