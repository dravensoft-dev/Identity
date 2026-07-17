Progress bar (H1). Gives visible status to measurable processes outside the splash: deployments, uploads, migrations. Respects `prefers-reduced-motion` in indeterminate mode.

```jsx
<ProgressBar label="Deploying build #4821" value={64} />
<ProgressBar tone="success" value={100} label="Published" />
<ProgressBar indeterminate tone="accent" label="Connecting…" />
```

**Do**
- Use *determinate* mode whenever a real percentage exists; it communicates remaining time.
- Align `tone` with the state (success when done, danger if it fails).

**Don't**
- Don't use `indeterminate` for processes you do know: it degrades visibility (H1).
- Don't replace a result Toast with the bar; the bar reports progress, the Toast reports the outcome.