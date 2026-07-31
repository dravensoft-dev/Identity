Arena progress bar — determinate by default, indeterminate for a wait with no percentage.
Standalone, `OnPush`, signal I/O. Styling is the sibling `ProgressBar.variants.ts` recipe; the
component carries no CSS classes of its own. The host is the full-width column: an optional head
row carrying the label and the percentage, and the track below it.

```html
<arena-progress-bar [progressPercentage]="uploaded()" label="Uploading build 482" />
<arena-progress-bar indeterminate label="Waiting for the build agent" tone="gold" />
```

`progressPercentage` is **clamped to 0–100 and rounded**, so a caller cannot report 143% or a
fraction; the same number drives `aria-valuenow` and the fill's width, which is the point —
what a sighted user sees and what a screen reader is told cannot drift apart.

**`indeterminate` is a different claim, not a styling flag.** It drops `aria-valuenow`
altogether, because ARIA expresses indeterminacy by *omitting* the value rather than by
reporting zero — zero is a determinate claim that no progress has been made. `aria-valuemin` and
`aria-valuemax` stay, because they are still true. It also hides the percentage whatever
`showPercentage` says: there is no percentage to show.

**The live region is explicit.** `role="progressbar"` carries no implicit politeness the way
`role="status"` does, so the track sets `aria-live="polite"` itself. That is the one thing
`MatProgressBar` never did — it set no `aria-live` at all — and it is why both of the delegated
binding's cases carried an exception that this primitive clears.

`label` names the bar for assistive technology and heads it visually. With none, the accessible
name falls back to `Progress`, which is honest but says nothing about what is progressing —
supply one for anything a user is waiting on.

**Do / Don't**
- **Do** reach for `indeterminate` the moment the percentage stops being knowable. A bar frozen
  at 90% is worse than one that says it is still working.
- **Do** use `tone` for what the progress *means* — `danger` for a failing rollout, `success`
  for one that finished. The track stays the neutral rail in every tone; only the fill is inked,
  because danger is outline in Arena and a progress bar is not the exception.
- **Don't** use this for a wait with no measurable end and no room for a label. That is
  `arena-spinner`.
- **Don't** put two bars in one row expecting them to read as one process. They are two live
  regions, and a screen reader will announce both.

**By hand, in real Chromium** — the sweep is an animation and happy-dom has none. Run
`bun run demos` and open
`/frameworks/angular/components/feedback/progress-bar/ProgressBar.card.html`:
- The indeterminate sweep travels left to right, continuously, and **slows** rather than stops
  under `prefers-reduced-motion` — motion that reports work in progress must keep reporting it.
- The determinate fill animates its width on `--dur-mid` when the value changes, and does not
  animate on first paint.
- Each tone inks the fill only; the track behind it stays `--color-base-300` in all five.
- The three sizes differ in track height alone; the head row does not move with them.
