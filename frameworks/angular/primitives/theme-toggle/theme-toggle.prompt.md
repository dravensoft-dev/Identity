Arena theme switch. It owns no state: `ThemeService` is the truth, this reads its
signal and calls its `toggle()`. Arena is dark-first, so `dark` is the default and
light is the `.arena-light` class on `<html>`.

```html
<arena-theme-toggle />
```

**Do / Don't**
- Pair it with `theme/no-fouc.html` in `index.html`. Without that snippet a light-theme
  user gets a dark flash on every load.
- Note that `aria-pressed` reports the theme you are **in**, and the icon shows the
  same thing — a sun while dark, because the sun is what you have. Do not "fix" it to
  show the destination; a toggle that reports its target state reads inverted to a
  screen reader.
- Don't add a third state. A system-preference option belongs in settings, and
  `ThemeService` already falls back to `prefers-color-scheme` when nothing is stored.
