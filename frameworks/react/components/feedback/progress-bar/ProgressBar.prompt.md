Progress bar (H1). Gives visible status to measurable processes outside the splash: deployments, uploads, migrations. Respects `prefers-reduced-motion` in indeterminate mode.

```jsx
<ProgressBar label="Deploying build #4821" progressPercentage={64} />
<ProgressBar tone="success" progressPercentage={100} label="Published" />
<ProgressBar indeterminate tone="accent" label="Connecting…" />
```

`progressPercentage` is 0–100, clamped and rounded — it is not a form control's `value`,
which is what that name means everywhere else in this library. `showPercentage` (default
`true`) shows the number beside the label; it is drawn in determinate mode only.

**Do**
- Use *determinate* mode whenever a real percentage exists; it communicates remaining time.
- Align `tone` with the state (success when done, danger if it fails).
- Pass a `label`: it is drawn above the bar **and** is the bar's accessible name. Without one
  the bar is announced as the generic "Progress", which tells a screen-reader user nothing
  about which of the page's bars it is.

**Don't**
- Don't use `indeterminate` for processes you do know: it degrades visibility (H1).
- Don't pass markup as `label`. It is a plain string, precisely so the accessible name is the
  same words the sighted reader sees.
- Don't replace a result Toast with the bar; the bar reports progress, the Toast reports the outcome.